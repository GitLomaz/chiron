import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type Confirmation = { title: string; message: ReactNode; confirmLabel?: string; onConfirm: () => void };
const confirmationEvent = 'quizboard:confirm';

export function confirmAction(confirmation: Confirmation) {
  window.dispatchEvent(new CustomEvent<Confirmation>(confirmationEvent, { detail: confirmation }));
}

export function ConfirmDialog({ title, children, confirmLabel = 'Confirm', onConfirm, onClose, busy = false }: { title: string; children: ReactNode; confirmLabel?: string; onConfirm: () => void; onClose: () => void; busy?: boolean }) {
  return <div className="modal-backdrop confirm-dialog-backdrop" role="presentation" onMouseDown={() => { if (!busy) onClose(); }}><section className="modal confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-head"><h2 id="confirm-dialog-title">{title}</h2><button className="close-button" type="button" disabled={busy} onClick={onClose} aria-label="Close">×</button></div><p className="modal-intro">{children}</p><div className="form-actions"><button className="subtle-button" type="button" disabled={busy} onClick={onClose}>Cancel</button><button className="danger-button" type="button" disabled={busy} onClick={onConfirm}>{busy ? 'Working…' : confirmLabel}</button></div></section></div>;
}

export function ConfirmDialogHost() {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  useEffect(() => {
    const open = (event: Event) => setConfirmation((event as CustomEvent<Confirmation>).detail);
    window.addEventListener(confirmationEvent, open);
    return () => window.removeEventListener(confirmationEvent, open);
  }, []);
  return confirmation ? <ConfirmDialog title={confirmation.title} confirmLabel={confirmation.confirmLabel} onClose={() => setConfirmation(null)} onConfirm={() => { confirmation.onConfirm(); setConfirmation(null); }}>{confirmation.message}</ConfirmDialog> : null;
}
