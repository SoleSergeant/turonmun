import React from 'react';
import { ChevronRight } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import AboutMission from '@/components/about/AboutMission';
import AboutTimeline from '@/components/about/AboutTimeline';
import AboutSeasons from '@/components/about/AboutSeasons';
import AboutGallery from '@/components/about/AboutGallery';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useContent } from '@/content/store';

export default function About() {
  const text = useContent('about_page');
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="bg-neutral-50 pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h1 className="mb-6 font-display text-4xl font-bold text-diplomatic-900 md:text-5xl">{text.title}</h1>
          <p className="mb-8 text-lg text-neutral-600 md:text-xl">{text.intro}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CustomButton variant="primary" size="lg" to="/register">{text.primary_button}</CustomButton>
            <CustomButton variant="outline" size="lg" to="/past-conferences">
              <span>{text.secondary_button}</span>
              <ChevronRight size={18} className="ml-1" />
            </CustomButton>
          </div>
        </div>
      </section>

      <AboutMission />
      <AboutSeasons />
      <AboutTimeline />
      <AboutGallery />

      <Footer />
    </div>
  );
}
