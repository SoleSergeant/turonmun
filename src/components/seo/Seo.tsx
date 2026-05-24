import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { OrganizationJsonLd, EventJsonLd, BreadcrumbJsonLd } from './JsonLd';

type SeoProps = {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  article?: boolean;
  event?: {
    name: string;
    startDate: string;
    endDate: string;
    location: string;
    description: string;
  };
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
  children?: React.ReactNode;
};

const SITE_URL = 'https://turonmun.uz';
const DEFAULT_IMAGE = 'https://turonmun.uz/images/og-image.jpg';
const DEFAULT_TITLE = 'TuronMUN - Model United Nations Conference';
const DEFAULT_DESCRIPTION = 'Join TuronMUN for an enriching Model United Nations experience. Develop diplomacy, debate, and leadership skills with students from around the world.';
const DEFAULT_KEYWORDS = 'MUN, Model United Nations, TuronMUN, Uzbekistan, Tashkent, debate, diplomacy, UN, conference';

export const Seo: React.FC<SeoProps> = ({
  title = '',
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  article = false,
  event,
  breadcrumbs = [],
  children,
}) => {
  const { pathname } = useLocation();
  const url = `${SITE_URL}${pathname}`;
  const pageTitle = title ? `${title} | TuronMUN` : DEFAULT_TITLE;

  // Default breadcrumb includes home
  const allBreadcrumbs = [
    { name: 'Home', url: SITE_URL },
    ...breadcrumbs,
  ].map((item, index) => ({
    position: index + 1,
    name: item.name,
    item: item.url,
  }));

  return (
    <>
      <Helmet
        title={pageTitle}
        meta={[
          // Basic SEO
          { name: 'description', content: description },
          { name: 'keywords', content: keywords },
          
          // Open Graph / Facebook
          { property: 'og:type', content: article ? 'article' : 'website' },
          { property: 'og:url', content: url },
          { property: 'og:title', content: pageTitle },
          { property: 'og:description', content: description },
          { property: 'og:image', content: image },
          { property: 'og:site_name', content: 'TuronMUN' },
          
          // Twitter
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'twitter:title', content: pageTitle },
          { name: 'twitter:description', content: description },
          { name: 'twitter:image', content: image },
          
          // Mobile
          { name: 'theme-color', content: '#00235c' },
          { name: 'mobile-web-app-capable', content: 'yes' },
          { name: 'apple-mobile-web-app-title', content: 'TuronMUN' },
          { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
          
          // PWA
          { name: 'application-name', content: 'TuronMUN' },
          { name: 'msapplication-TileColor', content: '#00235c' },
          { name: 'msapplication-config', content: '/browserconfig.xml' },
        ]}
        link={[
          { rel: 'canonical', href: url },
          { rel: 'icon', type: 'image/png', href: '/favicon.ico' },
          { rel: 'apple-touch-icon', href: '/icons/icon-192x192.png' },
          { rel: 'manifest', href: '/manifest.json' },
        ]}
      >
        <html lang="en" />
      </Helmet>

      {/* Organization Schema */}
      <OrganizationJsonLd
        name="TuronMUN"
        url={SITE_URL}
        logo={`${SITE_URL}/icons/icon-512x512.png`}
        sameAs={[
          'https://www.instagram.com/turonmun',
          'https://www.facebook.com/turonmun',
          'https://twitter.com/turonmun',
        ]}
        contactPoint={{
          telephone: '+998-XX-XXX-XXXX', // Replace with actual phone
          contactType: 'customer service',
          email: 'admin@turonmun.com',
          areaServed: 'UZ',
          availableLanguage: ['en', 'uz', 'ru'],
        }}
      />

      {/* Event Schema */}
      {event && (
        <EventJsonLd
          name={event.name}
          startDate={event.startDate}
          endDate={event.endDate}
          location={{
            name: event.location,
            address: {
              streetAddress: '123 Main St', // Update with actual address
              addressLocality: 'Tashkent',
              addressCountry: 'UZ',
              postalCode: '100000',
            },
          }}
          url={url}
          description={event.description}
          image={image}
          organizer={{
            name: 'TuronMUN',
            url: SITE_URL,
          }}
          offers={{
            url: `${SITE_URL}/registration`,
            price: '0',
            priceCurrency: 'USD',
            availability: 'InStock',
            validFrom: new Date().toISOString(),
          }}
        />
      )}

      {/* Breadcrumb Schema */}
      {breadcrumbs.length > 0 && (
        <BreadcrumbJsonLd
          itemListElements={allBreadcrumbs}
        />
      )}

      {children}
    </>
  );
};

export default Seo;
