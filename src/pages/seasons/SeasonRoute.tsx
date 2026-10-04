import React, { lazy } from 'react';
import { useParams } from 'react-router-dom';
import { usePastSeasons, seasonSlug } from '@/content/seasons';
import SeasonTemplate from './SeasonTemplate';

const NotFound = lazy(() => import('../NotFound'));

// Seasons 1–5 and CAMU keep their own hand-designed pages; their text and
// photos still come from Site content. Any other season uses SeasonTemplate.
const DESIGNED: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  season1: lazy(() => import('./Season1')),
  season2: lazy(() => import('./Season2')),
  season3: lazy(() => import('./Season3')),
  season4: lazy(() => import('./Season4')),
  season5: lazy(() => import('./Season5')),
  'turonmun-camu': lazy(() => import('./SeasonCAMU')),
};

/** /seasons/:slug — finds the season whose address ends in :slug. */
export default function SeasonRoute() {
  const { slug = '' } = useParams();
  const season = usePastSeasons().find(s => seasonSlug(s.route).toLowerCase() === slug.toLowerCase());
  if (!season) return <NotFound />;
  const Designed = DESIGNED[season.id];
  return Designed ? <Designed /> : <SeasonTemplate seasonData={season} />;
}
