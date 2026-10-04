
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useContent, useFill, rich } from '@/content/store';

export default function AboutTestimonials() {
  const text = useContent('about_page');
  const testimonials = text.testimonials;
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-3xl font-bold mb-4">{text.testimonials_title}</h2>
          <div className="w-20 h-1 bg-diplomatic-600 mx-auto mb-4" />
          <p className="text-neutral-600">
            {text.testimonials_intro}
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
