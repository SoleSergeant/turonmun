
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const galleryImages = [
  {
    src: '/lovable-uploads/mun-action-1.jpg',
    alt: 'TuronMUN Delegates in Action',
    caption: 'Delegates engaged in committee discussions'
  },
  {
    src: '/lovable-uploads/mun-action-2.jpg',
    alt: 'TuronMUN Committee Session',
    caption: 'Active participation in committee session'
  },
  {
    src: '/lovable-uploads/mun-action-3.jpg',
    alt: 'TuronMUN Debate',
    caption: 'Delegates passionately debating global issues'
  },
  {
    src: '/lovable-uploads/mun-action-4.jpg',
    alt: 'TuronMUN Speakers',
    caption: 'Delegates delivering their country\'s position'
  },
  {
    src: '/lovable-uploads/mun-action-5.jpg',
    alt: 'TuronMUN Group Photo',
    caption: 'TuronMUN participants and organizers'
  },
  {
    src: '/lovable-uploads/mun-action-6.jpg',
    alt: 'TuronMUN Closing Ceremony',
    caption: 'Awarding outstanding delegates'
  }
];

export default function AboutGallery() {
  return (
    <section className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-3xl font-bold mb-4">TuronMUN in Action</h2>
          <div className="w-20 h-1 bg-diplomatic-600 mx-auto mb-4" />
          <p className="text-neutral-600">
            Moments from our previous conferences showcasing the TuronMUN experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((image, index) => (
            <Card key={index} className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="aspect-video overflow-hidden">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-neutral-600">{image.caption}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
