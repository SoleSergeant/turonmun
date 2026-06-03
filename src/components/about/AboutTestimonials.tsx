
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    quote: "Participating in TuronMUN has significantly improved my public speaking and diplomatic skills. I've been part of it since the first season, and each time I learn something new and valuable.",
    author: "Azizbek Ismoilov",
    role: "Delegate, Seasons 1-4"
  },
  {
    quote: "The committees were engaging and the topics were thought-provoking, pushing us to think critically about global issues.",
    author: "Dilfuza Qodirova",
    role: "MUN Coordinator"
  },
  {
    quote: "Leading one of the five committees in Season 3 was an incredible experience. Working with 105 delegates was both challenging and rewarding, and the level of organization was outstanding.",
    author: "Javohir Toshmatov",
    role: "Committee Chair, Season 3"
  },
  {
    quote: "My son participated in Season 2, and it was one of the best experiences of his life. Now his younger sister can't wait to join as well!",
    author: "Dilbar Otabekova",
    role: "Parent of Season 2 Delegate"
  },
  {
    quote: "Winning 'Best Social Media' on MyMUN was a proud moment for our entire team. It's amazing to see our hard work recognized on an international platform!",
    author: "Shahzod Kholmatov",
    role: "Social Media Coordinator"
  },
  {
    quote: "Watching our evolution from turonmun to TuronMUN has been incredible. The growth of our team and program fills me with pride for what we've accomplished together.",
    author: "Madina Karimova",
    role: "Organizing Committee Member, Seasons 1-4"
  }
];

export default function AboutTestimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Voices from Our Community</h2>
          <div className="w-20 h-1 bg-diplomatic-600 mx-auto mb-4" />
          <p className="text-neutral-600">
            Hear from our community members about their TuronMUN experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col h-full items-center text-center">
                  <div className="mb-4 text-4xl text-diplomatic-300">"</div>
                  <p className="text-neutral-700 mb-6 flex-grow italic">
                    {testimonial.quote}
                  </p>
                  <div className="text-center">
                    <h4 className="font-semibold">{testimonial.author}</h4>
                    <p className="text-sm text-neutral-500">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
