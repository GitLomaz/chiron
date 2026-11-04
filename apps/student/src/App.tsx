import { MatchingQuestion } from './MatchingQuestion';
import { confirmAction, ConfirmDialogHost } from './ConfirmDialog';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MODERATED_PIN_PATTERN = /^\d{6}$/;
const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');
const formatNumber = (value: number) => NUMBER_FORMATTER.format(value);

type SpecialQuestion = { kind: 'true_false'; statement: string } | { kind: 'matching'; pairs: { question: string; answer: string }[] };
type MatchProgress = { matched: number[]; mistakes: number };
type QuizQuestion = {
  id: string | number;
  itemType: 'question' | 'game' | 'text';
  gameType: 'coin_catch' | 'match_pairs' | 'tower_stack' | null;
  gameDurationSeconds: number | null;
  text: string;
  options: unknown;
  special?: SpecialQuestion | null;
  matchProgress?: MatchProgress | null;
  answer?: string | null;
  completed?: boolean;
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

const CONFETTI_COLORS = ['#ff5a8a', '#ffcf3f', '#5ac7f2', '#8edb70', '#a981f7', '#ff9e42'];
const KIDS_SUCCESS_SOUND = `${import.meta.env.BASE_URL}sounds/kids-success.mp3`;
const VOLUME_STORAGE_KEY = 'quizboard-student-volume';
const PLAYER_NAME_STORAGE_KEY = 'quizboard-student-name';

type AudioSettings = { volume: number; setVolume: (volume: number) => void };
const AudioSettingsContext = createContext<AudioSettings | null>(null);

function savedVolume() {
  try {
    const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (stored === null) return 70;
    const value = Number(stored);
    return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 70;
  } catch { return 70; }
}

function savedPlayerName() {
  try { return localStorage.getItem(PLAYER_NAME_STORAGE_KEY)?.trim().slice(0, 100) ?? ''; } catch { return ''; }
}

function rememberPlayerName(name: string) {
  try { localStorage.setItem(PLAYER_NAME_STORAGE_KEY, name.trim()); } catch { /* Saving this convenience value is optional. */ }
}

function AudioSettingsProvider({ children }: { children: ReactNode }) {
  const [volume, setVolumeState] = useState(savedVolume);
  const setVolume = useCallback((nextVolume: number) => {
    const value = Math.max(0, Math.min(100, nextVolume));
    setVolumeState(value);
    try { localStorage.setItem(VOLUME_STORAGE_KEY, String(value)); } catch { /* Saving this preference is optional. */ }
  }, []);
  return <AudioSettingsContext.Provider value={{ volume, setVolume }}>{children}</AudioSettingsContext.Provider>;
}

function useAudioSettings() {
  const settings = useContext(AudioSettingsContext);
  if (!settings) throw new Error('Audio settings must be used within AudioSettingsProvider');
  return settings;
}

function VolumeControl() {
  const { volume, setVolume } = useAudioSettings();
  return <aside className="volume-control" aria-label="Sound settings">
    <label htmlFor="student-volume">Sound <output htmlFor="student-volume">{volume}%</output></label>
    <input id="student-volume" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-valuetext={`${volume}% volume`} />
  </aside>;
}

function KidsConfetti({ active }: { active: boolean }) {
  const { volume } = useAudioSettings();
  const [origin, setOrigin] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const successSound = useRef<HTMLAudioElement | null>(null);
  const hasPlayed = useRef(false);
  const shower = useMemo(() => Array.from({ length: 48 }, () => ({
    x: Math.random() * 100,
    delay: Math.random() * 850,
    drift: (Math.random() - .5) * 26,
    tilt: (Math.random() - .5) * 80,
    size: 7 + Math.random() * 10,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  })), [active]);
  const burst = useMemo(() => Array.from({ length: 24 }, (_, index) => {
    const angle = (Math.PI * 2 * index / 24) + ((Math.random() - .5) * .28);
    const distance = 100 + Math.random() * 185;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance + 65,
      delay: Math.random() * 230,
      tilt: (Math.random() - .5) * 140,
      size: 7 + Math.random() * 11,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    };
  }), [active]);

  useLayoutEffect(() => {
    const answer = document.querySelector<HTMLElement>('[data-confetti-origin]');
    if (!answer) return;
    const bounds = answer.getBoundingClientRect();
    setOrigin({ x: bounds.left + (bounds.width / 2), y: bounds.top + (bounds.height / 2) });
  }, [active]);

  useEffect(() => {
    const audio = new Audio(KIDS_SUCCESS_SOUND);
    audio.preload = 'auto';
    audio.volume = volume / 100;
    successSound.current = audio;
    return () => { audio.pause(); audio.removeAttribute('src'); audio.load(); successSound.current = null; };
  }, []);

  useEffect(() => { if (successSound.current) successSound.current.volume = volume / 100; }, [volume]);

  useEffect(() => {
    if (!active) { hasPlayed.current = false; return; }
    if (hasPlayed.current) return;
    hasPlayed.current = true;
    const audio = successSound.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => { /* Sound is optional if audio playback is unavailable. */ });
  }, [active]);

  if (!active) return null;
  return <div className="kids-confetti" aria-hidden="true">
    {shower.map(({ x, delay, drift, tilt, size, color }, index) => <i key={`shower-${index}`} style={{ '--confetti-x': `${x}%`, '--confetti-delay': `${delay}ms`, '--confetti-drift': `${drift}vw`, '--confetti-color': color, '--confetti-tilt': `${tilt}deg`, '--confetti-size': `${size}px` } as CSSProperties} />)}
    <div className="kids-confetti-burst" style={{ left: origin.x, top: origin.y }}>{burst.map(({ x, y, delay, tilt, size, color }, index) => <i key={index} style={{ '--burst-x': `${x}px`, '--burst-y': `${y}px`, '--confetti-delay': `${delay}ms`, '--confetti-color': color, '--confetti-tilt': `${tilt}deg`, '--confetti-size': `${size}px` } as CSSProperties} />)}</div>
  </div>;
}

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

