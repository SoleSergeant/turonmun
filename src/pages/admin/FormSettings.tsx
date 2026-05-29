import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import type { FormSettings, CustomQuestion, FormQuestion } from '@/hooks/useFormSettings';
import { useToast } from '@/hooks/use-toast';
import {
  ToggleLeft, ToggleRight, Calendar, Users, DollarSign,
  Plus, Trash2, GripVertical, Loader2, Save, ClipboardList,
  AlertCircle, CheckCircle2, Clock, RefreshCw, ChevronDown, ChevronUp,
  Eye, X, ChevronLeft, ChevronRight, EyeOff, Lock,
} from 'lucide-react';
import DynamicFormStep from '@/components/registration/DynamicFormStep';
import PersonalInfoStep from '@/components/registration/PersonalInfoStep';
import PreferencesStep from '@/components/registration/PreferencesStep';
import CommitteePreferencesStep from '@/components/registration/CommitteePreferencesStep';
import EssayStep from '@/components/registration/EssayStep';
import AdditionalInfoStep from '@/components/registration/AdditionalInfoStep';
import RegistrationSteps from '@/components/registration/RegistrationSteps';

// ── Helpers ────────────────────────────────────────────────────────────────────
const uuid = () => Math.random().toString(36).slice(2, 10);

const BLANK_FORM_DATA = {
  fullName: '', dateOfBirth: '', gender: '', email: '', phone: '',
  telegramUsername: '', institution: '', countryAndCity: '', grade: '',
  munExperience: '', experience: '', previousMUNs: '',
  delegationType: 'individual', participationType: 'in-person',
  committee_preference1: '', committee_preference2: '', committee_preference3: '',
  motivationEssay: '', issueInterest: '',
  dietaryRestrictions: '', medicalConditions: '', emergencyContact: '',
  emergencyPhone: '', feeAgreement: '', discountEligibility: [] as string[],
  finalConfirmation: false, hasIELTS: 'no', hasSAT: 'no',
  ieltsScore: '', satScore: '', agreeToTerms: false,
};

