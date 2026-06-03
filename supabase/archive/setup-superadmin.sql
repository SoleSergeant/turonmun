-- =============================================
-- SETUP SUPERADMIN USER
-- =============================================
-- This script creates a superadmin user with full access

-- Create superadmin user
INSERT INTO admin_users (email, password_hash, full_name, role) VALUES
('numonovsamandarferps@gmail.com', '$2b$10$K7L/gGXvMZo0pEMZFMfZJ.QCkQjZBOGc.bZFRZEOZYEMHaWMKHXbG', 'Saman Numonov', 'superadmin')
ON CONFLICT (email) DO NOTHING;

-- Update existing admin to superadmin if needed
UPDATE admin_users 
SET role = 'superadmin' 
WHERE email = 'numonovsamandarferps@gmail.com';

-- =============================================
-- UPDATE RLS POLICIES FOR SUPERADMIN ACCESS
-- =============================================

-- Drop existing policies and recreate with superadmin access

-- Chair Assignments Policies (safe if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'chair_assignments'
  ) THEN
    DROP POLICY IF EXISTS "Chairs can view their own assignments" ON chair_assignments;
    DROP POLICY IF EXISTS "Admins can manage chair assignments" ON chair_assignments;

    CREATE POLICY "Chairs can view their own assignments" ON chair_assignments 
    FOR SELECT USING (admin_user_id = auth.uid());

    CREATE POLICY "Admins and Superadmins can manage chair assignments" ON chair_assignments 
    FOR ALL USING (
      EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'superadmin')) OR
      admin_user_id = auth.uid()
    );
  END IF;
END $$;

-- Country Assignments Policies (safe if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'country_assignments'
  ) THEN
    DROP POLICY IF EXISTS "Delegates can view their own assignments" ON country_assignments;
    DROP POLICY IF EXISTS "Chairs can view assignments in their committee" ON country_assignments;
    DROP POLICY IF EXISTS "Admins can manage country assignments" ON country_assignments;

    CREATE POLICY "Delegates can view their own assignments" ON country_assignments 
    FOR SELECT USING (application_id IN (
      SELECT id FROM applications WHERE email = auth.email()
    ));

    CREATE POLICY "Chairs can view assignments in their committee" ON country_assignments 
    FOR SELECT USING (committee_id IN (
      SELECT committee_id FROM chair_assignments WHERE admin_user_id = auth.uid()
    ));

    CREATE POLICY "Admins and Superadmins can manage country assignments" ON country_assignments 
    FOR ALL USING (
      EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );
  END IF;
END $$;

-- Position Papers Policies (safe if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'position_papers'
  ) THEN
    DROP POLICY IF EXISTS "Delegates can view their own papers" ON position_papers;
    DROP POLICY IF EXISTS "Chairs can view papers in their committee" ON position_papers;
    DROP POLICY IF EXISTS "Admins can manage all papers" ON position_papers;

    CREATE POLICY "Delegates can view their own papers" ON position_papers 
    FOR SELECT USING (application_id IN (
      SELECT id FROM applications WHERE email = auth.email()
    ));

    CREATE POLICY "Chairs can view papers in their committee" ON position_papers 
    FOR ALL USING (committee_id IN (
      SELECT committee_id FROM chair_assignments WHERE admin_user_id = auth.uid()
    ));

    CREATE POLICY "Admins and Superadmins can manage all papers" ON position_papers 
    FOR ALL USING (
      EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );
  END IF;
END $$;

-- Messages Policies (safe if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
    DROP POLICY IF EXISTS "Users can send messages" ON messages;
    DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

    CREATE POLICY "Users can view their own messages" ON messages 
    FOR SELECT USING (
      (sender_type = 'admin' AND sender_id = auth.uid()) OR
      (sender_type = 'delegate' AND sender_id IN (
        SELECT id FROM applications WHERE email = auth.email()
      )) OR
      (recipient_type = 'admin' AND recipient_id = auth.uid()) OR
      (recipient_type = 'delegate' AND recipient_id IN (
        SELECT id FROM applications WHERE email = auth.email()
      )) OR
      EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'superadmin')
    );

    CREATE POLICY "Users can send messages" ON messages 
    FOR INSERT WITH CHECK (
      (sender_type = 'admin' AND sender_id = auth.uid()) OR
      (sender_type = 'delegate' AND sender_id IN (
        SELECT id FROM applications WHERE email = auth.email()
      ))
    );

    CREATE POLICY "Users can update their own messages" ON messages 
    FOR UPDATE USING (
      sender_id = auth.uid() OR
      EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'superadmin')
    );
  END IF;
END $$;

-- Announcements Policies (safe if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'announcements'
  ) THEN
    DROP POLICY IF EXISTS "Chairs can manage their announcements" ON announcements;
    DROP POLICY IF EXISTS "Delegates can view announcements" ON announcements;

    CREATE POLICY "Chairs and Superadmins can manage announcements" ON announcements 
    FOR ALL USING (
      sender_id = auth.uid() OR
      committee_id IN (
        SELECT committee_id FROM chair_assignments WHERE admin_user_id = auth.uid()
      ) OR
      EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'superadmin')
    );

    CREATE POLICY "Delegates can view announcements" ON announcements 
    FOR SELECT USING (is_published = true AND (
      target_audience = 'all' OR 
      (target_audience = 'delegates' AND committee_id IN (
        SELECT assigned_committee_id FROM applications WHERE email = auth.email()
      ))
    ));
  END IF;
END $$;

-- Announcement Read Track Policies (safe if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'announcement_read_track'
  ) THEN
    DROP POLICY IF EXISTS "Delegates can track their reads" ON announcement_read_track;
    DROP POLICY IF EXISTS "Chairs can view read stats" ON announcement_read_track;

    CREATE POLICY "Delegates can track their reads" ON announcement_read_track 
    FOR ALL USING (application_id IN (
      SELECT id FROM applications WHERE email = auth.email()
    ));

    CREATE POLICY "Chairs and Superadmins can view read stats" ON announcement_read_track 
    FOR SELECT USING (announcement_id IN (
      SELECT id FROM announcements WHERE sender_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'superadmin'
    ));
  END IF;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================

-- Check superadmin user
SELECT email, full_name, role, created_at FROM admin_users WHERE email = 'numonovsamandarferps@gmail.com';

-- Check all admin users with roles
SELECT email, full_name, role, is_active FROM admin_users ORDER BY role, email;

-- =============================================
-- LOGIN INFORMATION
-- =============================================
-- Superadmin can now log in with:
-- Email: numonovsamandarferps@gmail.com
-- Password: admin123

-- Superadmin has access to:
-- /admin/dashboard - Full admin dashboard
-- /chair-dashboard - All chair dashboards (any committee)
-- All other routes and functionality

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
-- Superadmin setup completed successfully!
-- The user numonovsamandarferps@gmail.com now has full access to all parts of the system.
