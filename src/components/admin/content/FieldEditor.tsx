import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown, Trash2, Plus, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Field } from '@/content/types';

type Obj = Record<string, any>;

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-diplomatic-500 focus:ring-2 focus:ring-diplomatic-200';

/** Empty value for a new list item, built from its field definitions. */
const blankFor = (fields: Field[]): Obj => {
  const o: Obj = {};
  fields.forEach(f => {
    if (f.type === 'group') {
      if (f.key.startsWith('__')) Object.assign(o, blankFor(f.fields));
      else o[f.key] = blankFor(f.fields);
    } else if (f.type === 'list' || f.type === 'strings') o[f.key] = [];
    else if (f.type === 'boolean') o[f.key] = true;
    else if (f.type === 'number') o[f.key] = 0;
    else o[f.key] = '';
  });
  return o;
};

const toLocalInput = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function ImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
      const path = `site/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from('resources').upload(path, file, { contentType: file.type || undefined });
      if (error) throw error;
      const { data } = supabase.storage.from('resources').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
        {value ? <img src={value} alt="" className="h-full w-full object-contain" /> : null}
      </div>
      <div className="flex-1 space-y-2">
        <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Image URL or /path" className={inputCls} />
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Upload image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }}
          />
        </label>
      </div>
    </div>
  );
}

function ListEditor({ field, value, onChange }: { field: Extract<Field, { type: 'list' }>; value: Obj[]; onChange: (v: Obj[]) => void }) {
  const items = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState<number | null>(null);

  const update = (i: number, next: Obj) => onChange(items.map((it, idx) => (idx === i ? next : it)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(j);
  };
  const remove = (i: number) => {
    if (!confirm(`Remove this ${field.itemLabel.toLowerCase()}?`)) return;
    onChange(items.filter((_, idx) => idx !== i));
    setOpen(null);
  };
  const add = () => {
    // New items start from the last item's styling fields (e.g. a season's
    // colours) but with empty content.
    const base = { ...blankFor(field.fields), ...(field.newItem || {}) };
    const last = items[items.length - 1];
    const styleGroup = field.fields.find(f => f.type === 'group' && f.key.startsWith('__'));
    if (last && styleGroup && styleGroup.type === 'group') {
      styleGroup.fields.forEach(f => { base[f.key] = last[f.key]; });
    }
    onChange([...items, base]);
    setOpen(items.length);
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const title = (field.titleKey && String(item[field.titleKey] || '')) || `${field.itemLabel} ${i + 1}`;
        const isOpen = open === i;
        return (
          <div key={i} className="rounded-lg border bg-white">
            <div className="flex items-center gap-2 px-3 py-2">
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium text-gray-800">
                {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                <span className="truncate">{title}</span>
              </button>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Move up" className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Move down" className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" onClick={() => remove(i)} title="Remove" className="p-1 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
            {isOpen && (
              <div className="space-y-4 border-t bg-gray-50/60 p-4">
                <FieldList fields={field.fields} value={item} onChange={next => update(i, next)} />
              </div>
            )}
          </div>
        );
      })}
      <button type="button" onClick={add} className="inline-flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:border-diplomatic-400 hover:text-diplomatic-700">
        <Plus className="h-4 w-4" /> Add {field.itemLabel.toLowerCase()}
      </button>
    </div>
  );
}

function GroupEditor({ field, value, onChange }: { field: Extract<Field, { type: 'group' }>; value: Obj; onChange: (v: Obj) => void }) {
  const [open, setOpen] = useState(!field.collapsed);
  return (
    <div className="rounded-lg border bg-white">
      <button type="button" onClick={() => setOpen(o => !o)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-gray-800">
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {field.label}
      </button>
      {open && (
        <div className="space-y-4 border-t p-4">
          {field.hint && <p className="text-xs text-gray-500">{field.hint}</p>}
          <FieldList fields={field.fields} value={value || {}} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: Field; value: any; onChange: (v: any) => void }) {
  switch (field.type) {
    case 'textarea':
      return <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={3} className={inputCls} />;
    case 'number':
      return <input type="number" value={value ?? ''} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))} className={`${inputCls} max-w-[12rem]`} />;
    case 'boolean':
      return (
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-diplomatic-600" />
          {value ? 'Yes' : 'No'}
        </label>
      );
    case 'date':
      return (
        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            value={toLocalInput(value)}
            onChange={e => onChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
            className={`${inputCls} max-w-xs`}
          />
          {value && <button type="button" onClick={() => onChange('')} className="text-xs text-gray-500 hover:text-gray-800">Clear</button>}
        </div>
      );
    case 'strings':
      return (
        <textarea
          value={Array.isArray(value) ? value.join('\n') : ''}
          onChange={e => onChange(e.target.value.split('\n'))}
          onBlur={e => onChange(e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
          rows={Math.max(3, Array.isArray(value) ? value.length + 1 : 3)}
          className={inputCls}
          placeholder="One per line"
        />
      );
    case 'image':
      return <ImageInput value={value ?? ''} onChange={onChange} />;
    case 'list':
      return <ListEditor field={field} value={value} onChange={onChange} />;
    case 'group':
      return <GroupEditor field={field} value={value} onChange={onChange} />;
    default:
      return <input value={value ?? ''} onChange={e => onChange(e.target.value)} className={inputCls} />;
  }
}

/** Renders a set of fields bound to one object. */
export function FieldList({ fields, value, onChange }: { fields: Field[]; value: Obj; onChange: (v: Obj) => void }) {
  return (
    <>
      {fields.map(field => {
        // A group whose key starts with "__" edits fields that live directly
        // on the parent object (used for a season's colour classes).
        if (field.type === 'group' && field.key.startsWith('__')) {
          return <GroupEditor key={field.key} field={field} value={value} onChange={onChange} />;
        }
        const set = (v: any) => onChange({ ...value, [field.key]: v });
        if (field.type === 'group' || field.type === 'list') {
          return (
            <div key={field.key} className="space-y-2">
              {field.type === 'list' && (
                <div>
                  <p className="text-sm font-medium text-gray-700">{field.label}</p>
                  {field.hint && <p className="text-xs text-gray-500">{field.hint}</p>}
                </div>
              )}
              <FieldInput field={field} value={value?.[field.key]} onChange={set} />
            </div>
          );
        }
        // A div, not a <label>: image fields contain their own upload label.
        return (
          <div key={field.key} className="space-y-1">
            <span className="block text-sm font-medium text-gray-700">{field.label}</span>
            {field.hint && <span className="block text-xs text-gray-500">{field.hint}</span>}
            <FieldInput field={field} value={value?.[field.key]} onChange={set} />
          </div>
        );
      })}
    </>
  );
}
