import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSchedule } from '@/hooks/useSchedule';

interface ScheduleItem {
  day: string;
  date: string;
  events: {
    time: string;
    title: string;
    location?: string;
  }[];
}

export default function SchedulePreview() {
  const { scheduleData, loading, error } = useSchedule();

  // One-day conference: show the single day's first 5 events as a preview
  const day = scheduleData[0] ?? null;

  if (loading) {
    return (
      <section className="section bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <div className="h-8 bg-neutral-200 rounded-full w-32 mx-auto mb-3 animate-pulse" />
            <div className="h-9 bg-neutral-200 rounded w-64 mx-auto mb-4 animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded w-96 mx-auto animate-pulse" />
          </div>

          <div className="max-w-3xl mx-auto glass-panel p-5 sm:p-6 animate-pulse">
            {/* Day header skeleton */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-neutral-300 rounded-md" />
              <div className="space-y-1.5">
                <div className="h-4 bg-neutral-300 rounded w-36" />
                <div className="h-3 bg-neutral-200 rounded w-24" />
              </div>
            </div>
            {/* Event row skeletons */}
            <div className="border-l-2 border-neutral-200 pl-6 ml-3 space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 bg-neutral-200 rounded w-20" />
                  <div className="h-4 bg-neutral-300 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!day) {
    return (
      <section className="section bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <span className="chip mb-2">Event Schedule</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Conference Agenda</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              The conference schedule will be available soon. Check back later for updates!
            </p>
          </div>
          
          <div className="text-center py-12 glass-panel max-w-xl mx-auto">
            <Calendar size={48} className="mx-auto text-diplomatic-300 mb-4" />
            <p className="text-neutral-500 mb-4">No schedule available yet.</p>
            <Link to="/schedule" className="btn-secondary">
              Visit Schedule Page
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section bg-white">
      <div className="container">
        <div className="text-center mb-12">
          <span className="chip mb-2">Event Schedule</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Conference Agenda</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Here's a preview of our event schedule. For the complete agenda and details, please visit the Schedule page.
          </p>
          {error && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
              <p className="text-yellow-800 text-sm">
                {error}. Showing available schedule data.
              </p>
            </div>
          )}
        </div>
        
        <div className="max-w-3xl mx-auto">
          {day && (
            <div className="mb-8 animate-fade-in opacity-0 glass-panel p-5 sm:p-6" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-white/80 rounded-md text-diplomatic-700">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">Conference Day</h3>
                  <p className="text-neutral-500 text-sm">{day.date}</p>
                </div>
              </div>

              <div className="border-l-2 border-white/40 pl-6 ml-3 space-y-6">
                {day.events.slice(0, 5).map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    className="relative before:content-[''] before:absolute before:w-3 before:h-3 before:bg-diplomatic-500 before:rounded-full before:-left-[32px] before:top-2"
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <Clock size={16} className="text-neutral-400 mt-1 flex-shrink-0" />
                      <p className="text-neutral-500 text-sm">{event.time}</p>
                    </div>
                    <h4 className="text-lg font-medium mb-1">{event.title}</h4>
                    {event.location && (
                      <p className="text-neutral-600 text-sm">{event.location}</p>
                    )}
                  </div>
                ))}
                {day.events.length > 5 && (
                  <div className="relative before:content-[''] before:absolute before:w-3 before:h-3 before:bg-diplomatic-300 before:rounded-full before:-left-[32px] before:top-2">
                    <p className="text-neutral-500 text-sm italic">
                      +{day.events.length - 5} more events on the full schedule...
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="text-center mt-8">
            <Link to="/schedule" className="btn-secondary">
              View Full Schedule
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
