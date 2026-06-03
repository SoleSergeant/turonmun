import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Download, 
  FileText, 
  Users, 
  Globe,
  Calendar,
  Mail,
  CreditCard,
  School
} from 'lucide-react';

const ExportSystem = () => {
  const exportOptions = [
    {
      id: 'delegates',
      title: 'Delegate List',
      description: 'Complete list of all registered delegates with contact information',
      icon: Users,
      format: 'CSV, Excel',
      records: 247,
      lastExported: '2024-02-15'
    },
    {
      id: 'assignments',
      title: 'Committee Assignments',
      description: 'Delegate assignments to committees and countries',
      icon: Globe,
      format: 'CSV, PDF',
      records: 189,
      lastExported: '2024-02-14'
    },
    {
      id: 'schools',
      title: 'School Directory',
      description: 'List of participating schools and advisors',
      icon: School,
      format: 'CSV, Excel',
      records: 45,
      lastExported: '2024-02-10'
    },
    {
      id: 'payments',
      title: 'Payment Records',
      description: 'Payment status and transaction details',
      icon: CreditCard,
      format: 'CSV, Excel',
      records: 247,
      lastExported: '2024-02-12'
    },
    {
      id: 'schedule',
      title: 'Event Schedule',
      description: 'Complete conference schedule and venue information',
      icon: Calendar,
      format: 'PDF, CSV',
      records: 24,
      lastExported: '2024-02-08'
    },
    {
      id: 'communications',
      title: 'Email Lists',
      description: 'Segmented email lists for communications',
      icon: Mail,
      format: 'CSV',
      records: 247,
      lastExported: '2024-02-13'
    },
    {
      id: 'certificates',
      title: 'Certificate Data',
      description: 'Delegate information formatted for certificates',
      icon: FileText,
      format: 'CSV, Excel',
      records: 189,
      lastExported: 'Never'
    },
    {
      id: 'attendance',
      title: 'Attendance Records',
      description: 'Check-in and attendance tracking data',
      icon: Users,
      format: 'CSV, Excel',
      records: 189,
      lastExported: 'Never'
    }
  ];

  const handleExport = (exportId: string, format: string) => {
    console.log(`Exporting ${exportId} as ${format}`);
    // Mock export functionality
    alert(`Exporting ${exportId} as ${format}...`);
  };

  return (
    <AdminLayout title="Export System">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Export System</h2>
          <p className="text-gray-600">Download conference data in various formats</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-semibold text-gray-900">1,247</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Export Types</p>
                <p className="text-2xl font-semibold text-gray-900">{exportOptions.length}</p>
              </div>
              <Download className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Export</p>
                <p className="text-2xl font-semibold text-gray-900">Today</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Formats</p>
                <p className="text-2xl font-semibold text-gray-900">3</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exportOptions.map((option) => (
            <div key={option.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <option.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{option.title}</h3>
                    <p className="text-sm text-gray-500">{option.records} records</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{option.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Formats:</span>
                  <span className="text-gray-900">{option.format}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Last exported:</span>
                  <span className="text-gray-900">{option.lastExported}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  {option.format.includes('CSV') && (
                    <button
                      onClick={() => handleExport(option.id, 'CSV')}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Download className="h-4 w-4 inline mr-1" />
                      CSV
                    </button>
                  )}
                  {option.format.includes('Excel') && (
                    <button
                      onClick={() => handleExport(option.id, 'Excel')}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Download className="h-4 w-4 inline mr-1" />
                      Excel
                    </button>
                  )}
                  {option.format.includes('PDF') && (
                    <button
                      onClick={() => handleExport(option.id, 'PDF')}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <Download className="h-4 w-4 inline mr-1" />
                      PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bulk Export */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Export</h3>
          <p className="text-gray-600 mb-6">Export multiple datasets at once for comprehensive reporting</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Conference Package</h4>
              <p className="text-sm text-gray-600">Complete conference data including delegates, assignments, and schedule</p>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Download className="h-4 w-4 inline mr-2" />
                Download Conference Package
              </button>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Financial Report</h4>
              <p className="text-sm text-gray-600">Payment records, school billing, and financial summary</p>
              <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                <Download className="h-4 w-4 inline mr-2" />
                Download Financial Report
              </button>
            </div>
          </div>
        </div>

        {/* Export History */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Exports</h3>
          <div className="space-y-3">
            {[
              { file: 'delegate_list_2024-02-15.csv', type: 'Delegate List', date: '2024-02-15 14:30', size: '2.3 MB' },
              { file: 'committee_assignments_2024-02-14.pdf', type: 'Assignments', date: '2024-02-14 09:15', size: '1.8 MB' },
              { file: 'payment_records_2024-02-12.xlsx', type: 'Payments', date: '2024-02-12 16:45', size: '3.1 MB' }
            ].map((export_, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{export_.file}</p>
                    <p className="text-xs text-gray-500">{export_.type} • {export_.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">{export_.size}</span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    Re-download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ExportSystem;
