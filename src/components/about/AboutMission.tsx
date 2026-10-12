import React from 'react';
import { useContent } from '@/content/store';

export default function AboutMission() {
  const text = useContent('about_page');
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container mx-auto max-w-3xl px-4">
        <h2 className="mb-4 font-display text-3xl font-bold text-diplomatic-900">{text.mission_title}</h2>
        <p className="text-lg leading-relaxed text-neutral-700">{text.mission_statement}</p>
      </div>
    </section>
  );
}
