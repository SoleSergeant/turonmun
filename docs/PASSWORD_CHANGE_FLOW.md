# Password Change Flow Documentation

## Overview

Complete password reset flow for TuronMUN users:
1. User requests password reset from login page
2. User receives professional email with reset link
3. User clicks link and is redirected to password change page
4. User enters new password
5. Password is updated in Supabase

## Files

### New Files Created
- **`src/pages/ResetPasswordChange.tsx`** - Password change page component

### Modified Files
- **`src/App.tsx`** - Added `/reset-password-change` route
- **`EMAIL_CONFIRMATION_TEMPLATE.html`** - Logo now in circle
- **`EMAIL_RESET_PASSWORD_TEMPLATE.html`** - Logo now in circle
- **`SUPABASE_EMAIL_SETUP.md`** - Updated with circular logo
- **`SUPABASE_RESET_PASSWORD_SETUP.md`** - Updated with circular logo

## Complete Password Reset Flow

### Step 1: User Requests Password Reset
- User goes to `/login`
- Clicks "Forgot password?" link
- Redirected to `/reset-password`

### Step 2: User Enters Email
- Enters email address on reset password page
- Clicks "Send Reset Link"
- Receives confirmation message

### Step 3: Email Received
- Professional branded email arrives
- Contains:
  - TuronMUN logo in a circle
  - Security information
  - Reset link (expires in 1 hour)
  - Alternative link for email clients

### Step 4: User Clicks Reset Link
- User clicks link in email
- Supabase handles authentication
- User is redirected to `/reset-password-change`

### Step 5: User Changes Password
- Page: `/reset-password-change`
- User enters new password
- User confirms password
- Clicks "Update Password"
- Password is updated in Supabase Auth

### Step 6: Success & Redirect
- Success message displayed
- Auto-redirects to `/login` after 3 seconds
- User can now log in with new password

## ResetPasswordChange Component

**Location**: `src/pages/ResetPasswordChange.tsx`

**Features**:
- ✅ Professional UI matching TuronMUN branding
- ✅ Password visibility toggle
- ✅ Confirm password field
- ✅ Password validation (min 6 characters)
- ✅ Password requirements display
- ✅ Error/success messages
- ✅ Loading states
- ✅ Back button to login
- ✅ Auto-redirect after success

**State Management**:
- `password` - New password input
- `confirmPassword` - Confirmation input
- `showPassword` - Toggle password visibility
- `showConfirmPassword` - Toggle confirm visibility
- `isLoading` - Loading state during update
- `error` - Error messages
- `successMessage` - Success feedback

**Validation**:
- Both fields required
- Passwords must match
- Minimum 6 characters
- Helpful error messages

## Email Template Updates

### Logo Styling
All email templates now display logo in a circle:

```css
.logo-container img {
    max-width: 80px;
    height: 80px;
    width: 80px;
    display: inline-block;
    border-radius: 50%;
    background-color: #ffffff;
    padding: 8px;
    box-sizing: border-box;
}
```

**Features**:
- Perfect circle (border-radius: 50%)
- White background
- Padding for breathing room
- Fixed dimensions for consistency
- Works in all email clients

## Routes

### New Route
- **Path**: `/reset-password-change`
- **Component**: `ResetPasswordChange`
- **Purpose**: Change password after clicking reset link
- **Accessed from**: Email reset link

### Related Routes
- `/login` - Login page
- `/reset-password` - Request password reset
- `/auth/callback` - OAuth callback handler

## Security Features

✅ **Best Practices**:
- Password updated via Supabase Auth
- Secure token handling by Supabase
- Time-limited reset links (1 hour)
- Password validation (min 6 characters)
- No sensitive data in URLs
- HTTPS required for production

⚠️ **Important**:
- Always use HTTPS in production
- Keep Supabase keys secure
- Monitor for suspicious reset attempts
- Implement rate limiting if needed

## Testing

### Local Testing (localhost:8080)

1. **Request Reset**
   - Go to `http://localhost:8080/login`
   - Click "Forgot password?"
   - Enter email address
   - Click "Send Reset Link"

2. **Check Email**
   - Check email inbox for reset link
   - Verify logo appears in circle

3. **Change Password**
   - Click reset link in email
   - Should redirect to `/reset-password-change`
   - Enter new password
   - Confirm password
   - Click "Update Password"

4. **Verify Success**
   - Success message appears
   - Auto-redirects to login
   - Log in with new password

### Production Testing (turonmun.com)

Same steps as above, but use `https://turonmun.com/login`

## Troubleshooting

### Reset Link Not Working
- Check that link is not expired (1 hour limit)
- Verify Supabase configuration
- Check browser console for errors
- Try requesting a new reset link

### Password Update Failed
- Ensure password meets requirements (min 6 chars)
- Check that passwords match
- Verify Supabase Auth is configured
- Check browser console for errors

### Page Not Loading
- Clear browser cache
- Check that route is in `App.tsx`
- Verify component file exists
- Check browser console for errors

### Logo Not Visible in Email
- Verify logo URL is absolute: `https://turonmun.com/logos/turonmun-logo.jpg`
- Check that file exists and is accessible
- Test URL directly in browser
- Check email client settings

## User Experience Flow

```
Login Page
    ↓
"Forgot password?" link
    ↓
Reset Password Page (/reset-password)
    ↓
Enter email → Send Reset Link
    ↓
Email Received (with circular logo)
    ↓
Click Reset Link
    ↓
Password Change Page (/reset-password-change)
    ↓
Enter new password → Update Password
    ↓
Success Message
    ↓
Auto-redirect to Login
    ↓
Log in with new password
```

## Files to Update in Supabase

1. **Email Templates**
   - Go to Authentication → Email Templates
   - Update "Reset password" template with HTML from `SUPABASE_RESET_PASSWORD_SETUP.md`

2. **Email Configuration**
   - Set "From Email" to `admin@turonmun.com`
   - Set "From Name" to `TuronMUN`

3. **OTP Settings**
   - Increase OTP Expiry Duration to 24 hours (86400 seconds)
   - Go to Authentication → Providers → Email

## Next Steps

1. ✅ Create password change page (DONE)
2. ✅ Update email templates with circular logo (DONE)
3. ⏳ Update email templates in Supabase
4. ⏳ Test complete password reset flow
5. ⏳ Push changes to GitHub
6. ⏳ Monitor for any issues

## Support

For questions about password reset functionality:
- Check `RESET_PASSWORD_FEATURE.md`
- Check `EMAIL_TROUBLESHOOTING.md`
- Review component code: `src/pages/ResetPasswordChange.tsx`
- Check Supabase documentation: https://supabase.com/docs/guides/auth/auth-email
