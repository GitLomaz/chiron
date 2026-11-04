import { useState } from 'react';

type Pair = { question: string; answer: string };
type Progress = { matched: number[]; mistakes: number };
type Selection = { side: 'left' | 'right'; index: number };

export function MatchingQuestion({ pairs, progress, disabled, onMatch }: { pairs: Pair[]; progress: Progress | null; disabled: boolean; onMatch: (left: number, right: number) => void }) {
  const [selected, setSelected] = useState<Selection | null>(null);
  const [wrongMatch, setWrongMatch] = useState<{ left: number; right: number } | null>(null);
  const found = progress?.matched ?? [];
  const remaining = Math.max(0, 3 - (progress?.mistakes ?? 0));
  const showingSolutions = remaining === 0 && wrongMatch === null;
  const order = [...pairs.keys()].reverse();

  function select(side: Selection['side'], index: number) {
    if (wrongMatch) return;
    if (!selected || selected.side === side) { setSelected({ side, index }); return; }
    const left = side === 'left' ? index : selected.index;
    const right = side === 'right' ? index : selected.index;
    if (left !== right) {
      setWrongMatch({ left, right });
      window.setTimeout(() => { setWrongMatch(null); setSelected(null); }, 700);
    } else setSelected(null);
    onMatch(left, right);
  }

  function option(side: Selection['side'], index: number, text: string) {
    const matched = found.includes(index);
    const active = selected?.side === side && selected.index === index;
    const wrong = wrongMatch?.[side] === index;
    return <button type="button" key={index} className={`matching-option${active ? ' is-selected' : ''}${wrong ? ' is-wrong' : ''}${matched ? ' is-matched' : ''}`} disabled={disabled || matched || wrongMatch !== null} aria-pressed={active || wrong} onClick={() => select(side, index)}><span className="matching-option-text">{text}</span>{matched && <span className="matching-option-check" aria-label="Matched">✓</span>}</button>;
  }

  return <div className="matching-question">
    <div className="matching-intro"><p>Select an item from either column, then choose its match.</p><div className="matching-stats" aria-live="polite"><span><strong>{found.length}/{pairs.length}</strong> matched</span><span className={remaining === 1 ? 'matching-tries is-low' : 'matching-tries'}><strong>{remaining}</strong> {remaining === 1 ? 'try' : 'tries'} left</span></div></div>
    {showingSolutions ? <section className="matching-solution" aria-label="Correct matches"><header><h2>Correct matches</h2><p>Here are the pairs for this question.</p></header><ol>{pairs.map((pair, index) => <li key={index}><span>{pair.question}</span><b aria-hidden="true">→</b><strong>{pair.answer}</strong></li>)}</ol></section> : <div className="matching-columns"><section className="matching-column" aria-label="Questions"><h2>Questions</h2><div className="matching-options">{pairs.map((pair, index) => option('left', index, pair.question))}</div></section><section className="matching-column" aria-label="Answers"><h2>Answers</h2><div className="matching-options">{order.map((index) => option('right', index, pairs[index].answer))}</div></section></div>}
  </div>;
}
