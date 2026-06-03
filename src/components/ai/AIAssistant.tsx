import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  X,
  Bot,
  User,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { aiService } from '@/services/aiService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI assistant. I can help you with questions about the MUN conference, registration, committees, and more. How can I assist you today?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageId, setMessageId] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: (messageId + 1).toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setMessageId(prev => prev + 1);

    try {
      const response = await aiService.sendMessage(inputValue, 'mun-conference-assistant');

      const assistantMessage: Message = {
        id: (messageId + 2).toString(),
        text: response,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setMessageId(prev => prev + 2);
    } catch (error) {
      console.error('Error getting AI response:', error);

      const fallbackMessage: Message = {
        id: (messageId + 2).toString(),
        text: "I apologize, but I'm having trouble connecting right now. Please try again later or contact admin@turonmun.com for immediate assistance.",
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fallbackMessage]);
      setMessageId(prev => prev + 2);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-glow hover:shadow-glow-lg transition-all duration-300 z-40 group border-2 border-gold-400"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-700 border border-gold-400 flex items-center justify-center overflow-hidden">
          <img
            src="/logos/turonmun-logo.png"
            alt="TuronMUN Logo"
            className="w-6 h-6 md:w-7 md:h-7 object-contain"
          />
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
          TuronMUN AI Assistant
        </div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed inset-x-0 bottom-0 md:bottom-6 md:right-6 md:left-auto bg-white md:rounded-2xl rounded-t-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden w-full md:w-96 h-[calc(100vh-60px)] md:h-[600px] flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 flex items-center justify-between border-b border-gold-400/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-gold-400 flex items-center justify-center overflow-hidden shadow-md">
                  <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center overflow-hidden">
                    <img
                      src="/logos/turonmun-logo.png"
                      alt="TuronMUN Logo"
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold">TuronMUN AI Assistant</h3>
                  <p className="text-white/80 text-xs">Get instant help about TuronMUN and MUN procedures</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors border border-white/10"
                  aria-label="Close assistant"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.sender === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white border border-gold-400/60'
                    : 'bg-white border border-blue-100 text-gray-800'
                    } rounded-2xl px-4 py-3 shadow-sm`}>
                    <div className="flex items-start space-x-2">
                      {message.sender === 'assistant' && (
                        <Bot className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs ${message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                            }`}>
                            {formatTime(message.timestamp)}
                          </span>
                          {message.sender === 'assistant' && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => copyMessage(message.text)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <Copy className="w-3 h-3 text-gray-400" />
                              </button>
                              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                <ThumbsUp className="w-3 h-3 text-blue-500" />
                              </button>
                              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                <ThumbsDown className="w-3 h-3 text-gold-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {message.sender === 'user' && (
                        <User className="w-4 h-4 mt-0.5 text-white/70 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border border-blue-100 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-blue-100">
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about TuronMUN or MUN..."
                  className="flex-1 px-4 py-2 border border-blue-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all border border-gold-400/60"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-center mt-2">
                <Sparkles className="w-3 h-3 text-blue-500 mr-1" />
                <p className="text-xs text-gray-500">TuronMUN AI Assistant · Powered by AI</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
