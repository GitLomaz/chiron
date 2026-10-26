import { MatchingQuestion } from './MatchingQuestion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MODERATED_PIN_PATTERN = /^\d{6}$/;

type SpecialQuestion = { kind: 'true_false'; statement: string } | { kind: 'matching'; pairs: { question: string; answer: string }[] };
type MatchProgress = { matched: number[]; mistakes: number };
type QuizQuestion = {
  id: string | number;
  itemType: 'question' | 'game';
  gameType: 'coin_catch' | 'match_pairs' | 'tower_stack' | null;
  gameDurationSeconds: number | null;
  text: string;
  options: unknown;
  special?: SpecialQuestion | null;
  matchProgress?: MatchProgress | null;
  correctAnswer: string;
  answerCount: number | null;
  timerSeconds: number | null;
};

type Quiz = {
  guid: string;
  title: string;
  description: string | null;
  theme: 'standard' | 'kids' | 'christmas' | 'halloween';
  defaultTimerSeconds: number;
  questions: QuizQuestion[];
};

type TimedQuestion = { timerSeconds: number | null; timerEndsAt: string | null };

type Screen = 'welcome' | 'intro' | 'question' | 'results';

async function getQuiz(guid: string) {
  const response = await fetch(`${API_URL}/play/${guid}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(Array.isArray(body?.message) ? body.message.join(', ') : body?.message || 'We could not load that quiz.');
  }
  return response.json() as Promise<Quiz>;
}

function guidFromLocation() {
  const pathGuid = window.location.pathname.match(/^\/quiz\/([^/]+)$/)?.[1];
  return pathGuid || new URLSearchParams(window.location.search).get('quiz') || '';
}

function goToQuiz(guid: string) {
  window.history.pushState({}, '', guid ? `/quiz/${guid}` : '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function shuffle<T>(items: T[], seed: string): T[] {
  let value = [...seed].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 0) || 1;
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    value = (value * 1664525 + 1013904223) >>> 0;
    const next = value % (index + 1);
    [result[index], result[next]] = [result[next], result[index]];
  }
  return result;
}

function questionOptions(question: QuizQuestion, guid: string) {
  if (question.special?.kind === 'true_false') return ['True', 'False'];
  const values = Array.isArray(question.options) ? question.options.filter((value): value is string => typeof value === 'string') : [];
  const unique = [...new Set([question.correctAnswer, ...values])];
  const wrongAnswers = unique.filter((answer) => answer !== question.correctAnswer);
  const count = Math.min(question.answerCount ?? unique.length, wrongAnswers.length + 1);
  return shuffle([question.correctAnswer, ...shuffle(wrongAnswers, `${guid}-${question.id}-wrong`).slice(0, Math.max(0, count - 1))], `${guid}-${question.id}`);
}

function effectiveTimerSeconds(questionTimerSeconds: number | null, defaultTimerSeconds: number) {
  const value = questionTimerSeconds ?? defaultTimerSeconds;
  return value === null || value === -1 ? null : value;
}

function timerText(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes ? `${minutes}:${String(remainder).padStart(2, '0')}` : `0:${String(remainder).padStart(2, '0')}`;
}

function TimerBadge({ seconds, expired = false }: { seconds: number; expired?: boolean }) {
  return <span className={`timer-badge${expired ? ' expired' : ''}`} role="timer" aria-label={expired ? 'Time expired' : `${seconds} seconds remaining`}>{expired ? 'Time’s up' : `⏱ ${timerText(seconds)}`}</span>;
}

function useDeadlineMilliseconds(timerEndsAt: string | null) {
  const deadline = timerEndsAt ? Date.parse(timerEndsAt) : NaN;
  const [milliseconds, setMilliseconds] = useState(() => Number.isNaN(deadline) ? null : Math.max(0, deadline - Date.now()));
  useEffect(() => {
    if (Number.isNaN(deadline)) { setMilliseconds(null); return; }
    let animationFrame = 0;
    const update = () => {
      const remaining = Math.max(0, deadline - Date.now());
      setMilliseconds(remaining);
      if (remaining > 0) animationFrame = window.requestAnimationFrame(update);
    };
    update();
    return () => window.cancelAnimationFrame(animationFrame);
  }, [deadline]);
  return milliseconds;
}

function timerBorderStyle(totalSeconds: number | null, remainingMilliseconds: number | null) {
  if (totalSeconds === null || remainingMilliseconds === null) return undefined;
  return { '--timer-progress': `${Math.max(0, Math.min(100, (remainingMilliseconds / (totalSeconds * 1000)) * 100))}%` } as CSSProperties;
}

function AdvanceTimer() {
  return <svg className="advance-timer-ring" aria-hidden="true"><rect x="1.5" y="1.5" rx="11" pathLength="100" /></svg>;
}

function RunDeadline({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const seconds = Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const label = days ? `${days}d ${hours}h ${minutes}m` : hours ? `${hours}h ${minutes}m` : `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  return <div className="run-deadline" role="timer" aria-label={`Time left in this test: ${label}`}>Time left: {label}</div>;
}

function QuizCodeForm({ initialCode = '', onSubmit }: { initialCode?: string; onSubmit: (guid: string) => void }) {
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = code.trim();
    if (!UUID_PATTERN.test(value)) {
      setError('Enter the full quiz ID from your link.');
      return;
    }
    onSubmit(value.toLowerCase());
  }

  return <form className="join-form" onSubmit={submit} noValidate>
    <label htmlFor="quiz-code">Quiz ID</label>
    <div className="join-row">
      <input id="quiz-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Paste your quiz ID" autoComplete="off" spellCheck="false" aria-describedby={error ? 'quiz-code-error' : undefined} />
      <button className="primary-button" type="submit">Join quiz</button>
    </div>
    {error ? <p className="form-error" id="quiz-code-error">{error}</p> : <p className="input-help">Paste the ID from the quiz link your teacher shared.</p>}
  </form>;
}

function Welcome({ onModerated }: { onModerated: () => void }) {
  return <main className="page welcome-page">
    <div className="brand"><span className="brand-mark">Q</span> Quizboard</div>
    <section className="welcome-card">
      <p className="eyebrow">READY WHEN YOU ARE</p>
      <h1>Let’s take a quiz.</h1>
      <p className="lede">Open your quiz link or paste its quiz ID below to get started.</p>
      <QuizCodeForm onSubmit={goToQuiz} />
      <button className="text-button facilitator-entry" onClick={onModerated}>Join a live test</button>
    </section>
    <p className="footer-note">Your answers stay on this device for this quiz.</p>
  </main>;
}

type ModeratedAnswerResult = { answer: string; correctAnswer: string; isCorrect: boolean };
type ModeratedScore = { correct: number; answered: number };
type ModeratedQuestion = TimedQuestion & { special?: SpecialQuestion | null; matchProgress?: MatchProgress | null; id: string; text: string; itemType: 'question' | 'game'; gameType: 'coin_catch' | 'match_pairs' | 'tower_stack' | null; options: string[]; number: number; total?: number; answered?: boolean; timedOut?: boolean; gameScore?: number | null; result?: ModeratedAnswerResult | null };
type MatchingState = { credits: number; cards: { symbol: string | null; matched: boolean }[] };
type ModeratedStudentState = { endless: boolean; pin: string; title: string; description: string | null; theme: 'standard' | 'kids' | 'christmas' | 'halloween'; mode: 'classic' | 'facilitated' | 'matching'; matching: MatchingState | null; betweenQuestions: boolean; phase: 'lobby' | 'question' | 'complete'; endedByTeacher: boolean; expired: boolean; endsAt: string | null; removed: boolean; participant: { id: string; name: string } | null; score: ModeratedScore | null; currentQuestion: ModeratedQuestion | null };
type FacilitatorState = { endless: boolean; sessionId: string; pin: string; title: string; description: string | null; mode: 'classic' | 'facilitated' | 'matching'; currentRound: number; phase: 'lobby' | 'question' | 'complete'; endedByTeacher: boolean; expired: boolean; endsAt: string | null; durationSeconds: number; lobbyLocked: boolean; questionCount: number; completedCount: number; participants: { id: string; name: string; completed: boolean; completedItems: number; currentItemType: 'question' | 'game' | null; currentAnswered: boolean; score: ModeratedScore }[]; gameLeaderboard: { id: string; name: string; score: number }[] };

