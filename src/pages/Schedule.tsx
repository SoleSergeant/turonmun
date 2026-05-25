import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Filter } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { cn } from '@/lib/utils';
import { useSchedule } from '@/hooks/useSchedule';

const categoryConfig: Record<string, { dot: string; badge: string; badgeText: string }> = {
  general:   { dot: 'bg-blue-500',        badge: 'bg-blue-100 text-blue-800',         badgeText: 'General' },
  committee: { dot: 'bg-diplomatic-600',  badge: 'bg-diplomatic-100 text-diplomatic-800', badgeText: 'Committee' },
  social:    { dot: 'bg-gold-500',        badge: 'bg-gold-100 text-gold-800',         badgeText: 'Social' },
};

const Schedule = () => {
  const { scheduleData, loading, error } = useSchedule();
  const [filter, setFilter] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // For a one-day conference, flatten all events from the first (and only) day
  const day = scheduleData[0] ?? null;
  const visibleEvents = (day?.events ?? []).filter(
    e => !filter || e.category === filter
  );

  const toggleEvent = (id: string) =>
    setExpandedEvent(prev => (prev === id ? null : id));

  return (
    <div className="page-transition-container min-h-screen flex flex-col bg-diplomatic-800 overflow-hidden">
      <Navbar />
      <main className="flex-grow pt-20">

        {/* Hero */}
        <div className="relative bg-gradient-to-b from-diplomatic-700 to-diplomatic-800 text-white py-20">
          <div className="absolute inset-0 bg-hero-pattern opacity-10" />
          <div className="container relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Conference Schedule</h1>
              {day && (
                <div className="flex items-center gap-2 text-diplomatic-200 text-lg mb-4">
                  <Calendar size={18} />
                  <span>{day.date}</span>
                </div>
              )}
              <p className="text-diplomatic-100 max-w-2xl">
                Plan your TuronMUN experience with our full day programme.
              </p>
              {error && (
                <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-md">
                  <p className="text-yellow-100 text-sm">{error}. Showing sample schedule.</p>
                </div>
              )}
            </motion.div>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path d="M0 0L48 8.875C96 17.75 192 35.5 288 44.375C384 53.25 480 53.25 576 44.375C672 35.5 768 17.75 864 26.625C960 35.5 1056 71 1152 80C1248 89 1344 71 1392 62.125L1440 53.25V120H0V0Z" fill="white"/>
            </svg>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white py-6 border-b border-neutral-100">
          <div className="container">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-600">
                <Filter size={15} /> Filter:
              </div>
              {(['general', 'committee', 'social'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(filter === cat ? null : cat)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    filter === cat
                      ? `${categoryConfig[cat].dot} text-white`
                      : `${categoryConfig[cat].badge} hover:opacity-80`
                  )}
                >
                  {categoryConfig[cat].badgeText}
                </button>
              ))}
              {filter && (
                <button
                  onClick={() => setFilter(null)}
                  className="rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <section className="py-14 bg-neutral-50">
          <div className="container max-w-3xl mx-auto">

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-diplomatic-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !day ? (
              <div className="text-center py-16">
                <Calendar size={48} className="mx-auto text-diplomatic-300 mb-4" />
                <h3 className="text-xl font-semibold text-diplomatic-900 mb-2">No Schedule Available</h3>
                <p className="text-neutral-500">Check back soon — the schedule will be published before the conference.</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.05 }}
              >
                {/* Date heading */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-diplomatic-600 text-white flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold uppercase tracking-widest">Day</span>
                    <span className="text-xl font-black leading-none">1</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-diplomatic-900">{day.date}</h2>
                    <p className="text-neutral-500 text-sm">{visibleEvents.length} events</p>
                  </div>
                </div>

                {visibleEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-neutral-500">
                      No events match this filter.{' '}
                      <button onClick={() => setFilter(null)} className="text-diplomatic-600 hover:underline">Show all</button>
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-neutral-200" />

                    <div className="space-y-3">
                      {visibleEvents.map((event, idx) => {
                        const id = `event-${idx}`;
                        const cfg = event.category ? categoryConfig[event.category] : categoryConfig.general;
                        return (
                          <motion.div
                            key={id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="flex gap-4"
                          >
                            {/* Dot */}
                            <div className={`w-[46px] flex-shrink-0 flex items-start justify-center pt-4`}>
                              <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow ${cfg.dot} flex-shrink-0`} />
                            </div>

                            {/* Card */}
                            <div className="flex-1 bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden mb-1">
                              <button
                                type="button"
                                onClick={() => event.description ? toggleEvent(id) : undefined}
                                className="w-full text-left p-4 hover:bg-neutral-50 transition-colors"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-1">
                                      <Clock size={13} className="flex-shrink-0" />
                                      <span className="font-medium">{event.time}</span>
                                      {event.location && (
                                        <>
                                          <span className="text-neutral-300">·</span>
                                          <MapPin size={13} className="flex-shrink-0" />
                                          <span className="truncate">{event.location}</span>
                                        </>
                                      )}
                                    </div>
                                    <h4 className="font-semibold text-neutral-900">{event.title}</h4>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {event.isMandatory && (
                                      <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full uppercase tracking-wide">
                                        Required
                                      </span>
                                    )}
                                    {event.category && (
                                      <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide', cfg.badge)}>
                                        {cfg.badgeText}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>

                              {expandedEvent === id && event.description && (
                                <div className="px-4 pb-4 pt-1 border-t border-neutral-100 bg-neutral-50">
                                  <p className="text-sm text-neutral-600">{event.description}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Schedule;
