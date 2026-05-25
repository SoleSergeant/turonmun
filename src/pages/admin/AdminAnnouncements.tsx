import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Bell, Plus, Trash2, Edit2, Eye, EyeOff,
  Loader2, Save, X, AlertTriangle, Info, CheckCircle
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  target_audience: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string | null;
}

const EMPTY: Omit<Announcement, 'id' | 'created_at' | 'published_at'> = {
  title: '',
  content: '',
  priority: 'medium',
  target_audience: 'all',
  is_published: false,
};

const priorityConfig = {
  low:    { label: 'Low',    icon: Info,          badge: 'bg-blue-100 text-blue-700' },
  medium: { label: 'Medium', icon: CheckCircle,   badge: 'bg-yellow-100 text-yellow-700' },
  high:   { label: 'High',   icon: AlertTriangle, badge: 'bg-red-100 text-red-700' },
};

export default function AdminAnnouncements() {
  const { toast } = useToast();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openNew = () => {
    setEditId(null);
    setForm({ ...EMPTY });
    setShowForm(true);
  };

  const openEdit = (item: Announcement) => {
    setEditId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      priority: item.priority,
      target_audience: item.target_audience,
      is_published: item.is_published,
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditId(null); };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: 'Required fields missing', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      priority: form.priority,
      target_audience: form.target_audience,
      is_published: form.is_published,
      published_at: form.is_published ? new Date().toISOString() : null,
    };

    const { error } = editId
      ? await (supabase as any).from('announcements').update(payload).eq('id', editId)
      : await (supabase as any).from('announcements').insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editId ? 'Announcement updated' : 'Announcement created' });
      closeForm();
      fetch();
    }
  };

  const togglePublish = async (item: Announcement) => {
    const next = !item.is_published;
    const { error } = await (supabase as any)
      .from('announcements')
      .update({ is_published: next, published_at: next ? new Date().toISOString() : null })
      .eq('id', item.id);
    if (error) {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: next ? 'Published — visible on the site' : 'Unpublished' });
      fetch();
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    const { error } = await (supabase as any).from('announcements').delete().eq('id', id);
    if (error) {
      toast({ title: 'Failed to delete', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted' });
      fetch();
    }
  };

  const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <AdminLayout title="Announcements">
      <div className="p-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
            <p className="text-sm text-gray-500 mt-1">
              Published announcements with audience <strong>Everyone</strong> appear publicly on the Event Updates page.
            </p>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 bg-diplomatic-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-diplomatic-800 transition-colors"
          >
            <Plus size={16} /> New Announcement
          </button>
        </div>

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editId ? 'Edit Announcement' : 'New Announcement'}
                </h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-diplomatic-300"
                    placeholder="e.g. Registration deadline extended"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                  <textarea
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    rows={5}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-diplomatic-300 resize-none"
                    placeholder="Full announcement text…"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={form.priority}
                      onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-diplomatic-300"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                    <select
                      value={form.target_audience}
                      onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-diplomatic-300"
                    >
                      <option value="all">Everyone (public)</option>
                      <option value="delegates">Delegates only</option>
                      <option value="chairs">Chairs only</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm(f => ({ ...f, is_published: !f.is_published }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.is_published ? 'bg-diplomatic-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_published ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {form.is_published ? 'Published (visible on site)' : 'Draft (hidden from public)'}
                  </span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-diplomatic-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-diplomatic-800 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={closeForm}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-diplomatic-400" size={32} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No announcements yet. Create one to inform delegates on the site.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const pc = priorityConfig[item.priority as keyof typeof priorityConfig] ?? priorityConfig.medium;
              const PIcon = pc.icon;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border p-5 flex items-start gap-4 ${item.is_published ? 'border-diplomatic-200' : 'border-gray-100'}`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg ${item.is_published ? 'bg-diplomatic-100 text-diplomatic-700' : 'bg-gray-100 text-gray-400'}`}>
                    <Bell size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${pc.badge}`}>
                        <PIcon size={11} /> {pc.label}
                      </span>
                      {item.is_published ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Live</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Draft</span>
                      )}
                      <span className="text-xs text-gray-400">
                        {item.target_audience === 'all' ? '🌐 Public' : `👤 ${item.target_audience}`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{item.content}</p>
                    <p className="text-xs text-gray-400 mt-1">Created {fmtDate(item.created_at)}</p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => togglePublish(item)}
                      title={item.is_published ? 'Unpublish' : 'Publish'}
                      className={`p-1.5 rounded-lg transition-colors ${item.is_published ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                      {item.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
