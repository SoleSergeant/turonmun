# Google Login Setup for TuronMUN

## Overview
Google OAuth login has been successfully integrated into the TuronMUN application. Users can now sign in and sign up using their Google accounts.

## Configuration

### Supabase Setup (Already Done)
Your Google OAuth provider is already configured in Supabase with:
- **Project URL**: https://sasuvkcqdqmmjobmgida.supabase.co
- **Callback URL**: https://sasuvkcqdqmmjobmgida.supabase.co/auth/v1/callback

### Allowed Redirect URLs
The following URLs are configured for OAuth redirects:
- **Production**: https://turonmun.com/auth/callback
- **Development**: http://localhost:5793/auth/callback

## Implementation Details

### Files Modified/Created

1. **`src/hooks/useAuth.ts`**
   - Added `signInWithGoogle()` function
   - Handles OAuth sign-in with Google provider
   - Redirects to `/auth/callback` after authentication

2. **`src/pages/Login.tsx`**
   - Added Google login button
   - Styled with Google's official colors
   - Integrated with the existing login form

3. **`src/pages/Signup.tsx`**
   - Added Google signup button
   - Allows new users to create accounts via Google
   - Integrated with the existing signup form

4. **`src/pages/AuthCallback.tsx`** (New)
   - Handles OAuth callback from Supabase
   - Automatically creates/updates user data in the database
   - Redirects to home page on successful authentication

5. **`src/App.tsx`**
   - Added route: `/auth/callback` → AuthCallback component

## How It Works

### Login Flow
1. User clicks "Sign in with Google" button on `/login`
2. Redirected to Google OAuth consent screen
3. After consent, redirected to `/auth/callback`
4. AuthCallback component:
   - Retrieves session from Supabase
   - Upserts user data into the `users` table
   - Redirects to home page

### Signup Flow
1. User clicks "Sign up with Google" button on `/signup`
2. Same OAuth flow as login
3. User account is created automatically in Supabase Auth
4. User data is stored in the `users` table

## Database Requirements

The `users` table should have the following structure:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Testing

### Local Development (http://localhost:5793)
1. Go to http://localhost:5793/login
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Should redirect to home page

### Production (https://turonmun.com)
1. Go to https://turonmun.com/login
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Should redirect to home page

## Troubleshooting

### "Redirect URL mismatch" Error
- Ensure the callback URL in your Supabase Google provider settings matches your domain
- For localhost: `http://localhost:5793/auth/callback`
- For production: `https://turonmun.com/auth/callback`

### User Not Created in Database
- Check that the `users` table exists and has proper permissions
- Verify RLS (Row Level Security) policies allow inserts

### OAuth Popup Blocked
- Ensure the Google sign-in is triggered by a user click (not automatic)
- Check browser popup blocker settings

## Security Notes

1. **No API Keys in Frontend**: Google OAuth is handled entirely by Supabase
2. **Secure Redirects**: All redirects are to your own domain
3. **Session Management**: Supabase handles secure session tokens
4. **User Data**: Only email and full name are stored; passwords are never handled

## Next Steps

1. Test Google login on both localhost and production
2. Monitor user creation in Supabase dashboard
3. Consider adding user profile completion after first Google login
4. Add email verification if needed (can be configured in Supabase)

## References

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
