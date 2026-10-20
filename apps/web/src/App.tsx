import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
type QuizTheme = 'standard' | 'kids';
type Quiz = { id: number; guid: string; title: string; description: string | null; randomizeQuestionOrder: boolean; theme: QuizTheme; _count?: { questions: number } };
type Question = { id: number; text: string; options: string[]; correctAnswer: string; answerPoolId?: number | null; answerCount?: number | null; answerPool?: { name: string } | null };
type QuizDetail = Quiz & { questions: Question[] };
type AnswerPool = { id: number; name: string; answers: { id: number; value: string }[]; _count?: { questions: number; commonQuestions: number } };
type CommonQuestion = Question & { answerPool?: AnswerPool | null };
type QuestionData = { text: string; correctAnswer: string; wrongAnswers?: string[]; answerPoolId?: number; answerCount?: number };
type PoolData = { name: string; answers: string[] };
type ModeratedSession = { sessionId: string; facilitatorToken: string; phase: 'lobby' };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...options?.headers }, ...options });
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(Array.isArray(body?.message) ? body.message.join(', ') : body?.message || 'Something went wrong'); }
  return response.json() as Promise<T>;
}
function studentQuizUrl(guid: string) {
  return `${(import.meta.env.VITE_STUDENT_APP_URL ?? 'http://localhost:5174').replace(/\/$/, '')}/quiz/${guid}`;
}
function studentSessionUrl(sessionId: string) { return `${(import.meta.env.VITE_STUDENT_APP_URL ?? 'http://localhost:5174').replace(/\/$/, '')}/moderated/${sessionId}`; }
function facilitatorSessionUrl(session: ModeratedSession) { return `${(import.meta.env.VITE_STUDENT_APP_URL ?? 'http://localhost:5174').replace(/\/$/, '')}/facilitate/${session.sessionId}?token=${session.facilitatorToken}`; }
function useRoute() { const [path, setPath] = useState(window.location.pathname); useEffect(() => { const update = () => setPath(window.location.pathname); window.addEventListener('popstate', update); return () => window.removeEventListener('popstate', update); }, []); const go = (nextPath: string) => { window.history.pushState({}, '', nextPath); setPath(nextPath); }; return { path, go }; }

function AdminShell({ path, go, children }: { path: string; go: (value: string) => void; children: ReactNode }) {
  const items = [{ path: '/quizzes', label: 'Quizzes', icon: '▦' }, { path: '/questions', label: 'Common Questions', icon: '?' }, { path: '/answer-pools', label: 'Answer Pools', icon: '◌' }]; const active = path.startsWith('/quizzes/') ? '/quizzes' : path;
  return <div className="admin-shell"><aside className="sidebar"><button className="brand" onClick={() => go('/quizzes')}><span className="brand-mark">Q</span><span>Quizboard<small>ADMIN PORTAL</small></span></button><nav aria-label="Main navigation">{items.map((item) => <button key={item.path} className={active === item.path ? 'nav-link active' : 'nav-link'} onClick={() => go(item.path)}><span>{item.icon}</span>{item.label}</button>)}</nav><div className="sidebar-foot"><span className="avatar">AD</span><div><strong>Admin</strong><small>Content manager</small></div></div></aside><div className="page-wrap"><header className="topbar"><div><span className="crumb">ADMINISTRATION</span><span className="topbar-title">Quiz management</span></div><button className="help-button" aria-label="Help">?</button></header><main className="content">{children}</main></div></div>;
}
function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) { return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</div>; }
function Empty({ icon, title, copy }: { icon: string; title: string; copy: string }) { return <div className="empty"><span>{icon}</span><h3>{title}</h3><p>{copy}</p></div>; }
function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) { return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className={wide ? 'modal modal-wide' : 'modal'} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button className="close-button" onClick={onClose} aria-label="Close">×</button></div>{children}</section></div>; }

