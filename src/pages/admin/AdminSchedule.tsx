import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { PlusCircle, Edit, Trash2, Clock, MapPin, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  event_type: string | null;
  committee_id: string | null;
  is_mandatory: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

const typeColors: Record<string, string> = {
  ceremony: 'bg-yellow-100 text-yellow-800',
  session:  'bg-blue-100 text-blue-800',
  social:   'bg-green-100 text-green-800',
  meal:     'bg-orange-100 text-orange-800',
  break:    'bg-gray-100 text-gray-700',
};

const AdminSchedule = () => {
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [conferenceDate, setConferenceDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const { data: events, error } = await supabase
        .from('schedule_events')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;

      const sorted = events || [];
      setScheduleEvents(sorted);

      // Derive conference date from the first event, or keep current
      if (sorted.length > 0) {
        setConferenceDate(sorted[0].event_date);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast({ title: 'Error', description: 'Failed to load schedule', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Update ALL events to the new conference date
  const handleConferenceDateChange = async (newDate: string) => {
    setConferenceDate(newDate);
    if (!newDate || scheduleEvents.length === 0) return;

    try {
      setIsUpdatingDate(true);
      const { error } = await supabase
        .from('schedule_events')
        .update({ event_date: newDate, updated_at: new Date().toISOString() })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // update all rows

      if (error) throw error;

      setScheduleEvents(prev => prev.map(e => ({ ...e, event_date: newDate })));
      toast({ title: 'Date updated', description: 'All events moved to the new date.' });
    } catch (error) {
      console.error('Error updating conference date:', error);
      toast({ title: 'Error', description: 'Failed to update conference date', variant: 'destructive' });
    } finally {
      setIsUpdatingDate(false);
    }
  };

  const handleEventChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditingEvent(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleCreateEvent = () => {
    setEditingEvent({
      id: '',
      title: '',
      description: '',
      event_date: conferenceDate,
      start_time: '',
      end_time: '',
      location: '',
      event_type: 'session',
      committee_id: null,
      is_mandatory: true,
      created_at: null,
      updated_at: null,
    });
  };

  const handleEditEvent = (event: ScheduleEvent) => {
    setEditingEvent(event);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      const { error } = await supabase.from('schedule_events').delete().eq('id', id);
      if (error) throw error;
      setScheduleEvents(prev => prev.filter(e => e.id !== id));
      toast({ title: 'Deleted', description: 'Event removed.' });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({ title: 'Error', description: 'Failed to delete event', variant: 'destructive' });
    }
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      setIsSubmittingEvent(true);

      const payload = {
        title: editingEvent.title,
        description: editingEvent.description || null,
        event_date: conferenceDate || editingEvent.event_date,
        start_time: editingEvent.start_time,
        end_time: editingEvent.end_time,
        location: editingEvent.location || null,
        event_type: editingEvent.event_type,
        committee_id: editingEvent.committee_id,
        is_mandatory: editingEvent.is_mandatory,
        updated_at: new Date().toISOString(),
      };

      if (editingEvent.id) {
        const { error } = await supabase
          .from('schedule_events')
          .update(payload)
          .eq('id', editingEvent.id);
        if (error) throw error;
        toast({ title: 'Updated', description: 'Event updated.' });
      } else {
        const { error } = await supabase
          .from('schedule_events')
          .insert({ ...payload });
        if (error) throw error;
        toast({ title: 'Created', description: 'Event added to schedule.' });
      }

      setEditingEvent(null);
      fetchSchedule();
    } catch (error) {
      console.error('Error saving event:', error);
      toast({ title: 'Error', description: 'Failed to save event', variant: 'destructive' });
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const formattedDate = conferenceDate
    ? new Date(`${conferenceDate}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  return (
    <AdminLayout title="Schedule Management">
      {loading && !editingEvent ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : editingEvent ? (
        /* ── Event form ── */
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-1">
            {editingEvent.id ? 'Edit Event' : 'Add Event'}
          </h2>
          {formattedDate && (
            <p className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
              <Calendar size={14} /> {formattedDate}
            </p>
          )}

          <form onSubmit={handleSubmitEvent} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  name="title"
                  value={editingEvent.title}
                  onChange={handleEventChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g. Opening Ceremony"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  name="event_type"
                  value={editingEvent.event_type || 'session'}
                  onChange={handleEventChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="session">Session</option>
                  <option value="break">Break</option>
                  <option value="meal">Meal</option>
                  <option value="ceremony">Ceremony</option>
                  <option value="social">Social</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  name="start_time"
                  value={editingEvent.start_time}
                  onChange={handleEventChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  name="end_time"
                  value={editingEvent.end_time}
                  onChange={handleEventChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={editingEvent.location || ''}
                  onChange={handleEventChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g. Main Auditorium"
                />
              </div>

              <div className="flex items-center mt-6">
                <Checkbox
                  id="is_mandatory"
                  checked={editingEvent.is_mandatory || false}
                  onCheckedChange={(checked) => {
                    setEditingEvent(prev => prev ? { ...prev, is_mandatory: checked === true } : null);
                  }}
                />
                <label htmlFor="is_mandatory" className="ml-2 text-sm text-gray-700 cursor-pointer">
                  Mandatory for all delegates
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea
                name="description"
                value={editingEvent.description || ''}
                onChange={handleEventChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="Short description of the event…"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isSubmittingEvent}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-diplomatic-700 text-white rounded-md hover:bg-diplomatic-800"
                disabled={isSubmittingEvent}
              >
                {isSubmittingEvent ? 'Saving…' : editingEvent.id ? 'Update Event' : 'Add Event'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ── List view ── */
        <>
          {/* Conference date bar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <Calendar size={18} className="text-diplomatic-600" />
              Conference Date
            </div>
            <div className="flex items-center gap-3 flex-1">
              <input
                type="date"
                value={conferenceDate}
                onChange={e => handleConferenceDateChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                disabled={isUpdatingDate}
              />
              {formattedDate && (
                <span className="text-sm text-gray-500">{formattedDate}</span>
              )}
              {isUpdatingDate && (
                <div className="w-4 h-4 border-2 border-diplomatic-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <button
              onClick={handleCreateEvent}
              className="bg-diplomatic-700 text-white py-2 px-4 rounded-md hover:bg-diplomatic-800 flex items-center text-sm"
            >
              <PlusCircle size={16} className="mr-2" /> Add Event
            </button>
          </div>

          {/* Timeline */}
          {scheduleEvents.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <Clock size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">No events yet</p>
              <button
                onClick={handleCreateEvent}
                className="text-diplomatic-600 hover:text-diplomatic-800 font-medium"
              >
                Add the first event
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-diplomatic-50 px-5 py-3 border-b border-diplomatic-100">
                <p className="text-sm text-diplomatic-700 font-medium">
                  {scheduleEvents.length} event{scheduleEvents.length !== 1 ? 's' : ''} · sorted by start time
                </p>
              </div>

              <div className="divide-y divide-gray-100">
                {scheduleEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 group">
                    {/* Time column */}
                    <div className="w-28 flex-shrink-0 pt-0.5">
                      <div className="flex items-center gap-1 text-diplomatic-700 font-semibold text-sm">
                        <Clock size={13} />
                        {event.start_time}
                      </div>
                      <div className="text-gray-400 text-xs mt-0.5 pl-[17px]">– {event.end_time}</div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          {event.location && (
                            <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                              <MapPin size={11} />
                              {event.location}
                            </div>
                          )}
                          {event.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${typeColors[event.event_type || ''] || 'bg-gray-100 text-gray-700'}`}>
                              {event.event_type || 'other'}
                            </span>
                            {event.is_mandatory && (
                              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                                Mandatory
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleEditEvent(event)}
                            className="p-2 rounded-md text-diplomatic-600 hover:bg-diplomatic-50"
                            title="Edit"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-2 rounded-md text-red-500 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default AdminSchedule;
