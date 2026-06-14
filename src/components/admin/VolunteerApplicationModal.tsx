import React, { useState } from 'react';
import {
  X, Mail, MessageSquare, MapPin, School, Cake, FileText,
  Heart, CheckCircle, XCircle, Clock, User, Wallet,
} from 'lucide-react';

export interface VolunteerApplication {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  date_of_birth: string;
  location: string;
  telegram_or_phone: string;
  school_name: string | null;
  what_you_bring: string;
  anything_else: string | null;
  commit_to_deposit: boolean;
  notes: string | null;
  status: string;
  payment_status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  application: VolunteerApplication;
  onClose: () => void;
  onStatusChange: (id: string, status: VolunteerApplication['status']) => Promise<void>;
  onPaymentStatusChange: (id: string, paymentStatus: VolunteerApplication['payment_status']) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const STATUSES: VolunteerApplication['status'][] = ['pending', 'approved', 'rejected', 'waitlisted', 'contacted'];
const PAYMENT_STATUSES: VolunteerApplication['payment_status'][] = ['pending', 'paid', 'overdue', 'refunded'];

const formatDate = (d?: string | null) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
};

const statusBadge = (s: string) => {
  switch (s) {
    case 'approved':   return 'bg-green-100 text-green-800 border-green-300';
    case 'rejected':   return 'bg-red-100 text-red-800 border-red-300';
    case 'waitlisted': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'contacted':  return 'bg-sky-100 text-sky-800 border-sky-300';
    default:           return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  }
};

const statusIcon = (s: string) => {
  switch (s) {
    case 'approved':   return <CheckCircle size={18} className="text-green-600" />;
    case 'rejected':   return <XCircle size={18} className="text-red-600" />;
    case 'waitlisted': return <Clock size={18} className="text-orange-500" />;
    case 'contacted':  return <MessageSquare size={18} className="text-sky-600" />;
    default:           return <Clock size={18} className="text-yellow-600" />;
  }
};

const Row: React.FC<{ icon: any; label: string; value: React.ReactNode; color?: string }> = ({
  icon: Icon, label, value, color = 'text-gray-400',
}) => (
  <div className="flex items-start py-2.5 border-b border-gray-100 last:border-0">
    <Icon size={15} className={`mr-3 mt-0.5 flex-shrink-0 ${color}`} />
    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 flex-shrink-0 mt-0.5">{label}</span>
    <span className="text-sm text-gray-800 flex-1 min-w-0 break-words">{value}</span>
  </div>
);

const VolunteerApplicationModal: React.FC<Props> = ({
  application, onClose, onStatusChange, onPaymentStatusChange, onDelete,
}) => {
  const [busy, setBusy] = useState(false);
  const telegram = application.telegram_or_phone;
  const telegramHandle = telegram?.startsWith('@') ? telegram.slice(1) : telegram;
  const isTelegram = !!telegram && !/^\+?\d/.test(telegram);

  // Parse `notes` (free-form catch-all for dynamic question answers) into rows
  const notesRows: Array<{ label: string; value: string }> = [];
  if (application.notes) {
    application.notes.split('\n').forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) return;
      const m = line.match(/^([^:]+):\s*(.+)$/);
      if (!m) return;
      const value = m[2].trim();
      if (!value || ['N/A','None','Not Specified','null','-'].includes(value)) return;
      if (/^https?:\/\//i.test(value)) return;
      notesRows.push({ label: m[1].trim(), value });
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-gradient-to-r from-rose-700 to-rose-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
              <User size={24} className="text-white/80" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{application.full_name}</h2>
              <p className="text-rose-100 text-sm">{application.location}{application.school_name ? ` · ${application.school_name}` : ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-100 text-xs font-bold border border-rose-300/40">
              <Heart size={12} /> Volunteer
            </span>
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${statusBadge(application.status)}`}>
              {statusIcon(application.status)}
              <span className="capitalize">{application.status}</span>
            </div>
            <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: identity + essays */}
            <div className="space-y-5 min-w-0">
              <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User size={16} className="text-rose-600" /> Personal Information
                </h3>
                <div className="divide-y divide-gray-100">
                  <Row icon={Mail} label="Email" value={
                    <a href={`mailto:${application.email}`} className="text-blue-600 hover:underline">{application.email}</a>
                  } color="text-blue-400" />
                  <Row icon={MessageSquare} label="Contact" value={
                    isTelegram ? (
                      <a href={`https://t.me/${telegramHandle}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">{telegram}</a>
                    ) : telegram
                  } color="text-sky-400" />
                  <Row icon={Cake} label="Birthday" value={formatDate(application.date_of_birth)} color="text-pink-400" />
                  <Row icon={MapPin} label="Location" value={application.location} color="text-red-400" />
                  {application.school_name && (
                    <Row icon={School} label="School" value={application.school_name} color="text-purple-400" />
                  )}
                </div>
              </section>

              <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-amber-600" /> Volunteer Responses
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">What they bring</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap break-words leading-relaxed">
                      {application.what_you_bring}
                    </p>
                  </div>
                  {application.anything_else && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Anything else</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap break-words leading-relaxed">
                        {application.anything_else}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {notesRows.length > 0 && (
                <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-indigo-500" /> Additional Responses
                  </h3>
                  <div className="divide-y divide-gray-100">
                    {notesRows.map((row, i) => (
                      <div key={i} className="flex items-start py-2 gap-3">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide w-32 shrink-0 pt-0.5">{row.label}</span>
                        <span className="text-sm text-gray-800 flex-1 min-w-0 whitespace-pre-wrap break-words">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right: commitment + admin controls */}
            <div className="space-y-5 min-w-0">
              <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Wallet size={16} className="text-emerald-600" /> Deposit Commitment
                </h3>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${
                  application.commit_to_deposit
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {application.commit_to_deposit ? 'Yes — committed' : 'No — declined'}
                </div>
                <p className="text-xs text-gray-500 mt-3">Payment status: <span className="font-semibold capitalize">{application.payment_status}</span></p>
              </section>

              <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Admin Actions</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Application Status</label>
                    <select
                      value={application.status}
                      disabled={busy}
                      onChange={async (e) => {
                        setBusy(true);
                        try { await onStatusChange(application.id, e.target.value as any); }
                        finally { setBusy(false); }
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                    >
                      {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Payment Status</label>
                    <select
                      value={application.payment_status}
                      disabled={busy}
                      onChange={async (e) => {
                        setBusy(true);
                        try { await onPaymentStatusChange(application.id, e.target.value as any); }
                        finally { setBusy(false); }
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                    >
                      {PAYMENT_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      if (!confirm(`Permanently delete ${application.full_name}'s volunteer application?`)) return;
                      setBusy(true);
                      try { await onDelete(application.id); } finally { setBusy(false); }
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Delete Application
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50/80 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-gray-400">
            Submitted {formatDate(application.created_at)} · <span className="font-mono">#{application.id.substring(0, 8)}</span>
          </div>
          {isTelegram && (
            <a
              href={`https://t.me/${telegramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
            >
              <MessageSquare size={15} /> Open Telegram
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerApplicationModal;
