# How to Fix Admin Access

Since you are locked out of the admin panel (demo mode works but can't save changes, and real admin is unconfirmed), follow these steps to create a working Superadmin account.

## Step 1: Sign Up a New User
1. Go to the website's Sign Up page: `/signup` (or `/register`).
2. Create a new account with a real email (e.g., `myadmin@turonmun.com`).
3. Since you disabled email confirmation, you should be logged in immediately.

## Step 2: Promote to Admin via Supabase Dashboard
Since you cannot access the admin panel to promote yourself, you must use the Supabase Dashboard.

1. Go to your **Supabase Project Dashboard**.
2. Click on **SQL Editor** (icon on the left).
3. Click **New Query**.
4. Paste the following SQL code (replace the email with the one you just used):

```sql
-- Replace 'myadmin@turonmun.com' with the email you just signed up with
INSERT INTO public.admin_users (id, email, full_name, role, is_active, password_hash)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'Admin User'), 
  'superadmin', 
  true,
  'managed_by_supabase_auth' -- Placeholder for password_hash
FROM auth.users
WHERE email = 'myadmin@turonmun.com' -- Change this to your email
ON CONFLICT (email) DO UPDATE 
SET 
  id = EXCLUDED.id, -- IMPORTANT: Updates the ID if you re-signed up
  role = 'superadmin', 
  is_active = true;
```

5. Click **Run**.

## Step 3: Fix Database Permissions (Critical)
If you still get "Access Denied" or 406 errors, it means the database is locking you out. Run this query to fix permissions:

```sql
-- 1. Create a secure function to check admin status (Bypasses RLS loop)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE id = auth.uid()
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Reset Policies
DROP POLICY IF EXISTS "Users can read own admin data" ON admin_users;
DROP POLICY IF EXISTS "Superadmins can manage all admin users" ON admin_users;
DROP POLICY IF EXISTS "Allow users to read own admin record" ON admin_users;
DROP POLICY IF EXISTS "Allow superadmins to read all admin records" ON admin_users;
DROP POLICY IF EXISTS "Allow superadmins to manage admin records" ON admin_users;

-- 3. Create Safe Policies
-- Allow everyone to read their own record (stops recursion)
CREATE POLICY "Read Own Admin Record" ON admin_users
FOR SELECT USING (auth.uid() = id);

-- Allow superadmins to do everything (uses the safe function)
CREATE POLICY "Superadmin Full Access" ON admin_users
FOR ALL USING (public.is_superadmin());
```

## Step 4: Log In as Admin
1. Go back to `/admin`.
2. Enter your new email (`myadmin@turonmun.com`) and the password you created.
3. You should now have full access to add other chairs and manage the system.
