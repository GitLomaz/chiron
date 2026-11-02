import { useEffect, useState } from 'react';

type Confirmation = { title: string; copy: string; confirmLabel: string; onConfirm: () => void };
const eventName = 'quizboard:student-confirm';

export function confirmAction(confirmation: Confirmation) {
  window.dispatchEvent(new CustomEvent<Confirmation>(eventName, { detail: confirmation }));
}

export function ConfirmDialogHost() {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  useEffect(() => {
    const open = (event: Event) => setConfirmation((event as CustomEvent<Confirmation>).detail);
    window.addEventListener(eventName, open);
    return () => window.removeEventListener(eventName, open);
  }, []);
  if (!confirmation) return null;
  return <div className="confirm-dialog-backdrop" role="presentation" onMouseDown={() => setConfirmation(null)}><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="student-confirm-title" onMouseDown={(event) => event.stopPropagation()}><p className="eyebrow">CONFIRM ACTION</p><h2 id="student-confirm-title">{confirmation.title}</h2><p>{confirmation.copy}</p><div><button className="text-button" type="button" onClick={() => setConfirmation(null)}>Cancel</button><button className="confirm-danger-button" type="button" onClick={() => { confirmation.onConfirm(); setConfirmation(null); }}>{confirmation.confirmLabel}</button></div></section></div>;
}
