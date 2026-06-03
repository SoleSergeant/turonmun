import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Clock, CheckCircle2, XCircle, ArrowRight, LogOut, Send, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props { userEmail: string }

interface AppRow {
  id: string;
  full_name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  committee_preference1: string;
  committee_preference2: string;
  notes: string | null;
  created_at: string;
}

interface AdminRow {
  id: string;
  role: string;
  committee_id: string | null;
  committee?: { name: string } | null;
}

/**
 * Dashboard for users whose application was for the Chair / Co-Chair role.
 * Three states:
 *   1. pending  — "We're reviewing your application"
 *   2. approved + no admin_users row yet — "Approved, awaiting committee assignment"
 *   3. approved + admin_users row — link to Chair Dashboard (live access)
 *   4. rejected — gentle thank-you message
 */
const ChairApplicantDashboard: React.FC<Props> = ({ userEmail }) => {
  const [application, setApplication] = useState<AppRow | null>(null);
  const [admin, setAdmin] = useState<AdminRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    (async () => {
      const { data: app } = await supabase
        .from('applications')
        .select('id, full_name, email, status, committee_preference1, committee_preference2, notes, created_at')
        .eq('email', userEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      setApplication(app as any);

      const { data: au } = await supabase
        .from('admin_users')
        .select('id, role, committee_id')
        .eq('email', userEmail)
        .eq('is_active', true)
        .single();
      if (au) {
        // Fetch committee name separately to avoid relationship issues
        let committee = null;
        if ((au as any).committee_id) {
          const { data: c } = await supabase
            .from('committees')
            .select('name')
            .eq('id', (au as any).committee_id)
            .single();
          committee = c;
        }
        setAdmin({ ...(au as any), committee });
      }
      setLoading(false);
    })();
  }, [userEmail]);

  const rolePref = (() => {
    const m = (application?.notes || '').match(/Role Preference:\s*([^\n]+)/);
    return m?.[1]?.trim() || 'Chair';
  })();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-diplomatic-900 via-diplomatic-800 to-diplomatic-700">
        <div className="text-white/70 text-sm">Loading…</div>
      </div>
    );
  }

  // Already assigned to a committee → push them to the chair dashboard
  const isAssigned = !!admin && (admin.role === 'chair' || admin.role === 'co_chair') && !!admin.committee_id;

  const status = application?.status || 'pending';

  return (
    <div className="min-h-screen bg-gradient-to-br from-diplomatic-900 via-diplomatic-800 to-diplomatic-700 px-4 py-12 flex items-start justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white text-sm">
            ← Back to site
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 border border-white/15 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-400/30 mb-4">
            <Shield className="h-8 w-8 text-purple-300" />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-1">
            {application?.full_name || userEmail}
          </h1>
          <p className="text-purple-300 text-sm font-semibold uppercase tracking-widest mb-6">
            Chair Application
          </p>

          {/* State 1 — assigned: live chair dashboard available */}
          {isAssigned && (
            <div className="space-y-4">
              <div className="px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-left flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">You're confirmed as {admin?.role === 'co_chair' ? 'Co-Chair' : 'Chair'} of {admin?.committee?.name || 'your committee'}.</p>
                  <p className="text-xs text-emerald-200/80 mt-1">Use the Chair Dashboard to manage delegates, review position papers, run sessions, and pick award winners.</p>
                </div>
              </div>
              <Link
                to="/chair-dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-diplomatic-950 font-bold rounded-xl transition-colors"
              >
                Open Chair Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* State 2 — approved but not yet assigned */}
          {!isAssigned && status === 'approved' && (
            <div className="space-y-3 text-left">
              <div className="px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Your application has been approved.</p>
                  <p className="text-xs text-emerald-200/80 mt-1">We're matching you to a committee. You'll get access to the Chair Dashboard once we assign you. We'll be in touch on Telegram.</p>
                </div>
              </div>
              <p className="text-white/60 text-xs">
                Preferences: <strong>1.</strong> {application?.committee_preference1 || '—'}{application?.committee_preference2 && <> · <strong>2.</strong> {application.committee_preference2}</>}
              </p>
            </div>
          )}

          {/* State 3 — pending */}
          {!isAssigned && status === 'pending' && (
            <div className="space-y-3 text-left">
              <div className="px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 flex items-start gap-3">
                <Clock className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Your chair application is under review.</p>
                  <p className="text-xs text-amber-200/80 mt-1">
                    Submitted {new Date(application?.created_at || '').toLocaleDateString()} for the <strong>{rolePref}</strong> role.
                    We'll reach out on Telegram with the decision.
                  </p>
                </div>
              </div>
              <p className="text-white/50 text-xs">
                Preferences: <strong>1.</strong> {application?.committee_preference1 || '—'}{application?.committee_preference2 && <> · <strong>2.</strong> {application.committee_preference2}</>}
              </p>
            </div>
          )}

          {/* State 4 — rejected */}
          {!isAssigned && status === 'rejected' && (
            <div className="space-y-3 text-left">
              <div className="px-4 py-3 rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 flex items-start gap-3">
                <XCircle className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Application not selected this season.</p>
                  <p className="text-xs text-red-200/80 mt-1">Thank you for applying. We'd love to see you at TuronMUN as a delegate or at a future conference.</p>
                </div>
              </div>
            </div>
          )}

          {/* State 5 — waitlisted */}
          {!isAssigned && status === 'waitlisted' && (
            <div className="space-y-3 text-left">
              <div className="px-4 py-3 rounded-xl bg-orange-500/15 border border-orange-400/30 text-orange-200 flex items-start gap-3">
                <Clock className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">You're on the chair waitlist.</p>
                  <p className="text-xs text-orange-200/80 mt-1">If a spot opens up, we'll reach out on Telegram.</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Contact */}
        <div className="glass-card p-4 border border-white/10 flex items-center gap-3">
          <Send className="h-4 w-4 text-gold-400 shrink-0" />
          <p className="text-white/60 text-sm flex-1">
            Questions? Reach our team on{' '}
            <a href="https://t.me/TuronMUN" target="_blank" rel="noreferrer" className="text-gold-400 hover:underline inline-flex items-center gap-0.5">
              Telegram <ExternalLink className="h-3 w-3" />
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChairApplicantDashboard;
