import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

/**
 * In-panel replacement for window.confirm():
 *
 *   if (!(await confirmAction('Delete this event?', { danger: true }))) return;
 *
 * <ConfirmHost /> (mounted once in AdminLayout) renders the dialog.
 */
export interface ConfirmOptions {
  /** Short heading. Defaults to "Are you sure?". */
  title?: string;
  /** Text on the confirm button. Defaults to "Confirm" (or "Delete" when danger). */
  confirmLabel?: string;
  /** Red styling for destructive or irreversible actions. */
  danger?: boolean;
}

interface Request extends ConfirmOptions {
  message: string;
  resolve: (ok: boolean) => void;
}

let show: ((r: Request) => void) | null = null;

export function confirmAction(message: string, options: ConfirmOptions = {}): Promise<boolean> {
  // Fallback if the host isn't mounted (shouldn't happen inside the panel).
  if (!show) return Promise.resolve(window.confirm(message));
  return new Promise(resolve => show!({ ...options, message, resolve }));
}

export function ConfirmHost() {
  const [req, setReq] = useState<Request | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    show = r => setReq(prev => {
      prev?.resolve(false); // a newer question replaces an unanswered one
      return r;
    });
    return () => { show = null; };
  }, []);

  const close = (ok: boolean) => {
    req?.resolve(ok);
    setReq(null);
  };

  useEffect(() => {
    if (!req) return;
    // Destructive actions start on Cancel so Enter can't delete by accident.
    (req.danger ? cancelRef : confirmRef).current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Tab') {
        // Keep focus inside the two buttons.
        const items = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[];
        const i = items.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length]?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req]);

  if (!req) return null;
  const Icon = req.danger ? AlertTriangle : HelpCircle;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={() => close(false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${req.danger ? 'bg-red-100 text-red-600' : 'bg-diplomatic-100 text-diplomatic-700'}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-title" className="font-semibold text-gray-900">{req.title || 'Are you sure?'}</h2>
            <p id="confirm-message" className="mt-1 whitespace-pre-line text-sm text-gray-600">{req.message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            onClick={() => close(false)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-500"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={() => close(true)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${req.danger ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500' : 'bg-diplomatic-600 hover:bg-diplomatic-700 focus-visible:ring-diplomatic-500'}`}
          >
            {req.confirmLabel || (req.danger ? 'Delete' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
