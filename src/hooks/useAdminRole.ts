import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AdminRole = 'sg' | 'academics' | 'logistics' | 'registration' | null;

// Legacy roles that should be treated as SG (full access)
const LEGACY_SG = new Set(['admin', 'superadmin']);

/**
 * Normalises the admin_users.role of the logged-in user into one of:
 *   'sg' | 'academics' | 'registration' | null
 * Legacy 'admin' and 'superadmin' map to 'sg' so existing accounts keep
 * full access with no DB changes required.
 */
export function useAdminRole() {
  const [role, setRole] = useState<AdminRole>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
          if (!cancelled) { setRole(null); setFullName(null); setLoading(false); }
          return;
        }
        const { data } = await supabase
          .from('admin_users')
          .select('role, full_name, is_active')
          .eq('email', user.email)
          .eq('is_active', true)
          .single();
        if (cancelled) return;
        const raw = (data as any)?.role as string | undefined;
        setFullName((data as any)?.full_name ?? null);
        if (!raw) setRole(null);
        else if (LEGACY_SG.has(raw)) setRole('sg');
        else if (raw === 'sg' || raw === 'academics' || raw === 'logistics' || raw === 'registration') setRole(raw);
        else setRole(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
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
