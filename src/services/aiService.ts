import { supabase } from '@/integrations/supabase/client';

interface AIResponse {
  response: string;
}

class AIService {
  constructor() {
    // API logic moved to secure backend (Supabase Edge Functions)
  }

  async sendMessage(message: string, context?: string): Promise<string> {
    try {
      // Call Supabase Edge Function securely instead of frontend API fetch
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { message, context }
      });

      if (error) {
        console.error('Edge Function Error:', error);
        // Fallback to demo response if backend is unavailable
        return this.getDemoResponse(message);
      }

      return data?.reply || this.getDemoResponse(message);
    } catch (error) {
      console.error('AI Service Error:', error);
      return this.getDemoResponse(message);
    }
  }


  private getDemoResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Application related
    if (lowerMessage.includes('apply') || lowerMessage.includes('application') || lowerMessage.includes('sign up')) {
      return 'Applications for TuronMUN Season 7 are not yet open. Follow us on Telegram (@TuronMUN) to be notified the moment applications open. In the meantime, you can explore our past committees and resources to prepare!';
    }

    // Committee related
    if (lowerMessage.includes('committee') || lowerMessage.includes('committees')) {
      return 'TuronMUN offers several committees including UNGA, ECOSOC, HRC, and WTO. Each committee focuses on different global issues. You can express your preferences during application, and assignments are made based on experience and availability.';
    }

    // Position papers
    if (lowerMessage.includes('position paper') || lowerMessage.includes('paper')) {
      return 'Position papers are crucial documents that outline your country\'s stance on committee topics. They should be well-researched, properly formatted, and submitted by the deadline. Guidelines and templates are available in the resources section.';
    }

    // Conference dates
    if (lowerMessage.includes('date') || lowerMessage.includes('when') || lowerMessage.includes('schedule')) {
      return 'TuronMUN Season 7 dates have not been announced yet. Follow us on Telegram (@TuronMUN) to be the first to know when applications and dates are released. A detailed schedule will be published on our website once confirmed.';
    }

    // Venue/location
    if (lowerMessage.includes('venue') || lowerMessage.includes('location') || lowerMessage.includes('where')) {
      return 'The venue for TuronMUN Season 7 has not been confirmed yet. Previous seasons have been held at Registan Private School and other venues in Tashkent, Uzbekistan. We will announce the Season 7 venue on our website and Telegram channel.';
    }

    // Fees/payment
    if (lowerMessage.includes('fee') || lowerMessage.includes('payment') || lowerMessage.includes('cost')) {
      return 'Application fees vary based on delegate status and early bird discounts. Payment can be made online through our secure payment system. Scholarships are available for deserving delegates - check our website for details.';
    }

    // Dress code
    if (lowerMessage.includes('dress') || lowerMessage.includes('attire')) {
      return 'The dress code for TuronMUN is Western business formal. This includes suits for male delegates and business suits or conservative dresses for female delegates. National dress is also welcome during cultural events.';
    }

    // Awards
    if (lowerMessage.includes('award') || lowerMessage.includes('recognition')) {
      return 'TuronMUN recognizes outstanding delegates through various awards including Best Delegate, Outstanding Delegate, Honorable Mention, and Best Position Paper. Awards are based on performance, research, and diplomacy throughout the conference.';
    }

    // Rules/procedure
    if (lowerMessage.includes('rules') || lowerMessage.includes('procedure') || lowerMessage.includes('mrop')) {
      return 'TuronMUN follows standard MUN Rules of Procedure. These include speaker\'s list, moderated and unmoderated caucuses, points and motions, and voting procedures. The complete rulebook is available in our resources section.';
    }

    // Contact/support
    if (lowerMessage.includes('contact') || lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return 'For assistance, you can email us at admin@turonmun.com or call +998 XX XXX XX XX. Our team is available Monday-Friday, 9 AM - 6 PM. You can also reach us through our social media channels.';
    }

    // Default response
    return `I understand you're asking about: "${message}". For specific details about TuronMUN Season 7, I recommend checking our official website or contacting our team at admin@turonmun.com. Is there anything specific about MUN procedures, application, or conference logistics I can help you with?`;
  }
}

export const aiService = new AIService();
