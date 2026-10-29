import { GenerateQuizModal } from './GenerateQuizModal';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
type Pair = { question: string; answer: string };
type DataSet = { id: number; name: string; pairs: Pair[] };
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(Array.isArray(body?.message) ? body.message.join(', ') : body?.message || 'Something went wrong'); }
  return response.json() as Promise<T>;
}
function download(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
}
function parseCsv(text: string): Pair[] {
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false, closed = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) { if (c === '"' && input[i + 1] === '"') { field += '"'; i++; } else if (c === '"') { quoted = false; closed = true; } else field += c; }
    else if (c === '"' && !field && !closed) quoted = true;
    else if (c === ',' || c === '\n' || c === '\r') {
      row.push(field); field = ''; closed = false;
      if (c !== ',') { rows.push(row); row = []; if (c === '\r' && input[i + 1] === '\n') i++; }
    } else { if (closed || c === '"') throw new Error('Invalid CSV quoting.'); field += c; }
  }
  if (quoted) throw new Error('A quoted CSV field is not closed.');
  if (field || row.length || closed) { row.push(field); rows.push(row); }
  while (rows.length && rows[rows.length - 1].every((value) => !value.trim())) rows.pop();
  const header = rows.shift()?.map((value) => value.trim().toLowerCase());
  if (!header || header.length !== 2 || header[0] !== 'question' || header[1] !== 'answer') throw new Error('CSV must start with the headers question,answer.');
  if (rows.some((values) => values.length !== 2)) throw new Error('Each CSV row must contain exactly two columns.');
  return rows.map(([question, answer]) => ({ question, answer }));
}
function validate(name: string, pairs: Pair[]) {
  if (!name.trim()) throw new Error('Enter a data set name.');
  if (!pairs.length || pairs.length > 5000) throw new Error('Add between 1 and 5,000 pairs.');
  if (pairs.some((p) => typeof p.question !== 'string' || typeof p.answer !== 'string' || !p.question.trim() || !p.answer.trim() || p.question.length > 2000 || p.answer.length > 2000)) throw new Error('Every pair needs a question and answer of at most 2,000 characters.');
}

