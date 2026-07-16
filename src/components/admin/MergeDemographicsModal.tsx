import React, { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X, Merge, Search, Undo2, Loader2 } from 'lucide-react';

export interface Bucket {
  name: string;
  count: number;
}

export interface Alias {
  id: string;
  field: string;
  raw_value: string;
  canonical_value: string;
}

interface Props {
  field: 'region' | 'school';
  buckets: Bucket[];        // current distinct buckets (after existing aliases applied)
  aliases: Alias[];         // existing aliases for this field
  onClose: () => void;
  onChanged: () => void;    // refetch analytics after a merge / unmerge
}

const LABEL: Record<Props['field'], string> = { region: 'Regions', school: 'Schools' };

/**
 * Lets an admin collapse free-text variants of a region or school
 * ("Fergana" / "Farg'ona" / "ferghana") into one canonical label. Writes rows
 * to demographic_aliases — the underlying applications are never touched, so
 * every merge is reversible from the "Existing merges" list below.
 */
const MergeDemographicsModal: React.FC<Props> = ({ field, buckets, aliases, onClose, onChanged }) => {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [canonical, setCanonical] = useState('');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? buckets.filter(b => b.name.toLowerCase().includes(q)) : buckets;
    return [...list].sort((a, b) => b.count - a.count);
  }, [buckets, query]);

  const toggle = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      // Default the canonical name to the most common value picked so far.
      const picked = buckets.filter(b => next.has(b.name)).sort((a, b) => b.count - a.count);
      if (picked.length > 0 && (!canonical || !next.has(canonical))) {
        setCanonical(picked[0].name);
      }
      if (next.size === 0) setCanonical('');
      return next;
    });
  };

  const handleMerge = async () => {
    const target = canonical.trim();
    const rawValues = [...selected].filter(v => v.toLowerCase() !== target.toLowerCase());
    if (!target) {
      toast({ title: 'Pick a name', description: 'Choose what these values should be counted as.', variant: 'destructive' });
      return;
    }
    if (rawValues.length === 0) {
      toast({ title: 'Nothing to merge', description: 'Select at least one value different from the canonical name.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // Replace any existing alias for each raw value (case-insensitive), then
      // insert the new mapping. Delete-then-insert keeps it race-free enough for
      // admin use and sidesteps upsert-on-expression-index quirks.
      for (const raw of rawValues) {
        await supabase.from('demographic_aliases' as any).delete().eq('field', field).ilike('raw_value', raw);
      }
      const rows = rawValues.map(raw => ({ field, raw_value: raw, canonical_value: target }));
      const { error } = await supabase.from('demographic_aliases' as any).insert(rows as any);
      if (error) throw error;

      toast({ title: 'Merged', description: `${rawValues.length} value${rawValues.length > 1 ? 's' : ''} now counted as "${target}".` });
      setSelected(new Set());
      setCanonical('');
      onChanged();
    } catch (e: any) {
      console.error('Merge failed:', e);
      toast({ title: 'Merge failed', description: e.message || 'Could not save the merge.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnmerge = async (alias: Alias) => {
    try {
      const { error } = await supabase.from('demographic_aliases' as any).delete().eq('id', alias.id);
      if (error) throw error;
      toast({ title: 'Unmerged', description: `"${alias.raw_value}" is counted on its own again.` });
      onChanged();
    } catch (e: any) {
      console.error('Unmerge failed:', e);
      toast({ title: 'Unmerge failed', description: e.message || 'Could not remove the merge.', variant: 'destructive' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <Merge className="h-5 w-5 text-diplomatic-600" />
            <h3 className="text-lg font-semibold text-gray-900">Merge duplicate {LABEL[field]}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <p className="text-sm text-gray-500">
            Tick the variants that mean the same thing, choose the name to keep, and merge. The
            applications themselves aren&apos;t changed — only how they&apos;re grouped here.
          </p>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${LABEL[field].toLowerCase()}…`}
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Bucket list */}
          <div className="border border-gray-200 rounded-lg divide-y max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No values match.</p>
            ) : filtered.map(b => (
              <label key={b.name} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={selected.has(b.name)}
                    onChange={() => toggle(b.name)}
                    className="rounded border-gray-300 text-diplomatic-600 focus:ring-diplomatic-500"
                  />
                  <span className="text-sm text-gray-800 truncate">{b.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-500 shrink-0 ml-2">{b.count}</span>
              </label>
            ))}
          </div>

          {/* Canonical name + action */}
          {selected.size > 0 && (
            <div className="bg-diplomatic-50 border border-diplomatic-100 rounded-lg p-3 space-y-2">
              <label className="text-xs font-medium text-diplomatic-800">Count all selected as:</label>
              <input
                type="text"
                value={canonical}
                onChange={(e) => setCanonical(e.target.value)}
                list="merge-canonical-options"
                className="w-full px-3 py-2 border border-diplomatic-200 rounded-md text-sm"
                placeholder="Canonical name to keep"
              />
              <datalist id="merge-canonical-options">
                {[...selected].map(v => <option key={v} value={v} />)}
              </datalist>
              <button
                onClick={handleMerge}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-diplomatic-600 hover:bg-diplomatic-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Merge size={16} />}
                Merge {selected.size} value{selected.size > 1 ? 's' : ''}
              </button>
            </div>
          )}

          {/* Existing merges (reversible) */}
          {aliases.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Existing merges</h4>
              <div className="space-y-1">
                {aliases.map(a => (
                  <div key={a.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-1.5">
                    <span className="text-gray-700 truncate">
                      <span className="text-gray-500">{a.raw_value}</span>
                      <span className="mx-1.5 text-gray-300">→</span>
                      <span className="font-medium">{a.canonical_value}</span>
                    </span>
                    <button
                      onClick={() => handleUnmerge(a)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 shrink-0 ml-2"
                      title="Undo this merge"
                    >
                      <Undo2 size={13} /> Undo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergeDemographicsModal;
