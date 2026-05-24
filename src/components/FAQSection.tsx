
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: 'What is Model United Nations?',
    answer: 'Model United Nations (MUN) is an educational simulation where students role-play as delegates representing different countries in UN committees. Participants research global issues, represent their assigned country\'s positions, debate, and draft resolutions to address international challenges.'
  },
  {
    question: 'Who can participate in the conference?',
    answer: 'Our conference welcomes university and high school students from all around the world. We accept both individual applications and delegations from academic institutions.'
  },
  {
    question: 'How much does participation cost?',
    answer: 'Participation fees vary depending on whether you are registering as an individual delegate or as part of a delegation. Early bird rates and discounts for returning delegates are available. Please check the Registration page for current pricing details.'
  },
  {
    question: 'What is the conference language?',
    answer: 'The official language of the conference is English. All committee sessions, documentation, and communication will be conducted in English.'
  },
  {
    question: 'Do I need previous MUN experience to participate?',
    answer: 'No, prior experience is not required. We welcome delegates of all experience levels. We provide training sessions and resources for first-time participants to ensure everyone can engage meaningfully in the conference.'
  },
  {
    question: 'What should I do to prepare for the conference?',
    answer: 'Preparation includes researching your assigned country and committee topics, drafting position papers, and reviewing parliamentary procedure. We provide a delegate handbook and research guides to assist you in your preparation.'
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  
  return (
    <section className="section bg-white">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <span className="chip mb-2">Questions?</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-neutral-600">
            Find answers to common questions about our MUN conference, registration process, and more.
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
