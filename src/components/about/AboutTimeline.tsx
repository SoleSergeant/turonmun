
import * as React from 'react';
import { useContent, useFill, rich } from '@/content/store';

export default function AboutTimeline() {
  const text = useContent('about_page');
  const timelineEvents = text.timeline;
  return (
    <section className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-3xl font-bold mb-4">{text.timeline_title}</h2>
          <div className="w-20 h-1 bg-diplomatic-600 mx-auto mb-4" />
          <p className="text-neutral-600">
            {text.timeline_intro}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {timelineEvents.map((event, index) => (
            <div key={index} className="flex gap-4 mb-12">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-diplomatic-500 flex items-center justify-center">
                </div>
                {index !== timelineEvents.length - 1 && (
                  <div className="w-0.5 h-full bg-diplomatic-200" />
                )}
              </div>
              <div className="flex-1 pb-8">
                <div className="text-sm text-diplomatic-600 font-semibold mb-1">
                  {event.date}
                </div>
                <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                <p className="text-neutral-600 mb-4">{event.description}</p>
                {event.milestones && (
                  <ul className="space-y-1">
                    {event.milestones.map((milestone, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-diplomatic-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        <span className="text-sm text-neutral-700">{milestone}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
