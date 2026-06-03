import { useEffect, useRef, useState } from 'react';

interface SavedDraft<T> {
  formData: T;
  step: number;
  savedAt: number;
}

/**
 * Persists application form state to localStorage as the applicant types,
 * and restores it on next visit. File uploads (e.g. photo) are NOT saved —
 * they have to be re-picked.
 *
 * Returns the timestamp of the restored draft (or null if nothing was
 * restored) and a clearDraft() to wipe the saved state — call that after
 * a successful submission so the next application starts fresh.
 */
export function useFormAutosave<T extends Record<string, any>>(
  storageKey: string,
  formData: T,
  setFormData: (next: T) => void,
  step: number,
  setStep: (next: number) => void,
) {
  const [restoredAt, setRestoredAt] = useState<Date | null>(null);
  const ready = useRef(false);

  // ── Restore on mount ────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedDraft<T>;
        if (parsed?.formData && typeof parsed.formData === 'object') {
          // Merge — keeps any auth-populated fields (email, name) while restoring user input
          setFormData({ ...formData, ...parsed.formData });
          if (typeof parsed.step === 'number' && parsed.step >= 1) {
            setStep(parsed.step);
          }
          if (parsed.savedAt) setRestoredAt(new Date(parsed.savedAt));
        }
      }
    } catch {
      // Corrupted draft — ignore and start fresh
    }
    // Only allow writes after the restore attempt completes, so we don't
    // overwrite a saved draft with empty defaults on first render.
    ready.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // ── Debounced write on change ───────────────────────────────────────
  useEffect(() => {
    if (!ready.current) return;
    const t = setTimeout(() => {
      try {
        const payload: SavedDraft<T> = { formData, step, savedAt: Date.now() };
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {
        // Quota exceeded or private-mode block — silently skip
      }
    }, 500);
    return () => clearTimeout(t);
  }, [formData, step, storageKey]);

  const clearDraft = () => {
    try { localStorage.removeItem(storageKey); } catch { /* noop */ }
    setRestoredAt(null);
  };

  return { restoredAt, clearDraft };
}
