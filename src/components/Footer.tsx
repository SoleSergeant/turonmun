import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Send, ArrowRight } from 'lucide-react';
import { useContent, useFill, rich } from '@/content/store';

export default function Footer() {
  const general = useContent('general');
  const currentYear = new Date().getFullYear();
  return <footer className="bg-[#00235c] text-white pt-16 pb-8">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
        {/* About */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-diplomatic-800 flex items-center justify-center overflow-hidden">
              <img src={general.logo_url} alt="TuronMUN Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="font-display">
              <span className="font-bold text-white">TURON</span>
              <span className="text-white">MUN</span>
            </div>
          </div>
          <p className="text-neutral-300 mb-6 text-sm sm:text-base">
            {general.footer_about}
          </p>
          <div className="flex space-x-4">
            <a href={general.instagram_url} className="text-blue-300 hover:text-white transition-colors" aria-label="Instagram">
              <Instagram size={20} />
            </a>
            <a href={general.telegram_url} className="text-blue-300 hover:text-white transition-colors" aria-label="Telegram">
              <Send size={20} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-display font-semibold mb-6 text-white">Quick Links</h3>
          <ul className="space-y-3">
            <li>
              <Link to="/" className="text-blue-200 hover:text-white transition-colors inline-flex items-center">
                <ArrowRight size={14} className="mr-2 opacity-70" /> Home
              </Link>
            </li>
            <li>
              <Link to="/committees" className="text-blue-200 hover:text-white transition-colors inline-flex items-center">
                <ArrowRight size={14} className="mr-2 opacity-70" /> Committees
              </Link>
            </li>
            <li>
              <Link to="/register" className="text-blue-200 hover:text-white transition-colors inline-flex items-center">
                <ArrowRight size={14} className="mr-2 opacity-70" /> Apply
              </Link>
            </li>
            <li>
              <Link to="/schedule" className="text-blue-200 hover:text-white transition-colors inline-flex items-center">
                <ArrowRight size={14} className="mr-2 opacity-70" /> Schedule
              </Link>
            </li>
            <li>
              <Link to="/resources" className="text-blue-200 hover:text-white transition-colors inline-flex items-center">
                <ArrowRight size={14} className="mr-2 opacity-70" /> Resources
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-display font-semibold mb-6 text-white">Contact</h3>
          <ul className="space-y-4">
            <li className="flex items-start">
              <Mail className="mr-3 shrink-0 mt-1 text-blue-300" size={18} />
              <span className="text-blue-200 text-sm sm:text-base">{general.contact_email}</span>
            </li>
            <li className="flex items-start">
              <Phone className="mr-3 shrink-0 mt-1 text-blue-300" size={18} />
              <span className="text-blue-200 text-sm sm:text-base">{general.contact_phone}</span>
            </li>
            <li className="flex items-start">
              <MapPin className="mr-3 shrink-0 mt-1 text-blue-300" size={18} />
              <span className="text-blue-200 text-sm sm:text-base">
                Fergana, Uzbekistan
              </span>
            </li>
          </ul>
        </div>

        {/* Important Info */}
        <div>
          <h3 className="text-lg font-display font-semibold mb-6 text-white">Important Info</h3>
          <ul className="space-y-3">
            <li>
              <Link to="/about" className="text-blue-200 hover:text-white transition-colors inline-flex items-center">
                <ArrowRight size={14} className="mr-2 opacity-70" /> About Us
              </Link>
            </li>
            <li>
              <Link to="/#faq" className="text-blue-200 hover:text-white transition-colors inline-flex items-center">
                <ArrowRight size={14} className="mr-2 opacity-70" /> FAQ
              </Link>
            </li>
            <li>
              <a href={general.sponsorship_url} target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-white transition-colors inline-flex items-center">
                <ArrowRight size={14} className="mr-2 opacity-70" /> Sponsorship
              </a>
            </li>
            <li>
              <Link to="/contact" className="text-blue-200 hover:text-white transition-colors inline-flex items-center">
                <ArrowRight size={14} className="mr-2 opacity-70" /> Contact Us
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-blue-800/50 text-center text-blue-400 text-sm">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p>© {currentYear} {general.site_name}. All rights reserved.</p>
          <p className="mt-2 md:mt-0">{general.footer_credits_url ? <a href={general.footer_credits_url} target="_blank" rel="noopener" className="underline hover:text-white">{general.footer_credits}</a> : general.footer_credits}</p>
        </div>
      </div>
    </div>
  </footer>;
}
