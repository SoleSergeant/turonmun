import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { useSchedule } from '@/hooks/useSchedule';
import { cn } from '@/lib/utils';

const categoryConfig: Record<string, { color: string; background: string }> = {
  general: { color: 'bg-blue-500', background: 'bg-blue-500/20' },
  committee: { color: 'bg-diplomatic-600', background: 'bg-diplomatic-500/20' },
  social: { color: 'bg-gold-500', background: 'bg-gold-500/20' },
  workshop: { color: 'bg-green-500', background: 'bg-green-500/20' }
};

export default function ChairSchedule() {
  const { scheduleData, loading, error } = useSchedule();
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const toggleDay = (index: number) => {
    setExpandedDay(expandedDay === index ? null : index);
  };

  const toggleEvent = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  const filterEvents = (category: string | null) => {
    setFilter(filter === category ? null : category);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Conference Schedule</h2>
        <p className="text-white/60">
          View the complete TuronMUN conference schedule
        </p>
        {error && (
          <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <p className="text-yellow-200 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-white/60" />
          <span className="text-sm font-medium text-white/80">Filter by:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => filterEvents('general')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              filter === 'general'
                ? "bg-blue-500 text-white"
                : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
            )}
          >
            General Sessions
          </button>
          <button
            onClick={() => filterEvents('committee')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              filter === 'committee'
                ? "bg-diplomatic-600 text-white"
                : "bg-diplomatic-500/20 text-diplomatic-300 hover:bg-diplomatic-500/30"
            )}
          >
            Committee Work
          </button>
          <button
            onClick={() => filterEvents('social')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              filter === 'social'
                ? "bg-gold-500 text-white"
                : "bg-gold-500/20 text-gold-300 hover:bg-gold-500/30"
            )}
          >
            Social Events
          </button>
          <button
            onClick={() => filterEvents('workshop')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              filter === 'workshop'
                ? "bg-green-500 text-white"
                : "bg-green-500/20 text-green-300 hover:bg-green-500/30"
            )}
          >
            Workshops
          </button>
          {filter && (
            <button
              onClick={() => setFilter(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Schedule Days */}
      {scheduleData.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Schedule Available</h3>
          <p className="text-white/60">
            The conference schedule will be available soon. Check back later for updates!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {scheduleData.map((day, dayIndex) => (
            <motion.div
              key={dayIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.1 }}
              className="glass-card overflow-hidden"
            >
              {/* Day Header */}
              <div
                className="p-6 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleDay(dayIndex)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gold-500 text-white flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">DAY</span>
                    <span className="text-xl font-bold">{dayIndex + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{day.day}</h3>
                    <div className="flex items-center text-white/60 text-sm mt-1">
                      <Calendar size={14} className="mr-1" />
                      {day.date}
                    </div>
                  </div>
                </div>
                <div className="text-white/60">
                  {expandedDay === dayIndex ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </div>

              {/* Day Events */}
              {(expandedDay === dayIndex || expandedDay === null) && (
                <div className="border-t border-white/10">
                  {day.events
                    .filter(event => !filter || event.category === filter)
                    .map((event, eventIndex) => {
                      const eventId = `${dayIndex}-${eventIndex}`;

                      return (
                        <div key={eventIndex} className="border-b border-white/10 last:border-b-0">
                          <div
                            className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => toggleEvent(eventId)}
                          >
                            <div className="flex items-start gap-3 flex-1">
                              {/* Time */}
                              <div className="flex items-center gap-1 text-sm text-white/60 min-w-[140px]">
                                <Clock size={14} className="flex-shrink-0" />
                                <span>{event.time}</span>
                              </div>

                              {/* Title and Location */}
                              <div className="flex-1">
                                <h4 className="text-base font-semibold text-white">{event.title}</h4>
                                {event.location && (
                                  <div className="flex items-center text-sm text-white/60 mt-1">
                                    <MapPin size={14} className="mr-1" />
                                    {event.location}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Category Tags */}
                            <div className="flex items-center gap-2">
                              {event.isMandatory && (
                                <span className="px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded-full">
                                  Mandatory
                                </span>
                              )}
                              {event.category && (
                                <span
                                  className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-full text-white",
                                    categoryConfig[event.category].color
                                  )}
                                >
                                  {event.category === 'general' ? 'General' :
                                    event.category === 'committee' ? 'Committee' :
                                      event.category === 'social' ? 'Social' :
                                        'Workshop'}
                                </span>
                              )}
                              <ChevronDown
                                size={16}
                                className={cn(
                                  "text-white/40 transition-transform duration-200",
                                  expandedEvent === eventId ? "rotate-180" : ""
                                )}
                              />
                            </div>
                          </div>

                          {/* Event Details */}
                          {expandedEvent === eventId && event.description && (
                            <div
                              className={cn(
                                "px-6 py-4 border-t border-white/10",
                                event.category ? categoryConfig[event.category].background : "bg-white/5"
                              )}
                            >
                              <p className="text-sm text-white/80">{event.description}</p>
                              {event.speakers && event.speakers.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-xs font-medium text-white/60">Speakers: </span>
                                  <span className="text-xs text-white/80">{event.speakers.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {day.events.filter(event => !filter || event.category === filter).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-white/60">
                        No events match the selected filter.{' '}
                        <button onClick={() => setFilter(null)} className="text-gold-400 hover:underline">
                          View all events
                        </button>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
