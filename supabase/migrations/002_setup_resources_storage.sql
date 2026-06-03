
-- Enable Storage by creating a bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'resources' bucket
-- Allow public access to view/download files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'resources' );

-- Allow authenticated admins to upload files
-- Note: 'anon' role is often used in these setups if not using full auth, 
-- but 'authenticated' is safer. Adjust if needed.
CREATE POLICY "Admins can upload resources"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'resources' );

-- Allow admins to delete
CREATE POLICY "Admins can delete resources"
ON storage.objects FOR DELETE
USING ( bucket_id = 'resources' );

-- Update resources table columns if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='file_url') THEN
        ALTER TABLE public.resources ADD COLUMN file_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='file_type') THEN
        ALTER TABLE public.resources ADD COLUMN file_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='committee_id') THEN
        ALTER TABLE public.resources ADD COLUMN committee_id UUID REFERENCES public.committees(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='is_public') THEN
        ALTER TABLE public.resources ADD COLUMN is_public BOOLEAN DEFAULT true;
    END IF;
END $$;
