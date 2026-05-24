import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  FileText,
  Download,
  Search,
  Filter,
  Eye,
  Star,
  Clock,
  Users,
  Tag
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};


export default function Resources() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('resources' as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setResources(data || []);
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const categories = [
    { id: 'all', name: 'All Resources', count: resources.length },
    { id: 'Delegate Guides', name: 'Handbooks', count: resources.filter(r => r.category === 'Delegate Guides').length },
    { id: 'Committee Materials', name: 'Committee Materials', count: resources.filter(r => r.category === 'Committee Materials').length },
    { id: 'Video Tutorials', name: 'Video Tutorials', count: resources.filter(r => r.category === 'Video Tutorials').length },
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch =
      resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredResources = resources.filter(resource => resource.is_public && (resource.category === 'Delegate Guides' || resource.is_featured));

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return '📄';
      case 'doc': return '📝';
      case 'ppt': return '📊';
      default: return '📄';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating) ? 'text-gold-400 fill-current' : 'text-white/30'}`}
      />
    ));
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
          Resources
        </h1>
        <p className="text-white/70">
          Access handbooks, guides, samples, and other helpful materials
        </p>
      </motion.div>

      {/* Search and Filter */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 glass-panel text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-white/70" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="glass-panel px-4 py-2 text-white border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Featured Resources */}
      {selectedCategory === 'all' && (
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-semibold text-white mb-4">Featured Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredResources.map((resource) => (
              <motion.div
                key={resource.id}
                className="glass-card p-4 relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="absolute top-2 right-2">
                  <div className="bg-gold-400/20 text-gold-400 px-2 py-1 rounded-full text-xs font-medium">
                    Featured
                  </div>
                </div>

                <div className="flex items-start space-x-3 mb-3">
                  <div className="text-2xl">{getFileIcon(resource.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm mb-1 truncate">{resource.title}</h3>
                    <p className="text-white/60 text-xs line-clamp-2">{resource.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-white/50 mb-3">
                  <span>{resource.file_type || 'Document'}</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{resource.created_at ? new Date(resource.created_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <a
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gold-500 hover:bg-gold-600 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors text-center flex items-center justify-center"
                  >
                    <Download className="h-3 w-3 inline mr-1" />
                    Open
                  </a>
                  <a
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-panel text-white hover:bg-white/20 py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Eye className="h-3 w-3" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* All Resources */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            {selectedCategory === 'all' ? 'All Resources' : categories.find(c => c.id === selectedCategory)?.name}
          </h2>
          <span className="text-white/60 text-sm">
            {filteredResources.length} resources found
          </span>
        </div>

        <div className="space-y-3">
          {filteredResources.map((resource) => (
            <motion.div
              key={resource.id}
              className="glass-card p-4"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="text-2xl flex-shrink-0">{getFileIcon(resource.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-white font-medium truncate">{resource.title}</h3>
                      {resource.featured && (
                        <span className="bg-gold-400/20 text-gold-400 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm mb-2 line-clamp-1">{resource.description}</p>

                    <div className="flex items-center space-x-4 text-xs text-white/50">
                      <span>{resource.file_type || 'Document'}</span>
                      <div className="flex items-center space-x-1">
                        <Download className="h-3 w-3" />
                        <span>{resource.download_count || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{resource.created_at ? new Date(resource.created_at).toLocaleDateString() : ''}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mt-2">
                      <span className="bg-white/10 text-white/70 px-2 py-0.5 rounded-full text-xs">
                        {resource.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                  <a
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-panel text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                  <a
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gold-500 hover:bg-gold-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center"
                  >
                    <Download className="h-4 w-4 inline mr-1" />
                    Open
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="glass-card p-8 text-center">
            <BookOpen className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No resources found matching your criteria.</p>
            <p className="text-white/40 text-sm mt-1">Try adjusting your search or filter settings.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
