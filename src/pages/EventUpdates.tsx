import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { Helmet } from 'react-helmet-async';
import {
  Bell, ArrowRight, Calendar, Users, FileText,
  BookOpen, AlertTriangle, Info, CheckCircle,
  Loader2, Megaphone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  target_audience: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string | null;
}

const priorityConfig: Record<string, { icon: React.ElementType; badge: string; bar: string }> = {
  high:   { icon: AlertTriangle, badge: 'bg-red-50 border-red-200 text-red-700',     bar: 'bg-red-400' },
  medium: { icon: Info,          badge: 'bg-amber-50 border-amber-200 text-amber-700', bar: 'bg-amber-400' },
  low:    { icon: CheckCircle,   badge: 'bg-blue-50 border-blue-200 text-blue-700',  bar: 'bg-blue-400' },
};

const quickLinks = [
  {
    title: 'Committees',
    desc: 'Browse this season\'s committees, topics, and background guides.',
    icon: Users,
    to: '/committees',
    color: 'from-diplomatic-600 to-diplomatic-800',
  },
  {
    title: 'Schedule',
    desc: 'Full conference programme with session timings and locations.',
    icon: Calendar,
    to: '/schedule',
    color: 'from-gold-500 to-gold-700',
  },
  {
    title: 'Resources',
    desc: 'Delegate handbook, ROP, position paper templates, and more.',
    icon: BookOpen,
    to: '/resources',
    color: 'from-teal-500 to-teal-700',
  },
  {
    title: 'Register',
    desc: 'Applications are open — secure your spot today.',
    icon: FileText,
    to: '/register',
    color: 'from-purple-600 to-purple-800',
  },
];

const fmt = (s: string | null) =>
  s
    ? new Date(s).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : '';

export default function EventUpdates() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    (async () => {
      const { data, error } = await (supabase as any)
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .eq('target_audience', 'all')
        .order('published_at', { ascending: false });
      if (!error && data) setAnnouncements(data);
      setLoading(false);
    })();
  }, []);

  return (
    <PageLayout>
      <Helmet>
        <title>Event Updates | TuronMUN</title>
        <meta name="description" content="Latest announcements, schedule, and committee information for TuronMUN." />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-b from-diplomatic-50 to-white py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-2xl mx-auto text-center"
          >
            <span className="chip-gold mb-4">Stay Informed</span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-diplomatic-800 mb-4">
              Event Updates
            </h1>
            <p className="text-lg text-neutral-600">
              All official announcements, schedule changes, and key conference information — in one place, no Telegram needed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick links */}
      <section className="py-10 bg-white border-b border-neutral-100">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {quickLinks.map(l => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className="group flex flex-col gap-3 p-4 bg-white rounded-xl border border-neutral-100 shadow-subtle hover:shadow-elegant hover:border-diplomatic-200 transition-all"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${l.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-diplomatic-800 text-sm group-hover:text-diplomatic-600 transition-colors">
                      {l.title}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-snug">{l.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Announcements feed */}
      <section className="py-14 bg-neutral-50">
        <div className="container max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-diplomatic-100 text-diplomatic-700">
              <Megaphone size={20} />
            </div>
            <h2 className="text-2xl font-display font-semibold text-diplomatic-800">Official Announcements</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-diplomatic-400" size={32} />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-20 text-neutral-400">
              <Bell size={44} className="mx-auto mb-4 opacity-25" />
              <p className="text-base font-medium text-neutral-500">No announcements yet</p>
              <p className="text-sm mt-1">
                Check back soon — updates will appear here as the conference approaches.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((a, i) => {
                const pc = priorityConfig[a.priority] ?? priorityConfig.low;
                const PIcon = pc.icon;
                const isOpen = expanded === a.id;
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`bg-white rounded-xl border overflow-hidden shadow-subtle ${pc.badge.includes('red') ? 'border-red-200' : pc.badge.includes('amber') ? 'border-amber-200' : 'border-blue-200'}`}
                  >
                    {/* Priority bar */}
                    <div className={`h-1 w-full ${pc.bar}`} />

                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 p-1.5 rounded-lg ${pc.badge} border flex-shrink-0`}>
                          <PIcon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-diplomatic-900 text-sm">{a.title}</h3>
                            {a.published_at && (
                              <span className="text-xs text-neutral-400 flex-shrink-0">{fmt(a.published_at)}</span>
                            )}
                          </div>

                          <p className={`text-sm text-neutral-600 mt-2 leading-relaxed ${isOpen ? '' : 'line-clamp-2'}`}>
                            {a.content}
                          </p>

                          {a.content.length > 160 && (
                            <button
                              onClick={() => setExpanded(isOpen ? null : a.id)}
                              className="mt-2 text-xs font-medium text-diplomatic-600 hover:text-diplomatic-800 inline-flex items-center gap-1 transition-colors"
                            >
                              {isOpen ? 'Show less' : 'Read more'}
                              <ArrowRight size={11} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
