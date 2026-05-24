export const siteConfig = {
  title: import.meta.env.VITE_APP_TITLE || 'Turon Model United Nations',
  description: import.meta.env.VITE_APP_DESCRIPTION || 'Official website for FPS Model United Nations conferences',
  url: import.meta.env.VITE_APP_URL || 'https://TuronMUN.uz',

  conferenceDate: new Date(import.meta.env.VITE_APP_CONFERENCE_DATE || '2025-07-19T00:00:00'),
  conferenceLocation: import.meta.env.VITE_APP_CONFERENCE_LOCATION || 'Central Asian University',
  registrationOpen: import.meta.env.VITE_APP_REGISTRATION_OPEN === 'true',
  social: {
    twitter: 'https://twitter.com/TuronMUN',
    facebook: 'https://facebook.com/TuronMUN',
    instagram: 'https://instagram.com/TuronMUN',
    telegram: 'https://t.me/TuronMUN',
  },
  contact: {
    email: 'admin@turonmun.com',
    phone: '+998 90 123 45 67',
  },
  navigation: [
    {
      title: 'About',
      href: '/about',
    },
    {
      title: 'Committees',
      href: '/committees',
    },
    {
      title: 'Past Conferences',
      href: '/past-conferences',
    },
    {
      title: 'Schedule',
      href: '/schedule',
    },
    {
      title: 'Resources',
      href: '/resources',
    },
    {
      title: 'Contact',
      href: '/contact',
    },
  ],
}
