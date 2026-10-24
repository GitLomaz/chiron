import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MODERATED_PIN_PATTERN = /^\d{6}$/;

type QuizQuestion = {
  id: number;
  itemType: 'question' | 'game';
  gameType: 'coin_catch' | 'match_pairs' | 'tower_stack' | null;
  gameDurationSeconds: number | null;
  text: string;
  options: unknown;
  correctAnswer: string;
  answerCount: number | null;
  timerSeconds: number | null;
};

type Quiz = {
  guid: string;
  title: string;
  description: string | null;
  theme: 'standard' | 'kids';
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
      <button className="text-button facilitator-entry" onClick={onModerated}>Join a moderated test</button>
    </section>
    <p className="footer-note">Your answers stay on this device for this quiz.</p>
  </main>;
}

type ModeratedAnswerResult = { answer: string; correctAnswer: string; isCorrect: boolean };
type ModeratedScore = { correct: number; answered: number };
type ModeratedQuestion = TimedQuestion & { id: string; text: string; itemType: 'question' | 'game'; gameType: 'coin_catch' | null; options: string[]; number: number; total?: number; answered?: boolean; timedOut?: boolean; gameScore?: number | null; result?: ModeratedAnswerResult | null };
type ModeratedStudentState = { pin: string; title: string; description: string | null; theme: 'standard' | 'kids'; phase: 'lobby' | 'question' | 'complete'; participant: { id: string; name: string } | null; score: ModeratedScore | null; currentQuestion: ModeratedQuestion | null };
type FacilitatorState = { sessionId: string; pin: string; title: string; description: string | null; phase: 'lobby' | 'question' | 'complete'; autoAdvanceOnTimeout: boolean; questionCount: number; currentQuestion: ModeratedQuestion | null; nextQuestion: ModeratedQuestion | null; participants: { id: string; name: string; answeredCurrentQuestion: boolean; score: ModeratedScore }[]; answeredCount: number; gameLeaderboard: { id: string; name: string; score: number }[] | null };

async function moderatedRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/moderated-sessions${path}`, { headers: { 'Content-Type': 'application/json', ...options?.headers }, ...options });
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(Array.isArray(body?.message) ? body.message.join(', ') : body?.message || 'Something went wrong'); }
  return response.json() as Promise<T>;
}

function moderatedPinFromLocation() { return window.location.pathname.match(/^\/moderated\/(\d{6})$/)?.[1] ?? ''; }
function facilitatorFromLocation() { return window.location.pathname.match(/^\/facilitate\/([^/]+)$/)?.[1] ?? ''; }
function projectorFromLocation() { return window.location.pathname.match(/^\/projector\/([^/]+)$/)?.[1] ?? ''; }
function goToModeratedTest(pin = '') { window.history.pushState({}, '', pin ? `/moderated/${pin}` : '/moderated'); window.dispatchEvent(new PopStateEvent('popstate')); }
function participantStorageKey(pin: string) { return `quizboard-moderated-${pin}`; }
function moderatedStudentUrl(pin: string) { return `${window.location.origin}/moderated/${pin}`; }
function projectorUrl(sessionId: string, token: string) { return `${window.location.origin}/projector/${sessionId}?token=${encodeURIComponent(token)}`; }

function ModeratedCoinCatch({ pin, participantId, question, theme }: { pin: string; participantId: string; question: ModeratedQuestion; theme: 'standard' | 'kids' }) {
  const [things, setThings] = useState<FallingThing[]>([]); const [score, setScore] = useState(question.gameScore ?? 0);
  useEffect(() => { const spawn = window.setInterval(() => { const kind: FallingThing['kind'] = Math.random() < .7 ? 'coin' : 'veggie'; const vegetables = ['🥕', '🥦', '🌽']; setThings((current) => [...current, { id: Date.now() + Math.random(), kind, left: 5 + Math.random() * 82, duration: 3 + Math.random() * 1.6, emoji: kind === 'coin' ? '🪙' : vegetables[Math.floor(Math.random() * vegetables.length)] }].slice(-14)); }, 610); return () => window.clearInterval(spawn); }, []);
  async function catchThing(thing: FallingThing) { setThings((current) => current.filter((item) => item.id !== thing.id)); const nextScore = thing.kind === 'coin' ? score + 1 : Math.max(0, score - 1); setScore(nextScore); try { await moderatedRequest(`/pin/${pin}/games/scores`, { method: 'POST', body: JSON.stringify({ participantId, questionId: question.id, score: nextScore }) }); } catch { /* The next state refresh will surface any session error. */ } }
  return <main className={`page quiz-page moderated-quiz-page theme-${theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-header-meta"><span className="question-label">LIVE GAME</span></span></header><div className="progress"><span style={{ width: `${(question.number / (question.total ?? 1)) * 100}%` }} /></div><section className="game-card moderated-game-card"><div className="game-heading"><div><p className="eyebrow">LIVE COIN CATCH</p><h1>{question.text}</h1><p>Catch coins and avoid veggies. Your score is live on the leaderboard.</p></div><div className="game-stats"><span>Score <strong>{score}</strong></span></div></div><div className="coin-catch-board">{things.map((thing) => <button key={thing.id} className={`falling-thing ${thing.kind}`} style={{ left: `${thing.left}%`, animationDuration: `${thing.duration}s` }} onClick={() => void catchThing(thing)} aria-label={thing.kind === 'coin' ? 'Catch coin' : 'Avoid vegetable'}>{thing.emoji}</button>)}</div><p className="game-tip">The facilitator will move everyone on when the round ends.</p></section></main>;
}

