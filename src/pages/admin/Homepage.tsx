import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Home } from 'lucide-react';

const FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: 'badge_label', label: 'Badge label', hint: 'Small pill above the heading' },
  { key: 'heading', label: 'Heading' },
  { key: 'subtitle', label: 'Subtitle' },
  { key: 'date_text', label: 'Date' },
  { key: 'duration_text', label: 'Duration' },
  { key: 'location_text', label: 'Location' },
  { key: 'delegates_text', label: 'Delegates' },
  { key: 'apply_label', label: 'Apply button text' },
];

const DEFAULTS: Record<string, string> = {
  badge_label: 'Next Season',
  heading: 'Coming Soon',
  subtitle: 'Season 7 details will be announced shortly.',
  date_text: 'To be announced',
  duration_text: 'To be announced',
  location_text: 'Fergana, Uzbekistan',
  delegates_text: 'To be announced',
  apply_label: 'Apply for Season 7',
};

const Homepage = () => {
  const { toast } = useToast();
  const [form, setForm] = useState<Record<string, string>>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (supabase.from('season_info' as any) as any).select('*').eq('id', 1).single()
      .then(({ data }: any) => {
        if (data) setForm({ ...DEFAULTS, ...data });
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = { id: 1, updated_at: new Date().toISOString() };
      FIELDS.forEach(f => { payload[f.key] = form[f.key] ?? ''; });
      const { error } = await (supabase.from('season_info' as any) as any)
        .update(payload).eq('id', 1);
      if (error) throw error;
      toast({ title: 'Saved', description: 'Homepage card updated.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Homepage">
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Home className="h-6 w-6 text-diplomatic-600" /> Homepage "Next Season" Card
          </h2>
          <p className="text-gray-600">Edit the announcement card shown on the public homepage.</p>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : (
          <div className="bg-white rounded-lg border p-6 space-y-4">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  type="text"
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {f.hint && <p className="text-xs text-gray-400 mt-1">{f.hint}</p>}
              </div>
            ))}

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-diplomatic-700 text-white rounded-lg font-semibold hover:bg-diplomatic-800 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
              <p className="text-xs text-gray-400">
                Tip: leave Date/Duration/Delegates as "To be announced" until confirmed — they show greyed-out.
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Homepage;
