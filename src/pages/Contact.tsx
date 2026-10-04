import * as React from 'react';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Mail, Phone, MapPin, Users, MessageSquare, Send } from 'lucide-react';
import { useContactForm } from '../hooks/useContactForm';
import { useContent, useFill, rich } from '@/content/store';

const Contact = () => {
  const text = useContent('contact');
  const general = useContent('general');
  const fill = useFill();
  const contactMethods = [
    { icon: Mail, title: 'Email Us', description: 'Get in touch via email for general inquiries and questions.', value: general.contact_email, action: 'Email', link: `mailto:${general.contact_email}` },
    { icon: Phone, title: 'Call Us', description: 'Speak directly with our organization team.', value: general.contact_phone, action: 'Call', link: `tel:${general.contact_phone.replace(/\s+/g, '')}` },
    { icon: Users, title: 'Social Media', description: 'Connect with us on social platforms.', value: general.links_url.replace(/^https?:\/\//, ''), action: 'Follow', link: general.links_url },
  ];
  const { formData, isSubmitting, handleChange, handleSubmit } = useContactForm();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page-transition-container min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow pt-20">
        {/* Header */}
        <section className="bg-gradient-to-b from-diplomatic-50 to-white py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <span className="chip-gold mb-4">{text.eyebrow}</span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-diplomatic-800">{text.title}</h1>
              <p className="text-lg text-neutral-600">
                {text.intro}
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-12">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => (
                <div key={index} className="diplomatic-card flex flex-col">
                  <div className="p-3 rounded-lg bg-diplomatic-100 text-diplomatic-700 w-12 h-12 flex items-center justify-center mb-4">
                    <method.icon size={24} />
                  </div>
                  <h3 className="text-xl font-display font-semibold mb-2">{method.title}</h3>
                  <p className="text-neutral-600 text-sm mb-3">{method.description}</p>
                  <p className="font-medium text-diplomatic-800 mb-4">{method.value}</p>
                  <a
                    href={method.link}
                    className="mt-auto text-sm font-medium text-diplomatic-700 hover:text-diplomatic-800 transition-colors"
                    target={method.icon === MapPin ? "_blank" : undefined}
                    rel={method.icon === MapPin ? "noopener noreferrer" : undefined}
                  >
                    {method.action} →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form & Map */}
        <section className="py-16">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Form */}
              <div className="bg-white rounded-2xl shadow-elegant border border-neutral-100 p-8 order-2 lg:order-1">
                <div className="mb-8">
                  <h2 className="text-2xl font-display font-semibold mb-2">{text.form_title}</h2>
                  <p className="text-neutral-600">{text.form_intro}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-diplomatic-500 focus:border-transparent"
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-diplomatic-500 focus:border-transparent"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">Phone Number (optional)</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-diplomatic-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 mb-1">Subject *</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-diplomatic-500 focus:border-transparent"
                      placeholder="What is this regarding?"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-diplomatic-500 focus:border-transparent resize-none"
                      placeholder="Your message..."
                      required
                    ></textarea>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-accent w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={16} />
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Map & Info */}
              <div className="order-1 lg:order-2">
                <div className="bg-white rounded-2xl shadow-elegant border border-neutral-100 overflow-hidden">
                  {/* Conference photo */}
                  <div className="aspect-video bg-neutral-100 overflow-hidden">
                    <img
                      src={text.venue_image}
                      alt={text.venue_name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-display font-semibold mb-1">Conference Venue</h3>
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-0.5 mb-3">
                      {text.venue_name}
                    </span>
                    <p className="text-neutral-600 mb-5">
                      {fill(text.venue_text)}
                    </p>
                    <div className="flex items-center mb-3">
                      <MapPin size={18} className="text-diplomatic-600 mr-2 flex-shrink-0" />
                      <p className="text-neutral-500 text-sm">{text.venue_address}</p>
                    </div>
                    <div className="flex items-center mb-2">
                      <Mail size={18} className="text-diplomatic-600 mr-2 flex-shrink-0" />
                      <p className="text-neutral-700">{general.contact_email}</p>
                    </div>
                    <div className="flex items-center">
                      <Phone size={18} className="text-diplomatic-600 mr-2 flex-shrink-0" />
                      <p className="text-neutral-700">{general.contact_phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-diplomatic-50/50">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-display font-semibold mb-4">{text.faq_title}</h2>
              <p className="text-neutral-600">
                {text.faq_intro}
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="space-y-6">
                {text.faq.map((item, index) => (
                  <div key={index} className="bg-white rounded-xl border border-neutral-100 shadow-subtle overflow-hidden">
                    <div className="p-5">
                      <div className="font-display font-semibold text-lg mb-2">{item.question}</div>
                      <p className="text-neutral-600">{item.answer}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-10">
                <p className="text-neutral-600 mb-4">
                  {text.faq_footer}
                </p>
                <a href={`mailto:${general.contact_email}`} className="btn-primary inline-flex items-center gap-2">
                  <Mail size={16} /> Email Us
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
