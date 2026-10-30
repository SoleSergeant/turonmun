import type { CSSProperties } from 'react';

export type TeamMember = {
  id?: string;
  name: string;
  role: string | null;
  team: string;
  photo_url: string | null;
  link_url: string | null;
  sort_order: number;
  is_visible: boolean;
  is_past: boolean;
  /** Focus point in percent (50/50 = centre) and zoom (1 = fit), from migration 049. */
  photo_x: number;
  photo_y: number;
  photo_zoom: number;
};

/** Frames a team photo inside its square/circle box the way the admin set it. */
export const photoStyle = (m: Pick<TeamMember, 'photo_x' | 'photo_y' | 'photo_zoom'>): CSSProperties => {
  const pos = `${m.photo_x ?? 50}% ${m.photo_y ?? 50}%`;
  return { objectPosition: pos, transformOrigin: pos, transform: `scale(${m.photo_zoom ?? 1})` };
};
