import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  event_type: string | null;
  is_mandatory: boolean | null;
}

export interface TransformedScheduleEvent {
  time: string;
  title: string;
  location?: string;
  description?: string;
  speakers?: string[];
  category?: 'general' | 'committee' | 'social' | 'workshop';
  eventType?: string;
  isMandatory?: boolean;
}

export interface ScheduleDay {
  day: string;
  date: string;
  events: TransformedScheduleEvent[];
}

const eventTypeToCategory = (eventType: string | null): 'general' | 'committee' | 'social' | 'workshop' => {
  switch (eventType) {
    case 'ceremony': return 'general';
    case 'session': return 'committee';
    case 'social': return 'social';
    case 'break':
    case 'meal': return 'social';
    default: return 'general';
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getDayLabel = (dateString: string, index: number): string => {
  return `Day ${index + 1}`;
};

export const useSchedule = () => {
  const [scheduleData, setScheduleData] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: events, error: fetchError } = await supabase
          .from('schedule_events')
          .select('*')
          .order('event_date', { ascending: true })
          .order('start_time', { ascending: true });

        if (fetchError) throw fetchError;

        // Group events by date and transform them
        const groupedEvents: Record<string, ScheduleEvent[]> = {};
        events?.forEach((event) => {
          const date = event.event_date;
          if (!groupedEvents[date]) {
            groupedEvents[date] = [];
          }
          groupedEvents[date].push(event);
        });

        // Transform grouped events into ScheduleDay format
        const transformedSchedule: ScheduleDay[] = Object.entries(groupedEvents).map(
          ([date, dayEvents], index) => ({
            day: getDayLabel(date, index),
            date: formatDate(date),
            events: dayEvents.map((event) => ({
              time: `${event.start_time} - ${event.end_time}`,
              title: event.title,
              location: event.location || undefined,
              description: event.description || undefined,
              category: eventTypeToCategory(event.event_type),
              eventType: event.event_type || undefined,
              isMandatory: event.is_mandatory || undefined,
            })),
          })
        );

        setScheduleData(transformedSchedule);
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError('Failed to load schedule');

        // Fallback to static data
        const fallbackData: ScheduleDay[] = [
          {
            day: 'Day 1',
            date: 'March 21, 2026',
            events: [
              {
                time: '08:00 - 09:30',
                title: 'Registration & Welcome Coffee',
                location: 'Registan Private School',
                category: 'general',
                description: 'Check in, receive your conference materials, and enjoy refreshments while networking with other delegates.'
              },
              {
                time: '10:00 - 11:30',
                title: 'Opening Ceremony',
                location: 'Registan Private School',
                category: 'general',
                description: 'Official opening of TuronMUN 2026 with keynote speeches from distinguished guests and organizing committee.'
              }
            ]
          }
        ];
        setScheduleData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  return { scheduleData, loading, error };
}; 