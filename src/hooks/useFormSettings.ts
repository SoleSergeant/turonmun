import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface CustomQuestion {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  options?: string[];   // for type === 'select'
  step?: number;        // which step to inject the question into (optional)
}

export interface FormQuestion {
  id: string;
  step: number;          // 1-5 which step this belongs to
  order: number;         // display order within step
  name: string;          // formData field key
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'textarea' | 'select' | 'file';
  placeholder?: string | null;
  helpText?: string | null;
  required: boolean;
  visible: boolean;
  options?: string[];    // for select type
  system?: boolean;      // built-in questions (can hide/edit but not delete)
  readonly?: boolean;    // e.g. email field
  widget?: string;       // 'photo_upload' | 'committee_select'
}

export const DEFAULT_STEP_LABELS = ['Personal Info', 'Experience', 'Committees', 'Essays', 'Details'];

export interface FormSettings {
  id: string;
  form_type: 'delegate' | 'chair';
  is_open: boolean;
  closed_message: string;
  deadline: string | null;         // ISO string or null
  max_capacity: number | null;
  fee_amount: number;
  ielts_discount: number;
  sat_discount: number;
  custom_questions: CustomQuestion[];
  step_labels: string[];           // editable labels for the 5 form steps
  form_questions: FormQuestion[];  // full configurable question list
  updated_at: string;
  updated_by: string | null;
}

const DEFAULTS: Omit<FormSettings, 'id' | 'updated_at' | 'updated_by'> = {
  form_type: 'delegate',
  is_open: false,
  closed_message: 'Applications are currently closed. Check our Telegram channel for updates.',
  deadline: null,
  max_capacity: null,
  fee_amount: 90000,
  ielts_discount: 10000,
  sat_discount: 10000,
  custom_questions: [],
  step_labels: [...DEFAULT_STEP_LABELS],
  form_questions: [],
};

// ── Hook ───────────────────────────────────────────────────────────────────────
export const useFormSettings = (formType: 'delegate' | 'chair') => {
  const [settings, setSettings] = useState<FormSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvedCount, setApprovedCount] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: settingsData }, { count }] = await Promise.all([
        (supabase.from('form_settings') as any)
          .select('*')
          .eq('form_type', formType)
          .single(),
        // Count approved applications for capacity check
        (supabase.from('applications') as any)
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved')
          .not('notes', 'ilike', '%APPLICATION TYPE: chair%'),
      ]);

      if (settingsData) setSettings(settingsData as FormSettings);
      setApprovedCount(count ?? 0);
    } catch {
      // Silently fall back — table may not exist yet
    } finally {
      setLoading(false);
    }
  }, [formType]);

  useEffect(() => { fetch(); }, [fetch]);

  // ── Derived: is the form effectively closed? ──────────────────────────────
  const isEffectivelyClosed = (() => {
    if (!settings) return true;
    if (!settings.is_open) return true;
    if (settings.deadline && new Date(settings.deadline) < new Date()) return true;
    if (settings.max_capacity !== null && approvedCount >= settings.max_capacity) return true;
    return false;
  })();

  const closedReason = (() => {
    if (!settings) return settings === null ? null : settings?.closed_message;
    if (!settings.is_open) return settings.closed_message;
    if (settings.deadline && new Date(settings.deadline) < new Date())
      return `The application deadline passed on ${new Date(settings.deadline).toLocaleDateString()}.`;
    if (settings.max_capacity !== null && approvedCount >= settings.max_capacity)
      return `All ${settings.max_capacity} spots have been filled.`;
    return null;
  })();

  // Deadline is within 48 h but not yet passed
  const deadlineSoon = !!(
    settings?.deadline &&
    !isEffectivelyClosed &&
    new Date(settings.deadline).getTime() - Date.now() < 48 * 60 * 60 * 1000
  );

  return { settings, loading, isEffectivelyClosed, closedReason, deadlineSoon, approvedCount, refresh: fetch };
};
