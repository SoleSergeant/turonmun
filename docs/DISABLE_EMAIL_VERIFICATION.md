# Disable Email Verification (Optional)

If you want users to log in **immediately after signup without email verification**, follow these steps:

## Option 1: Disable Email Verification (Recommended for Testing)

1. Go to **Supabase Dashboard**
2. Click **Authentication** → **Providers**
3. Click **Email** provider
4. Find **"Confirm email"** toggle
5. **Turn it OFF** (disable email confirmation)
6. Click **Save**

Now users can:
- Sign up with any email
- Log in immediately without verification
- No email verification required

---

## Option 2: Keep Email Verification (Recommended for Production)

If you want to keep email verification:

1. Users sign up
2. They receive a verification email
3. They click the link in the email
4. They can then log in

**To test this:**
- Use a real email address during signup
- Check your email inbox (or spam folder)
- Click the verification link
- Then try to log in

---

## Option 3: Test Without Real Email

If you don't have email configured:

1. Go to **Authentication → Email Templates**
2. Check if email is properly configured
3. If not configured, Supabase will show a warning

**For development**, use Option 1 (disable email verification).

---

## Current Status

**Email verification is currently ENABLED** in your Supabase project.

To fix the "Invalid login credentials" error:

### Quick Fix:
1. Go to Supabase Dashboard
2. Authentication → Providers → Email
3. Turn OFF "Confirm email"
4. Save
5. Try signing up and logging in again

### Alternative:
- Use a real email address
- Check your email for verification link
- Click the link
- Then log in

---

## Why This Happens

When email verification is enabled:
- User signs up ✅
- User gets verification email 📧
- User must click link in email ✅
- Only then can user log in ✅

Without verification:
- User signs up ✅
- User can log in immediately ✅

---

## Recommended for Your Project

For **TuronMUN**, I recommend:
- **Development**: Disable email verification (Option 1)
- **Production**: Enable email verification (Option 2)

This way, users can test immediately during development, but in production, you ensure real email addresses.