function QuizList({ go }: { go: (path: string) => void }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]), [showCreate, setShowCreate] = useState(false), [title, setTitle] = useState(''), [description, setDescription] = useState(''), [error, setError] = useState(''), [saving, setSaving] = useState(false);
  const load = useCallback(async () => { try { setQuizzes(await request<Quiz[]>('/quizzes')); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load quizzes'); } }, []); useEffect(() => { void load(); }, [load]);
  async function createQuiz(event: FormEvent) { event.preventDefault(); setSaving(true); setError(''); try { const quiz = await request<Quiz>('/quizzes', { method: 'POST', body: JSON.stringify({ title, description: description || undefined }) }); go(`/quizzes/${quiz.id}`); } catch (err) { setError(err instanceof Error ? err.message : 'Could not create quiz'); } finally { setSaving(false); } }
  return <><PageHeading eyebrow="QUIZ LIBRARY" title="Quizzes" description="Create, organize and prepare the quizzes your team publishes." action={<button className="primary" onClick={() => setShowCreate(true)}>+ New quiz</button>} />{error && <p className="error">{error}</p>}<section className="surface"><div className="surface-head"><div><h2>All quizzes</h2><p>{quizzes.length} quiz{quizzes.length === 1 ? '' : 'zes'} in your workspace</p></div><button className="subtle-button" onClick={() => void load()}>Refresh</button></div>{quizzes.length === 0 ? <Empty icon="▦" title="No quizzes yet" copy="Create your first quiz to begin building its question set." /> : <div className="data-list">{quizzes.map((quiz) => <button className="quiz-row" key={quiz.id} onClick={() => go(`/quizzes/${quiz.id}`)}><span className="list-icon">▦</span><span className="row-main"><strong>{quiz.title}</strong><small>{quiz.description || 'No description added'}</small></span><span className="question-total">{quiz._count?.questions ?? 0}<small>questions</small></span><span className="chevron">›</span></button>)}</div>}</section>{showCreate && <Modal title="Create a quiz" onClose={() => setShowCreate(false)}><form onSubmit={createQuiz}><label>Quiz title<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Winter knowledge check" maxLength={200} required /></label><label>Description <span>optional</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="What should participants expect?" maxLength={2000} /></label><div className="form-actions"><button type="button" className="subtle-button" onClick={() => setShowCreate(false)}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Creating…' : 'Create quiz'}</button></div></form></Modal>}</>;
}

function QuestionForm({ pools, onSave, saving, submitLabel, initial }: { pools: AnswerPool[]; onSave: (data: QuestionData) => Promise<void>; saving: boolean; submitLabel: string; initial?: Question }) {
  const [text, setText] = useState(initial?.text ?? ''), [correctAnswer, setCorrectAnswer] = useState(initial?.correctAnswer ?? ''), [wrongAnswers, setWrongAnswers] = useState(initial ? initial.options.filter((answer) => answer !== initial.correctAnswer) : ['', '', '']), [source, setSource] = useState<'static' | 'pool'>(initial?.answerPoolId ? 'pool' : 'static'), [poolId, setPoolId] = useState(initial?.answerPoolId?.toString() ?? ''), [answerCount, setAnswerCount] = useState((initial?.answerCount ?? 4).toString()), [formError, setFormError] = useState('');
  const updateWrong = (index: number, value: string) => setWrongAnswers((current) => current.map((answer, i) => i === index ? value : answer));
  async function submit(event: FormEvent) { event.preventDefault(); setFormError(''); if (source === 'static' && !wrongAnswers.some((answer) => answer.trim())) { setFormError('Add at least one wrong answer.'); return; } if (source === 'pool' && (!poolId || Number(answerCount) < 2)) { setFormError('Select an answer pool and enter at least two answers shown.'); return; } try { await onSave({ text, correctAnswer, ...(source === 'static' ? { wrongAnswers } : { answerPoolId: Number(poolId), answerCount: Number(answerCount) }) }); if (!initial) { setText(''); setCorrectAnswer(''); setWrongAnswers(['', '', '']); setPoolId(''); setAnswerCount('4'); } } catch (err) { setFormError(err instanceof Error ? err.message : 'Could not save this question'); } }
  const selectedPool = pools.find((pool) => pool.id === Number(poolId));
  return <form onSubmit={submit} className="question-form"><label>Question<textarea value={text} onChange={(event) => setText(event.target.value)} rows={3} placeholder="Type the question participants will see" maxLength={2000} required /></label><label>Correct answer<input value={correctAnswer} onChange={(event) => setCorrectAnswer(event.target.value)} placeholder="The one correct response" maxLength={500} required /></label><fieldset className="answer-source"><legend>Wrong answer source</legend><div className="source-tabs"><button type="button" className={source === 'static' ? 'selected' : ''} onClick={() => setSource('static')}>Static answers</button><button type="button" className={source === 'pool' ? 'selected' : ''} onClick={() => setSource('pool')}>Answer pool</button></div>{source === 'static' ? <div className="wrong-answers">{wrongAnswers.map((answer, index) => <input key={index} value={answer} onChange={(event) => updateWrong(index, event.target.value)} placeholder={`Wrong answer ${index + 1}`} maxLength={500} />)}<button className="inline-button" type="button" onClick={() => setWrongAnswers((current) => [...current, ''])}>+ Add another wrong answer</button></div> : <div className="pool-fields"><label className="pool-select">Choose pool<select value={poolId} onChange={(event) => setPoolId(event.target.value)} required><option value="">Select an answer pool</option>{pools.map((pool) => <option key={pool.id} value={pool.id}>{pool.name} · {pool.answers.length} answers</option>)}</select>{pools.length === 0 && <small>No pools yet. Create one from the Answer Pools page.</small>}</label><label>Number of answers shown<input type="number" min="2" max={selectedPool ? selectedPool.answers.length + 1 : undefined} value={answerCount} onChange={(event) => setAnswerCount(event.target.value)} required /><small>Includes the correct answer; choices will be randomized later.</small></label></div>}</fieldset>{formError && <p className="error">{formError}</p>}<button className="primary" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button></form>;
}

function LegacyQuizPage({ id, go }: { id: number; go: (path: string) => void }) {
  const [quiz, setQuiz] = useState<QuizDetail | null>(null), [pools, setPools] = useState<AnswerPool[]>([]), [commonQuestions, setCommonQuestions] = useState<CommonQuestion[]>([]), [mode, setMode] = useState<'new' | 'common'>('new'), [saving, setSaving] = useState(false), [error, setError] = useState('');
  const load = useCallback(async () => { try { const [nextQuiz, nextPools, nextCommon] = await Promise.all([request<QuizDetail>(`/quizzes/${id}`), request<AnswerPool[]>('/quizzes/answer-pools'), request<CommonQuestion[]>('/quizzes/common-questions')]); setQuiz(nextQuiz); setPools(nextPools); setCommonQuestions(nextCommon); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load quiz'); } }, [id]); useEffect(() => { void load(); }, [load]);
  async function addOwn(data: QuestionData) { setSaving(true); try { await request(`/quizzes/${id}/questions`, { method: 'POST', body: JSON.stringify(data) }); await load(); } finally { setSaving(false); } }
  async function addCommon(questionId: number) { setSaving(true); setError(''); try { await request(`/quizzes/${id}/questions/common/${questionId}`, { method: 'POST' }); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not add the common question'); } finally { setSaving(false); } }
  if (!quiz && !error) return <p className="state">Loading quiz…</p>; if (!quiz) return <><button className="back-link" onClick={() => go('/quizzes')}>← Back to quizzes</button><p className="error">{error}</p></>;
  return <><button className="back-link" onClick={() => go('/quizzes')}>← Back to quizzes</button><PageHeading eyebrow="QUIZ EDITOR" title={quiz.title} description={quiz.description || 'No description has been added to this quiz.'} />{error && <p className="error">{error}</p>}<div className="editor-grid"><section className="surface questions-surface"><div className="surface-head"><div><h2>Questions</h2><p>{quiz.questions.length} currently in this quiz</p></div></div>{quiz.questions.length === 0 ? <Empty icon="?" title="No questions yet" copy="Create a new question or add one from your common question library." /> : <ol className="question-list">{quiz.questions.map((question, index) => <li key={question.id}><span className="question-number">{String(index + 1).padStart(2, '0')}</span><div><strong>{question.text}</strong><div className="answer-chips">{question.options.map((answer) => <span className={answer === question.correctAnswer ? 'answer-chip correct' : 'answer-chip'} key={answer}>{answer === question.correctAnswer && '✓ '}{answer}</span>)}</div></div></li>)}</ol>}</section><aside className="surface add-question"><div className="source-tabs editor-tabs"><button className={mode === 'new' ? 'selected' : ''} onClick={() => setMode('new')}>Create question</button><button className={mode === 'common' ? 'selected' : ''} onClick={() => setMode('common')}>Use common</button></div>{mode === 'new' ? <><div className="section-intro"><h2>New question</h2><p>Choose static wrong answers or attach a reusable answer pool.</p></div><QuestionForm pools={pools} onSave={addOwn} saving={saving} submitLabel="Add to quiz" /></> : <div className="common-picker"><div className="section-intro"><h2>Common questions</h2><p>Add an approved question from your shared library.</p></div>{commonQuestions.length === 0 ? <Empty icon="?" title="Library is empty" copy="Create a common question to reuse it here." /> : commonQuestions.map((question) => <div className="common-card" key={question.id}><strong>{question.text}</strong><small>{question.answerPool ? `Uses ${question.answerPool.name}` : `${question.options.length - 1} static wrong answers`}</small><button className="secondary" disabled={saving} onClick={() => void addCommon(question.id)}>Add to quiz</button></div>)}</div>}</aside></div></>;
}

function QuizPage({ id, go }: { id: number; go: (path: string) => void }) {
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [pools, setPools] = useState<AnswerPool[]>([]);
  const [commonQuestions, setCommonQuestions] = useState<CommonQuestion[]>([]);
  const [mode, setMode] = useState<'new' | 'common'>('new');
  const [editing, setEditing] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [moderatedSession, setModeratedSession] = useState<ModeratedSession | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionLinkCopied, setSessionLinkCopied] = useState<'student' | 'facilitator' | null>(null);

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

  async function addOwnQuestion(data: QuestionData) {
    setSaving(true);
    try {
      await request(`/quizzes/${id}/questions`, { method: 'POST', body: JSON.stringify(data) });
      await load();
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
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function addCommonQuestion(questionId: number) {
    setSaving(true);
    setError('');
    try {
      await request(`/quizzes/${id}/questions/common/${questionId}`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the common question');
    } finally {
      setSaving(false);
    }
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

  async function copyStudentLink() {
    if (!quiz) return;
    try {
      await navigator.clipboard.writeText(studentQuizUrl(quiz.guid));
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      setError('Could not copy the student link.');
    }
  }

  async function createModeratedSession() {
    setCreatingSession(true); setError('');
    try { setModeratedSession(await request<ModeratedSession>(`/moderated-sessions/quiz/${id}`, { method: 'POST' })); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not create the moderated test'); }
    finally { setCreatingSession(false); }
  }
  async function copySessionLink(kind: 'student' | 'facilitator') {
    if (!moderatedSession) return;
    try { await navigator.clipboard.writeText(kind === 'student' ? studentSessionUrl(moderatedSession.sessionId) : facilitatorSessionUrl(moderatedSession)); setSessionLinkCopied(kind); window.setTimeout(() => setSessionLinkCopied(null), 2000); }
    catch { setError('Could not copy that link.'); }
  }

  if (!quiz && !error) return <p className="state">Loading quiz...</p>;
  if (!quiz) return <><button className="back-link" onClick={() => go('/quizzes')}>Back to quizzes</button><p className="error">{error}</p></>;

  return <>
    <button className="back-link" onClick={() => go('/quizzes')}>Back to quizzes</button>
    <PageHeading eyebrow="QUIZ EDITOR" title={quiz.title} description={quiz.description || 'No description has been added to this quiz.'} action={<div className="page-actions"><button className="subtle-button" onClick={() => void copyStudentLink()}>{shareCopied ? 'Student link copied' : 'Copy student link'}</button><button className="primary" disabled={creatingSession} onClick={() => void createModeratedSession()}>{creatingSession ? 'Creating…' : 'Create moderated test'}</button></div>} />
    <section className="surface quiz-settings">
      <div className="quiz-settings-grid">
        <label className="checkbox-label">
          <input type="checkbox" checked={quiz.randomizeQuestionOrder} disabled={savingSettings} onChange={(event) => void updateQuestionOrder(event.target.checked)} />
          <span><strong>Randomize question order</strong><small>Students receive the quiz questions in a different order each time it is opened.</small></span>
        </label>
        <label className="theme-select"><span><strong>Student theme</strong><small>Choose the visual style students see while taking this quiz.</small></span><select value={quiz.theme} disabled={savingSettings} onChange={(event) => void updateTheme(event.target.value as QuizTheme)}><option value="standard">Standard</option><option value="kids">Kid-friendly</option></select></label>
      </div>
    </section>
    {error && <p className="error">{error}</p>}
    <div className="editor-grid">
      <section className="surface questions-surface">
        <div className="surface-head"><div><h2>Questions</h2><p>{quiz.questions.length} currently in this quiz</p></div></div>
        {quiz.questions.length === 0 ? <Empty icon="?" title="No questions yet" copy="Create a new question or add one from your common question library." /> : <ol className="question-list">
          {quiz.questions.map((question, index) => <li key={question.id}>
            <span className="question-number">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <div className="question-row-head"><strong>{question.text}</strong><button className="card-edit" onClick={() => setEditing(question)}>Edit question</button></div>
              {question.answerPool ? <div className="answer-chips"><span className="answer-chip correct">Correct: {question.correctAnswer}</span><span className="answer-pool-badge">Answer pool: {question.answerPool.name}</span></div> : <div className="answer-chips">{question.options.map((answer) => <span className={answer === question.correctAnswer ? 'answer-chip correct' : 'answer-chip'} key={answer}>{answer === question.correctAnswer && 'Correct: '}{answer}</span>)}</div>}
            </div>
          </li>)}
        </ol>}
      </section>
      <aside className="surface add-question">
        <div className="source-tabs editor-tabs"><button className={mode === 'new' ? 'selected' : ''} onClick={() => setMode('new')}>Create question</button><button className={mode === 'common' ? 'selected' : ''} onClick={() => setMode('common')}>Use common</button></div>
        {mode === 'new' ? <><div className="section-intro"><h2>New question</h2><p>Choose static wrong answers or attach a reusable answer pool.</p></div><QuestionForm pools={pools} onSave={addOwnQuestion} saving={saving} submitLabel="Add to quiz" /></> : <div className="common-picker">
          <div className="section-intro"><h2>Common questions</h2><p>Add an approved question from your shared library.</p></div>
          {commonQuestions.length === 0 ? <Empty icon="?" title="Library is empty" copy="Create a common question to reuse it here." /> : commonQuestions.map((question) => <div className="common-card" key={question.id}><strong>{question.text}</strong><small>{question.answerPool ? `Uses ${question.answerPool.name}` : `${question.options.length - 1} static wrong answers`}</small><button className="secondary" disabled={saving} onClick={() => void addCommonQuestion(question.id)}>Add to quiz</button></div>)}
        </div>}
      </aside>
    </div>
    {editing && <Modal title="Edit quiz question" onClose={() => setEditing(null)} wide><p className="modal-intro">Changes apply only to this quiz; they do not change the shared common question.</p><QuestionForm key={editing.id} pools={pools} onSave={saveQuestion} saving={saving} submitLabel="Save changes" initial={editing} /></Modal>}
    {moderatedSession && <Modal title="Moderated test ready" onClose={() => setModeratedSession(null)}><p className="modal-intro">This live test exists only while the API is running. Share the student link; keep the facilitator link private.</p><div className="session-link"><strong>Student link</strong><code>{studentSessionUrl(moderatedSession.sessionId)}</code><button className="secondary" onClick={() => void copySessionLink('student')}>{sessionLinkCopied === 'student' ? 'Copied' : 'Copy student link'}</button></div><div className="session-link"><strong>Facilitator link</strong><code>{facilitatorSessionUrl(moderatedSession)}</code><button className="secondary" onClick={() => void copySessionLink('facilitator')}>{sessionLinkCopied === 'facilitator' ? 'Copied' : 'Copy facilitator link'}</button></div></Modal>}
  </>;
}

function CommonQuestionsPage() {
  const [questions, setQuestions] = useState<CommonQuestion[]>([]), [pools, setPools] = useState<AnswerPool[]>([]), [showCreate, setShowCreate] = useState(false), [editing, setEditing] = useState<CommonQuestion | null>(null), [saving, setSaving] = useState(false), [error, setError] = useState('');
  const load = useCallback(async () => { try { const [nextQuestions, nextPools] = await Promise.all([request<CommonQuestion[]>('/quizzes/common-questions'), request<AnswerPool[]>('/quizzes/answer-pools')]); setQuestions(nextQuestions); setPools(nextPools); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load the question library'); } }, []); useEffect(() => { void load(); }, [load]);
  async function save(data: QuestionData) { setSaving(true); try { await request(editing ? `/quizzes/common-questions/${editing.id}` : '/quizzes/common-questions', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) }); setShowCreate(false); setEditing(null); await load(); } finally { setSaving(false); } }
  const closeModal = () => { setShowCreate(false); setEditing(null); };
  return <><PageHeading eyebrow="SHARED LIBRARY" title="Common Questions" description="Build approved questions once, then add them to any quiz." action={<button className="primary" onClick={() => setShowCreate(true)}>+ New common question</button>} />{error && <p className="error">{error}</p>}<section className="surface"><div className="surface-head"><div><h2>Question library</h2><p>{questions.length} reusable question{questions.length === 1 ? '' : 's'}</p></div></div>{questions.length === 0 ? <Empty icon="?" title="Your library is empty" copy="Add a common question to make it available while editing quizzes." /> : <div className="library-grid">{questions.map((question) => <article className="library-card" key={question.id}><span className="question-badge">Question</span><h3>{question.text}</h3><p><b>Correct:</b> {question.correctAnswer}</p><small>{question.answerPool ? `Answer pool: ${question.answerPool.name}${question.answerCount ? ` · Shows ${question.answerCount}` : ''}` : `${question.options.length - 1} static wrong answers`}</small><button className="card-edit" onClick={() => setEditing(question)}>Edit question</button></article>)}</div>}</section>{(showCreate || editing) && <Modal title={editing ? 'Edit common question' : 'New common question'} onClose={closeModal} wide><p className="modal-intro">This question can be added to any quiz in your workspace.</p><QuestionForm key={editing?.id ?? 'new'} pools={pools} onSave={save} saving={saving} submitLabel={editing ? 'Save changes' : 'Save common question'} initial={editing ?? undefined} /></Modal>}</>;
}

function AnswerPoolForm({ initial, onSave, saving }: { initial?: AnswerPool; onSave: (data: PoolData) => Promise<void>; saving: boolean }) {
  const [name, setName] = useState(initial?.name ?? ''), [answers, setAnswers] = useState(initial?.answers.map((answer) => answer.value) ?? ['', '', '']), [formError, setFormError] = useState('');
  const updateAnswer = (index: number, value: string) => setAnswers((current) => current.map((answer, i) => i === index ? value : answer));
  async function submit(event: FormEvent) { event.preventDefault(); setFormError(''); if (!answers.some((answer) => answer.trim())) { setFormError('Add at least one answer.'); return; } try { await onSave({ name, answers: answers.filter((answer) => answer.trim()) }); } catch (err) { setFormError(err instanceof Error ? err.message : 'Could not save this answer pool'); } }
  return <form onSubmit={submit}><label>Pool name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Common geography distractors" maxLength={200} required /></label><fieldset><legend>Wrong answers</legend>{answers.map((answer, index) => <input key={index} value={answer} onChange={(event) => updateAnswer(index, event.target.value)} placeholder={`Answer ${index + 1}`} maxLength={500} />)}<button className="inline-button" type="button" onClick={() => setAnswers((current) => [...current, ''])}>+ Add another answer</button></fieldset>{formError && <p className="error">{formError}</p>}<button className="primary" disabled={saving}>{saving ? 'Saving...' : initial ? 'Save changes' : 'Save answer pool'}</button></form>;
}

function AnswerPoolsPage() {
  const [pools, setPools] = useState<AnswerPool[]>([]), [showCreate, setShowCreate] = useState(false), [editing, setEditing] = useState<AnswerPool | null>(null), [saving, setSaving] = useState(false), [error, setError] = useState('');
  const load = useCallback(async () => { try { setPools(await request<AnswerPool[]>('/quizzes/answer-pools')); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load answer pools'); } }, []); useEffect(() => { void load(); }, [load]);
  async function save(data: PoolData) { setSaving(true); try { await request(editing ? `/quizzes/answer-pools/${editing.id}` : '/quizzes/answer-pools', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) }); setShowCreate(false); setEditing(null); await load(); } finally { setSaving(false); } }
  const closeModal = () => { setShowCreate(false); setEditing(null); };
  return <><PageHeading eyebrow="REUSABLE RESPONSES" title="Answer Pools" description="Maintain sets of wrong answers that can be attached to questions." action={<button className="primary" onClick={() => setShowCreate(true)}>+ New answer pool</button>} />{error && <p className="error">{error}</p>}<section className="surface"><div className="surface-head"><div><h2>Saved pools</h2><p>{pools.length} answer pool{pools.length === 1 ? '' : 's'}</p></div></div>{pools.length === 0 ? <Empty icon="O" title="No answer pools yet" copy="Pool answers are used as reusable wrong-answer options." /> : <div className="pool-grid">{pools.map((pool) => <article className="pool-card" key={pool.id}><div className="pool-title"><span className="list-icon">O</span><div><h3>{pool.name}</h3><small>{pool.answers.length} answers</small></div></div><div className="pool-answers">{pool.answers.slice(0, 6).map((answer) => <span key={answer.id}>{answer.value}</span>)}{pool.answers.length > 6 && <span>+{pool.answers.length - 6} more</span>}</div><p>Used by {(pool._count?.questions ?? 0) + (pool._count?.commonQuestions ?? 0)} question{(pool._count?.questions ?? 0) + (pool._count?.commonQuestions ?? 0) === 1 ? '' : 's'}</p><button className="card-edit" onClick={() => setEditing(pool)}>Edit pool</button></article>)}</div>}</section>{(showCreate || editing) && <Modal title={editing ? 'Edit answer pool' : 'New answer pool'} onClose={closeModal}><p className="modal-intro">Each answer in this pool can be used as a wrong answer on a question.</p><AnswerPoolForm key={editing?.id ?? 'new'} initial={editing ?? undefined} onSave={save} saving={saving} /></Modal>}</>;
}

export default function App() { const { path, go } = useRoute(); const quizMatch = path.match(/^\/quizzes\/(\d+)$/); const page = quizMatch ? <QuizPage id={Number(quizMatch[1])} go={go} /> : path === '/questions' ? <CommonQuestionsPage /> : path === '/answer-pools' ? <AnswerPoolsPage /> : <QuizList go={go} />; return <AdminShell path={path} go={go}>{page}</AdminShell>; }
