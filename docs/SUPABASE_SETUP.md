# Supabase Integration Setup Guide

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - **Name**: TuronMUN
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
5. Wait for project to be created (5-10 minutes)

## Step 2: Get API Credentials

1. Go to **Settings → API** in your Supabase dashboard
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **Anon Key** (under "Project API keys")

## Step 3: Set Environment Variables

Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Example:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Create Users Table (100% Verified)

### ✅ RECOMMENDED: Copy-Paste Method

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. **Copy the entire SQL below** and paste it:

```sql
-- Create users table to store additional user information
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own data
CREATE POLICY "Users can read their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create policy to allow new users to insert their data
CREATE POLICY "Users can insert their own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
```

4. Click **Run** button
5. You should see: **"Success. No rows returned"**
6. Go to **Database → Tables** and verify `users` table exists

## Step 5: Configure Email Settings (Optional but Recommended)

1. Go to **Authentication → Email Templates**
2. Customize email templates for:
   - Confirmation email
   - Password reset email
   - Magic link email

## Step 6: Set Redirect URLs

1. Go to **Authentication → URL Configuration**
2. Add these redirect URLs:
   - `http://localhost:8080/auth/callback` (development)
   - `http://localhost:5173/auth/callback` (Vite default)
   - `https://yourdomain.com/auth/callback` (production)

## Step 7: Test the Integration

1. Start your dev server: `npm run dev`
2. Navigate to `http://localhost:8080/signup`
3. Create a test account
4. Check Supabase dashboard → **Authentication → Users** to see the new user
5. Check **Database → users table** to see the user data

## Features Implemented

### ✅ Authentication
- **Signup**: Create new accounts with email/password
- **Login**: Sign in with existing credentials
- **Logout**: Sign out functionality
- **Password Reset**: Reset forgotten passwords

### ✅ User Data Collection
- Full name
- Email address
- Automatic timestamps (created_at, updated_at)

### ✅ Security
- Row Level Security (RLS) enabled
- Password hashing (handled by Supabase)
- Email verification (optional)
- Secure API key management

### ✅ Error Handling
- User-friendly error messages
- Validation (password match, minimum length)
- Network error handling

## File Structure

```
src/
├── hooks/
│   └── useAuth.ts              # Authentication hook
├── pages/
│   ├── Login.tsx               # Login page (Supabase integrated)
│   └── Signup.tsx              # Signup page (Supabase integrated)
├── integrations/
│   └── supabase/
│       └── client.ts           # Supabase client setup
└── components/
    └── Navbar.tsx              # Updated with auth links

supabase/
└── migrations/
    └── 001_create_users_table.sql  # Database schema
```

## Troubleshooting

### Issue: "VITE_SUPABASE_URL is not defined"
**Solution**: Make sure `.env.local` is in the project root and restart your dev server.

### Issue: "Invalid API key"
**Solution**: Double-check your Anon Key from Supabase dashboard. Make sure there are no extra spaces.

### Issue: "Email already exists"
**Solution**: This is expected if you try to sign up with the same email twice. Use a different email or reset the user in Supabase dashboard.

### Issue: "Password should be at least 6 characters"
**Solution**: Supabase requires minimum 6 character passwords. Use a longer password.

### Issue: Users table not created
**Solution**: Run the SQL migration manually in the Supabase SQL Editor.

## Next Steps

1. **Email Verification**: Enable email confirmation in Authentication settings
2. **Social Login**: Add Google/GitHub OAuth (optional)
3. **User Profile**: Create a profile page to edit user information
4. **Admin Dashboard**: View all users and manage accounts
5. **Backup**: Set up automated backups in Supabase settings

## Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Support

For issues or questions:
1. Check Supabase logs: **Logs** in dashboard
2. Review browser console for errors
3. Check `.env.local` configuration
4. Verify database schema in **Database → Tables**
