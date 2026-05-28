import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, User, Mail, Phone, MapPin, School, Award, Users, FileText, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCommittees } from '@/hooks/useCommittees';
import { useToast } from '@/hooks/use-toast';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface AppFormData {
  id?: string;
  full_name: string;
  email: string;
  telegram_username: string;
  phone: string;
  country: string;
  institution: string;
  date_of_birth: string;
  experience: string;
  committee_preference1: string;
  committee_preference2: string;
  committee_preference3: string;
  motivation: string;
  has_ielts: boolean;
  has_sat: boolean;
  status: 'pending' | 'approved' | 'rejected';
  application_type: 'delegate' | 'chair';
  notes: string;
}

const EMPTY: AppFormData = {
  full_name: '', email: '', telegram_username: '', phone: '',
  country: '', institution: '', date_of_birth: '', experience: 'None',
  committee_preference1: '', committee_preference2: '', committee_preference3: '',
  motivation: '', has_ielts: false, has_sat: false,
  status: 'pending', application_type: 'delegate', notes: '',
};

interface Props {
  /** Pass an existing application to edit; omit or pass null to create. */
  application?: AppFormData | null;
  onClose: () => void;
  /** Called with the saved/created application row after a successful write. */
  onSaved: (app: any) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────
const ApplicationFormModal: React.FC<Props> = ({ application, onClose, onSaved }) => {
  const { toast } = useToast();
  const { committees } = useCommittees();
  const isEdit = !!application?.id;

  const [form, setForm] = useState<AppFormData>(application ?? EMPTY);
  const [saving, setSaving] = useState(false);

  // Sync when the passed application changes (e.g. parent re-opens with different record)
  useEffect(() => { setForm(application ?? EMPTY); }, [application]);

  const set = (field: keyof AppFormData, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) {
      toast({ title: 'Name and email are required', variant: 'destructive' }); return;
    }

    setSaving(true);
    try {
      // Build notes marker if chair type
      let notes = form.notes;
      if (form.application_type === 'chair' && !notes.includes('APPLICATION TYPE: chair')) {
        notes = `APPLICATION TYPE: chair\n${notes}`.trim();
      }

      const payload: Record<string, any> = {
        full_name:            form.full_name.trim(),
        email:                form.email.trim().toLowerCase(),
        telegram_username:    form.telegram_username.trim() || null,
        phone:                form.phone.trim() || null,
        country:              form.country.trim(),
        institution:          form.institution.trim(),
        date_of_birth:        form.date_of_birth || null,
        experience:           form.experience,
        committee_preference1: form.committee_preference1,
        committee_preference2: form.committee_preference2,
        committee_preference3: form.committee_preference3,
        motivation:           form.motivation.trim() || null,
        has_ielts:            form.has_ielts,
        has_sat:              form.has_sat,
        status:               form.status,
        application_type:     form.application_type,
        notes:                notes || null,
        fee_agreement:        true,
      };

      let data: any;
      if (isEdit) {
        const { data: rows, error } = await (supabase.from('applications') as any)
          .update(payload)
          .eq('id', form.id)
          .select()
          .single();
        if (error) throw error;
        data = rows;
      } else {
        const { data: rows, error } = await (supabase.from('applications') as any)
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        data = rows;
      }

      toast({ title: isEdit ? 'Application updated' : 'Application created' });
      onSaved(data);
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Field helpers ─────────────────────────────────────────────────────────
  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

  const CommitteeSelect = ({ field, label }: { field: keyof AppFormData; label: string }) => (
    <div>
      <label className={labelCls}>{label}</label>
      <select
        className={inputCls}
        value={form[field] as string}
        onChange={e => set(field, e.target.value)}
      >
        <option value="">— None —</option>
        {committees.map(c => (
          <option key={c.id} value={c.name}>{c.abbreviation ? `${c.abbreviation} – ${c.name}` : c.name}</option>
        ))}
      </select>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-4 md:inset-8 lg:inset-16 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b bg-gradient-to-r from-blue-700 to-blue-800">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isEdit ? 'Edit Application' : 'New Application'}
            </h2>
            <p className="text-blue-200 text-xs mt-0.5">
              {isEdit ? `Editing ${application?.full_name}` : 'Fill in the fields below to create an application manually'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Left column ── */}
            <div className="space-y-5">

              {/* Type & Status */}
              <section className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText size={13} /> Type &amp; Status
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Application Type</label>
                    <select className={inputCls} value={form.application_type} onChange={e => set('application_type', e.target.value)}>
                      <option value="delegate">Delegate</option>
                      <option value="chair">Chair / Co-Chair</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value as any)}>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Personal Info */}
              <section className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User size={13} /> Personal Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input required className={inputCls} placeholder="Jane Smith"
                      value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Email *</label>
                    <input required type="email" className={inputCls} placeholder="jane@example.com"
                      value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>
                        <span className="flex items-center gap-1"><MessageSquare size={11} /> Telegram</span>
                      </label>
                      <input className={inputCls} placeholder="@username"
                        value={form.telegram_username} onChange={e => set('telegram_username', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>
                        <span className="flex items-center gap-1"><Phone size={11} /> Phone</span>
                      </label>
                      <input className={inputCls} placeholder="+998 ..."
                        value={form.phone} onChange={e => set('phone', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>
                        <span className="flex items-center gap-1"><MapPin size={11} /> Country</span>
                      </label>
                      <input className={inputCls} placeholder="Uzbekistan"
                        value={form.country} onChange={e => set('country', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Date of Birth</label>
                      <input type="date" className={inputCls}
                        value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>
                      <span className="flex items-center gap-1"><School size={11} /> Institution</span>
                    </label>
                    <input className={inputCls} placeholder="University / School name"
                      value={form.institution} onChange={e => set('institution', e.target.value)} />
                  </div>
                </div>
              </section>

              {/* Experience */}
              <section className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Award size={13} /> Experience
                </h3>
                <div>
                  <label className={labelCls}>MUN Experience</label>
                  <select className={inputCls} value={form.experience} onChange={e => set('experience', e.target.value)}>
                    <option value="None">None</option>
                    <option value="1">1 year</option>
                    <option value="2">2 years</option>
                    <option value="3+">3+ years</option>
                  </select>
                </div>
                <div className="flex items-center gap-6 mt-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" className="rounded" checked={form.has_ielts}
                      onChange={e => set('has_ielts', e.target.checked)} />
                    Has IELTS
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" className="rounded" checked={form.has_sat}
                      onChange={e => set('has_sat', e.target.checked)} />
                    Has SAT
                  </label>
                </div>
              </section>
            </div>

            {/* ── Right column ── */}
            <div className="space-y-5">

              {/* Committee Preferences */}
              <section className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Users size={13} /> Committee Preferences
                </h3>
                <div className="space-y-3">
                  <CommitteeSelect field="committee_preference1" label="1st Choice" />
                  <CommitteeSelect field="committee_preference2" label="2nd Choice" />
                  <CommitteeSelect field="committee_preference3" label="3rd Choice" />
                </div>
              </section>

              {/* Motivation */}
              <section className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Motivation
                </h3>
                <textarea
                  rows={4}
                  className={`${inputCls} resize-none`}
                  placeholder="Why do you want to participate in TuronMUN?"
                  value={form.motivation}
                  onChange={e => set('motivation', e.target.value)}
                />
              </section>

              {/* Notes */}
              <section className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText size={13} /> Admin Notes
                </h3>
                <textarea
                  rows={5}
                  className={`${inputCls} resize-none font-mono text-xs`}
                  placeholder="Internal notes, special markers, etc."
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  The <code>APPLICATION TYPE: chair</code> marker is added automatically when type is "Chair / Co-Chair".
                </p>
              </section>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t px-7 py-4 bg-gray-50 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose}
            className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {isEdit ? 'Save Changes' : 'Create Application'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationFormModal;
