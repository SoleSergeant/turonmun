import React from 'react';

type JsonLdProps = {
  type?: string;
  data: any;
};

export const JsonLd: React.FC<JsonLdProps> = ({ type = 'application/ld+json', data }) => {
  return (
    <script
      type={type}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          ...data,
        }),
      }}
    />
  );
};

type OrganizationJsonLdProps = {
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
  contactPoint?: {
    telephone: string;
    contactType: string;
    email?: string;
    areaServed?: string | string[];
    availableLanguage?: string | string[];
  };
};

export const OrganizationJsonLd: React.FC<OrganizationJsonLdProps> = ({
  name,
  url,
  logo,
  sameAs = [],
  contactPoint,
}) => {
  const data = {
    '@type': 'Organization',
    name,
    url,
    logo,
    sameAs: Array.isArray(sameAs) ? sameAs : [sameAs],
  };

  if (contactPoint) {
    data.contactPoint = {
      '@type': 'ContactPoint',
      ...contactPoint,
    };
  }


  return <JsonLd data={data} />;
};

type EventJsonLdProps = {
  name: string;
  startDate: string;
  endDate: string;
  location: {
    name: string;
    address: {
      streetAddress: string;
      addressLocality: string;
      postalCode: string;
      addressRegion?: string;
      addressCountry: string;
    };
  };
  url: string;
  description: string;
  image?: string;
  organizer?: {
    name: string;
    url: string;
  };
  offers?: {
    url: string;
    price: string;
    priceCurrency: string;
    availability?: string;
    validFrom?: string;
  };
};

export const EventJsonLd: React.FC<EventJsonLdProps> = ({
  name,
  startDate,
  endDate,
  location,
  url,
  description,
  image,
  organizer,
  offers,
}) => {
  const data = {
    '@type': 'Event',
    name,
    startDate,
    endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: location.name,
      address: {
        '@type': 'PostalAddress',
        ...location.address,
      },
    },
    description,
    ...(image && { image: [image] }),
    ...(organizer && {
      organizer: {
        '@type': 'Organization',
        ...organizer,
      },
    }),
    ...(offers && {
      offers: {
        '@type': 'Offer',
        ...offers,
      },
    }),
  };

  return <JsonLd data={data} />;
};

type BreadcrumbJsonLdProps = {
  itemListElements: Array<{
    position: number;
    name: string;
    item: string;
  }>;
};

export const BreadcrumbJsonLd: React.FC<BreadcrumbJsonLdProps> = ({ itemListElements }) => {
  const data = {
    '@type': 'BreadcrumbList',
    itemListElement: itemListElements.map((item) => ({
      '@type': 'ListItem',
      ...item,
    })),
  };

  return <JsonLd data={data} />;
};
