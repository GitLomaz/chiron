import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type QuizQuestion = {
  id: number;
  text: string;
  options: unknown;
  correctAnswer: string;
  answerCount: number | null;
};

type Quiz = {
  guid: string;
  title: string;
  description: string | null;
  theme: 'standard' | 'kids';
  questions: QuizQuestion[];
};

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

function Welcome({ onFacilitator }: { onFacilitator: () => void }) {
  return <main className="page welcome-page">
    <div className="brand"><span className="brand-mark">Q</span> Quizboard</div>
    <section className="welcome-card">
      <p className="eyebrow">READY WHEN YOU ARE</p>
      <h1>Let’s take a quiz.</h1>
      <p className="lede">Open your quiz link or paste its quiz ID below to get started.</p>
      <QuizCodeForm onSubmit={goToQuiz} />
      <button className="text-button facilitator-entry" onClick={onFacilitator}>Facilitator login</button>
    </section>
    <p className="footer-note">Your answers stay on this device for this quiz.</p>
  </main>;
}

type ModeratedQuestion = { id: string; text: string; options: string[]; number: number; total?: number; answered?: boolean };
type ModeratedStudentState = { sessionId: string; title: string; description: string | null; theme: 'standard' | 'kids'; phase: 'lobby' | 'question' | 'complete'; participant: { id: string; name: string } | null; currentQuestion: ModeratedQuestion | null };
type FacilitatorState = { sessionId: string; title: string; description: string | null; phase: 'lobby' | 'question' | 'complete'; questionCount: number; currentQuestion: ModeratedQuestion | null; nextQuestion: ModeratedQuestion | null; participants: { id: string; name: string; answeredCurrentQuestion: boolean }[]; answeredCount: number };

async function moderatedRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/moderated-sessions${path}`, { headers: { 'Content-Type': 'application/json', ...options?.headers }, ...options });
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(Array.isArray(body?.message) ? body.message.join(', ') : body?.message || 'Something went wrong'); }
  return response.json() as Promise<T>;
}

function moderatedIdFromLocation() { return window.location.pathname.match(/^\/moderated\/([^/]+)$/)?.[1] ?? ''; }
function facilitatorFromLocation() { return window.location.pathname.match(/^\/facilitate\/([^/]+)$/)?.[1] ?? ''; }
function goToFacilitatorLogin() { window.history.pushState({}, '', '/facilitate'); window.dispatchEvent(new PopStateEvent('popstate')); }
function participantStorageKey(sessionId: string) { return `quizboard-moderated-${sessionId}`; }

function ModeratedStudent({ sessionId }: { sessionId: string }) {
  const [participantId, setParticipantId] = useState(() => localStorage.getItem(participantStorageKey(sessionId)) ?? '');
  const [state, setState] = useState<ModeratedStudentState | null>(null);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const load = useCallback(async () => { try { setState(await moderatedRequest<ModeratedStudentState>(`/${sessionId}${participantId ? `?participantId=${participantId}` : ''}`)); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load this test'); } }, [sessionId, participantId]);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 2000); return () => window.clearInterval(timer); }, [load]);
  useEffect(() => { setSelected(''); }, [state?.currentQuestion?.id]);
  async function join(event: FormEvent) { event.preventDefault(); setJoining(true); try { const result = await moderatedRequest<{ participantId: string }>(`/${sessionId}/participants`, { method: 'POST', body: JSON.stringify({ name }) }); localStorage.setItem(participantStorageKey(sessionId), result.participantId); setParticipantId(result.participantId); } catch (err) { setError(err instanceof Error ? err.message : 'Could not join'); } finally { setJoining(false); } }
  async function submit() { if (!state?.currentQuestion || !selected) return; setSubmitting(true); try { await moderatedRequest(`/${sessionId}/answers`, { method: 'POST', body: JSON.stringify({ participantId, questionId: state.currentQuestion.id, answer: selected }) }); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not submit your answer'); } finally { setSubmitting(false); } }
  if (error && !state) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><section className="error-card"><p className="eyebrow">TEST UNAVAILABLE</p><h1>We couldn’t open this test.</h1><p>{error}</p></section></main>;
  if (!state) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><div className="loader" /></main>;
  if (!participantId || !state.participant) return <main className="page quiz-page"><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header><section className="intro-card"><p className="eyebrow">MODERATED TEST</p><h1>{state.title}</h1><p className="lede">Enter your name so your facilitator knows you’re here.</p><form className="join-form" onSubmit={join}><label>Your name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required /></label><button className="primary-button" disabled={joining}>{joining ? 'Joining…' : 'Join test'}</button></form>{error && <p className="form-error">{error}</p>}</section></main>;
  if (state.phase === 'lobby') return <WaitingScreen title={state.title} name={state.participant.name} copy="You’re checked in. Your facilitator will start the first question soon." />;
  if (state.phase === 'complete') return <WaitingScreen title={state.title} name={state.participant.name} copy="The facilitator has ended this test. Thanks for taking part." />;
  const question = state.currentQuestion;
  if (!question) return <WaitingScreen title={state.title} name={state.participant.name} copy="Waiting for the next question…" />;
  if (question.answered) return <WaitingScreen title={state.title} name={state.participant.name} copy="Your answer is recorded. Wait for the facilitator to move everyone on." />;
  return <main className={`page quiz-page theme-${state.theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">Question {question.number} of {question.total}</span></header><div className="progress"><span style={{ width: `${(question.number / (question.total ?? 1)) * 100}%` }} /></div><section className="question-card"><p className="eyebrow">QUESTION {String(question.number).padStart(2, '0')}</p><h1>{question.text}</h1><div className="options" role="radiogroup">{question.options.map((option, index) => <button key={option} className={`option ${selected === option ? 'selected' : ''}`} role="radio" aria-checked={selected === option} onClick={() => setSelected(option)}><span className="option-key">{String.fromCharCode(65 + index)}</span><span>{option}</span></button>)}</div>{error && <p className="form-error">{error}</p>}<div className="question-actions"><span /><button className="primary-button" disabled={!selected || submitting} onClick={() => void submit()}>{submitting ? 'Submitting…' : 'Submit answer'}</button></div></section></main>;
}

