import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AdminRole = 'sg' | 'academics' | 'logistics' | 'registration' | null;

// Legacy roles that should be treated as SG (full access)
const LEGACY_SG = new Set(['admin', 'superadmin']);

interface RoleSnapshot {
  email: string | null;
  role: AdminRole;
  fullName: string | null;
}

// ── Module-level cache ────────────────────────────────────────────────
// Without this, every AdminLayout / AdminRoute / dashboard / page that
// calls useAdminRole re-fetches on mount. That re-fetch races with
// route changes and causes a flash where role==null briefly lets nav
// items render that should be hidden. We resolve once per session and
// invalidate on auth-state changes.
let cached: RoleSnapshot | null = null;
let inflight: Promise<RoleSnapshot> | null = null;

const fetchSnapshot = async (): Promise<RoleSnapshot> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { email: null, role: null, fullName: null };

  const { data } = await supabase
    .from('admin_users')
    .select('role, full_name, is_active')
    .eq('email', user.email)
    .eq('is_active', true)
    .single();

  const raw = (data as any)?.role as string | undefined;
  const fullName = (data as any)?.full_name ?? null;
  let role: AdminRole = null;
  if (raw) {
    if (LEGACY_SG.has(raw)) role = 'sg';
    else if (raw === 'sg' || raw === 'academics' || raw === 'logistics' || raw === 'registration') {
      role = raw;
    }
  }
  return { email: user.email, role, fullName };
};

const getSnapshot = (): Promise<RoleSnapshot> => {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = fetchSnapshot()
    .then(snap => { cached = snap; inflight = null; return snap; })
    .catch(err => { inflight = null; throw err; });
  return inflight;
};

// Invalidate on auth changes so a sign-out or sign-in re-fetches.
supabase.auth.onAuthStateChange(() => {
  cached = null;
  inflight = null;
});

/**
 * Normalises the admin_users.role of the logged-in user into one of:
 *   'sg' | 'academics' | 'logistics' | 'registration' | null
 * Legacy 'admin' and 'superadmin' map to 'sg' so existing accounts keep
 * full access with no DB changes required.
 *
 * The first call in a session does a Supabase round-trip; subsequent
 * calls (route changes, child components) read from the module cache
 * and return synchronously with loading=false. This is what prevents
 * the flash-of-everything when navigating between admin pages.
 */
export function useAdminRole() {
  // Seed state from the cache so we never start in a loading state once
  // the role has been resolved once this session.
  const [role, setRole] = useState<AdminRole>(cached?.role ?? null);
  const [fullName, setFullName] = useState<string | null>(cached?.fullName ?? null);
  const [loading, setLoading] = useState(cached === null);

  useEffect(() => {
    if (cached) return; // already resolved this session — no-op
    let cancelled = false;
    getSnapshot()
      .then(snap => {
        if (cancelled) return;
        setRole(snap.role);
        setFullName(snap.fullName);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { role, fullName, loading };
}

export const ROLE_LABELS: Record<NonNullable<AdminRole>, string> = {
  sg: 'Secretary-General',
  academics: 'Academics Manager',
  logistics: 'Logistics Manager',
  registration: 'Registration Desk',
};
