import React from 'react';
import { useContent, rich } from '@/content/store';

export default function AboutSection() {
  const content = useContent('home_about');

  return (
    <section className="border-y border-neutral-200 bg-white py-20 md:py-28">
      <div className="container grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2 className="font-display text-3xl font-bold leading-tight text-diplomatic-900 md:text-4xl">
            {rich(content.headline, 'text-gold-500')}
          </h2>
          <div className="mt-6 space-y-4 text-neutral-700 leading-relaxed">
            {content.paragraphs.map((text, i) => <p key={i}>{text}</p>)}
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-neutral-200 pt-8 sm:grid-cols-4">
            {content.stats.map(stat => (
              <div key={stat.label}>
                <dt className="text-xs text-neutral-500">{stat.label}</dt>
                <dd className="mt-1 font-display text-3xl font-bold text-diplomatic-900">
                  {stat.value}{stat.suffix}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <ul className="divide-y divide-neutral-200 lg:pt-2">
          {content.features.map((feature, i) => (
            <li key={i} className="py-5 first:pt-0">
              <h3 className="text-lg font-semibold text-diplomatic-900">{feature.title}</h3>
              <p className="mt-1 text-neutral-600">{feature.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
