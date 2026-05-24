# comprehensive-rls-fix.sql

-- Drop the previous policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Admins can insert any admin_user" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage all admin_users" ON public.admin_users;

-- Create a comprehensive policy that allows Admins to do everything (SELECT, INSERT, UPDATE, DELETE)
-- on the admin_users table for ANY user ID.
CREATE POLICY "Admins can manage all admin_users" ON public.admin_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.id = auth.uid() AND au.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.id = auth.uid() AND au.role = 'admin'
    )
  );