async function moderatedRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/moderated-sessions${path}`, { headers: { 'Content-Type': 'application/json', ...options?.headers }, ...options });
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(Array.isArray(body?.message) ? body.message.join(', ') : body?.message || 'Something went wrong'); }
  return response.json() as Promise<T>;
}

async function homeworkRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/homework-sessions${path}`, { headers: { 'Content-Type': 'application/json', ...options?.headers }, ...options });
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(Array.isArray(body?.message) ? body.message.join(', ') : body?.message || 'Something went wrong'); }
  return response.json() as Promise<T>;
}

function moderatedPinFromLocation() { return window.location.pathname.match(/^\/moderated\/(\d{6})$/)?.[1] ?? ''; }
function facilitatorFromLocation() { return window.location.pathname.match(/^\/facilitate\/([^/]+)$/)?.[1] ?? ''; }
function projectorFromLocation() { return window.location.pathname.match(/^\/projector\/([^/]+)$/)?.[1] ?? ''; }
function homeworkFromLocation() { return window.location.pathname.match(/^\/homework\/([^/]+)$/)?.[1] ?? ''; }
function homeworkTeacherFromLocation() { return window.location.pathname.match(/^\/homework-teacher\/([^/]+)$/)?.[1] ?? ''; }
function goToModeratedTest(pin = '') { window.history.pushState({}, '', pin ? `/moderated/${pin}` : '/moderated'); window.dispatchEvent(new PopStateEvent('popstate')); }
function participantStorageKey(pin: string) { return `quizboard-moderated-${pin}`; }
function participantClientStorageKey(pin: string) { return `quizboard-moderated-client-${pin}`; }
function participantClientId(pin: string) {
  const key = participantClientStorageKey(pin);
  const existing = localStorage.getItem(key);
  if (existing && UUID_PATTERN.test(existing)) return existing;
  const clientId = crypto.randomUUID();
  localStorage.setItem(key, clientId);
  return clientId;
}
function moderatedStudentUrl(pin: string) { return `${window.location.origin}/moderated/${pin}`; }
function projectorUrl(sessionId: string, token: string) { return `${window.location.origin}/projector/${sessionId}?token=${encodeURIComponent(token)}`; }
function homeworkStorageKey(sessionId: string) { return `quizboard-homework-${sessionId}`; }
function homeworkStudentUrl(sessionId: string) { return `${window.location.origin}/homework/${sessionId}`; }

