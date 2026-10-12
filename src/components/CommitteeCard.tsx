import React, { useState } from 'react';
import { LucideIcon, Globe, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface CommitteeCardProps {
  name: string;
  abbreviation: string;
  description: string;
  topics: string[];
  imageUrl?: string;
  icon?: LucideIcon;
  chairs?: string[];
}

const FALLBACK = '/images/committees/unga.png';

/**
 * Committee tile. Everything is visible without hovering (phones can't
 * hover), and the emblem is shown whole instead of cropped.
 */
export default function CommitteeCard({
  name,
  abbreviation,
  description,
  topics,
  imageUrl = FALLBACK,
  icon: Icon = Globe,
  chairs = [],
}: CommitteeCardProps) {
  const [src, setSrc] = useState(imageUrl);

  return (
    <motion.div
      className="committee-card group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-elegant transition-shadow hover:shadow-lg"
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <div className="relative flex h-40 items-center justify-center border-b border-neutral-100 bg-white p-5">
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => src !== FALLBACK && setSrc(FALLBACK)}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-diplomatic-50">
          <Icon size={16} className="text-diplomatic-700" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className="mb-2 self-start rounded-md bg-diplomatic-700 px-2.5 py-1 text-xs font-semibold text-white">{abbreviation}</span>
        <h3 className="font-display text-lg font-semibold leading-snug text-diplomatic-900">{name}</h3>
        {description && <p className="mt-2 line-clamp-3 text-sm text-neutral-600">{description}</p>}

        {chairs.length > 0 && (
          <p className="mt-3 flex items-start gap-1.5 text-sm text-neutral-700">
            <Award size={15} className="mt-0.5 shrink-0 text-diplomatic-500" />
            {chairs.join(' · ')}
          </p>
        )}

        {topics.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
            {topics.map((topic, index) => (
              <span key={index} className="rounded-md border border-diplomatic-100 bg-diplomatic-50 px-2 py-0.5 text-xs font-medium text-diplomatic-700">
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
