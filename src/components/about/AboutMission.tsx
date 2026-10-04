
import React from 'react';
import { Globe, Users, Award, PenTool, BookOpen, Scale, Lightbulb, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useContent, useFill, rich } from '@/content/store';

const VALUE_ICONS = [Globe, Users, Award, PenTool, BookOpen, Scale, Lightbulb, Heart];

export default function AboutMission() {
  const text = useContent('about_page');
  const features = text.values.map((v, i) => ({ ...v, icon: VALUE_ICONS[i % VALUE_ICONS.length] }));
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-3xl font-bold mb-4">{text.mission_title}</h2>
          <div className="w-20 h-1 bg-diplomatic-600 mx-auto mb-4" />
          <p className="text-neutral-600 mb-6">
            {text.mission_intro}
          </p>
          <div className="bg-diplomatic-50 p-6 rounded-lg border-l-4 border-diplomatic-600 text-left mb-8">
            <h3 className="text-xl font-semibold mb-2">Mission Statement</h3>
            <p className="italic text-neutral-700">
              "{text.mission_statement}"
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <feature.icon className="w-12 h-12 text-diplomatic-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-neutral-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
