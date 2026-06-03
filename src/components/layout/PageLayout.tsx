import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface PageLayoutProps {
  children: React.ReactNode;
}

/**
 * PageLayout component that provides a consistent layout
 * for all pages in the application.
 */
const PageLayout: React.FC<PageLayoutProps> = ({ 
  children
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <div className="min-h-[calc(100vh-64px-80px)]">
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PageLayout;
