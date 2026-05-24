import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Upload, 
  Download, 
  FileText, 
  Trash2, 
  Eye, 
  Edit, 
  Folder,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Globe,
  BookOpen
} from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  description: string;
  file_type: string;
  file_size: number;
  file_url: string;
  category: 'handbook' | 'guide' | 'sample' | 'rules' | 'background' | 'crisis' | 'general';
  committee_id?: string;
  committee_name?: string;
  access_level: 'all' | 'delegates' | 'chairs' | 'secretariat' | 'admin';
  created_by: string;
  created_at: string;
  download_count: number;
}

const ResourceManagement = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Mock data
  useEffect(() => {
    const mockResources: Resource[] = [
      {
        id: '1',
        name: 'Delegate Handbook 2024',
        description: 'Complete guide for first-time and experienced delegates',
        file_type: 'PDF',
        file_size: 3200000, // 3.2MB
        file_url: '/resources/delegate-handbook-2024.pdf',
        category: 'handbook',
        access_level: 'all',
        created_by: 'Admin User',
        created_at: '2024-01-15',
        download_count: 247
      },
      {
        id: '2',
        name: 'ECOSOC Background Guide',
        description: 'Comprehensive background guide for ECOSOC committee',
        file_type: 'PDF',
        file_size: 4100000, // 4.1MB
        file_url: '/resources/ecosoc-background-guide.pdf',
        category: 'background',
        committee_id: 'ecosoc',
        committee_name: 'ECOSOC',
        access_level: 'delegates',
        created_by: 'Dr. Sarah Mitchell',
        created_at: '2024-02-01',
        download_count: 89
      },
      {
        id: '3',
        name: 'Position Paper Writing Guide',
        description: 'Step-by-step guide to writing effective position papers',
        file_type: 'PDF',
        file_size: 1800000, // 1.8MB
        file_url: '/resources/position-paper-guide.pdf',
        category: 'guide',
        access_level: 'all',
        created_by: 'Admin User',
        created_at: '2024-01-20',
        download_count: 156
      },
      {
        id: '4',
        name: 'Sample Resolution Format',
        description: 'Well-formatted resolution example from previous conference',
        file_type: 'DOCX',
        file_size: 900000, // 0.9MB
        file_url: '/resources/sample-resolution.docx',
        category: 'sample',
        access_level: 'delegates',
        created_by: 'James Rodriguez',
        created_at: '2024-02-05',
        download_count: 78
      },
      {
        id: '5',
        name: 'Rules of Procedure',
        description: 'Official rules and procedures for all committees',
        file_type: 'PDF',
        file_size: 2100000, // 2.1MB
        file_url: '/resources/rules-of-procedure.pdf',
        category: 'rules',
        access_level: 'all',
        created_by: 'Admin User',
        created_at: '2024-01-10',
        download_count: 203
      },
      {
        id: '6',
        name: 'Crisis Committee Guidelines',
        description: 'Special guidelines for crisis committee operations',
        file_type: 'PDF',
        file_size: 1500000, // 1.5MB
        file_url: '/resources/crisis-guidelines.pdf',
        category: 'crisis',
        access_level: 'chairs',
        created_by: 'Admin User',
        created_at: '2024-02-10',
        download_count: 34
      }
    ];
    setResources(mockResources);
    setFilteredResources(mockResources);
  }, []);

  // Filter resources
  useEffect(() => {
    let filtered = resources.filter(resource => {
      const matchesSearch = 
        resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.created_by.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;
      const matchesAccess = accessFilter === 'all' || resource.access_level === accessFilter;

      return matchesSearch && matchesCategory && matchesAccess;
    });

    setFilteredResources(filtered);
  }, [resources, searchTerm, categoryFilter, accessFilter]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'ppt':
      case 'pptx': return '📊';
      case 'xls':
      case 'xlsx': return '📈';
      default: return '📄';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'handbook': return 'bg-blue-100 text-blue-800';
      case 'guide': return 'bg-green-100 text-green-800';
      case 'sample': return 'bg-purple-100 text-purple-800';
      case 'rules': return 'bg-red-100 text-red-800';
      case 'background': return 'bg-yellow-100 text-yellow-800';
      case 'crisis': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessColor = (access: string) => {
    switch (access) {
      case 'all': return 'bg-green-100 text-green-800';
      case 'delegates': return 'bg-blue-100 text-blue-800';
      case 'chairs': return 'bg-purple-100 text-purple-800';
      case 'secretariat': return 'bg-orange-100 text-orange-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      setResources(prev => prev.filter(r => r.id !== id));
    }
  };

  const categories = [
    { value: 'handbook', label: 'Handbooks' },
    { value: 'guide', label: 'Guides' },
    { value: 'sample', label: 'Samples' },
    { value: 'rules', label: 'Rules & Procedures' },
    { value: 'background', label: 'Background Guides' },
    { value: 'crisis', label: 'Crisis Documents' },
    { value: 'general', label: 'General' }
  ];

  const accessLevels = [
    { value: 'all', label: 'Everyone' },
    { value: 'delegates', label: 'Delegates Only' },
    { value: 'chairs', label: 'Chairs Only' },
    { value: 'secretariat', label: 'Secretariat Only' },
    { value: 'admin', label: 'Admin Only' }
  ];

  return (
    <AdminLayout title="Resource Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Resource Management</h2>
            <p className="text-gray-600">Upload and manage conference documents and resources</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Upload Resource
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="h-4 w-4" />
              Bulk Download
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Resources</p>
                <p className="text-2xl font-semibold text-gray-900">{resources.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Downloads</p>
                <p className="text-2xl font-semibold text-green-600">
                  {resources.reduce((acc, r) => acc + r.download_count, 0)}
                </p>
              </div>
              <Download className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Storage Used</p>
                <p className="text-2xl font-semibold text-purple-600">
                  {formatFileSize(resources.reduce((acc, r) => acc + r.file_size, 0))}
                </p>
              </div>
              <Folder className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-semibold text-orange-600">
                  {new Set(resources.map(r => r.category)).size}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={accessFilter}
                  onChange={(e) => setAccessFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Access Levels</option>
                  {accessLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getFileIcon(resource.file_type)}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">{resource.name}</h3>
                    <p className="text-sm text-gray-500">{resource.file_type} • {formatFileSize(resource.file_size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{resource.description}</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(resource.category)}`}>
                    {resource.category}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccessColor(resource.access_level)}`}>
                    {resource.access_level}
                  </span>
                </div>

                {resource.committee_name && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Globe className="h-3 w-3" />
                    <span>{resource.committee_name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{resource.created_by}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    <span>{resource.download_count}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="h-3 w-3" />
                  <span>Created {resource.created_at}</span>
                </div>

                <button className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  <Download className="h-4 w-4 inline mr-2" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No resources found matching your criteria.</p>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Resource</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter resource name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {accessLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400">PDF, DOC, DOCX, PPT, PPTX up to 10MB</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Upload Resource
                </button>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ResourceManagement;
