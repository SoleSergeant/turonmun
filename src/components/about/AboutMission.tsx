
import React from 'react';
import { Globe, Users, Award, PenTool, BookOpen, Scale, Lightbulb, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Globe,
    title: 'Global Impact',
    description: 'Fostering international understanding and cooperation through simulated diplomatic experiences that tackle real-world issues.'
  },
  {
    icon: Users,
    title: 'Diverse Community',
    description: 'Bringing together students from various backgrounds, cultures, and perspectives to share ideas and build lasting connections.'
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'Promoting high standards in research, debate, and diplomatic protocol to prepare future leaders for global challenges.'
  },
  {
    icon: PenTool,
    title: 'Skill Development',
    description: 'Building essential skills in public speaking, negotiation, critical thinking, and collaborative problem-solving.'
  },
  {
    icon: BookOpen,
    title: 'Educational Focus',
    description: 'Creating rich learning experiences that complement academic curricula and deepen understanding of international relations.'
  },
  {
    icon: Scale,
    title: 'Balanced Representation',
    description: 'Ensuring all nations and perspectives are represented fairly, with special attention to underrepresented regions.'
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'Continuously evolving our conference formats and topics to reflect the changing nature of global diplomacy and challenges.'
  },
  {
    icon: Heart,
    title: 'Inclusive Environment',
    description: 'Creating a supportive, respectful space where every delegate can participate fully regardless of experience level.'
  }
];

export default function AboutMission() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Our Mission & Values</h2>
          <div className="w-20 h-1 bg-diplomatic-600 mx-auto mb-4" />
          <p className="text-neutral-600 mb-6">
            We are dedicated to empowering the next generation of global leaders through immersive diplomatic experiences.
          </p>
          <div className="bg-diplomatic-50 p-6 rounded-lg border-l-4 border-diplomatic-600 text-left mb-8">
            <h3 className="text-xl font-semibold mb-2">Mission Statement</h3>
            <p className="italic text-neutral-700">
              "To inspire and equip young people with the diplomatic skills, global awareness, and leadership capabilities needed to address the complex challenges of our interconnected world."
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