// ── Custom Questions Live Editor Step ──────────────────────────────────────────
const CustomQuestionsEditorStep: React.FC<{
  questions: CustomQuestion[];
  onUpdate: (questions: CustomQuestion[]) => void;
}> = ({ questions, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CustomQuestion | null>(null);
  const [optionsText, setOptionsText] = useState('');

  const inputE = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';

  const startEdit = (q: CustomQuestion) => {
    setEditDraft({ ...q });
    setOptionsText((q.options ?? []).join('\n'));
    setEditingId(q.id);
  };

  const startNew = () => {
    const q: CustomQuestion = { id: Math.random().toString(36).slice(2, 10), label: '', type: 'text', required: false, options: [] };
    setEditDraft(q);
    setOptionsText('');
    setEditingId(q.id);
  };

  const saveEdit = () => {
    if (!editDraft || !editDraft.label.trim()) return;
    const saved = { ...editDraft, options: optionsText ? optionsText.split('\n').map(s => s.trim()).filter(Boolean) : [] };
    const exists = questions.some(q => q.id === saved.id);
    onUpdate(exists ? questions.map(q => q.id === saved.id ? saved : q) : [...questions, saved]);
    setEditingId(null);
    setEditDraft(null);
  };

  const cancelEdit = () => { setEditingId(null); setEditDraft(null); };

  const deleteQ = (id: string) => {
    if (!window.confirm('Delete this question?')) return;
    onUpdate(questions.filter(q => q.id !== id));
  };

  const moveQ = (idx: number, dir: -1 | 1) => {
    const qs = [...questions];
    const target = idx + dir;
    if (target < 0 || target >= qs.length) return;
    [qs[idx], qs[target]] = [qs[target], qs[idx]];
    onUpdate(qs);
  };

  const TYPE_LABELS: Record<string, string> = {
    text: 'Short text', textarea: 'Long text', select: 'Dropdown', checkbox: 'Checkbox',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Custom Questions</h2>
          <p className="text-xs text-gray-400 mt-0.5">Edit here — changes save when you click "Save Changes" below</p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus size={14} /> Add Question
        </button>
      </div>

      {/* Question list */}
      <div className="divide-y divide-gray-100">
        {questions.length === 0 && editingId === null && (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            No custom questions yet. Click "Add Question" to create one.
          </div>
        )}

        {questions.map((q, idx) => (
          <div key={q.id}>
            {/* Question row */}
            <div className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors">
              {/* Reorder */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button onClick={() => moveQ(idx, -1)} disabled={idx === 0}
                  className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs leading-none">▲</button>
                <button onClick={() => moveQ(idx, 1)} disabled={idx === questions.length - 1}
                  className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs leading-none">▼</button>
              </div>
              <GripVertical size={14} className="text-gray-300 flex-shrink-0" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{q.label || <em className="text-gray-400">Untitled</em>}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {TYPE_LABELS[q.type] ?? q.type}
                  {q.required ? ' · Required' : ' · Optional'}
                  {q.options && q.options.length > 0 ? ` · ${q.options.length} options` : ''}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => editingId === q.id ? cancelEdit() : startEdit(q)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors font-medium ${editingId === q.id ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  {editingId === q.id ? 'Cancel' : 'Edit'}
                </button>
                <button onClick={() => deleteQ(q.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Inline editor — shown when this question is being edited */}
            {editingId === q.id && editDraft && (
              <div className="px-6 pb-5 pt-2 bg-indigo-50 border-t border-indigo-100">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Question label *</label>
                    <input className={inputE} placeholder="e.g. How did you hear about TuronMUN?"
                      value={editDraft.label}
                      onChange={e => setEditDraft(p => p ? { ...p, label: e.target.value } : p)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Field type</label>
                      <select className={inputE} value={editDraft.type}
                        onChange={e => setEditDraft(p => p ? { ...p, type: e.target.value as CustomQuestion['type'] } : p)}>
                        <option value="text">Short text</option>
                        <option value="textarea">Long text</option>
                        <option value="select">Dropdown select</option>
                        <option value="checkbox">Checkbox (yes/no)</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                        <input type="checkbox" className="rounded"
                          checked={editDraft.required}
                          onChange={e => setEditDraft(p => p ? { ...p, required: e.target.checked } : p)} />
                        Required
                      </label>
                    </div>
                  </div>
                  {editDraft.type === 'select' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Options (one per line)</label>
                      <textarea rows={4} className={`${inputE} resize-none font-mono text-xs`}
                        placeholder={"Option A\nOption B\nOption C"}
                        value={optionsText}
                        onChange={e => setOptionsText(e.target.value)} />
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveEdit} disabled={!editDraft.label.trim()}
                      className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
                      Save Question
                    </button>
                    <button onClick={cancelEdit}
                      className="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* New question editor (when adding, no existing question selected) */}
        {editingId !== null && !questions.some(q => q.id === editingId) && editDraft && (
          <div className="px-6 py-5 bg-indigo-50 border-t border-indigo-100">
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-3">New Question</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Question label *</label>
                <input className={inputE} placeholder="e.g. How did you hear about TuronMUN?"
                  value={editDraft.label}
                  onChange={e => setEditDraft(p => p ? { ...p, label: e.target.value } : p)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Field type</label>
                  <select className={inputE} value={editDraft.type}
                    onChange={e => setEditDraft(p => p ? { ...p, type: e.target.value as CustomQuestion['type'] } : p)}>
                    <option value="text">Short text</option>
                    <option value="textarea">Long text</option>
                    <option value="select">Dropdown select</option>
                    <option value="checkbox">Checkbox (yes/no)</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" className="rounded"
                      checked={editDraft.required}
                      onChange={e => setEditDraft(p => p ? { ...p, required: e.target.checked } : p)} />
                    Required
                  </label>
                </div>
              </div>
              {editDraft.type === 'select' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Options (one per line)</label>
                  <textarea rows={4} className={`${inputE} resize-none font-mono text-xs`}
                    placeholder={"Option A\nOption B\nOption C"}
                    value={optionsText}
                    onChange={e => setOptionsText(e.target.value)} />
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={saveEdit} disabled={!editDraft.label.trim()}
                  className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
                  Add Question
                </button>
                <button onClick={cancelEdit}
                  className="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Form Builder Section ───────────────────────────────────────────────────────
const DEFAULT_STEP_COUNT = 4; // steps 1-4 are fully configurable; step 5 = fee/confirm

const BLANK_FQ = (): FormQuestion => ({
  id: Math.random().toString(36).slice(2, 10),
  step: 1, order: 999,
  name: `custom_${Math.random().toString(36).slice(2, 6)}`,
  label: '', type: 'text',
  placeholder: '', helpText: '',
  required: false, visible: true, system: false,
});

const FQ_TYPE_LABELS: Record<string, string> = {
  text: 'Short text', email: 'Email', tel: 'Phone', date: 'Date',
  textarea: 'Long text', select: 'Dropdown', file: 'File upload',
};

const FormBuilderSection: React.FC<{
  questions: FormQuestion[];
  stepLabels: string[];
  onUpdate: (qs: FormQuestion[]) => void;
}> = ({ questions, stepLabels, onUpdate }) => {
  const inputE = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';
  const [openStep, setOpenStep] = useState<number | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<FormQuestion | null>(null);
  const [optText, setOptText] = useState('');

  const stepQuestions = (s: number) =>
    questions.filter(q => q.step === s).sort((a, b) => a.order - b.order);

  const startEdit = (q: FormQuestion) => {
    setEditDraft({ ...q });
    setOptText((q.options ?? []).join('\n'));
    setEditId(q.id);
  };

  const startNew = (step: number) => {
    const q = { ...BLANK_FQ(), step };
    setEditDraft(q);
    setOptText('');
    setEditId(q.id);
  };

  const saveEdit = () => {
    if (!editDraft || !editDraft.label.trim()) return;
    const saved: FormQuestion = {
      ...editDraft,
      options: editDraft.type === 'select' ? optText.split('\n').map(s => s.trim()).filter(Boolean) : [],
    };
    const exists = questions.some(q => q.id === saved.id);
    const next = exists
      ? questions.map(q => q.id === saved.id ? saved : q)
      : [...questions, saved];
    onUpdate(next);
    setEditId(null);
    setEditDraft(null);
  };

  const cancelEdit = () => { setEditId(null); setEditDraft(null); };

  const toggleVisible = (id: string) =>
    onUpdate(questions.map(q => q.id === id ? { ...q, visible: !q.visible } : q));

  const deleteQ = (id: string) => {
    if (!window.confirm('Delete this question?')) return;
    onUpdate(questions.filter(q => q.id !== id));
  };

  const moveQ = (id: string, dir: -1 | 1) => {
    const q = questions.find(x => x.id === id);
    if (!q) return;
    const stepQs = stepQuestions(q.step);
    const idx = stepQs.findIndex(x => x.id === id);
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= stepQs.length) return;
    const other = stepQs[targetIdx];
    onUpdate(questions.map(x => {
      if (x.id === id) return { ...x, order: other.order };
      if (x.id === other.id) return { ...x, order: q.order };
      return x;
    }));
  };

  return (
    <div className={`${inputCls.replace('w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent', '')} bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden`}>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <ClipboardList size={16} className="text-violet-600" />
        <h3 className="font-semibold text-gray-900">Form Builder</h3>
        <span className="ml-auto text-xs text-gray-400">{questions.filter(q => q.visible).length} visible fields across {DEFAULT_STEP_COUNT} steps</span>
      </div>

      {Array.from({ length: DEFAULT_STEP_COUNT }, (_, i) => i + 1).map(s => {
        const sqs = stepQuestions(s);
        const isOpen = openStep === s;
        return (
          <div key={s} className="border-b border-gray-100 last:border-0">
            {/* Step header */}
            <button
              onClick={() => setOpenStep(isOpen ? null : s)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{s}</span>
              <span className="font-medium text-gray-800 text-sm">{stepLabels[s - 1] ?? `Step ${s}`}</span>
              <span className="ml-auto text-xs text-gray-400 mr-2">{sqs.length} question{sqs.length !== 1 ? 's' : ''}</span>
              {isOpen ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
            </button>

            {/* Step content */}
            {isOpen && (
              <div className="border-t border-gray-100">
                {/* Question rows */}
                {sqs.map((q, idx) => (
                  <div key={q.id}>
                    <div className={`flex items-center gap-2 px-5 py-3 ${!q.visible ? 'opacity-50' : 'hover:bg-gray-50'} transition-colors`}>
                      {/* Reorder */}
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button onClick={() => moveQ(q.id, -1)} disabled={idx === 0}
                          className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-[10px] leading-none">▲</button>
                        <button onClick={() => moveQ(q.id, 1)} disabled={idx === sqs.length - 1}
                          className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-[10px] leading-none">▼</button>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {q.system && <Lock size={11} className="text-gray-300 flex-shrink-0" title="Built-in field" />}
                          <p className="text-sm font-medium text-gray-800 truncate">{q.label || <em className="text-gray-400">Untitled</em>}</p>
                        </div>
                        <p className="text-xs text-gray-400">
                          {FQ_TYPE_LABELS[q.type] ?? q.type}
                          {q.widget === 'committee_select' ? ' · Committee dropdown' : ''}
                          {q.widget === 'photo_upload' ? ' · Photo upload' : ''}
                          {q.required ? ' · Required' : ' · Optional'}
                        </p>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => toggleVisible(q.id)}
                          className={`p-1.5 rounded-lg transition-colors ${q.visible ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-orange-400 hover:bg-orange-50'}`}
                          title={q.visible ? 'Hide field' : 'Show field'}>
                          {q.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button onClick={() => editId === q.id ? cancelEdit() : startEdit(q)}
                          className={`px-2.5 py-1 text-xs rounded-lg border transition-colors font-medium ${editId === q.id ? 'bg-violet-100 border-violet-300 text-violet-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                          {editId === q.id ? 'Cancel' : 'Edit'}
                        </button>
                        {!q.system && (
                          <button onClick={() => deleteQ(q.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline editor */}
                    {editId === q.id && editDraft && (
                      <div className="px-5 pb-4 pt-2 bg-violet-50 border-t border-violet-100">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Label *</label>
                            <input className={inputE} value={editDraft.label}
                              onChange={e => setEditDraft(p => p ? { ...p, label: e.target.value } : p)} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Placeholder</label>
                              <input className={inputE} value={editDraft.placeholder ?? ''}
                                onChange={e => setEditDraft(p => p ? { ...p, placeholder: e.target.value } : p)} />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Help text</label>
                              <input className={inputE} value={editDraft.helpText ?? ''}
                                onChange={e => setEditDraft(p => p ? { ...p, helpText: e.target.value } : p)} />
                            </div>
                          </div>
                          {!q.system && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Field type</label>
                                <select className={inputE} value={editDraft.type}
                                  onChange={e => setEditDraft(p => p ? { ...p, type: e.target.value as FormQuestion['type'] } : p)}>
                                  {Object.entries(FQ_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                              </div>
                              <div className="flex items-end pb-1">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                  <input type="checkbox" className="rounded" checked={editDraft.required}
                                    onChange={e => setEditDraft(p => p ? { ...p, required: e.target.checked } : p)} />
                                  Required
                                </label>
                              </div>
                            </div>
                          )}
                          {editDraft.type === 'select' && !editDraft.widget && (
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Dropdown options (one per line)</label>
                              <textarea rows={4} className={`${inputE} resize-none font-mono text-xs`}
                                placeholder={"Option A\nOption B\nOption C"}
                                value={optText} onChange={e => setOptText(e.target.value)} />
                            </div>
                          )}
                          <div className="flex gap-2 pt-1">
                            <button onClick={saveEdit} disabled={!editDraft.label.trim()}
                              className="px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 font-medium">Save</button>
                            <button onClick={cancelEdit}
                              className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* New question editor for this step */}
                {editId !== null && !questions.some(q => q.id === editId) && editDraft?.step === s && editDraft && (
                  <div className="px-5 py-4 bg-violet-50 border-t border-violet-100">
                    <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-3">New Question — Step {s}</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Label *</label>
                        <input className={inputE} placeholder="e.g. LinkedIn Profile"
                          value={editDraft.label}
                          onChange={e => setEditDraft(p => p ? { ...p, label: e.target.value } : p)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Placeholder</label>
                          <input className={inputE} value={editDraft.placeholder ?? ''}
                            onChange={e => setEditDraft(p => p ? { ...p, placeholder: e.target.value } : p)} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Help text</label>
                          <input className={inputE} value={editDraft.helpText ?? ''}
                            onChange={e => setEditDraft(p => p ? { ...p, helpText: e.target.value } : p)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Field type</label>
                          <select className={inputE} value={editDraft.type}
                            onChange={e => setEditDraft(p => p ? { ...p, type: e.target.value as FormQuestion['type'] } : p)}>
                            {Object.entries(FQ_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" className="rounded" checked={editDraft.required}
                              onChange={e => setEditDraft(p => p ? { ...p, required: e.target.checked } : p)} />
                            Required
                          </label>
                        </div>
                      </div>
                      {editDraft.type === 'select' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Options (one per line)</label>
                          <textarea rows={4} className={`${inputE} resize-none font-mono text-xs`}
                            placeholder={"Option A\nOption B\nOption C"}
                            value={optText} onChange={e => setOptText(e.target.value)} />
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button onClick={saveEdit} disabled={!editDraft.label.trim()}
                          className="px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 font-medium">Add Question</button>
                        <button onClick={cancelEdit}
                          className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add question button */}
                {!(editId !== null && editDraft?.step === s && !questions.some(q => q.id === editId)) && (
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <button onClick={() => startNew(s)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">
                      <Plus size={13} /> Add question to Step {s}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Form Preview Modal ──────────────────────────────────────────────────────────
const FormPreviewModal: React.FC<{
  formType: 'delegate' | 'chair';
  customQuestions: CustomQuestion[];
  formQuestions: FormQuestion[];
  stepLabels?: string[];
  onUpdateQuestions: (qs: CustomQuestion[]) => void;
  onClose: () => void;
}> = ({ formType, customQuestions, formQuestions, stepLabels, onUpdateQuestions, onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ ...BLANK_FORM_DATA });

  // Local editable copy — changes propagate up to the draft via onUpdateQuestions
  const [localQuestions, setLocalQuestions] = useState<CustomQuestion[]>(customQuestions);

  const handleUpdateQuestions = (qs: CustomQuestion[]) => {
    setLocalQuestions(qs);
    onUpdateQuestions(qs);          // keep parent draft in sync
  };

  const hasCustomQ = localQuestions.length > 0 || step === 5;
  // Always show step 5 as the questions/editor step; step 6 (or 5 if no questions) = submit
  const QUESTIONS_STEP = 5;
  const SUBMIT_STEP = 6;
  const totalSteps = SUBMIT_STEP;

  const noop = () => {};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'discountEligibility') {
        setFormData(prev => ({
          ...prev,
          discountEligibility: checked
            ? [...prev.discountEligibility.filter(i => i !== 'None'), value]
            : prev.discountEligibility.filter(i => i !== value),
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculateFee = () => ({ originalFee: 90000, discount: 0, finalFee: 90000 });

  const STEP_LABELS: Record<number, string> = {
    1: 'Personal Info', 2: 'Preferences', 3: 'Committees',
    4: 'Essay', 5: 'Questions', 6: 'Submit',
  };
  const stepLabel = (s: number) => STEP_LABELS[s] ?? `Step ${s}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Preview header */}
      <div className="flex items-center justify-between px-6 py-3 bg-amber-50 border-b border-amber-200 flex-shrink-0">
        <div className="flex items-center gap-2 text-amber-800 text-sm font-semibold">
          <Eye size={16} />
          <span>
            Preview — {formType === 'delegate' ? 'Delegate Registration' : 'Chair Application'}
            <span className="ml-2 text-xs font-normal bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">{localQuestions.length} custom question{localQuestions.length !== 1 ? 's' : ''}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Step pills */}
          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
              <button
                key={s}
                onClick={() => setStep(s)}
                title={stepLabel(s)}
                className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${s === step ? 'bg-amber-600 text-white' : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-100'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="text-xs text-gray-500 font-medium sm:hidden">Step {step}/{totalSteps}</span>
            <button
              onClick={() => setStep(s => Math.min(totalSteps, s + 1))}
              disabled={step === totalSteps}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-700 transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-diplomatic-50">
        <div className="container pt-8 pb-16">
          <RegistrationSteps currentStep={Math.min(step, 5)} labels={stepLabels} />
          <div className="max-w-3xl mx-auto mt-6">
            {[1, 2, 3, 4].includes(step) && (() => {
              const stepQs = formQuestions.filter(q => q.step === step).sort((a, b) => a.order - b.order);
              const labels = stepLabels ?? ['Personal Info','Experience','Committees','Essays','Details'];
              if (stepQs.length > 0) {
                return (
                  <DynamicFormStep
                    step={step}
                    stepTitle={`Page ${step} — ${labels[step - 1]}`}
                    questions={stepQs}
                    formData={formData}
                    handleChange={handleChange}
                    nextStep={noop}
                    prevStep={noop}
                    isFirst={step === 1}
                  />
                );
              }
              // Fallback if migration not yet run
              if (step === 1) return <PersonalInfoStep formData={formData} handleChange={handleChange} nextStep={noop} />;
              if (step === 2) return <PreferencesStep formData={formData} handleChange={handleChange} nextStep={noop} prevStep={noop} />;
              if (step === 3) return <CommitteePreferencesStep formData={formData} handleChange={handleChange} nextStep={noop} prevStep={noop} />;
              if (step === 4) return <EssayStep formData={formData} handleChange={handleChange} nextStep={noop} prevStep={noop} />;
            })()}

            {/* Step 5 — Custom Questions editor (always shown so admin can add questions) */}
            {step === QUESTIONS_STEP && (
              <CustomQuestionsEditorStep
                questions={localQuestions}
                onUpdate={handleUpdateQuestions}
              />
            )}

            {/* Step 6 — Submit step (always disabled in preview) */}
            {step === SUBMIT_STEP && (
              <div className="relative">
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                  <div className="bg-amber-100 border border-amber-300 text-amber-800 px-6 py-4 rounded-xl text-center shadow-sm">
                    <p className="font-semibold text-sm">Submit step — disabled in preview</p>
                    <p className="text-xs mt-1 text-amber-600">Applications cannot be submitted from the admin panel</p>
                  </div>
                </div>
                <AdditionalInfoStep
                  formData={formData}
                  handleChange={handleChange}
                  calculateFee={calculateFee}
                  handleSubmit={async () => {}}
                  prevStep={noop}
                  isSubmitting={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
  // Form preview overlay
  const [previewOpen, setPreviewOpen] = useState(false);

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
          step_labels: draft.step_labels,
          form_questions: draft.form_questions ?? [],
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
    <>
      {previewOpen && (
        <FormPreviewModal
          formType={tab}
          customQuestions={draft?.custom_questions ?? []}
          formQuestions={draft?.form_questions ?? []}
          stepLabels={draft?.step_labels}
          onUpdateQuestions={qs => setDraft(prev => prev ? { ...prev, custom_questions: qs } : prev)}
          onClose={() => setPreviewOpen(false)}
        />
      )}
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
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <Eye size={15} /> Preview Form
            </button>
            <button onClick={loadAll} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>
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

            {/* ── Step Labels ── */}
            <div className={sectionCls}>
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <ClipboardList size={16} className="text-violet-600" /> Step Labels
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Rename the 5 steps shown in the form progress bar. Changes are reflected immediately in the preview.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {(draft.step_labels ?? ['Personal Info','Experience','Committees','Essays','Details']).map((label, idx) => (
                  <div key={idx}>
                    <label className={labelCls}>Step {idx + 1}</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={label}
                      placeholder={['Personal Info','Experience','Committees','Essays','Details'][idx]}
                      onChange={e => {
                        const updated = [...(draft.step_labels ?? ['Personal Info','Experience','Committees','Essays','Details'])];
                        updated[idx] = e.target.value;
                        set('step_labels', updated);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

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

            {/* ── Form Builder ── */}
            <FormBuilderSection
              questions={draft.form_questions ?? []}
              onUpdate={qs => set('form_questions', qs)}
              stepLabels={draft.step_labels ?? ['Personal Info','Experience','Committees','Essays','Details']}
            />

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
    </>
  );
};

export default FormSettingsPage;
