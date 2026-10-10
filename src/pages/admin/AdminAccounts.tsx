import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UserCog, Plus, Loader2, Trash2, Power } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ROLE_LABELS } from '@/hooks/useAdminRole';
import { confirmAction } from '@/components/admin/ConfirmDialog';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

type StaffRole = 'sg' | 'academics' | 'logistics' | 'registration' | 'judge';
const STAFF_ROLES: { value: StaffRole; label: string; hint: string }[] = [
  { value: 'sg', label: 'Secretary-General', hint: 'Everything, including accounts, forms and seasons' },
  { value: 'academics', label: 'Academics', hint: 'Applications, delegates, chairs, committees, allocation, awards' },
  { value: 'logistics', label: 'Logistics', hint: 'Volunteers and check-in' },
  { value: 'registration', label: 'Registration desk', hint: 'Check-in only' },
  { value: 'judge', label: 'Debate judge', hint: 'Turon Debate judging panel only: score teams, pick one-on-one winners, see rankings. No contact details.' },
];

interface Account {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  last_login: string | null;
}

/**
 * Staff accounts (SG only). Chairs are managed on the Chairs page.
 * Someone added here can sign in with Google using that email, or with the
 * password set here.
 */
const AdminAccounts = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: '', full_name: '', role: 'academics' as StaffRole, password: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setMe(user?.email ?? null);
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active, last_login')
      .not('role', 'in', '(chair,co_chair)')
      .order('role')
      .order('full_name');
    if (error) toast({ title: 'Could not load accounts', description: error.message, variant: 'destructive' });
    setAccounts((data as Account[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!email || !form.full_name.trim()) return;
    setSaving(true);
    try {
      let authId: string | undefined;
      if (form.password) {
        if (form.password.length < 8) throw new Error('Password must be at least 8 characters.');
        // Separate client so the SG's own session isn't replaced by the new user's.
        const temp = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
        const { data, error } = await temp.auth.signUp({
          email,
          password: form.password,
          options: { data: { full_name: form.full_name.trim() } },
        });
        if (error && !error.message.toLowerCase().includes('already registered')) throw error;
        authId = data?.user?.id;
      }

      const { error } = await (supabase.from('admin_users') as any).insert({
        ...(authId ? { id: authId } : {}),
        email,
        full_name: form.full_name.trim(),
        role: form.role,
        password_hash: 'supabase-auth',
        is_active: true,
      });
      if (error) {
        if (error.code === '23505') throw new Error(`${email} already has an admin or chair account.`);
        throw error;
      }
      toast({ title: 'Account added', description: `${form.full_name} · ${ROLE_LABELS[form.role] ?? form.role}` });
      setForm({ email: '', full_name: '', role: 'academics', password: '' });
      setShowAdd(false);
      await load();
    } catch (err: any) {
      toast({ title: 'Could not add account', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const update = async (account: Account, fields: Partial<Account>, label: string) => {
    const { error } = await (supabase.from('admin_users') as any).update(fields).eq('id', account.id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return;
    }
    setAccounts(prev => prev.map(a => (a.id === account.id ? { ...a, ...fields } : a)));
    toast({ title: label });
  };

  const remove = async (account: Account) => {
    if (!(await confirmAction(`Remove ${account.full_name || account.email}'s admin access? Their login stays, but they lose the admin panel.`, { title: 'Remove admin access', confirmLabel: 'Remove access', danger: true }))) return;
    const { error } = await supabase.from('admin_users').delete().eq('id', account.id);
    if (error) {
      toast({ title: 'Could not remove', description: error.message, variant: 'destructive' });
      return;
    }
    setAccounts(prev => prev.filter(a => a.id !== account.id));
    toast({ title: 'Access removed' });
  };

  const sgCount = accounts.filter(a => a.is_active && ['sg', 'admin', 'superadmin'].includes(a.role)).length;

  return (
    <AdminLayout title="Admin Accounts">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Admin accounts</h2>
            <p className="text-gray-600">Who can use the admin panel, and what they can do. Chairs are managed on the Chairs page.</p>
          </div>
          <button
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-2 rounded-lg bg-diplomatic-600 px-4 py-2 text-sm font-medium text-white hover:bg-diplomatic-700"
          >
            <Plus className="h-4 w-4" /> Add account
          </button>
        </div>

        {showAdd && (
          <form onSubmit={addAccount} className="rounded-lg border bg-white p-5 shadow-sm space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">Full name</span>
                <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">Email</span>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">Role</span>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as StaffRole })} className="w-full rounded-lg border border-gray-300 px-3 py-2">
                  {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <span className="mt-1 block text-xs text-gray-500">{STAFF_ROLES.find(r => r.value === form.role)?.hint}</span>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">Password (optional)</span>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Leave empty for Google sign-in" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-diplomatic-600 px-4 py-2 text-sm font-medium text-white hover:bg-diplomatic-700 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Add
              </button>
            </div>
          </form>
        )}

        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Last sign-in</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.map(a => {
                  const isMe = a.email === me;
                  const lastSg = ['sg', 'admin', 'superadmin'].includes(a.role) && a.is_active && sgCount <= 1;
                  return (
                    <tr key={a.id} className={a.is_active ? '' : 'bg-gray-50 text-gray-400'}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{a.full_name || '—'}{isMe && <span className="ml-2 text-xs text-gray-400">(you)</span>}</div>
                        <div className="text-xs text-gray-500">{a.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={['admin', 'superadmin'].includes(a.role) ? 'sg' : a.role}
                          disabled={isMe || lastSg}
                          onChange={e => update(a, { role: e.target.value }, 'Role updated')}
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-50"
                        >
                          {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{a.last_login ? new Date(a.last_login).toLocaleDateString() : 'Never'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                          {a.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isMe && !lastSg && (
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => update(a, { is_active: !a.is_active }, a.is_active ? 'Account disabled' : 'Account enabled')}
                              title={a.is_active ? 'Disable' : 'Enable'}
                              className="text-gray-500 hover:text-gray-800"
                            >
                              <Power className="h-4 w-4" />
                            </button>
                            <button onClick={() => remove(a)} title="Remove access" className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="flex items-center gap-2 text-xs text-gray-500">
          <UserCog className="h-4 w-4" /> You can't change your own role, or remove the last active Secretary-General.
        </p>
      </div>
    </AdminLayout>
  );
};

export default AdminAccounts;
