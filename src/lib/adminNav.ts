/**
 * The admin menu: two projects, each a list of groups; a group's tabs are
 * the existing admin pages at their existing paths, so every link and
 * bookmark keeps working. Shared groups sit at the bottom of both menus.
 * Who sees what stays as before: each tab keeps its page's roles, which must
 * match the `allow` lists on the routes in App.tsx (and migration 036).
 * Pure data + helpers (unit-tested in tests/adminNav.test.ts).
 */

export type Role = 'sg' | 'academics' | 'logistics' | 'registration' | 'judge' | 'chair' | 'co_chair';
export type BadgeKey = 'applications' | 'debaters' | 'messages';
export type ProjectId = 'mun' | 'debate';

export interface NavTab { path: string; label: string; roles: Role[] }
export interface NavGroup { id: string; label: string; icon: string; badge?: BadgeKey; tabs: NavTab[] }
export interface NavProject { id: ProjectId; label: string; groups: NavGroup[] }

const SG: Role[] = ['sg'];
const ACADEMIC: Role[] = ['sg', 'academics'];

export const PROJECTS: NavProject[] = [
  {
    id: 'mun', label: 'TuronMUN', groups: [
      { id: 'home', label: 'Home', icon: 'home', tabs: [
        { path: '/analytics', label: 'Analytics', roles: ACADEMIC },
        { path: '/dashboard', label: 'Overview', roles: ['sg', 'academics', 'logistics'] },
      ] },
      { id: 'applications', label: 'Applications', icon: 'users', badge: 'applications', tabs: [
        { path: '/delegates', label: 'Delegates', roles: ACADEMIC },
        { path: '/chairs', label: 'Chairs', roles: ACADEMIC },
        { path: '/volunteers', label: 'Volunteers', roles: ['sg', 'logistics'] },
        { path: '/forms', label: 'Form and fees', roles: SG },
      ] },
      { id: 'committees', label: 'Committees', icon: 'globe', tabs: [
        { path: '/committees', label: 'Setup', roles: ACADEMIC },
        { path: '/allocation', label: 'Seats', roles: ACADEMIC },
      ] },
      { id: 'programme', label: 'Programme', icon: 'calendar', tabs: [
        { path: '/schedule', label: 'Schedule', roles: ACADEMIC },
        { path: '/resources', label: 'Resources', roles: ACADEMIC },
      ] },
      { id: 'checkin', label: 'Check-in', icon: 'qr', tabs: [
        { path: '/check-in', label: 'Check-in', roles: ['sg', 'academics', 'logistics', 'registration'] },
      ] },
      { id: 'results', label: 'Results', icon: 'award', tabs: [
        { path: '/awards', label: 'Awards', roles: ACADEMIC },
        { path: '/certificates', label: 'Certificates', roles: ACADEMIC },
      ] },
      { id: 'inbox', label: 'Inbox', icon: 'mail', badge: 'messages', tabs: [
        { path: '/messages', label: 'Messages', roles: SG },
        { path: '/telegram', label: 'Telegram', roles: ACADEMIC },
      ] },
    ],
  },
  {
    id: 'debate', label: 'Turon Debate', groups: [
      { id: 'dhome', label: 'Home', icon: 'home', tabs: [
        { path: '/debate-home', label: 'Overview', roles: ACADEMIC },
      ] },
      { id: 'dreg', label: 'Registrations', icon: 'mic', badge: 'debaters', tabs: [
        { path: '/debate', label: 'Registrations', roles: ACADEMIC },
      ] },
      { id: 'dday', label: 'Event day', icon: 'swords', tabs: [
        { path: '/debate-day', label: 'Teams and rounds', roles: ACADEMIC },
      ] },
      { id: 'djudge', label: 'Judging', icon: 'gavel', tabs: [
        { path: '/judging', label: 'Judging', roles: ['sg', 'academics', 'judge'] },
      ] },
      { id: 'dcert', label: 'Certificates', icon: 'scroll', tabs: [
        { path: '/certificates', label: 'Certificates', roles: ACADEMIC },
      ] },
      { id: 'dtelegram', label: 'Telegram', icon: 'send', tabs: [
        { path: '/telegram', label: 'Telegram', roles: ACADEMIC },
      ] },
      { id: 'dsite', label: 'Debate website', icon: 'monitor', tabs: [
        { path: '/debate-site', label: 'Debate site', roles: SG },
      ] },
    ],
  },
];

/** Bottom of both menus. */
export const SHARED: NavGroup[] = [
  { id: 'website', label: 'Website', icon: 'monitor', tabs: [
    { path: '/content', label: 'Content', roles: SG },
    { path: '/team', label: 'Team', roles: SG },
  ] },
  { id: 'settings', label: 'Settings', icon: 'settings', tabs: [
    { path: '/accounts', label: 'Admin accounts', roles: SG },
    { path: '/seasons', label: 'Seasons', roles: SG },
    { path: '/activity', label: 'Activity log', roles: SG },
  ] },
];

/** Groups with only the tabs this role may open; groups left empty are dropped. */
export function visibleGroups(groups: NavGroup[], role: Role | null): NavGroup[] {
  if (!role) return [];
  return groups
    .map(g => ({ ...g, tabs: g.tabs.filter(t => t.roles.includes(role)) }))
    .filter(g => g.tabs.length > 0);
}

/** Projects this role has at least one page in (one → no switcher). */
export function visibleProjects(role: Role | null): NavProject[] {
  return PROJECTS
    .map(p => ({ ...p, groups: visibleGroups(p.groups, role) }))
    .filter(p => p.groups.length > 0);
}

/**
 * Which project and group a path belongs to. A page in both projects
 * (Certificates) or in the shared groups keeps the project you were in.
 */
export function locate(path: string, current: ProjectId): { project: ProjectId; group: NavGroup } | null {
  const has = (g: NavGroup) => g.tabs.some(t => t.path === path);
  const homes = PROJECTS.filter(p => p.groups.some(has));
  const inCurrent = PROJECTS.find(p => p.id === current)?.groups.find(has);
  if (inCurrent) return { project: current, group: inCurrent };
  if (homes.length) return { project: homes[0].id, group: homes[0].groups.find(has)! };
  const shared = SHARED.find(has);
  return shared ? { project: current, group: shared } : null;
}

/** The project the admin is working in, kept per browser tab. */
export const PROJECT_KEY = 'admin-project';
export function readProject(): ProjectId {
  try { return sessionStorage.getItem(PROJECT_KEY) === 'debate' ? 'debate' : 'mun'; } catch { return 'mun'; }
}