function ModeratedCoinCatch({ pin, participantId, question, theme, facilitated }: { pin: string; participantId: string; question: ModeratedQuestion; theme: 'standard' | 'kids' | 'christmas' | 'halloween'; facilitated: boolean }) {
  const [things, setThings] = useState<FallingThing[]>([]); const [score, setScore] = useState(question.gameScore ?? 0);
  useEffect(() => { const spawn = window.setInterval(() => { const kind: FallingThing['kind'] = Math.random() < .7 ? 'coin' : 'veggie'; const vegetables = ['🥕', '🥦', '🌽']; setThings((current) => [...current, { id: Date.now() + Math.random(), kind, left: 5 + Math.random() * 82, duration: 3 + Math.random() * 1.6, emoji: kind === 'coin' ? '🪙' : vegetables[Math.floor(Math.random() * vegetables.length)] }].slice(-14)); }, 610); return () => window.clearInterval(spawn); }, []);
  async function catchThing(thing: FallingThing) { setThings((current) => current.filter((item) => item.id !== thing.id)); const nextScore = thing.kind === 'coin' ? score + 1 : Math.max(0, score - 1); setScore(nextScore); try { await moderatedRequest(`/pin/${pin}/games/scores`, { method: 'POST', body: JSON.stringify({ participantId, questionId: question.id, score: nextScore }) }); } catch { /* The next state refresh will surface any session error. */ } }
return <main className={`page quiz-page moderated-quiz-page theme-${theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-header-meta"><span className="question-label">LIVE GAME</span></span></header><div className="progress"><span style={{ width: `${(question.number / (question.total ?? 1)) * 100}%` }} /></div><section className="game-card moderated-game-card"><div className="game-heading"><div><p className="eyebrow">LIVE COIN CATCH</p><h1>{question.text}</h1><p>Catch coins and avoid veggies. Your score is live on the leaderboard.</p></div><div className="game-stats"><span>Score <strong>{score}</strong></span></div></div><div className="coin-catch-board">{things.map((thing) => <button key={thing.id} className={`falling-thing ${thing.kind}`} style={{ left: `${thing.left}%`, animationDuration: `${thing.duration}s` }} onClick={() => void catchThing(thing)} aria-label={thing.kind === 'coin' ? 'Catch coin' : 'Avoid vegetable'}>{thing.emoji}</button>)}</div><p className="game-tip">{facilitated ? 'Your facilitator will release the next round.' : 'The next round starts automatically when time is up.'}</p></section></main>;
}

function RemovedFromLiveTest({ theme, title }: { theme: 'standard' | 'kids' | 'christmas' | 'halloween'; title: string }) {
  return <main className={`page quiz-page moderated-quiz-page theme-${theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header><section className="intro-card removal-card"><p className="eyebrow">LIVE TEST</p><h1>You’ve been removed.</h1><p className="lede">You no longer have access to <strong>{title}</strong>. Please speak with your facilitator if you think this was a mistake.</p></section></main>;
}

function ModeratedStudent({ pin }: { pin: string }) {
  const [participantId, setParticipantId] = useState(() => localStorage.getItem(participantStorageKey(pin)) ?? '');
  const [clientId] = useState(() => participantClientId(pin));
  const [state, setState] = useState<ModeratedStudentState | null>(null);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [playingMatching, setPlayingMatching] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const load = useCallback(async () => { try { const query = new URLSearchParams({ clientId }); if (participantId) query.set('participantId', participantId); const next = await moderatedRequest<ModeratedStudentState>(`/pin/${pin}?${query.toString()}`); setState((current) => current?.pin === next.pin && (current.endedByTeacher || current.expired) ? current : next); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load this test'); } }, [clientId, pin, participantId]);
  const remainingMilliseconds = useDeadlineMilliseconds(state?.currentQuestion?.timerEndsAt ?? null);
  const remainingSeconds = remainingMilliseconds === null ? null : Math.ceil(remainingMilliseconds / 1000);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 2000); return () => window.clearInterval(timer); }, [load]);
  useEffect(() => {
    const timerEndsAt = state?.currentQuestion?.timerEndsAt;
    if (!timerEndsAt) return;
    const timeout = window.setTimeout(() => void load(), Math.max(0, Date.parse(timerEndsAt) - Date.now()) + 50);
    return () => window.clearTimeout(timeout);
  }, [load, state?.currentQuestion?.timerEndsAt]);
  useEffect(() => { setSelected(''); }, [state?.currentQuestion?.id]);
  useEffect(() => {
    if (state?.mode !== 'matching' || !state.betweenQuestions || !state.currentQuestion?.result || playingMatching || submitting || state.endedByTeacher || state.removed) return;
    const timer = window.setTimeout(() => void nextMatchingQuestion(), 5000);
    return () => window.clearTimeout(timer);
  }, [state?.mode, state?.betweenQuestions, state?.currentQuestion?.id, state?.currentQuestion?.result?.answer, state?.endedByTeacher, state?.removed, playingMatching, submitting, participantId, pin]);
  async function join(event: FormEvent) { event.preventDefault(); setJoining(true); try { const result = await moderatedRequest<{ participantId: string }>(`/pin/${pin}/participants`, { method: 'POST', body: JSON.stringify({ name, clientId }) }); localStorage.setItem(participantStorageKey(pin), result.participantId); setParticipantId(result.participantId); } catch (err) { setError(err instanceof Error ? err.message : 'Could not join'); } finally { setJoining(false); } }
  async function submit(answer = selected) { if (!state?.currentQuestion || !answer || submitting) return; setSelected(answer); setSubmitting(true); try { await moderatedRequest(`/pin/${pin}/answers`, { method: 'POST', body: JSON.stringify({ participantId, questionId: state.currentQuestion.id, answer }) }); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not submit your answer'); } finally { setSubmitting(false); } }
  async function flip(card: number) { setFlipping(true); try { const matching = await moderatedRequest<MatchingState>(`/pin/${pin}/matching/flip`, { method: 'POST', body: JSON.stringify({ participantId, card }) }); setState((current) => current ? { ...current, matching } : current); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Could not flip card'); } finally { setFlipping(false); } }
  async function nextMatchingQuestion() { setSubmitting(true); try { await moderatedRequest(`/pin/${pin}/matching/next`, { method: 'POST', body: JSON.stringify({ participantId }) }); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not start the next question'); } finally { setSubmitting(false); } }
  function render() {
  if (error && !state) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><section className="error-card"><p className="eyebrow">TEST UNAVAILABLE</p><h1>We couldn’t open this test.</h1><p>{error}</p></section></main>;
  if (!state) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><div className="loader" /></main>;
  if (state.removed) return <RemovedFromLiveTest theme={state.theme} title={state.title} />;
  if (state.endedByTeacher) return <QuizEnded theme={state.theme} title={state.title} score={state.score} />;
  if (state.expired) return <QuizEnded theme={state.theme} title={state.title} score={state.score} expired />;
  if (!participantId || !state.participant) return <main className={`page quiz-page moderated-quiz-page theme-${state.theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header><section className="intro-card moderated-join-card"><p className="eyebrow">LIVE TEST</p><h1>{state.title}</h1><p className="lede">Enter your name so your facilitator knows you’re here.</p><form className="join-form moderated-join-form" onSubmit={join}><label>Your name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" maxLength={100} required /></label><button className="primary-button" disabled={joining}>{joining ? 'Joining…' : 'Join test'}</button></form>{error && <p className="form-error">{error}</p>}</section></main>;
  if (state.phase === 'lobby') return <WaitingScreen theme={state.theme} title={state.title} name={state.participant.name} copy="You’re checked in. Your facilitator will start the first question soon." />;
  if (playingMatching && state.matching) {
    const matching = state.matching;
    const revealedCount = matching.cards.filter((card) => card.symbol !== null && !card.matched).length;
    const matchedPairs = matching.cards.filter((card) => card.matched).length / 2;
    return <main className={`page quiz-page moderated-quiz-page theme-${state.theme}`}>
      <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">MATCHING BREAK</span></header>
      <section className="game-card match-game-card matching-credit-game">
        <div className="game-heading"><div><p className="eyebrow">MEMORY GAME</p><h1>Match Pairs</h1><p>Flip two cards to find a pair. A wrong match costs one credit.</p></div><div className="game-stats"><span className="matching-credit-stat">Credits <strong>{matching.credits}</strong></span><span>Pairs <strong>{matchedPairs} / {matching.cards.length / 2}</strong></span></div></div>
        <MatchBoard cards={matching.cards.map((card, id) => ({ ...card, id, disabled: flipping || card.matched || (card.symbol !== null && revealedCount < 2) || matching.credits < 1 }))} onFlip={(id) => void flip(id)} />
        <p className="game-tip" aria-live="polite">{matchedPairs * 2 === matching.cards.length ? 'You found all the pairs!' : matching.credits === 0 ? 'You are out of credits. Answer more questions to earn another.' : 'Remember where each fruit is, then match every pair.'}</p>
        {error && <p className="form-error">{error}</p>}
        <div className="matching-game-actions"><button className="matching-secondary-button" onClick={() => setPlayingMatching(false)}>← Back to Questions</button></div>
      </section>
    </main>;
  }
  if (state.phase === 'complete') return <WaitingScreen theme={state.theme} title={state.title} name={state.participant.name} copy="The test is complete. Thanks for taking part." score={state.score} scoreLabel="Final score" complete />;
  const question = state.currentQuestion;
  if (!question) return <WaitingScreen theme={state.theme} title={state.title} name={state.participant.name} copy="Waiting for the next question…" />;
  if (state.betweenQuestions && state.matching) {
    const allMatched = state.matching.cards.every((card) => card.matched);
    const canPlay = state.matching.credits > 0 && !allMatched;
    return <main className={`page quiz-page moderated-quiz-page theme-${state.theme}`}>
      <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">MATCHING BREAK</span></header>
      <section className="intro-card waiting-card matching-break-card">
        <p className="eyebrow">QUESTION {question.number}{!state.endless && <> OF {question.total}</>}</p>
        <h1>{question.result ? question.result.isCorrect ? 'Correct!' : 'Not quite.' : 'Time is up.'}</h1>
        {question.result && !question.result.isCorrect && <p className="matching-answer">The correct answer was <strong>{question.result.correctAnswer}</strong>.</p>}
        <div className="matching-credit-summary"><span>YOUR MATCHING CREDITS</span><strong>{state.matching.credits}</strong><small>{allMatched ? 'All pairs found!' : canPlay ? 'Ready for a matching break' : 'Answer more questions to earn credits'}</small></div>
        <div className="matching-actions">
          {canPlay && <button className="matching-secondary-button" onClick={() => setPlayingMatching(true)}>Play Match Pairs</button>}
          <button className={`primary-button${question.result && !submitting ? ' advance-timer' : ''}`} disabled={submitting} onClick={() => void nextMatchingQuestion()}>{question.result && !submitting && <AdvanceTimer />}{submitting ? 'Loading…' : !state.endless && question.number === question.total ? 'Finish test' : 'Next question'} <span aria-hidden="true">→</span></button>
        </div>
        {error && <p className="form-error">{error}</p>}
      </section>
    </main>;
  }
if (question.itemType === 'game') return question.timedOut ? <WaitingScreen theme={state.theme} title={state.title} name={state.participant.name} copy="Time is up for the game. Wait for the next round." /> : question.gameType === 'match_pairs' ? <MatchPairsGame key={question.id} title={question.text} durationSeconds={question.timerSeconds ?? 20} onComplete={() => void load()} /> : question.gameType === 'tower_stack' ? <TowerStackGame key={question.id} title={question.text} durationSeconds={question.timerSeconds ?? 20} onComplete={() => void load()} /> : <ModeratedCoinCatch key={question.id} pin={pin} participantId={participantId} question={question} theme={state.theme} facilitated={state.mode === 'facilitated'} />;
  if (question.answered || question.timedOut) return <WaitingScreen theme={state.theme} title={state.title} name={state.participant.name} copy={state.mode === 'facilitated' ? 'Wait for your facilitator to release the next round.' : question.timedOut ? 'Time is up. The next round will begin automatically.' : 'Your answer is recorded. Your next question is coming up.'} result={question.result} score={state.score} />;
  const timerStyle = timerBorderStyle(question.timerSeconds, remainingMilliseconds);
  return <main className={`page quiz-page moderated-quiz-page theme-${state.theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-header-meta"><span className="question-label">Question {question.number}{!state.endless && <> of {question.total}</>}</span>{remainingSeconds !== null && <TimerBadge seconds={remainingSeconds} expired={remainingSeconds === 0} />}</span></header>{!state.endless && <div className="progress"><span style={{ width: `${(question.number / (question.total ?? 1)) * 100}%` }} /></div>}<section className={`question-card${question.special?.kind === 'matching' ? ' matching-question-card' : ''}${timerStyle ? ' timed-question' : ''}`} style={timerStyle}><p className="eyebrow">QUESTION {String(question.number).padStart(2, '0')}</p><h1>{question.text}</h1>{question.special?.kind === 'true_false' && <p className="lede">{question.special.statement}</p>}{question.special?.kind === 'matching' ? <MatchingQuestion key={question.id} pairs={question.special.pairs} progress={question.matchProgress ?? null} disabled={submitting} onMatch={(left, right) => void submit(`match:${left}:${right}`)} /> : <div className="options" role="radiogroup">{question.options.map((option, index) => <button key={option} className={`option ${selected === option ? 'selected' : ''}`} role="radio" aria-checked={selected === option} disabled={submitting} onClick={() => state.mode === 'facilitated' ? setSelected(option) : void submit(option)}><span className="option-key">{String.fromCharCode(65 + index)}</span><span>{option}</span></button>)}</div>}{error && <p className="form-error">{error}</p>}{state.mode === 'facilitated' && question.special?.kind !== 'matching' && <div className="question-actions"><span /><button className="primary-button" disabled={!selected || submitting} onClick={() => void submit()}>{submitting ? 'Submitting…' : 'Submit answer'}</button></div>}</section></main>;
  }
  return <>{state?.phase === 'question' && !state.removed && !state.endedByTeacher && state.endsAt && <RunDeadline endsAt={state.endsAt} />}{render()}</>;
}

function QuizEnded({ theme, title, score, expired = false }: { theme: 'standard' | 'kids' | 'christmas' | 'halloween'; title: string; score?: ModeratedScore | null; expired?: boolean }) {
  return <main className={`page quiz-page moderated-quiz-page theme-${theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header><section className="intro-card waiting-card"><p className="eyebrow">{title}</p><h1>The quiz has ended.</h1><p className="lede">{expired ? 'Time is up for this quiz.' : 'Your teacher has ended this quiz.'}</p>{score && <div className="score-so-far"><span>Your score</span><strong>{score.correct} / {score.answered}</strong><small>correct answers recorded</small></div>}</section></main>;
}

function WaitingScreen({ theme, title, name, copy, result, score, scoreLabel = 'Score so far', complete = false }: { theme: 'standard' | 'kids' | 'christmas' | 'halloween'; title: string; name: string; copy: string; result?: ModeratedAnswerResult | null; score?: ModeratedScore | null; scoreLabel?: string; complete?: boolean }) { return <main className={`page quiz-page moderated-quiz-page theme-${theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header><section className="intro-card waiting-card"><p className="eyebrow">{title}</p><h1>{complete ? `All done, ${name}!` : result ? result.isCorrect ? `Correct, ${name}!` : `Not quite, ${name}.` : `You’re in, ${name}.`}</h1>{result && <div className={`answer-summary ${result.isCorrect ? 'correct' : 'incorrect'}`}><strong>{result.isCorrect ? 'You got it right.' : 'Here’s the answer.'}</strong><span>Your answer: {result.answer}</span>{!result.isCorrect && <span>Correct answer: {result.correctAnswer}</span>}</div>}<p className="lede">{copy}</p>{score && (complete || score.answered > 0) && <div className="score-so-far"><span>{scoreLabel}</span><strong>{score.correct} / {score.answered}</strong><small>correct answer{score.answered === 1 ? '' : 's'}</small></div>}{!complete && <div className="loader small-loader" aria-label="Waiting" />}</section></main>; }

function ModeratedPinEntry() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    const value = pin.trim();
    if (!MODERATED_PIN_PATTERN.test(value)) { setError('Enter the 6-digit PIN from your facilitator.'); return; }
    goToModeratedTest(value);
  }
  return <main className="page welcome-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><section className="welcome-card"><p className="eyebrow">LIVE TEST</p><h1>Join your live test.</h1><p className="lede">Enter the 6-digit PIN shared by your facilitator.</p><form className="join-form" onSubmit={submit} noValidate><label htmlFor="moderated-pin">Test PIN</label><div className="join-row"><input id="moderated-pin" value={pin} onChange={(event) => { setPin(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" maxLength={6} autoFocus aria-describedby={error ? 'moderated-pin-error' : undefined} /><button className="primary-button" type="submit">Join test</button></div>{error && <p className="form-error" id="moderated-pin-error">{error}</p>}</form></section></main>;
}

function Facilitator({ sessionId, token, projector = false }: { sessionId: string; token: string; projector?: boolean }) {
  const [state, setState] = useState<FacilitatorState | null>(null);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);
  const [updatingLobby, setUpdatingLobby] = useState(false);
  const [removingParticipantId, setRemovingParticipantId] = useState<string | null>(null);
  const load = useCallback(async () => { try { const next = await moderatedRequest<FacilitatorState>(`/${sessionId}/facilitator?token=${encodeURIComponent(token)}`); setState((current) => current?.sessionId === next.sessionId && ((current.endedByTeacher && !next.endedByTeacher) || (current.expired && !next.expired)) ? current : next); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load facilitator controls'); } }, [sessionId, token]);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 2000); return () => window.clearInterval(timer); }, [load]);
  async function start() { setActing(true); setError(''); try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/start`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not start the test'); } finally { setActing(false); } }
  async function next() { setActing(true); setError(''); try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/next`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not release the next round'); } finally { setActing(false); } }
  async function end() { if (!window.confirm('End this quiz for everyone? Students will no longer be able to answer or join.')) return; setActing(true); setError(''); try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/end`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not end the quiz'); } finally { setActing(false); } }
  async function updateLobbyLock(lobbyLocked: boolean) { setUpdatingLobby(true); setError(''); try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/lobby`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token, lobbyLocked }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not update the lobby'); } finally { setUpdatingLobby(false); } }
  async function removeParticipant(participantId: string) { setRemovingParticipantId(participantId); setError(''); try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/participants/${participantId}/remove`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not remove this participant'); } finally { setRemovingParticipantId(null); } }
  if (!state) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div>{error ? <section className="error-card"><h1>Facilitator access unavailable.</h1><p>{error}</p></section> : <div className="loader" />}</main>;
  if (projector) return <main className="projector-scoreboard" aria-live="polite"><ol>{(state.gameLeaderboard ?? []).map((player, index) => <li key={player.id} className={index === 0 && player.score > 0 ? 'leader' : ''}><span>{index + 1}</span><strong>{player.name}</strong><em>{player.score}</em></li>)}</ol></main>;
  return <LiveFacilitatorView state={state} sessionId={sessionId} token={token} acting={acting} updatingLobby={updatingLobby} removingParticipantId={removingParticipantId} error={error} onStart={start} onNext={next} onEnd={end} onLobbyLock={updateLobbyLock} onRemoveParticipant={removeParticipant} />;
}

function LiveFacilitatorView({ state, sessionId, token, acting, updatingLobby, removingParticipantId, error, onStart, onNext, onEnd, onLobbyLock, onRemoveParticipant }: { state: FacilitatorState; sessionId: string; token: string; acting: boolean; updatingLobby: boolean; removingParticipantId: string | null; error: string; onStart: () => Promise<void>; onNext: () => Promise<void>; onEnd: () => Promise<void>; onLobbyLock: (locked: boolean) => Promise<void>; onRemoveParticipant: (participantId: string) => Promise<void> }) {
  const [studentLinkCopied, setStudentLinkCopied] = useState(false);
  const studentUrl = moderatedStudentUrl(state.pin);
  const scoreDisplayUrl = projectorUrl(sessionId, token);
  async function copyStudentLink() { try { await navigator.clipboard.writeText(studentUrl); setStudentLinkCopied(true); window.setTimeout(() => setStudentLinkCopied(false), 2000); } catch { /* Clipboard access is optional. */ } }
  return <main className="page facilitator-page">
    <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">LIVE TEST CONTROLS</span></header>
    <section className="facilitator-grid">
      <div className="question-card control-card">
        <p className="eyebrow">{state.phase === 'lobby' ? state.lobbyLocked ? 'LOBBY LOCKED' : 'READY TO START' : state.phase === 'complete' ? 'TEST COMPLETE' : 'TEST IN PROGRESS'}</p>
        <h1>{state.title}</h1>
        <p>{state.endsAt ? `${state.expired ? 'Time expired' : 'Ends'}: ${new Date(state.endsAt).toLocaleString()}` : `Duration: ${state.durationSeconds / 60} minutes after starting`}</p>
        <p className="lede">{state.phase === 'lobby' ? state.lobbyLocked ? 'The lobby is locked. Current participants can stay, but no one new can join.' : 'Participants can join now. Start when you are ready.' : state.phase === 'complete' ? 'The test has finished.' : state.mode === 'facilitated' ? `Round ${state.currentRound} of ${state.questionCount}. Release the next round when you are ready.` : 'Students move through questions and games at their own pace.'}</p>
        {state.phase === 'lobby' ? <button className="primary-button" disabled={acting} onClick={() => void onStart()}>{acting ? 'Starting…' : 'Start test'}</button> : <div className="score-so-far"><span>Completed</span><strong>{state.completedCount} / {state.participants.length}</strong><small>{state.endless ? 'Endless questions' : `${state.questionCount} quiz items per participant`}</small></div>}
        {state.mode === 'facilitated' && state.phase === 'question' && <button className="primary-button" disabled={acting} onClick={() => void onNext()}>{acting ? 'Releasing…' : state.currentRound >= state.questionCount ? 'Finish test' : 'Release next round'}</button>}
        {state.phase !== 'complete' && <div className="end-quiz-control"><button className="end-quiz-button" disabled={acting} onClick={() => void onEnd()}>End quiz</button><small>Stop the quiz for all participants.</small></div>}
        {state.gameLeaderboard.length > 0 && <div className="live-game-leaderboard"><div><span>TOTAL GAME COINS</span></div><ol>{state.gameLeaderboard.slice(0, 5).map((player, index) => <li key={player.id} className={index === 0 && player.score > 0 ? 'leader' : ''}><b>{index + 1}</b><strong>{player.name}</strong><em>{player.score}</em></li>)}</ol></div>}
        <label className="auto-advance-control lobby-lock-control"><span><strong>Lock the lobby</strong><small>{state.lobbyLocked ? 'New participants cannot join.' : 'Allow participants to join with the PIN.'}</small></span><input type="checkbox" role="switch" checked={state.lobbyLocked} disabled={updatingLobby || state.phase === 'complete'} onChange={(event) => void onLobbyLock(event.target.checked)} /><i aria-hidden="true" /></label>
        {error && <p className="form-error">{error}</p>}
      </div>
      <aside className="participant-panel homework-participant-panel">
        <div className="student-access"><p className="eyebrow">STUDENT ACCESS</p><strong className="join-pin">{state.pin}</strong><p>{state.lobbyLocked ? 'Lobby locked. Existing participants remain connected.' : 'Share this PIN, or send the student link.'}</p><a href={studentUrl} target="_blank" rel="noreferrer">{studentUrl}</a><button className="text-button" onClick={() => void copyStudentLink()}>{studentLinkCopied ? 'Student link copied' : 'Copy student link'}</button><a className="projector-link" href={scoreDisplayUrl} target="_blank" rel="noreferrer">Open projector scores</a></div>
        <div><p className="eyebrow">PARTICIPANTS</p><h2>{state.participants.length} joined <span>·</span> {state.completedCount} completed</h2></div>
{state.participants.length ? <ul>{state.participants.map((participant) => <li className="live-participant" key={participant.id}><span className="homework-participant-progress"><strong>{participant.name}</strong><small>{participant.completed ? 'Completed' : state.phase === 'complete' ? 'Ended before completion' : state.phase === 'lobby' ? 'Waiting to start' : `${participant.completedItems} / ${state.questionCount} items · ${participant.currentItemType === 'game' ? 'Playing a game' : participant.currentAnswered ? 'Answered' : 'Working'}`}</small></span><span className="participant-actions"><span className="homework-participant-score"><strong>{participant.score.correct} / {participant.score.answered}</strong><small>correct</small></span><button className="boot-participant" disabled={removingParticipantId === participant.id} onClick={() => void onRemoveParticipant(participant.id)}>{removingParticipantId === participant.id ? 'Removing...' : 'Remove'}</button></span></li>)}</ul> : <p>No one has joined yet.</p>}
      </aside>
    </section>
  </main>;
}

type HomeworkStudentState = {
  sessionId: string;
  title: string;
  description: string | null;
  theme: 'standard' | 'kids' | 'christmas' | 'halloween';
  ended: boolean;
  expired: boolean;
  endsAt: string;
  questions: QuizQuestion[];
  participant: { id: string; name: string; completed: boolean; score: { correct: number; answered: number; total: number } } | null;
};
type HomeworkTeacherState = {
  sessionId: string;
  title: string;
  description: string | null;
  ended: boolean;
  expired: boolean;
  endsAt: string;
  questionCount: number;
  itemCount: number;
  participants: { id: string; name: string; completed: boolean; completedAt: string | null; completedItems: number; score: { correct: number; answered: number; total: number } }[];
};

function HomeworkStudent({ sessionId }: { sessionId: string }) {
  const playerStarted = useRef(false);
  const [playerFinished, setPlayerFinished] = useState(false);
  const [participantId, setParticipantId] = useState(() => localStorage.getItem(homeworkStorageKey(sessionId)) ?? '');
  const [state, setState] = useState<HomeworkStudentState | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const load = useCallback(async () => {
    try { const next = await homeworkRequest<HomeworkStudentState>(`/${sessionId}${participantId ? `?participantId=${participantId}` : ''}`); setState((current) => current?.sessionId === next.sessionId && (current.ended || (!next.ended && current.participant?.id === next.participant?.id)) ? current : next); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load this homework'); }
  }, [participantId, sessionId]);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 2000); return () => window.clearInterval(timer); }, [load]);

  async function join(event: FormEvent) {
    event.preventDefault(); setJoining(true);
    try {
      const result = await homeworkRequest<{ participantId: string }>(`/${sessionId}/participants`, { method: 'POST', body: JSON.stringify({ name }) });
      localStorage.setItem(homeworkStorageKey(sessionId), result.participantId);
      setParticipantId(result.participantId);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not begin homework'); }
    finally { setJoining(false); }
  }

  if (error && !state) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><section className="error-card"><p className="eyebrow">HOMEWORK UNAVAILABLE</p><h1>We couldn’t open this homework.</h1><p>{error}</p></section></main>;
  if (!state) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><div className="loader" /></main>;
  if (state.ended) return <QuizEnded theme={state.theme} title={state.title} score={state.participant?.score} expired={state.expired} />;
  if (!participantId || !state.participant) return <main className={`page quiz-page theme-${state.theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header><section className="intro-card moderated-join-card"><p className="eyebrow">HOMEWORK</p><p>Closes: {new Date(state.endsAt).toLocaleString()}</p><h1>{state.title}</h1><p className="lede">Enter your name so your teacher can see your completed work and score.</p><form className="join-form moderated-join-form" onSubmit={join}><label>Your name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" maxLength={100} required /></label><button className="primary-button" disabled={joining}>{joining ? 'Starting…' : 'Start homework'}</button></form>{error && <p className="form-error">{error}</p>}</section></main>;
  if (state.participant.completed && !playerStarted.current) return <main className={`page quiz-page theme-${state.theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header><section className="results-card"><p className="eyebrow">HOMEWORK COMPLETE</p><h1>Nice work, {state.participant.name}!</h1><p className="score-copy">Your teacher has your score: <strong>{state.participant.score.correct} of {state.participant.score.total}</strong>.</p></section></main>;
  playerStarted.current = true;
  const quiz: Quiz = { guid: sessionId, title: state.title, description: state.description, theme: state.theme, defaultTimerSeconds: -1, questions: state.questions };
  const submitAnswer = (questionId: string, answer: string) => homeworkRequest(`/${sessionId}/answers`, { method: 'POST', body: JSON.stringify({ participantId, questionId, answer }) });
  const completeItem = (questionId: string) => homeworkRequest(`/${sessionId}/items/complete`, { method: 'POST', body: JSON.stringify({ participantId, questionId }) });
  return <div className={`student-app theme-${state.theme}`}>{!playerFinished && <RunDeadline endsAt={state.endsAt} />}<Player key={participantId} quiz={quiz} onSubmitAnswer={submitAnswer} onCompleteItem={completeItem} onFinished={() => setPlayerFinished(true)} allowRestart={false} /></div>;
}

function HomeworkTeacher({ sessionId, token }: { sessionId: string; token: string }) {
  const [state, setState] = useState<HomeworkTeacherState | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [ending, setEnding] = useState(false);
  const load = useCallback(async () => {
    try { const next = await homeworkRequest<HomeworkTeacherState>(`/${sessionId}/teacher?token=${encodeURIComponent(token)}`); setState((current) => current?.sessionId === next.sessionId && current.ended && !next.ended ? current : next); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load homework results'); }
  }, [sessionId, token]);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 2000); return () => window.clearInterval(timer); }, [load]);
  async function copyStudentLink() { try { await navigator.clipboard.writeText(homeworkStudentUrl(sessionId)); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { setError('Could not copy the student link.'); } }
  async function end() { if (!window.confirm('End this homework for everyone? Students will no longer be able to answer or join.')) return; setEnding(true); setError(''); try { setState(await homeworkRequest<HomeworkTeacherState>(`/${sessionId}/end`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not end the homework'); } finally { setEnding(false); } }
  if (!state) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div>{error ? <section className="error-card"><h1>Teacher access unavailable.</h1><p>{error}</p></section> : <div className="loader" />}</main>;
  const completed = state.participants.filter((participant) => participant.completed).length;
  const studentUrl = homeworkStudentUrl(sessionId);
  return <main className="page facilitator-page"><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">HOMEWORK RESULTS</span></header><section className="facilitator-grid"><div className="question-card control-card"><p className="eyebrow">{state.ended ? 'HOMEWORK ENDED' : 'HOMEWORK RUN'}</p><h1>{state.title}</h1><p>{state.expired ? 'Time expired' : 'Closes'}: {new Date(state.endsAt).toLocaleString()}</p><p className="lede">{state.ended ? 'This homework has ended. Recorded work remains available below.' : 'Students work independently. This page updates as they join and complete the assignment.'}</p><div className="score-so-far"><span>Completed</span><strong>{completed} / {state.participants.length}</strong><small>{state.questionCount} scored question{state.questionCount === 1 ? '' : 's'} per attempt</small></div>{!state.ended && <div className="end-quiz-control"><button className="end-quiz-button" disabled={ending} onClick={() => void end()}>{ending ? 'Ending…' : 'End quiz'}</button><small>Stop homework for all participants.</small></div>}{error && <p className="form-error">{error}</p>}</div><aside className="participant-panel homework-participant-panel"><div className="student-access"><p className="eyebrow">STUDENT ACCESS</p><p>{state.ended ? 'This homework is closed to students.' : 'Share this homework link with students.'}</p><a href={studentUrl} target="_blank" rel="noreferrer">{studentUrl}</a><button className="text-button" onClick={() => void copyStudentLink()}>{copied ? 'Student link copied' : 'Copy student link'}</button></div><div><p className="eyebrow">PARTICIPANTS</p><h2>{state.participants.length} started <span>·</span> {completed} completed</h2></div>{state.participants.length ? <ul>{state.participants.map((participant) => <li className="homework-participant" key={participant.id}><span className="homework-participant-progress"><strong>{participant.name}</strong><small>{participant.completed ? 'Completed' : `${participant.completedItems} / ${state.itemCount} items`}</small></span><span className="homework-participant-score"><strong>{participant.score.correct} / {participant.score.total}</strong><small>{participant.completed ? 'Final score' : `${participant.score.answered} answered`}</small></span></li>)}</ul> : <p>No one has started yet.</p>}</aside></section></main>;
}

function Results({ quiz, answers, onRestart, onLeave }: { quiz: Quiz; answers: Record<string, string>; onRestart?: () => void; onLeave: () => void }) {
  const quizQuestions = quiz.questions.filter((question) => question.itemType === 'question');
  const score = quizQuestions.filter((question) => answers[question.id] === question.correctAnswer).length;
  const percent = quizQuestions.length ? Math.round((score / quizQuestions.length) * 100) : 0;
  const message = percent === 100 ? 'Perfect score!' : percent >= 75 ? 'Great work!' : percent >= 50 ? 'Nice effort!' : 'Thanks for giving it a go!';

  return <main className="page quiz-page">
    <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header>
    <section className="results-card" aria-live="polite">
      <div className="score-ring" style={{ '--score': `${percent * 3.6}deg` } as CSSProperties}><span>{percent}%</span></div>
      <p className="eyebrow">QUIZ COMPLETE</p>
      <h1>{message}</h1>
      <p className="score-copy">You got <strong>{score} of {quizQuestions.length}</strong> questions right in <em>{quiz.title}</em>.</p>
      <div className="results-actions">{onRestart && <button className="primary-button" onClick={onRestart}>Try again</button>}<button className="text-button" onClick={onLeave}>Use another quiz</button></div>
    </section>
  </main>;
}

type FallingThing = { id: number; kind: 'coin' | 'veggie'; left: number; duration: number; emoji: string };

function CoinCatchGame({ title, durationSeconds, onComplete }: { title: string; durationSeconds: number; onComplete: () => void }) {
  const [things, setThings] = useState<FallingThing[]>([]);
  const [score, setScore] = useState(0);
  const [caughtCoins, setCaughtCoins] = useState(0);
  const [veggiesHit, setVeggiesHit] = useState(0);
  const [remaining, setRemaining] = useState(durationSeconds);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const endsAt = Date.now() + (durationSeconds * 1000);
    const createThing = () => {
      const kind: FallingThing['kind'] = Math.random() < .68 ? 'coin' : 'veggie';
      const vegetables = ['🥕', '🥦', '🌽'];
      setThings((current) => [...current, { id: Date.now() + Math.random(), kind, left: 5 + Math.random() * 82, duration: 3.1 + Math.random() * 1.7, emoji: kind === 'coin' ? '🪙' : vegetables[Math.floor(Math.random() * vegetables.length)] }].slice(-14));
    };
    createThing();
    const spawn = window.setInterval(createThing, 620);
    const clock = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) {
        window.clearInterval(spawn);
        window.clearInterval(clock);
        setFinished(true);
      }
    }, 100);
    return () => { window.clearInterval(spawn); window.clearInterval(clock); };
  }, [durationSeconds]);

  function catchThing(thing: FallingThing) {
    if (finished) return;
    setThings((current) => current.filter((item) => item.id !== thing.id));
    if (thing.kind === 'coin') { setScore((value) => value + 1); setCaughtCoins((value) => value + 1); }
    else { setScore((value) => Math.max(0, value - 1)); setVeggiesHit((value) => value + 1); }
  }

  return <section className="game-card" aria-live="polite">
    <div className="game-heading"><div><p className="eyebrow">GAME BREAK · {durationSeconds} SECONDS</p><h1>{title}</h1><p>Click the coins. Let the veggies fall!</p></div><div className="game-stats"><span>Time <strong>{remaining}s</strong></span><span>Coins <strong>{score}</strong></span></div></div>
    <div className="coin-catch-board" aria-label="Coin Catch game area">
      {things.map((thing) => <button key={thing.id} className={`falling-thing ${thing.kind}`} style={{ left: `${thing.left}%`, animationDuration: `${thing.duration}s` }} onClick={() => catchThing(thing)} aria-label={thing.kind === 'coin' ? 'Catch coin' : 'Avoid vegetable'}>{thing.emoji}</button>)}
      {finished && <div className="game-finish"><strong>Nice catch!</strong><span>{caughtCoins} coin{caughtCoins === 1 ? '' : 's'} collected{veggiesHit ? ` · ${veggiesHit} veggie${veggiesHit === 1 ? '' : 's'} hit` : ''}</span><button className="primary-button" onClick={onComplete}>Continue <span aria-hidden="true">→</span></button></div>}
    </div>
    <p className="game-tip">Coins add one point. Veggies take one away, so leave them alone.</p>
  </section>;
}

const MATCH_PAIR_SYMBOLS = ['🍎', '🍌', '🍇', '🍓', '🍍', '🍉'];

function MatchBoard({ cards, onFlip, children }: { cards: { id: number; symbol: string | null; matched: boolean; disabled: boolean }[]; onFlip: (id: number) => void; children?: ReactNode }) {
  return <div className="match-board" aria-label="Match Pairs game area">
    {cards.map((card) => <button key={card.id} className={`match-card${card.symbol !== null ? ' flipped' : ''}${card.matched ? ' matched' : ''}`} onClick={() => onFlip(card.id)} disabled={card.disabled} aria-label={card.symbol === null ? `Face-down card ${card.id + 1}` : `Card ${card.id + 1}: ${card.symbol}${card.matched ? ', matched' : ''}`}>{card.symbol !== null ? <span>{card.symbol}</span> : <b>?</b>}</button>)}
    {children}
  </div>;
}

function MatchPairsGame({ title, durationSeconds, onComplete }: { title: string; durationSeconds: number; onComplete: () => void }) {
  const [cards] = useState(() => shuffle([...MATCH_PAIR_SYMBOLS, ...MATCH_PAIR_SYMBOLS].map((symbol, index) => ({ id: index, symbol })), 'match-pairs'));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(() => new Set());
  const [moves, setMoves] = useState(0);
  const [remaining, setRemaining] = useState(durationSeconds);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) return;
    const endsAt = Date.now() + (durationSeconds * 1000);
    const clock = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) { window.clearInterval(clock); setFinished(true); }
    }, 100);
    return () => window.clearInterval(clock);
  }, [durationSeconds, finished]);

  function flipCard(cardId: number) {
    if (finished || flipped.length === 2 || flipped.includes(cardId) || matched.has(cardId)) return;
    const next = [...flipped, cardId];
    setFlipped(next);
    if (next.length !== 2) return;
    setMoves((value) => value + 1);
    const isPair = cards.find((card) => card.id === next[0])?.symbol === cards.find((card) => card.id === next[1])?.symbol;
    window.setTimeout(() => {
      if (isPair) {
        setMatched((current) => {
          const updated = new Set([...current, ...next]);
          if (updated.size === cards.length) setFinished(true);
          return updated;
        });
      }
      setFlipped([]);
    }, isPair ? 400 : 750);
  }

  return <section className="game-card match-game-card" aria-live="polite">
    <div className="game-heading"><div><p className="eyebrow">MEMORY GAME · {durationSeconds} SECONDS</p><h1>{title}</h1><p>Flip two cards at a time to find all the matching pairs.</p></div><div className="game-stats"><span>Time <strong>{remaining}s</strong></span><span>Pairs <strong>{matched.size / 2} / 6</strong></span></div></div>
    <MatchBoard cards={cards.map((card) => ({ id: card.id, symbol: flipped.includes(card.id) || matched.has(card.id) ? card.symbol : null, matched: matched.has(card.id), disabled: finished || matched.has(card.id) }))} onFlip={flipCard}>{finished && <div className="game-finish"><strong>{matched.size === cards.length ? 'You found them all!' : 'Time is up!'}</strong><span>{matched.size / 2} of 6 pairs matched in {moves} move{moves === 1 ? '' : 's'}</span><button className="primary-button" onClick={onComplete}>Continue <span aria-hidden="true">→</span></button></div>}</MatchBoard>
    <p className="game-tip">Remember where each fruit is, then match every pair.</p>
  </section>;
}

type TowerBlock = { id: number; x: number; width: number };

function playTowerTone(kind: 'stack' | 'perfect' | 'miss') {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = kind === 'perfect' ? 760 : kind === 'stack' ? 490 : 150;
    oscillator.type = kind === 'miss' ? 'sawtooth' : 'sine';
    gain.gain.setValueAtTime(.06, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .16);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + .16);
  } catch { /* Audio is optional and may be blocked by the browser. */ }
}

function TowerStackGame({ title, durationSeconds, onComplete }: { title: string; durationSeconds: number; onComplete: () => void }) {
  const [tower, setTower] = useState<TowerBlock[]>([{ id: 0, x: 26, width: 48 }]);
  const [movingX, setMovingX] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [remaining, setRemaining] = useState(durationSeconds);
  const [finished, setFinished] = useState(false);
  const [missed, setMissed] = useState(false);
  const [spark, setSpark] = useState(0);
  const base = tower[tower.length - 1];

  useEffect(() => {
    if (finished) return;
    const endsAt = Date.now() + (durationSeconds * 1000);
    const clock = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) { window.clearInterval(clock); setFinished(true); }
    }, 100);
    return () => window.clearInterval(clock);
  }, [durationSeconds, finished]);

  useEffect(() => {
    if (finished) return;
    const width = base.width;
    const max = 100 - width;
    let x = tower.length % 2 ? 0 : max;
    let direction = tower.length % 2 ? 1 : -1;
    let last = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const speed = 25 + Math.min(45, tower.length * 3);
      x += direction * speed * ((now - last) / 1000);
      last = now;
      if (x <= 0) { x = 0; direction = 1; }
      if (x >= max) { x = max; direction = -1; }
      setMovingX(x);
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [base.width, finished, tower.length]);

  function dropBlock() {
    if (finished) return;
    const overlapStart = Math.max(base.x, movingX);
    const overlapEnd = Math.min(base.x + base.width, movingX + base.width);
    const overlapWidth = overlapEnd - overlapStart;
    if (overlapWidth <= .8) { playTowerTone('miss'); setMissed(true); setFinished(true); return; }
    const perfect = Math.abs(movingX - base.x) <= 1;
    const nextCombo = perfect ? combo + 1 : 0;
    const nextBlock = { id: tower.length, x: perfect ? base.x : overlapStart, width: perfect ? base.width : overlapWidth };
    const points = 10 + tower.length + (perfect ? 25 + Math.max(0, nextCombo - 1) * 5 : 0);
    playTowerTone(perfect ? 'perfect' : 'stack');
    setTower((current) => [...current, nextBlock]);
    setScore((current) => current + points);
    setCombo(nextCombo);
    setSpark((value) => value + 1);
  }

  return <section className="game-card tower-game-card" aria-live="polite">
    <div className="game-heading"><div><p className="eyebrow">ARCADE GAME · {durationSeconds} SECONDS</p><h1>{title}</h1><p>Click anywhere on the game to drop the moving block onto your tower.</p></div><div className="game-stats"><span>Time <strong>{remaining}s</strong></span><span>Score <strong>{score}</strong></span><span>Combo <strong>{combo}×</strong></span></div></div>
    <div className="tower-board" onClick={dropBlock} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); dropBlock(); } }} aria-label="Tower Stack game area. Press Enter or space to drop the moving block.">
      <span className="tower-ground" />
      {tower.map((block, index) => <span key={block.id} className={`tower-block tower-color-${index % 5}`} style={{ left: `${block.x}%`, width: `${block.width}%`, bottom: `${32 + index * 26}px` }} />)}
      {!finished && <span className={`tower-block tower-moving tower-color-${tower.length % 5}`} style={{ left: `${movingX}%`, width: `${base.width}%`, bottom: `${32 + tower.length * 26}px` }} />}
      {spark > 0 && <span key={spark} className="tower-spark">✦</span>}
      {finished && <div className="game-finish"><strong>{missed ? 'The block missed!' : 'Time is up!'}</strong><span>{tower.length - 1} successful stack{tower.length === 2 ? '' : 's'} · {score} points</span><button className="primary-button" onClick={onComplete}>Continue <span aria-hidden="true">→</span></button></div>}
    </div>
    <p className="game-tip">A successful stack earns points. Perfect alignment scores a bonus and builds your combo.</p>
  </section>;
}

function Player({ quiz, onSubmitAnswer, onCompleteItem, onFinished, allowRestart = true }: { quiz: Quiz; onSubmitAnswer?: (questionId: string, answer: string) => Promise<unknown>; onCompleteItem?: (questionId: string) => Promise<unknown>; onFinished?: () => void; allowRestart?: boolean }) {
  const [screen, setScreen] = useState<Screen>(quiz.questions.length ? 'intro' : 'results');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealedQuestionIds, setRevealedQuestionIds] = useState<Set<string | number>>(() => new Set());
  const [timedOutQuestionIds, setTimedOutQuestionIds] = useState<Set<string | number>>(() => new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [remainingMilliseconds, setRemainingMilliseconds] = useState<number | null>(null);
  const [matchingProgress, setMatchingProgress] = useState<Record<string, MatchProgress>>({});
  const questionDeadline = useRef<{ id: string | number; endsAt: number } | null>(null);
  const question = quiz.questions[current];
  const options = useMemo(() => question ? questionOptions(question, quiz.guid) : [], [question, quiz.guid]);
  const timerSeconds = question?.itemType === 'question' ? effectiveTimerSeconds(question.timerSeconds, quiz.defaultTimerSeconds) : null;
  const selected = question ? answers[question.id] : undefined;
  const revealed = question ? revealedQuestionIds.has(question.id) : false;
  const isFinalQuestion = current === quiz.questions.length - 1;

  useEffect(() => {
    if (screen !== 'question' || !question || question.itemType !== 'question' || !revealed || submitting) return;
    const timer = window.setTimeout(() => void checkOrAdvance(), 5000);
    return () => window.clearTimeout(timer);
  }, [screen, question, revealed, submitting, current]);

  useEffect(() => {
    if (screen !== 'question' || !question || timerSeconds === null || revealedQuestionIds.has(question.id) || submitting) {
      setRemainingMilliseconds(null);
      return;
    }
    if (!questionDeadline.current || questionDeadline.current.id !== question.id) questionDeadline.current = { id: question.id, endsAt: Date.now() + (timerSeconds * 1000) };
    const endsAt = questionDeadline.current.endsAt;
    const tick = () => {
      const remaining = Math.max(0, endsAt - Date.now());
      setRemainingMilliseconds(remaining);
      if (remaining === 0) {
        setRevealedQuestionIds((ids) => new Set(ids).add(question.id));
        setTimedOutQuestionIds((ids) => new Set(ids).add(question.id));
      }
    };
    tick();
    let animationFrame = 0;
    const animate = () => { tick(); if (Date.now() < endsAt) animationFrame = window.requestAnimationFrame(animate); };
    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [question, revealedQuestionIds, screen, timerSeconds, submitting]);

  function restart() {
    setAnswers({});
    setMatchingProgress({});
    questionDeadline.current = null;
    setRevealedQuestionIds(new Set());
    setTimedOutQuestionIds(new Set());
    setCurrent(0);
    setScreen(quiz.questions.length ? 'intro' : 'results');
  }

  async function finishGame() {
    setSubmissionError(''); setSubmitting(true);
    try {
      await onCompleteItem?.(String(question.id));
      if (isFinalQuestion) { setScreen('results'); onFinished?.(); } else setCurrent((value) => value + 1);
    } catch (error) { setSubmissionError(error instanceof Error ? error.message : 'Could not save your progress'); }
    finally { setSubmitting(false); }
  }

  async function lockAnswer(answer: string) {
    if (submitting || revealed) return;
    setSubmissionError(''); setSubmitting(true);
    setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: answer }));
    try {
      const result = await onSubmitAnswer?.(String(question.id), answer) as { answered?: boolean; matchProgress?: MatchProgress; isCorrect?: boolean } | undefined;
      if (question.special?.kind === 'matching' && result?.matchProgress) setMatchingProgress((current) => ({ ...current, [question.id]: result.matchProgress! }));
      if (question.special?.kind === 'matching' && result?.answered === false && result.matchProgress) { setAnswers((current) => { const next = { ...current }; delete next[question.id]; return next; }); return; }
      if (question.special?.kind === 'matching') setAnswers((current) => ({ ...current, [question.id]: result?.isCorrect ? 'Matched' : 'Not matched' }));
      setRevealedQuestionIds((ids) => new Set(ids).add(question.id));
    } catch (error) {
      setAnswers((currentAnswers) => { const updated = { ...currentAnswers }; delete updated[question.id]; return updated; });
      setSubmissionError(error instanceof Error ? error.message : 'Could not save your answer');
    } finally { setSubmitting(false); }
  }

  async function checkOrAdvance() {
    setSubmissionError(''); setSubmitting(true);
    try {
      if (!selected) await onCompleteItem?.(String(question.id));
      if (isFinalQuestion) { setScreen('results'); onFinished?.(); } else setCurrent((value) => value + 1);
    } catch (error) { setSubmissionError(error instanceof Error ? error.message : 'Could not save your answer'); }
    finally { setSubmitting(false); }
  }

  if (screen === 'results') return <Results quiz={quiz} answers={answers} onRestart={allowRestart ? restart : undefined} onLeave={() => goToQuiz('')} />;

  if (screen === 'intro') return <main className="page quiz-page">
    <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header>
    <section className="intro-card">
      <p className="eyebrow">YOU’VE BEEN INVITED TO</p>
      <h1>{quiz.title}</h1>
      {quiz.description && <p className="lede">{quiz.description}</p>}
      <p className="question-count"><strong>{quiz.questions.filter((item) => item.itemType === 'question').length}</strong> quiz questions{quiz.questions.some((item) => item.itemType === 'game') && ` · ${quiz.questions.filter((item) => item.itemType === 'game').length} game break${quiz.questions.filter((item) => item.itemType === 'game').length === 1 ? '' : 's'}`}</p>
      <button className="primary-button start-button" onClick={() => setScreen('question')}>Start quiz <span aria-hidden="true">→</span></button>
    </section>
  </main>;

  const timedOut = timedOutQuestionIds.has(question.id);
  const remainingSeconds = remainingMilliseconds === null ? null : Math.ceil(remainingMilliseconds / 1000);
  const timerStyle = timerBorderStyle(timerSeconds, remainingMilliseconds);
  if (question.itemType === 'game') return <main className="page quiz-page">
    <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">Game {current + 1} of {quiz.questions.length}</span></header>
    <div className="progress" aria-hidden="true"><span style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} /></div>
    {question.gameType === 'tower_stack' ? <TowerStackGame key={question.id} title={question.text} durationSeconds={question.gameDurationSeconds ?? 20} onComplete={() => void finishGame()} /> : question.gameType === 'match_pairs' ? <MatchPairsGame key={question.id} title={question.text} durationSeconds={question.gameDurationSeconds ?? 20} onComplete={() => void finishGame()} /> : <CoinCatchGame key={question.id} title={question.text} durationSeconds={question.gameDurationSeconds ?? 20} onComplete={() => void finishGame()} />}
  </main>;
  return <main className="page quiz-page">
    <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-header-meta"><span className="question-label">Question {current + 1} of {quiz.questions.length}</span>{remainingSeconds !== null && <TimerBadge seconds={remainingSeconds} expired={remainingSeconds === 0} />}</span></header>
    <div className="progress" aria-hidden="true"><span style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} /></div>
    <section className={`question-card${question.special?.kind === 'matching' ? ' matching-question-card' : ''}${timerStyle ? ' timed-question' : ''}`} style={timerStyle}>
      <p className="eyebrow">QUESTION {String(current + 1).padStart(2, '0')}</p>
      <h1>{question.text}</h1>
      {question.special?.kind === 'true_false' && <p className="lede">{question.special.statement}</p>}
      {question.special?.kind === 'matching' ? <MatchingQuestion key={question.id} pairs={question.special.pairs} progress={matchingProgress[question.id] ?? question.matchProgress ?? null} disabled={revealed || submitting} onMatch={(left, right) => void lockAnswer(`match:${left}:${right}`)} /> : <div className="options" role="radiogroup" aria-label="Answer choices">
        {options.map((option, index) => {
          const status = revealed ? option === question.correctAnswer ? 'correct' : selected === option ? 'incorrect' : '' : selected === option ? 'selected' : '';
          return <button key={option} className={`option ${status}`} role="radio" aria-checked={selected === option} disabled={revealed || submitting} onClick={() => void lockAnswer(option)}><span className="option-key">{String.fromCharCode(65 + index)}</span><span>{option}</span>{revealed && option === question.correctAnswer && <strong className="answer-status">Correct answer</strong>}{revealed && option === selected && option !== question.correctAnswer && <strong className="answer-status">Your answer</strong>}</button>;
        })}
      </div>}
      {revealed && <p className={selected === question.correctAnswer && !timedOut ? 'answer-feedback correct-feedback' : 'answer-feedback incorrect-feedback'} role="status">{question.special?.kind === 'matching' ? timedOut ? "Time's up." : selected === question.correctAnswer ? 'All pairs matched ? nice work!' : 'No tries left. Better luck next time.' : timedOut ? selected ? `Time's up. Your answer was ${selected === question.correctAnswer ? 'correct' : 'not correct'}. The correct answer is ${question.correctAnswer}.` : `Time's up. The correct answer is ${question.correctAnswer}.` : selected === question.correctAnswer ? 'Correct — nice work!' : `Not quite. The correct answer is ${question.correctAnswer}.`}</p>}
      {submissionError && <p className="form-error">{submissionError}</p>}<div className="question-actions"><span />{revealed && <button key={question.id} className={`primary-button${!submitting ? ' advance-timer' : ''}`} disabled={submitting} onClick={() => void checkOrAdvance()}>{!submitting && <AdvanceTimer />}{submitting ? 'Saving…' : isFinalQuestion ? 'See my score' : 'Next question'} <span aria-hidden="true">→</span></button>}</div>
    </section>
  </main>;
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [guid, setGuid] = useState(guidFromLocation());
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const update = () => { setGuid(guidFromLocation()); setPath(window.location.pathname); };
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);

  const loadQuiz = useCallback(async () => {
    setLoading(false);
    setQuiz(null);
    setError(guid ? 'This direct quiz link is no longer active. Ask your teacher for a homework or live-test link.' : '');
  }, [guid]);

  useEffect(() => { void loadQuiz(); }, [loadQuiz]);

  const moderatedPin = moderatedPinFromLocation();
  const facilitatorId = facilitatorFromLocation();
  const projectorId = projectorFromLocation();
  const homeworkSessionId = homeworkFromLocation();
  const homeworkTeacherId = homeworkTeacherFromLocation();
  const facilitatorToken = new URLSearchParams(window.location.search).get('token') ?? '';
  if (moderatedPin) return <ModeratedStudent key={moderatedPin} pin={moderatedPin} />;
  if (homeworkSessionId) return <HomeworkStudent key={homeworkSessionId} sessionId={homeworkSessionId} />;
  if (homeworkTeacherId) return <HomeworkTeacher key={`${homeworkTeacherId}-${facilitatorToken}`} sessionId={homeworkTeacherId} token={facilitatorToken} />;
  if (projectorId) return <Facilitator key={`projector-${projectorId}-${facilitatorToken}`} sessionId={projectorId} token={facilitatorToken} projector />;
  if (facilitatorId) return <Facilitator key={`${facilitatorId}-${facilitatorToken}`} sessionId={facilitatorId} token={facilitatorToken} />;
  if (path === '/moderated') return <ModeratedPinEntry />;
  if (!guid) return <ModeratedPinEntry />;
  if (loading) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><div className="loader" aria-label="Loading quiz" /><p>Loading your quiz…</p></main>;
  if (error || !quiz) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><section className="error-card"><p className="eyebrow">QUIZ UNAVAILABLE</p><h1>We couldn’t open that quiz.</h1><p>{error || 'Try pasting the quiz ID again.'}</p><QuizCodeForm initialCode={guid} onSubmit={goToQuiz} /><button className="text-button" onClick={() => goToQuiz('')}>Use another quiz</button></section></main>;
  return <div className={`student-app theme-${quiz.theme}`}><Player key={quiz.guid} quiz={quiz} /></div>;
}
