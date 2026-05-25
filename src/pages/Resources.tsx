import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Book, FileText, Video, Download, BookOpen, ArrowRight, BookMarked, Scale, PenLine, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Resource {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  category: string;
  committee_id: string | null;
  is_public: boolean;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; anchor: string; description: string }> = {
  handbook:           { label: 'Delegate Handbook',        icon: BookMarked, anchor: 'handbook',   description: 'The official TuronMUN guide covering procedures, rules, and delegate etiquette.' },
  rop:                { label: 'Rules of Procedure',       icon: Scale,      anchor: 'rop',        description: 'Official rules governing committee sessions and debate.' },
  position_paper:     { label: 'Position Paper & Resolution', icon: PenLine, anchor: 'papers',    description: 'Templates, guides, and samples for writing position papers and resolutions.' },
  'Delegate Guides':  { label: 'Delegate Guides',          icon: Book,       anchor: 'guides',     description: 'Research guides and preparation materials for all delegates.' },
  'Committee Materials': { label: 'Committee Materials',   icon: FileText,   anchor: 'committee',  description: 'Background guides and topic briefs for all committees.' },
  'Video Tutorials':  { label: 'Video Tutorials',          icon: Video,      anchor: 'videos',     description: 'Visual walkthroughs to help you master MUN skills.' },
};

const CATEGORY_ORDER = ['handbook', 'rop', 'position_paper', 'Delegate Guides', 'Committee Materials', 'Video Tutorials'];

const Resources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('resources')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: true });

      if (!error && data) setResources(data);
    } catch (e) {
      console.error('Failed to load resources:', e);
    } finally {
      setLoading(false);
    }
  };

  // Group by category, preserving order
  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = resources.filter(r => r.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, Resource[]>);

  // Categories that have at least one resource
  const activeCategories = CATEGORY_ORDER.filter(cat => grouped[cat]);

  const scrollTo = (anchor: string) => {
    const el = document.getElementById(anchor);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveFilter(anchor);
  };

  const isVideo = (url: string) =>
    url.includes('youtu') || url.includes('vimeo') || url.includes('youtube');

  return (
    <div className="page-transition-container min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20">

        {/* Header */}
        <section className="bg-gradient-to-b from-diplomatic-50 to-white py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <span className="chip-gold mb-4">Delegate Preparation</span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-diplomatic-800">
                Resources & Materials
              </h1>
              <p className="text-lg text-neutral-600 mb-8">
                Access comprehensive guides, background materials, and tools to help you prepare for a successful Model UN experience.
              </p>

              {/* Category jump buttons */}
              {!loading && activeCategories.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center">
                  {activeCategories.map(cat => {
                    const cfg = CATEGORY_CONFIG[cat];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={cat}
                        onClick={() => scrollTo(cfg.anchor)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                          activeFilter === cfg.anchor
                            ? 'bg-diplomatic-700 text-white border-diplomatic-700'
                            : 'border-diplomatic-200 text-diplomatic-700 hover:bg-diplomatic-50'
                        }`}
                      >
                        <Icon size={15} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Resource sections */}
        <section className="py-16">
          <div className="container max-w-5xl mx-auto">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-diplomatic-400" size={36} />
              </div>
            ) : activeCategories.length === 0 ? (
              <div className="text-center py-20 text-neutral-400">
                <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg">Resources will appear here once uploaded by the admin.</p>
              </div>
            ) : (
              <div className="space-y-16">
                {activeCategories.map(cat => {
                  const cfg = CATEGORY_CONFIG[cat];
                  const Icon = cfg.icon;
                  const items = grouped[cat];
                  return (
                    <div key={cat} id={cfg.anchor} className="scroll-mt-24">
                      {/* Section header */}
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
                        <div className="p-2.5 rounded-lg bg-diplomatic-100 text-diplomatic-700">
                          <Icon size={22} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-display font-semibold text-diplomatic-800">{cfg.label}</h2>
                          <p className="text-neutral-500 text-sm">{cfg.description}</p>
                        </div>
                      </div>

                      {/* Resource cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map(resource => (
                          <a
                            key={resource.id}
                            href={resource.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col justify-between p-5 bg-white rounded-xl border border-neutral-100 shadow-subtle hover:shadow-elegant hover:border-diplomatic-200 transition-all"
                          >
                            <div>
                              <h3 className="font-semibold text-diplomatic-800 group-hover:text-diplomatic-600 transition-colors mb-1">
                                {resource.title}
                              </h3>
                              {resource.description && (
                                <p className="text-sm text-neutral-500 line-clamp-2">{resource.description}</p>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                              <span className="text-xs text-neutral-400 uppercase tracking-wide font-medium">
                                {isVideo(resource.file_url) ? 'Watch' : resource.file_type?.includes('presentation') || resource.file_type?.includes('pptx') ? 'Slides' : 'PDF'}
                              </span>
                              {isVideo(resource.file_url)
                                ? <ArrowRight size={16} className="text-neutral-400 group-hover:text-diplomatic-600 transition-colors group-hover:translate-x-0.5" />
                                : <Download size={16} className="text-neutral-400 group-hover:text-diplomatic-600 transition-colors" />
                              }
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* External links */}
        <section className="py-12 bg-diplomatic-50/50">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <h2 className="text-2xl font-display font-semibold mb-3">Additional Resources</h2>
              <p className="text-neutral-600 text-sm">External links to help you prepare further.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { title: 'Country Research Database', desc: 'Detailed information on all UN member states.', label: 'Explore', href: 'https://www.un.org/en/about-us/member-states' },
                { title: 'Resolution Templates', desc: 'Download templates for drafting effective resolutions.', label: 'Download', href: 'https://www.wisemee.com/model-un-resolution-template/' },
                { title: 'Diplomatic Glossary', desc: 'Essential terms and phrases used in diplomatic contexts.', label: 'View Glossary', href: 'https://www.wisemee.com/mun-glossary/' },
              ].map(link => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                  className="bg-white p-6 rounded-xl border border-neutral-100 shadow-subtle hover:shadow-elegant transition-all group">
                  <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-diplomatic-600 transition-colors">{link.title}</h3>
                  <p className="text-neutral-600 text-sm mb-4">{link.desc}</p>
                  <div className="text-diplomatic-600 text-sm font-medium inline-flex items-center">
                    {link.label} <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default Resources;
