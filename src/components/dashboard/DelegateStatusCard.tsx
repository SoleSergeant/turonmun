import React from 'react';
import { Check, Send } from 'lucide-react';
import type { DelegateStatus } from '@/lib/delegateStatus';

const TONE = {
  wait: 'bg-white/10 text-white/80',
  action: 'bg-gold-400 text-diplomatic-950',
  good: 'bg-emerald-400/20 text-emerald-300',
  closed: 'bg-white/10 text-white/70',
} as const;

/** The delegate's current status, what (if anything) to do next, and progress. */
export default function DelegateStatusCard({ status, telegramUrl, children }: { status: DelegateStatus; telegramUrl?: string; children?: React.ReactNode }) {
  return (
    <section aria-labelledby="status-title" className="rounded-xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[status.tone]}`}>{status.label}</span>
      <h2 id="status-title" className="mt-3 text-xl font-semibold text-white sm:text-2xl">{status.title}</h2>
      <p className="mt-1 max-w-2xl text-white/70">{status.text}</p>

      {status.needsPayment && telegramUrl && (
        <a href={telegramUrl} target="_blank" rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gold-400 px-4 py-2.5 text-sm font-semibold text-diplomatic-950 hover:bg-gold-300">
          <Send className="h-4 w-4" aria-hidden /> Message us on Telegram
        </a>
      )}

      {status.steps.length > 0 && (
        <ol className="mt-6 grid grid-cols-5 gap-1.5" aria-label="Progress">
          {status.steps.map(step => (
            <li key={step.name} aria-current={step.state === 'current' ? 'step' : undefined}>
              <div className={`h-1.5 rounded-full ${step.state === 'done' ? 'bg-emerald-400' : step.state === 'current' ? 'bg-gold-400' : 'bg-white/10'}`} />
              <p className={`mt-2 flex items-start gap-1 text-[11px] leading-tight sm:text-xs ${step.state === 'todo' ? 'text-white/40' : 'text-white/80'}`}>
                {step.state === 'done' && <Check className="mt-px hidden h-3 w-3 shrink-0 text-emerald-400 sm:block" aria-hidden />}
                <span>{step.name}</span>
                <span className="sr-only">{step.state === 'done' ? '(done)' : step.state === 'current' ? '(next)' : ''}</span>
              </p>
            </li>
          ))}
        </ol>
      )}
      {children}
    </section>
  );
}
