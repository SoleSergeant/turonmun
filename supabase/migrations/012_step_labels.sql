-- Add editable step labels to form_settings.
-- The array maps 1-to-1 with the 5 form steps shown in the step indicator.

ALTER TABLE public.form_settings
  ADD COLUMN IF NOT EXISTS step_labels JSONB NOT NULL
    DEFAULT '["Personal Info","Experience","Committees","Essays","Details"]';
