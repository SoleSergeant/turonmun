/**
 * What a delegate's application means to them, in one place, so the
 * dashboard overview and My Application always say the same thing.
 */
export type StepState = 'done' | 'current' | 'todo';
export type StatusTone = 'wait' | 'action' | 'good' | 'closed';

export interface DelegateStatus {
  /** Short badge text, e.g. "Under review". */
  label: string;
  title: string;
  text: string;
  tone: StatusTone;
  /** Accepted and the fee is still due. */
  needsPayment: boolean;
  /** Progress through the normal path; empty when the application ended (not accepted, refunded). */
  steps: { name: string; state: StepState }[];
}

interface AppLike {
  status?: string | null;
  payment_status?: string | null;
  payment_amount?: number | null;
  assigned_committee_id?: string | null;
  checked_in_at?: string | null;
}

const STEP_NAMES = ['Applied', 'Accepted', 'Paid', 'Seated', 'Checked in'];

const fee = (n?: number | null) => (n ? `${n.toLocaleString('en-US').replace(/,/g, ' ')} UZS` : 'the fee');

export function delegateStatus(app: AppLike, seat?: { committee?: string | null; country?: string | null }): DelegateStatus {
  const status = app.status || 'pending';
  const paid = app.payment_status === 'paid';
  const seated = !!(app.assigned_committee_id || seat?.country);
  const arrived = !!app.checked_in_at;

  const steps = (reached: number) =>
    STEP_NAMES.map((name, i) => ({ name, state: (i < reached ? 'done' : i === reached ? 'current' : 'todo') as StepState }));

  if (app.payment_status === 'refunded') {
    return { label: 'Refunded', tone: 'closed', needsPayment: false, steps: [],
      title: 'Your fee has been refunded', text: 'Your place for this season is cancelled. Questions? Write to us on Telegram.' };
  }
  if (status === 'rejected') {
    return { label: 'Not accepted', tone: 'closed', needsPayment: false, steps: [],
      title: "Your application wasn't accepted this time",
      text: 'Thank you for applying. Places were limited this season, and we hope to see you at the next one.' };
  }
  if (status === 'waitlisted') {
    return { label: 'Waitlist', tone: 'wait', needsPayment: false, steps: steps(1),
      title: "You're on the waitlist", text: "If a place opens up, we'll email you. You don't need to do anything for now." };
  }
  if (status !== 'approved') {
    return { label: 'Under review', tone: 'wait', needsPayment: false, steps: steps(1),
      title: "We're reviewing your application", text: "You'll get an email when there's a decision. Nothing to do for now." };
  }
  if (!paid) {
    return { label: 'Payment due', tone: 'action', needsPayment: true, steps: steps(2),
      title: "You're accepted. Pay the fee to confirm your place",
      text: `Pay ${fee(app.payment_amount)}. Our team will message you on Telegram with how to pay; if you haven't heard from us, write to us there.` };
  }
  if (!seated) {
    return { label: 'Paid', tone: 'wait', needsPayment: false, steps: steps(3),
      title: 'Payment received. Your committee and country are next',
      text: "We'll email you when your seat is assigned." };
  }
  const where = [seat?.country, seat?.committee].filter(Boolean).join(' in ');
  if (!arrived) {
    return { label: 'Seated', tone: 'good', needsPayment: false, steps: steps(4),
      title: where ? `You're representing ${where}` : 'Your seat is assigned',
      text: 'Read your committee guide and prepare your position paper. Bring your check-in pass on the day.' };
  }
  return { label: 'Checked in', tone: 'good', needsPayment: false, steps: steps(5),
    title: "You're checked in", text: 'Enjoy the conference.' };
}
