import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useCommittees } from '@/hooks/useCommittees';
import type { FormQuestion } from '@/hooks/useFormSettings';

interface DynamicFormStepProps {
  step: number;
  stepTitle: string;
  stepSubtitle?: string;
  questions: FormQuestion[];       // all questions for this step (visible + hidden)
  formData: Record<string, any>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  photoFile?: File | null;
  updatePhotoFile?: (file: File | null) => void;
  nextStep: () => void;
  prevStep: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

// ── Committee Select Widget ──────────────────────────────────────────────────
const CommitteeSelectField: React.FC<{
  q: FormQuestion;
  value: string;
  handleChange: DynamicFormStepProps['handleChange'];
  exclude: string[];
}> = ({ q, value, handleChange, exclude }) => {
  const { committees, loading } = useCommittees();
  const available = committees.filter(c => c.name === value || !exclude.includes(c.name));

  return (
    <div>
      <label htmlFor={q.name} className="block text-sm font-medium text-neutral-700 mb-1">
        {q.label} {q.required && <span className="text-red-500">*</span>}
      </label>
      {loading ? (
        <div className="h-12 bg-neutral-100 animate-pulse rounded-lg" />
      ) : (
        <select
          id={q.name} name={q.name} value={value} onChange={handleChange}
          required={q.required}
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all"
        >
          <option value="">{q.placeholder ?? `Select ${q.label.toLowerCase()}`}</option>
          {available.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      )}
      {q.helpText && <p className="text-xs text-neutral-500 mt-1">{q.helpText}</p>}
    </div>
  );
};

// ── Photo Upload Widget ──────────────────────────────────────────────────────
const PhotoUploadField: React.FC<{
  q: FormQuestion;
  photoFile: File | null | undefined;
  updatePhotoFile: ((f: File | null) => void) | undefined;
}> = ({ q, photoFile, updatePhotoFile }) => (
  <div>
    <label className="block text-sm font-medium text-neutral-700 mb-1">
      {q.label} {q.required && <span className="text-red-500">*</span>}
    </label>
    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
      <div className="flex flex-col items-center justify-center gap-1 text-neutral-500">
        {photoFile
          ? <p className="text-sm font-medium text-green-600">{photoFile.name}</p>
          : <>
              <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Click to upload photo</p>
            </>
        }
      </div>
      <input type="file" accept="image/*" className="hidden"
        onChange={e => updatePhotoFile?.(e.target.files?.[0] ?? null)} />
    </label>
    {q.helpText && <p className="text-xs text-neutral-500 mt-1">{q.helpText}</p>}
  </div>
);

// ── Single Field Renderer ────────────────────────────────────────────────────
const FormField: React.FC<{
  q: FormQuestion;
  formData: Record<string, any>;
  handleChange: DynamicFormStepProps['handleChange'];
  photoFile?: File | null;
  updatePhotoFile?: (f: File | null) => void;
  excludeCommittees: string[];
}> = ({ q, formData, handleChange, photoFile, updatePhotoFile, excludeCommittees }) => {
  if (!q.visible) return null;

  const sharedCls = 'w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-diplomatic-300 focus:border-transparent transition-all';

  if (q.widget === 'committee_select') {
    return (
      <CommitteeSelectField
        q={q} value={formData[q.name] ?? ''}
        handleChange={handleChange} exclude={excludeCommittees}
      />
    );
  }

  if (q.widget === 'photo_upload') {
    return <PhotoUploadField q={q} photoFile={photoFile} updatePhotoFile={updatePhotoFile} />;
  }

  return (
    <div>
      <label htmlFor={q.name} className="block text-sm font-medium text-neutral-700 mb-1">
        {q.label}
        {q.required && <span className="text-red-500"> *</span>}
        {!q.required && <span className="text-neutral-400 text-xs font-normal ml-1">(Optional)</span>}
      </label>

      {q.type === 'textarea' ? (
        <textarea
          id={q.name} name={q.name}
          value={formData[q.name] ?? ''} onChange={handleChange}
          rows={4} required={q.required}
          placeholder={q.placeholder ?? ''}
          className={`${sharedCls} resize-none`}
        />
      ) : q.type === 'select' ? (
        <select
          id={q.name} name={q.name}
          value={formData[q.name] ?? ''} onChange={handleChange}
          required={q.required}
          className={sharedCls}
        >
          <option value="">{q.placeholder ?? `Select ${q.label.toLowerCase()}`}</option>
          {(q.options ?? []).map(opt => <option key={opt} value={opt.toLowerCase().replace(/\s+/g, '-') === opt ? opt : opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          type={q.type} id={q.name} name={q.name}
          value={formData[q.name] ?? ''} onChange={handleChange}
          required={q.required} readOnly={q.readonly}
          placeholder={q.placeholder ?? ''}
          className={`${sharedCls} ${q.readonly ? 'bg-neutral-50 text-neutral-500 cursor-not-allowed' : ''}`}
        />
      )}

      {q.helpText && <p className="text-xs text-neutral-500 mt-1">{q.helpText}</p>}
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const DynamicFormStep: React.FC<DynamicFormStepProps> = ({
  step, stepTitle, stepSubtitle, questions,
  formData, handleChange, photoFile, updatePhotoFile,
  nextStep, prevStep, isFirst = false,
}) => {
  const visible = questions.filter(q => q.visible).sort((a, b) => a.order - b.order);

  // For committee_select deduplication
  const selectedCommittees = [
    formData.committee_preference1,
    formData.committee_preference2,
    formData.committee_preference3,
  ].filter(Boolean);

  const isValid = () =>
    visible
      .filter(q => q.required && q.widget !== 'photo_upload')
      .every(q => {
        const val = formData[q.name];
        if (typeof val === 'boolean') return true;
        return val !== undefined && val !== null && String(val).trim() !== '' && val !== 'Not Selected';
      });

  return (
    <div className="bg-white rounded-xl shadow-elegant p-8 border border-neutral-100">
      <h2 className="text-2xl font-display font-semibold mb-2">{stepTitle}</h2>
      {stepSubtitle && <p className="text-neutral-600 mb-6">{stepSubtitle}</p>}

      <div className="space-y-6">
        {visible.map(q => (
          <FormField
            key={q.id} q={q} formData={formData} handleChange={handleChange}
            photoFile={photoFile} updatePhotoFile={updatePhotoFile}
            excludeCommittees={selectedCommittees.filter(v => v !== formData[q.name])}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        {!isFirst ? (
          <button type="button" onClick={prevStep}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md">
            <ArrowLeft size={16} /> Back
          </button>
        ) : <div />}
        <button type="button" onClick={nextStep} disabled={!isValid()}
          className={`btn-primary flex items-center gap-2 ${!isValid() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-diplomatic-700'}`}>
          Next Step <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default DynamicFormStep;
