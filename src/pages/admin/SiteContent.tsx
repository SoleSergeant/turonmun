import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, RotateCcw, Save, ExternalLink, FileText } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FieldList } from '@/components/admin/content/FieldEditor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SECTION_LIST } from '@/content/sections';
import { reloadContent, getSection } from '@/content/store';
import { isAdminHost } from '@/lib/adminPath';

interface Row {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
  updated_by: string | null;
}

// Where each section shows up, for the "View on site" link.
const PREVIEW: Record<string, string> = {
  general: '/', next_season: '/', hero: '/', home_about: '/', home_sections: '/', faq: '/', sponsors: '/',
  about_page: '/about', past_conferences: '/past-conferences', past_seasons: '/past-conferences',
  registration: '/register', pages: '/committees', contact: '/contact', seo: '/', extras: '/',
};

/**
 * Admin → Site content (SG only). Every text, link, image and list on the
 * public site, grouped by section. Unsaved sections show the built-in text.
 */
const SiteContent = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [activeKey, setActiveKey] = useState(SECTION_LIST[0].key);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const section = SECTION_LIST.find(s => s.key === activeKey)!;

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from('site_content' as any) as any).select('*');
    if (error) {
      setMissing(true);
    } else {
      setRows(Object.fromEntries(((data || []) as Row[]).map(r => [r.key, r])));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Load the selected section into the form: defaults + saved values.
  useEffect(() => {
    setDraft({ ...section.defaults, ...(rows[activeKey]?.value || {}) });
    setDirty(false);
  }, [activeKey, rows]);

  const groups = useMemo(() => {
    const g: Record<string, typeof SECTION_LIST> = {};
    SECTION_LIST.forEach(s => { (g[s.group] ||= []).push(s); });
    return Object.entries(g);
  }, []);

  const choose = (key: string) => {
    if (dirty && !confirm('You have unsaved changes in this section. Discard them?')) return;
    setActiveKey(key);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data, error } = await (supabase.from('site_content' as any) as any)
        .upsert({ key: activeKey, value: draft })
        .select()
        .single();
      if (error) throw error;
      setRows(prev => ({ ...prev, [activeKey]: data as Row }));
      await reloadContent();
      toast({ title: 'Saved', description: `${section.title} is live on the site.` });
    } catch (err: any) {
      toast({ title: 'Could not save', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirm(`Reset "${section.title}" to the original built-in text? Your edits to this section will be lost.`)) return;
    const { error } = await (supabase.from('site_content' as any) as any).delete().eq('key', activeKey);
    if (error) {
      toast({ title: 'Could not reset', description: error.message, variant: 'destructive' });
      return;
    }
    setRows(prev => {
      const next = { ...prev };
      delete next[activeKey];
      return next;
    });
    await reloadContent();
    toast({ title: 'Reset to original' });
  };

  const saved = rows[activeKey];
  // On admin.* the same path would open the admin panel, so link to the public site.
  const previewPath = activeKey === 'debate'
    ? (isAdminHost() ? 'https://debat.turonmun.com' : '/?subdomain=debate')
    : (isAdminHost() ? getSection('seo').site_url.replace(/\/$/, '') : '') + (PREVIEW[activeKey] ?? '/');

  return (
    <AdminLayout title="Site content">
      {missing ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Site content isn't set up yet. Run <code className="font-mono">supabase/migrations/040_site_content.sql</code> first.
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="lg:w-64 lg:shrink-0">
            <div className="space-y-4 rounded-lg border bg-white p-3 shadow-sm lg:sticky lg:top-0">
              {groups.map(([group, sections]) => (
                <div key={group}>
                  <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">{group}</p>
                  <ul className="space-y-0.5">
                    {sections.map(s => (
                      <li key={s.key}>
                        <button
                          onClick={() => choose(s.key)}
                          className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${
                            s.key === activeKey ? 'bg-diplomatic-50 font-medium text-diplomatic-800' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="truncate">{s.title}</span>
                          {rows[s.key] && <span className="ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" title="Edited" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </aside>

          <section className="min-w-0 flex-1 space-y-5">
            <div className="flex flex-col gap-3 rounded-lg border bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <FileText className="h-5 w-5 text-diplomatic-600" /> {section.title}
                </h2>
                {section.description && <p className="mt-1 text-sm text-gray-600">{section.description}</p>}
                <p className="mt-1 text-xs text-gray-400">
                  {saved
                    ? `Last edited ${new Date(saved.updated_at).toLocaleString()}${saved.updated_by ? ` by ${saved.updated_by}` : ''}`
                    : 'Showing the original built-in text'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={previewPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <ExternalLink className="h-4 w-4" /> View on site
                </a>
                {saved && (
                  <button onClick={reset} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <RotateCcw className="h-4 w-4" /> Reset
                  </button>
                )}
                <button
                  onClick={save}
                  disabled={!dirty || saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-diplomatic-600 px-4 py-2 text-sm font-medium text-white hover:bg-diplomatic-700 disabled:opacity-40"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
              </div>
            </div>

            <div className="space-y-5 rounded-lg border bg-white p-5 shadow-sm">
              <p className="text-xs text-gray-500">
                Tip: write <code className="rounded bg-gray-100 px-1">{'{season}'}</code> to insert the Season label from General.
              </p>
              <FieldList
                fields={section.fields}
                value={draft}
                onChange={next => { setDraft(next); setDirty(true); }}
              />
            </div>

            {dirty && (
              <div className="sticky bottom-4 flex items-center justify-between rounded-lg border border-diplomatic-200 bg-diplomatic-50 px-4 py-3 shadow-lg">
                <span className="text-sm text-diplomatic-900">Unsaved changes</span>
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-diplomatic-600 px-4 py-2 text-sm font-medium text-white hover:bg-diplomatic-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </AdminLayout>
  );
};

export default SiteContent;
