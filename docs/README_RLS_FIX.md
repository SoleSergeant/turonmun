# How to Fix the "Row-Level Security" Error for Admin Users

The reason promoting existing users to Chairs fails with `"new row violates row-level security policy for table 'admin_users'"` is because your Supabase database has strict Row-Level Security (RLS) on the `admin_users` table.

By default, Supabase only allows an authenticated user to insert rows if the `id` being inserted equals their own `auth.uid()`. When you (the Admin) try to promote an *existing* user, your Admin account tries to insert a row with *the other user's* ID, which Supabase blocks. 

The previous "Add Chair" flow only worked because it signed up a brand-new user session behind the scenes, so that new user session inserted its *own* row into `admin_users`.

**To fix this so Admins can promote any existing user, you need to run this quick SQL command in your Supabase dashboard:**

1. Go to your **Supabase Dashboard**
2. Click on **SQL Editor** on the left menu.
3. Click "New Query" and paste the following SQL exactly as written:

```sql
CREATE POLICY "Admins can insert any admin_user" ON public.admin_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.id = auth.uid() AND au.role = 'admin'
    )
  );
```

4. Click **Run**.

Once you run this query, your Admin account will have the permission to insert rows for *other* users into the `admin_users` table, and the promotion flow will work perfectly!
