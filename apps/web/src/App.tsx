import { SpecialQuestionForm } from './SpecialQuestionForm';
import { DataSetsPage, ImportPage } from './DataSets';
import { confirmAction, ConfirmDialog, ConfirmDialogHost } from './ConfirmDialog';
import { ConfirmDialogHost as StudentConfirmDialogHost } from '../../student/src/ConfirmDialog';
import { Facilitator, HomeworkProjector, HomeworkTeacher } from '../../student/src/App';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
type QuizTheme = 'standard' | 'kids' | 'christmas' | 'halloween';
type AnswerMatching = 'exact' | 'close';
const themeLabels: Record<QuizTheme, string> = { standard: 'Standard', kids: 'Kid-friendly', christmas: 'Christmas', halloween: 'Halloween' };
const sessionModeLabels: Record<string, string> = { classic: 'Classic', facilitated: 'Facilitated', matching: 'Matching', battleship: 'Battleship', treasure_map: 'Treasure Map', archery: 'Archery', curling: 'Curling' };
type Quiz = { id: number; guid: string; title: string; description: string | null; archivedAt: string | null; randomizeQuestionOrder: boolean; theme: QuizTheme; answerMatching: AnswerMatching; defaultTimerSeconds: number; matchingPairCount: number; battleshipBoardSize: number; creditEveryCorrectAnswers: number; _count?: { questions: number } };
type QuizItemType = 'question' | 'game' | 'text';
type GameType = 'coin_catch' | 'match_pairs' | 'tower_stack';
type SpecialOptions = { kind: 'true_false'; statement: string } | { kind: 'matching'; pairs: { question: string; answer: string }[] } | { kind: 'short_answer'; pairs: { question: string; answer: string }[] };
type Question = { id: number; text: string; options: string[] | SpecialOptions; correctAnswer: string; isEnabled: boolean; itemType: QuizItemType; gameType?: GameType | null; gameDurationSeconds?: number | null; answerPoolId?: number | null; answerCount?: number | null; timerSeconds: number | null; answerPool?: { name: string } | null };
type QuizDetail = Quiz & { questions: Question[] };
type AnswerPool = { id: number; name: string; answers: { id: number; value: string }[]; _count?: { questions: number; commonQuestions: number } };
type CommonQuestion = Question & { answerPool?: AnswerPool | null };
type QuestionData = { questionType?: 'true_false' | 'matching' | 'short_answer'; statement?: string; pairs?: { question: string; answer: string }[]; text: string; correctAnswer: string; wrongAnswers?: string[]; answerPoolId?: number; answerCount?: number; timerSeconds?: number | null };
type QuestionPreviewData = { text: string; options: string[]; special?: SpecialOptions };
type PoolData = { name: string; answers: string[] };
type ModeratedSession = { sessionId: string; pin: string; phase: 'lobby' };
type HomeworkSession = { sessionId: string };

const TIMER_SECONDS = [-1, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180] as const;
const GAME_DURATION_SECONDS = [10, 15, 20, 30, 45, 60, 90, 120] as const;
const MATCHING_BOARD_SIZES = [{ pairs: 2, label: '2 × 2 · 2 pairs' }, { pairs: 4, label: '4 × 2 · 4 pairs' }, { pairs: 6, label: '4 × 3 · 6 pairs' }, { pairs: 8, label: '4 × 4 · 8 pairs' }, { pairs: 18, label: '6 × 6 · 18 pairs' }, { pairs: 32, label: '8 × 8 · 32 pairs' }, { pairs: 50, label: '10 × 10 · 50 pairs' }] as const;
const BATTLESHIP_BOARD_SIZES = [{ size: 6, boats: 3 }, { size: 8, boats: 4 }, { size: 10, boats: 5 }] as const;
const CREDIT_EARNING_INTERVALS = [1, 2, 3] as const;
function timerSettingLabel(seconds: number | null) {
  if (seconds === null) return 'Use quiz default';
  if (seconds === -1) return 'Unlimited';
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes ? `${minutes} min${remainder ? ` ${remainder} sec` : ''}` : `${seconds} seconds`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...options?.headers }, ...options });
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(Array.isArray(body?.message) ? body.message.join(', ') : body?.message || 'Something went wrong'); }
  return response.json() as Promise<T>;
}
function teacherAppUrl() {
  const configuredUrl = import.meta.env.VITE_TEACHER_APP_URL;
  return (configuredUrl && configuredUrl !== 'https://placeholder.invalid' ? configuredUrl : window.location.origin).replace(/\/$/, '');
}
function dateTimeLocalValue(value: Date) { return new Date(value.getTime() - (value.getTimezoneOffset() * 60000)).toISOString().slice(0, 16); }
function useRoute() { const [path, setPath] = useState(window.location.pathname); useEffect(() => { const update = () => setPath(window.location.pathname); window.addEventListener('popstate', update); return () => window.removeEventListener('popstate', update); }, []); const go = (nextPath: string) => { window.history.pushState({}, '', nextPath); setPath(nextPath); }; return { path, go }; }

function AdminShell({ path, go, children }: { path: string; go: (value: string) => void; children: ReactNode }) {
  const items = [{ path: '/quizzes', label: 'Quizzes', icon: '▦' }, { path: '/running', label: 'Running Quizzes', icon: '▶' }, { path: '/games', label: 'Games', icon: '★' }, { path: '/questions', label: 'Common Questions', icon: '?' }, { path: '/answer-pools', label: 'Answer Pools', icon: '◌' }, { path: '/data-sets', label: 'Data Sets', icon: '≡' }, { path: '/import', label: 'Import', icon: '↓' }]; const active = path.startsWith('/quizzes/') ? '/quizzes' : path;
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('quizboard-admin-dark-mode') === 'true');
  useEffect(() => { localStorage.setItem('quizboard-admin-dark-mode', String(darkMode)); }, [darkMode]);
  return <><div className={`admin-shell${darkMode ? ' dark-mode' : ''}`}><aside className="sidebar"><button className="brand" onClick={() => go('/quizzes')}><span className="brand-mark">Q</span><span>Quizboard<small>ADMIN PORTAL</small></span></button><nav aria-label="Main navigation">{items.map((item) => <button key={item.path} className={active === item.path ? 'nav-link active' : 'nav-link'} onClick={() => go(item.path)}><span>{item.icon}</span>{item.label}</button>)}</nav><div className="sidebar-bottom"><button className="theme-toggle" type="button" aria-pressed={darkMode} onClick={() => setDarkMode((enabled) => !enabled)}><span>{darkMode ? '☀' : '☾'}</span>{darkMode ? 'Light mode' : 'Dark mode'}</button><div className="sidebar-foot"><span className="avatar">AD</span><div><strong>Admin</strong><small>Content manager</small></div></div></div></aside><div className="page-wrap"><header className="topbar"><div><span className="crumb">ADMINISTRATION</span><span className="topbar-title">Quiz management</span></div><button className="help-button" aria-label="Help">?</button></header><div className="content" role="main">{children}</div></div></div><ConfirmDialogHost /><StudentConfirmDialogHost /></>;
}
function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) { return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</div>; }
function Empty({ icon, title, copy }: { icon: string; title: string; copy: string }) { return <div className="empty"><span>{icon}</span><h3>{title}</h3><p>{copy}</p></div>; }
function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) { return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className={wide ? 'modal modal-wide' : 'modal'} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button className="close-button" onClick={onClose} aria-label="Close">×</button></div>{children}</section></div>; }

const TEMP_TEACHER_PASSWORD = 'testing';
function TeacherPasswordPrompt({ onUnlock }: { onUnlock: (password: string) => void }) {
  const [password, setPassword] = useState(''), [error, setError] = useState('');
  function unlock(event: FormEvent) { event.preventDefault(); if (password !== TEMP_TEACHER_PASSWORD) { setError('Incorrect teacher password'); return; } onUnlock(password); }
  return <main className="teacher-password-page"><section className="surface teacher-password-card"><p className="eyebrow">TEACHER ACCESS</p><h1>Enter teacher password</h1><p>This area is for teachers only.</p><form onSubmit={unlock}><label>Password<input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="error">{error}</p>}<button className="primary">Continue</button></form></section></main>;
}

