
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useContent, useFill, rich } from '@/content/store';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQSection() {
  const text = useContent('home_sections');
  const faqItems: FAQItem[] = useContent('faq').items;
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  
  return (
    <section className="section bg-white">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <span className="chip mb-2">{text.faq_eyebrow}</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{text.faq_title}</h2>
          <p className="text-neutral-600">
            {text.faq_intro}
          </p>
        </div>
        
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div 
              key={index}
              className="glass-panel border border-neutral-200/40 bg-white/70 backdrop-blur-xl rounded-lg overflow-hidden transition-all duration-300"
            >
              <button
                className="flex justify-between items-center w-full p-4 text-left font-medium bg-transparent hover:bg-white/40 transition-colors"
                onClick={() => toggleFAQ(index)}
              >
                <span>{item.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="flex-shrink-0 text-diplomatic-500" size={20} />
                ) : (
                  <ChevronDown className="flex-shrink-0 text-neutral-400" size={20} />
                )}
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96 animate-accordion-down' : 'max-h-0 animate-accordion-up'
                }`}
              >
                <div className="p-4 pt-0 bg-white/60 text-neutral-700 border-t border-white/40">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
