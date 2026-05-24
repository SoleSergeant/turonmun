import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { PlusCircle, Edit, Trash2, Clock, Calendar, MapPin } from 'lucide-react';
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
  capacity: number | null;
  registered_count: number | null;
  created_at: string | null;
  updated_at: string | null;
}

const AdminSchedule = () => {
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
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
        .order('event_date', { ascending: true });

      if (error) throw error;

      setScheduleEvents(events || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast({
        title: "Error",
        description: "Failed to load schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setEditingEvent(prev => prev ? {
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    } : null);
  };

  const handleCreateEvent = () => {
    const newEvent: ScheduleEvent = {
      id: '',
      title: '',
      description: '',
      event_date: '',
      start_time: '',
      end_time: '',
      location: '',
      event_type: 'session',
      committee_id: null,
      is_mandatory: true,
      capacity: null,
      registered_count: 0,
      created_at: null,
      updated_at: null,
    };
    setEditingEvent(newEvent);
  };

  const handleEditEvent = (event: ScheduleEvent) => {
    setEditingEvent(event);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('schedule_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setScheduleEvents(prev => prev.filter(event => event.id !== id));

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingEvent) return;

    try {
      setIsSubmittingEvent(true);

      if (editingEvent.id) {
        // Update
        const { error } = await supabase
          .from('schedule_events')
          .update({
            title: editingEvent.title,
            description: editingEvent.description,
            event_date: editingEvent.event_date,
            start_time: editingEvent.start_time,
            end_time: editingEvent.end_time,
            location: editingEvent.location,
            event_type: editingEvent.event_type,
            committee_id: editingEvent.committee_id,
            is_mandatory: editingEvent.is_mandatory,
            capacity: editingEvent.capacity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingEvent.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Event updated successfully",
        });
      } else {
        // Create
        const { error } = await supabase
          .from('schedule_events')
          .insert({
            title: editingEvent.title,
            description: editingEvent.description,
            event_date: editingEvent.event_date,
            start_time: editingEvent.start_time,
            end_time: editingEvent.end_time,
            location: editingEvent.location,
            event_type: editingEvent.event_type,
            committee_id: editingEvent.committee_id,
            is_mandatory: editingEvent.is_mandatory,
            capacity: editingEvent.capacity,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Event created successfully",
        });
      }

      setEditingEvent(null);
      fetchSchedule();
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  // Group events by date
  const groupedEvents = scheduleEvents.reduce((acc, event) => {
    const date = event.event_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, ScheduleEvent[]>);

  return (
    <AdminLayout title="Schedule Management">
      {loading && !editingEvent ? (
        <div className="flex items-center justify-center h-64">
          <div className="loader w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : editingEvent ? (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-6">
            {editingEvent.id ? 'Edit Event' : 'Create Event'}
          </h2>

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="event_date"
                  value={editingEvent.event_date}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (optional)</label>
                <input
                  type="number"
                  name="capacity"
                  value={editingEvent.capacity || ''}
                  onChange={handleEventChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="Max participants"
                />
              </div>

              <div className="flex items-center">
                <Checkbox
                  id="is_mandatory"
                  checked={editingEvent.is_mandatory || false}
                  onCheckedChange={(checked) => {
                    setEditingEvent(prev => prev ? {
                      ...prev,
                      is_mandatory: checked === true
                    } : null);
                  }}
                />
                <label htmlFor="is_mandatory" className="ml-2 text-sm text-gray-700 cursor-pointer">Mandatory Event</label>
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
                placeholder="Event description..."
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
                {isSubmittingEvent ? 'Saving...' : editingEvent.id ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Schedule Events</h2>
            <button
              onClick={handleCreateEvent}
              className="btn bg-diplomatic-700 text-white py-2 px-4 rounded-md hover:bg-diplomatic-800 flex items-center"
            >
              <PlusCircle size={18} className="mr-2" /> Add Event
            </button>
          </div>

          {scheduleEvents.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <p className="text-gray-500 mb-4">No events found</p>
              <button
                onClick={handleCreateEvent}
                className="text-diplomatic-600 hover:text-diplomatic-800 font-medium"
              >
                Create your first event
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEvents).map(([date, events]) => (
                <div key={date} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-diplomatic-50 p-4">
                    <div className="flex items-center">
                      <Calendar size={18} className="text-diplomatic-600 mr-2" />
                      <h3 className="text-lg font-semibold">{new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</h3>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {events.map((event) => (
                      <div key={event.id} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex">
                            <div className="bg-diplomatic-100 rounded-full p-2 mr-3">
                              <Clock size={16} className="text-diplomatic-700" />
                            </div>
                            <div>
                              <div className="flex items-center">
                                <span className="font-medium text-diplomatic-800">
                                  {event.start_time} - {event.end_time}
                                </span>
                                {event.location && (
                                  <>
                                    <span className="mx-2 text-gray-400">•</span>
                                    <div className="flex items-center">
                                      <MapPin size={14} className="text-gray-400 mr-1" />
                                      <span className="text-gray-500">{event.location}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                              <h4 className="mt-1 font-semibold">{event.title}</h4>
                              {event.description && (
                                <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                              )}
                              <div className="flex items-center mt-2 space-x-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${event.event_type === 'ceremony' ? 'bg-gold-100 text-gold-800' :
                                  event.event_type === 'session' ? 'bg-diplomatic-100 text-diplomatic-800' :
                                    event.event_type === 'social' ? 'bg-green-100 text-green-800' :
                                      event.event_type === 'meal' ? 'bg-orange-100 text-orange-800' :
                                        'bg-gray-100 text-gray-800'
                                  }`}>
                                  {event.event_type}
                                </span>
                                {event.is_mandatory && (
                                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                    Mandatory
                                  </span>
                                )}
                                {event.capacity && (
                                  <span className="text-xs text-gray-500">
                                    Capacity: {event.registered_count || 0}/{event.capacity}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="mr-2 p-2 rounded-md text-diplomatic-600 hover:bg-diplomatic-50"
                              title="Edit Event"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-2 rounded-md text-red-600 hover:bg-red-50"
                              title="Delete Event"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default AdminSchedule;
