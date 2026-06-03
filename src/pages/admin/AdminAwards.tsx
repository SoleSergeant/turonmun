import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Lock, Unlock, Globe, EyeOff, Upload, Download, RefreshCw } from 'lucide-react';

const AWARD_DEFS = [
  { key: 'best_delegate', label: 'Best Delegate' },
  { key: 'best_speaker', label: 'Best Speaker' },
  { key: 'honorable_mention', label: 'Honorable Mention' },
];

const AdminAwards = () => {
  const { toast } = useToast();
  const [committees, setCommittees] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [locked, setLocked] = useState(false);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ data: comms, error: commErr }, { data: aw }, { data: settings }] = await Promise.all([
        supabase.from('committees').select('id, name').order('name'),
        (supabase.from('committee_awards' as any) as any).select('*'),
        (supabase.from('award_settings' as any) as any).select('*').eq('id', 1).single(),
      ]);
      if (commErr) toast({ title: 'Could not load committees', description: commErr.message, variant: 'destructive' });
      setCommittees(comms || []);
      setAwards(aw || []);
      setLocked(!!settings?.locked);
      setPublished(!!settings?.published);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAll(); }, []);

  const awardFor = (committeeId: string, type: string) =>
    awards.find(a => a.committee_id === committeeId && a.award_type === type);

  const updateSettings = async (patch: { locked?: boolean; published?: boolean }) => {
    const { error } = await (supabase.from('award_settings' as any) as any)
      .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    if (patch.locked !== undefined) setLocked(patch.locked);
    if (patch.published !== undefined) setPublished(patch.published);
    toast({ title: 'Updated' });
  };

  const uploadPhoto = async (award: any, file: File | undefined) => {
    if (!file || !award) return;
    setUploading(award.id);
    try {
      const ext = file.name.split('.').pop();
      const path = `awards/${award.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from('applications').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('applications').getPublicUrl(path);
      const bust = `${publicUrl}?t=${Date.now()}`;
      const { error } = await (supabase.from('committee_awards' as any) as any)
        .update({ photo_url: bust }).eq('id', award.id);
      if (error) throw error;
      setAwards(prev => prev.map(a => a.id === award.id ? { ...a, photo_url: bust } : a));
      toast({ title: 'Photo uploaded' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  const exportCSV = () => {
    const rows = [['Committee', 'Award', 'Winner', 'Country']];
    committees.forEach(c => AWARD_DEFS.forEach(d => {
      const a = awardFor(c.id, d.key);
      if (a) rows.push([c.name, d.label, a.winner_name || '', a.winner_country || '']);
    }));
    const csv = rows.map(r => r.map(x => `"${x}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url; link.download = `turonmun_awards.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Awards">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" /> Awards
            </h2>
            <p className="text-gray-600">Chairs pick winners; lock to finalize, then publish to the public page.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={fetchAll} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button
              onClick={() => updateSettings({ locked: !locked })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white ${locked ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-700 hover:bg-gray-800'}`}
            >
              {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              {locked ? 'Locked (click to unlock)' : 'Lock awards'}
            </button>
            <button
              onClick={() => updateSettings({ published: !published })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white ${published ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-800'}`}
            >
              {published ? <Globe className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {published ? 'Published (live)' : 'Publish to website'}
            </button>
          </div>
        </div>

        {published && (
          <div className="px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
            Winners are <strong>live on the public Awards page</strong>. Upload photos below — they appear publicly.
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-500"><RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading…</div>
        ) : (
          <div className="space-y-4">
            {committees.length === 0 && (
              <div className="bg-white rounded-lg border p-10 text-center text-gray-500">No committees found.</div>
            )}
            {committees.map(c => (
              <div key={c.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-5 py-3 border-b bg-gray-50 font-semibold text-gray-900">{c.name}</div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {AWARD_DEFS.map(d => {
                    const a = awardFor(c.id, d.key);
                    return (
                      <div key={d.key} className="border border-gray-200 rounded-lg p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-2">🏆 {d.label}</p>
                        {a ? (
                          <>
                            <div className="flex items-center gap-3 mb-3">
                              {a.photo_url ? (
                                <img src={a.photo_url} alt="" className="w-12 h-12 rounded-full object-cover border" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                  <Trophy className="h-5 w-5" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{a.winner_name || '—'}</p>
                                <p className="text-xs text-gray-500">{a.winner_country || ''}</p>
                              </div>
                            </div>
                            {locked ? (
                              <label className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline cursor-pointer">
                                <Upload className="h-3.5 w-3.5" />
                                {uploading === a.id ? 'Uploading…' : a.photo_url ? 'Replace photo' : 'Upload photo'}
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhoto(a, e.target.files?.[0])} />
                              </label>
                            ) : (
                              <p className="text-[11px] text-gray-400 italic">Lock awards to upload a winner photo</p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Not selected yet</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAwards;
