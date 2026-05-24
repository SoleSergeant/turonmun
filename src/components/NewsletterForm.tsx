import React, { useState, useEffect } from 'react';
import { useToast } from "../hooks/use-toast";

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
  const [webhookUrl, setWebhookUrl] = useState('https://hook.us2.make.com/oswnqruggwai9nq13709qvzdofngxk1s');
  const [showWebhookInput, setShowWebhookInput] = useState(false);

  useEffect(() => {
    // Check if webhookUrl is already in localStorage
    const savedWebhookUrl = localStorage.getItem('makeWebhookUrl');
    if (!savedWebhookUrl) {
      // Save the default webhook URL to localStorage
      localStorage.setItem('makeWebhookUrl', webhookUrl);
    } else {
      // Use the saved webhook URL
      setWebhookUrl(savedWebhookUrl);
    }
  }, []);

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
      // Get the webhook URL from state
      let makeWebhook = webhookUrl;
      
      if (!makeWebhook) {
        // If no webhook is set, fall back to console logging
        console.log('Newsletter subscription:', email);
        
        toast({
          title: "No Make.com Webhook Set",
          description: "Subscription logged. Set up a Make.com webhook to automate this process.",
        });
        
        setShowWebhookInput(true);
      } else {
        // Send data to Make.com webhook
        await fetch(makeWebhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'no-cors', // Handle CORS issues
          body: JSON.stringify({
            email: email,
            subscribed_at: new Date().toISOString(),
            source: window.location.pathname
          }),
        });
        
        // Since we're using no-cors, we'll assume it worked
        toast({
          title: "Subscription Successful!",
          description: "You've been added to our newsletter.",
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Submission Error",
        description: "There was a problem processing your subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Reset form
      setEmail('');
      setIsSubmitting(false);
    }
  };

  const handleWebhookSave = () => {
    if (webhookUrl) {
      localStorage.setItem('makeWebhookUrl', webhookUrl);
      setShowWebhookInput(false);
      toast({
        title: "Webhook URL Saved",
        description: "Your Make.com webhook URL has been saved.",
      });
    }
  };

  const isDark = variant === 'dark';
  
  return (
    <div className="space-y-4">
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
      
      {showWebhookInput && (
        <div className={`p-3 sm:p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-blue-50'}`}>
          <p className={`text-xs sm:text-sm mb-2 ${isDark ? 'text-white/80' : 'text-blue-800'}`}>
            Set up Make.com integration by adding your webhook URL:
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="Paste Make.com webhook URL here"
              className={`flex-grow px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                isDark 
                  ? 'focus:ring-gold-400 bg-white/10 border border-white/10 text-white placeholder:text-white/40' 
                  : 'focus:ring-blue-300 border border-neutral-200'
              }`}
            />
            <button
              type="button"
              onClick={handleWebhookSave}
              className={`${
                isDark
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors mt-2 sm:mt-0`}
            >
              Save
            </button>
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-white/60' : 'text-blue-700'}`}>
            Create a scenario in Make.com with a webhook trigger, then paste the webhook URL here.
          </p>
        </div>
      )}
    </div>
  );
}
