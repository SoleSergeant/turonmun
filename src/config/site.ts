export const siteConfig = {
  title: import.meta.env.VITE_APP_TITLE || 'Turon Model United Nations',
  description: import.meta.env.VITE_APP_DESCRIPTION || 'Official website for TuronMUN — the leading Model United Nations conference from Central Asia',
  url: import.meta.env.VITE_APP_URL || 'https://TuronMUN.uz',

  /** Set to a date string (ISO) in .env when Season 7 dates are confirmed */
  conferenceDate: import.meta.env.VITE_APP_CONFERENCE_DATE
    ? new Date(import.meta.env.VITE_APP_CONFERENCE_DATE)
    : null,
  conferenceLocation: import.meta.env.VITE_APP_CONFERENCE_LOCATION || 'Tashkent, Uzbekistan',
  /** Toggle registrations open/closed via VITE_APP_REGISTRATION_OPEN=true in .env */
  registrationOpen: import.meta.env.VITE_APP_REGISTRATION_OPEN === 'true',
  currentSeason: 7,
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
