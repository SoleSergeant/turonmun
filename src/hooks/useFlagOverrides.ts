import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCountryCode } from '@/utils/countryCodes';

interface FlagOverride {
  country_name: string;
  flag_url: string;
}

// Module-level cache so the table is hit once per session instead of
// once per component that renders a flag (allocation + matrix + form
// can each render dozens).
let cached: Record<string, string> | null = null;
let inflight: Promise<Record<string, string>> | null = null;
const listeners = new Set<(map: Record<string, string>) => void>();

const norm = (name: string) => name.trim().toLowerCase();

const fetchOverrides = async (): Promise<Record<string, string>> => {
  const { data, error } = await (supabase.from('country_flag_overrides') as any)
    .select('country_name, flag_url');
  if (error) {
    console.error('Failed to load flag overrides:', error.message);
    return {};
  }
  const map: Record<string, string> = {};
  (data as FlagOverride[] | null)?.forEach(row => {
    if (row.country_name && row.flag_url) map[norm(row.country_name)] = row.flag_url;
  });
  return map;
};

const ensureLoaded = (): Promise<Record<string, string>> => {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = fetchOverrides()
    .then(map => { cached = map; inflight = null; return map; })
    .catch(err => { inflight = null; throw err; });
  return inflight;
};

const notify = (map: Record<string, string>) => {
  listeners.forEach(fn => fn(map));
};

// Slug for storage: keeps the path predictable and prevents path traversal.
const slugify = (name: string) =>
  name.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/**
 * Build the best-available flag URL for a country name:
 *   1. admin-uploaded override (from cache)
 *   2. flagcdn.com by ISO code
 *   3. null  → caller should render a generic icon
 *
 * `size` is one of flagcdn's responsive widths: 24, 40, 80, 160, 320.
 */
export const getFlagUrl = (
  countryName: string | null | undefined,
  size: 24 | 40 | 80 | 160 | 320 = 24,
): string | null => {
  if (!countryName) return null;
  const override = cached?.[norm(countryName)];
  if (override) return override;
  const code = getCountryCode(countryName);
  if (!code) return null;
  return `https://flagcdn.com/${size}x${Math.round((size * 3) / 4)}/${code}.png`;
};

/**
 * Hook that warms the override cache once and re-renders any subscriber
 * when an upload / reset changes it. Returns a stable `flagFor` helper
 * plus mutation methods (gated by RLS server-side).
 */
export function useFlagOverrides() {
  const [overrides, setOverrides] = useState<Record<string, string>>(cached ?? {});
  const [loading, setLoading] = useState(cached === null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handler = (map: Record<string, string>) => setOverrides(map);
    listeners.add(handler);
    if (!cached) {
      ensureLoaded()
        .then(map => { setOverrides(map); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
    return () => { listeners.delete(handler); };
  }, []);

  const flagFor = useCallback(
    (name: string | null | undefined, size: 24 | 40 | 80 | 160 | 320 = 24) =>
      getFlagUrl(name, size),
    [overrides],
  );

  const upload = useCallback(async (countryName: string, file: File) => {
    setBusy(true);
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const path = `flags/${slugify(countryName)}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('applications')
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('applications').getPublicUrl(path);
      const publicUrl = data.publicUrl;

      const { error: rowErr } = await (supabase.from('country_flag_overrides') as any)
        .upsert({ country_name: countryName.trim(), flag_url: publicUrl }, { onConflict: 'country_name' });
      if (rowErr) throw rowErr;

      const next = { ...(cached ?? {}), [norm(countryName)]: publicUrl };
      cached = next;
      notify(next);
      return publicUrl;
    } finally {
      setBusy(false);
    }
  }, []);

  const reset = useCallback(async (countryName: string) => {
    setBusy(true);
    try {
      const { error } = await (supabase.from('country_flag_overrides') as any)
        .delete()
        .eq('country_name', countryName.trim());
      if (error) throw error;
      const next = { ...(cached ?? {}) };
      delete next[norm(countryName)];
      cached = next;
      notify(next);
    } finally {
      setBusy(false);
    }
  }, []);

  return { overrides, loading, busy, flagFor, upload, reset };
}
