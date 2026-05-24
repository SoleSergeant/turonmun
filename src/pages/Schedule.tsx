import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { cn } from '@/lib/utils';
import { useSchedule } from '@/hooks/useSchedule';

// Define the types for our schedule data
interface ScheduleEvent {
  time: string;
  title: string;
  location?: string;
  description?: string;
  speakers?: string[];
  category?: 'general' | 'committee' | 'social' | 'workshop';
  eventType?: string;
  isMandatory?: boolean;
}

interface ScheduleDay {
  day: string;
  date: string;
  events: ScheduleEvent[];
}

// Category colors and icons mapping
const categoryConfig: Record<string, { color: string; background: string; }> = {
  general: { color: 'bg-blue-500', background: 'bg-blue-50' },
  committee: { color: 'bg-diplomatic-600', background: 'bg-diplomatic-50' },
  social: { color: 'bg-gold-500', background: 'bg-gold-50' },
  workshop: { color: 'bg-green-500', background: 'bg-green-50' }
};

const Schedule = () => {
  const { scheduleData, loading, error } = useSchedule();
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleDay = (index: number) => {
    setExpandedDay(expandedDay === index ? null : index);
  };

  const toggleEvent = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };
  
  const filterEvents = (category: string | null) => {
    setFilter(filter === category ? null : category);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  if (loading) {
    return (
      <div className="page-transition-container min-h-screen flex flex-col bg-diplomatic-800">
        <Navbar />
        <main className="flex-grow pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="loader w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading schedule...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-transition-container min-h-screen flex flex-col bg-diplomatic-800 overflow-hidden">
      <Navbar />
      <main className="flex-grow pt-20">
        {/* Hero section */}
        <div className="relative bg-gradient-to-b from-diplomatic-700 to-diplomatic-800 text-white py-20">
          <div className="absolute inset-0 bg-hero-pattern opacity-10"></div>
          <div className="container relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Conference Schedule</h1>
              <p className="text-xl text-diplomatic-100 max-w-2xl">
                Plan your TuronMUN experience with our comprehensive schedule of committee sessions, 
                workshops, and social events.
              </p>
              {error && (
                <div className="mt-4 p-3 bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-md">
                  <p className="text-yellow-100 text-sm">
                    {error}. Showing sample schedule as fallback.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
          
          {/* Decorative wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path d="M0 0L48 8.875C96 17.75 192 35.5 288 44.375C384 53.25 480 53.25 576 44.375C672 35.5 768 17.75 864 26.625C960 35.5 1056 71 1152 80C1248 89 1344 71 1392 62.125L1440 53.25V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V0Z" fill="white"/>
            </svg>
          </div>
        </div>
        
        {/* Filtering options */}
        <div className="bg-white py-8 border-b border-neutral-100">
          <div className="container">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center">
                <Filter size={18} className="text-diplomatic-500 mr-2" />
                <span className="text-sm font-medium text-neutral-700">Filter by:</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => filterEvents('general')}
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    filter === 'general' 
                      ? "bg-blue-500 text-white" 
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  )}
                >
                  General Sessions
                </button>
                <button 
                  onClick={() => filterEvents('committee')}
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    filter === 'committee' 
                      ? "bg-diplomatic-600 text-white" 
                      : "bg-diplomatic-50 text-diplomatic-700 hover:bg-diplomatic-100"
                  )}
                >
                  Committee Work
                </button>
                <button 
                  onClick={() => filterEvents('social')}
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    filter === 'social' 
                      ? "bg-gold-500 text-white" 
                      : "bg-gold-50 text-gold-700 hover:bg-gold-100"
                  )}
                >
                  Social Events
                </button>
                <button 
                  onClick={() => filterEvents('workshop')}
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    filter === 'workshop' 
                      ? "bg-green-500 text-white" 
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  )}
                >
                  Workshops
                </button>
                {filter && (
                  <button 
                    onClick={() => setFilter(null)}
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Schedule content */}
        <section className="py-16 bg-neutral-50">
          <div className="container">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-4xl mx-auto"
            >
              {scheduleData.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-diplomatic-300 mb-4" />
                  <h3 className="text-xl font-semibold text-diplomatic-900 mb-2">No Schedule Available</h3>
                  <p className="text-diplomatic-600">
                    The conference schedule will be available soon. Check back later for updates!
                  </p>
                </div>
              ) : (
                scheduleData.map((day, dayIndex) => (
                  <motion.div 
                    key={dayIndex}
                    variants={itemVariants}
                    className="mb-10"
                  >
                    <div 
                      className={cn(
                        "bg-white rounded-xl shadow-subtle border border-neutral-100 overflow-hidden transition-all duration-300",
                        expandedDay === dayIndex ? "ring-2 ring-diplomatic-300 ring-opacity-50" : ""
                      )}
                    >
                      {/* Day header */}
                      <div 
                        className="p-6 flex justify-between items-center cursor-pointer hover:bg-neutral-50 transition-colors"
                        onClick={() => toggleDay(dayIndex)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-diplomatic-600 text-white flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium">DAY</span>
                            <span className="text-xl font-bold">{dayIndex + 1}</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-diplomatic-900">{day.day}</h3>
                            <div className="flex items-center text-neutral-500 text-sm mt-1">
                              <Calendar size={14} className="mr-1" />

                              {day.date.replace('July 18, 2025', 'July 19, 2025')}

                              {day.date}
 79c96343516f65ed4e8579dcc53ea0467cebd154
                            </div>
                          </div>
                        </div>
                        <div className="text-diplomatic-500">
                          {expandedDay === dayIndex ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                        </div>
                      </div>
                      
                      {/* Day events */}
                      {(expandedDay === dayIndex || expandedDay === null) && (
                        <div className="border-t border-neutral-100">
                          {day.events
                            .filter(event => !filter || event.category === filter)
                            .map((event, eventIndex) => {
                              const eventId = `${dayIndex}-${eventIndex}`;
                              
                              return (
                                <div key={eventIndex} className="border-b border-neutral-100 last:border-b-0">
                                  <div 
                                    className={cn(
                                      "px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:bg-neutral-50 transition-colors",
                                      event.category ? `hover:${categoryConfig[event.category].background}` : ""
                                    )}
                                    onClick={() => toggleEvent(eventId)}
                                  >
                                    <div className="flex items-start gap-3">
                                      {/* Time */}
                                      <div className="flex items-center gap-1 text-sm text-neutral-500 min-w-[120px]">
                                        <Clock size={14} className="flex-shrink-0" />
                                        <span>{event.time}</span>
                                      </div>
                                      
                                      {/* Title and location */}
                                      <div>
                                        <h4 className="text-base font-semibold">{event.title}</h4>
                                        {event.location && (
                                          <div className="flex items-center text-sm text-neutral-500 mt-1">
                                            <MapPin size={14} className="mr-1" />
                                            {event.location}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Category tag */}
                                    <div className="flex items-center gap-2">
                                      {event.isMandatory && (
                                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                          Mandatory
                                        </span>
                                      )}
                                      {event.category && (
                                        <span 
                                          className={cn(
                                            "px-3 py-1 text-xs font-medium rounded-full",
                                            categoryConfig[event.category].color,
                                            "text-white"
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
                                          "text-neutral-400 transition-transform duration-200",
                                          expandedEvent === eventId ? "rotate-180" : ""
                                        )} 
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Event details */}
                                  {expandedEvent === eventId && event.description && (
                                    <div className={cn(
                                      "px-4 py-3 border-t border-neutral-100",
                                      event.category ? categoryConfig[event.category].background : "bg-neutral-50"
                                    )}>
                                      <p className="text-sm text-neutral-700">{event.description}</p>
                                      {event.speakers && event.speakers.length > 0 && (
                                        <div className="mt-2">
                                          <span className="text-xs font-medium text-neutral-500">Speakers: </span>
                                          <span className="text-xs text-neutral-600">{event.speakers.join(', ')}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          
                          {day.events.filter(event => !filter || event.category === filter).length === 0 && (
                            <div className="text-center py-8">
                              <p className="text-neutral-500">No events match the selected filter. <button onClick={() => setFilter(null)} className="text-diplomatic-600 hover:underline">View all events</button></p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
            
            {/* Print and download options */}
            {scheduleData.length > 0 && (
              <div className="flex justify-center mt-12">
                <button className="btn-secondary mx-2">
                  Download PDF Schedule
                </button>
                <button className="btn-secondary mx-2">
                  Add to Calendar
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Schedule;
