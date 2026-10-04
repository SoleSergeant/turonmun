import * as React from 'react';
import { Calendar, Trophy, Flag, Sparkles, Zap, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CustomButton } from '@/components/ui/custom-button';
import { useContent, useFill, rich } from '@/content/store';
import { usePastSeasons } from '@/content/seasons';

const SEASON_ICONS = [Calendar, Trophy, Flag, Zap, Sparkles, Heart];

export default function AboutSeasons() {
  const text = useContent('about_page');
  const seasons = usePastSeasons().map((s, i) => ({
    key: s.id,
    label: s.year ? `${s.menu_label || s.title} • ${s.year}` : (s.menu_label || s.title),
    name: s.title,
    description: s.description,
    highlights: [s.date, s.statistics?.committees ? `${s.statistics.committees} committees` : '', s.statistics?.location || s.location].filter(Boolean) as string[],
    icon: SEASON_ICONS[i % SEASON_ICONS.length],
  }));
  return (
    <section className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-3xl font-bold mb-4">{text.seasons_title}</h2>
          <div className="w-20 h-1 bg-diplomatic-600 mx-auto mb-4" />
          <p className="text-neutral-600">
            {text.seasons_intro}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {seasons.map((season) => (
            <Card key={season.key} className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <season.icon className="w-12 h-12 text-diplomatic-600 mr-4" />
                  <div>
                    <span className="text-sm font-semibold text-diplomatic-600">{season.label.toUpperCase()}</span>
                    <h3 className="text-2xl font-bold">{season.name}</h3>
                  </div>
                </div>
                <p className="text-neutral-600 mb-4">{season.description}</p>
                <ul className="space-y-2 mb-4">
                  {season.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-diplomatic-500 rounded-full mr-2"></span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <CustomButton variant="primary" to="/committees">
            {text.seasons_button}
          </CustomButton>
        </div>
      </div>
    </section>
  );
}
