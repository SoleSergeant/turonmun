import * as React from 'react';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Mail, Phone, MapPin, Users, MessageSquare, Send } from 'lucide-react';
import { useContactForm } from '../hooks/useContactForm';

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description: "Get in touch via email for general inquiries and questions.",
    value: "admin@turonmun.com",
    action: "Email",
    link: "mailto:admin@turonmun.com"
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "Speak directly with our organization team.",
    value: "+998903672103",
    action: "Call",
    link: "tel:+998903672103"
  },
  {
    icon: Users,
    title: "Social Media",
    description: "Connect with us on social platforms.",
    value: "myurls.co/turonmunconference",
    action: "Follow",
    link: "https://myurls.co/turonmunconference"
  }
];

const Contact = () => {
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
              <span className="chip-gold mb-4">Get In Touch</span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-diplomatic-800">Contact Us</h1>
              <p className="text-lg text-neutral-600">
                Have questions about the conference? Our team is here to help you with any inquiries.
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
                  <h2 className="text-2xl font-display font-semibold mb-2">Send us a message</h2>
                  <p className="text-neutral-600">Fill out the form below and we'll get back to you as soon as possible.</p>
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
                  {/* Venue image */}
                  <div className="aspect-video bg-neutral-100 overflow-hidden">
                    <img
                      src="/images/venue.jfif"
                      alt="TuronMUN Conference Venue"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-display font-semibold mb-2">Conference Venue</h3>
                    <p className="text-neutral-600 mb-4">
                      Our season 6 will be held on Registan Private School, a prestigious educational institution.
                    </p>
                    <div className="flex items-start mb-4">
                      <MapPin size={18} className="text-diplomatic-600 mt-1 mr-2" />
                      <div>
                        <p className="text-neutral-700">
                          Registan Private School<br />
                          Fergana, Uzbekistan
                        </p>
                        <a
                          href="https://maps.app.goo.gl/aYhWpFmS3rWkVioz9"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-diplomatic-600 hover:text-diplomatic-700 text-sm font-medium mt-1 inline-block"
                        >
                          View on Maps →
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center mb-2">
                      <Mail size={18} className="text-diplomatic-600 mr-2" />
                      <p className="text-neutral-700">admin@turonmun.com</p>
                    </div>
                    <div className="flex items-center">
                      <Phone size={18} className="text-diplomatic-600 mr-2" />
                      <p className="text-neutral-700">+998903672103</p>
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
              <h2 className="text-3xl font-display font-semibold mb-4">Frequently Asked Questions</h2>
              <p className="text-neutral-600">
                Find quick answers to common questions.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="space-y-6">
                {[
                  {
                    question: "How can I apply to be a delegate?",
                    answer: "To apply as a delegate, navigate to our Registration page and fill out the application form. You'll receive a confirmation email with further instructions."
                  },
                  {
                    question: "Is there a participation fee?",
                    answer: "Yes, there is a participation fee that varies depending on your delegation type. Early bird rates are available. Please check our Registration page for current pricing."
                  },
                  {
                    question: "How can I become a committee chair?",
                    answer: "Committee chair applications are opened 6 months before the conference. To apply, send your CV and a motivation letter to chairs@munconference.org."
                  },
                  {
                    question: "When will I know my country assignment?",
                    answer: "Country assignments are typically sent out 4-6 weeks after your registration is confirmed, along with committee assignments."
                  }
                ].map((item, index) => (
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
                  Still have questions? Don't hesitate to contact us directly.
                </p>
                <a href="mailto:admin@turonmun.com" className="btn-primary inline-flex items-center gap-2">
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
