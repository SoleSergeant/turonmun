
-- 1. ADD DELETE POLICY FOR APPLICATIONS
-- This allows authenticated admin users to delete application records
DROP POLICY IF EXISTS "Admins can delete applications" ON applications;
CREATE POLICY "Admins can delete applications" ON applications 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- 2. ENSURE CASCADE DELETE FOR DEPENDENT TABLES
-- If the application is referenced elsewhere, standard delete will fail.
-- These commands ensure that when an application is deleted, related data is also removed.

-- For feedback table
ALTER TABLE feedback 
DROP CONSTRAINT IF EXISTS feedback_application_id_fkey,
ADD CONSTRAINT feedback_application_id_fkey 
FOREIGN KEY (application_id) 
REFERENCES applications(id) 
ON DELETE CASCADE;

-- For country_assignments (if it exists)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'country_assignments') THEN
        ALTER TABLE country_assignments 
        DROP CONSTRAINT IF EXISTS country_assignments_application_id_fkey,
        ADD CONSTRAINT country_assignments_application_id_fkey 
        FOREIGN KEY (application_id) 
        REFERENCES applications(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- For position_papers (if it exists)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'position_papers') THEN
        ALTER TABLE position_papers 
        DROP CONSTRAINT IF EXISTS position_papers_application_id_fkey,
        ADD CONSTRAINT position_papers_application_id_fkey 
        FOREIGN KEY (application_id) 
        REFERENCES applications(id) 
        ON DELETE CASCADE;
    END IF;
END $$;
