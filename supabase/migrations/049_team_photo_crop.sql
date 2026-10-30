-- 049_team_photo_crop.sql
-- How each Team photo is framed, set in Admin → Team by dragging and
-- zooming: focus point in percent (50/50 = centre) and zoom (1 = fit).
-- Safe to re-run.

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS photo_x    real NOT NULL DEFAULT 50 CHECK (photo_x BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS photo_y    real NOT NULL DEFAULT 50 CHECK (photo_y BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS photo_zoom real NOT NULL DEFAULT 1  CHECK (photo_zoom BETWEEN 1 AND 3);

NOTIFY pgrst, 'reload schema';