function personalizeText(text: string, name?: string) {
  return text.replace(/{{\s*name\s*}}/gi, name?.trim() || 'friend');
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
type ModeratedScore = { correct: number; answered: number; points?: number; streak?: number; lastAward?: { base: number; streak: number; speed: number; total: number } | null };
type ModeratedQuestion = TimedQuestion & { special?: SpecialQuestion | null; matchProgress?: MatchProgress | null; id: string; text: string; itemType: 'question' | 'game' | 'text'; gameType: 'coin_catch' | 'match_pairs' | 'tower_stack' | null; options: string[]; number: number; total?: number; answered?: boolean; timedOut?: boolean; gameScore?: number | null; result?: ModeratedAnswerResult | null };
type MatchingAttempt = { id: string; cards: { id: number; symbol: string }[]; startedAt: string; isMatch: boolean; isActor: boolean; playerName?: string };
type MatchingState = { credits: number | null; columns: number; rows: number; selectedCard: { id: number; symbol: string } | null; cards: { symbol: string | null; matched: boolean }[]; attempt: MatchingAttempt | null; complete: boolean; completionId: string | null };
type BattleshipState = { size: number; tokens: number | null; shipCells: number; hits: number; cells: { result: 'hit' | 'miss' | null }[]; lastHit: { id: string; cell: number; participantName: string } | null; complete: boolean; completionId: string | null };
type TreasureMapState = { size: number; tokens: number | null; cells: { result: 'clue' | 'treasure' | null; hint: string | null; terrain: 'land' | 'stream' }[]; lastDig: { id: string; cell: number; participantName: string } | null; complete: boolean; completionId: string | null };
type ArcheryState = { arrows: number | null; lastShot: { id: string; x: number; y: number; score: number; participantName?: string } | null; attempts: { id: string; x: number; y: number; score: number; participantName?: string }[] };
type ModeratedStudentState = { endless: boolean; scoringEnabled: boolean; pin: string; title: string; description: string | null; theme: 'standard' | 'kids' | 'christmas' | 'halloween'; mode: 'classic' | 'facilitated' | 'matching' | 'battleship' | 'treasure_map' | 'archery'; matching: MatchingState | null; battleship: BattleshipState | null; treasureMap: TreasureMapState | null; archery: ArcheryState | null; betweenQuestions: boolean; phase: 'lobby' | 'question' | 'complete'; endedByTeacher: boolean; expired: boolean; endsAt: string | null; removed: boolean; participant: { id: string; name: string } | null; score: ModeratedScore | null; currentQuestion: ModeratedQuestion | null };
type FacilitatorState = { endless: boolean; scoringEnabled: boolean; sessionId: string; pin: string; title: string; description: string | null; mode: 'classic' | 'facilitated' | 'matching' | 'battleship' | 'treasure_map' | 'archery'; presentationMode: 'scores' | 'matching' | 'battleship' | 'treasure_map' | 'archery'; matching: MatchingState | null; battleship: BattleshipState | null; treasureMap: TreasureMapState | null; archery: ArcheryState | null; currentRound: number; phase: 'lobby' | 'question' | 'complete'; endedByTeacher: boolean; expired: boolean; endsAt: string | null; durationSeconds: number; lobbyLocked: boolean; autoBoardReset: boolean; boardResetAt: string | null; questionCount: number; completedCount: number; participants: { id: string; name: string; completed: boolean; completedItems: number; currentItemType: 'question' | 'game' | 'text' | null; currentAnswered: boolean; score: ModeratedScore }[]; scoreLeaderboard: { id: string; name: string; score: number; correct: number; answered: number; longestStreak: number }[] };

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
function studentAppUrl() {
  const configuredUrl = import.meta.env.VITE_STUDENT_APP_URL;
  if (configuredUrl && configuredUrl !== 'https://placeholder.invalid') return configuredUrl.replace(/\/$/, '');
  return ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? `${window.location.protocol}//${window.location.hostname}:5174`
    : window.location.origin;
}
function moderatedStudentUrl(pin: string) { return `${studentAppUrl()}/moderated/${pin}`; }
function teacherAppUrl() {
  const configuredUrl = import.meta.env.VITE_TEACHER_APP_URL;
  return (configuredUrl && configuredUrl !== 'https://placeholder.invalid' ? configuredUrl : 'http://localhost:5173').replace(/\/$/, '');
}
function projectorUrl(sessionId: string) { return `${teacherAppUrl()}/teacher/projector/${sessionId}`; }
function homeworkStorageKey(sessionId: string) { return `quizboard-homework-${sessionId}`; }
function homeworkStudentUrl(sessionId: string) { return `${studentAppUrl()}/homework/${sessionId}`; }
function dateTimeLocalValue(value: string) { const date = new Date(value); return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16); }
function LegacyTeacherRedirect({ path }: { path: string }) { useEffect(() => { window.location.replace(`${teacherAppUrl()}${path}`); }, [path]); return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><div className="loader" /><p>Opening teacher controls…</p></main>; }

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
  const [name, setName] = useState(savedPlayerName);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [playingMatching, setPlayingMatching] = useState(false);
  const [playingBattleship, setPlayingBattleship] = useState(false);
  const [playingTreasureMap, setPlayingTreasureMap] = useState(false);
  const [playingArchery, setPlayingArchery] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const load = useCallback(async () => { try { const query = new URLSearchParams({ clientId }); if (participantId) query.set('participantId', participantId); const next = await moderatedRequest<ModeratedStudentState>(`/pin/${pin}?${query.toString()}`); setState((current) => { const restarted = Boolean(next.endsAt && (!current?.endsAt || Date.parse(next.endsAt) > Date.parse(current.endsAt))); return current?.pin === next.pin && (current.endedByTeacher || current.expired) && !next.endedByTeacher && !next.expired && !restarted ? current : next; }); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load this test'); } }, [clientId, pin, participantId]);
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
  useEffect(() => { if (!state?.betweenQuestions) setPlayingMatching(false); }, [state?.betweenQuestions, state?.phase]);
  useEffect(() => { if (!state?.betweenQuestions) setPlayingBattleship(false); }, [state?.betweenQuestions, state?.phase]);
  useEffect(() => { if (!state?.betweenQuestions) setPlayingTreasureMap(false); }, [state?.betweenQuestions, state?.phase]);
  useEffect(() => { if (!state?.betweenQuestions) setPlayingArchery(false); }, [state?.betweenQuestions, state?.phase]);
  useEffect(() => {
    if (state?.mode !== 'matching' || !state.betweenQuestions || !state.currentQuestion?.result || playingMatching || submitting || state.endedByTeacher || state.removed) return;
    const timer = window.setTimeout(() => void nextMatchingQuestion(), 5000);
    return () => window.clearTimeout(timer);
  }, [state?.mode, state?.betweenQuestions, state?.currentQuestion?.id, state?.currentQuestion?.result?.answer, state?.endedByTeacher, state?.removed, playingMatching, submitting, participantId, pin]);
  async function join(event: FormEvent) { event.preventDefault(); setJoining(true); try { const result = await moderatedRequest<{ participantId: string }>(`/pin/${pin}/participants`, { method: 'POST', body: JSON.stringify({ name, clientId }) }); rememberPlayerName(name); localStorage.setItem(participantStorageKey(pin), result.participantId); setParticipantId(result.participantId); } catch (err) { setError(err instanceof Error ? err.message : 'Could not join'); } finally { setJoining(false); } }
  async function submit(answer = selected) { if (!state?.currentQuestion || !answer || submitting) return; setSelected(answer); setSubmitting(true); try { await moderatedRequest(`/pin/${pin}/answers`, { method: 'POST', body: JSON.stringify({ participantId, questionId: state.currentQuestion.id, answer }) }); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not submit your answer'); } finally { setSubmitting(false); } }
  async function flip(card: number) { setFlipping(true); try { const matching = await moderatedRequest<MatchingState>(`/pin/${pin}/matching/flip`, { method: 'POST', body: JSON.stringify({ participantId, card }) }); setState((current) => current ? { ...current, matching } : current); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Could not flip card'); } finally { setFlipping(false); } }
  async function nextMatchingQuestion() { setSubmitting(true); try { await moderatedRequest(`/pin/${pin}/matching/next`, { method: 'POST', body: JSON.stringify({ participantId }) }); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not start the next question'); } finally { setSubmitting(false); } }
  async function attack(cell: number) { setFlipping(true); try { const battleship = await moderatedRequest<BattleshipState>(`/pin/${pin}/battleship/attack`, { method: 'POST', body: JSON.stringify({ participantId, cell }) }); setState((current) => current ? { ...current, battleship } : current); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Could not attack that square'); } finally { setFlipping(false); } }
  async function nextBattleshipQuestion() { setSubmitting(true); try { await moderatedRequest(`/pin/${pin}/battleship/next`, { method: 'POST', body: JSON.stringify({ participantId }) }); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not start the next question'); } finally { setSubmitting(false); } }
  async function dig(cell: number) { setFlipping(true); try { const treasureMap = await moderatedRequest<TreasureMapState>(`/pin/${pin}/treasure-map/dig`, { method: 'POST', body: JSON.stringify({ participantId, cell }) }); setState((current) => current ? { ...current, treasureMap } : current); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Could not explore that square'); } finally { setFlipping(false); } }
  async function nextTreasureMapQuestion() { setSubmitting(true); try { await moderatedRequest(`/pin/${pin}/treasure-map/next`, { method: 'POST', body: JSON.stringify({ participantId }) }); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not start the next question'); } finally { setSubmitting(false); } }
  async function shootArchery(x: number, y: number) { setFlipping(true); try { const archery = await moderatedRequest<ArcheryState>(`/pin/${pin}/archery/shoot`, { method: 'POST', body: JSON.stringify({ participantId, x, y }) }); setState((current) => current ? { ...current, archery } : current); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Could not release your arrow'); } finally { setFlipping(false); } }
  async function nextArcheryQuestion() { setSubmitting(true); try { await moderatedRequest(`/pin/${pin}/archery/next`, { method: 'POST', body: JSON.stringify({ participantId }) }); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not start the next question'); } finally { setSubmitting(false); } }
  async function nextQuestion() { setSubmitting(true); try { await moderatedRequest(`/pin/${pin}/next`, { method: 'POST', body: JSON.stringify({ participantId }) }); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not start the next question'); } finally { setSubmitting(false); } }
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
    const matchedPairs = matching.cards.filter((card) => card.matched).length / 2;
    return <main className={`page quiz-page moderated-quiz-page theme-${state.theme}`}>
      <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">MATCHING BREAK</span></header>
      <section className="game-card match-game-card matching-credit-game">
        <div className="game-heading"><div><p className="eyebrow">MEMORY GAME</p><h1>Match Pairs</h1><p>Flip two cards to find a pair. A wrong match costs one credit.</p></div><div className="game-stats"><span className="matching-credit-stat">Credits <strong>{matching.credits}</strong></span><span>Pairs <strong>{matchedPairs} / {matching.cards.length / 2}</strong></span></div></div>
        <SharedMatchBoard matching={matching} disabled={flipping} onFlip={(id) => void flip(id)} />
        <p className="game-tip" aria-live="polite">{matchedPairs * 2 === matching.cards.length ? 'The class found all the pairs!' : matching.credits === 0 ? 'You are out of credits. Answer more questions to earn another.' : matching.attempt ? 'The shared board is revealing a pair.' : 'Your first pick stays on your screen. Pick a second card to reveal the pair to the class.'}</p>
        {error && <p className="form-error">{error}</p>}
        <div className="matching-game-actions"><button className="matching-secondary-button" disabled={submitting} onClick={() => void nextMatchingQuestion()}>{submitting ? 'Loading…' : 'Next question →'}</button></div>
      </section>
    </main>;
  }
  if (playingBattleship && state.battleship) return <main className={`page quiz-page moderated-quiz-page theme-${state.theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">BATTLESHIP BREAK</span></header><section className="game-card battleship-game-card"><div className="game-heading"><div><p className="eyebrow">CLASSIC BATTLESHIP</p><h1>Take a shot</h1><p>Spend one attack token to fire at the shared fleet.</p></div><div className="game-stats"><span>Tokens <strong>{state.battleship.tokens}</strong></span><span>Hits <strong>{state.battleship.hits} / {state.battleship.shipCells}</strong></span></div></div><SharedBattleshipBoard battleship={state.battleship} disabled={flipping} onAttack={(cell) => void attack(cell)} /><p className="game-tip" aria-live="polite">{state.battleship.complete ? 'The fleet is sunk! Your teacher will start the next board.' : state.battleship.tokens ? 'Choose an unmarked square to attack.' : 'You are out of attack tokens. Answer more questions correctly to earn one.'}</p>{error && <p className="form-error">{error}</p>}<div className="matching-game-actions"><button className="matching-secondary-button" disabled={submitting} onClick={() => void nextBattleshipQuestion()}>{submitting ? 'Loading…' : 'Next question →'}</button></div></section></main>;
  if (playingTreasureMap && state.treasureMap) return <main className={`page quiz-page moderated-quiz-page treasure-map-page theme-${state.theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">TREASURE MAP BREAK</span></header><section className="game-card treasure-map-game-card"><div className="game-heading"><div><p className="eyebrow">CLASS TREASURE HUNT</p><h1>Choose where to scout</h1><p>Spend a scout token to uncover a clue or find the treasure.</p></div><div className="game-stats"><span>Scout tokens <strong>{state.treasureMap.tokens}</strong></span><span>Clues <strong>{state.treasureMap.cells.filter((cell) => cell.result === 'clue').length}</strong></span></div></div><SharedTreasureMap map={state.treasureMap} disabled={flipping} onDig={(cell) => void dig(cell)} /><p className="game-tip" aria-live="polite">{state.treasureMap.complete ? 'Treasure found! Your teacher will start the next map.' : state.treasureMap.tokens ? 'Choose an unexplored square. Each miss reveals a shared clue.' : 'Answer more questions correctly to earn a scout token.'}</p>{error && <p className="form-error">{error}</p>}<div className="matching-game-actions"><button className="matching-secondary-button" disabled={submitting} onClick={() => void nextTreasureMapQuestion()}>{submitting ? 'Loading…' : 'Next question →'}</button></div></section></main>;
  if (playingArchery && state.archery) return <main className={`page quiz-page moderated-quiz-page archery-player-page theme-${state.theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">ARCHERY BREAK</span></header><section className="game-card archery-game-card"><div className="game-heading"><div><p className="eyebrow">SHARED ARCHERY RANGE</p><h1>Aim your arrow</h1><p>Watch the lower bar, then tap the target to lock it. Repeat for the side bar.</p></div><div className="game-stats"><span>Arrows <strong>{state.archery.arrows}</strong></span><span>Best <strong>{state.archery.attempts[0]?.score ?? '—'}</strong></span></div></div><ArcheryAim archery={state.archery} disabled={flipping || (state.archery.arrows ?? 0) < 1} hideControls={(state.archery.arrows ?? 0) < 1} onShoot={(x, y) => void shootArchery(x, y)} /><p className={`game-tip archery-token-tip${(state.archery.arrows ?? 0) > 0 ? ' is-reserved' : ''}`} aria-live={(state.archery.arrows ?? 0) < 1 ? 'polite' : undefined}>Answer more questions correctly to earn another arrow.</p>{error && <p className="form-error">{error}</p>}<div className="matching-game-actions"><button className="matching-secondary-button" disabled={submitting} onClick={() => void nextArcheryQuestion()}>{submitting ? 'Loading…' : 'Next question →'}</button></div></section></main>;
  if (state.phase === 'complete') return <WaitingScreen theme={state.theme} title={state.title} name={state.participant.name} copy="The test is complete. Thanks for taking part." score={state.score} scoreLabel="Final score" complete />;
  const question = state.currentQuestion;
  if (!question) return <WaitingScreen theme={state.theme} title={state.title} name={state.participant.name} copy="Waiting for the next question…" />;
  if (state.betweenQuestions && state.matching) {
    const allMatched = state.matching.cards.every((card) => card.matched);
    const canPlay = (state.matching.credits ?? 0) > 0 && !allMatched;
    return <main className={`page quiz-page moderated-quiz-page theme-${state.theme}`}>
      <KidsConfetti active={state.theme === 'kids' && question.result?.isCorrect === true} />
      <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">MATCHING BREAK</span></header>
      <section className="intro-card waiting-card matching-break-card">
        <p className="eyebrow">QUESTION {question.number}{!state.endless && <> OF {question.total}</>}</p>
        <h1 data-confetti-origin={question.result?.isCorrect ? '' : undefined}>{question.result ? question.result.isCorrect ? 'Correct!' : 'Not quite.' : 'Time is up.'}</h1>
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
  if (state.betweenQuestions && state.battleship) {
    const canPlay = (state.battleship.tokens ?? 0) > 0 && state.battleship.hits < state.battleship.shipCells;
    return <main className={`page quiz-page moderated-quiz-page theme-${state.theme}`}><KidsConfetti active={state.theme === 'kids' && question.result?.isCorrect === true} /><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">BATTLESHIP BREAK</span></header><section className="intro-card waiting-card matching-break-card"><p className="eyebrow">QUESTION {question.number}{!state.endless && <> OF {question.total}</>}</p><h1 data-confetti-origin={question.result?.isCorrect ? '' : undefined}>{question.result ? question.result.isCorrect ? 'Correct!' : 'Not quite.' : 'Time is up.'}</h1>{question.result && !question.result.isCorrect && <p className="matching-answer">The correct answer was <strong>{question.result.correctAnswer}</strong>.</p>}<div className="matching-credit-summary"><span>YOUR ATTACK TOKENS</span><strong>{state.battleship.tokens}</strong><small>{state.battleship.hits === state.battleship.shipCells ? 'The class sank the fleet!' : canPlay ? 'Ready to take a shot' : 'Answer more questions to earn an attack token'}</small></div><div className="matching-actions">{canPlay && <button className="matching-secondary-button" onClick={() => setPlayingBattleship(true)}>Attack the fleet</button>}<button className={`primary-button${question.result && !submitting ? ' advance-timer' : ''}`} disabled={submitting} onClick={() => void nextBattleshipQuestion()}>{question.result && !submitting && <AdvanceTimer />}{submitting ? 'Loading…' : !state.endless && question.number === question.total ? 'Finish test' : 'Next question'} <span aria-hidden="true">→</span></button></div>{error && <p className="form-error">{error}</p>}</section></main>;
  }
  if (state.betweenQuestions && state.treasureMap) {
    const canPlay = (state.treasureMap.tokens ?? 0) > 0 && !state.treasureMap.complete;
    const clueCount = state.treasureMap.cells.filter((cell) => cell.result === 'clue').length;
    return <main className={`page quiz-page moderated-quiz-page theme-${state.theme}`}><KidsConfetti active={state.theme === 'kids' && question.result?.isCorrect === true} /><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">TREASURE MAP BREAK</span></header><section className="intro-card waiting-card matching-break-card"><p className="eyebrow">QUESTION {question.number}{!state.endless && <> OF {question.total}</>}</p><h1 data-confetti-origin={question.result?.isCorrect ? '' : undefined}>{question.result ? question.result.isCorrect ? 'Correct!' : 'Not quite.' : 'Time is up.'}</h1>{question.result && !question.result.isCorrect && <p className="matching-answer">The correct answer was <strong>{question.result.correctAnswer}</strong>.</p>}<div className="matching-credit-summary"><span>YOUR SCOUT TOKENS</span><strong>{state.treasureMap.tokens}</strong><small>{state.treasureMap.complete ? 'The class found the treasure!' : canPlay ? `${clueCount} clue${clueCount === 1 ? '' : 's'} uncovered — ready to scout` : 'Answer more questions to earn a scout token'}</small></div><div className="matching-actions">{canPlay && <button className="matching-secondary-button" onClick={() => setPlayingTreasureMap(true)}>Open the map</button>}<button className={`primary-button${question.result && !submitting ? ' advance-timer' : ''}`} disabled={submitting} onClick={() => void nextTreasureMapQuestion()}>{question.result && !submitting && <AdvanceTimer />}{submitting ? 'Loading…' : !state.endless && question.number === question.total ? 'Finish test' : 'Next question'} <span aria-hidden="true">→</span></button></div>{error && <p className="form-error">{error}</p>}</section></main>;
  }
  if (state.betweenQuestions && state.archery) {
    const canPlay = (state.archery.arrows ?? 0) > 0;
    return <main className={`page quiz-page moderated-quiz-page theme-${state.theme}`}><KidsConfetti active={state.theme === 'kids' && question.result?.isCorrect === true} /><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">ARCHERY BREAK</span></header><section className="intro-card waiting-card matching-break-card"><p className="eyebrow">QUESTION {question.number}{!state.endless && <> OF {question.total}</>}</p><h1 data-confetti-origin={question.result?.isCorrect ? '' : undefined}>{question.result ? question.result.isCorrect ? 'Correct!' : 'Not quite.' : 'Time is up.'}</h1>{question.result && !question.result.isCorrect && <p className="matching-answer">The correct answer was <strong>{question.result.correctAnswer}</strong>.</p>}<div className="matching-credit-summary"><span>YOUR ARROWS</span><strong>{state.archery.arrows}</strong><small>{canPlay ? 'Ready to aim for the bullseye' : 'Answer more questions to earn an arrow'}</small></div><div className="matching-actions">{canPlay && <button className="matching-secondary-button" onClick={() => setPlayingArchery(true)}>Take a shot</button>}<button className={`primary-button${question.result && !submitting ? ' advance-timer' : ''}`} disabled={submitting} onClick={() => void nextArcheryQuestion()}>{question.result && !submitting && <AdvanceTimer />}{submitting ? 'Loading…' : !state.endless && question.number === question.total ? 'Finish test' : 'Next question'} <span aria-hidden="true">→</span></button></div>{error && <p className="form-error">{error}</p>}</section></main>;
  }
  if (state.betweenQuestions) {
    const isFinalQuestion = !state.endless && question.number === question.total;
    return <WaitingScreen theme={state.theme} title={state.title} name={state.participant.name} heading="Game complete!" copy="Choose next question when you are ready." action={<button className="primary-button" disabled={submitting} onClick={() => void nextQuestion()}>{submitting ? 'Loading…' : isFinalQuestion ? 'Finish test' : 'Next question'} <span aria-hidden="true">→</span></button>} />;
  }
  if (question.itemType === 'game') return question.timedOut ? <WaitingScreen theme={state.theme} title={state.title} name={state.participant.name} copy="Time is up for the game. Wait for the next round." /> : question.gameType === 'match_pairs' ? <MatchPairsGame key={question.id} title={question.text} durationSeconds={question.timerSeconds ?? 20} onComplete={() => void load()} /> : question.gameType === 'tower_stack' ? <TowerStackGame key={question.id} title={question.text} durationSeconds={question.timerSeconds ?? 20} onComplete={() => void load()} /> : <ModeratedCoinCatch key={question.id} pin={pin} participantId={participantId} question={question} theme={state.theme} facilitated={state.mode === 'facilitated'} />;
  if (question.itemType === 'text') return <main className={`page quiz-page moderated-quiz-page theme-${state.theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">MESSAGE {question.number}{!state.endless && <> of {question.total}</>}</span></header>{!state.endless && <div className="progress"><span style={{ width: `${(question.number / (question.total ?? 1)) * 100}%` }} /></div>}<section className="intro-card text-item-card"><p className="eyebrow">A NOTE FOR YOU</p><h1>{personalizeText(question.text, state.participant.name)}</h1>{state.mode === 'facilitated' ? <p className="lede">Your facilitator will continue when everyone is ready.</p> : <button className="primary-button" disabled={submitting} onClick={() => void nextQuestion()}>{submitting ? 'Loading…' : 'Continue'} <span aria-hidden="true">→</span></button>}</section></main>;
  if (question.answered || question.timedOut) {
    const canAdvance = state.mode !== 'facilitated';
    const isFinalQuestion = !state.endless && question.number === question.total;
    return <WaitingScreen theme={state.theme} title={state.title} name={state.participant.name} copy={state.mode === 'facilitated' ? 'Wait for your facilitator to release the next round.' : question.timedOut ? 'Time is up. Choose next question when you are ready.' : 'Your answer is recorded. Choose next question when you are ready.'} result={question.result} score={state.score} action={canAdvance ? <button className="primary-button" disabled={submitting} onClick={() => void nextQuestion()}>{submitting ? 'Loading…' : isFinalQuestion ? 'Finish test' : 'Next question'} <span aria-hidden="true">→</span></button> : undefined} />;
  }
  const timerStyle = timerBorderStyle(question.timerSeconds, remainingMilliseconds);
  return <main className={`page quiz-page moderated-quiz-page theme-${state.theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-header-meta"><span className="question-label">Question {question.number}{!state.endless && <> of {question.total}</>}</span>{remainingSeconds !== null && <TimerBadge seconds={remainingSeconds} expired={remainingSeconds === 0} />}</span></header>{!state.endless && <div className="progress"><span style={{ width: `${(question.number / (question.total ?? 1)) * 100}%` }} /></div>}<section className={`question-card${question.special?.kind === 'matching' ? ' matching-question-card' : ''}${timerStyle ? ' timed-question' : ''}`} style={timerStyle}><p className="eyebrow">QUESTION {String(question.number).padStart(2, '0')}</p><h1>{question.text}</h1>{question.special?.kind === 'true_false' && <p className="lede">{question.special.statement}</p>}{question.special?.kind === 'matching' ? <MatchingQuestion key={question.id} pairs={question.special.pairs} progress={question.matchProgress ?? null} disabled={submitting} onMatch={(left, right) => void submit(`match:${left}:${right}`)} /> : <div className="options" role="radiogroup">{question.options.map((option, index) => <button key={option} className={`option ${selected === option ? 'selected' : ''}`} role="radio" aria-checked={selected === option} disabled={submitting} onClick={() => state.mode === 'facilitated' ? setSelected(option) : void submit(option)}><span className="option-key">{String.fromCharCode(65 + index)}</span><span>{option}</span></button>)}</div>}{error && <p className="form-error">{error}</p>}{state.mode === 'facilitated' && question.special?.kind !== 'matching' && <div className="question-actions"><span /><button className="primary-button" disabled={!selected || submitting} onClick={() => void submit()}>{submitting ? 'Submitting…' : 'Submit answer'}</button></div>}</section></main>;
  }
  return <>{state?.phase === 'question' && !state.removed && !state.endedByTeacher && state.endsAt && <RunDeadline endsAt={state.endsAt} />}{render()}</>;
}

function QuizEnded({ theme, title, score, expired = false }: { theme: 'standard' | 'kids' | 'christmas' | 'halloween'; title: string; score?: ModeratedScore | null; expired?: boolean }) {
  return <main className={`page quiz-page moderated-quiz-page theme-${theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header><section className="intro-card waiting-card"><p className="eyebrow">{title}</p><h1>The quiz has ended.</h1><p className="lede">{expired ? 'Time is up for this quiz.' : 'Your teacher has ended this quiz.'}</p>{score && <div className="score-so-far"><span>Your score</span><strong>{score.points === undefined ? `${score.correct} / ${score.answered}` : `${score.points} pts`}</strong><small>{score.points === undefined ? 'correct answers recorded' : `${score.correct} correct answers recorded`}</small></div>}</section></main>;
}

function WaitingScreen({ theme, title, name, copy, result, score, scoreLabel = 'Score so far', complete = false, action, heading }: { theme: 'standard' | 'kids' | 'christmas' | 'halloween'; title: string; name: string; copy: string; result?: ModeratedAnswerResult | null; score?: ModeratedScore | null; scoreLabel?: string; complete?: boolean; action?: ReactNode; heading?: ReactNode }) { return <main className={`page quiz-page moderated-quiz-page theme-${theme}`}><KidsConfetti active={theme === 'kids' && result?.isCorrect === true} /><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header><section className="intro-card waiting-card"><p className="eyebrow">{title}</p><h1 data-confetti-origin={result?.isCorrect ? '' : undefined}>{heading ?? (complete ? `All done, ${name}!` : result ? result.isCorrect ? `Correct, ${name}!` : `Not quite, ${name}.` : `You’re in, ${name}.`)}</h1>{result && <div className={`answer-summary ${result.isCorrect ? 'correct' : 'incorrect'}`}><strong>{result.isCorrect ? 'You got it right.' : 'Here’s the answer.'}</strong><span>Your answer: {result.answer}</span>{!result.isCorrect && <span>Correct answer: {result.correctAnswer}</span>}</div>}<p className="lede">{copy}</p>{score && (complete || score.answered > 0) && <div className="score-so-far"><span>{scoreLabel}</span><strong>{score.points === undefined ? `${score.correct} / ${score.answered}` : `${score.points} pts`}</strong><small>{score.points === undefined ? `correct answer${score.answered === 1 ? '' : 's'}` : `${score.correct} correct${score.streak ? ` · ${score.streak} streak` : ''}`}</small>{score.lastAward && <small>+{score.lastAward.total}: {score.lastAward.base} correct, {score.lastAward.streak} streak, {score.lastAward.speed} speed</small>}</div>}{action ?? (!complete && <div className="loader small-loader" aria-label="Waiting" />)}</section></main>; }

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

export function Facilitator({ sessionId, token, projector = false, metrics = false }: { sessionId: string; token: string; projector?: boolean; metrics?: boolean }) {
  const [state, setState] = useState<FacilitatorState | null>(null);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);
  const [updatingLobby, setUpdatingLobby] = useState(false);
  const [removingParticipantId, setRemovingParticipantId] = useState<string | null>(null);
  const [projectorMetric, setProjectorMetric] = useState<'scores' | 'correct'>('scores');
  const load = useCallback(async () => { try { const next = await moderatedRequest<FacilitatorState>(`/${sessionId}/facilitator?token=${encodeURIComponent(token)}`); setState((current) => { const restarted = Boolean(next.endsAt && (!current?.endsAt || Date.parse(next.endsAt) > Date.parse(current.endsAt))); return current?.sessionId === next.sessionId && (current.endedByTeacher || current.expired) && !next.endedByTeacher && !next.expired && !restarted ? current : next; }); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load facilitator controls'); } }, [sessionId, token]);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 2000); return () => window.clearInterval(timer); }, [load]);
  async function start() { setActing(true); setError(''); try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/start`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not start the test'); } finally { setActing(false); } }
  async function next() { setActing(true); setError(''); try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/next`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not release the next round'); } finally { setActing(false); } }
  async function end() { confirmAction({ title: 'End quiz?', copy: 'Students will no longer be able to answer or join.', confirmLabel: 'End quiz', onConfirm: endNow }); }
  async function endNow() { setActing(true); setError(''); try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/end`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not end the quiz'); } finally { setActing(false); } }
  async function restart(mode: 'classic' | 'facilitated' | 'matching' | 'battleship' | 'treasure_map' | 'archery') { confirmAction({ title: `Launch a new ${mode} quiz?`, copy: 'Current participants will remain, but their scores and progress will be cleared.', confirmLabel: 'Launch new quiz', onConfirm: () => restartNow(mode) }); }
  async function restartNow(mode: 'classic' | 'facilitated' | 'matching' | 'battleship' | 'treasure_map' | 'archery') { setActing(true); setError(''); try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/restart`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token, mode }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not launch the new quiz'); } finally { setActing(false); } }
  async function resetBoard() { confirmAction({ title: 'Start a fresh board?', copy: 'Board progress and player credits or tokens will be cleared.', confirmLabel: 'Reset board', onConfirm: resetBoardNow }); }
  async function resetBoardNow() { setActing(true); setError(''); try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/board/reset`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not reset the shared board'); } finally { setActing(false); } }
  async function updateBoardAutoReset(autoBoardReset: boolean) { setActing(true); setError(''); try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/board/auto-reset`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token, autoBoardReset }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not update automatic board reset'); } finally { setActing(false); } }
  async function updateLobbyLock(lobbyLocked: boolean) { setUpdatingLobby(true); setError(''); try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/lobby`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token, lobbyLocked }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not update the lobby'); } finally { setUpdatingLobby(false); } }
  async function updatePresentationMode(presentationMode: 'scores' | 'matching' | 'battleship' | 'treasure_map' | 'archery') { setActing(true); setError(''); try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/presentation`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token, presentationMode }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not update the projector display'); } finally { setActing(false); } }
  async function removeParticipant(participantId: string) { setRemovingParticipantId(participantId); setError(''); try { setState(await moderatedRequest<FacilitatorState>(`/${sessionId}/participants/${participantId}/remove`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not remove this participant'); } finally { setRemovingParticipantId(null); } }
  if (!state) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div>{error ? <section className="error-card"><h1>Facilitator access unavailable.</h1><p>{error}</p></section> : <div className="loader" />}</main>;
  if (projector) {
    if (state.phase === 'lobby') {
      const playerCount = state.participants.length;
      const playerColumns = Math.max(1, Math.ceil(Math.sqrt(playerCount)));
      const playerRows = Math.max(1, Math.ceil(playerCount / playerColumns));
      const playerGap = Math.max(4, Math.min(20, 22 - (playerRows * 1.6)));
      const playerFontSize = Math.max(.62, Math.min(1.65, 1.75 - (Math.max(0, playerRows - 3) * .14)));
      return <main className="projector-lobby" aria-live="polite">
        <section className="projector-lobby-content">
          <header className="projector-lobby-header">
            <div>
              <h1>{state.title}</h1>
              <span className="projector-lobby-divider" aria-hidden="true" />
            </div>
            <div className="projector-joined-count"><span>JOINED</span><strong>{state.participants.length}</strong></div>
          </header>
          <div className="projector-lobby-code"><span>CODE</span><strong>{state.pin}</strong></div>
          <section className="projector-lobby-players" style={{ gridTemplateColumns: `repeat(${playerColumns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${playerRows}, minmax(0, 1fr))`, width: `min(100%, ${playerColumns * 220}px)`, height: `min(100%, ${playerRows * 118}px)`, gap: `${playerGap}px`, fontSize: `${playerFontSize}rem` }} aria-label={`${state.participants.length} participant${state.participants.length === 1 ? '' : 's'} joined`}>
            {state.participants.map((participant) => <div className="projector-lobby-player" key={participant.id}>{participant.name}</div>)}
          </section>
        </section>
      </main>;
    }
    if (state.phase !== 'complete' && state.presentationMode === 'matching' && state.matching) {
      const matchedPairs = state.matching.cards.filter((card) => card.matched).length / 2;
      return <main className="projector-match-screen" aria-live="polite"><section className="projector-match-content"><header><div className="projector-title"><p>SHARED MEMORY BOARD</p><h1>Match Pairs</h1><span>{state.title}</span></div><div className="projector-match-score"><span>PAIRS FOUND</span><strong>{matchedPairs} / {state.matching.cards.length / 2}</strong></div></header><SharedMatchBoard matching={state.matching} projector /><p className="projector-match-tip">Students choose two cards on their own screens. The pair is revealed here for everyone.</p></section></main>;
    }
    if (state.phase !== 'complete' && state.presentationMode === 'battleship' && state.battleship) {
      return <main className="projector-match-screen projector-battleship-screen" aria-live="polite"><section className="projector-match-content"><header><div className="projector-title"><p>SHARED BATTLE MAP</p><h1>Battleship</h1><span>{state.title}</span></div><div className="projector-match-score"><span>FLEET HIT</span><strong>{state.battleship.hits} / {state.battleship.shipCells}</strong></div></header><SharedBattleshipBoard battleship={state.battleship} projector /><p className="projector-match-tip">Students earn attack tokens by answering correctly, then choose a square to fire on the shared map.</p></section></main>;
    }
    if (state.phase !== 'complete' && state.presentationMode === 'treasure_map' && state.treasureMap) {
      const clues = state.treasureMap.cells.filter((cell) => cell.result === 'clue').length;
      return <main className="projector-match-screen projector-treasure-map-screen" aria-live="polite"><section className="projector-match-content"><header><div className="projector-title"><p>SHARED TREASURE HUNT</p><h1>Treasure Map</h1><span>{state.title}</span></div><div className="projector-match-score"><span>CLUES FOUND</span><strong>{clues}</strong></div></header><SharedTreasureMap map={state.treasureMap} projector /><p className="projector-match-tip">Students earn scout tokens with correct answers, then uncover clues to find the treasure together.</p></section></main>;
    }
    if (state.phase !== 'complete' && state.presentationMode === 'archery' && state.archery) {
      return <main className="projector-match-screen projector-archery-screen" aria-live="polite"><section className="projector-match-content"><header><div className="projector-title"><p>SHARED ARCHERY RANGE</p><h1>Archery</h1><span>{state.title}</span></div><div className="projector-match-score"><span>BEST BULLSEYE</span><strong>{state.archery.attempts[0]?.score ?? '—'}</strong></div></header><SharedArcheryBoard archery={state.archery} projector /><p className="projector-match-tip">Students place their shot using the bars beside and below the target.</p></section></main>;
    }
    const complete = state.phase === 'complete';
    const scoring = state.scoringEnabled;
    const showingScores = complete ? scoring : scoring && projectorMetric === 'scores';
    const leaderboard = [...state.scoreLeaderboard].sort((a, b) => (showingScores ? b.score - a.score : b.correct - a.correct) || a.name.localeCompare(b.name));
    const value = (player: typeof leaderboard[number]) => showingScores ? player.score : player.correct;
    const unit = showingScores ? 'PTS' : 'CORRECT';
    const longestStreak = Math.max(0, ...leaderboard.map((player) => player.longestStreak));
    const mostAnswered = Math.max(0, ...leaderboard.map((player) => player.answered));
    const longestStreakPlayers = leaderboard.filter((player) => player.longestStreak === longestStreak && longestStreak > 0);
    const mostAnsweredPlayers = leaderboard.filter((player) => player.answered === mostAnswered && mostAnswered > 0);
    return <main className={`projector-scoreboard${complete ? ' projector-final-scoreboard' : ''}`} aria-live="polite"><section className="projector-scoreboard-content"><header><div className="projector-title"><p>{complete ? 'QUIZ OVER' : 'LIVE LEADERBOARD'}</p><h1>{complete ? 'High scores' : showingScores ? 'Scores' : 'Correct answers'}</h1><span>{state.title}</span></div>{!complete && <div className="projector-metric-toggle" aria-label="Leaderboard display"><button className={showingScores ? 'selected' : ''} disabled={!scoring} onClick={() => setProjectorMetric('scores')} title={scoring ? 'Show point scores' : 'Point scoring is not enabled for this session'}>Scores</button><button className={!showingScores ? 'selected' : ''} onClick={() => setProjectorMetric('correct')}>Correct</button></div>}</header>{leaderboard.length ? <div className="projector-leaderboard"><ol className="projector-podium">{leaderboard.slice(0, 3).map((player, index) => <li key={player.id} className={`podium-place podium-${index + 1}`}><span className="projector-rank">{index + 1}</span><strong title={player.name}>{player.name}</strong><em>{value(player)}<small>{unit}</small></em></li>)}</ol>{leaderboard.length > 3 && <ol className="projector-top-five">{leaderboard.slice(3, 5).map((player, index) => <li key={player.id}><span className="projector-rank">{index + 4}</span><strong title={player.name}>{player.name}</strong><em>{value(player)}<small>{unit}</small></em></li>)}</ol>}{complete && <section className="projector-honours" aria-label="Honourable mentions"><h2>Honourable mentions</h2><div>{longestStreakPlayers.length > 0 && <p><span>Longest streak{longestStreakPlayers.length > 1 ? 's' : ''}</span><strong>{longestStreakPlayers.map((player) => player.name).join(', ')}</strong><em>{longestStreak} in a row</em></p>}{mostAnsweredPlayers.length > 0 && <p><span>Most questions answered</span><strong>{mostAnsweredPlayers.map((player) => player.name).join(', ')}</strong><em>{mostAnswered} answered</em></p>}</div></section>}{leaderboard.length > 5 && <section className="projector-more"><h2>More players</h2><ol>{leaderboard.slice(5).map((player, index) => <li key={player.id}><span>{index + 6}</span><strong title={player.name}>{player.name}</strong><em>{value(player)}</em></li>)}</ol></section>}</div> : <p className="projector-empty">{complete ? 'No scores were recorded for this quiz.' : 'Scores will appear here as participants answer questions.'}</p>}</section></main>;
  }
  if (metrics) return <LiveMetricsView state={state} />;
  return <LiveFacilitatorView state={state} sessionId={sessionId} token={token} acting={acting} updatingLobby={updatingLobby} removingParticipantId={removingParticipantId} error={error} onStart={start} onNext={next} onEnd={end} onRestart={restart} onResetBoard={resetBoard} onBoardAutoReset={updateBoardAutoReset} onLobbyLock={updateLobbyLock} onPresentationMode={updatePresentationMode} onRemoveParticipant={removeParticipant} />;
}

function LiveMetricsView({ state }: { state: FacilitatorState }) {
  const leaderboard = [...state.scoreLeaderboard].sort((a, b) => (state.scoringEnabled ? b.score - a.score : b.correct - a.correct) || a.name.localeCompare(b.name));
  return <main className="page facilitator-page"><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">LIVE METRICS</span></header><section className="facilitator-grid"><div className="question-card control-card"><p className="eyebrow">SESSION PERFORMANCE</p><h1>{state.title}</h1><p className="lede">Live completion, answer, and game performance update automatically.</p><div className="score-so-far"><span>Completed</span><strong>{state.completedCount} / {state.participants.length}</strong><small>{state.phase === 'lobby' ? 'Waiting to start' : state.endless ? 'Endless questions' : `${state.questionCount} quiz items per participant`}</small></div>{state.archery && <section className="homework-archery-leaderboard"><p className="eyebrow">BEST ARCHERY SCORES</p>{state.archery.attempts.length ? <ol>{state.archery.attempts.slice(0, 5).map((attempt, index) => <li key={attempt.id}><b>{index + 1}</b><span><strong>{attempt.participantName ?? 'Player'}</strong><small>Archery attempt</small></span><em>{attempt.score} pts</em></li>)}</ol> : <p className="lede">No Archery scores recorded yet.</p>}</section>}</div><aside className="participant-panel homework-participant-panel"><div><p className="eyebrow">LEADERBOARD</p><h2>{leaderboard.length} participant{leaderboard.length === 1 ? '' : 's'}</h2></div>{leaderboard.length ? <ul>{leaderboard.map((player, index) => <li className="homework-participant" key={player.id}><span className="homework-participant-progress"><strong>{index + 1}. {player.name}</strong><small>{player.correct} correct · {player.answered} answered</small></span><span className="homework-participant-score"><strong>{state.scoringEnabled ? `${player.score} pts` : `${player.correct} / ${player.answered}`}</strong><small>{player.longestStreak ? `${player.longestStreak} streak` : 'No streak yet'}</small></span></li>)}</ul> : <p>No responses yet.</p>}</aside></section></main>;
}

function LiveFacilitatorView({ state, sessionId, token, acting, updatingLobby, removingParticipantId, error, onStart, onNext, onEnd, onRestart, onResetBoard, onBoardAutoReset, onLobbyLock, onPresentationMode, onRemoveParticipant }: { state: FacilitatorState; sessionId: string; token: string; acting: boolean; updatingLobby: boolean; removingParticipantId: string | null; error: string; onStart: () => Promise<void>; onNext: () => Promise<void>; onEnd: () => Promise<void>; onRestart: (mode: 'classic' | 'facilitated' | 'matching' | 'battleship' | 'treasure_map' | 'archery') => Promise<void>; onResetBoard: () => Promise<void>; onBoardAutoReset: (autoReset: boolean) => Promise<void>; onLobbyLock: (locked: boolean) => Promise<void>; onPresentationMode: (mode: 'scores' | 'matching' | 'battleship' | 'treasure_map' | 'archery') => Promise<void>; onRemoveParticipant: (participantId: string) => Promise<void> }) {
  const [studentLinkCopied, setStudentLinkCopied] = useState(false);
  const [restartMode, setRestartMode] = useState<'classic' | 'facilitated' | 'matching' | 'battleship' | 'treasure_map' | 'archery'>(state.mode);
  const studentUrl = moderatedStudentUrl(state.pin);
  const scoreDisplayUrl = projectorUrl(sessionId);
  const activeParticipantCount = state.participants.filter((participant) => !participant.completed).length;
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
        {(state.mode === 'matching' || state.mode === 'battleship' || state.mode === 'treasure_map' || state.mode === 'archery') && <label className="projector-presentation-control"><span><strong>Projector display</strong><small>Choose what the class sees on the projector.</small></span><select value={state.presentationMode} disabled={acting} onChange={(event) => void onPresentationMode(event.target.value as 'scores' | 'matching' | 'battleship' | 'treasure_map' | 'archery')}>{state.mode === 'matching' ? <option value="matching">Matching pairs grid</option> : state.mode === 'battleship' ? <option value="battleship">Battleship map</option> : state.mode === 'treasure_map' ? <option value="treasure_map">Treasure map</option> : <option value="archery">Archery target</option>}<option value="scores">High scores</option></select></label>}
        {(state.mode === 'matching' || state.mode === 'battleship' || state.mode === 'treasure_map') && (() => {
          const boardComplete = state.mode === 'matching' ? state.matching?.complete : state.mode === 'battleship' ? state.battleship?.complete : state.treasureMap?.complete;
          const boardName = state.mode === 'matching' ? 'matching board' : state.mode === 'battleship' ? 'Battleship board' : 'treasure map';
          const completeMessage = state.mode === 'matching' ? 'All pairs found!' : state.mode === 'battleship' ? 'Fleet sunk!' : 'Treasure found!';
          return <div className="shared-board-control"><label className="auto-advance-control"><span><strong>Start a new board automatically</strong><small>{state.autoBoardReset ? 'A fresh board starts four seconds after the fanfare.' : 'Keep the finished board up until you reset it.'}</small></span><input type="checkbox" role="switch" checked={state.autoBoardReset} disabled={acting || state.phase === 'complete'} onChange={(event) => void onBoardAutoReset(event.target.checked)} /><i aria-hidden="true" /></label>{boardComplete && <div className="shared-board-complete"><strong>{completeMessage}</strong><small>{state.autoBoardReset && state.boardResetAt ? 'Starting a fresh board now…' : `The ${boardName} is complete and ready to reset.`}</small>{!state.autoBoardReset && <button className="primary-button" disabled={acting || state.phase === 'complete'} onClick={() => void onResetBoard()}>Start new board</button>}</div>}</div>;
        })()}
        {state.phase !== 'complete' && <div className="end-quiz-control"><button className="end-quiz-button" disabled={acting} onClick={() => void onEnd()}>End quiz</button><small>Stop the quiz for all participants.</small></div>}
        {state.phase === 'complete' && <div className="restart-quiz-control"><label><span><strong>Launch another round</strong><small>Keep everyone in this session, but reset all scores and progress.</small></span><select value={restartMode} disabled={acting} onChange={(event) => setRestartMode(event.target.value as typeof restartMode)}><option value="classic">Classic</option><option value="facilitated">Facilitated</option><option value="matching">Matching</option><option value="battleship">Battleship</option><option value="treasure_map">Treasure Map</option><option value="archery">Archery</option></select></label><button className="primary-button" disabled={acting} onClick={() => void onRestart(restartMode)}>{acting ? 'Launching…' : 'Launch new quiz'}</button></div>}
        <label className="auto-advance-control lobby-lock-control"><span><strong>Lock the lobby</strong><small>{state.lobbyLocked ? 'New participants cannot join.' : 'Allow participants to join with the PIN.'}</small></span><input type="checkbox" role="switch" checked={state.lobbyLocked} disabled={updatingLobby || state.phase === 'complete'} onChange={(event) => void onLobbyLock(event.target.checked)} /><i aria-hidden="true" /></label>
        {error && <p className="form-error">{error}</p>}
      </div>
      <aside className="participant-panel homework-participant-panel">
        <div className="student-access">
          <p className="eyebrow">STUDENT ACCESS</p>
          <strong className="join-pin">{state.pin}</strong>
          <p>{state.lobbyLocked ? 'Lobby locked. Existing participants can stay, but no one new can join.' : 'Share this PIN, or send the student link.'}</p>
          <a className="student-link" href={studentUrl} target="_blank" rel="noreferrer">{studentUrl}</a>
          <div className="student-access-actions">
            <button className="text-button" onClick={() => void copyStudentLink()}>{studentLinkCopied ? 'Student link copied' : 'Copy student link'}</button>
            <a className="projector-link" href={scoreDisplayUrl} target="_blank" rel="noreferrer">Open projector display</a>
          </div>
        </div>
        <div className="participant-roster-heading"><div><p className="eyebrow">PARTICIPANTS</p><h2>{state.participants.length} joined <span>·</span> {state.completedCount} completed</h2></div><span className="active-participant-count"><b>{activeParticipantCount}</b> active</span></div>
        {state.participants.length ? <div className="participant-roster" aria-label="Live participant roster"><ul>{state.participants.map((participant) => {
          const status = participant.completed ? 'complete' : participant.currentAnswered ? 'answered' : 'active';
          const statusText = participant.completed ? 'Completed' : state.phase === 'complete' ? 'Ended before completion' : state.phase === 'lobby' ? 'Waiting to start' : `${participant.completedItems} / ${state.questionCount} items · ${participant.currentItemType === 'game' ? 'Playing a game' : participant.currentAnswered ? 'Answered' : 'Working'}`;
          return <li className={`live-participant participant-${status}`} key={participant.id}>
            <i className="participant-presence" aria-hidden="true" />
            <span className="homework-participant-progress"><strong>{participant.name}</strong><small>{statusText}</small></span>
            <span className="participant-actions"><span className="homework-participant-score"><strong>{state.scoringEnabled ? `${participant.score.points ?? 0} pts` : `${participant.score.correct} / ${participant.score.answered}`}</strong><small>{state.scoringEnabled ? `${participant.score.correct} correct${participant.score.streak ? ` · ${participant.score.streak} streak` : ''}` : 'correct'}</small></span><button className="boot-participant" aria-label={`Remove ${participant.name}`} title={`Remove ${participant.name}`} disabled={removingParticipantId === participant.id} onClick={() => void onRemoveParticipant(participant.id)}>{removingParticipantId === participant.id ? '…' : '×'}</button></span>
          </li>;
        })}</ul></div> : <p className="empty-participant-roster">No one has joined yet.</p>}
      </aside>
    </section>
  </main>;
}

type HomeworkStudentState = {
  sessionId: string;
  title: string;
  description: string | null;
  theme: 'standard' | 'kids' | 'christmas' | 'halloween';
  mode: 'classic' | 'archery';
  ended: boolean;
  expired: boolean;
  endsAt: string;
  questions: QuizQuestion[];
  participant: { id: string; name: string; completed: boolean; score: { correct: number; answered: number; total: number }; archery: (ArcheryState & { shootingScore: number }) | null } | null;
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
  mode: 'classic' | 'archery';
  participants: { id: string; name: string; attemptNumber: number; joinedAt: string; completed: boolean; completedAt: string | null; completedItems: number; score: { correct: number; answered: number; total: number }; shootingScore: number | null }[];
  questionStats: { id: string; text: string; matchingPairs?: { question: string; answer: string }[]; answered: number; correct: number; correctRate: number }[];
  archeryLeaderboard: { name: string; attempts: number; bestScore: number }[];
};

type HomeworkAttemptDetail = { id: string; name: string; joinedAt: string; completedAt: string | null; completed: boolean; completedItems: number; score: { correct: number; answered: number; total: number }; shootingScore: number | null; answers: { id: string; text: string; matchingPairs?: { question: string; answer: string }[]; answer: string | null; correctAnswer: string; isCorrect: boolean | null }[] };

function MatchingPairPreview({ pairs }: { pairs: { question: string; answer: string }[] }) {
  const preview = pairs.slice(0, 2).map((pair) => `${pair.question} → ${pair.answer}`).join(' · ');
  return <small className="matching-pair-preview"><b>Pairs:</b> {preview}{pairs.length > 2 ? ` · +${formatNumber(pairs.length - 2)} more` : ''}</small>;
}

function HomeworkAttemptModal({ attempt, mode, onClose }: { attempt: HomeworkAttemptDetail; mode: HomeworkTeacherState['mode']; onClose: () => void }) {
  return <div className="report-attempt-modal-backdrop" role="presentation" onMouseDown={onClose}><section className="report-attempt-modal" role="dialog" aria-modal="true" aria-labelledby="attempt-details-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">STUDENT ATTEMPT</p><h2 id="attempt-details-title">{attempt.name} · Attempt details</h2><p>{formatNumber(attempt.score.correct)} / {formatNumber(attempt.score.total)} correct · Started {new Date(attempt.joinedAt).toLocaleString()}</p></div><button className="close-button" onClick={onClose} aria-label="Close">×</button></header>{mode === 'archery' && <p className="report-attempt-game-score">Archery score: <strong>{formatNumber(attempt.shootingScore ?? 0)} pts</strong></p>}<ol className="report-answer-list">{attempt.answers.map((answer, index) => <li key={answer.id} className={answer.isCorrect === true ? 'correct' : answer.isCorrect === false ? 'incorrect' : 'unanswered'}><span className="report-answer-number">{formatNumber(index + 1)}</span><div className="report-answer-content"><div className="report-answer-heading"><strong>{answer.matchingPairs ? 'Matching exercise' : answer.text}</strong><em>{answer.isCorrect === true ? 'Correct' : answer.isCorrect === false ? 'Incorrect' : 'Unanswered'}</em></div>{answer.matchingPairs && <MatchingPairPreview pairs={answer.matchingPairs} />}<dl><div><dt>Student answer</dt><dd>{answer.answer ?? 'No answer'}</dd></div><div><dt>Correct answer</dt><dd>{answer.correctAnswer}</dd></div></dl></div></li>)}</ol></section></div>;
}

function HomeworkReport({ state, onManage, sessionId, token }: { state: HomeworkTeacherState; onManage: () => void; sessionId: string; token: string }) {
  const completed = state.participants.filter((participant) => participant.completed).length;
  const averageRate = state.participants.length ? Math.round((state.participants.reduce((total, participant) => total + participant.score.correct, 0) / Math.max(1, state.participants.reduce((total, participant) => total + participant.score.total, 0))) * 100) : 0;
  const [bestOnly, setBestOnly] = useState(false);
  const [questionSort, setQuestionSort] = useState<'most' | 'least'>('most');
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [attempt, setAttempt] = useState<HomeworkAttemptDetail | null>(null);
  const [attemptLoading, setAttemptLoading] = useState<string | null>(null);
  const [attemptError, setAttemptError] = useState('');
  const sortedQuestions = [...state.questionStats].sort((left, right) => questionSort === 'most' ? right.correctRate - left.correctRate || right.answered - left.answered || left.text.localeCompare(right.text) : left.correctRate - right.correctRate || right.answered - left.answered || left.text.localeCompare(right.text));
  const visibleQuestions = showAllQuestions ? sortedQuestions : sortedQuestions.slice(0, 5);
  const bestAttempts = new Map<string, typeof state.participants[number]>();
  for (const participant of state.participants) {
    const key = participant.name.trim().toLocaleLowerCase();
    const current = bestAttempts.get(key);
    const quizScoreImproved = !current || participant.score.correct > current.score.correct || (participant.score.correct === current.score.correct && participant.score.answered > current.score.answered);
    const quizScoreTied = current && participant.score.correct === current.score.correct && participant.score.answered === current.score.answered;
    const archeryTieBreak = quizScoreTied && (participant.shootingScore ?? 0) > (current.shootingScore ?? 0);
    if (quizScoreImproved || archeryTieBreak || (quizScoreTied && (participant.shootingScore ?? 0) === (current.shootingScore ?? 0) && participant.joinedAt > current.joinedAt)) bestAttempts.set(key, participant);
  }
  const visibleAttempts = bestOnly ? [...bestAttempts.values()].sort((a, b) => a.name.localeCompare(b.name)) : state.participants;
  async function showAttempt(participantId: string) {
    setAttemptLoading(participantId); setAttemptError('');
    try { setAttempt(await homeworkRequest<HomeworkAttemptDetail>(`/${sessionId}/participants/${participantId}?token=${encodeURIComponent(token)}`)); }
    catch (err) { setAttemptError(err instanceof Error ? err.message : 'Could not load this attempt'); }
    finally { setAttemptLoading(null); }
  }
  return <main className="page facilitator-page homework-report-page">
    <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">HOMEWORK REPORT</span><button className="text-button" onClick={onManage}>Back to management</button></header>
    <section className="report-heading"><div><p className="eyebrow">HOMEWORK ANALYTICS</p><h1>{state.title}</h1><p>Attempt history, student outcomes, and question-level performance.</p></div><dl><div><dt>Attempts</dt><dd>{formatNumber(state.participants.length)}</dd></div><div><dt>Completed</dt><dd>{formatNumber(completed)}</dd></div><div><dt>Average score</dt><dd>{formatNumber(averageRate)}%</dd></div></dl></section>
    {state.mode === 'archery' && <section className="report-card report-archery"><div className="report-card-head"><p className="eyebrow">GAME PERFORMANCE</p><h2>Archery leaderboard</h2></div>{state.archeryLeaderboard.length ? <ol>{state.archeryLeaderboard.map((player, index) => <li key={player.name}><b>{formatNumber(index + 1)}</b><span><strong>{player.name}</strong><small>{formatNumber(player.attempts)} attempt{player.attempts === 1 ? '' : 's'}</small></span><em>{formatNumber(player.bestScore)} pts</em></li>)}</ol> : <p className="report-empty">No Archery scores recorded yet.</p>}</section>}
    <section className="report-card report-question-performance"><div className="report-card-head"><div className="report-question-heading"><p className="eyebrow">QUESTION PERFORMANCE</p><h2>All questions</h2></div><div className="report-question-actions"><label>Sort by<select value={questionSort} onChange={(event) => setQuestionSort(event.target.value as 'most' | 'least')}><option value="most">Most correct</option><option value="least">Least correct</option></select></label>{state.questionStats.length > 5 && <button className="text-button" onClick={() => setShowAllQuestions((shown) => !shown)}>{showAllQuestions ? 'Show top 5' : `Show all ${formatNumber(state.questionStats.length)}`}</button>}</div></div>{visibleQuestions.length ? <div className="report-table-wrap"><table className="report-table"><thead><tr><th>Question</th><th>Correct</th><th>Rate</th></tr></thead><tbody>{visibleQuestions.map((question) => <tr key={question.id}><td title={question.text}><strong>{question.matchingPairs ? 'Matching exercise' : question.text}</strong>{question.matchingPairs && <MatchingPairPreview pairs={question.matchingPairs} />}</td><td>{formatNumber(question.correct)} / {formatNumber(question.answered)}</td><td><strong>{formatNumber(question.correctRate)}%</strong></td></tr>)}</tbody></table></div> : <p className="report-empty">No answered questions yet.</p>}</section>
    <section className="report-card report-attempts"><div className="report-card-head"><div><p className="eyebrow">STUDENT ATTEMPTS</p><h2>Completion history</h2></div><label className="report-filter-toggle"><input type="checkbox" checked={bestOnly} onChange={(event) => setBestOnly(event.target.checked)} /><i aria-hidden="true" /><span>Best quiz attempt only</span></label><span>{formatNumber(visibleAttempts.length)} shown of {formatNumber(state.participants.length)}</span></div>{attemptError && <p className="form-error report-attempt-error">{attemptError}</p>}{visibleAttempts.length ? <div className="report-table-wrap"><table className="report-table"><thead><tr><th>Student</th><th>Attempt</th><th>Started</th><th>Status</th><th>Quiz score</th>{state.mode === 'archery' && <th>Archery</th>}<th><span className="sr-only">Details</span></th></tr></thead><tbody>{visibleAttempts.map((participant) => <tr key={participant.id}><td><strong>{participant.name}</strong></td><td>#{formatNumber(participant.attemptNumber)}</td><td>{new Date(participant.joinedAt).toLocaleString()}</td><td>{participant.completed ? participant.completedAt ? `Completed ${new Date(participant.completedAt).toLocaleString()}` : 'Completed' : `${formatNumber(participant.completedItems)} / ${formatNumber(state.itemCount)} items`}</td><td><strong>{formatNumber(participant.score.correct)} / {formatNumber(participant.score.total)}</strong><small>{formatNumber(participant.score.answered)} answered</small></td>{state.mode === 'archery' && <td><strong>{formatNumber(participant.shootingScore ?? 0)} pts</strong></td>}<td><button className="report-attempt-button" disabled={attemptLoading !== null} onClick={() => void showAttempt(participant.id)}>{attemptLoading === participant.id ? 'Loading…' : 'View answers'}</button></td></tr>)}</tbody></table></div> : <p className="report-empty">No attempts yet.</p>}</section>
    {attempt && <HomeworkAttemptModal attempt={attempt} mode={state.mode} onClose={() => setAttempt(null)} />}
  </main>;
}

function HomeworkStudent({ sessionId }: { sessionId: string }) {
  const playerStarted = useRef(false);
  const [playerFinished, setPlayerFinished] = useState(false);
  const [participantId, setParticipantId] = useState(() => localStorage.getItem(homeworkStorageKey(sessionId)) ?? '');
  const [state, setState] = useState<HomeworkStudentState | null>(null);
  const [name, setName] = useState(savedPlayerName);
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
      rememberPlayerName(name);
      localStorage.setItem(homeworkStorageKey(sessionId), result.participantId);
      setParticipantId(result.participantId);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not begin homework'); }
    finally { setJoining(false); }
  }

  async function restart() {
    try {
      const result = await homeworkRequest<{ participantId: string }>(`/${sessionId}/restart`, { method: 'POST', body: JSON.stringify({ participantId }) });
      localStorage.setItem(homeworkStorageKey(sessionId), result.participantId);
      playerStarted.current = false;
      setPlayerFinished(false);
      setParticipantId(result.participantId);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not start another attempt'); }
  }

  if (error && !state) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><section className="error-card"><p className="eyebrow">HOMEWORK UNAVAILABLE</p><h1>We couldn’t open this homework.</h1><p>{error}</p></section></main>;
  if (!state) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><div className="loader" /></main>;
  if (state.ended) return <QuizEnded theme={state.theme} title={state.title} score={state.participant?.score} expired={state.expired} />;
  if (!participantId || !state.participant) return <main className={`page quiz-page theme-${state.theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header><section className="intro-card moderated-join-card"><p className="eyebrow">HOMEWORK</p><p>Closes: {new Date(state.endsAt).toLocaleString()}</p><h1>{state.title}</h1><p className="lede">Enter your name so your teacher can see your completed work and score.</p><form className="join-form moderated-join-form" onSubmit={join}><label>Your name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" maxLength={100} required /></label><button className="primary-button" disabled={joining}>{joining ? 'Starting…' : 'Start homework'}</button></form>{error && <p className="form-error">{error}</p>}</section></main>;
  const hasPendingArcheryShot = state.mode === 'archery' && (state.participant.archery?.arrows ?? 0) > 0;
  if (state.participant.completed && !playerStarted.current && !hasPendingArcheryShot) return <main className={`page quiz-page theme-${state.theme}`}><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div></header><section className="results-card"><p className="eyebrow">HOMEWORK COMPLETE</p><h1>Nice work, {state.participant.name}!</h1><p className="score-copy">Your teacher has your score: <strong>{state.participant.score.correct} of {state.participant.score.total}</strong>{state.mode === 'archery' ? <> · <strong>{state.participant.archery?.shootingScore ?? 0}</strong> archery points</> : null}.</p><div className="results-actions"><button className="primary-button" onClick={() => void restart()}>Take quiz again</button></div>{error && <p className="form-error">{error}</p>}</section></main>;
  playerStarted.current = true;
  const quiz: Quiz = { guid: sessionId, title: state.title, description: state.description, theme: state.theme, defaultTimerSeconds: -1, questions: state.questions };
  const submitAnswer = (questionId: string, answer: string) => homeworkRequest(`/${sessionId}/answers`, { method: 'POST', body: JSON.stringify({ participantId, questionId, answer }) });
  const completeItem = (questionId: string) => homeworkRequest(`/${sessionId}/items/complete`, { method: 'POST', body: JSON.stringify({ participantId, questionId }) });
  const shootArchery = (x: number, y: number) => homeworkRequest<ArcheryState & { shootingScore: number }>(`/${sessionId}/archery/shoot`, { method: 'POST', body: JSON.stringify({ participantId, x, y }) });
  return <div className={`student-app theme-${state.theme}`}>{!playerFinished && <RunDeadline endsAt={state.endsAt} />}<Player key={participantId} quiz={quiz} studentName={state.participant.name} onSubmitAnswer={submitAnswer} onCompleteItem={completeItem} onFinished={() => setPlayerFinished(true)} onRestart={() => void restart()} archery={state.participant.archery ?? undefined} onShootArchery={state.mode === 'archery' ? shootArchery : undefined} /></div>;
}

export function HomeworkTeacher({ sessionId, token, initialView = 'manage' }: { sessionId: string; token: string; initialView?: 'manage' | 'report' }) {
  const [state, setState] = useState<HomeworkTeacherState | null>(null);
  const [view, setView] = useState<'manage' | 'report'>(initialView);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [updatingDuration, setUpdatingDuration] = useState(false);
  const [summarizeByUser, setSummarizeByUser] = useState(false);
  const load = useCallback(async () => {
    try { const next = await homeworkRequest<HomeworkTeacherState>(`/${sessionId}/teacher?token=${encodeURIComponent(token)}`); setState((current) => current?.sessionId === next.sessionId && current.ended && !next.ended ? current : next); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load homework results'); }
  }, [sessionId, token]);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 2000); return () => window.clearInterval(timer); }, [load]);
  useEffect(() => { if (state?.sessionId) setEndDate(dateTimeLocalValue(state.endsAt)); }, [state?.sessionId]);
  async function copyStudentLink() { try { await navigator.clipboard.writeText(homeworkStudentUrl(sessionId)); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { setError('Could not copy the student link.'); } }
  function end() { confirmAction({ title: 'End homework?', copy: 'Students will no longer be able to answer or join.', confirmLabel: 'End homework', onConfirm: endNow }); }
  async function endNow() { setEnding(true); setError(''); try { setState(await homeworkRequest<HomeworkTeacherState>(`/${sessionId}/end`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token }) })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not end the homework'); } finally { setEnding(false); } }
  async function updateDuration() {
    const durationSeconds = Math.ceil((new Date(endDate).getTime() - Date.now()) / 1000);
    if (!endDate || !Number.isFinite(durationSeconds) || durationSeconds < 300 || durationSeconds > 604800) { setError('Choose an end date between 5 minutes and 7 days from now.'); return; }
    setUpdatingDuration(true); setError('');
    try { setState(await homeworkRequest<HomeworkTeacherState>(`/${sessionId}/duration`, { method: 'POST', body: JSON.stringify({ facilitatorToken: token, durationSeconds }) })); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not update the homework deadline'); }
    finally { setUpdatingDuration(false); }
  }
  if (!state) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div>{error ? <section className="error-card"><h1>Teacher access unavailable.</h1><p>{error}</p></section> : <div className="loader" />}</main>;
  const completed = state.participants.filter((participant) => participant.completed).length;
  const studentUrl = homeworkStudentUrl(sessionId);
  const participantSummaries = new Map<string, { id: string; name: string; completed: boolean; completedItems: number; score: { correct: number; answered: number; total: number }; shootingScore: number | null; attemptCount: number; completedAttempts: number }>();
  for (const participant of state.participants) {
    const key = participant.name.trim().toLocaleLowerCase();
    const current = participantSummaries.get(key);
    const preferred = !current || participant.score.correct > current.score.correct || (participant.score.correct === current.score.correct && participant.score.answered > current.score.answered) || (participant.score.correct === current.score.correct && participant.score.answered === current.score.answered && (participant.shootingScore ?? 0) > (current.shootingScore ?? 0));
    participantSummaries.set(key, preferred ? { id: participant.id, name: participant.name, completed: participant.completed, completedItems: participant.completedItems, score: participant.score, shootingScore: participant.shootingScore, attemptCount: (current?.attemptCount ?? 0) + 1, completedAttempts: (current?.completedAttempts ?? 0) + Number(participant.completed) } : { ...current!, attemptCount: current!.attemptCount + 1, completedAttempts: current!.completedAttempts + Number(participant.completed) });
  }
  const displayedParticipants = summarizeByUser ? [...participantSummaries.values()].sort((a, b) => a.name.localeCompare(b.name)) : state.participants.map((participant) => ({ ...participant, attemptCount: 1, completedAttempts: Number(participant.completed) }));
  if (view === 'report') return <HomeworkReport state={state} onManage={() => setView('manage')} sessionId={sessionId} token={token} />;
  return <main className="page facilitator-page">
    <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">HOMEWORK MANAGEMENT</span><button className="text-button" onClick={() => setView('report')}>Open report</button></header>
    <section className="facilitator-grid">
      <div className="question-card control-card">
        <p className="eyebrow">{state.ended ? 'HOMEWORK ENDED' : 'HOMEWORK RUN'}</p><h1>{state.title}</h1><p>{state.expired ? 'Time expired' : 'Closes'}: {new Date(state.endsAt).toLocaleString()}</p>
        <p className="lede">{state.ended ? 'This homework has ended. Recorded work remains available below.' : 'Students work independently. This page updates as they join and complete the assignment.'}</p>
        <div className="score-so-far"><span>Completed</span><strong>{completed} / {state.participants.length}</strong><small>{state.questionCount} scored question{state.questionCount === 1 ? '' : 's'} per attempt</small></div>
        {!state.ended && <section className="session-duration-control"><p className="eyebrow">SESSION CONTROLS</p><label>End date and time<input type="datetime-local" value={endDate} disabled={updatingDuration} onChange={(event) => setEndDate(event.target.value)} /></label><button className="primary-button" disabled={updatingDuration} onClick={() => void updateDuration()}>{updatingDuration ? 'Updating…' : 'Update deadline'}</button><small>Students will no longer be able to work after this time.</small></section>}
        {state.mode === 'archery' && state.archeryLeaderboard.length > 0 && <section className="homework-archery-leaderboard"><p className="eyebrow">BEST ARCHERY SCORES</p><ol>{state.archeryLeaderboard.map((player, index) => <li key={player.name}><b>{index + 1}</b><span><strong>{player.name}</strong><small>{player.attempts} attempt{player.attempts === 1 ? '' : 's'}</small></span><em>{player.bestScore} pts</em></li>)}</ol></section>}
        {!state.ended && <div className="end-quiz-control"><button className="end-quiz-button" disabled={ending} onClick={() => void end()}>{ending ? 'Ending…' : 'End quiz'}</button><small>Stop homework for all participants.</small></div>}
        {error && <p className="form-error">{error}</p>}
      </div>
      <aside className="participant-panel homework-participant-panel">
        <div className="student-access">
          <p className="eyebrow">STUDENT ACCESS</p><p>{state.ended ? 'This homework is closed to students.' : 'Share this homework link with students.'}</p>
          <a className="student-link" href={studentUrl} target="_blank" rel="noreferrer">{studentUrl}</a>
          <div className="student-access-actions"><button className="text-button" onClick={() => void copyStudentLink()}>{copied ? 'Student link copied' : 'Copy student link'}</button></div>
        </div>
        <div className="participant-summary-heading"><div><p className="eyebrow">PARTICIPANTS</p><h2>{summarizeByUser ? `${displayedParticipants.length} students` : `${state.participants.length} started`} <span>·</span> {completed} completed</h2></div><label className="participant-summary-toggle"><input type="checkbox" checked={summarizeByUser} onChange={(event) => setSummarizeByUser(event.target.checked)} /><i aria-hidden="true" /><span>Summarize by user</span></label></div>
        {displayedParticipants.length ? <ul>{displayedParticipants.map((participant) => <li className="homework-participant" key={participant.id}><span className="homework-participant-progress"><strong>{participant.name}</strong><small>{summarizeByUser ? `${participant.completedAttempts} completed · ${participant.attemptCount} attempt${participant.attemptCount === 1 ? '' : 's'}` : participant.completed ? 'Completed' : `${participant.completedItems} / ${state.itemCount} items`}</small></span><span className="homework-participant-score"><strong>{participant.score.correct} / {participant.score.total}</strong><small>{state.mode === 'archery' ? `${participant.shootingScore ?? 0} archery pts` : participant.completed ? 'Final score' : `${participant.score.answered} answered`}</small></span></li>)}</ul> : <p>No one has started yet.</p>}
      </aside>
    </section>
  </main>;
}

export function HomeworkProjector({ sessionId, token }: { sessionId: string; token: string }) {
  const [state, setState] = useState<HomeworkTeacherState | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setState(await homeworkRequest<HomeworkTeacherState>(`/${sessionId}/teacher?token=${encodeURIComponent(token)}`)); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load homework results'); }
  }, [sessionId, token]);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 2000); return () => window.clearInterval(timer); }, [load]);
  if (!state) return <main className="projector-scoreboard"><section className="projector-scoreboard-content">{error ? <p className="projector-empty">{error}</p> : <p className="projector-empty">Loading homework results…</p>}</section></main>;
  const classicScores = new Map<string, { name: string; attempts: number; correct: number; total: number }>();
  for (const participant of state.participants) {
    const name = participant.name.trim() || 'Student';
    const existing = classicScores.get(name);
    if (!existing) classicScores.set(name, { name, attempts: 1, correct: participant.score.correct, total: participant.score.total });
    else {
      existing.attempts += 1;
      if (participant.score.correct > existing.correct || (participant.score.correct === existing.correct && participant.score.total > existing.total)) { existing.correct = participant.score.correct; existing.total = participant.score.total; }
    }
  }
  const standings = state.mode === 'archery'
    ? state.archeryLeaderboard.map((player) => ({ name: player.name, score: player.bestScore, detail: `${player.attempts} attempt${player.attempts === 1 ? '' : 's'}` }))
    : [...classicScores.values()].map((player) => ({ name: player.name, score: player.correct, detail: `${player.correct} / ${player.total} correct${player.attempts > 1 ? ` · ${player.attempts} attempts` : ''}` }));
  standings.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const scoreLabel = state.mode === 'archery' ? 'PTS' : 'CORRECT';
  return <main className="projector-scoreboard" aria-live="polite"><section className="projector-scoreboard-content"><header><div className="projector-title"><p>{state.mode === 'archery' ? 'ARCHERY HOMEWORK' : 'HOMEWORK RESULTS'}</p><h1>{state.mode === 'archery' ? 'Top scores' : 'Completion standings'}</h1><span>{state.title}</span></div><div className="projector-joined-count"><span>COMPLETED</span><strong>{state.participants.filter((participant) => participant.completed).length} / {state.participants.length}</strong></div></header>{standings.length ? <div className="projector-leaderboard"><ol className="projector-podium">{standings.slice(0, 3).map((player, index) => <li key={player.name} className={`podium-place podium-${index + 1}`}><span className="projector-rank">{index + 1}</span><strong title={player.name}>{player.name}</strong><em>{player.score}<small>{scoreLabel}</small></em></li>)}</ol>{standings.length > 3 && <ol className="projector-top-five">{standings.slice(3, 5).map((player, index) => <li key={player.name}><span className="projector-rank">{index + 4}</span><strong title={player.name}>{player.name}</strong><em>{player.score}<small>{scoreLabel}</small></em></li>)}</ol>}{standings.length > 5 && <section className="projector-more"><h2>More students</h2><ol>{standings.slice(5).map((player, index) => <li key={player.name}><span>{index + 6}</span><strong title={player.name}>{player.name}</strong><em>{player.score}</em></li>)}</ol></section>}<p className="projector-homework-note">{state.mode === 'archery' ? 'Each student’s best Archery attempt is shown.' : 'Each student’s best completed quiz attempt is shown.'}</p></div> : <p className="projector-empty">No homework attempts have been recorded yet.</p>}</section></main>;
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

function playGameFanfare(kind: 'match' | 'hit' | 'complete', volume: number) {
  if (volume === 0) return;
  try {
    const context = new AudioContext();
    const notes = kind === 'match' ? [523, 659, 784, 1047] : kind === 'hit' ? [196, 294, 440, 659] : [392, 523, 659, 784, 1047, 1319];
    const now = context.currentTime;
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + (index * .09);
      oscillator.type = kind === 'hit' ? 'square' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(.07 * (volume / 100), start + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .2);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + .22);
    });
    window.setTimeout(() => void context.close(), 700);
  } catch { /* Audio is optional and may be blocked by the browser. */ }
}

function GameFanfare({ eventId, kind, successName }: { eventId: string | null; kind: 'match' | 'hit' | 'complete'; successName?: string }) {
  const { volume } = useAudioSettings();
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
  const playedEvent = useRef<string | null>(null);
  const expirationTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!eventId || playedEvent.current === eventId) return;
    playedEvent.current = eventId;
    if (expirationTimer.current !== null) window.clearTimeout(expirationTimer.current);
    setActiveEvent(eventId);
    playGameFanfare(kind, volume);
    expirationTimer.current = window.setTimeout(() => setActiveEvent((current) => current === eventId ? null : current), kind === 'complete' ? 2900 : 1600);
  }, [eventId, kind]);
  useEffect(() => () => { if (expirationTimer.current !== null) window.clearTimeout(expirationTimer.current); }, []);
  if (!activeEvent) return null;
  const copy = kind === 'match' ? 'MATCH!' : kind === 'hit' ? 'DIRECT HIT!' : 'BOARD CLEARED!';
  const subcopy = successName ? `${successName} made it happen!` : kind === 'match' ? 'A pair for the team!' : kind === 'hit' ? 'The fleet takes a hit!' : 'The whole class did it!';
  return <div className={`game-fanfare game-fanfare-${kind}`} role="status">
    <div className="game-fanfare-rays" aria-hidden="true" />
    <div className="game-fanfare-burst" aria-hidden="true">{Array.from({ length: kind === 'complete' ? 44 : 20 }, (_, index) => <i key={index} style={{ '--fanfare-angle': `${index * (kind === 'complete' ? 360 / 44 : 18)}deg`, '--fanfare-distance': `${80 + (index % 5) * (kind === 'complete' ? 34 : 18)}px` } as CSSProperties} />)}</div>
    <div className="game-fanfare-copy"><strong>{copy}</strong><span>{subcopy}</span></div>
  </div>;
}

function SharedMatchBoard({ matching, onFlip, projector = false, disabled = false }: { matching: MatchingState; onFlip?: (id: number) => void; projector?: boolean; disabled?: boolean }) {
  const [shownAttemptId, setShownAttemptId] = useState<string | null>(null);
  const [showSecond, setShowSecond] = useState(false);
  const [resolved, setResolved] = useState(false);
  const animatedAttemptId = useRef<string | null>(null);
  const attemptId = matching.attempt?.id ?? null;
  useEffect(() => {
    if (!attemptId || animatedAttemptId.current === attemptId) return;
    animatedAttemptId.current = attemptId;
    setShownAttemptId(attemptId); setShowSecond(false); setResolved(false);
    const second = window.setTimeout(() => setShowSecond(true), 650);
    const finish = window.setTimeout(() => setResolved(true), 1550);
    return () => { window.clearTimeout(second); window.clearTimeout(finish); };
  }, [attemptId]);
  // The player who made the second pick already knows a pair is being tried,
  // so show both cards as soon as its response arrives. Other players only
  // animate successful shared matches, one card at a time.
  const attempt = matching.attempt && ((matching.attempt.isActor && matching.attempt.id !== shownAttemptId) || (matching.attempt.id === shownAttemptId && (!resolved || matching.attempt.isMatch))) ? matching.attempt : null;
  const revealed = new Map<number, string>();
  matching.cards.forEach((card, id) => { if (card.symbol !== null) revealed.set(id, card.symbol); });
  if (matching.selectedCard && !attempt) revealed.set(matching.selectedCard.id, matching.selectedCard.symbol);
  if (attempt) {
    revealed.set(attempt.cards[0].id, attempt.cards[0].symbol);
    if (attempt.isActor || showSecond) revealed.set(attempt.cards[1].id, attempt.cards[1].symbol);
  }
  const denseBoard = matching.rows > 4;
  const matchFanfareId = matching.completionId ?? (matching.attempt?.isMatch ? matching.attempt.id : null);
  return <div className={`shared-match-board${projector ? ' projector-match-board' : ''}${denseBoard ? ' dense-match-board' : ''}`} style={{ gridTemplateColumns: `repeat(${matching.columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${matching.rows}, minmax(0, 1fr))` }} aria-label={projector ? 'Shared Match Pairs board' : 'Shared Match Pairs game area'}>
    {matching.cards.map((card, id) => {
      const symbol = revealed.get(id) ?? null;
      const canFlip = !projector && !disabled && !matching.complete && !matching.attempt && !card.matched && matching.selectedCard?.id !== id && ((matching.credits ?? 0) > 0 || matching.selectedCard !== null);
      const className = `shared-match-card${symbol !== null ? ' flipped' : ''}${card.matched ? ' matched' : ''}`;
      const label = symbol === null ? `Face-down card ${id + 1}` : `Card ${id + 1}: ${symbol}${card.matched ? ', matched' : ''}`;
      return projector ? <div key={id} className={className} aria-label={label}>{symbol !== null ? <span>{symbol}</span> : <b>?</b>}</div> : <button key={id} className={className} onClick={() => onFlip?.(id)} disabled={!canFlip} aria-label={label}>{symbol !== null ? <span>{symbol}</span> : <b>?</b>}</button>;
    })}
    <GameFanfare eventId={matchFanfareId} kind={matching.complete ? 'complete' : 'match'} successName={projector ? matching.attempt?.playerName : undefined} />
  </div>;
}

function ArcheryAim({ archery, disabled, hideControls = false, onShoot }: { archery: ArcheryState; disabled: boolean; hideControls?: boolean; onShoot: (x: number, y: number) => void }) {
  const [axis, setAxis] = useState<'x' | 'y'>('x');
  const [position, setPosition] = useState(0);
  const [x, setX] = useState<number | null>(null);
  const startedAt = useRef(performance.now());
  useEffect(() => {
    if (disabled) return;
    startedAt.current = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const phase = (now - startedAt.current) / 430;
      // The added harmonic increases speed through the centre while keeping a gentle stop-and-turn at either edge.
      const position = (Math.sin(phase) + (.07 * Math.sin(phase * 3))) / .93;
      setPosition(Math.round(position * 96));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [axis, disabled]);
  function lockAim() {
    if (disabled) return;
    if (axis === 'x') { setX(position); setAxis('y'); return; }
    onShoot(x ?? 0, position);
    setX(null); setAxis('x');
  }
  return <SharedArcheryBoard archery={archery} aim={{ axis, position, x, disabled, hideControls, onLock: lockAim }} />;
}

function SharedArcheryBoard({ archery, projector = false, compact = false, aim }: { archery: ArcheryState; projector?: boolean; compact?: boolean; aim?: { axis: 'x' | 'y'; position: number; x: number | null; disabled: boolean; hideControls?: boolean; onLock: () => void } }) {
  const seenAttempts = useRef<Set<string> | null>(null);
  const seenLastShot = useRef<ArcheryState['lastShot'] | undefined>(undefined);
  const [newestId, setNewestId] = useState<string | null>(null);
  const [newestLastShotId, setNewestLastShotId] = useState<string | null>(null);
  const [priorShots, setPriorShots] = useState<NonNullable<ArcheryState['lastShot']>[]>([]);
  useEffect(() => {
    const attempts = new Set(archery.attempts.map((attempt) => attempt.id));
    if (seenAttempts.current) { const newest = archery.attempts.find((attempt) => !seenAttempts.current?.has(attempt.id)); if (newest) setNewestId(newest.id); }
    seenAttempts.current = attempts;
  }, [archery.attempts]);
  useLayoutEffect(() => {
    const previousShot = seenLastShot.current;
    const nextShot = archery.lastShot;
    if (previousShot !== undefined && nextShot?.id && nextShot.id !== previousShot?.id) {
      setNewestLastShotId(nextShot.id);
      if (previousShot) setPriorShots((shots) => shots.some((shot) => shot.id === previousShot.id) ? shots : [...shots, previousShot]);
    }
    seenLastShot.current = nextShot;
  }, [archery.lastShot]);
  const attemptedIds = new Set(archery.attempts.map((attempt) => attempt.id));
  const playerOnlyShots = projector ? [] : [...priorShots.filter((shot) => !attemptedIds.has(shot.id)), ...(archery.lastShot && !attemptedIds.has(archery.lastShot.id) && !priorShots.some((shot) => shot.id === archery.lastShot?.id) ? [archery.lastShot] : [])];
  const visibleArrows = [...archery.attempts, ...playerOnlyShots];
  const arrowColors = ['#e85337', '#4f72d9', '#7a48b7', '#16846f', '#d48a1d', '#c64075'];
  const arrowColor = (id: string) => arrowColors[[...id].reduce((total, character) => total + character.charCodeAt(0), 0) % arrowColors.length];
  const target = <div className="archery-target"><div className="target-ring ring-outer" /><div className="target-ring ring-blue" /><div className="target-ring ring-red" /><div className="target-ring ring-gold" /><div className="target-ring ring-bull" />{visibleArrows.map((attempt) => <span key={attempt.id} className={`target-arrow${projector ? ' shared-target-mark' : ' player-target-arrow'}${attempt.id === newestId || attempt.id === newestLastShotId ? ' landing' : ''}${attempt.id === archery.lastShot?.id && !archery.attempts.some((shared) => shared.id === attempt.id) ? ' personal-arrow' : ''}`} style={{ left: `${50 + (attempt.x * .42)}%`, top: `${50 + (attempt.y * .42)}%`, '--arrow-color': arrowColor(attempt.id) } as CSSProperties} title={attempt.participantName ? `${attempt.participantName}: ${attempt.score}` : `${attempt.score} points`}>{projector ? '×' : <i />}</span>)}</div>;
  if (aim) {
    const xPosition = aim.axis === 'x' ? aim.position : aim.x ?? 0;
    const yPosition = aim.axis === 'y' ? aim.position : 0;
    return <div className={`shared-archery player-archery-board aiming-${aim.axis}`} aria-label="Click the target to lock your aim"><button type="button" className="archery-lock-target" disabled={aim.disabled} onClick={aim.onLock} aria-label={aim.axis === 'x' ? 'Lock horizontal aim' : 'Lock vertical aim and fire'}>{target}</button><div className={`archery-y-control${aim.hideControls ? ' archery-control-placeholder' : ''}`} aria-hidden="true"><i className="aim-center" /><b className="aim-marker" style={{ top: `${(yPosition + 100) / 2}%` }} /></div><div className={`archery-x-control${aim.hideControls ? ' archery-control-placeholder' : ''}`} aria-hidden="true"><i className="aim-center" /><b className="aim-marker" style={{ left: `${(xPosition + 100) / 2}%` }} /></div></div>;
  }
  return <div className={`shared-archery${projector ? ' projector-archery' : ''}${compact ? ' compact-archery-board' : ''}`} role="img" aria-label="Shared archery target showing the class best attempts">{target}<div className="archery-score-list">{archery.attempts.length ? archery.attempts.slice(0, compact ? 3 : 4).map((attempt, index) => <span key={attempt.id} style={{ '--arrow-color': arrowColor(attempt.id) } as CSSProperties}><b>{index + 1}</b>{attempt.participantName ? `${attempt.participantName} · ` : ''}{attempt.score}</span>) : <small>No attempts yet.</small>}</div></div>;
}

function SharedBattleshipBoard({ battleship, onAttack, projector = false, disabled = false }: { battleship: BattleshipState; onAttack?: (cell: number) => void; projector?: boolean; disabled?: boolean }) {
  const labels = 'ABCDEFGHIJ';
  const seenHitCells = useRef<Set<number> | null>(null);
  const [hitFanfare, setHitFanfare] = useState<{ id: string; successName?: string } | null>(null);
  useEffect(() => {
    const hitCells = new Set(battleship.cells.flatMap((cell, index) => cell.result === 'hit' ? [index] : []));
    if (seenHitCells.current) {
      const newHits = [...hitCells].filter((cell) => !seenHitCells.current?.has(cell));
      if (newHits.length) {
        const latestCell = newHits[newHits.length - 1];
        setHitFanfare({ id: `${battleship.hits}-${newHits.join('-')}`, successName: projector && battleship.lastHit?.cell === latestCell ? battleship.lastHit.participantName : undefined });
      }
    }
    seenHitCells.current = hitCells;
  }, [battleship.cells, battleship.hits]);
  return <div className={`shared-battleship${projector ? ' projector-battleship' : ''}`} role="grid" aria-label={projector ? 'Shared Battleship map' : 'Battleship attack map'} style={{ gridTemplateColumns: `26px repeat(${battleship.size}, minmax(0, 1fr))` }}>
    <span className="battleship-corner" />
    {Array.from({ length: battleship.size }, (_, column) => <span className="battleship-label battleship-column-label" key={`column-${column}`}>{labels[column]}</span>)}
    {Array.from({ length: battleship.size }, (_, row) => <div className="battleship-row" key={row}><span className="battleship-label">{row + 1}</span>{Array.from({ length: battleship.size }, (_, column) => {
      const cell = row * battleship.size + column;
      const result = battleship.cells[cell]?.result;
      const label = `${labels[column]}${row + 1}${result ? `, ${result}` : ', unmarked'}`;
      const className = `battleship-cell${result ? ` ${result}` : ''}`;
      return projector ? <span className={className} key={cell} aria-label={label}>{result === 'hit' ? '✦' : result === 'miss' ? '•' : ''}</span> : <button className={className} key={cell} aria-label={label} disabled={disabled || battleship.complete || result !== null || (battleship.tokens ?? 0) < 1} onClick={() => onAttack?.(cell)}>{result === 'hit' ? '✦' : result === 'miss' ? '•' : ''}</button>;
    })}</div>)}
    <GameFanfare eventId={battleship.completionId ?? hitFanfare?.id ?? null} kind={battleship.complete ? 'complete' : 'hit'} successName={hitFanfare?.successName} />
  </div>;
}

function SharedTreasureMap({ map, onDig, projector = false, disabled = false }: { map: TreasureMapState; onDig?: (cell: number) => void; projector?: boolean; disabled?: boolean }) {
  const labels = 'ABCDEFGHIJKLMN';
  const clues = map.cells.flatMap((cell, index) => cell.result === 'clue' && cell.hint ? [{ coordinate: `${labels[index % map.size]}${Math.floor(index / map.size) + 1}`, hint: cell.hint }] : []);
  const visibleClues = clues.slice(projector ? -3 : -2);
  const clueMarker = (hint: string | null) => {
    const match = hint?.match(/The treasure is ([\w-]+)\.$/);
    if (match) {
      const arrows: Record<string, string> = { north: '↑', south: '↓', east: '→', west: '←', 'north-east': '↗', 'north-west': '↖', 'south-east': '↘', 'south-west': '↙' };
      return arrows[match[1]] ?? '•';
    }
    if (hint?.includes('torn map')) return 'MAP';
    if (hint?.includes('landmark')) return 'LAND';
    if (hint?.includes('warmer')) return 'WARM';
    if (hint?.includes('colder')) return 'COLD';
    if (hint?.includes('just as warm')) return 'SAME';
    if (hint?.includes('odd-numbered')) return 'ODD';
    if (hint?.includes('even-numbered')) return 'EVEN';
    return 'CLUE';
  };
  return <div className={`shared-treasure-map${projector ? ' projector-treasure-map' : ''}${map.size > 7 ? ' dense-treasure-map' : ''}`} role="grid" aria-label={projector ? 'Shared Treasure Map' : 'Treasure Map'} style={{ gridTemplateColumns: `26px repeat(${map.size}, minmax(0, 1fr))`, gridTemplateRows: `26px repeat(${map.size}, minmax(0, 1fr)) auto` }}>
    <span className="treasure-map-corner" />
    {Array.from({ length: map.size }, (_, column) => <span className="treasure-map-label treasure-map-column-label" key={`column-${column}`}>{labels[column]}</span>)}
    {Array.from({ length: map.size }, (_, row) => <div className="treasure-map-row" key={row}><span className="treasure-map-label">{row + 1}</span>{Array.from({ length: map.size }, (_, column) => {
      const cell = row * map.size + column;
      const discovery = map.cells[cell];
      const label = `${labels[column]}${row + 1}${discovery?.terrain === 'stream' ? ', stream, cannot be explored' : discovery?.result === 'treasure' ? ', treasure found' : discovery?.hint ? `, ${discovery.hint}` : ', unexplored'}`;
      const className = `treasure-map-cell ${discovery?.terrain ?? 'land'}${discovery?.result ? ` ${discovery.result}` : ''}`;
      const contents = discovery?.terrain === 'stream' ? '≈' : discovery?.result === 'treasure' ? '💎' : discovery?.result === 'clue' ? <small>{clueMarker(discovery.hint)}</small> : '';
      return projector ? <span className={className} key={cell} aria-label={label} title={discovery?.hint ?? undefined}>{contents}</span> : <button className={className} key={cell} aria-label={label} title={discovery?.hint ?? undefined} disabled={disabled || map.complete || discovery?.terrain === 'stream' || Boolean(discovery?.result) || (map.tokens ?? 0) < 1} onClick={() => onDig?.(cell)}>{contents}</button>;
    })}</div>)}
    {visibleClues.length > 0 && <div className="treasure-map-hints" role="status" aria-label="Latest treasure clues">{visibleClues.map((clue) => <p key={clue.coordinate}><b>{clue.coordinate}</b><span>{clue.hint}</span></p>)}</div>}
    <GameFanfare eventId={map.completionId} kind="complete" successName={projector ? map.lastDig?.participantName : undefined} />
  </div>;
}

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

function playTowerTone(kind: 'stack' | 'perfect' | 'miss', volume: number) {
  if (volume === 0) return;
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = kind === 'perfect' ? 760 : kind === 'stack' ? 490 : 150;
    oscillator.type = kind === 'miss' ? 'sawtooth' : 'sine';
    gain.gain.setValueAtTime(.06 * (volume / 100), context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .16);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + .16);
  } catch { /* Audio is optional and may be blocked by the browser. */ }
}

function TowerStackGame({ title, durationSeconds, onComplete }: { title: string; durationSeconds: number; onComplete: () => void }) {
  const { volume } = useAudioSettings();
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
    if (overlapWidth <= .8) { playTowerTone('miss', volume); setMissed(true); setFinished(true); return; }
    const perfect = Math.abs(movingX - base.x) <= 1;
    const nextCombo = perfect ? combo + 1 : 0;
    const nextBlock = { id: tower.length, x: perfect ? base.x : overlapStart, width: perfect ? base.width : overlapWidth };
    const points = 10 + tower.length + (perfect ? 25 + Math.max(0, nextCombo - 1) * 5 : 0);
    playTowerTone(perfect ? 'perfect' : 'stack', volume);
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

function Player({ quiz, onSubmitAnswer, onCompleteItem, onFinished, allowRestart = true, onRestart, studentName, archery, onShootArchery }: { quiz: Quiz; onSubmitAnswer?: (questionId: string, answer: string) => Promise<unknown>; onCompleteItem?: (questionId: string) => Promise<unknown>; onFinished?: () => void; allowRestart?: boolean; onRestart?: () => void; studentName?: string; archery?: ArcheryState & { shootingScore?: number }; onShootArchery?: (x: number, y: number) => Promise<ArcheryState & { shootingScore?: number }> }) {
  const savedProgress = quiz.questions.some((item) => item.completed);
  const firstUnfinishedItem = quiz.questions.findIndex((item) => !item.completed);
  const resumeItem = firstUnfinishedItem === -1 ? Math.max(0, quiz.questions.length - 1) : firstUnfinishedItem;
  const [screen, setScreen] = useState<Screen>(() => quiz.questions.length ? savedProgress ? 'question' : 'intro' : 'results');
  const [current, setCurrent] = useState(() => resumeItem);
  const [answers, setAnswers] = useState<Record<string, string>>(() => Object.fromEntries(quiz.questions.flatMap((item) => item.answer === null || item.answer === undefined ? [] : [[String(item.id), item.answer]])));
  const [revealedQuestionIds, setRevealedQuestionIds] = useState<Set<string | number>>(() => new Set(quiz.questions.filter((item) => item.answer !== null && item.answer !== undefined).map((item) => item.id)));
  const [timedOutQuestionIds, setTimedOutQuestionIds] = useState<Set<string | number>>(() => new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [remainingMilliseconds, setRemainingMilliseconds] = useState<number | null>(null);
  const [matchingProgress, setMatchingProgress] = useState<Record<string, MatchProgress>>({});
  const [archeryState, setArcheryState] = useState<(ArcheryState & { shootingScore?: number }) | undefined>(archery);
  const [playingHomeworkArchery, setPlayingHomeworkArchery] = useState(false);
  const questionDeadline = useRef<{ id: string | number; endsAt: number } | null>(null);
  const question = quiz.questions[current];
  const options = useMemo(() => question ? questionOptions(question, quiz.guid) : [], [question, quiz.guid]);
  const timerSeconds = question?.itemType === 'question' ? effectiveTimerSeconds(question.timerSeconds, quiz.defaultTimerSeconds) : null;
  const selected = question ? answers[question.id] : undefined;
  const revealed = question ? revealedQuestionIds.has(question.id) : false;
  const isFinalQuestion = current === quiz.questions.length - 1;

  useEffect(() => {
    if (screen !== 'question' || !question || question.itemType !== 'question' || !revealed || submitting || (archeryState && onShootArchery)) return;
    const timer = window.setTimeout(() => void checkOrAdvance(), 5000);
    return () => window.clearTimeout(timer);
  }, [screen, question, revealed, submitting, current, archeryState, onShootArchery]);

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

  useEffect(() => { setArcheryState(archery); }, [archery]);
  useEffect(() => { setPlayingHomeworkArchery(false); }, [question?.id]);

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
      const result = await onSubmitAnswer?.(String(question.id), answer) as { answered?: boolean; matchProgress?: MatchProgress; isCorrect?: boolean; archery?: ArcheryState & { shootingScore?: number } } | undefined;
      if (question.special?.kind === 'matching' && result?.matchProgress) setMatchingProgress((current) => ({ ...current, [question.id]: result.matchProgress! }));
      if (question.special?.kind === 'matching' && result?.answered === false && result.matchProgress) { setAnswers((current) => { const next = { ...current }; delete next[question.id]; return next; }); return; }
      if (question.special?.kind === 'matching') setAnswers((current) => ({ ...current, [question.id]: result?.isCorrect ? 'Matched' : 'Not matched' }));
      if (result?.archery) setArcheryState(result.archery);
      setRevealedQuestionIds((ids) => new Set(ids).add(question.id));
    } catch (error) {
      setAnswers((currentAnswers) => { const updated = { ...currentAnswers }; delete updated[question.id]; return updated; });
      setSubmissionError(error instanceof Error ? error.message : 'Could not save your answer');
    } finally { setSubmitting(false); }
  }

  async function shootArrow(x: number, y: number) {
    if (!onShootArchery) return;
    setSubmissionError(''); setSubmitting(true);
    try { setArcheryState(await onShootArchery(x, y)); }
    catch (error) { setSubmissionError(error instanceof Error ? error.message : 'Could not save your shot'); }
    finally { setSubmitting(false); }
  }

  async function checkOrAdvance() {
    setSubmissionError(''); setSubmitting(true);
    try {
      if (!selected) await onCompleteItem?.(String(question.id));
      if (isFinalQuestion) { setScreen('results'); onFinished?.(); } else setCurrent((value) => value + 1);
    } catch (error) { setSubmissionError(error instanceof Error ? error.message : 'Could not save your answer'); }
    finally { setSubmitting(false); }
  }

  if (screen === 'results') return <Results quiz={quiz} answers={answers} onRestart={onRestart ?? (allowRestart ? restart : undefined)} onLeave={() => goToQuiz('')} />;

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
  if (question.itemType === 'text') return <main className="page quiz-page">
    <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">Message {current + 1} of {quiz.questions.length}</span></header>
    <div className="progress" aria-hidden="true"><span style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} /></div>
    <section className="intro-card text-item-card"><p className="eyebrow">A NOTE FOR YOU</p><h1>{personalizeText(question.text, studentName)}</h1><button className="primary-button" disabled={submitting} onClick={() => void finishGame()}>{submitting ? 'Saving…' : isFinalQuestion ? 'Finish quiz' : 'Continue'} <span aria-hidden="true">→</span></button>{submissionError && <p className="form-error">{submissionError}</p>}</section>
  </main>;
  if (revealed && archeryState && onShootArchery && playingHomeworkArchery) return <main className={`page quiz-page archery-player-page theme-${quiz.theme}`}>
    <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">ARCHERY BREAK</span></header>
    <section className="game-card archery-game-card"><div className="game-heading"><div><p className="eyebrow">HOMEWORK ARCHERY</p><h1>Aim your arrow</h1><p>Watch the lower bar, then tap the target to lock it. Repeat for the side bar.</p></div><div className="game-stats"><span>Arrows <strong>{archeryState.arrows}</strong></span><span>Score <strong>{archeryState.shootingScore ?? 0}</strong></span></div></div><ArcheryAim archery={archeryState} disabled={submitting || (archeryState.arrows ?? 0) < 1} hideControls={(archeryState.arrows ?? 0) < 1} onShoot={(x, y) => void shootArrow(x, y)} /><p className={`game-tip archery-token-tip${(archeryState.arrows ?? 0) > 0 ? ' is-reserved' : ''}`}>Answer more questions correctly to earn another arrow.</p>{submissionError && <p className="form-error">{submissionError}</p>}<div className="matching-game-actions"><button className="matching-secondary-button" disabled={submitting} onClick={() => void checkOrAdvance()}>{submitting ? 'Saving…' : isFinalQuestion ? 'See my score' : 'Next question →'}</button></div></section>
  </main>;
  if (revealed && archeryState && onShootArchery) {
    const canPlay = (archeryState.arrows ?? 0) > 0;
    return <main className={`page quiz-page theme-${quiz.theme}`}><KidsConfetti active={quiz.theme === 'kids' && !timedOut && selected === question.correctAnswer} /><header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-label">ARCHERY BREAK</span></header><section className="intro-card waiting-card matching-break-card"><p className="eyebrow">QUESTION {String(current + 1).padStart(2, '0')}</p><h1 data-confetti-origin={selected === question.correctAnswer && !timedOut ? '' : undefined}>{timedOut ? "Time's up." : selected === question.correctAnswer ? 'Correct!' : 'Not quite.'}</h1>{selected !== question.correctAnswer && <p className="matching-answer">The correct answer was <strong>{question.correctAnswer}</strong>.</p>}<div className="matching-credit-summary"><span>YOUR ARROWS</span><strong>{archeryState.arrows}</strong><small>{canPlay ? 'Ready to aim for the bullseye' : 'Answer more questions correctly to earn an arrow'}</small></div><div className="matching-actions">{canPlay && <button className="matching-secondary-button" onClick={() => setPlayingHomeworkArchery(true)}>Take a shot</button>}<button className="primary-button" disabled={submitting} onClick={() => void checkOrAdvance()}>{submitting ? 'Saving…' : isFinalQuestion ? 'See my score' : 'Next question'} <span aria-hidden="true">→</span></button></div>{submissionError && <p className="form-error">{submissionError}</p>}</section></main>;
  }
  return <main className="page quiz-page">
    <KidsConfetti active={quiz.theme === 'kids' && revealed && !timedOut && selected === question.correctAnswer} />
    <header className="quiz-header"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><span className="question-header-meta"><span className="question-label">Question {current + 1} of {quiz.questions.length}</span>{remainingSeconds !== null && <TimerBadge seconds={remainingSeconds} expired={remainingSeconds === 0} />}</span></header>
    <div className="progress" aria-hidden="true"><span style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} /></div>
    <section className={`question-card${question.special?.kind === 'matching' ? ' matching-question-card' : ''}${timerStyle ? ' timed-question' : ''}`} style={timerStyle}>
      <p className="eyebrow">QUESTION {String(current + 1).padStart(2, '0')}</p>
      <h1>{question.text}</h1>
      {question.special?.kind === 'true_false' && <p className="lede">{question.special.statement}</p>}
      {question.special?.kind === 'matching' ? <MatchingQuestion key={question.id} pairs={question.special.pairs} progress={matchingProgress[question.id] ?? question.matchProgress ?? null} disabled={revealed || submitting} onMatch={(left, right) => void lockAnswer(`match:${left}:${right}`)} /> : <div className="options" role="radiogroup" aria-label="Answer choices">
        {options.map((option, index) => {
          const status = revealed ? option === question.correctAnswer ? 'correct' : selected === option ? 'incorrect' : '' : selected === option ? 'selected' : '';
          return <button key={option} className={`option ${status}`} data-confetti-origin={revealed && option === question.correctAnswer ? '' : undefined} role="radio" aria-checked={selected === option} disabled={revealed || submitting} onClick={() => void lockAnswer(option)}><span className="option-key">{String.fromCharCode(65 + index)}</span><span>{option}</span>{revealed && option === question.correctAnswer && <strong className="answer-status">Correct answer</strong>}{revealed && option === selected && option !== question.correctAnswer && <strong className="answer-status">Your answer</strong>}</button>;
        })}
      </div>}
      {revealed && <p className={selected === question.correctAnswer && !timedOut ? 'answer-feedback correct-feedback' : 'answer-feedback incorrect-feedback'} role="status">{question.special?.kind === 'matching' ? timedOut ? "Time's up." : selected === question.correctAnswer ? 'All pairs matched ? nice work!' : 'No tries left. Better luck next time.' : timedOut ? selected ? `Time's up. Your answer was ${selected === question.correctAnswer ? 'correct' : 'not correct'}. The correct answer is ${question.correctAnswer}.` : `Time's up. The correct answer is ${question.correctAnswer}.` : selected === question.correctAnswer ? 'Correct — nice work!' : `Not quite. The correct answer is ${question.correctAnswer}.`}</p>}
      {submissionError && <p className="form-error">{submissionError}</p>}<div className="question-actions"><span />{revealed && <button key={question.id} className={`primary-button${!submitting ? ' advance-timer' : ''}`} disabled={submitting} onClick={() => void checkOrAdvance()}>{!submitting && <AdvanceTimer />}{submitting ? 'Saving…' : isFinalQuestion ? 'See my score' : 'Next question'} <span aria-hidden="true">→</span></button>}</div>
    </section>
  </main>;
}

export function TeacherFacilitatorScreen(props: { sessionId: string; token: string; projector?: boolean }) { return <><Facilitator {...props} /><ConfirmDialogHost /></>; }
export function TeacherHomeworkScreen(props: { sessionId: string; token: string }) { return <><HomeworkTeacher {...props} /><ConfirmDialogHost /></>; }

function AppContent() {
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
  if (moderatedPin) return <><VolumeControl /><ModeratedStudent key={moderatedPin} pin={moderatedPin} /></>;
  if (homeworkSessionId) return <><VolumeControl /><HomeworkStudent key={homeworkSessionId} sessionId={homeworkSessionId} /></>;
  if (homeworkTeacherId) return <LegacyTeacherRedirect path={`/teacher/homework/${homeworkTeacherId}`} />;
  if (projectorId) return <LegacyTeacherRedirect path={`/teacher/projector/${projectorId}`} />;
  if (facilitatorId) return <LegacyTeacherRedirect path={`/teacher/live/${facilitatorId}`} />;
  if (path === '/moderated') return <ModeratedPinEntry />;
  if (!guid) return <ModeratedPinEntry />;
  if (loading) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><div className="loader" aria-label="Loading quiz" /><p>Loading your quiz…</p></main>;
  if (error || !quiz) return <main className="page status-page"><div className="brand"><span className="brand-mark">Q</span> Quizboard</div><section className="error-card"><p className="eyebrow">QUIZ UNAVAILABLE</p><h1>We couldn’t open that quiz.</h1><p>{error || 'Try pasting the quiz ID again.'}</p><QuizCodeForm initialCode={guid} onSubmit={goToQuiz} /><button className="text-button" onClick={() => goToQuiz('')}>Use another quiz</button></section></main>;
  return <><VolumeControl /><div className={`student-app theme-${quiz.theme}`}><Player key={quiz.guid} quiz={quiz} /></div></>;
}

export default function App() {
  return <AudioSettingsProvider><AppContent /><ConfirmDialogHost /></AudioSettingsProvider>;
}
