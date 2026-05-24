import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Filter,
  Paperclip,
  MoreVertical,
  Star,
  Archive,
  Trash2,
  Reply,
  Forward,
  User,
  Clock,
  CheckCircle,
  Circle
} from 'lucide-react';

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

export default function Messages() {
  const [selectedMessage, setSelectedMessage] = useState<number | null>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const messages = [
    {
      id: 1,
      from: 'Secretariat Team',
      fromRole: 'secretariat',
      subject: 'Welcome to TuronMUN Season 6!',
      preview: 'We are excited to have you join us for this year\'s conference...',
      content: `Dear Alex,

We are thrilled to welcome you to TuronMUN Season 6! Your application has been successfully processed, and we're excited to have you as part of our delegate community.

Here are some important next steps:
1. Review your committee assignment (ECOSOC)
2. Download the background guide from the Resources section
3. Start working on your position paper (due March 10)
4. Join our delegate WhatsApp group for updates

If you have any questions, don't hesitate to reach out to us.

Best regards,
The TuronMUN Secretariat Team`,
      timestamp: '2024-02-20 09:30',
      read: true,
      starred: false,
      type: 'announcement',
      attachments: []
    },
    {
      id: 2,
      from: 'Dr. Sarah Mitchell',
      fromRole: 'chair',
      subject: 'ECOSOC Committee Background Guide',
      preview: 'Please find attached the background guide for our committee...',
      content: `Dear ECOSOC Delegates,

I hope this message finds you well. Please find attached the comprehensive background guide for our committee sessions.

Key topics we'll be covering:
- Sustainable Development Goals Implementation
- Global Economic Recovery Post-Pandemic

Please review the guide thoroughly and begin your research. Remember that position papers are due on March 10th.

Looking forward to productive debates!

Best regards,
Dr. Sarah Mitchell
ECOSOC Committee Chair`,
      timestamp: '2024-02-18 14:22',
      read: false,
      starred: true,
      type: 'committee',
      attachments: [
        { name: 'ECOSOC_Background_Guide.pdf', size: '2.4 MB' }
      ]
    },
    {
      id: 3,
      from: 'Finance Team',
      fromRole: 'secretariat',
      subject: 'Payment Confirmation - Registration Fee',
      preview: 'Your payment of $150 has been successfully processed...',
      content: `Dear Alex Johnson,

This is to confirm that your registration payment has been successfully processed.

Payment Details:
- Amount: $150 USD
- Transaction ID: TXN-2024-001234
- Payment Date: January 25, 2024
- Payment Method: Credit Card

Your registration is now complete. You will receive your delegate badge and conference materials during check-in.

Thank you for your participation!

Best regards,
TuronMUN Finance Team`,
      timestamp: '2024-01-25 16:45',
      read: true,
      starred: false,
      type: 'system',
      attachments: [
        { name: 'Payment_Receipt.pdf', size: '0.3 MB' }
      ]
    },
    {
      id: 4,
      from: 'James Rodriguez',
      fromRole: 'chair',
      subject: 'Position Paper Guidelines',
      preview: 'Here are the detailed guidelines for writing your position paper...',
      content: `Dear Delegates,

As we approach the position paper deadline, I wanted to share some additional guidelines to help you craft excellent papers.

Format Requirements:
- Maximum 2 pages, single-spaced
- 12pt Times New Roman font
- 1-inch margins on all sides
- Include country header and committee name

Content Guidelines:
- Address both committee topics
- Reflect your country's official positions
- Include at least 3 credible sources
- Propose realistic solutions

Please don't hesitate to reach out if you have questions.

Best of luck!
James Rodriguez
ECOSOC Co-Chair`,
      timestamp: '2024-02-15 11:18',
      read: true,
      starred: false,
      type: 'committee',
      attachments: []
    },
    {
      id: 5,
      from: 'IT Support',
      fromRole: 'secretariat',
      subject: 'Dashboard Access Confirmation',
      preview: 'Your delegate dashboard account has been activated...',
      content: `Dear Alex,

Your TuronMUN delegate dashboard account has been successfully activated!

You can now access:
- Your application status
- Committee information and resources
- Position paper submission portal
- Conference schedule and updates
- Direct messaging with chairs and secretariat

If you experience any technical issues, please contact our IT support team.

Welcome aboard!

TuronMUN IT Support Team`,
      timestamp: '2024-01-20 10:05',
      read: true,
      starred: false,
      type: 'system',
      attachments: []
    }
  ];

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.preview.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !message.read) ||
                         (filter === 'starred' && message.starred) ||
                         (filter === 'committee' && message.type === 'committee') ||
                         (filter === 'system' && message.type === 'system');
    
    return matchesSearch && matchesFilter;
  });

  const selectedMessageData = messages.find(m => m.id === selectedMessage);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'chair': return 'text-purple-400 bg-purple-400/20';
      case 'secretariat': return 'text-blue-400 bg-blue-400/20';
      case 'system': return 'text-green-400 bg-green-400/20';
      default: return 'text-white/70 bg-white/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'committee': return '🏛️';
      case 'system': return '⚙️';
      case 'announcement': return '📢';
      default: return '💬';
    }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
            Messages
          </h1>
          <p className="text-white/70">
            Communicate with chairs, secretariat, and receive important updates
          </p>
        </div>
        <motion.button
          onClick={() => setIsComposing(true)}
          className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Compose Message
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Messages List */}
        <motion.div variants={itemVariants} className="lg:col-span-1 glass-card p-4 flex flex-col">
          {/* Search and Filter */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 glass-panel text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg text-sm"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full glass-panel px-3 py-2 text-white border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg text-sm"
            >
              <option value="all">All Messages</option>
              <option value="unread">Unread</option>
              <option value="starred">Starred</option>
              <option value="committee">Committee</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredMessages.map((message) => (
              <motion.div
                key={message.id}
                onClick={() => setSelectedMessage(message.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedMessage === message.id
                    ? 'bg-gold-400/20 border border-gold-400/30'
                    : 'glass-panel hover:bg-white/10'
                } ${!message.read ? 'border-l-4 border-l-gold-400' : ''}`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="text-sm">{getTypeIcon(message.type)}</div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${!message.read ? 'text-white' : 'text-white/80'}`}>
                        {message.from}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(message.fromRole)}`}>
                        {message.fromRole}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {message.starred && <Star className="h-3 w-3 text-gold-400 fill-current" />}
                    {!message.read ? (
                      <Circle className="h-2 w-2 text-gold-400 fill-current" />
                    ) : (
                      <CheckCircle className="h-3 w-3 text-green-400" />
                    )}
                  </div>
                </div>
                
                <p className={`text-sm mb-1 truncate ${!message.read ? 'text-white font-medium' : 'text-white/70'}`}>
                  {message.subject}
                </p>
                <p className="text-xs text-white/50 truncate mb-2">{message.preview}</p>
                
                <div className="flex items-center justify-between text-xs text-white/40">
                  <span>{message.timestamp}</span>
                  {message.attachments.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Paperclip className="h-3 w-3" />
                      <span>{message.attachments.length}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Message Content */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-6 flex flex-col">
          {selectedMessageData ? (
            <>
              {/* Message Header */}
              <div className="border-b border-white/10 pb-4 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-1">{selectedMessageData.subject}</h2>
                    <div className="flex items-center space-x-3 text-sm text-white/70">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{selectedMessageData.from}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getRoleColor(selectedMessageData.fromRole)}`}>
                          {selectedMessageData.fromRole}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{selectedMessageData.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <motion.button
                      className="p-2 glass-panel text-white hover:bg-white/20 transition-colors rounded-lg"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Star className={`h-4 w-4 ${selectedMessageData.starred ? 'text-gold-400 fill-current' : 'text-white/70'}`} />
                    </motion.button>
                    <motion.button
                      className="p-2 glass-panel text-white hover:bg-white/20 transition-colors rounded-lg"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Attachments */}
                {selectedMessageData.attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-white/70">Attachments:</p>
                    {selectedMessageData.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center space-x-2 glass-panel p-2 rounded-lg">
                        <Paperclip className="h-4 w-4 text-white/70" />
                        <span className="text-sm text-white flex-1">{attachment.name}</span>
                        <span className="text-xs text-white/50">{attachment.size}</span>
                        <motion.button
                          className="text-gold-400 hover:text-gold-300 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          Download
                        </motion.button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 overflow-y-auto mb-4">
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-white/80 font-sans text-sm leading-relaxed">
                    {selectedMessageData.content}
                  </pre>
                </div>
              </div>

              {/* Reply Section */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center space-x-2 mb-3">
                  <motion.button
                    className="flex items-center space-x-2 glass-panel px-3 py-2 text-white hover:bg-white/20 transition-colors rounded-lg text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Reply className="h-4 w-4" />
                    <span>Reply</span>
                  </motion.button>
                  <motion.button
                    className="flex items-center space-x-2 glass-panel px-3 py-2 text-white hover:bg-white/20 transition-colors rounded-lg text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Forward className="h-4 w-4" />
                    <span>Forward</span>
                  </motion.button>
                </div>
                
                <div className="flex space-x-3">
                  <input
                    type="text"
                    placeholder="Type your reply..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 glass-panel px-4 py-2 text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
                  />
                  <motion.button
                    className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded-lg transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Send className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/60">Select a message to read</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
