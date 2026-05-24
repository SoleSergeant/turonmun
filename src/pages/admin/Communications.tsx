import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Send, 
  Mail, 
  MessageSquare, 
  Users, 
  Globe, 
  Calendar,
  Bell,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  FileText
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'registration' | 'acceptance' | 'assignment' | 'payment' | 'reminder' | 'custom';
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  target_audience: 'all' | 'delegates' | 'chairs' | 'schools' | 'specific';
  priority: 'low' | 'medium' | 'high';
  sent_at?: string;
  status: 'draft' | 'scheduled' | 'sent';
  recipients_count?: number;
}

const Communications = () => {
  const [activeTab, setActiveTab] = useState('compose');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [emailData, setEmailData] = useState({
    to: 'all',
    subject: '',
    content: '',
    template: ''
  });

  const [templates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Registration Confirmation',
      subject: 'Welcome to TuronMUN Season 6!',
      content: 'Dear {name}, thank you for registering for TuronMUN Season 6...',
      type: 'registration',
      created_at: '2024-01-15'
    },
    {
      id: '2',
      name: 'Application Accepted',
      subject: 'Congratulations! Your application has been accepted',
      content: 'Dear {name}, we are pleased to inform you that your application...',
      type: 'acceptance',
      created_at: '2024-01-20'
    },
    {
      id: '3',
      name: 'Committee Assignment',
      subject: 'Your Committee Assignment - {committee}',
      content: 'Dear {name}, you have been assigned to {committee} representing {country}...',
      type: 'assignment',
      created_at: '2024-02-01'
    }
  ]);

  const [announcements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'Registration Deadline Extended',
      content: 'We are pleased to announce that the registration deadline has been extended to March 1st...',
      target_audience: 'all',
      priority: 'high',
      status: 'sent',
      sent_at: '2024-02-15',
      recipients_count: 247
    },
    {
      id: '2',
      title: 'Position Paper Guidelines Updated',
      content: 'Please note that the position paper guidelines have been updated...',
      target_audience: 'delegates',
      priority: 'medium',
      status: 'sent',
      sent_at: '2024-02-10',
      recipients_count: 156
    },
    {
      id: '3',
      title: 'Chair Training Session',
      content: 'All committee chairs are invited to attend the mandatory training session...',
      target_audience: 'chairs',
      priority: 'high',
      status: 'draft'
    }
  ]);

  const recipientOptions = [
    { value: 'all', label: 'All Users', count: 247 },
    { value: 'delegates', label: 'All Delegates', count: 189 },
    { value: 'accepted', label: 'Accepted Delegates', count: 156 },
    { value: 'pending', label: 'Pending Applications', count: 33 },
    { value: 'chairs', label: 'Committee Chairs', count: 12 },
    { value: 'schools', label: 'School Advisors', count: 45 },
    { value: 'ecosoc', label: 'ECOSOC Committee', count: 32 },
    { value: 'security', label: 'Security Council', count: 15 }
  ];

  const handleSendEmail = () => {
    console.log('Sending email:', emailData);
    // Mock send functionality
    alert('Email sent successfully!');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout title="Communications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Communications</h2>
            <p className="text-gray-600">Send emails and manage announcements</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'compose', name: 'Compose Email', icon: Mail },
              { id: 'announcements', name: 'Announcements', icon: Bell },
              { id: 'templates', name: 'Templates', icon: FileText },
              { id: 'history', name: 'Send History', icon: Calendar }
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

        {/* Compose Email Tab */}
        {activeTab === 'compose' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Compose New Email</h3>
            
            <div className="space-y-6">
              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
                <select
                  value={emailData.to}
                  onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {recipientOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.count} recipients)
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Use Template (Optional)</label>
                <div className="flex gap-3">
                  <select
                    value={emailData.template}
                    onChange={(e) => {
                      const template = templates.find(t => t.id === e.target.value);
                      if (template) {
                        setEmailData(prev => ({
                          ...prev,
                          template: e.target.value,
                          subject: template.subject,
                          content: template.content
                        }));
                      } else {
                        setEmailData(prev => ({ ...prev, template: '', subject: '', content: '' }));
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Manage Templates
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email subject"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
                <textarea
                  value={emailData.content}
                  onChange={(e) => setEmailData(prev => ({ ...prev, content: e.target.value }))}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your message content here..."
                />
                <p className="text-sm text-gray-500 mt-2">
                  Use variables: {'{name}'}, {'{committee}'}, {'{country}'}, {'{school}'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSendEmail}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Send Now
                </button>
                <button className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  <Calendar className="h-4 w-4" />
                  Schedule Send
                </button>
                <button className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">
                  Save Draft
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Dashboard Announcements</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4" />
                New Announcement
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Announcement
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Audience
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {announcements.map((announcement) => (
                      <tr key={announcement.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{announcement.title}</div>
                            <div className="text-sm text-gray-500 line-clamp-2">{announcement.content}</div>
                            {announcement.sent_at && (
                              <div className="text-xs text-gray-400 mt-1">Sent: {announcement.sent_at}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-900 capitalize">{announcement.target_audience}</span>
                            {announcement.recipients_count && (
                              <span className="text-xs text-gray-500">({announcement.recipients_count})</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(announcement.priority)}`}>
                            {announcement.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(announcement.status)}`}>
                            {announcement.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="View">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="Edit">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-red-600 hover:bg-red-100 rounded" title="Delete">
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
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Email Templates</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4" />
                New Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-500 capitalize">{template.type} template</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Use Template">
                        <Send className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Subject:</p>
                      <p className="text-sm text-gray-900 font-medium">{template.subject}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Content Preview:</p>
                      <p className="text-sm text-gray-700 line-clamp-3">{template.content}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-400">Created: {template.created_at}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Email Send History</h3>
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>Email send history will appear here</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Communications;
