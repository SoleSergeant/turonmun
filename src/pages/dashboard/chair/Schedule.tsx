import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Filter } from 'lucide-react';
import { useSchedule } from '@/hooks/useSchedule';
import { cn } from '@/lib/utils';

const categoryConfig: Record<string, { dot: string; badge: string; label: string }> = {
  general:   { dot: 'bg-blue-500',       badge: 'bg-blue-500/20 text-blue-300',         label: 'General'   },
  committee: { dot: 'bg-diplomatic-500', badge: 'bg-diplomatic-500/20 text-diplomatic-300', label: 'Committee' },
  social:    { dot: 'bg-gold-500',       badge: 'bg-gold-500/20 text-gold-300',          label: 'Social'    },
};

export default function ChairSchedule() {
  const { scheduleData, loading, error } = useSchedule();
  const [filter, setFilter] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // Single-day conference — take the first (and only) day
  const day = scheduleData[0] ?? null;
  const visibleEvents = (day?.events ?? []).filter(
    e => !filter || e.category === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading schedule…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Conference Schedule</h2>
        {day && (
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Calendar size={14} />
            <span>{day.date}</span>
          </div>
        )}
        {error && (
          <div className="mt-3 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <p className="text-yellow-200 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-white/50" />
          <span className="text-sm font-medium text-white/70">Filter:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(categoryConfig) as [string, typeof categoryConfig[string]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? null : key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === key ? `${cfg.dot} text-white` : cfg.badge
              )}
            >
              {cfg.label}
            </button>
          ))}
          {filter && (
            <button
              onClick={() => setFilter(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      {!day ? (
        <div className="glass-card p-12 text-center">
          <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Schedule Yet</h3>
          <p className="text-white/50">The schedule will appear here once it's published.</p>
        </div>
      ) : visibleEvents.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-white/50">
            No events match this filter.{' '}
            <button onClick={() => setFilter(null)} className="text-gold-400 hover:underline">
              Show all
            </button>
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden divide-y divide-white/10">
          {visibleEvents.map((event, idx) => {
            const id = `event-${idx}`;
            const cfg = event.category ? categoryConfig[event.category] : categoryConfig.general;
            const isExpanded = expandedEvent === id;

            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <button
                  type="button"
                  className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors"
                  onClick={() => event.description ? setExpandedEvent(isExpanded ? null : id) : undefined}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Color dot */}
                      <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />

                      <div className="flex-1 min-w-0">
                        {/* Time + location */}
                        <div className="flex items-center gap-2 text-white/50 text-xs mb-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {event.time}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} />
                              {event.location}
                            </span>
                          )}
                        </div>
                        {/* Title */}
                        <h4 className="text-white font-semibold text-sm leading-snug">{event.title}</h4>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {event.isMandatory && (
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-red-500/20 text-red-300 rounded-full uppercase tracking-wide">
                          Required
                        </span>
                      )}
                      {event.category && (
                        <span className={cn('px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wide', cfg.badge)}>
                          {cfg.label}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded description */}
                {isExpanded && event.description && (
                  <div className="px-5 pb-4 pt-1 border-t border-white/5 bg-white/3">
                    <p className="text-white/70 text-sm">{event.description}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
