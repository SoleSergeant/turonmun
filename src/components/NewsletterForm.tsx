import React, { useState } from 'react';
import { useToast } from "../hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

// Make.com webhook — secondary delivery channel.
// Primary storage: newsletter_subscribers Supabase table.
const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/oswnqruggwai9nq13709qvzdofngxk1s';

interface NewsletterFormProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export default function NewsletterForm({
  variant = 'light',
  className = ''
}: NewsletterFormProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@') || !email.includes('.')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Primary: store in Supabase (upsert so duplicate emails don't error)
      const { error: dbError } = await (supabase.from('newsletter_subscribers') as any)
        .upsert(
          { email, source: window.location.pathname, subscribed_at: new Date().toISOString(), is_active: true },
          { onConflict: 'email' }
        );

      if (dbError) {
        console.error('Newsletter DB error:', dbError);
      }

      // 2. Secondary: fire Make.com webhook (best-effort, no-cors)
      fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({ email, subscribed_at: new Date().toISOString(), source: window.location.pathname }),
      }).catch(() => {});

      toast({
        title: "Subscription Successful!",
        description: "You've been added to our newsletter.",
      });
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast({
        title: "Submission Error",
        description: "There was a problem processing your subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEmail('');
      setIsSubmitting(false);
    }
  };

  const isDark = variant === 'dark';
  
  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col sm:flex-row gap-2 sm:gap-3 ${className}`}
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className={`flex-grow px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm focus:outline-none focus:ring-2 ${
          isDark
            ? 'focus:ring-gold-400 bg-white/10 border border-white/10 text-white placeholder:text-white/40'
            : 'focus:ring-blue-300 border border-neutral-200'
        }`}
        disabled={isSubmitting}
      />
      <button
        type="submit"
        className={`${
          isDark
            ? 'btn-accent h-auto py-2 sm:py-3 text-sm sm:text-base'
            : 'bg-white text-[#002870] hover:bg-blue-50 font-medium py-2 sm:py-3 px-4 sm:px-5 rounded-lg transition-colors whitespace-nowrap text-sm sm:text-base'
        }`}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Subscribing...' : 'Subscribe'}
      </button>
    </form>
  );
}
