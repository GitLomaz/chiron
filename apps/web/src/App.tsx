import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type Quiz = {
  id: number;
  title: string;
  description: string | null;
  createdAt: string;
  _count?: { questions: number };
};

type Question = {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
};

type QuizDetail = Quiz & { questions: Question[] };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const message = await response.json().catch(() => null);
    throw new Error(Array.isArray(message?.message) ? message.message.join(', ') : message?.message || 'Request failed');
  }
  return response.json() as Promise<T>;
}

function useRoute() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  const go = (nextPath: string) => {
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
  };
  return { path, go };
}

function QuizList({ go }: { go: (path: string) => void }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setQuizzes(await request<Quiz[]>('/quizzes'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load quizzes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createQuiz(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const quiz = await request<Quiz>('/quizzes', {
        method: 'POST', body: JSON.stringify({ title, description: description || undefined }),
      });
      go(`/quizzes/${quiz.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create quiz');
    } finally {
      setSaving(false);
    }
  }

  return <main className="container">
    <header className="hero">
      <p className="eyebrow">TRIVIA STUDIO</p>
      <h1>Build a better question bank.</h1>
      <p>Create focused quizzes, then add questions when you are ready.</p>
    </header>
    <section className="split">
      <div>
        <div className="section-heading"><h2>Your quizzes</h2><button className="text-button" onClick={() => void load()}>Refresh</button></div>
        {loading && <p className="state">Loading quizzes…</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {!loading && !error && quizzes.length === 0 && <p className="state">No quizzes yet. Create your first one to get started.</p>}
        <div className="quiz-list">
          {quizzes.map((quiz) => <button className="quiz-card" key={quiz.id} onClick={() => go(`/quizzes/${quiz.id}`)}>
            <span><strong>{quiz.title}</strong><small>{quiz.description || 'No description yet'}</small></span>
            <b>{quiz._count?.questions ?? 0}<small> questions</small></b>
          </button>)}
        </div>
      </div>
      <section className="panel">
        <h2>Create a quiz</h2>
        <form onSubmit={createQuiz}>
          <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. World capitals" required maxLength={200} /></label>
          <label>Description <span>optional</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will this quiz cover?" maxLength={2000} rows={4} /></label>
          <button className="primary" disabled={saving}>{saving ? 'Creating…' : 'Create quiz'}</button>
        </form>
      </section>
    </section>
  </main>;
}

function QuizPage({ id, go }: { id: number; go: (path: string) => void }) {
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [text, setText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setQuiz(await request<QuizDetail>(`/quizzes/${id}`)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load quiz'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  function updateOption(index: number, value: string) {
    setOptions((current) => current.map((option, optionIndex) => optionIndex === index ? value : option));
  }

  async function addQuestion(event: FormEvent) {
    event.preventDefault();
    const cleanOptions = options.map((option) => option.trim()).filter(Boolean);
    setSaving(true); setError('');
    try {
      await request(`/quizzes/${id}/questions`, { method: 'POST', body: JSON.stringify({ text, options: cleanOptions, correctAnswer }) });
      setText(''); setOptions(['', '', '', '']); setCorrectAnswer('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add question');
    } finally { setSaving(false); }
  }

  if (loading) return <main className="container"><p className="state">Loading quiz…</p></main>;
  if (error && !quiz) return <main className="container"><button className="text-button" onClick={() => go('/')}>← All quizzes</button><p className="error" role="alert">{error}</p></main>;
  if (!quiz) return null;

  return <main className="container">
    <button className="text-button back" onClick={() => go('/')}>← All quizzes</button>
    <header className="detail-head"><p className="eyebrow">QUIZ</p><h1>{quiz.title}</h1><p>{quiz.description || 'No description yet.'}</p></header>
    {error && <p className="error" role="alert">{error}</p>}
    <section className="detail-grid">
      <div>
        <div className="section-heading"><h2>Questions <span className="count">{quiz.questions.length}</span></h2></div>
        {quiz.questions.length === 0 ? <p className="state">This quiz has no questions yet.</p> : <ol className="questions">
          {quiz.questions.map((question) => <li key={question.id}><strong>{question.text}</strong><ul>{question.options.map((option) => <li className={option === question.correctAnswer ? 'correct' : ''} key={option}>{option}</li>)}</ul></li>)}
        </ol>}
      </div>
      <section className="panel">
        <h2>Add a question</h2>
        <form onSubmit={addQuestion}>
          <label>Question<textarea value={text} onChange={(e) => setText(e.target.value)} required maxLength={2000} rows={3} /></label>
          <fieldset><legend>Answer options</legend>{options.map((option, index) => <input key={index} value={option} onChange={(e) => updateOption(index, e.target.value)} placeholder={`Option ${index + 1}`} required={index < 2} maxLength={500} />)}</fieldset>
          <label>Correct answer<select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} required><option value="" disabled>Select an option</option>{options.filter(Boolean).map((option) => <option key={option} value={option.trim()}>{option}</option>)}</select></label>
          <button className="primary" disabled={saving}>{saving ? 'Adding…' : 'Add question'}</button>
        </form>
      </section>
    </section>
  </main>;
}

export default function App() {
  const { path, go } = useRoute();
  const match = path.match(/^\/quizzes\/(\d+)$/);
  return match ? <QuizPage id={Number(match[1])} go={go} /> : <QuizList go={go} />;
}
