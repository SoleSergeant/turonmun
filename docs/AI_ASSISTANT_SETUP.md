# 🤖 AI Assistant Setup Guide

The TuronMUN website now includes a beautiful AI assistant chatbot that appears on every page, replacing the yellow spark button.

## ✨ Features

- **Beautiful Design**: Modern, gradient-based UI with smooth animations
- **Smart Responses**: Context-aware responses about MUN procedures, registration, committees, etc.
- **Global Access**: Available on every page of the website
- **Interactive Actions**: Copy messages, like/dislike responses
- **Typing Indicators**: Realistic typing animation during responses
- **Minimize/Maximize**: Can be minimized to stay out of the way
- **Mobile Responsive**: Works perfectly on all devices

## 🚀 Quick Setup

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-...`)

### 2. Add API Key to Environment

Create or update your `.env` file:

```env
# Add your OpenAI API key
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. Restart Development Server

```bash
npm run dev
```

## 🎯 How It Works

### Development Mode
- Uses **demo responses** (no API key required)
- Provides intelligent responses based on keyword matching
- Covers common MUN topics like registration, committees, position papers, etc.

### Production Mode
- Uses **OpenAI GPT-3.5-turbo** for real AI responses
- Context-aware about TuronMUN conference details
- Handles complex questions about MUN procedures

## 🎨 Design Features

### Chat Button
- **Location**: Bottom-right corner (replaces yellow spark)
- **Appearance**: Gold gradient with MessageCircle icon
- **Indicator**: Green pulsing dot when active
- **Hover**: Shows "AI Assistant" tooltip

### Chat Window
- **Size**: 96×600 pixels (minimized: 320×56 pixels)
- **Header**: Gold gradient with bot icon and status
- **Messages**: Clean chat interface with timestamps
- **Input**: Rounded input with send button
- **Footer**: "Powered by AI" with sparkle icon

### Message Types
- **User Messages**: Gold gradient, right-aligned
- **AI Messages**: White background, left-aligned with bot icon
- **Actions**: Copy, like, dislike buttons for AI messages

## 📱 Responsive Behavior

- **Desktop**: Full chat window (96×600px)
- **Mobile**: Adjusts to screen size, still fully functional
- **Tablet**: Optimized for touch interactions

## 🔧 Customization

### Update AI Responses
Edit `src/services/aiService.ts` to modify demo responses:

```typescript
private getDemoResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Add your custom responses here
  if (lowerMessage.includes('your-keyword')) {
    return 'Your custom response here';
  }
  
  // ... existing responses
}
```

### Change Colors
Update the CSS classes in `AIAssistant.tsx`:
- Change `from-gold-400 to-gold-600` to your preferred gradient
- Update `shadow-glow` for different shadow effects

### Modify Behavior
- **Response Time**: Adjust delays in typing animation
- **Message History**: Change initial greeting message
- **Window Size**: Modify `w-96 h-[600px]` classes

## 🚨 Important Notes

### Security
- **Development**: API key is exposed (acceptable for development)
- **Production**: Use backend service to hide API key
- **Rate Limits**: OpenAI has usage limits and costs

### Performance
- **Demo Mode**: Instant responses, no external calls
- **AI Mode**: Depends on OpenAI API response time
- **Caching**: Consider implementing response caching

### Accessibility
- **Keyboard**: Full keyboard navigation support
- **Screen Reader**: Semantic HTML structure
- **Focus Management**: Proper focus handling

## 🔄 Future Enhancements

### Backend Integration
For production, consider implementing:
- Next.js API routes
- Serverless functions
- Response caching
- Rate limiting

### Advanced Features
- Voice input/output
- File attachments
- Multi-language support
- Conversation history persistence

## 🐛 Troubleshooting

### Common Issues

**API Key Not Working**
- Verify key starts with `sk-`
- Check `.env` file spelling
- Restart development server
- Check OpenAI account credits

**Chat Not Appearing**
- Verify import in `App.tsx`
- Check for console errors
- Ensure component is properly exported

**Responses Not Working**
- Check browser console for errors
- Verify network connectivity
- Test with different questions

### Debug Mode
Add console logging to debug:

```typescript
// In aiService.ts
console.log('API Key exists:', !!this.apiKey);
console.log('Development mode:', import.meta.env.DEV);
```

## 📞 Support

For issues with the AI assistant:
1. Check this guide first
2. Review browser console errors
3. Test in development mode
4. Contact development team

---

**The AI Assistant is now ready to help your TuronMUN visitors! 🎉**
