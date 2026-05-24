import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare,
  Send,
  Reply,
  Users,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Paperclip,
  Smile,
  MoreVertical
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface MessagingProps {
  committees: any[];
  applications: any[];
  positionPapers: any[];
  loading: boolean;
  assignedDelegates: any[];
  submittedPapers: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function ChairMessaging() {
  const context = useOutletContext<MessagingProps>();
  const { committees, applications, positionPapers, loading, assignedDelegates, submittedPapers } = context || {};
  const [selectedDelegate, setSelectedDelegate] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'replied'>('all');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessageRecipient, setNewMessageRecipient] = useState('');
  const [newMessageText, setNewMessageText] = useState('');

  // Mock conversations data
  const [conversations, setConversations] = useState([
    {
      id: '1',
      delegateId: '1',
      delegateName: 'Alex Johnson',
      delegateEmail: 'alex@example.com',
      lastMessage: 'Thank you for the clarification on the resolution format. I\'ll revise my position paper accordingly.',
      timestamp: '2024-03-15T14:30:00Z',
      unreadCount: 2,
      status: 'unread'
    },
    {
      id: '2',
      delegateId: '2',
      delegateName: 'Sarah Chen',
      delegateEmail: 'sarah@example.com',
      lastMessage: 'Could you please explain the voting procedure for amendment proposals?',
      timestamp: '2024-03-15T13:15:00Z',
      unreadCount: 1,
      status: 'unread'
    },
    {
      id: '3',
      delegateId: '3',
      delegateName: 'Michael Brown',
      delegateEmail: 'michael@example.com',
      lastMessage: 'I\'ve submitted my position paper. Looking forward to your feedback.',
      timestamp: '2024-03-15T11:45:00Z',
      unreadCount: 0,
      status: 'replied'
    }
  ]);

  // Mock messages for selected conversation
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'delegate',
      content: 'Chair, I have a question about the speaking time limits during formal debate.',
      timestamp: '2024-03-15T14:00:00Z'
    },
    {
      id: '2',
      sender: 'chair',
      content: 'Each delegate has 90 seconds for their main speech. Follow-up comments are limited to 30 seconds. Would you like me to clarify the rules of procedure?',
      timestamp: '2024-03-15T14:05:00Z'
    },
    {
      id: '3',
      sender: 'delegate',
      content: 'Thank you for the clarification on the resolution format. I\'ll revise my position paper accordingly.',
      timestamp: '2024-03-15T14:30:00Z'
    }
  ]);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.delegateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || conv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedDelegate) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      // Get admin user record
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (adminError || !adminUser) {
        console.error('User not authorized');
        return;
      }

      // Send message to database
      const { error: insertError } = await supabase
        .from('messages')
        .insert([{
          sender_id: adminUser.id,
          sender_type: 'admin',
          recipient_id: selectedDelegate.delegateId,
          recipient_type: 'delegate',
          content: messageText,
          committee_id: committees[0]?.id // Use first committee for now
        }]);

      if (insertError) {
        console.error('Error sending message:', insertError);
        return;
      }

      const newMessage = {
        id: Date.now().toString(),
        sender: 'chair',
        content: messageText,
        timestamp: new Date().toISOString()
      };

      setMessages([...messages, newMessage]);
      setMessageText('');

      // Update conversation status
      setConversations(conversations.map(conv => 
        conv.id === selectedDelegate.id 
          ? { ...conv, status: 'replied', lastMessage: messageText, timestamp: new Date().toISOString() }
          : conv
      ));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleNewMessage = () => {
    if (!newMessageRecipient || !newMessageText.trim()) return;

    const delegate = applications.find(app => app.id === newMessageRecipient);
    if (!delegate) return;

    const newConv = {
      id: Date.now().toString(),
      delegateId: delegate.id,
      delegateName: delegate.full_name,
      delegateEmail: delegate.email,
      lastMessage: newMessageText,
      timestamp: new Date().toISOString(),
      unreadCount: 0,
      status: 'replied'
    };

    setConversations([newConv, ...conversations]);
    setNewMessageRecipient('');
    setNewMessageText('');
    setShowNewMessage(false);
    
    // Select the new conversation
    setSelectedDelegate(newConv);
    setMessages([
      {
        id: '1',
        sender: 'chair',
        content: newMessageText,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-white/60">Loading messaging...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 glass-panel text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 glass-panel text-white border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
          >
            <option value="all">All Messages</option>
            <option value="unread">Unread</option>
            <option value="replied">Replied</option>
          </select>
          <button
            onClick={() => setShowNewMessage(true)}
            className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 px-4 py-2 text-white transition-colors rounded-lg"
          >
            <MessageSquare className="w-4 h-4" />
            New Message
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-lg font-semibold text-white mb-4">Conversations</h3>
          {filteredConversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              variants={itemVariants}
              onClick={() => {
                setSelectedDelegate(conversation);
                setMessages([
                  {
                    id: '1',
                    sender: 'delegate',
                    content: 'Chair, I have a question about the speaking time limits.',
                    timestamp: conversation.timestamp
                  },
                  {
                    id: '2',
                    sender: 'chair',
                    content: 'Each delegate has 90 seconds for their main speech.',
                    timestamp: conversation.timestamp
                  }
                ]);
              }}
              className={`glass-panel p-4 rounded-lg cursor-pointer transition-all ${
                selectedDelegate?.id === conversation.id 
                  ? 'bg-gold-500/20 border border-gold-400/30' 
                  : 'hover:bg-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-white font-medium">{conversation.delegateName}</h4>
                  <p className="text-xs text-white/60">{conversation.delegateEmail}</p>
                </div>
                {conversation.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-gold-500 text-white text-xs rounded-full flex items-center justify-center">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/80 line-clamp-2 mb-2">{conversation.lastMessage}</p>
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>{formatTimestamp(conversation.timestamp)}</span>
                {conversation.status === 'unread' && (
                  <AlertCircle className="w-3 h-3" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Message View */}
        <div className="lg:col-span-2">
          {selectedDelegate ? (
            <div className="glass-card p-6 h-[600px] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedDelegate.delegateName}</h3>
                  <p className="text-sm text-white/60">{selectedDelegate.delegateEmail}</p>
                </div>
                <button className="p-2 text-white/60 hover:text-white transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'chair' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'chair'
                          ? 'bg-gold-500/20 text-gold-100'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatTimestamp(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex gap-2">
                  <button className="p-2 text-white/60 hover:text-white transition-colors">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 glass-panel text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button className="p-2 text-white/60 hover:text-white transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="p-2 bg-gold-500 hover:bg-gold-600 text-white transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/60">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      <AnimatePresence>
        {showNewMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewMessage(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">New Message</h3>
                <button
                  onClick={() => setShowNewMessage(false)}
                  className="p-2 text-white/60 hover:text-white transition-colors rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Recipient</label>
                  <select
                    value={newMessageRecipient}
                    onChange={(e) => setNewMessageRecipient(e.target.value)}
                    className="w-full px-4 py-3 glass-panel text-white border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
                  >
                    <option value="">Select a delegate...</option>
                    {assignedDelegates.map((delegate) => (
                      <option key={delegate.id} value={delegate.id}>
                        {delegate.full_name} ({delegate.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Message</label>
                  <textarea
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                    className="w-full px-4 py-3 glass-panel text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewMessage(false)}
                  className="flex-1 px-4 py-3 glass-panel text-white hover:bg-white/15 transition-colors rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNewMessage}
                  disabled={!newMessageRecipient || !newMessageText.trim()}
                  className="flex-1 px-4 py-3 bg-gold-500 hover:bg-gold-600 text-white transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Message
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
