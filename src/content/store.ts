import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SECTIONS, type ContentMap, type SectionKey } from './sections';

/**
 * Loads every site_content row once per page load and shares it.
 * The last successful load is kept in localStorage so returning visitors see
 * the edited text immediately instead of a flash of the built-in defaults.
 */
type Overrides = Partial<Record<string, Record<string, unknown>>>;

const CACHE_KEY = 'turonmun:site-content:v1';

const readCache = (): Overrides => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

let overrides: Overrides = readCache();
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

const load = () => {
  if (!inflight) {
    inflight = (async () => {
      const { data, error } = await (supabase.from('site_content' as any) as any).select('key, value');
      if (error) return; // table missing (migration 040 not applied) → defaults
      const next: Overrides = {};
      (data || []).forEach((row: { key: string; value: Record<string, unknown> }) => { next[row.key] = row.value; });
      overrides = next;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      listeners.forEach(l => l());
    })();
  }
  return inflight;
};

/** Re-fetch after the admin saves, so the editor's preview links show fresh content. */
export const reloadContent = () => {
  inflight = null;
  return load();
};

export function getSection<K extends SectionKey>(key: K): ContentMap[K] {
  const defaults = SECTIONS[key].defaults as ContentMap[K];
  const saved = overrides[key];
  return saved ? ({ ...defaults, ...saved } as ContentMap[K]) : defaults;
}

/** Content for one section: built-in defaults overlaid with what an admin saved. */
export function useContent<K extends SectionKey>(key: K): ContentMap[K] {
  const [, force] = useState(0);
  useEffect(() => {
    const listener = () => force(n => n + 1);
    listeners.add(listener);
    load();
    return () => { listeners.delete(listener); };
  }, []);
  return getSection(key);
}

/** Replaces {season} (and other {tokens}) with values from the General section. */
export function useFill() {
  const general = useContent('general');
  return (text: string | undefined | null) =>
    (text || '')
      .replace(/\{season\}/gi, general.season_label)
      .replace(/\{site\}/gi, general.site_name);
}

/**
 * Renders text where *starred words* are highlighted, e.g.
 * "Sponsors Powering *TuronMUN*". Used for headlines with accent words.
 */
export function rich(text: string, highlightClass: string): React.ReactNode {
  const parts = (text || '').split(/(\*[^*]+\*)/g);
  return parts.map((part, i) =>
    part.startsWith('*') && part.endsWith('*') && part.length > 2
      ? React.createElement('span', { key: i, className: highlightClass }, part.slice(1, -1))
      : part,
  );
}
