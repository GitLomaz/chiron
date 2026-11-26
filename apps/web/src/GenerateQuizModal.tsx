import { useState } from 'react';
import type { FormEvent } from 'react';
import { AUTH_TOKEN_KEY, expireAuthSession } from './auth-session';

const API_URL = import.meta.env.VITE_API_URL ?? (['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? `${window.location.protocol}//${window.location.hostname}:3000`
  : window.location.origin);
type QuestionType = 'multiple_choice' | 'true_false' | 'matching' | 'short_answer';
const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'matching', label: 'Matching' },
  { value: 'short_answer', label: 'Short answer' },
];

type DataSetSource = { id: number; name: string; pairs: { question: string; answer: string }[] };

export function GenerateQuizModal({ dataSets, onClose, onCreated }: { dataSets: DataSetSource[]; onClose: () => void; onCreated: (id: number) => void }) {
  const pairCount = dataSets.reduce((total, dataSet) => total + dataSet.pairs.length, 0);
  const sourceLabel = dataSets.length === 1 ? dataSets[0].name : `${dataSets.length} selected data sets`;
  const [title, setTitle] = useState(`${dataSets.length === 1 ? dataSets[0].name : 'Combined data sets'} quiz`.slice(0, 200));
  const [questionCount, setQuestionCount] = useState('10');
  const [gameCount, setGameCount] = useState('0');
  const [types, setTypes] = useState<QuestionType[]>(QUESTION_TYPES.map(({ value }) => value));
  const [saving, setSaving] = useState(false), [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!types.length) { setError('Select at least one question type.'); return; }
    if (Number(questionCount) < types.length) { setError('Choose at least one question for each selected type.'); return; }
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const response = await fetch(`${API_URL}/data-sets/generate-quiz`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ dataSetIds: dataSets.map((dataSet) => dataSet.id), title, questionCount: Number(questionCount), questionTypes: types, gameCount: Number(gameCount) }) });
      if (response.status === 401) expireAuthSession();
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(Array.isArray(result?.message) ? result.message.join(', ') : result?.message || 'Could not generate quiz');
      onCreated(result.id);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not generate quiz'); }
    finally { setSaving(false); }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={() => { if (!saving) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-label="Generate quiz" onMouseDown={(event) => event.stopPropagation()}><div className="modal-head"><h2>Generate a quiz</h2><button className="close-button" type="button" disabled={saving} onClick={onClose} aria-label="Close">×</button></div><p className="modal-intro">Create a quiz from {sourceLabel} ({pairCount} pairs). You can review and edit it afterward.</p><form onSubmit={submit}><label>Quiz title<input autoFocus required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Number of questions<input type="number" min={1} max={100} step={1} required value={questionCount} onChange={(event) => setQuestionCount(event.target.value)} /></label><fieldset className="generate-types"><legend>Question types</legend>{QUESTION_TYPES.map(({ value, label }) => <label key={value}><input type="checkbox" checked={types.includes(value)} onChange={(event) => setTypes((current) => event.target.checked ? [...current, value] : current.filter((type) => type !== value))} />{label}</label>)}</fieldset><label>Number of games<input type="number" min={0} max={20} step={1} required value={gameCount} onChange={(event) => setGameCount(event.target.value)} /></label><p className="generate-help">Selected types are mixed evenly. Matching questions contain up to four pairs. Pairs can be reused; games are spread through the quiz. False statements are generated when the data sets contain alternative answers. Pairs with answers longer than 500 characters cannot be used. Matching also requires questions of at most 500 characters.</p>{error && <p className="error" role="alert">{error}</p>}<div className="form-actions"><button type="button" className="subtle-button" disabled={saving} onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Generating…' : 'Generate quiz'}</button></div></form></section></div>;
}
