import { useQuery } from '@tanstack/react-query';
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
  // Append T00:00:00 so the date is parsed as local time, not UTC midnight
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const FALLBACK_SCHEDULE: ScheduleDay[] = [
  {
    day: 'Day 1',
    date: 'To Be Announced',
    events: [
      {
        time: '08:00 - 09:30',
        title: 'Registration & Welcome Coffee',
        location: 'Tashkent, Uzbekistan',
        category: 'general',
        description: 'Check in, receive your conference materials, and enjoy refreshments while networking with other delegates.',
      },
      {
        time: '10:00 - 11:30',
        title: 'Opening Ceremony',
        location: 'Tashkent, Uzbekistan',
        category: 'general',
        description: 'Official opening of TuronMUN Season 7 with keynote speeches from distinguished guests and the organising committee.',
      },
    ],
  },
];

async function fetchSchedule(): Promise<ScheduleDay[]> {
  const { data: events, error } = await supabase
    .from('schedule_events')
    .select('*')
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  if (!events || events.length === 0) return FALLBACK_SCHEDULE;

  // Group events by date
  const grouped: Record<string, ScheduleEvent[]> = {};
  events.forEach((event) => {
    if (!grouped[event.event_date]) grouped[event.event_date] = [];
    grouped[event.event_date].push(event);
  });

  return Object.keys(grouped)
    .sort()
    .map((date, index) => ({
      day: `Day ${index + 1}`,
      date: formatDate(date),
      events: grouped[date].map((event) => ({
        time: `${event.start_time} - ${event.end_time}`,
        title: event.title,
        location: event.location || undefined,
        description: event.description || undefined,
        category: eventTypeToCategory(event.event_type),
        eventType: event.event_type || undefined,
        isMandatory: event.is_mandatory || undefined,
      })),
    }));
}

export const useSchedule = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['schedule'],
    queryFn: fetchSchedule,
    staleTime: 5 * 60 * 1000,   // treat data as fresh for 5 minutes
    gcTime: 10 * 60 * 1000,     // keep in cache for 10 minutes
    placeholderData: FALLBACK_SCHEDULE,
    retry: 2,
  });

  return {
    scheduleData: data ?? FALLBACK_SCHEDULE,
    loading: isLoading,
    error: error ? 'Failed to load schedule' : null,
  };
};