function ModeratedStudent({ pin }: { pin: string }) {
  const [participantId, setParticipantId] = useState(() => localStorage.getItem(participantStorageKey(pin)) ?? '');
  const [state, setState] = useState<ModeratedStudentState | null>(null);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const load = useCallback(async () => { try { setState(await moderatedRequest<ModeratedStudentState>(`/pin/${pin}${participantId ? `?participantId=${participantId}` : ''}`)); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load this test'); } }, [pin, participantId]);
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
  async function join(event: FormEvent) { event.preventDefault(); setJoining(true); try { const result = await moderatedRequest<{ participantId: string }>(`/pin/${pin}/participants`, { method: 'POST', body: JSON.stringify({ name }) }); localStorage.setItem(participantStorageKey(pin), result.participantId); setParticipantId(result.participantId); } catch (err) { setError(err instanceof Error ? err.message : 'Could not join'); } finally { setJoining(false); } }
  async function submit() { if (!state?.currentQuestion || !selected) return; setSubmitting(true); try { await moderatedRequest(`/pin/${pin}/answers`, { method: 'POST', body: JSON.stringify({ participantId, questionId: state.currentQuestion.id, answer: selected }) }); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not submit your answer'); } finally { setSubmitting(false); } }
  if (error && !state) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><section className="error-card"><p className="eyebrow">TEST UNAVAILABLE</p><h1>We couldn’t open this test.</h1><p>{error}</p></section></main>;
  if (!state) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><div className="loader" /></main>;
  if (!participantId || !state.participant) return <main className={`page quiz-page moderated-quiz-page theme-${state.theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header><section className="intro-card moderated-join-card"><p className="eyebrow">MODERATED TEST</p><h1>{state.title}</h1><p className="lede">Enter your name so your facilitator knows you’re here.</p><form className="join-form moderated-join-form" onSubmit={join}><label>Your name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" maxLength={100} required /></label><button className="primary-button" disabled={joining}>{joining ? 'Joining…' : 'Join test'}</button></form>{error && <p className="form-error">{error}</p>}</section></main>;
  if (state.phase === 'lobby') return <WaitingScreen theme={state.theme} title={state.title} name={state.participant.name} copy="You’re checked in. Your facilitator will start the first question soon." />;
  if (state.phase === 'complete') return <WaitingScreen theme={state.theme} title={state.title} name={state.participant.name} copy="The facilitator has ended this test. Thanks for taking part." score={state.score} scoreLabel="Final score" />;
  const question = state.currentQuestion;
  if (!question) return <WaitingScreen theme={state.theme} title={state.title} name={state.participant.name} copy="Waiting for the next question…" />;
  if (question.itemType === 'game') return question.timedOut ? <WaitingScreen theme={state.theme} title={state.title} name={state.participant.name} copy="Time is up for the game. Check the leaderboard while you wait for the next round." /> : <ModeratedCoinCatch key={question.id} pin={pin} participantId={participantId} question={question} theme={state.theme} />;
  if (question.answered || question.timedOut) return <WaitingScreen theme={state.theme} title={state.title} name={state.participant.name} copy={question.timedOut ? 'Time is up for this question. Wait for your facilitator to move everyone on.' : 'Your answer is recorded. Wait for the facilitator to move everyone on.'} result={question.result} score={state.score} />;
  const timerStyle = timerBorderStyle(question.timerSeconds, remainingMilliseconds);
  return <main className={`page quiz-page moderated-quiz-page theme-${state.theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-header-meta"><span className="question-label">Question {question.number} of {question.total}</span>{remainingSeconds !== null && <TimerBadge seconds={remainingSeconds} expired={remainingSeconds === 0} />}</span></header><div className="progress"><span style={{ width: `${(question.number / (question.total ?? 1)) * 100}%` }} /></div><section className={`question-card${timerStyle ? ' timed-question' : ''}`} style={timerStyle}><p className="eyebrow">QUESTION {String(question.number).padStart(2, '0')}</p><h1>{question.text}</h1><div className="options" role="radiogroup">{question.options.map((option, index) => <button key={option} className={`option ${selected === option ? 'selected' : ''}`} role="radio" aria-checked={selected === option} onClick={() => setSelected(option)}><span className="option-key">{String.fromCharCode(65 + index)}</span><span>{option}</span></button>)}</div>{error && <p className="form-error">{error}</p>}<div className="question-actions"><span /><button className="primary-button" disabled={!selected || submitting} onClick={() => void submit()}>{submitting ? 'Submitting…' : 'Submit answer'}</button></div></section></main>;
}

function WaitingScreen({ theme, title, name, copy, result, score, scoreLabel = 'Score so far' }: { theme: 'standard' | 'kids'; title: string; name: string; copy: string; result?: ModeratedAnswerResult | null; score?: ModeratedScore | null; scoreLabel?: string }) { return <main className={`page quiz-page moderated-quiz-page theme-${theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header><section className="intro-card waiting-card"><p className="eyebrow">{title}</p><h1>{result ? result.isCorrect ? `Correct, ${name}!` : `Not quite, ${name}.` : `You’re in, ${name}.`}</h1>{result && <div className={`answer-summary ${result.isCorrect ? 'correct' : 'incorrect'}`}><strong>{result.isCorrect ? 'You got it right.' : 'Here’s the answer.'}</strong><span>Your answer: {result.answer}</span>{!result.isCorrect && <span>Correct answer: {result.correctAnswer}</span>}</div>}<p className="lede">{copy}</p>{score && score.answered > 0 && <div className="score-so-far"><span>{scoreLabel}</span><strong>{score.correct} / {score.answered}</strong><small>correct answer{score.answered === 1 ? '' : 's'}</small></div>}<div className="loader small-loader" aria-label="Waiting for facilitator" /></section></main>; }

function ModeratedPinEntry() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    const value = pin.trim();
    if (!MODERATED_PIN_PATTERN.test(value)) { setError('Enter the 6-digit PIN from your facilitator.'); return; }
    goToModeratedTest(value);
  }
  return <main className="page welcome-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><section className="welcome-card"><p className="eyebrow">MODERATED TEST</p><h1>Join your live test.</h1><p className="lede">Enter the 6-digit PIN shared by your facilitator.</p><form className="join-form" onSubmit={submit} noValidate><label htmlFor="moderated-pin">Test PIN</label><div className="join-row"><input id="moderated-pin" value={pin} onChange={(event) => { setPin(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" maxLength={6} autoFocus aria-describedby={error ? 'moderated-pin-error' : undefined} /><button className="primary-button" type="submit">Join test</button></div>{error && <p className="form-error" id="moderated-pin-error">{error}</p>}</form></section></main>;
}

function Facilitator({ sessionId, token, projector = false }: { sessionId: string; token: string; projector?: boolean }) {
  const [state, setState] = useState<FacilitatorState | null>(null); const [error, setError] = useState(''); const [acting, setActing] = useState(false); const [updatingAutoAdvance, setUpdatingAutoAdvance] = useState(false); const [studentLinkCopied, setStudentLinkCopied] = useState(false);
  const load = useCallback(async () => { try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/facilitator?token=${encodeURIComponent(token)}`)); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load facilitator controls'); } }, [sessionId, token]);
  const remainingMilliseconds = useDeadlineMilliseconds(state?.currentQuestion?.timerEndsAt ?? null);
  const remainingSeconds = remainingMilliseconds === null ? null : Math.ceil(remainingMilliseconds / 1000);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 2000); return () => window.clearInterval(timer); }, [load]);
  async function act(action: 'start' | 'next') { setActing(true); try { await moderatedRequest(`/${sessionId}/${action}`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token }) }); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not update the test'); } finally { setActing(false); } }
  async function updateAutoAdvance(autoAdvanceOnTimeout: boolean) { setUpdatingAutoAdvance(true); try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/settings`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token, autoAdvanceOnTimeout }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not update automatic advance'); } finally { setUpdatingAutoAdvance(false); } }
  async function copyStudentLink() { if (!state) return; try { await navigator.clipboard.writeText(moderatedStudentUrl(state.pin)); setStudentLinkCopied(true); window.setTimeout(() => setStudentLinkCopied(false), 2000); } catch { setError('Could not copy the student link.'); } }
  if (!state) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div>{error ? <section className="error-card"><h1>Facilitator access unavailable.</h1><p>{error}</p></section> : <div className="loader" />}</main>;
  if (projector) return <main className="projector-scoreboard" aria-live="polite"><ol>{(state.gameLeaderboard ?? []).map((player, index) => <li key={player.id} className={index === 0 && player.score > 0 ? 'leader' : ''}><span>{index + 1}</span><strong>{player.name}</strong><em>{player.score}</em></li>)}</ol></main>;
  const buttonLabel = state.phase === 'lobby' ? 'Start test' : state.phase === 'complete' ? 'Test complete' : state.nextQuestion ? 'Move everyone to next question' : 'Finish test';
  const studentUrl = moderatedStudentUrl(state.pin); const scoreDisplayUrl = projectorUrl(sessionId, token);
  const timerStyle = timerBorderStyle(state.currentQuestion?.timerSeconds ?? null, remainingMilliseconds);
  const currentIsGame = state.currentQuestion?.itemType === 'game';
  const leaderboard = state.gameLeaderboard ?? [];
  return <main className="page facilitator-page"><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">FACILITATOR CONTROLS</span></header><section className="facilitator-grid"><div className={`question-card control-card${timerStyle ? ' timed-question' : ''}`} style={timerStyle}><p className="eyebrow">{state.phase === 'lobby' ? 'READY TO START' : state.phase === 'complete' ? 'TEST COMPLETE' : currentIsGame ? `LIVE GAME ${state.currentQuestion?.number}` : `QUESTION ${state.currentQuestion?.number}`}</p><h1>{state.title}</h1>{state.currentQuestion ? <><p className="control-question">{state.currentQuestion.text}</p>{currentIsGame ? <div className="live-game-leaderboard"><div><span>LIVE HIGH SCORES</span>{remainingSeconds !== null && <TimerBadge seconds={remainingSeconds} expired={remainingSeconds === 0} />}</div>{leaderboard.length ? <ol>{leaderboard.slice(0, 5).map((player, index) => <li key={player.id} className={index === 0 && player.score > 0 ? 'leader' : ''}><b>{index + 1}</b><strong>{player.name}</strong><em>{player.score}</em></li>)}</ol> : <p>Waiting for players to score…</p>}</div> : <p className="control-count">{state.answeredCount} of {state.participants.length} have answered {remainingSeconds !== null && <TimerBadge seconds={remainingSeconds} expired={remainingSeconds === 0} />}</p>}</> : <p className="lede">{state.phase === 'lobby' ? 'Participants can join now. Start when you are ready.' : 'All questions have been released.'}</p>}<button className="primary-button" disabled={acting || state.phase === 'complete'} onClick={() => void act(state.phase === 'lobby' ? 'start' : 'next')}>{acting ? 'Updating...' : buttonLabel}</button><label className="auto-advance-control"><span><strong>Auto-send next question</strong><small>Move everyone on when a timed question expires.</small></span><input type="checkbox" role="switch" checked={state.autoAdvanceOnTimeout} disabled={updatingAutoAdvance || state.phase === 'complete'} onChange={(event) => void updateAutoAdvance(event.target.checked)} /><i aria-hidden="true" /></label>{state.nextQuestion && <div className="next-preview"><p className="eyebrow">UP NEXT - {state.nextQuestion.itemType === 'game' ? 'GAME' : 'QUESTION'} {state.nextQuestion.number}</p><strong>{state.nextQuestion.text}</strong></div>}{error && <p className="form-error">{error}</p>}</div><aside className="participant-panel"><div className="student-access"><p className="eyebrow">STUDENT ACCESS</p><strong className="join-pin">{state.pin}</strong><p>Share this PIN, or send the student link.</p><a href={studentUrl} target="_blank" rel="noreferrer">{studentUrl}</a><button className="text-button" onClick={() => void copyStudentLink()}>{studentLinkCopied ? 'Student link copied' : 'Copy student link'}</button><a className="projector-link" href={scoreDisplayUrl} target="_blank" rel="noreferrer">Open projector scores</a></div><div><p className="eyebrow">PARTICIPANTS</p><h2>{state.participants.length} joined</h2></div>{state.participants.length ? <ul>{state.participants.map((participant) => <li key={participant.id}><span>{participant.name}</span><span className="participant-score"><strong>{currentIsGame ? leaderboard.find((player) => player.id === participant.id)?.score ?? 0 : `${participant.score.correct} / ${participant.score.answered}`}</strong><small>{currentIsGame ? 'coins' : 'correct'}</small>{state.phase === 'question' && !currentIsGame && <small className={participant.answeredCurrentQuestion ? 'done' : ''}>{participant.answeredCurrentQuestion ? 'Answered' : 'Working'}</small>}</span></li>)}</ul> : <p>No one has joined yet.</p>}</aside></section></main>;
}

function Results({ quiz, answers, onRestart, onLeave }: { quiz: Quiz; answers: Record<number, string>; onRestart: () => void; onLeave: () => void }) {
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
      <div className="results-actions"><button className="primary-button" onClick={onRestart}>Try again</button><button className="text-button" onClick={onLeave}>Use another quiz</button></div>
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
    <div className="match-board" aria-label="Match Pairs game area">{cards.map((card) => { const visible = flipped.includes(card.id) || matched.has(card.id); return <button key={card.id} className={`match-card${visible ? ' flipped' : ''}${matched.has(card.id) ? ' matched' : ''}`} onClick={() => flipCard(card.id)} disabled={finished || matched.has(card.id)} aria-label={visible ? card.symbol : 'Face-down card'}>{visible ? <span>{card.symbol}</span> : <b>?</b>}</button>; })}{finished && <div className="game-finish"><strong>{matched.size === cards.length ? 'You found them all!' : 'Time is up!'}</strong><span>{matched.size / 2} of 6 pairs matched in {moves} move{moves === 1 ? '' : 's'}</span><button className="primary-button" onClick={onComplete}>Continue <span aria-hidden="true">→</span></button></div>}</div>
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

function Player({ quiz }: { quiz: Quiz }) {
  const [screen, setScreen] = useState<Screen>(quiz.questions.length ? 'intro' : 'results');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealedQuestionIds, setRevealedQuestionIds] = useState<Set<number>>(() => new Set());
  const [timedOutQuestionIds, setTimedOutQuestionIds] = useState<Set<number>>(() => new Set());
  const [remainingMilliseconds, setRemainingMilliseconds] = useState<number | null>(null);
  const question = quiz.questions[current];
  const options = useMemo(() => question ? questionOptions(question, quiz.guid) : [], [question, quiz.guid]);
  const timerSeconds = question?.itemType === 'question' ? effectiveTimerSeconds(question.timerSeconds, quiz.defaultTimerSeconds) : null;

  useEffect(() => {
    if (screen !== 'question' || !question || timerSeconds === null || revealedQuestionIds.has(question.id)) {
      setRemainingMilliseconds(null);
      return;
    }
    const endsAt = Date.now() + (timerSeconds * 1000);
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
  }, [question, revealedQuestionIds, screen, timerSeconds]);

  function restart() {
    setAnswers({});
    setRevealedQuestionIds(new Set());
    setTimedOutQuestionIds(new Set());
    setCurrent(0);
    setScreen(quiz.questions.length ? 'intro' : 'results');
  }

  if (screen === 'results') return <Results quiz={quiz} answers={answers} onRestart={restart} onLeave={() => goToQuiz('')} />;

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

  const selected = answers[question.id];
  const revealed = revealedQuestionIds.has(question.id);
  const timedOut = timedOutQuestionIds.has(question.id);
  const isFinalQuestion = current === quiz.questions.length - 1;
  const remainingSeconds = remainingMilliseconds === null ? null : Math.ceil(remainingMilliseconds / 1000);
  const timerStyle = timerBorderStyle(timerSeconds, remainingMilliseconds);
  if (question.itemType === 'game') return <main className="page quiz-page">
    <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">Game {current + 1} of {quiz.questions.length}</span></header>
    <div className="progress" aria-hidden="true"><span style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} /></div>
    {question.gameType === 'tower_stack' ? <TowerStackGame key={question.id} title={question.text} durationSeconds={question.gameDurationSeconds ?? 20} onComplete={() => isFinalQuestion ? setScreen('results') : setCurrent((value) => value + 1)} /> : question.gameType === 'match_pairs' ? <MatchPairsGame key={question.id} title={question.text} durationSeconds={question.gameDurationSeconds ?? 20} onComplete={() => isFinalQuestion ? setScreen('results') : setCurrent((value) => value + 1)} /> : <CoinCatchGame key={question.id} title={question.text} durationSeconds={question.gameDurationSeconds ?? 20} onComplete={() => isFinalQuestion ? setScreen('results') : setCurrent((value) => value + 1)} />}
  </main>;
  return <main className="page quiz-page">
    <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-header-meta"><span className="question-label">Question {current + 1} of {quiz.questions.length}</span>{remainingSeconds !== null && <TimerBadge seconds={remainingSeconds} expired={remainingSeconds === 0} />}</span></header>
    <div className="progress" aria-hidden="true"><span style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} /></div>
    <section className={`question-card${timerStyle ? ' timed-question' : ''}`} style={timerStyle}>
      <p className="eyebrow">QUESTION {String(current + 1).padStart(2, '0')}</p>
      <h1>{question.text}</h1>
      <div className="options" role="radiogroup" aria-label="Answer choices">
        {options.map((option, index) => {
          const status = revealed ? option === question.correctAnswer ? 'correct' : selected === option ? 'incorrect' : '' : selected === option ? 'selected' : '';
          return <button key={option} className={`option ${status}`} role="radio" aria-checked={selected === option} disabled={revealed} onClick={() => setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: option }))}><span className="option-key">{String.fromCharCode(65 + index)}</span><span>{option}</span>{revealed && option === question.correctAnswer && <strong className="answer-status">Correct answer</strong>}{revealed && option === selected && option !== question.correctAnswer && <strong className="answer-status">Your answer</strong>}</button>;
        })}
      </div>
      {revealed && <p className={selected === question.correctAnswer && !timedOut ? 'answer-feedback correct-feedback' : 'answer-feedback incorrect-feedback'} role="status">{timedOut ? selected ? `Time's up. Your answer was ${selected === question.correctAnswer ? 'correct' : 'not correct'}. The correct answer is ${question.correctAnswer}.` : `Time's up. The correct answer is ${question.correctAnswer}.` : selected === question.correctAnswer ? 'Correct — nice work!' : `Not quite. The correct answer is ${question.correctAnswer}.`}</p>}
      <div className="question-actions"><button className="back-button" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}>Back</button><button className="primary-button" disabled={!selected && !revealed} onClick={() => {
        if (!revealed) {
          setRevealedQuestionIds((ids) => new Set(ids).add(question.id));
        } else if (isFinalQuestion) {
          setScreen('results');
        } else {
          setCurrent((value) => value + 1);
        }
      }}>{revealed ? isFinalQuestion ? 'See my score' : 'Next question' : 'Check answer'} <span aria-hidden="true">→</span></button></div>
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
    if (!guid || !UUID_PATTERN.test(guid)) {
      setQuiz(null);
      setError(guid ? 'That quiz ID does not look right.' : '');
      return;
    }
    setLoading(true);
    setError('');
    try {
      setQuiz(await getQuiz(guid));
    } catch (requestError) {
      setQuiz(null);
      setError(requestError instanceof Error ? requestError.message : 'We could not load that quiz.');
    } finally {
      setLoading(false);
    }
  }, [guid]);

  useEffect(() => { void loadQuiz(); }, [loadQuiz]);

  const moderatedPin = moderatedPinFromLocation();
  const facilitatorId = facilitatorFromLocation();
  const projectorId = projectorFromLocation();
  const facilitatorToken = new URLSearchParams(window.location.search).get('token') ?? '';
  if (moderatedPin) return <ModeratedStudent key={moderatedPin} pin={moderatedPin} />;
  if (projectorId) return <Facilitator key={`projector-${projectorId}-${facilitatorToken}`} sessionId={projectorId} token={facilitatorToken} projector />;
  if (facilitatorId) return <Facilitator key={`${facilitatorId}-${facilitatorToken}`} sessionId={facilitatorId} token={facilitatorToken} />;
  if (path === '/moderated') return <ModeratedPinEntry />;
  if (!guid) return <ModeratedPinEntry />;
  if (loading) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><div className="loader" aria-label="Loading quiz" /><p>Loading your quiz…</p></main>;
  if (error || !quiz) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><section className="error-card"><p className="eyebrow">QUIZ UNAVAILABLE</p><h1>We couldn’t open that quiz.</h1><p>{error || 'Try pasting the quiz ID again.'}</p><QuizCodeForm initialCode={guid} onSubmit={goToQuiz} /><button className="text-button" onClick={() => goToQuiz('')}>Use another quiz</button></section></main>;
  return <div className={`student-app theme-${quiz.theme}`}><Player key={quiz.guid} quiz={quiz} /></div>;
}
