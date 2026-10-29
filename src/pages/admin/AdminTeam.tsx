import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { confirmAction } from '@/components/admin/ConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UsersRound, Plus, Pencil, Trash2, EyeOff, Upload, Loader2, ExternalLink } from 'lucide-react';

export type TeamMember = {
  id?: string;
  name: string;
  role: string | null;
  team: string;
  photo_url: string | null;
  link_url: string | null;
  sort_order: number;
  is_visible: boolean;
  is_past: boolean;
};

const SUGGESTED_TEAMS = ['Secretariat', 'Academics', 'Logistics', 'Media', 'Contributors'];
const blank = (team = 'Secretariat'): TeamMember =>
  ({ name: '', role: '', team, photo_url: null, link_url: '', sort_order: 0, is_visible: true, is_past: false });

/** Phone photos are several MB; shrink to 600px JPEG before upload so the public page stays light. */
const shrink = (file: File): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 600 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not read the image'))), 'image/jpeg', 0.85);
    };
    img.onerror = () => reject(new Error('That file is not an image'));
    img.src = URL.createObjectURL(file);
  });

const table = () => supabase.from('team_members' as any) as any;
const input = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

const AdminTeam = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fail = (title: string, e: any) => toast({ title, description: e?.message, variant: 'destructive' });

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await table().select('*').order('team').order('sort_order').order('name');
    if (error) fail('Could not load the team (has migration 046 been run?)', error);
    setMembers(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchAll(); }, []);

  const teams = Array.from(new Set(members.map(m => m.team)));
  const set = (patch: Partial<TeamMember>) => setDraft(d => (d ? { ...d, ...patch } : d));

  const uploadPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const path = `team/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error } = await supabase.storage.from('resources').upload(path, await shrink(file), { contentType: 'image/jpeg' });
      if (error) throw error;
      set({ photo_url: supabase.storage.from('resources').getPublicUrl(path).data.publicUrl });
    } catch (e) {
      fail('Upload failed', e);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!draft) return;
    const row = {
      name: draft.name.trim(),
      role: draft.role?.trim() || null,
      team: draft.team.trim() || 'Secretariat',
      photo_url: draft.photo_url || null,
      link_url: draft.link_url?.trim() || null,
      sort_order: Number(draft.sort_order) || 0,
      is_visible: draft.is_visible,
      is_past: draft.is_past,
    };
    if (!row.name) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    if (row.link_url && !/^https?:\/\//i.test(row.link_url)) {
      toast({ title: 'Link must start with https://', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = draft.id ? await table().update(row).eq('id', draft.id) : await table().insert(row);
    setSaving(false);
    if (error) { fail('Could not save', error); return; }
    toast({ title: draft.id ? 'Saved' : 'Added' });
    setDraft(null);
    fetchAll();
  };

  const remove = async (m: TeamMember) => {
    if (!(await confirmAction(`Remove ${m.name} from the Team page?`, { danger: true }))) return;
    const { error } = await table().delete().eq('id', m.id);
    if (error) { fail('Could not remove', error); return; }
    setMembers(prev => prev.filter(x => x.id !== m.id));
  };

  return (
    <AdminLayout title="Team">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-gray-600">
            People on the public <a href="https://www.turonmun.com/team" target="_blank" rel="noreferrer" className="text-blue-600 underline">Team page</a>, grouped by team. Lower order numbers come first.
          </p>
          <button onClick={() => setDraft(blank(teams[0]))} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add person
          </button>
        </div>

        {draft && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">{draft.id ? `Edit ${draft.name}` : 'Add person'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Name</span>
                <input className={input} value={draft.name} onChange={e => set({ name: e.target.value })} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Role</span>
                <input className={input} value={draft.role || ''} placeholder="e.g. Secretary-General" onChange={e => set({ role: e.target.value })} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Team</span>
                <input className={input} list="team-names" value={draft.team} onChange={e => set({ team: e.target.value })} />
                <datalist id="team-names">
                  {Array.from(new Set([...teams, ...SUGGESTED_TEAMS])).map(t => <option key={t} value={t} />)}
                </datalist>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Link (optional)</span>
                <input className={input} value={draft.link_url || ''} placeholder="https://instagram.com/…" onChange={e => set({ link_url: e.target.value })} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Order</span>
                <input type="number" className={input} value={draft.sort_order} onChange={e => set({ sort_order: Number(e.target.value) })} />
              </label>
              <label className="flex items-center gap-2 text-sm md:pt-6">
                <input type="checkbox" checked={draft.is_visible} onChange={e => set({ is_visible: e.target.checked })} />
                <span className="text-gray-700">Show on the public page</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.is_past} onChange={e => set({ is_past: e.target.checked })} />
                <span className="text-gray-700">Past member (listed under "Past Members" at the bottom)</span>
              </label>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                {draft.photo_url ? <img src={draft.photo_url} alt="" className="w-full h-full object-cover" /> : <UsersRound className="h-8 w-8 text-gray-300" />}
              </div>
              <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 cursor-pointer">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {draft.photo_url ? 'Change photo' : 'Upload photo'}
                <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={e => { uploadPhoto(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              {draft.photo_url && (
                <button onClick={() => set({ photo_url: null })} className="text-sm text-red-600 hover:underline">Remove photo</button>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={save} disabled={saving || uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setDraft(null)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading…</div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200">No one yet. Add the first person.</div>
        ) : (
          teams.map(t => (
            <div key={t}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">{t}</h2>
              <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {members.filter(m => m.team === t).map(m => (
                  <li key={m.id} className="flex items-center gap-3 p-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                      {m.photo_url && <img src={m.photo_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate flex items-center gap-2">
                        {m.name}
                        {m.is_past && <span className="text-[11px] font-semibold uppercase text-amber-700 bg-amber-50 rounded px-1.5">Past</span>}
                        {!m.is_visible && <EyeOff className="h-3.5 w-3.5 text-gray-400" aria-label="Hidden" />}
                        {m.link_url && <ExternalLink className="h-3.5 w-3.5 text-gray-400" aria-label="Has link" />}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{m.role || '—'} · order {m.sort_order}</p>
                    </div>
                    <button onClick={() => setDraft({ ...m })} className="p-2 text-gray-500 hover:text-blue-600" aria-label={`Edit ${m.name}`}><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(m)} className="p-2 text-gray-500 hover:text-red-600" aria-label={`Remove ${m.name}`}><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTeam;
