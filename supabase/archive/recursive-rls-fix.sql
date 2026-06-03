# recursive-rls-fix.sql

-- 1. Create a "Security Definer" function. 
-- This function runs with the privileges of the user who created it, bypassing RLS.
-- This prevents the "infinite recursion" error because it doesn't trigger RLS rules when checking if you are an admin.
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Drop the recursive policies from previous attempts
DROP POLICY IF EXISTS "Admins can manage all admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can insert any admin_user" ON public.admin_users;

-- 3. Create the new, safe policy using the function
CREATE POLICY "Admins can manage all admin_users" ON public.admin_users
  FOR ALL
  USING (
    public.is_admin_user()
  )
  WITH CHECK (
    public.is_admin_user()
  );