type RunningSession = { sessionId: string; title: string; participantCount: number; createdAt: string; endsAt: string | null; kind: 'live' | 'homework'; pin?: string; mode?: string; phase?: string; ended?: boolean; expired?: boolean };
type SessionView = 'details' | 'metrics' | 'presenter';
function RunningQuizzesPage({ go, teacherPassword }: { go: (path: string) => void; teacherPassword: string }) {
  const [sessions, setSessions] = useState<RunningSession[]>([]), [homeworkHistory, setHomeworkHistory] = useState<RunningSession[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [opening] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null), [endingSessionId, setEndingSessionId] = useState<string | null>(null), [anonymizingSessionId, setAnonymizingSessionId] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [live, homework, history] = await Promise.all([request<Omit<RunningSession, 'kind'>[]>('/moderated-sessions'), request<Omit<RunningSession, 'kind'>[]>('/homework-sessions'), request<Omit<RunningSession, 'kind'>[]>('/homework-sessions/history')]);
      setSessions([...live.map((session) => ({ ...session, kind: 'live' as const })), ...homework.map((session) => ({ ...session, kind: 'homework' as const }))].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setHomeworkHistory(history.map((session) => ({ ...session, kind: 'homework' as const })));
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load running quizzes'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function openSession(session: RunningSession, view: SessionView) {
    go(`/running/${session.kind}/${session.sessionId}/${view}`);
  }
  function choose(session: RunningSession, view: SessionView) {
    void openSession(session, view);
  }
  async function deleteHistory(session: RunningSession) {
    setDeletingSessionId(session.sessionId); setError('');
    try {
      await request(`/homework-sessions/${session.sessionId}?token=${encodeURIComponent(teacherPassword)}`, { method: 'DELETE' });
      setHomeworkHistory((current) => current.filter((item) => item.sessionId !== session.sessionId));
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not delete this homework history item'); }
    finally { setDeletingSessionId(null); }
  }
  async function anonymizeHistory(session: RunningSession) {
    setAnonymizingSessionId(session.sessionId); setError('');
    try {
      await request(`/homework-sessions/${session.sessionId}/anonymize`, { method: 'POST', body: JSON.stringify({ facilitatorToken: teacherPassword }) });
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not anonymize this homework history item'); }
    finally { setAnonymizingSessionId(null); }
  }
  async function endSession(session: RunningSession) {
    setEndingSessionId(session.sessionId); setError('');
    try {
      const path = session.kind === 'live' ? `/moderated-sessions/${session.sessionId}/end` : `/homework-sessions/${session.sessionId}/end`;
      await request(path, { method: 'POST', body: JSON.stringify({ facilitatorToken: teacherPassword }) });
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not end this session'); }
    finally { setEndingSessionId(null); }
  }
  function SessionList({ items, history = false }: { items: RunningSession[]; history?: boolean }) {
    return <div className="data-list">{items.map((session) => {
      const isEnding = endingSessionId === session.sessionId;
      const isAnonymizing = anonymizingSessionId === session.sessionId;
      const mode = session.mode ?? 'classic';
      const summary = session.kind === 'live'
        ? `${session.phase === 'lobby' ? 'Lobby' : 'In progress'} · PIN ${session.pin}`
        : `${history ? session.expired ? 'Expired' : 'Ended' : 'In progress'}`;
      return <article className="quiz-row running-session-row" key={`${session.kind}-${session.sessionId}`}>
        <span className="list-icon">{session.kind === 'live' ? '▶' : '⌂'}</span>
        <span className="row-main"><strong>{session.title}</strong><small>{summary} · {session.participantCount} participant{session.participantCount === 1 ? '' : 's'} · Created {new Date(session.createdAt).toLocaleString()}{session.endsAt ? ` · ${history ? 'Closed' : 'Ends'} ${new Date(session.endsAt).toLocaleString()}` : ''}</small></span>
        <span className="running-session-labels" aria-label={`Type ${session.kind === 'live' ? 'Live' : 'Homework'}, mode ${sessionModeLabels[mode] ?? mode}`}><b>{session.kind === 'live' ? 'Live' : 'Homework'}</b><em>{sessionModeLabels[mode] ?? mode}</em></span>
        <span className="running-session-actions">
          <button className="subtle-button" onClick={() => choose(session, 'details')} disabled={opening}>Details</button>
          <button className="subtle-button" onClick={() => choose(session, 'metrics')} disabled={opening}>Metrics</button>
          <button className="subtle-button" onClick={() => choose(session, 'presenter')} disabled={opening}>Presenter</button>
          {!history && <button className="end-session-button" onClick={() => confirmAction({ title: session.kind === 'live' ? 'End live quiz?' : 'End homework?', message: session.kind === 'live' ? 'Participants will no longer be able to answer this quiz.' : 'Students will no longer be able to answer or join this homework.', confirmLabel: session.kind === 'live' ? 'End quiz' : 'End homework', onConfirm: () => void endSession(session) })} disabled={endingSessionId !== null}>{isEnding ? 'Ending…' : 'End session'}</button>}
          {history && <button className="history-anonymize" onClick={() => confirmAction({ title: 'Anonymize homework history?', message: 'Permanently replace student names with Student 1, Student 2, and so on in saved attempts and reports? This cannot be undone.', confirmLabel: 'Anonymize names', onConfirm: () => void anonymizeHistory(session) })} disabled={deletingSessionId !== null || anonymizingSessionId !== null}>{isAnonymizing ? 'Anonymizing…' : 'Anonymize'}</button>}
          {history && <button className="history-delete" onClick={() => confirmAction({ title: 'Delete homework history?', message: `Permanently delete “${session.title}” and all saved attempts?`, confirmLabel: 'Delete history', onConfirm: () => void deleteHistory(session) })} disabled={deletingSessionId !== null || anonymizingSessionId !== null}>{deletingSessionId === session.sessionId ? 'Deleting…' : 'Delete'}</button>}
        </span>
      </article>;
    })}</div>;
  }
  return <><PageHeading eyebrow="SESSIONS" title="Running Quizzes" description="Open session details, metrics, and presenter mode from one place." /><section className="surface"><div className="surface-head"><div><h2>Active sessions</h2><p>Live lobbies and quizzes, and homework that has not ended</p></div><button className="subtle-button" onClick={() => void load()} disabled={loading}>Refresh</button></div>{error && <p className="error">{error}</p>}{loading ? <p className="state">Loading sessions...</p> : sessions.length === 0 ? <Empty icon="▶" title="No running quizzes" copy="Launch a live quiz or homework to see it here." /> : <SessionList items={sessions} />}</section>{!loading && homeworkHistory.length > 0 && <section className="surface session-history"><div className="surface-head"><div><h2>Homework history</h2><p>Closed homework remains available with every saved attempt and Archery score.</p></div></div><SessionList items={homeworkHistory} history /></section>}</>;
}

function QuizList({ go }: { go: (path: string) => void }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]), [showCreate, setShowCreate] = useState(false), [title, setTitle] = useState(''), [description, setDescription] = useState(''), [error, setError] = useState(''), [saving, setSaving] = useState(false), [mutatingQuizId, setMutatingQuizId] = useState<number | null>(null);
  const load = useCallback(async () => { try { setQuizzes(await request<Quiz[]>('/quizzes')); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load quizzes'); } }, []); useEffect(() => { void load(); }, [load]);
  async function createQuiz(event: FormEvent) { event.preventDefault(); setSaving(true); setError(''); try { const quiz = await request<Quiz>('/quizzes', { method: 'POST', body: JSON.stringify({ title, description: description || undefined }) }); go(`/quizzes/${quiz.id}`); } catch (err) { setError(err instanceof Error ? err.message : 'Could not create quiz'); } finally { setSaving(false); } }
  const activeQuizzes = quizzes.filter((quiz) => !quiz.archivedAt), archivedQuizzes = quizzes.filter((quiz) => quiz.archivedAt);
  async function updateArchiveState(quiz: Quiz, action: 'archive' | 'restore') {
    setMutatingQuizId(quiz.id); setError('');
    try {
      const updated = await request<Quiz>(`/quizzes/${quiz.id}/${action}`, { method: 'PATCH' });
      setQuizzes((current) => current.map((item) => item.id === quiz.id ? { ...item, ...updated } : item));
    } catch (err) { setError(err instanceof Error ? err.message : `Could not ${action} this quiz`); }
    finally { setMutatingQuizId(null); }
  }
  async function deleteQuiz(quiz: Quiz) {
    setMutatingQuizId(quiz.id); setError('');
    try {
      await request(`/quizzes/${quiz.id}`, { method: 'DELETE' });
      setQuizzes((current) => current.filter((item) => item.id !== quiz.id));
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not delete this quiz'); }
    finally { setMutatingQuizId(null); }
  }
  function QuizRows({ items, archived = false }: { items: Quiz[]; archived?: boolean }) {
    return <div className="data-list">{items.map((quiz) => <article className="quiz-row quiz-library-row" key={quiz.id}><button className="quiz-library-open" onClick={() => go(`/quizzes/${quiz.id}`)}><span className="list-icon">▦</span><span className="row-main"><strong>{quiz.title}</strong><small>{quiz.description || 'No description added'}</small></span><span className="question-total">{quiz._count?.questions ?? 0}<small>questions</small></span><span className="chevron">›</span></button><span className="quiz-library-actions">{archived ? <button className="subtle-button" onClick={() => confirmAction({ title: 'Restore quiz?', message: `Move “${quiz.title}” back into the active quiz library?`, confirmLabel: 'Restore quiz', onConfirm: () => void updateArchiveState(quiz, 'restore') })} disabled={mutatingQuizId !== null}>{mutatingQuizId === quiz.id ? 'Restoring…' : 'Restore'}</button> : <button className="subtle-button" onClick={() => confirmAction({ title: 'Archive quiz?', message: `Move “${quiz.title}” out of the active quiz library? You can restore it later.`, confirmLabel: 'Archive quiz', onConfirm: () => void updateArchiveState(quiz, 'archive') })} disabled={mutatingQuizId !== null}>{mutatingQuizId === quiz.id ? 'Archiving…' : 'Archive'}</button>}<button className="quiz-delete-button" onClick={() => confirmAction({ title: 'Delete quiz permanently?', message: `Permanently delete “${quiz.title}” and all of its authored items? Existing homework attempts are retained. This cannot be undone.`, confirmLabel: 'Delete quiz', onConfirm: () => void deleteQuiz(quiz) })} disabled={mutatingQuizId !== null}>{mutatingQuizId === quiz.id ? 'Deleting…' : 'Delete'}</button></span></article>)}</div>;
  }
  return <><PageHeading eyebrow="QUIZ LIBRARY" title="Quizzes" description="Create, organize and prepare the quizzes your team publishes." action={<button className="primary" onClick={() => setShowCreate(true)}>+ New quiz</button>} />{error && <p className="error">{error}</p>}<section className="surface"><div className="surface-head"><div><h2>Active quizzes</h2><p>{activeQuizzes.length} active quiz{activeQuizzes.length === 1 ? '' : 'zes'} · {archivedQuizzes.length} archived</p></div><button className="subtle-button" onClick={() => void load()}>Refresh</button></div>{activeQuizzes.length === 0 ? <Empty icon="▦" title="No active quizzes" copy="Create a new quiz or restore one from the archived section." /> : <QuizRows items={activeQuizzes} />}</section>{archivedQuizzes.length > 0 && <section className="surface archived-quizzes"><div className="surface-head"><div><h2>Archived quizzes</h2><p>Hidden from the active library. Restore one whenever you need it again.</p></div></div><QuizRows items={archivedQuizzes} archived /></section>}{showCreate && <Modal title="Create a quiz" onClose={() => setShowCreate(false)}><form onSubmit={createQuiz}><label>Quiz title<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Winter knowledge check" maxLength={200} required /></label><label>Description <span>optional</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="What should participants expect?" maxLength={2000} /></label><div className="form-actions"><button type="button" className="subtle-button" onClick={() => setShowCreate(false)}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Creating…' : 'Create quiz'}</button></div></form></Modal>}</>;
}

function GamesPage() {
  return <><PageHeading eyebrow="GAME TYPES" title="Games" description="Browse the game types that can be added to a quiz. Configure each game after adding it to a quiz." /><section className="surface"><div className="surface-head"><div><h2>Available games</h2><p>3 game types available</p></div></div><div className="game-catalog"><article className="game-catalog-card"><span className="game-catalog-icon">★</span><div><p className="eyebrow">INTERACTIVE GAME</p><h3>Coin Catch</h3><p>Students click falling coins and avoid vegetables in a short game break.</p><small>Configurable duration · 10 seconds to 2 minutes</small></div></article><article className="game-catalog-card"><span className="game-catalog-icon">⌑</span><div><p className="eyebrow">MEMORY GAME</p><h3>Match Pairs</h3><p>Students flip cards to uncover and match all of the pairs.</p><small>Configurable duration · 10 seconds to 2 minutes</small></div></article><article className="game-catalog-card"><span className="game-catalog-icon">▤</span><div><p className="eyebrow">ARCADE GAME</p><h3>Tower Stack</h3><p>Drop moving blocks, trim the overhang, and build the tallest tower.</p><small>Configurable duration · 10 seconds to 2 minutes</small></div></article></div></section></>;
}

function GamePicker({ onClose, onSelect, saving }: { onClose: () => void; onSelect: (gameType: GameType) => void; saving: boolean }) {
  return <Modal title="Add a game" onClose={onClose} wide><p className="modal-intro">Choose a game type to insert at the selected point. You can configure it afterward.</p><div className="game-picker"><button type="button" disabled={saving} onClick={() => onSelect('coin_catch')}><span>★</span><span><strong>Coin Catch</strong><small>Catch coins, avoid veggies</small><em>20 seconds by default · configurable</em></span><b>+</b></button><button type="button" disabled={saving} onClick={() => onSelect('match_pairs')}><span>⌑</span><span><strong>Match Pairs</strong><small>Flip cards and find the matching pairs</small><em>20 seconds by default · configurable</em></span><b>+</b></button><button type="button" disabled={saving} onClick={() => onSelect('tower_stack')}><span>▤</span><span><strong>Tower Stack</strong><small>Drop blocks and build the tallest tower</small><em>20 seconds by default · configurable</em></span><b>+</b></button></div></Modal>;
}

function ItemPicker({ onClose, onSelect }: { onClose: () => void; onSelect: (type: QuizItemType) => void }) {
  return <Modal title="Add to quiz" onClose={onClose}><p className="modal-intro">Choose what belongs at this point in the quiz.</p><div className="item-picker"><button type="button" onClick={() => onSelect('question')}><span>?</span><strong>Question</strong><small>Ask students a scored question.</small></button><button type="button" onClick={() => onSelect('game')}><span>★</span><strong>Game</strong><small>Add an interactive game break.</small></button><button type="button" onClick={() => onSelect('text')}><span>✦</span><strong>Text</strong><small>Show instructions, encouragement, or a transition.</small></button></div></Modal>;
}

function TimelineAddPanel({ onSelect }: { onSelect: (type: QuizItemType) => void }) {
  return <aside className="surface timeline-add-panel"><div className="surface-head"><div><h2>Add to quiz</h2><p>Start building the next item in your timeline.</p></div></div><div className="item-picker"><button type="button" onClick={() => onSelect('question')}><span>?</span><strong>Question</strong><small>Ask students a scored question.</small></button><button type="button" onClick={() => onSelect('game')}><span>★</span><strong>Game</strong><small>Add an interactive game break.</small></button><button type="button" onClick={() => onSelect('text')}><span>✦</span><strong>Text</strong><small>Show instructions, encouragement, or a transition.</small></button></div></aside>;
}

function TextEditor({ initial, saving, onSave }: { initial?: Question; saving: boolean; onSave: (text: string) => Promise<void> }) {
  const [text, setText] = useState(initial?.text ?? '');
  const [error, setError] = useState('');
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); if (!text.trim()) { setError('Enter some text for students.'); return; } try { await onSave(text); } catch (err) { setError(err instanceof Error ? err.message : 'Could not save this text item'); } }
  return <aside className="surface question-preview-panel text-editor"><div className="surface-head"><div><h2>{initial ? 'Edit text' : 'Add text'}</h2><p>Use <code>{'{{name}}'}</code> to include each student&apos;s name.</p></div></div><form className="question-form" onSubmit={submit}><label>Text to show students<textarea autoFocus rows={7} value={text} onChange={(event) => setText(event.target.value)} placeholder="You’re doing great, {{name}}!" maxLength={2000} required /></label><small className="text-editor-help">Text items pause the quiz until the student chooses Continue. They are not scored or timed.</small>{error && <p className="error">{error}</p>}<button className="primary" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save text' : 'Add text'}</button></form></aside>;
}

function QuestionForm({ pools, onSave, saving, submitLabel, initial, onPreviewChange, showTimer = false }: { pools: AnswerPool[]; onSave: (data: QuestionData) => Promise<void>; saving: boolean; submitLabel: string; initial?: Question; onPreviewChange?: (preview: QuestionPreviewData) => void; showTimer?: boolean }) {
  const [text, setText] = useState(initial?.text ?? ''), [correctAnswer, setCorrectAnswer] = useState(initial?.correctAnswer ?? ''), [wrongAnswers, setWrongAnswers] = useState(initial ? (Array.isArray(initial.options) ? initial.options : []).filter((answer) => answer !== initial.correctAnswer) : ['', '', '']), [source, setSource] = useState<'static' | 'pool'>(initial?.answerPoolId ? 'pool' : 'static'), [poolId, setPoolId] = useState(initial?.answerPoolId?.toString() ?? ''), [answerCount, setAnswerCount] = useState((initial?.answerCount ?? 4).toString()), [timerSeconds, setTimerSeconds] = useState(initial?.timerSeconds?.toString() ?? ''), [formError, setFormError] = useState('');
  const updateWrong = (index: number, value: string) => setWrongAnswers((current) => current.map((answer, i) => i === index ? value : answer));
  const selectedPool = pools.find((pool) => pool.id === Number(poolId));
  const previewOptions = useMemo(() => [
    correctAnswer,
    ...(source === 'static'
      ? wrongAnswers
      : (selectedPool?.answers.map((answer) => answer.value).slice(0, Math.max(0, Number(answerCount) - 1)) ?? [])),
  ].map((answer) => answer.trim()).filter((answer, index, answers) => answer && answers.indexOf(answer) === index), [answerCount, correctAnswer, selectedPool, source, wrongAnswers]);

  useEffect(() => { onPreviewChange?.({ text: text.trim(), options: previewOptions }); }, [onPreviewChange, previewOptions, text]);
  async function submit(event: FormEvent) { event.preventDefault(); setFormError(''); if (source === 'static' && !wrongAnswers.some((answer) => answer.trim())) { setFormError('Add at least one wrong answer.'); return; } if (source === 'pool' && (!poolId || Number(answerCount) < 2)) { setFormError('Select an answer pool and enter at least two answers shown.'); return; } try { await onSave({ text, correctAnswer, ...(source === 'static' ? { wrongAnswers } : { answerPoolId: Number(poolId), answerCount: Number(answerCount) }), ...(showTimer ? { timerSeconds: timerSeconds === '' ? null : Number(timerSeconds) } : {}) }); if (!initial) { setText(''); setCorrectAnswer(''); setWrongAnswers(['', '', '']); setPoolId(''); setAnswerCount('4'); setTimerSeconds(''); } } catch (err) { setFormError(err instanceof Error ? err.message : 'Could not save this question'); } }
  return <form onSubmit={submit} className="question-form"><label>Question<textarea value={text} onChange={(event) => setText(event.target.value)} rows={3} placeholder="Type the question participants will see" maxLength={2000} required /></label><label>Correct answer<input value={correctAnswer} onChange={(event) => setCorrectAnswer(event.target.value)} placeholder="The one correct response" maxLength={500} required /></label><fieldset className="answer-source"><legend>Wrong answer source</legend><div className="source-tabs"><button type="button" className={source === 'static' ? 'selected' : ''} onClick={() => setSource('static')}>Static answers</button><button type="button" className={source === 'pool' ? 'selected' : ''} onClick={() => setSource('pool')}>Answer pool</button></div>{source === 'static' ? <div className="wrong-answers">{wrongAnswers.map((answer, index) => <input key={index} value={answer} onChange={(event) => updateWrong(index, event.target.value)} placeholder={`Wrong answer ${index + 1}`} maxLength={500} />)}<button className="inline-button" type="button" onClick={() => setWrongAnswers((current) => [...current, ''])}>+ Add another wrong answer</button></div> : <div className="pool-fields"><label className="pool-select">Choose pool<select value={poolId} onChange={(event) => setPoolId(event.target.value)} required><option value="">Select an answer pool</option>{pools.map((pool) => <option key={pool.id} value={pool.id}>{pool.name} · {pool.answers.length} answers</option>)}</select>{pools.length === 0 && <small>No pools yet. Create one from the Answer Pools page.</small>}</label><label>Number of answers shown<input type="number" min="2" max={selectedPool ? selectedPool.answers.length + 1 : undefined} value={answerCount} onChange={(event) => setAnswerCount(event.target.value)} required /><small>Includes the correct answer; choices will be randomized later.</small></label></div>}</fieldset>{showTimer && <label>Question timer<select value={timerSeconds} onChange={(event) => setTimerSeconds(event.target.value)}><option value="">Use quiz default</option>{TIMER_SECONDS.map((seconds) => <option key={seconds} value={seconds}>{timerSettingLabel(seconds)}</option>)}</select><small>Overrides the quiz default for this question.</small></label>}{formError && <p className="error">{formError}</p>}<button className="primary" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button></form>;
}

function QuestionEditor({ draft, theme, editing, pools, mode, onModeChange, commonQuestions, onCreateQuestion, onSaveQuestion, onAddCommonQuestion, saving, onPreviewChange }: { draft: QuestionPreviewData | null; theme: QuizTheme; editing: Question | null; pools: AnswerPool[]; mode: 'new' | 'common'; onModeChange: (mode: 'new' | 'common') => void; commonQuestions: CommonQuestion[]; onCreateQuestion: (data: QuestionData) => Promise<void>; onSaveQuestion: (data: QuestionData) => Promise<void>; onAddCommonQuestion: (questionId: number) => Promise<void>; saving: boolean; onPreviewChange: (preview: QuestionPreviewData) => void }) {
  const hasQuestion = Boolean(draft?.text || draft?.options.length);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'true_false' | 'matching' | 'short_answer'>('multiple_choice');

  return <aside className={`surface question-preview-panel${editing ? ' is-editing' : ''}`}>
    <div className="surface-head"><div><h2>{editing ? 'Edit question' : mode === 'new' ? 'Add a question' : 'Common questions'}</h2><p>Student view · {themeLabels[theme]} theme</p></div></div>
    <div className="source-tabs editor-tabs question-editor-tabs"><button type="button" className={activeTab === 'editor' ? 'selected' : ''} onClick={() => setActiveTab('editor')}>{editing ? 'Edit' : 'Add'}</button><button type="button" className={activeTab === 'preview' ? 'selected' : ''} onClick={() => setActiveTab('preview')}>Preview</button></div>
    <div hidden={activeTab !== 'editor'}>{editing ? <div className="preview-editor"><div className="preview-editor-intro"><h3>Modify this question</h3><p>Your changes are ready to preview at any time.</p></div>{!Array.isArray(editing.options) ? <SpecialQuestionForm key={editing.id} kind={editing.options.kind} initial={editing} onSave={onSaveQuestion} saving={saving} onPreviewChange={onPreviewChange} /> : <QuestionForm key={editing.id} pools={pools} onSave={onSaveQuestion} saving={saving} submitLabel="Save changes" initial={editing} onPreviewChange={onPreviewChange} showTimer />}</div> : <div className="preview-editor">{mode === 'new' ? <><div className="preview-editor-intro preview-editor-intro-with-action"><div><h3>Build a question</h3><p>Open Preview to check the student experience.</p></div><button className="inline-button question-source-action" type="button" onClick={() => onModeChange('common')}>Use a common question</button></div><label className="question-type-select">Question type<select value={questionType} onChange={(e) => setQuestionType(e.target.value as typeof questionType)}><option value="multiple_choice">Multiple choice</option><option value="true_false">True / False</option><option value="matching">Matching</option><option value="short_answer">Short answer</option></select></label>{questionType === 'multiple_choice' ? <QuestionForm pools={pools} onSave={onCreateQuestion} saving={saving} submitLabel="Add to quiz" onPreviewChange={onPreviewChange} showTimer /> : <SpecialQuestionForm key={questionType} kind={questionType} onSave={onCreateQuestion} saving={saving} onPreviewChange={onPreviewChange} />}</> : <div className="common-picker"><div className="preview-editor-intro preview-editor-intro-with-action"><div><h3>Choose a common question</h3><p>Add an approved question from your shared library.</p></div><button className="inline-button question-source-action" type="button" onClick={() => onModeChange('new')}>Create from scratch</button></div>{commonQuestions.length === 0 ? <Empty icon="?" title="Library is empty" copy="Create a common question to reuse it here." /> : commonQuestions.map((question) => <div className="common-card" key={question.id}><strong>{question.text}</strong><small>{question.answerPool ? `Uses ${question.answerPool.name}` : `${(Array.isArray(question.options) ? question.options.length - 1 : 0)} static wrong answers`}</small><button className="secondary" disabled={saving} onClick={() => void onAddCommonQuestion(question.id)}>Add to quiz</button></div>)}</div>}</div>}</div>
    <div hidden={activeTab !== 'preview'} className={`student-question-preview preview-theme-${theme}`}>
      {hasQuestion ? <>
        <div className="preview-topline"><span className="preview-brand"><b>Q</b> Quizboard</span><span>Question 1 of 1</span></div>
        <div className="preview-progress"><span /></div>
        <div className="preview-card"><p>QUESTION 01</p><h3>{draft?.text || 'Your question will appear here.'}</h3>{draft?.special?.kind === 'true_false' && <p>{draft.special.statement}</p>}{draft?.special?.kind === 'matching' && <div className="matching-preview">{draft.special.pairs.map((pair, i) => <p key={i}>{pair.question || 'Question'} ? {pair.answer || 'Answer'}</p>)}</div>}<div className="preview-options">{draft?.options.map((option, index) => <div className="preview-option" key={`${option}-${index}`}><span>{String.fromCharCode(65 + index)}</span>{option}</div>)}</div>{!draft?.options.length && draft?.special?.kind !== 'matching' && <small className="preview-hint">Add answers to see the choices students will receive.</small>}</div>
      </> : <div className="preview-empty"><span>?</span><h3>Your question preview</h3><p>Start writing a question and its answers to see the student experience here.</p></div>}
    </div>
  </aside>;
}

function GameEditor({ game, saving, onSave }: { game: Question; saving: boolean; onSave: (data: { gameType: GameType; text: string; durationSeconds: number }) => Promise<void> }) {
  const [text, setText] = useState(game.text);
  const [durationSeconds, setDurationSeconds] = useState(game.gameDurationSeconds ?? 20);
  const [gameType, setGameType] = useState<GameType>(game.gameType ?? 'coin_catch');
  const [error, setError] = useState('');
  const details = gameType === 'match_pairs' ? { icon: '⌑', name: 'Match Pairs', copy: 'Students flip cards to uncover matching pairs.', rules: ['Find all 6 pairs', 'Finish before time runs out'] } : gameType === 'tower_stack' ? { icon: '▤', name: 'Tower Stack', copy: 'Students drop blocks to build a tall tower.', rules: ['Successful stack: +10 points', 'Perfect stacks build a combo'] } : { icon: '★', name: 'Coin Catch', copy: 'Students catch coins and avoid veggies.', rules: ['Coins: +1 point', 'Veggies: −1 point'] };
  function changeGameType(nextType: GameType) { const currentDefault = gameType === 'match_pairs' ? 'Match Pairs' : gameType === 'tower_stack' ? 'Tower Stack' : 'Coin Catch'; setGameType(nextType); if (text === currentDefault) setText(nextType === 'match_pairs' ? 'Match Pairs' : nextType === 'tower_stack' ? 'Tower Stack' : 'Coin Catch'); }
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); try { await onSave({ gameType, text, durationSeconds }); } catch (err) { setError(err instanceof Error ? err.message : 'Could not save this game'); } }
  return <aside className="surface question-preview-panel game-editor-panel"><div className="surface-head"><div><h2>Configure game</h2><p>Student game break</p></div></div><div className="game-editor-banner"><span>{details.icon}</span><div><strong>{details.name}</strong><small>{details.copy}</small></div></div><form className="question-form" onSubmit={submit}><label>Game type<select value={gameType} onChange={(event) => changeGameType(event.target.value as GameType)}><option value="coin_catch">Coin Catch</option><option value="match_pairs">Match Pairs</option><option value="tower_stack">Tower Stack</option></select><small>Changing type keeps this item in the same quiz position.</small></label><label>Game title<input value={text} onChange={(event) => setText(event.target.value)} maxLength={200} required /></label><label>Game duration<select value={durationSeconds} onChange={(event) => setDurationSeconds(Number(event.target.value))}>{GAME_DURATION_SECONDS.map((seconds) => <option key={seconds} value={seconds}>{seconds} seconds</option>)}</select><small>How long students have to play before continuing.</small></label><div className="game-rules"><strong>Rules</strong>{details.rules.map((rule) => <span key={rule}>{rule}</span>)}</div>{error && <p className="error">{error}</p>}<button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save game settings'}</button></form></aside>;
}

function LegacyQuizPage({ id, go }: { id: number; go: (path: string) => void }) {
  const [quiz, setQuiz] = useState<QuizDetail | null>(null), [pools, setPools] = useState<AnswerPool[]>([]), [commonQuestions, setCommonQuestions] = useState<CommonQuestion[]>([]), [mode, setMode] = useState<'new' | 'common'>('new'), [saving, setSaving] = useState(false), [error, setError] = useState('');
  const load = useCallback(async () => { try { const [nextQuiz, nextPools, nextCommon] = await Promise.all([request<QuizDetail>(`/quizzes/${id}`), request<AnswerPool[]>('/quizzes/answer-pools'), request<CommonQuestion[]>('/quizzes/common-questions')]); setQuiz(nextQuiz); setPools(nextPools); setCommonQuestions(nextCommon); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load quiz'); } }, [id]); useEffect(() => { void load(); }, [load]);
  async function addOwn(data: QuestionData) { setSaving(true); try { await request(`/quizzes/${id}/questions`, { method: 'POST', body: JSON.stringify(data) }); await load(); } finally { setSaving(false); } }
  async function addCommon(questionId: number) { setSaving(true); setError(''); try { await request(`/quizzes/${id}/questions/common/${questionId}`, { method: 'POST' }); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not add the common question'); } finally { setSaving(false); } }
  if (!quiz && !error) return <p className="state">Loading quiz…</p>; if (!quiz) return <><button className="back-link" onClick={() => go('/quizzes')}>← Back to quizzes</button><p className="error">{error}</p></>;
  return <><button className="back-link" onClick={() => go('/quizzes')}>← Back to quizzes</button><PageHeading eyebrow="QUIZ EDITOR" title={quiz.title} description={quiz.description || 'No description has been added to this quiz.'} />{error && <p className="error">{error}</p>}<div className="editor-grid"><section className="surface questions-surface"><div className="surface-head"><div><h2>Questions</h2><p>{quiz.questions.length} currently in this quiz</p></div></div>{quiz.questions.length === 0 ? <Empty icon="?" title="No questions yet" copy="Create a new question or add one from your common question library." /> : <ol className="question-list">{quiz.questions.map((question, index) => <li key={question.id}><span className="question-number">{String(index + 1).padStart(2, '0')}</span><div><strong>{question.text}</strong><div className="answer-chips">{(Array.isArray(question.options) ? question.options : []).map((answer) => <span className={answer === question.correctAnswer ? 'answer-chip correct' : 'answer-chip'} key={answer}>{answer === question.correctAnswer && '✓ '}{answer}</span>)}</div></div></li>)}</ol>}</section><aside className="surface add-question"><div className="source-tabs editor-tabs"><button className={mode === 'new' ? 'selected' : ''} onClick={() => setMode('new')}>Create question</button><button className={mode === 'common' ? 'selected' : ''} onClick={() => setMode('common')}>Use common</button></div>{mode === 'new' ? <><div className="section-intro"><h2>New question</h2><p>Choose static wrong answers or attach a reusable answer pool.</p></div><QuestionForm pools={pools} onSave={addOwn} saving={saving} submitLabel="Add to quiz" /></> : <div className="common-picker"><div className="section-intro"><h2>Common questions</h2><p>Add an approved question from your shared library.</p></div>{commonQuestions.length === 0 ? <Empty icon="?" title="Library is empty" copy="Create a common question to reuse it here." /> : commonQuestions.map((question) => <div className="common-card" key={question.id}><strong>{question.text}</strong><small>{question.answerPool ? `Uses ${question.answerPool.name}` : `${(Array.isArray(question.options) ? question.options.length - 1 : 0)} static wrong answers`}</small><button className="secondary" disabled={saving} onClick={() => void addCommon(question.id)}>Add to quiz</button></div>)}</div>}</aside></div></>;
}

function QuizPage({ id, go }: { id: number; go: (path: string) => void }) {
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [pools, setPools] = useState<AnswerPool[]>([]);
  const [commonQuestions, setCommonQuestions] = useState<CommonQuestion[]>([]);
  const [mode, setMode] = useState<'new' | 'common'>('new');
  const [questionPreview, setQuestionPreview] = useState<QuestionPreviewData | null>(null);
  const [editing, setEditing] = useState<Question | null>(null);
  const [draggingQuestionId, setDraggingQuestionId] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);
  const [togglingQuestionId, setTogglingQuestionId] = useState<number | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [quizDetails, setQuizDetails] = useState<{ title: string; description: string } | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [launchMode, setLaunchMode] = useState<'live' | 'homework'>('live');
  const [runMode, setRunMode] = useState<'classic' | 'facilitated' | 'matching' | 'battleship' | 'treasure_map' | 'archery' | 'curling'>('classic');
  const [endless, setEndless] = useState(false);
  const [scoringEnabled, setScoringEnabled] = useState(true);
  const [endDate, setEndDate] = useState(() => dateTimeLocalValue(new Date(Date.now() + (60 * 60 * 1000))));
  const [launching, setLaunching] = useState(false);
  const [showGamePicker, setShowGamePicker] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [addingText, setAddingText] = useState(false);
  const [insertAt, setInsertAt] = useState<number | null>(null);

  useEffect(() => {
    const resetLaunchState = () => setLaunching(false);
    // Returning from the facilitator page can restore this editor from the
    // browser's back/forward cache, which preserves the prior loading state.
    window.addEventListener('pageshow', resetLaunchState);
    window.addEventListener('popstate', resetLaunchState);
    return () => {
      window.removeEventListener('pageshow', resetLaunchState);
      window.removeEventListener('popstate', resetLaunchState);
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const [nextQuiz, nextPools, nextCommon] = await Promise.all([
        request<QuizDetail>(`/quizzes/${id}`),
        request<AnswerPool[]>('/quizzes/answer-pools'),
        request<CommonQuestion[]>('/quizzes/common-questions'),
      ]);
      setQuiz(nextQuiz);
      setPools(nextPools);
      setCommonQuestions(nextCommon);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load quiz');
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function placeNewItem(itemId: number) {
    if (!quiz || insertAt === null) { await load(); return; }
    const order = quiz.questions.map((item) => item.id);
    order.splice(insertAt, 0, itemId);
    const updatedQuiz = await request<QuizDetail>(`/quizzes/${id}/questions/order`, { method: 'PUT', body: JSON.stringify({ questionIds: order }) });
    setQuiz(updatedQuiz);
    setInsertAt(null);
  }

  async function addOwnQuestion(data: QuestionData) {
    setSaving(true);
    try {
      const item = await request<Question>(`/quizzes/${id}/questions`, { method: 'POST', body: JSON.stringify(data) });
      await placeNewItem(item.id);
    } finally {
      setSaving(false);
    }
  }

  async function saveQuestion(data: QuestionData) {
    if (!editing) return;
    setSaving(true);
    try {
      await request(`/quizzes/${id}/questions/${editing.id}`, { method: 'PUT', body: JSON.stringify(data) });
      setEditing(null);
      setQuestionPreview(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function addCommonQuestion(questionId: number) {
    setSaving(true);
    setError('');
    try {
      const item = await request<Question>(`/quizzes/${id}/questions/common/${questionId}`, { method: 'POST' });
      await placeNewItem(item.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the common question');
    } finally {
      setSaving(false);
    }
  }

  async function addGame(gameType: GameType) {
    setSaving(true);
    setError('');
    try {
      const item = await request<Question>(`/quizzes/${id}/games`, { method: 'POST', body: JSON.stringify({ gameType }) });
      setEditing(null);
      setQuestionPreview(null);
      setShowGamePicker(false);
      await placeNewItem(item.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the game');
    } finally {
      setSaving(false);
    }
  }

  async function addText(text: string) {
    setSaving(true);
    setError('');
    try {
      const item = await request<Question>(`/quizzes/${id}/texts`, { method: 'POST', body: JSON.stringify({ text }) });
      setAddingText(false);
      await placeNewItem(item.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the text item');
      throw err;
    } finally { setSaving(false); }
  }

  async function saveText(text: string) {
    if (!editing || editing.itemType !== 'text') return;
    setSaving(true);
    setError('');
    try {
      await request(`/quizzes/${id}/texts/${editing.id}`, { method: 'PUT', body: JSON.stringify({ text }) });
      setEditing(null);
      await load();
    } finally { setSaving(false); }
  }

  async function saveGame(data: { gameType: GameType; text: string; durationSeconds: number }) {
    if (!editing || editing.itemType !== 'game') return;
    setSaving(true);
    setError('');
    try {
      await request(`/quizzes/${id}/games/${editing.id}`, { method: 'PUT', body: JSON.stringify(data) });
      await load();
    } finally {
      setSaving(false);
    }
  }

  function startNewQuestion(index = quiz?.questions.length ?? 0) {
    setEditing(null);
    setAddingText(false);
    setInsertAt(index);
    setMode('new');
    setQuestionPreview(null);
  }

  function chooseItem(type: QuizItemType) {
    setShowItemPicker(false);
    if (type === 'question') { startNewQuestion(insertAt ?? quiz?.questions.length ?? 0); return; }
    if (type === 'game') { setShowGamePicker(true); return; }
    setEditing(null); setQuestionPreview(null); setAddingText(true);
  }

  function openItemPicker(index: number) { setInsertAt(index); setShowItemPicker(true); }

  function startItemAtEnd(type: QuizItemType) {
    const index = quiz?.questions.length ?? 0;
    if (type === 'question') { startNewQuestion(index); return; }
    setInsertAt(index);
    if (type === 'game') { setShowGamePicker(true); return; }
    setEditing(null); setQuestionPreview(null); setAddingText(true);
  }

  function selectItem(item: Question) {
    if (editing?.id === item.id) {
      setEditing(null);
      setQuestionPreview(null);
      return;
    }
    setAddingText(false);
    setInsertAt(null);
    setEditing(item);
    setQuestionPreview(item.itemType === 'question' ? { text: item.text, options: Array.isArray(item.options) ? item.options : [] } : null);
  }

  async function moveQuestion(targetQuestionId: number) {
    if (!quiz || draggingQuestionId === null || draggingQuestionId === targetQuestionId) return;
    const sourceIndex = quiz.questions.findIndex((question) => question.id === draggingQuestionId);
    const targetIndex = quiz.questions.findIndex((question) => question.id === targetQuestionId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const reordered = [...quiz.questions];
    const [movedQuestion] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, movedQuestion);
    setQuiz((current) => current ? { ...current, questions: reordered } : current);
    setDraggingQuestionId(null);
    setReordering(true);
    setError('');
    try {
      const updatedQuiz = await request<QuizDetail>(`/quizzes/${id}/questions/order`, { method: 'PUT', body: JSON.stringify({ questionIds: reordered.map((question) => question.id) }) });
      setQuiz(updatedQuiz);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reorder questions');
      await load();
    } finally {
      setReordering(false);
    }
  }

  async function setQuestionEnabled(questionId: number, isEnabled: boolean) {
    setTogglingQuestionId(questionId);
    setError('');
    try {
      setQuiz(await request<QuizDetail>(`/quizzes/${id}/questions/${questionId}`, { method: 'PATCH', body: JSON.stringify({ isEnabled }) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this question');
    } finally {
      setTogglingQuestionId(null);
    }
  }

  async function deleteItem(item: Question) {
    setDeletingItemId(item.id);
    setError('');
    try {
      const updatedQuiz = await request<QuizDetail>(`/quizzes/${id}/items/${item.id}`, { method: 'DELETE' });
      setQuiz(updatedQuiz);
      if (editing?.id === item.id) { setEditing(null); setQuestionPreview(null); }
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this quiz item');
    } finally { setDeletingItemId(null); }
  }

  async function updateQuestionOrder(randomizeQuestionOrder: boolean) {
    setSavingSettings(true);
    setError('');
    try {
      const updatedQuiz = await request<Quiz>(`/quizzes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ randomizeQuestionOrder }),
      });
      setQuiz((current) => current ? { ...current, randomizeQuestionOrder: updatedQuiz.randomizeQuestionOrder } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update quiz settings');
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveQuizDetails(event: FormEvent) {
    event.preventDefault();
    if (!quizDetails) return;
    setSavingDetails(true); setError('');
    try {
      const updatedQuiz = await request<Quiz>(`/quizzes/${id}`, { method: 'PUT', body: JSON.stringify(quizDetails) });
      setQuiz((current) => current ? { ...current, title: updatedQuiz.title, description: updatedQuiz.description } : current);
      setQuizDetails(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update quiz details'); }
    finally { setSavingDetails(false); }
  }

  async function updateTheme(theme: QuizTheme) {
    setSavingSettings(true);
    setError('');
    try {
      const updatedQuiz = await request<Quiz>(`/quizzes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ theme }),
      });
      setQuiz((current) => current ? { ...current, theme: updatedQuiz.theme } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update quiz settings');
    } finally {
      setSavingSettings(false);
    }
  }

  async function updateAnswerMatching(answerMatching: AnswerMatching) {
    setSavingSettings(true);
    setError('');
    try {
      const updatedQuiz = await request<Quiz>(`/quizzes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ answerMatching }),
      });
      setQuiz((current) => current ? { ...current, answerMatching: updatedQuiz.answerMatching } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update quiz settings');
    } finally {
      setSavingSettings(false);
    }
  }

  async function updateDefaultTimer(defaultTimerSeconds: number) {
    setSavingSettings(true);
    setError('');
    try {
      const updatedQuiz = await request<Quiz>(`/quizzes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ defaultTimerSeconds }),
      });
      setQuiz((current) => current ? { ...current, defaultTimerSeconds: updatedQuiz.defaultTimerSeconds } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update quiz settings');
    } finally {
      setSavingSettings(false);
    }
  }

  async function updateMatchingPairCount(matchingPairCount: number) {
    setSavingSettings(true);
    setError('');
    try {
      const updatedQuiz = await request<Quiz>(`/quizzes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ matchingPairCount }),
      });
      setQuiz((current) => current ? { ...current, matchingPairCount: updatedQuiz.matchingPairCount } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update quiz settings');
    } finally {
      setSavingSettings(false);
    }
  }

  async function updateBattleshipBoardSize(battleshipBoardSize: number) {
    setSavingSettings(true);
    setError('');
    try {
      const updatedQuiz = await request<Quiz>(`/quizzes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ battleshipBoardSize }),
      });
      setQuiz((current) => current ? { ...current, battleshipBoardSize: updatedQuiz.battleshipBoardSize } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update quiz settings');
    } finally {
      setSavingSettings(false);
    }
  }

  async function updateCreditEveryCorrectAnswers(creditEveryCorrectAnswers: number) {
    setSavingSettings(true);
    setError('');
    try {
      const updatedQuiz = await request<Quiz>(`/quizzes/${id}`, { method: 'PUT', body: JSON.stringify({ creditEveryCorrectAnswers }) });
      setQuiz((current) => current ? { ...current, creditEveryCorrectAnswers: updatedQuiz.creditEveryCorrectAnswers } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update credit settings');
    } finally { setSavingSettings(false); }
  }

  async function launchQuiz() {
    const durationSeconds = Math.ceil((new Date(endDate).getTime() - Date.now()) / 1000);
    if (!endDate || !Number.isFinite(durationSeconds) || durationSeconds < 300 || durationSeconds > 604800) { setError('Choose an end date between 5 minutes and 7 days from now.'); return; }
    setLaunching(true); setError('');
    try {
      if (launchMode === 'live') {
        const session = await request<ModeratedSession>(`/moderated-sessions/quiz/${id}`, { method: 'POST', body: JSON.stringify({ mode: runMode, endless: runMode !== 'facilitated' && endless, scoringEnabled, durationSeconds }) });
        go('/running');
      } else {
        const session = await request<HomeworkSession>(`/homework-sessions/quiz/${id}`, { method: 'POST', body: JSON.stringify({ durationSeconds, mode: runMode === 'archery' || runMode === 'curling' ? runMode : 'classic' }) });
        go('/running');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not launch the ${launchMode} run`);
      setLaunching(false);
    }
  }

  if (!quiz && !error) return <p className="state">Loading quiz...</p>;
  if (!quiz) return <><button className="back-link" onClick={() => go('/quizzes')}>Back to quizzes</button><p className="error">{error}</p></>;

  return <>
    <button className="back-link" onClick={() => go('/quizzes')}>Back to quizzes</button>
    <PageHeading eyebrow="QUIZ EDITOR" title={quiz.title} description={quiz.description || 'No description has been added to this quiz.'} action={<div className="page-heading-actions"><button className="subtle-button" disabled={launching} onClick={() => setQuizDetails({ title: quiz.title, description: quiz.description ?? '' })}>Edit details</button><button className="primary" disabled={launching} onClick={() => void launchQuiz()}>{launching ? 'Launching…' : 'Launch'}</button></div>} />
    {quizDetails && <Modal title="Edit quiz details" onClose={() => { if (!savingDetails) setQuizDetails(null); }}><form onSubmit={saveQuizDetails}><label>Quiz title<input autoFocus value={quizDetails.title} onChange={(event) => setQuizDetails((current) => current ? { ...current, title: event.target.value } : current)} maxLength={200} required /></label><label>Description <span>optional</span><textarea value={quizDetails.description} onChange={(event) => setQuizDetails((current) => current ? { ...current, description: event.target.value } : current)} rows={5} maxLength={2000} placeholder="What should participants expect?" /></label><div className="form-actions"><button className="subtle-button" type="button" disabled={savingDetails} onClick={() => setQuizDetails(null)}>Cancel</button><button className="primary" disabled={savingDetails}>{savingDetails ? 'Saving…' : 'Save details'}</button></div></form></Modal>}
    <section className="surface launch-configuration">
      <div className="launch-configuration-heading"><p className="eyebrow">RUN THIS QUIZ</p><h2>Set up your session</h2><p>Choose how students will play and how long the session will run.</p></div>
      <div className="launch-section"><h3>Session type</h3><fieldset className="launch-mode-tabs" disabled={launching}><legend>Session type</legend>
        <label><input type="radio" name={`quiz-launch-mode-${id}`} checked={launchMode === 'live'} onChange={() => setLaunchMode('live')} /><span><strong>Live</strong><small>Run together with live teacher controls</small></span></label>
        <label><input type="radio" name={`quiz-launch-mode-${id}`} checked={launchMode === 'homework'} onChange={() => { setLaunchMode('homework'); setRunMode('classic'); }} /><span><strong>Homework</strong><small>Students work independently on their own time</small></span></label>
      </fieldset></div>
      <div className="launch-options"><div className="launch-section launch-option"><h3>Play settings</h3>
      <div className="launch-mode-details"><label htmlFor="run-mode"><strong>{launchMode === 'live' ? 'Live' : 'Homework'} mode</strong><select id="run-mode" value={runMode} disabled={launching} onChange={(event) => setRunMode(event.target.value as typeof runMode)}>{launchMode === 'live' && <option value="facilitated">Facilitated</option>}<option value="classic">Classic</option>{launchMode === 'live' && <option value="matching">Matching</option>}{launchMode === 'live' && <option value="battleship">Battleship</option>}{launchMode === 'live' && <option value="treasure_map">Treasure Map</option>}<option value="archery">Archery</option><option value="curling">Curling</option></select></label><p>{runMode === 'facilitated' ? 'Release one question at a time and follow student progress. Games can appear between rounds.' : runMode === 'matching' ? 'Students answer at their own pace and earn credits to play a matching game. Timeline games are skipped.' : runMode === 'battleship' ? 'Students answer at their own pace and earn attack tokens to fire on a shared Battleship map. Timeline games are skipped.' : runMode === 'treasure_map' ? 'Students earn scout tokens to uncover shared clues and find the class treasure. Timeline games are skipped.' : runMode === 'archery' ? launchMode === 'homework' ? 'Students earn arrows for correct answers, then place their own shots on the target.' : 'Students earn arrows with correct answers, then time their X and Y aim on a shared target. Timeline games are skipped.' : runMode === 'curling' ? launchMode === 'homework' ? 'Students earn stones for correct answers, then independently slide stones with their chosen direction and speed.' : 'Students earn stones with correct answers, then choose each stone’s direction and speed. Stones do not interact. Timeline games are skipped.' : launchMode === 'live' ? 'Students answer at their own pace while you follow their progress. Games can appear between rounds.' : 'Students answer at their own pace. Games can appear between rounds.'}</p></div>
      {launchMode === 'live' && runMode !== 'facilitated' && <label className="checkbox-label launch-endless"><input type="checkbox" checked={endless} disabled={launching} onChange={(event) => setEndless(event.target.checked)} /><span><strong>Endless questions</strong><small>After the last quiz item, repeat questions in random order until the session ends. Wrong answers are repeated twice within the next 10 questions.</small></span></label>}
      {launchMode === 'live' && <label className="checkbox-label launch-endless"><input type="checkbox" checked={scoringEnabled} disabled={launching} onChange={(event) => setScoringEnabled(event.target.checked)} /><span><strong>Enable points scoring</strong><small>Correct answers earn 100 points, a streak bonus, and up to 100 speed points in the first 30 seconds (or the question timer).</small></span></label>}
        {((launchMode === 'live' && ['matching', 'battleship', 'treasure_map', 'archery', 'curling'].includes(runMode)) || (launchMode === 'homework' && ['archery', 'curling'].includes(runMode))) && <label className="theme-select launch-credit-setting"><span><strong>Credit earning</strong><small>Give one {runMode === 'matching' ? 'credit' : runMode === 'archery' ? 'arrow' : runMode === 'curling' ? 'stone' : runMode === 'battleship' ? 'attack token' : 'scout token'} for every X correct answers.</small></span><select value={quiz.creditEveryCorrectAnswers} disabled={savingSettings || launching} onChange={(event) => void updateCreditEveryCorrectAnswers(Number(event.target.value))} aria-label="Correct answers per credit">{CREDIT_EARNING_INTERVALS.map((interval) => <option key={interval} value={interval}>{interval}</option>)}</select></label>}
      {launchMode === 'live' && runMode === 'matching' && <label className="theme-select launch-credit-setting"><span><strong>Shared matching board</strong><small>Choose the grid for Matching-mode sessions, up to 10 × 10.</small></span><select value={quiz.matchingPairCount} disabled={savingSettings || launching} onChange={(event) => void updateMatchingPairCount(Number(event.target.value))}>{MATCHING_BOARD_SIZES.map((size) => <option key={size.pairs} value={size.pairs}>{size.label}</option>)}</select></label>}
      {launchMode === 'live' && runMode === 'battleship' && <label className="theme-select launch-credit-setting"><span><strong>Shared Battleship board</strong><small>Choose the grid and fleet size for Battleship-mode sessions.</small></span><select value={quiz.battleshipBoardSize} disabled={savingSettings || launching} onChange={(event) => void updateBattleshipBoardSize(Number(event.target.value))}>{BATTLESHIP_BOARD_SIZES.map((board) => <option key={board.size} value={board.size}>{board.size} × {board.size} · {board.boats} boats</option>)}</select></label>}
      </div><div className="launch-section launch-option"><h3>End date</h3>
      <div className="launch-mode-details launch-duration"><label htmlFor="run-end-date"><strong>End date and time</strong><input id="run-end-date" type="datetime-local" value={endDate} disabled={launching} onChange={(event) => setEndDate(event.target.value)} /></label><p>Choose a date from 5 minutes to 7 days from now. The run closes for everyone at this time, including a live quiz waiting in the lobby.</p></div>
      <label className="theme-select launch-student-theme"><span><strong>Student theme</strong><small>Choose the visual style students see while taking this quiz.</small></span><select value={quiz.theme} disabled={savingSettings || launching} onChange={(event) => void updateTheme(event.target.value as QuizTheme)}><option value="standard">Standard</option><option value="kids">Kid-friendly</option><option value="christmas">Christmas</option><option value="halloween">Halloween</option></select></label>
      <label className="theme-select launch-student-theme"><span><strong>Answer matching</strong><small>Close ignores case, accents, extra spaces, and punctuation. Exact only trims the beginning and end.</small></span><select value={quiz.answerMatching} disabled={savingSettings || launching} onChange={(event) => void updateAnswerMatching(event.target.value as AnswerMatching)}><option value="close">Close</option><option value="exact">Exact</option></select></label>
      </div></div>
    </section>
    {error && <p className="error">{error}</p>}
    <div className="editor-grid editor-grid-two">
      <section className="surface questions-surface">
        <div className="surface-head"><div><h2>Quiz items</h2><p>{quiz.questions.length} questions and games in this quiz</p></div></div>
        <div className="quiz-settings-grid quiz-item-settings">
          <label className="checkbox-label">
            <input type="checkbox" checked={quiz.randomizeQuestionOrder} disabled={savingSettings} onChange={(event) => void updateQuestionOrder(event.target.checked)} />
            <span><strong>Randomize question order</strong><small>Live students receive individual question orders as they progress. Game breaks stay in place; homework questions are shuffled for each run.</small></span>
          </label>
          <label className="theme-select"><span><strong>Default question timer</strong><small>Used unless a question overrides it.</small></span><select value={quiz.defaultTimerSeconds} disabled={savingSettings} onChange={(event) => void updateDefaultTimer(Number(event.target.value))}>{TIMER_SECONDS.map((seconds) => <option key={seconds} value={seconds}>{timerSettingLabel(seconds)}</option>)}</select></label>
        </div>
        <ol className="question-list">
          {quiz.questions.map((question, index) => <Fragment key={question.id}><li className="item-insert-slot"><button type="button" onClick={() => openItemPicker(index)} aria-label={`Insert an item before ${question.text}`}><span>+</span> Add here</button></li><li className={`quiz-item-${question.itemType}${editing?.id === question.id ? ' selected-question' : ''}${draggingQuestionId === question.id ? ' dragging-question' : ''}${question.isEnabled ? '' : ' disabled-question'}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void moveQuestion(question.id); }}>
            <button className="question-select" type="button" aria-pressed={editing?.id === question.id} onClick={() => selectItem(question)}>
              <span className="question-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="question-list-content">
                {question.itemType === 'game' ? <><span className="game-item-badge">GAME</span><strong>{question.text}</strong><small className="question-timer-setting">{question.gameType === 'match_pairs' ? 'Match Pairs · flip cards to find matching pairs' : question.gameType === 'tower_stack' ? 'Tower Stack · drop blocks to build a tower' : 'Coin Catch · collect coins and avoid falling veggies'} · {question.gameDurationSeconds ?? 20} seconds</small></> : question.itemType === 'text' ? <><span className="text-item-badge">TEXT</span><strong>{question.text}</strong><small className="question-timer-setting">Shown between quiz items · supports {'{{name}}'}</small></> : <><span className="question-item-badge">{Array.isArray(question.options) ? 'MULTI-CHOICE' : question.options.kind === 'true_false' ? 'T/F' : question.options.kind === 'matching' ? 'MATCHING' : 'SHORT ANSWER'}</span><strong>{question.text}</strong>{!Array.isArray(question.options) && <small className="question-timer-setting">{question.options.kind === 'true_false' ? `Statement: ${question.options.statement} ? Correct answer: ${question.correctAnswer}` : question.options.kind === 'matching' ? `${question.options.pairs.length} pairs ? 3 incorrect attempts allowed` : `Typed answer: ${question.correctAnswer}`}</small>}{question.answerPool ? <span className="answer-chips"><span className="answer-chip correct">Correct: {question.correctAnswer}</span><span className="answer-pool-badge">Answer pool: {question.answerPool.name}</span></span> : <span className="answer-chips">{(Array.isArray(question.options) ? question.options : []).map((answer) => <span className={answer === question.correctAnswer ? 'answer-chip correct' : 'answer-chip'} key={answer}>{answer === question.correctAnswer && 'Correct: '}{answer}</span>)}</span>}<small className="question-timer-setting">Timer: {question.timerSeconds === null ? `${timerSettingLabel(quiz.defaultTimerSeconds)} (quiz default)` : timerSettingLabel(question.timerSeconds)}</small></>}
              </span>
            </button>
            <label className="question-toggle" onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={question.isEnabled} disabled={togglingQuestionId === question.id} onChange={(event) => void setQuestionEnabled(question.id, event.target.checked)} /><span>{question.isEnabled ? 'Included' : 'Skipped'}</span></label>
            <button className="question-delete" type="button" disabled={deletingItemId === question.id} aria-label={`Delete ${question.itemType} ${index + 1}`} title="Delete item" onClick={() => setDeleteTarget(question)}>{deletingItemId === question.id ? '…' : '×'}</button>
            <button className="question-grip" type="button" draggable={!reordering} disabled={reordering} aria-label={`Drag question ${index + 1} to reorder`} title="Drag to reorder" onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(question.id)); setDraggingQuestionId(question.id); }} onDragEnd={() => setDraggingQuestionId(null)}>⠿</button>
          </li></Fragment>)}
          <li className="new-question-slot"><button type="button" onClick={() => openItemPicker(quiz.questions.length)}><span>+</span><strong>Add to end</strong><small>Question, game, or text</small></button></li>
        </ol>
      </section>
      {editing?.itemType === 'game' ? <GameEditor key={editing.id} game={editing} saving={saving} onSave={saveGame} /> : editing?.itemType === 'text' ? <TextEditor key={editing.id} initial={editing} saving={saving} onSave={saveText} /> : addingText ? <TextEditor saving={saving} onSave={addText} /> : editing?.itemType === 'question' || insertAt !== null ? <QuestionEditor draft={mode === 'new' || editing ? questionPreview : null} theme={quiz.theme} editing={editing} pools={pools} mode={mode} onModeChange={setMode} commonQuestions={commonQuestions} onCreateQuestion={addOwnQuestion} onSaveQuestion={saveQuestion} onAddCommonQuestion={addCommonQuestion} saving={saving} onPreviewChange={setQuestionPreview} /> : <TimelineAddPanel onSelect={startItemAtEnd} />}
    </div>
    {showItemPicker && <ItemPicker onClose={() => { setShowItemPicker(false); setInsertAt(null); }} onSelect={chooseItem} />}
    {showGamePicker && <GamePicker saving={saving} onClose={() => setShowGamePicker(false)} onSelect={(gameType) => void addGame(gameType)} />}
    {deleteTarget && <ConfirmDialog title={`Delete ${deleteTarget.itemType === 'text' ? 'text item' : deleteTarget.itemType}`} confirmLabel="Delete item" busy={deletingItemId === deleteTarget.id} onClose={() => setDeleteTarget(null)} onConfirm={() => void deleteItem(deleteTarget)}>This cannot be undone.</ConfirmDialog>}
  </>;
}

function CommonQuestionsPage() {
  const [questions, setQuestions] = useState<CommonQuestion[]>([]), [pools, setPools] = useState<AnswerPool[]>([]), [showCreate, setShowCreate] = useState(false), [editing, setEditing] = useState<CommonQuestion | null>(null), [saving, setSaving] = useState(false), [error, setError] = useState('');
  const load = useCallback(async () => { try { const [nextQuestions, nextPools] = await Promise.all([request<CommonQuestion[]>('/quizzes/common-questions'), request<AnswerPool[]>('/quizzes/answer-pools')]); setQuestions(nextQuestions); setPools(nextPools); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load the question library'); } }, []); useEffect(() => { void load(); }, [load]);
  async function save(data: QuestionData) { setSaving(true); try { await request(editing ? `/quizzes/common-questions/${editing.id}` : '/quizzes/common-questions', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) }); setShowCreate(false); setEditing(null); await load(); } finally { setSaving(false); } }
  const closeModal = () => { setShowCreate(false); setEditing(null); };
  return <><PageHeading eyebrow="SHARED LIBRARY" title="Common Questions" description="Build approved questions once, then add them to any quiz." action={<button className="primary" onClick={() => setShowCreate(true)}>+ New common question</button>} />{error && <p className="error">{error}</p>}<section className="surface"><div className="surface-head"><div><h2>Question library</h2><p>{questions.length} reusable question{questions.length === 1 ? '' : 's'}</p></div></div>{questions.length === 0 ? <Empty icon="?" title="Your library is empty" copy="Add a common question to make it available while editing quizzes." /> : <div className="library-grid">{questions.map((question) => <article className="library-card" key={question.id}><span className="question-badge">Question</span><h3>{question.text}</h3><p><b>Correct:</b> {question.correctAnswer}</p><small>{question.answerPool ? `Answer pool: ${question.answerPool.name}${question.answerCount ? ` · Shows ${question.answerCount}` : ''}` : `${(Array.isArray(question.options) ? question.options.length - 1 : 0)} static wrong answers`}</small><button className="card-edit" onClick={() => setEditing(question)}>Edit question</button></article>)}</div>}</section>{(showCreate || editing) && <Modal title={editing ? 'Edit common question' : 'New common question'} onClose={closeModal} wide><p className="modal-intro">This question can be added to any quiz in your workspace.</p><QuestionForm key={editing?.id ?? 'new'} pools={pools} onSave={save} saving={saving} submitLabel={editing ? 'Save changes' : 'Save common question'} initial={editing ?? undefined} /></Modal>}</>;
}

function AnswerPoolForm({ initial, onSave, saving }: { initial?: AnswerPool; onSave: (data: PoolData) => Promise<void>; saving: boolean }) {
  const [name, setName] = useState(initial?.name ?? ''), [answers, setAnswers] = useState(initial?.answers.map((answer) => answer.value) ?? ['', '', '']), [formError, setFormError] = useState('');
  const updateAnswer = (index: number, value: string) => setAnswers((current) => current.map((answer, i) => i === index ? value : answer));
  async function submit(event: FormEvent) { event.preventDefault(); setFormError(''); if (!answers.some((answer) => answer.trim())) { setFormError('Add at least one answer.'); return; } try { await onSave({ name, answers: answers.filter((answer) => answer.trim()) }); } catch (err) { setFormError(err instanceof Error ? err.message : 'Could not save this answer pool'); } }
  return <form onSubmit={submit}><label>Pool name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Common geography distractors" maxLength={200} required /></label><fieldset><legend>Wrong answers</legend>{answers.map((answer, index) => <input key={index} value={answer} onChange={(event) => updateAnswer(index, event.target.value)} placeholder={`Answer ${index + 1}`} maxLength={500} />)}<button className="inline-button" type="button" onClick={() => setAnswers((current) => [...current, ''])}>+ Add another answer</button></fieldset>{formError && <p className="error">{formError}</p>}<button className="primary" disabled={saving}>{saving ? 'Saving...' : initial ? 'Save changes' : 'Save answer pool'}</button></form>;
}

function RunningSessionPanel({ kind, sessionId, view, token, go }: { kind: 'live' | 'homework'; sessionId: string; view: Exclude<SessionView, 'presenter'>; token: string; go: (path: string) => void }) {
  return <><button className="back-link" onClick={() => go('/running')}>Back to Running Quizzes</button>{kind === 'live' ? <Facilitator key={`${sessionId}-${view}`} sessionId={sessionId} token={token} metrics={view === 'metrics'} /> : <HomeworkTeacher key={`${sessionId}-${view}`} sessionId={sessionId} token={token} initialView={view === 'metrics' ? 'report' : 'manage'} />}</>;
}

function AnswerPoolsPage() {
  const [pools, setPools] = useState<AnswerPool[]>([]), [showCreate, setShowCreate] = useState(false), [editing, setEditing] = useState<AnswerPool | null>(null), [saving, setSaving] = useState(false), [error, setError] = useState('');
  const load = useCallback(async () => { try { setPools(await request<AnswerPool[]>('/quizzes/answer-pools')); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load answer pools'); } }, []); useEffect(() => { void load(); }, [load]);
  async function save(data: PoolData) { setSaving(true); try { await request(editing ? `/quizzes/answer-pools/${editing.id}` : '/quizzes/answer-pools', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) }); setShowCreate(false); setEditing(null); await load(); } finally { setSaving(false); } }
  const closeModal = () => { setShowCreate(false); setEditing(null); };
  return <><PageHeading eyebrow="REUSABLE RESPONSES" title="Answer Pools" description="Maintain sets of wrong answers that can be attached to questions." action={<button className="primary" onClick={() => setShowCreate(true)}>+ New answer pool</button>} />{error && <p className="error">{error}</p>}<section className="surface"><div className="surface-head"><div><h2>Saved pools</h2><p>{pools.length} answer pool{pools.length === 1 ? '' : 's'}</p></div></div>{pools.length === 0 ? <Empty icon="O" title="No answer pools yet" copy="Pool answers are used as reusable wrong-answer options." /> : <div className="pool-grid">{pools.map((pool) => <article className="pool-card" key={pool.id}><div className="pool-title"><span className="list-icon">O</span><div><h3>{pool.name}</h3><small>{pool.answers.length} answers</small></div></div><div className="pool-answers">{pool.answers.slice(0, 6).map((answer) => <span key={answer.id}>{answer.value}</span>)}{pool.answers.length > 6 && <span>+{pool.answers.length - 6} more</span>}</div><p>Used by {(pool._count?.questions ?? 0) + (pool._count?.commonQuestions ?? 0)} question{(pool._count?.questions ?? 0) + (pool._count?.commonQuestions ?? 0) === 1 ? '' : 's'}</p><button className="card-edit" onClick={() => setEditing(pool)}>Edit pool</button></article>)}</div>}</section>{(showCreate || editing) && <Modal title={editing ? 'Edit answer pool' : 'New answer pool'} onClose={closeModal}><p className="modal-intro">Each answer in this pool can be used as a wrong answer on a question.</p><AnswerPoolForm key={editing?.id ?? 'new'} initial={editing ?? undefined} onSave={save} saving={saving} /></Modal>}</>;
}

export default function App() {
  const { path, go } = useRoute();
  const [teacherPassword, setTeacherPassword] = useState<string | null>(null);
  if (!teacherPassword) return <TeacherPasswordPrompt onUnlock={setTeacherPassword} />;
  const runningMatch = path.match(/^\/running\/(live|homework)\/([^/]+)\/(details|metrics|presenter)$/);
  const liveMatch = path.match(/^\/teacher\/live\/([^/]+)$/), homeworkMatch = path.match(/^\/teacher\/homework\/([^/]+)$/), projectorMatch = path.match(/^\/teacher\/projector\/([^/]+)$/);
  const projectorSession = runningMatch?.[3] === 'presenter' ? { kind: runningMatch[1] as 'live' | 'homework', sessionId: runningMatch[2] } : projectorMatch ? { kind: 'live' as const, sessionId: projectorMatch[1] } : null;
  if (projectorSession) return projectorSession.kind === 'live' ? <Facilitator sessionId={projectorSession.sessionId} token={teacherPassword} projector /> : <HomeworkProjector sessionId={projectorSession.sessionId} token={teacherPassword} />;
  const legacySession = liveMatch ? { kind: 'live' as const, sessionId: liveMatch[1], view: 'details' as const } : homeworkMatch ? { kind: 'homework' as const, sessionId: homeworkMatch[1], view: 'details' as const } : runningMatch && runningMatch[3] !== 'presenter' ? { kind: runningMatch[1] as 'live' | 'homework', sessionId: runningMatch[2], view: runningMatch[3] as Exclude<SessionView, 'presenter'> } : null;
  const quizMatch = path.match(/^\/quizzes\/(\d+)$/);
  const page = legacySession ? <RunningSessionPanel {...legacySession} token={teacherPassword} go={go} /> : quizMatch ? <QuizPage id={Number(quizMatch[1])} go={go} /> : path === '/running' ? <RunningQuizzesPage go={go} teacherPassword={teacherPassword} /> : path === '/data-sets' ? <DataSetsPage go={go} /> : path === '/import' ? <ImportPage go={go} /> : path === '/games' ? <GamesPage /> : path === '/questions' ? <CommonQuestionsPage /> : path === '/answer-pools' ? <AnswerPoolsPage /> : <QuizList go={go} />;
  return <AdminShell path={path} go={go}>{page}</AdminShell>;
}

