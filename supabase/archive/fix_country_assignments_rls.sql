-- Fix RLS policies for country_assignments table
-- This allows the admin (authenticated user) to perform all operations

-- Drop any conflicting policies
DROP POLICY IF EXISTS "Allow all for authenticated" ON country_assignments;
DROP POLICY IF EXISTS "Admins can manage country assignments" ON country_assignments;

-- Create a permissive policy for all authenticated users
CREATE POLICY "Allow all for authenticated" ON country_assignments
FOR ALL USING (auth.role() = 'authenticated');

-- Also ensure the anon key can read (for localStorage-based admin auth)
DROP POLICY IF EXISTS "Allow anon full access to country_assignments" ON country_assignments;
CREATE POLICY "Allow anon full access to country_assignments" ON country_assignments
FOR ALL USING (true);
