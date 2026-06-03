import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Send, 
  Lightbulb, 
  BookOpen, 
  Globe, 
  FileText,
  MessageSquare,
  Sparkles,
  Clock,
  User,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw
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

export default function AIAssistant() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your MUN AI Assistant. I can help you with research, position papers, country stances, committee procedures, and more. What would you like to know?",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const quickPrompts = [
    {
      icon: Globe,
      title: "Country Research",
      prompt: "What is the United Kingdom's stance on climate change policies?",
      category: "Research"
    },
    {
      icon: FileText,
      title: "Position Paper Help",
      prompt: "Help me structure a position paper for ECOSOC on sustainable development",
      category: "Writing"
    },
    {
      icon: BookOpen,
      title: "Committee Procedures",
      prompt: "Explain the rules of procedure for formal debate in ECOSOC",
      category: "Procedures"
    },
    {
      icon: Lightbulb,
      title: "Resolution Writing",
      prompt: "How do I write an effective operative clause for a UN resolution?",
      category: "Writing"
    }
  ];

  const chatSessions = [
    { id: 1, title: "UK Climate Policy Research", lastMessage: "2 hours ago", active: true },
    { id: 2, title: "ECOSOC Position Paper", lastMessage: "Yesterday", active: false },
    { id: 3, title: "Resolution Writing Tips", lastMessage: "2 days ago", active: false }
  ];

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: chatHistory.length + 1,
      type: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: chatHistory.length + 2,
        type: 'ai',
        content: generateMockResponse(message),
        timestamp: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const generateMockResponse = (userMessage: string) => {
    const responses = [
      "Based on your question about MUN procedures, here's what you need to know:\n\n1. **Formal Debate Structure**: Speakers are recognized by the chair and have a set time limit\n2. **Points and Motions**: You can raise points of information, personal privilege, or order\n3. **Voting Procedures**: Simple majority unless specified otherwise\n\nWould you like me to elaborate on any of these points?",
      
      "For your position paper on this topic, I recommend structuring it as follows:\n\n**Introduction**: Brief overview of your country's position\n**Body Paragraph 1**: Address the first committee topic\n**Body Paragraph 2**: Address the second committee topic\n**Conclusion**: Summarize key points and proposed solutions\n\nRemember to include at least 3 credible sources and maintain your country's official stance throughout.",
      
      "Here's some key information about the United Kingdom's position:\n\n• **Climate Commitments**: Net-zero emissions by 2050\n• **International Cooperation**: Strong supporter of Paris Agreement\n• **Green Finance**: Leading in climate finance initiatives\n• **Energy Transition**: Investing heavily in renewable energy\n\nThis should help inform your country's position in committee debates."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleQuickPrompt = (prompt: string) => {
    setMessage(prompt);
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
          AI Assistant
        </h1>
        <p className="text-white/70">
          Get intelligent help with research, writing, and MUN procedures
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Chat Sessions Sidebar */}
        <motion.div variants={itemVariants} className="lg:col-span-1 glass-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Chat Sessions</h3>
            <motion.button
              className="p-2 glass-panel text-white hover:bg-white/20 transition-colors rounded-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MessageSquare className="h-4 w-4" />
            </motion.button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            {chatSessions.map((session) => (
              <motion.div
                key={session.id}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  session.active
                    ? 'bg-gold-400/20 border border-gold-400/30'
                    : 'glass-panel hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <p className="text-white text-sm font-medium truncate mb-1">{session.title}</p>
                <p className="text-white/50 text-xs">{session.lastMessage}</p>
              </motion.div>
            ))}
          </div>

          <motion.button
            className="w-full bg-gold-500 hover:bg-gold-600 text-white py-2 rounded-lg font-medium transition-colors mt-4"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            New Chat Session
          </motion.button>
        </motion.div>

        {/* Main Chat Area */}
        <motion.div variants={itemVariants} className="lg:col-span-3 glass-card p-6 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-white/10">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">MUN AI Assistant</h3>
              <p className="text-white/60 text-sm">Powered by advanced AI • Always available</p>
            </div>
            <div className="ml-auto flex items-center space-x-2">
              <motion.button
                className="p-2 glass-panel text-white hover:bg-white/20 transition-colors rounded-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <RotateCcw className="h-4 w-4" />
              </motion.button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-6">
            {chatHistory.map((msg) => (
              <motion.div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`max-w-[80%] ${msg.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start space-x-3 ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.type === 'user' 
                        ? 'bg-gradient-to-br from-gold-400 to-gold-500' 
                        : 'bg-gradient-to-br from-purple-400 to-purple-500'
                    }`}>
                      {msg.type === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    
                    <div className={`glass-panel p-4 rounded-lg ${
                      msg.type === 'user' 
                        ? 'bg-gold-400/20 border-gold-400/30' 
                        : 'bg-white/5'
                    }`}>
                      <pre className="whitespace-pre-wrap text-white text-sm font-sans leading-relaxed">
                        {msg.content}
                      </pre>
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                        <span className="text-xs text-white/50">{msg.timestamp}</span>
                        {msg.type === 'ai' && (
                          <div className="flex items-center space-x-2">
                            <motion.button
                              className="p-1 text-white/50 hover:text-white transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Copy className="h-3 w-3" />
                            </motion.button>
                            <motion.button
                              className="p-1 text-white/50 hover:text-green-400 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </motion.button>
                            <motion.button
                              className="p-1 text-white/50 hover:text-red-400 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="glass-panel p-4 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Quick Prompts */}
          {chatHistory.length === 1 && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-white/70 text-sm mb-3">Quick prompts to get started:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickPrompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleQuickPrompt(prompt.prompt)}
                    className="glass-panel p-3 text-left hover:bg-white/10 transition-colors rounded-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gold-400/20 text-gold-400 rounded-lg flex items-center justify-center flex-shrink-0">
                        <prompt.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm mb-1">{prompt.title}</p>
                        <p className="text-white/60 text-xs line-clamp-2">{prompt.prompt}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-white/10 text-white/70 rounded-full text-xs">
                          {prompt.category}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Message Input */}
          <div className="border-t border-white/10 pt-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about MUN, research, or writing..."
                className="flex-1 glass-panel px-4 py-3 text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
              />
              <motion.button
                onClick={handleSendMessage}
                disabled={!message.trim() || isTyping}
                className="bg-gold-500 hover:bg-gold-600 disabled:bg-white/20 disabled:text-white/50 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                whileHover={{ scale: message.trim() ? 1.02 : 1 }}
                whileTap={{ scale: message.trim() ? 0.98 : 1 }}
              >
                {isTyping ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>Send</span>
              </motion.button>
            </div>
            
            <p className="text-xs text-white/40 mt-2 text-center">
              AI responses are generated for demonstration. Always verify information from official sources.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