export function DataSetsPage({ go }: { go: (path: string) => void }) {
  const [generating, setGenerating] = useState<DataSet | null>(null);
  const [sets, setSets] = useState<DataSet[]>([]), [editing, setEditing] = useState<DataSet | null>(null), [creating, setCreating] = useState(false), [name, setName] = useState(''), [pairs, setPairs] = useState<Pair[]>([]), [error, setError] = useState(''), [saving, setSaving] = useState(false);
  const load = useCallback(async () => { try { setSets(await request<DataSet[]>('/data-sets')); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load data sets'); } }, []);
  useEffect(() => { void load(); }, [load]);
  function edit(set?: DataSet) { setEditing(set ?? null); setCreating(!set); setName(set?.name ?? ''); setPairs(set?.pairs.map(({ question, answer }) => ({ question, answer })) ?? [{ question: '', answer: '' }]); setError(''); }
  async function save(event: FormEvent) { event.preventDefault(); setError(''); try { validate(name, pairs); setSaving(true); await request(editing ? `/data-sets/${editing.id}` : '/data-sets', { method: editing ? 'PUT' : 'POST', body: JSON.stringify({ name, pairs }) }); setEditing(null); setCreating(false); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not save data set'); } finally { setSaving(false); } }
  async function remove(set: DataSet) { if (!window.confirm(`Delete “${set.name}” and all its pairs?`)) return; try { await request(`/data-sets/${set.id}`, { method: 'DELETE' }); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not delete data set'); } }
  return <><div className="page-heading"><div><p className="eyebrow">SHARED LIBRARY</p><h1>Data Sets</h1><p>Organize question and answer pairs into reusable sets.</p></div><div className="dataset-actions"><button className="subtle-button" onClick={() => go('/import')}>Import a file</button><button className="primary" onClick={() => edit()}>+ New data set</button></div></div>{error && <p className="error" role="alert">{error}</p>}<section className="surface"><div className="surface-head"><div><h2>Saved data sets</h2><p>{sets.length} data set{sets.length === 1 ? '' : 's'}</p></div></div>{sets.length === 0 ? <div className="empty"><span>≡</span><h3>No data sets yet</h3><p>Create a set or import question and answer pairs from a file.</p></div> : <div className="pool-grid">{sets.map((set) => <article className="pool-card" key={set.id}><div className="pool-title"><span className="list-icon">≡</span><div><h3>{set.name}</h3><small>{set.pairs.length} pair{set.pairs.length === 1 ? '' : 's'}</small></div></div><div className="dataset-preview">{set.pairs.slice(0, 3).map((pair, index) => <p key={index}><strong>{pair.question}</strong><br />{pair.answer}</p>)}</div><div className="dataset-actions"><button className="secondary" onClick={() => setGenerating(set)}>Generate quiz</button><button className="card-edit" onClick={() => edit(set)}>Edit set</button><button className="inline-button" onClick={() => void remove(set)}>Delete</button></div></article>)}</div>}</section>{generating && <GenerateQuizModal dataSet={generating} onClose={() => setGenerating(null)} onCreated={(id) => go(`/quizzes/${id}`)} />}{(creating || editing) && <div className="modal-backdrop" onMouseDown={() => { setCreating(false); setEditing(null); setError(''); }}><section className="modal modal-wide" role="dialog" aria-modal="true" aria-label={editing ? 'Edit data set' : 'New data set'} onMouseDown={(event) => event.stopPropagation()}><div className="modal-head"><h2>{editing ? 'Edit data set' : 'New data set'}</h2><button className="close-button" onClick={() => { setCreating(false); setEditing(null); setError(''); }} aria-label="Close">×</button></div><form onSubmit={save}><label>Set name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={200} required autoFocus /></label><fieldset><legend>Question and answer pairs</legend><div className="dataset-pairs">{pairs.map((pair, index) => <div className="dataset-pair" key={index}><label>Question {index + 1}<textarea rows={2} maxLength={2000} required value={pair.question} onChange={(event) => setPairs(pairs.map((p, i) => i === index ? { ...p, question: event.target.value } : p))} /></label><label>Answer {index + 1}<textarea rows={2} maxLength={2000} required value={pair.answer} onChange={(event) => setPairs(pairs.map((p, i) => i === index ? { ...p, answer: event.target.value } : p))} /></label><button className="subtle-button" type="button" onClick={() => setPairs(pairs.filter((_, i) => i !== index))} aria-label={`Remove pair ${index + 1}`}>Remove</button></div>)}</div><button className="inline-button" type="button" onClick={() => setPairs([...pairs, { question: '', answer: '' }])}>+ Add pair</button></fieldset>{error && <p className="error" role="alert">{error}</p>}<button className="primary" disabled={saving}>{saving ? 'Saving...' : 'Save data set'}</button></form></section></div>}</>;
}

export function ImportPage({ go }: { go: (path: string) => void }) {
  const [name, setName] = useState(''), [pairs, setPairs] = useState<Pair[]>([]), [fileName, setFileName] = useState(''), [error, setError] = useState(''), [saving, setSaving] = useState(false);
  async function readFile(file?: File) { setPairs([]); setFileName(''); setName(''); setError(''); if (!file) return; try { const text = await file.text(); let parsed: Pair[]; let importedName = file.name.replace(/\.(csv|json)$/i, ''); if (/\.csv$/i.test(file.name)) parsed = parseCsv(text); else if (/\.json$/i.test(file.name)) { const data: unknown = JSON.parse(text); if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('JSON must be an object with a name and pairs array.'); const obj = data as { name?: unknown; pairs?: unknown }; if (typeof obj.name !== 'string' || !Array.isArray(obj.pairs) || obj.pairs.some((pair: unknown) => !pair || typeof pair !== 'object' || Array.isArray(pair))) throw new Error('JSON must contain a name and an array of question and answer pairs.'); importedName = obj.name; parsed = obj.pairs as Pair[]; } else throw new Error('Choose a CSV or JSON file.'); validate(importedName, parsed); setName(importedName); setPairs(parsed); setFileName(file.name); } catch (err) { setError(err instanceof SyntaxError ? 'Invalid JSON file.' : err instanceof Error ? err.message : 'Could not read file'); } }
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); try { validate(name, pairs); setSaving(true); await request('/data-sets', { method: 'POST', body: JSON.stringify({ name, pairs: pairs.map(({ question, answer }) => ({ question, answer })) }) }); go('/data-sets'); } catch (err) { setError(err instanceof Error ? err.message : 'Could not import data set'); } finally { setSaving(false); } }
  return <><div className="page-heading"><div><p className="eyebrow">DATA SETS</p><h1>Import</h1><p>Upload a CSV or JSON file to create a data set of question and answer pairs.</p></div></div><section className="surface dataset-import"><h2>Download a template</h2><p>Use the CSV columns <strong>question</strong> and <strong>answer</strong>, or the JSON format shown in the template. Each file creates one data set.</p><div className="dataset-actions"><button className="subtle-button" onClick={() => download('data-set-template.csv', 'question,answer\r\n"What is the capital of France?",Paris\r\n', 'text/csv;charset=utf-8')}>Download CSV template</button><button className="subtle-button" onClick={() => download('data-set-template.json', JSON.stringify({ name: 'Geography', pairs: [{ question: 'What is the capital of France?', answer: 'Paris' }] }, null, 2), 'application/json')}>Download JSON template</button></div><form onSubmit={submit}><label>Choose a file<input type="file" accept=".csv,.json,text/csv,application/json" onChange={(event) => void readFile(event.target.files?.[0])} /></label>{fileName && <><label>Data set name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={200} required /></label><p>{fileName} · {pairs.length} pair{pairs.length === 1 ? '' : 's'} ready to import. You can edit pairs on the Data Sets page after importing.</p><div className="dataset-preview">{pairs.slice(0, 5).map((pair, index) => <p key={index}><strong>{pair.question}</strong><br />{pair.answer}</p>)}</div></>}{error && <p className="error" role="alert">{error}</p>}<button className="primary" disabled={!fileName || saving}>{saving ? 'Importing...' : 'Import data set'}</button></form></section></>;
}