function WaitingScreen({ title, name, copy }: { title: string; name: string; copy: string }) { return <main className="page quiz-page"><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header><section className="intro-card waiting-card"><p className="eyebrow">{title}</p><h1>You’re in, {name}.</h1><p className="lede">{copy}</p><div className="loader small-loader" aria-label="Waiting for facilitator" /></section></main>; }

function FacilitatorLogin() {
  const [sessionId, setSessionId] = useState(''); const [token, setToken] = useState(''); const [error, setError] = useState('');
  function submit(event: FormEvent) { event.preventDefault(); if (!UUID_PATTERN.test(sessionId.trim()) || !UUID_PATTERN.test(token.trim())) { setError('Enter the full test ID and facilitator code.'); return; } window.history.pushState({}, '', `/facilitate/${sessionId.trim()}?token=${token.trim()}`); window.dispatchEvent(new PopStateEvent('popstate')); }
  return <main className="page welcome-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><section className="welcome-card"><p className="eyebrow">FACILITATOR ACCESS</p><h1>Run a moderated test.</h1><p className="lede">Open your private facilitator link, or enter its details below.</p><form className="join-form" onSubmit={submit}><label>Test ID<input value={sessionId} onChange={(event) => setSessionId(event.target.value)} /></label><label>Facilitator code<input value={token} onChange={(event) => setToken(event.target.value)} /></label><button className="primary-button">Open controls</button>{error && <p className="form-error">{error}</p>}</form></section></main>;
}

