import { usePastSeasons } from '@/content/seasons';

export const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  {
    name: 'Event Updates',
    path: '/event-updates',
    hasDropdown: true,
    dropdownItems: [
      { name: 'Committees', path: '/committees' },
      { name: 'Schedule', path: '/schedule' },
      { name: 'Resources', path: '/resources' },
      { name: 'Awards', path: '/awards' },
    ]
  },
  // Season entries are filled in by useNavLinks() from Site content → Seasons.
  { name: 'Past Conferences', path: '/past-conferences', hasDropdown: true, dropdownItems: [] as { name: string; path: string }[] },
  { name: 'Contact', path: '/contact' },
];

/** Menu links, with the Past Conferences dropdown built from the season list. */
export function useNavLinks() {
  const seasons = usePastSeasons();
  return navLinks.map(link =>
    link.name === 'Past Conferences'
      ? {
          ...link,
          dropdownItems: seasons
            .filter(s => s.show_in_menu !== false && s.route)
            .map(s => ({ name: s.menu_label || s.title, path: s.route })),
        }
      : link,
  );
}

export default navLinks;
