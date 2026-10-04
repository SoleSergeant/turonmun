import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { OrganizationJsonLd, EventJsonLd, BreadcrumbJsonLd } from './JsonLd';
import { useContent } from '@/content/store';

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

export const Seo: React.FC<SeoProps> = ({
  title = '',
  description: descriptionProp,
  keywords: keywordsProp,
  image: imageProp,
  article = false,
  event,
  breadcrumbs = [],
  children,
}) => {
  // Defaults are edited in Admin → Site content → Search & sharing.
  const seo = useContent('seo');
  const general = useContent('general');
  const SITE_URL = seo.site_url.replace(/\/$/, '');
  const description = descriptionProp || seo.default_description;
  const keywords = keywordsProp || seo.keywords;
  const image = imageProp || seo.share_image;
  const { pathname } = useLocation();
  const url = `${SITE_URL}${pathname}`;
  const pageTitle = title ? `${title} | ${general.site_name}` : seo.default_title;

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
          { property: 'og:site_name', content: general.site_name },
          
          // Twitter
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'twitter:title', content: pageTitle },
          { name: 'twitter:description', content: description },
          { name: 'twitter:image', content: image },
          
          // Mobile
          { name: 'theme-color', content: '#00235c' },
          { name: 'mobile-web-app-capable', content: 'yes' },
          { name: 'apple-mobile-web-app-title', content: general.site_name },
          { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
          
          // PWA
          { name: 'application-name', content: general.site_name },
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
        name={general.site_name}
        url={SITE_URL}
        logo={`${SITE_URL}/icons/icon-512x512.png`}
        sameAs={[general.instagram_url, general.telegram_url].filter(Boolean)}
        contactPoint={{
          telephone: general.contact_phone,
          contactType: 'customer service',
          email: general.contact_email,
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
            address: { addressCountry: 'UZ' },
          }}
          url={url}
          description={event.description}
          image={image}
          organizer={{
            name: general.site_name,
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