function Facilitator({ sessionId, token }: { sessionId: string; token: string }) {
  const [state, setState] = useState<FacilitatorState | null>(null); const [error, setError] = useState(''); const [acting, setActing] = useState(false);
  const load = useCallback(async () => { try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/facilitator?token=${encodeURIComponent(token)}`)); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load facilitator controls'); } }, [sessionId, token]);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 2000); return () => window.clearInterval(timer); }, [load]);
  async function act(action: 'start' | 'next') { setActing(true); try { await moderatedRequest(`/${sessionId}/${action}`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token }) }); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not update the test'); } finally { setActing(false); } }
  if (!state) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div>{error ? <section className="error-card"><h1>Facilitator access unavailable.</h1><p>{error}</p></section> : <div className="loader" />}</main>;
  const buttonLabel = state.phase === 'lobby' ? 'Start test' : state.phase === 'complete' ? 'Test complete' : state.nextQuestion ? 'Move everyone to next question' : 'Finish test';
  return <main className="page facilitator-page"><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">FACILITATOR CONTROLS</span></header><section className="facilitator-grid"><div className="question-card control-card"><p className="eyebrow">{state.phase === 'lobby' ? 'READY TO START' : state.phase === 'complete' ? 'TEST COMPLETE' : `QUESTION ${state.currentQuestion?.number}`}</p><h1>{state.title}</h1>{state.currentQuestion ? <><p className="control-question">{state.currentQuestion.text}</p><p className="control-count">{state.answeredCount} of {state.participants.length} have answered</p></> : <p className="lede">{state.phase === 'lobby' ? 'Participants can join now. Start when you’re ready.' : 'All questions have been released.'}</p>}<button className="primary-button" disabled={acting || state.phase === 'complete'} onClick={() => void act(state.phase === 'lobby' ? 'start' : 'next')}>{acting ? 'Updating…' : buttonLabel}</button>{state.nextQuestion && <div className="next-preview"><p className="eyebrow">UP NEXT · QUESTION {state.nextQuestion.number}</p><strong>{state.nextQuestion.text}</strong></div>}{error && <p className="form-error">{error}</p>}</div><aside className="participant-panel"><div><p className="eyebrow">PARTICIPANTS</p><h2>{state.participants.length} joined</h2></div>{state.participants.length ? <ul>{state.participants.map((participant) => <li key={participant.id}><span>{participant.name}</span>{state.phase === 'question' && <small className={participant.answeredCurrentQuestion ? 'done' : ''}>{participant.answeredCurrentQuestion ? 'Answered' : 'Working'}</small>}</li>)}</ul> : <p>No one has joined yet.</p>}</aside></section></main>;
}

function Results({ quiz, answers, onRestart, onLeave }: { quiz: Quiz; answers: Record<number, string>; onRestart: () => void; onLeave: () => void }) {
  const score = quiz.questions.filter((question) => answers[question.id] === question.correctAnswer).length;
  const percent = quiz.questions.length ? Math.round((score / quiz.questions.length) * 100) : 0;
  const message = percent === 100 ? 'Perfect score!' : percent >= 75 ? 'Great work!' : percent >= 50 ? 'Nice effort!' : 'Thanks for giving it a go!';

  return <main className="page quiz-page">
    <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header>
    <section className="results-card" aria-live="polite">
      <div className="score-ring" style={{ '--score': `${percent * 3.6}deg` } as CSSProperties}><span>{percent}%</span></div>
      <p className="eyebrow">QUIZ COMPLETE</p>
      <h1>{message}</h1>
      <p className="score-copy">You got <strong>{score} of {quiz.questions.length}</strong> questions right in <em>{quiz.title}</em>.</p>
      <div className="results-actions"><button className="primary-button" onClick={onRestart}>Try again</button><button className="text-button" onClick={onLeave}>Use another quiz</button></div>
    </section>
  </main>;
}

function Player({ quiz }: { quiz: Quiz }) {
  const [screen, setScreen] = useState<Screen>(quiz.questions.length ? 'intro' : 'results');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealedQuestionIds, setRevealedQuestionIds] = useState<Set<number>>(() => new Set());
  const question = quiz.questions[current];
  const options = useMemo(() => question ? questionOptions(question, quiz.guid) : [], [question, quiz.guid]);

  function restart() {
    setAnswers({});
    setRevealedQuestionIds(new Set());
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
      <p className="question-count"><strong>{quiz.questions.length}</strong> {quiz.questions.length === 1 ? 'question' : 'questions'} · Choose one answer for each</p>
      <button className="primary-button start-button" onClick={() => setScreen('question')}>Start quiz <span aria-hidden="true">→</span></button>
    </section>
  </main>;

  const selected = answers[question.id];
  const revealed = revealedQuestionIds.has(question.id);
  const isFinalQuestion = current === quiz.questions.length - 1;
  return <main className="page quiz-page">
    <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">Question {current + 1} of {quiz.questions.length}</span></header>
    <div className="progress" aria-hidden="true"><span style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} /></div>
    <section className="question-card">
      <p className="eyebrow">QUESTION {String(current + 1).padStart(2, '0')}</p>
      <h1>{question.text}</h1>
      <div className="options" role="radiogroup" aria-label="Answer choices">
        {options.map((option, index) => {
          const status = revealed ? option === question.correctAnswer ? 'correct' : selected === option ? 'incorrect' : '' : selected === option ? 'selected' : '';
          return <button key={option} className={`option ${status}`} role="radio" aria-checked={selected === option} disabled={revealed} onClick={() => setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: option }))}><span className="option-key">{String.fromCharCode(65 + index)}</span><span>{option}</span>{revealed && option === question.correctAnswer && <strong className="answer-status">Correct answer</strong>}{revealed && option === selected && option !== question.correctAnswer && <strong className="answer-status">Your answer</strong>}</button>;
        })}
      </div>
      {revealed && <p className={selected === question.correctAnswer ? 'answer-feedback correct-feedback' : 'answer-feedback incorrect-feedback'} role="status">{selected === question.correctAnswer ? 'Correct — nice work!' : `Not quite. The correct answer is ${question.correctAnswer}.`}</p>}
      <div className="question-actions"><button className="back-button" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}>Back</button><button className="primary-button" disabled={!selected} onClick={() => {
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

  const moderatedId = moderatedIdFromLocation();
  const facilitatorId = facilitatorFromLocation();
  const facilitatorToken = new URLSearchParams(window.location.search).get('token') ?? '';
  if (moderatedId) return <ModeratedStudent key={moderatedId} sessionId={moderatedId} />;
  if (facilitatorId) return <Facilitator key={`${facilitatorId}-${facilitatorToken}`} sessionId={facilitatorId} token={facilitatorToken} />;
  if (path === '/facilitate') return <FacilitatorLogin />;
  if (!guid) return <Welcome onFacilitator={goToFacilitatorLogin} />;
  if (loading) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><div className="loader" aria-label="Loading quiz" /><p>Loading your quiz…</p></main>;
  if (error || !quiz) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><section className="error-card"><p className="eyebrow">QUIZ UNAVAILABLE</p><h1>We couldn’t open that quiz.</h1><p>{error || 'Try pasting the quiz ID again.'}</p><QuizCodeForm initialCode={guid} onSubmit={goToQuiz} /><button className="text-button" onClick={() => goToQuiz('')}>Use another quiz</button></section></main>;
  return <div className={`student-app theme-${quiz.theme}`}><Player key={quiz.guid} quiz={quiz} /></div>;
}
