import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import FeatureCard from '../FeatureCard';
import { FileText, BookOpen, GraduationCap, Globe } from 'lucide-react';
import ReactConfetti from 'react-confetti';

interface ConfirmationStepProps {
  fee: {
    originalFee: number;
    discount: number;
    finalFee: number;
  };
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ fee }) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const confettiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    // Set dimensions on mount
    const updateDimensions = () => ({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    setDimensions(updateDimensions());

    // Handle window resize
    const handleResize = () => {
      setDimensions(updateDimensions());
    };

    window.addEventListener('resize', handleResize);

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);
  const registrationBenefits = [
    {
      icon: FileText,
      title: "Official Certification",
      description: "Receive a UN-recognized certificate of participation for your academic portfolio."
    },
    {
      icon: BookOpen,
      title: "Exclusive Resources",
      description: "Gain access to our comprehensive research materials and delegate preparation guides."
    },
    {
      icon: GraduationCap,
      title: "Skills Development",
      description: "Enhance your public speaking, negotiation, and diplomatic skills through practical experience."
    },
    {
      icon: Globe,
      title: "Global Network",
      description: "Connect with like-minded peers from universities around the world."
    }
  ];

  return (
    <div className="relative" ref={confettiRef}>
      {showConfetti && (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[1000]">
          <ReactConfetti
            width={dimensions.width}
            height={dimensions.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.2}
            colors={['#1e40af', '#1e3a8a', '#1e1b4b', '#f59e0b', '#d97706']}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        </div>
      )}
      <div className="bg-white rounded-xl shadow-elegant p-8 border border-neutral-100 text-center relative z-10">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={24} className="text-green-600" strokeWidth={2} />
        </div>

        <h2 className="text-2xl font-display font-semibold mb-4">Registration Completed!</h2>
        <p className="text-neutral-600 mb-4 max-w-md mx-auto">
          Thank you for registering for our Model United Nations conference. We&apos;ve sent a confirmation email to your inbox with payment instructions and further details.
        </p>

        <div className="max-w-md mx-auto mb-8 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <h3 className="font-semibold text-lg mb-2">Payment Summary</h3>
          <div className="flex justify-between mb-1">
            <span className="text-neutral-600">Registration Fee:</span>
            <span>{fee.originalFee.toLocaleString()} UZS</span>
          </div>
          {fee.discount > 0 && (
            <div className="flex justify-between mb-1 text-green-600">
              <span>Discount Applied:</span>
              <span>-{fee.discount.toLocaleString()} UZS</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-diplomatic-900 pt-2 border-t border-neutral-200 mt-2">
            <span>Total Due:</span>
            <span>{fee.finalFee.toLocaleString()} UZS</span>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-8 mt-8">
          <h3 className="text-xl font-display font-semibold mb-6">What&apos;s Next?</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {registrationBenefits.map((benefit, index) => (
              <div
                key={index}
                className="animate-fade-in opacity-0"
                style={{
                  animationDelay: `${0.2 + (index * 0.1)}s`,
                  animationFillMode: 'forwards'
                }}
              >
                <FeatureCard
                  icon={benefit.icon}
                  title={benefit.title}
                  description={benefit.description}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/resources"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-300 focus-visible:ring-offset-2"
            >
              Explore Resources
            </a>
            <a href="/committees" className="btn-primary">
              Learn About Committees
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStep;
