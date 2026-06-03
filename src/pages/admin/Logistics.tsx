import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Plus,
  Edit,
  Trash2,
  Upload,
  QrCode,
  CheckCircle
} from 'lucide-react';

const Logistics = () => {
  const [activeTab, setActiveTab] = useState('schedule');

  const mockSchedule = [
    { id: '1', time: '09:00 - 09:30', event: 'Registration & Check-in', venue: 'Main Lobby', type: 'general' },
    { id: '2', time: '09:30 - 10:00', event: 'Opening Ceremony', venue: 'Auditorium', type: 'ceremony' },
    { id: '3', time: '10:00 - 12:00', event: 'Committee Session I', venue: 'Various Rooms', type: 'session' },
    { id: '4', time: '12:00 - 13:00', event: 'Lunch Break', venue: 'Cafeteria', type: 'break' },
    { id: '5', time: '13:00 - 15:00', event: 'Committee Session II', venue: 'Various Rooms', type: 'session' }
  ];

  const mockVenues = [
    { id: '1', name: 'Auditorium', capacity: 300, equipment: 'Projector, Sound System', status: 'available' },
    { id: '2', name: 'Room A', capacity: 50, equipment: 'Whiteboard, Projector', status: 'occupied' },
    { id: '3', name: 'Room B', capacity: 40, equipment: 'Whiteboard', status: 'available' },
    { id: '4', name: 'Cafeteria', capacity: 200, equipment: 'Tables, Chairs', status: 'available' }
  ];

  return (
    <AdminLayout title="Event Logistics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Event Logistics</h2>
            <p className="text-gray-600">Manage schedule, venues, and attendance</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'schedule', name: 'Schedule', icon: Calendar },
              { id: 'venues', name: 'Venues', icon: MapPin },
              { id: 'attendance', name: 'Attendance', icon: Users }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Event Schedule</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4" />
                Add Event
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockSchedule.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900">{item.time}</td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{item.event}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{item.venue}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.type === 'ceremony' ? 'bg-purple-100 text-purple-800' :
                          item.type === 'session' ? 'bg-blue-100 text-blue-800' :
                          item.type === 'break' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:bg-red-100 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Venues Tab */}
        {activeTab === 'venues' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Venue Management</h3>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Upload className="h-4 w-4" />
                  Upload Map
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="h-4 w-4" />
                  Add Venue
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockVenues.map((venue) => (
                <div key={venue.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{venue.name}</h4>
                      <p className="text-sm text-gray-500">Capacity: {venue.capacity} people</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      venue.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {venue.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Equipment:</p>
                      <p className="text-sm text-gray-900">{venue.equipment}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2">
                    <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Edit Details
                    </button>
                    <button className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm">
                      View Map
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Attendance Tracking</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <QrCode className="h-4 w-4" />
                Generate QR Codes
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Registered</p>
                    <p className="text-2xl font-semibold text-gray-900">247</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Checked In</p>
                    <p className="text-2xl font-semibold text-green-600">189</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Attendance Rate</p>
                    <p className="text-2xl font-semibold text-purple-600">76%</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Attendance Management</h4>
              <div className="text-center py-8 text-gray-500">
                <QrCode className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>QR code attendance system will be displayed here</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Set Up QR System
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Logistics;
