import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const MainDeveloper: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Main Developer – Numonov Samandar | TuronMUN</title>
        <meta name="description" content="Learn more about the main developer of TuronMUN – Numonov Samandar." />
      </Helmet>

      <section className="bg-diplomatic-50 py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-diplomatic-800 mb-4">Numonov Samandar</h1>
          <p className="text-lg md:text-xl text-diplomatic-600 mb-8">Main Developer of TuronMUN Website</p>
          <img src="/images/samandar.jpg" alt="Numonov Samandar" className="mx-auto w-40 h-40 rounded-full object-cover mb-8 shadow-lg" />
          <p className="text-diplomatic-700 leading-relaxed mb-6">
            Samandar is a passionate full-stack developer responsible for architecting and implementing the entire TuronMUN
            web experience. From the interactive registration system to the dynamic schedule and admin dashboard, every
            feature was crafted with care and attention to detail. Samandar enjoys building user-centric products that
            combine aesthetic design with robust engineering.
          </p>
          <p className="text-diplomatic-700 leading-relaxed mb-6">
            Outside of coding, Samandar mentors aspiring developers and actively contributes to open-source projects. Feel
            free to reach out via{' '}
            <a href="mailto:samandar@example.com" className="text-gold-500 hover:underline">email</a>, connect on{' '}
            <a href="https://github.com/Polarbear2008" target="_blank" rel="noopener" className="text-gold-500 hover:underline">GitHub</a>, or message me on{' '}
            <a href="https://t.me/samandar_vibe" target="_blank" rel="noopener" className="text-gold-500 hover:underline">Telegram</a>.
          </p>

          <Link
            to="/about"
            className="inline-block mt-4 bg-gold-400 hover:bg-gold-400/90 text-diplomatic-900 font-medium py-2 px-6 rounded-md transition-colors"
          >
            Back to About Page
          </Link>
        </div>
      </section>
    </>
  );
};

export default MainDeveloper;
