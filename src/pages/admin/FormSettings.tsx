import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import type { FormSettings, CustomQuestion } from '@/hooks/useFormSettings';
import { useToast } from '@/hooks/use-toast';
import {
  ToggleLeft, ToggleRight, Calendar, Users, DollarSign,
  Plus, Trash2, GripVertical, Loader2, Save, ClipboardList,
  AlertCircle, CheckCircle2, Clock, RefreshCw, ChevronDown,
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────
const uuid = () => Math.random().toString(36).slice(2, 10);

const BLANK_Q: Omit<CustomQuestion, 'id'> = {
  label: '', type: 'text', required: false, options: [],
};

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';
const sectionCls = 'bg-white rounded-xl border border-gray-200 shadow-sm p-5';

// ── Component ──────────────────────────────────────────────────────────────────
const FormSettingsPage = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<'delegate' | 'chair'>('delegate');
  const [settings, setSettings] = useState<Record<string, FormSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approvedCounts, setApprovedCounts] = useState<Record<string, number>>({});
  // Local draft for the active tab
  const [draft, setDraft] = useState<FormSettings | null>(null);
  // Custom-question being edited
  const [editingQ, setEditingQ] = useState<CustomQuestion | null>(null);
  const [newOptions, setNewOptions] = useState('');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: rows }, { count: delegateCount }, { count: chairCount }] = await Promise.all([
        (supabase.from('form_settings') as any).select('*'),
        (supabase.from('applications') as any)
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved')
          .not('notes', 'ilike', '%APPLICATION TYPE: chair%'),
        (supabase.from('applications') as any)
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved')
          .ilike('notes', '%APPLICATION TYPE: chair%'),
      ]);

      const map: Record<string, FormSettings> = {};
      (rows || []).forEach((r: FormSettings) => { map[r.form_type] = r; });
      setSettings(map);
      setApprovedCounts({ delegate: delegateCount ?? 0, chair: chairCount ?? 0 });
    } catch (e: any) {
      toast({ title: 'Error loading settings', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Sync draft when tab changes
  useEffect(() => {
    setDraft(settings[tab] ? { ...settings[tab], custom_questions: [...(settings[tab].custom_questions ?? [])] } : null);
  }, [tab, settings]);

  const set = (field: keyof FormSettings, value: any) =>
    setDraft(prev => prev ? { ...prev, [field]: value } : prev);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const { error } = await (supabase.from('form_settings') as any)
        .update({
          is_open: draft.is_open,
          closed_message: draft.closed_message,
          deadline: draft.deadline || null,
          max_capacity: draft.max_capacity || null,
          fee_amount: Number(draft.fee_amount),
          ielts_discount: Number(draft.ielts_discount),
          sat_discount: Number(draft.sat_discount),
          custom_questions: draft.custom_questions,
        })
        .eq('form_type', tab);
      if (error) throw error;

      setSettings(prev => ({ ...prev, [tab]: draft }));
      toast({ title: 'Settings saved' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Custom questions helpers ───────────────────────────────────────────────
  const addQuestion = () => {
    const q: CustomQuestion = { ...BLANK_Q, id: uuid() };
    setEditingQ(q);
    setNewOptions('');
  };

  const saveQuestion = () => {
    if (!editingQ || !editingQ.label.trim()) return;
    const q = { ...editingQ, options: newOptions ? newOptions.split('\n').map(s => s.trim()).filter(Boolean) : [] };
    setDraft(prev => {
      if (!prev) return prev;
      const exists = prev.custom_questions.some(x => x.id === q.id);
      return {
        ...prev,
        custom_questions: exists
          ? prev.custom_questions.map(x => x.id === q.id ? q : x)
          : [...prev.custom_questions, q],
      };
    });
    setEditingQ(null);
  };

  const deleteQuestion = (id: string) =>
    setDraft(prev => prev ? { ...prev, custom_questions: prev.custom_questions.filter(q => q.id !== id) } : prev);

  const moveQuestion = (idx: number, dir: -1 | 1) => {
    setDraft(prev => {
      if (!prev) return prev;
      const qs = [...prev.custom_questions];
      const target = idx + dir;
      if (target < 0 || target >= qs.length) return prev;
      [qs[idx], qs[target]] = [qs[target], qs[idx]];
      return { ...prev, custom_questions: qs };
    });
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const approvedCount = approvedCounts[tab] ?? 0;
  const isEffectivelyClosed = !draft?.is_open ||
    (!!draft?.deadline && new Date(draft.deadline) < new Date()) ||
    (draft?.max_capacity != null && approvedCount >= draft.max_capacity);

  const feePreview = (ielts: boolean, sat: boolean) => {
    if (!draft) return 0;
    const discount = (ielts ? draft.ielts_discount : 0) + (sat ? draft.sat_discount : 0);
    return Math.max(0, draft.fee_amount - discount);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout title="Forms Management">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Forms Management">
      <div className="space-y-6 max-w-4xl">

        {/* Tabs */}
        <div className="flex gap-2">
          {(['delegate', 'chair'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-blue-600 text-white shadow' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              {t === 'delegate' ? 'Delegate Registration' : 'Chair Application'}
            </button>
          ))}
          <button onClick={loadAll} className="ml-auto p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>

        {!draft ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800 text-sm flex items-center gap-3">
            <AlertCircle size={18} /> Settings row not found. Run migration 011 in Supabase SQL editor first.
          </div>
        ) : (
          <>
            {/* ── Open / Close ── */}
            <div className={sectionCls}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Form Status</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Controls whether applicants can submit this form</p>
                </div>
                {/* Big toggle */}
                <button onClick={() => set('is_open', !draft.is_open)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${draft.is_open ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                  {draft.is_open
                    ? <><ToggleRight size={20} /> Open — accepting applications</>
                    : <><ToggleLeft size={20} /> Closed — not accepting applications</>}
                </button>
              </div>

              {/* Status summary */}
              <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${isEffectivelyClosed ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {isEffectivelyClosed ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                <span className="font-medium">{isEffectivelyClosed ? 'Effectively closed' : 'Accepting applications'}</span>
                {draft.max_capacity && (
                  <span className="ml-auto text-xs text-gray-500">{approvedCount} / {draft.max_capacity} spots filled</span>
                )}
              </div>

              {/* Closed message */}
              <div className="mt-4">
                <label className={labelCls}>Message shown to visitors when closed</label>
                <textarea rows={2} className={`${inputCls} resize-none`}
                  value={draft.closed_message}
                  onChange={e => set('closed_message', e.target.value)} />
              </div>
            </div>

            {/* ── Deadline & Capacity ── */}
            <div className={sectionCls}>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" /> Deadline &amp; Capacity
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Application deadline <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="datetime-local" className={inputCls}
                    value={draft.deadline ? draft.deadline.slice(0, 16) : ''}
                    onChange={e => set('deadline', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                  <p className="text-[11px] text-gray-400 mt-1">Form auto-closes at this date &amp; time.</p>
                </div>
                <div>
                  <label className={labelCls}>Max capacity <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div className="relative">
                    <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="number" min="1" className={`${inputCls} pl-9`} placeholder="Unlimited"
                      value={draft.max_capacity ?? ''}
                      onChange={e => set('max_capacity', e.target.value ? Number(e.target.value) : null)} />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {approvedCount} approved so far.
                    {draft.max_capacity ? ` ${Math.max(0, draft.max_capacity - approvedCount)} spots remaining.` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Fee Configuration (delegate only) ── */}
            {tab === 'delegate' && (
              <div className={sectionCls}>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-600" /> Fee Configuration
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <div>
                    <label className={labelCls}>Base Fee (UZS)</label>
                    <input type="number" min="0" className={inputCls}
                      value={draft.fee_amount}
                      onChange={e => set('fee_amount', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className={labelCls}>IELTS Discount (UZS)</label>
                    <input type="number" min="0" className={inputCls}
                      value={draft.ielts_discount}
                      onChange={e => set('ielts_discount', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className={labelCls}>SAT Discount (UZS)</label>
                    <input type="number" min="0" className={inputCls}
                      value={draft.sat_discount}
                      onChange={e => set('sat_discount', Number(e.target.value))} />
                  </div>
                </div>

                {/* Price preview */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Price Preview</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'No discount',    ielts: false, sat: false },
                      { label: 'With IELTS',     ielts: true,  sat: false },
                      { label: 'With SAT',       ielts: false, sat: true  },
                      { label: 'IELTS + SAT',    ielts: true,  sat: true  },
                    ].map(c => (
                      <div key={c.label} className="text-center bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                        <p className="text-[11px] text-gray-400 mb-1">{c.label}</p>
                        <p className="text-lg font-bold text-gray-900">{feePreview(c.ielts, c.sat).toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400">UZS</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Custom Questions ── */}
            <div className={sectionCls}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <ClipboardList size={16} className="text-indigo-600" /> Custom Questions
                </h3>
                <button onClick={addQuestion}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors">
                  <Plus size={13} /> Add Question
                </button>
              </div>

              {draft.custom_questions.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">No custom questions yet. Click "Add Question" to create one.</p>
              ) : (
                <div className="space-y-2">
                  {draft.custom_questions.map((q, idx) => (
                    <div key={q.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {/* Reorder */}
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveQuestion(idx, -1)} disabled={idx === 0}
                          className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs leading-none">▲</button>
                        <button onClick={() => moveQuestion(idx, 1)} disabled={idx === draft.custom_questions.length - 1}
                          className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs leading-none">▼</button>
                      </div>
                      <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{q.label}</p>
                        <p className="text-xs text-gray-400">
                          {q.type}{q.required ? ' · required' : ' · optional'}
                          {q.options && q.options.length > 0 ? ` · ${q.options.length} options` : ''}
                        </p>
                      </div>
                      <button onClick={() => { setEditingQ({ ...q }); setNewOptions((q.options ?? []).join('\n')); }}
                        className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50">Edit</button>
                      <button onClick={() => deleteQuestion(q.id)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Question editor inline */}
              {editingQ && (
                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                    {draft.custom_questions.some(q => q.id === editingQ.id) ? 'Edit' : 'New'} Question
                  </p>
                  <div>
                    <label className={labelCls}>Question label *</label>
                    <input className={inputCls} placeholder="e.g. How did you hear about TuronMUN?"
                      value={editingQ.label}
                      onChange={e => setEditingQ(prev => prev ? { ...prev, label: e.target.value } : prev)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Field type</label>
                      <select className={inputCls} value={editingQ.type}
                        onChange={e => setEditingQ(prev => prev ? { ...prev, type: e.target.value as CustomQuestion['type'] } : prev)}>
                        <option value="text">Short text</option>
                        <option value="textarea">Long text</option>
                        <option value="select">Dropdown select</option>
                        <option value="checkbox">Checkbox (yes/no)</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                        <input type="checkbox" className="rounded"
                          checked={editingQ.required}
                          onChange={e => setEditingQ(prev => prev ? { ...prev, required: e.target.checked } : prev)} />
                        Required
                      </label>
                    </div>
                  </div>
                  {editingQ.type === 'select' && (
                    <div>
                      <label className={labelCls}>Options (one per line)</label>
                      <textarea rows={4} className={`${inputCls} resize-none font-mono text-xs`}
                        placeholder={"Option A\nOption B\nOption C"}
                        value={newOptions}
                        onChange={e => setNewOptions(e.target.value)} />
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveQuestion} disabled={!editingQ.label.trim()}
                      className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                      Save Question
                    </button>
                    <button onClick={() => setEditingQ(null)}
                      className="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer save ── */}
            <div className="flex justify-end pb-8">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 shadow transition-colors">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default FormSettingsPage;
