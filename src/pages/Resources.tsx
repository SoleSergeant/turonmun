import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Book, FileText, Video, Download, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CustomButton } from '@/components/ui/custom-button';

const resourceCategories = [
  {
    title: "Delegate Guides",
    icon: Book,
    description: "Essential materials to help you prepare for the conference.",
    resources: [
      { title: "TuronMUN Guide", description: "Complete guide to TuronMUN procedures and preparation", link: "https://sasuvkcqdqmmjobmgida.supabase.co/storage/v1/object/public/logo/TuronMUN%20Guide.pdf" },
      { title: "Position Paper Guide", description: "How to write an effective position paper", link: "https://lmun.ng/wp-content/uploads/2020/01/Position-Guide.pdf" },
      { title: "Research Methodology", description: "Strategies for thorough country research", link: "https://euacademic.org/bookupload/9.pdf" }
    ]
  },
  {
    title: "Committee Materials",
    icon: FileText,
    description: "Background guides and topic briefs for all committees.",
    resources: [
      { title: "TuronMUN Position Paper Structure", description: "Official position paper structure and guidelines", link: "https://sasuvkcqdqmmjobmgida.supabase.co/storage/v1/object/public/logo/TuronMUN%20Position%20Paper%20Structure.pdf" },
      { title: "UNGA Topic Brief", description: "Detailed analysis of UNGA topics", link: "https://media.nti.org/documents/unga.pdf" },
      { title: "WHO Study Guide", description: "Comprehensive guide to WHO topics", link: "https://zumun.ch/wp-content/uploads/2023/04/WHO-Study-Guide-ZuMUN-2023.pdf" }
    ]
  },
  {
    title: "Video Tutorials",
    icon: Video,
    description: "Visual guides to help you master MUN skills.",
    resources: [
      { title: "TuronMUN Tutorial", description: "Complete video guide for TuronMUN preparation", link: "https://youtu.be/88kMFbjjntU" },
      { title: "Negotiation Tactics", description: "Effective strategies for building consensus", link: "https://youtu.be/7bRjWDzRJqE?si=UMkvEC8SNxmm9vjh" },
      { title: "Resolution Drafting", description: "Step-by-step guide to writing resolutions", link: "https://youtu.be/KLoktLNfXRo?si=UL5JHPEuTvF65UKB" }
    ]
  }
];

const Resources = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page-transition-container min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20">
        {/* Header */}
        <section className="bg-gradient-to-b from-diplomatic-50 to-white py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <span className="chip-gold mb-4">Delegate Preparation</span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-diplomatic-800">Resources & Materials</h1>
              <p className="text-lg text-neutral-600 mb-8">
                Access comprehensive guides, background materials, and tools to help you prepare for a successful Model UN experience.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <CustomButton variant="secondary" size="default" to="#guides" className="inline-flex items-center gap-2">
                  <BookOpen size={16} /> Delegate Guides
                </CustomButton>
                <CustomButton variant="secondary" size="default" to="#committee" className="inline-flex items-center gap-2">
                  <FileText size={16} /> Committee Materials
                </CustomButton>
                <CustomButton variant="secondary" size="default" to="#videos" className="inline-flex items-center gap-2">
                  <Video size={16} /> Video Tutorials
                </CustomButton>
              </div>
            </div>
          </div>
        </section>

        {/* Resource Categories */}
        <section className="py-16">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {resourceCategories.map((category, index) => (
                <div key={index} className="diplomatic-card" id={category.title.toLowerCase().replace(' ', '-')}>
                  <div className="flex items-center mb-6">
                    <div className="p-3 rounded-lg bg-diplomatic-100 text-diplomatic-700 mr-4">
                      <category.icon size={24} />
                    </div>
                    <h2 className="text-2xl font-display font-semibold">{category.title}</h2>
                  </div>
                  <p className="text-neutral-600 mb-6">{category.description}</p>
                  <ul className="space-y-5">
                    {category.resources.map((resource, idx) => (
                      <li key={idx} className="border-b border-neutral-100 pb-5 last:border-none last:pb-0">
                        <a 
                          href={resource.link} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex justify-between items-start hover:text-diplomatic-700 transition-colors"
                        >
                          <div className="flex-1">
                            <h3 className="font-medium text-diplomatic-800 group-hover:text-diplomatic-600 transition-colors">{resource.title}</h3>
                            <p className="text-sm text-neutral-500">{resource.description}</p>
                          </div>
                          <Download size={18} className="text-neutral-400 group-hover:text-diplomatic-600 transition-colors mt-1" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Resources */}
        <section className="py-12 bg-diplomatic-50/50">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-display font-semibold mb-4">Additional Resources</h2>
              <p className="text-neutral-600">
                Explore even more materials to help you prepare for a successful MUN experience.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a 
                href="https://www.un.org/en/about-us/member-states" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-white p-6 rounded-xl border border-neutral-100 shadow-subtle hover:shadow-elegant transition-all group"
              >
                <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-diplomatic-600 transition-colors">Country Research Database</h3>
                <p className="text-neutral-600 text-sm mb-4">Access detailed information on all UN member states.</p>
                <div className="text-diplomatic-600 text-sm font-medium inline-flex items-center">
                  Explore <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </a>
              
              <a 
                href="https://www.wisemee.com/model-un-resolution-template/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-white p-6 rounded-xl border border-neutral-100 shadow-subtle hover:shadow-elegant transition-all group"
              >
                <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-diplomatic-600 transition-colors">Resolution Templates</h3>
                <p className="text-neutral-600 text-sm mb-4">Download templates for drafting effective resolutions.</p>
                <div className="text-diplomatic-600 text-sm font-medium inline-flex items-center">
                  Download <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </a>
              
              <a 
                href="https://www.wisemee.com/mun-glossary/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-white p-6 rounded-xl border border-neutral-100 shadow-subtle hover:shadow-elegant transition-all group"
              >
                <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-diplomatic-600 transition-colors">Diplomatic Glossary</h3>
                <p className="text-neutral-600 text-sm mb-4">Essential terms and phrases used in diplomatic contexts.</p>
                <div className="text-diplomatic-600 text-sm font-medium inline-flex items-center">
                  View Glossary <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default Resources;
