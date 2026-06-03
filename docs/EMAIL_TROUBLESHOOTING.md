# Email & Password Reset Troubleshooting Guide

## Issue 1: Logo Not Visible in Emails

### Problem
Logo appears broken or doesn't load in email clients.

### Solution
✅ **Fixed** - Updated all email templates to use absolute URLs:

```html
<img src="https://turonmun.com/logos/turonmun-logo.jpg" alt="TuronMUN Logo" style="max-width: 80px; height: auto;">
```

**Key Points**:
- Use **absolute URLs** (starting with `https://`), not relative paths
- Email clients don't support relative paths like `/logos/turonmun-logo.jpg`
- Add inline `style` attribute for email client compatibility
- Ensure the logo file is publicly accessible

### Testing
1. Send a test email from Supabase
2. Check if logo appears in email client
3. If still not visible, verify:
   - Logo file exists at `public/logos/turonmun-logo.jpg`
   - URL is accessible: `https://turonmun.com/logos/turonmun-logo.jpg`
   - Image format is supported (JPG, PNG, GIF)

---

## Issue 2: Password Reset Link Expired

### Problem
Error: `otp_expired` or "Email link is invalid or has expired"

### Root Cause
The OTP (One-Time Password) link expires too quickly. Default Supabase expiry is often 1 hour.

### Solution

#### Step 1: Go to Supabase Dashboard
1. Navigate to your Supabase project
2. Click **Authentication** in the left sidebar
3. Click **Providers**
4. Click **Email**

#### Step 2: Increase Email Link Expiry
Look for these settings:
- **OTP Expiry Duration** (or similar)
- **Email Link Expiry**
- **Token Expiry**

**Recommended Settings**:
- Development: 24 hours
- Production: 1-24 hours (your choice)

#### Step 3: Save Changes
1. Update the expiry duration
2. Click **Save**
3. Test with a new password reset

### Detailed Steps (with screenshots)

**In Supabase Dashboard**:
```
Authentication → Providers → Email → Settings
```

Look for field like:
- `OTP Expiry Duration` (in seconds)
- Default: `3600` (1 hour)
- Recommended: `86400` (24 hours)

**Change from**:
```
3600 seconds = 1 hour
```

**Change to**:
```
86400 seconds = 24 hours
```

### Alternative: Check Email Configuration

If you don't see expiry settings:

1. Go to **Authentication** → **Email Templates**
2. Check **Reset password** template
3. Verify the template has `{{ .ConfirmationURL }}`
4. Ensure **From Email** is set to `admin@turonmun.com`

---

## Issue 3: Reset Email Not Received

### Checklist

- [ ] Check spam/junk folder
- [ ] Verify email address is correct
- [ ] Ensure Supabase email is configured
- [ ] Check that `admin@turonmun.com` is verified in Supabase
- [ ] Verify email template is set up correctly
- [ ] Check Supabase logs for errors

### Steps to Fix

1. **Verify Email Configuration**
   - Go to Supabase Dashboard
   - Authentication → Email Templates
   - Check "Reset password" template exists
   - Verify "From Email" is set

2. **Test Email Sending**
   - Go to Authentication → Users
   - Select a test user
   - Click "Send Password Reset Email"
   - Check inbox/spam

3. **Check Supabase Logs**
   - Go to Logs in Supabase Dashboard
   - Look for email sending errors
   - Check for authentication issues

---

## Issue 4: Logo Not Loading in Specific Email Clients

### Problem
Logo works in Gmail but not in Outlook, Apple Mail, etc.

### Solutions

**1. Use Inline Styles**
```html
<img src="https://turonmun.com/logos/turonmun-logo.jpg" 
     alt="TuronMUN Logo" 
     style="max-width: 80px; height: auto; display: block;">
```

**2. Add Width/Height Attributes**
```html
<img src="https://turonmun.com/logos/turonmun-logo.jpg" 
     alt="TuronMUN Logo" 
     width="80" 
     height="auto"
     style="max-width: 80px; height: auto;">
```

**3. Use Smaller Image Size**
- Reduce image size to < 100KB
- Use optimized JPG/PNG
- Consider using 2x resolution for Retina displays

**4. Test with Email Testing Tools**
- Use Litmus or Email on Acid
- Test across multiple email clients
- Check rendering in different devices

---

## Issue 5: OTP Link Redirect Not Working

### Problem
Error: `#error=access_denied&error_code=otp_expired`

### Solution

**Check Redirect URL Configuration**:

1. Go to Supabase Dashboard
2. Authentication → URL Configuration
3. Verify these URLs are set:
   - **Site URL**: `https://turonmun.com`
   - **Redirect URLs**: 
     - `https://turonmun.com/auth/callback`
     - `http://localhost:8080/auth/callback`

4. In Google Cloud Console:
   - Verify authorized redirect URIs include your domain
   - Add `https://turonmun.com/auth/callback`

**Check AuthCallback Component**:
- Verify `src/pages/AuthCallback.tsx` exists
- Ensure route `/auth/callback` is in `App.tsx`
- Check browser console for errors

---

## Quick Fixes Checklist

### For Logo Issues
- [ ] Use absolute URL: `https://turonmun.com/logos/turonmun-logo.jpg`
- [ ] Add inline styles: `style="max-width: 80px; height: auto;"`
- [ ] Verify file exists and is publicly accessible
- [ ] Test URL directly in browser

### For Reset Link Issues
- [ ] Increase OTP expiry to 24 hours in Supabase
- [ ] Check email is received
- [ ] Verify reset link is not expired
- [ ] Check redirect URL configuration

### For Email Not Received
- [ ] Check spam folder
- [ ] Verify email configuration in Supabase
- [ ] Test with Supabase dashboard
- [ ] Check Supabase logs for errors

---

## Testing Email Templates

### Local Testing
1. Go to `http://localhost:8080/reset-password`
2. Enter your email
3. Check email for reset link
4. Verify logo appears
5. Click link and reset password

### Production Testing
1. Go to `https://turonmun.com/reset-password`
2. Enter your email
3. Check email for reset link
4. Verify logo appears
5. Click link and reset password

---

## Support Resources

- **Supabase Email Docs**: https://supabase.com/docs/guides/auth/auth-email
- **Email Client Support**: https://www.campaignmonitor.com/css/
- **Email Testing**: https://www.litmus.com/ or https://www.emailonacid.com/
- **Logo Optimization**: https://tinypng.com/ or https://imageoptim.com/

---

## Files to Update

If you need to make changes to email templates:

1. **Confirmation Email**: `EMAIL_CONFIRMATION_TEMPLATE.html`
2. **Reset Password Email**: `EMAIL_RESET_PASSWORD_TEMPLATE.html`
3. **Setup Guides**:
   - `SUPABASE_EMAIL_SETUP.md`
   - `SUPABASE_RESET_PASSWORD_SETUP.md`

After updating, copy the HTML to Supabase Email Templates.

---

## Next Steps

1. ✅ Update email templates with absolute logo URL (DONE)
2. ⏳ Increase OTP expiry in Supabase (DO THIS NOW)
3. ⏳ Test password reset with new settings
4. ⏳ Verify logo appears in emails
5. ⏳ Push changes to GitHub
