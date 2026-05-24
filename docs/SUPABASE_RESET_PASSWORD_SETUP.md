# TuronMUN Reset Password Email Setup

## How to Use This Template in Supabase

### Step 1: Go to Supabase Dashboard
1. Navigate to your Supabase project
2. Go to **Authentication** → **Email Templates**
3. Click on **Reset password** template

### Step 2: Replace the Template

Copy the HTML code below and paste it into the Supabase email template editor:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your TuronMUN Password</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6;
            color: #4f586a;
            background-color: #f8f9fb;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .email-header {
            background: linear-gradient(135deg, #173873 0%, #132e5c 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .email-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120"><path d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.05)"/></svg>') no-repeat bottom;
            background-size: cover;
            opacity: 0.5;
        }
        
        .logo-container {
            position: relative;
            z-index: 1;
            margin-bottom: 20px;
            text-align: center;
            width: 100%;
        }
        
        .logo-circle {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background-color: #ffffff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            overflow: hidden;
        }
        
        .logo-container img {
            width: 80px;
            height: 80px;
            display: block;
            object-fit: contain;
        }
        
        .email-header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin-top: 15px;
            letter-spacing: -0.5px;
            position: relative;
            z-index: 1;
        }
        
        .email-header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            margin-top: 8px;
            position: relative;
            z-index: 1;
        }
        
        .email-content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 16px;
            color: #173873;
            font-weight: 600;
            margin-bottom: 20px;
        }
        
        .content-text {
            font-size: 15px;
            color: #4f586a;
            line-height: 1.8;
            margin-bottom: 30px;
        }
        
        .content-text strong {
            color: #173873;
            font-weight: 600;
        }
        
        .warning-box {
            background-color: #fff3cd;
            border-left: 4px solid #f7a31c;
            padding: 15px 20px;
            border-radius: 6px;
            margin: 25px 0;
            font-size: 14px;
            color: #856404;
        }
        
        .warning-box strong {
            color: #173873;
        }
        
        .cta-container {
            text-align: center;
            margin: 40px 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #f7a31c 0%, #e68a0c 100%);
            color: #ffffff;
            padding: 14px 40px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(247, 163, 28, 0.3);
            border: none;
            cursor: pointer;
            letter-spacing: 0.3px;
        }
        
        .cta-button:hover {
            background: linear-gradient(135deg, #e68a0c 0%, #c26a09 100%);
            box-shadow: 0 6px 16px rgba(247, 163, 28, 0.4);
            transform: translateY(-2px);
        }
        
        .alternative-link {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e3e7ed;
            font-size: 13px;
            color: #818eaa;
        }
        
        .alternative-link p {
            margin-bottom: 10px;
        }
        
        .alternative-link a {
            color: #173873;
            text-decoration: none;
            word-break: break-all;
            font-weight: 500;
        }
        
        .alternative-link a:hover {
            text-decoration: underline;
        }
        
        .info-box {
            background-color: #eef0f6;
            border-left: 4px solid #173873;
            padding: 15px 20px;
            border-radius: 6px;
            margin: 25px 0;
            font-size: 14px;
            color: #4f586a;
        }
        
        .info-box strong {
            color: #173873;
        }
        
        .email-footer {
            background-color: #f8f9fb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e3e7ed;
        }
        
        .footer-content {
            font-size: 13px;
            color: #818eaa;
            line-height: 1.8;
        }
        
        .footer-content a {
            color: #173873;
            text-decoration: none;
            font-weight: 500;
        }
        
        .footer-content a:hover {
            text-decoration: underline;
        }
        
        .footer-divider {
            margin: 15px 0;
            color: #cdd5e0;
        }
        
        .social-links {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e3e7ed;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #173873;
            text-decoration: none;
            font-size: 12px;
            font-weight: 500;
        }
        
        .social-links a:hover {
            color: #f7a31c;
        }
        
        @media only screen and (max-width: 600px) {
            .email-container {
                border-radius: 0;
            }
            
            .email-header {
                padding: 30px 20px;
            }
            
            .email-header h1 {
                font-size: 24px;
            }
            
            .email-content {
                padding: 25px 20px;
            }
            
            .cta-button {
                padding: 12px 30px;
                font-size: 15px;
                width: 100%;
            }
            
            .email-footer {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div style="background-color: #f8f9fb; padding: 20px 0;">
        <div class="email-container">
            <div class="email-header">
                <div class="logo-container">
                    <div class="logo-circle">
                        <img src="https://turonmun.com/logos/turonmun-logo.jpg" alt="TuronMUN Logo">
                    </div>
                </div>
                <h1>Password Reset</h1>
                <p>Secure Your Account</p>
            </div>
            
            <div class="email-content">
                <p class="greeting">Hello,</p>
                
                <p class="content-text">
                    We received a request to reset the password for your <strong>TuronMUN</strong> account. If you didn't make this request, you can safely ignore this email.
                </p>
                
                <div class="warning-box">
                    <strong>🔒 Security Notice:</strong> This link will expire in 1 hour for your security. If you need to reset your password again, you can request a new link from the login page.
                </div>
                
                <p class="content-text">
                    To reset your password, click the button below:
                </p>
                
                <div class="cta-container">
                    <a href="{{ .ConfirmationURL }}" class="cta-button">Reset Password</a>
                </div>
                
                <div class="alternative-link">
                    <p>Or copy and paste this link in your browser:</p>
                    <a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a>
                </div>
                
                <div class="info-box">
                    <strong>💡 Tip:</strong> Make sure to create a strong password with a mix of uppercase, lowercase, numbers, and special characters.
                </div>
                
                <p class="content-text">
                    After resetting your password, you'll be able to log in with your new credentials.
                </p>
                
                <p class="content-text">
                    <strong>Didn't request this?</strong><br>
                    If you didn't request a password reset, your account may be at risk. Please <a href="https://turonmun.com/contact" style="color: #173873; text-decoration: none; font-weight: 500;">contact us</a> immediately if you believe your account has been compromised.
                </p>
                
                <p class="content-text">
                    Best regards,<br>
                    <strong>The TuronMUN Team</strong>
                </p>
            </div>
            
            <div class="email-footer">
                <div class="footer-content">
                    <p>
                        <strong>TuronMUN</strong> | Empowering Youth Diplomacy<br>
                        <a href="https://turonmun.com">turonmun.com</a>
                    </p>
                    
                    <div class="footer-divider">—</div>
                    
                    <p>
                        Questions? <a href="https://turonmun.com/contact">Contact Us</a> | 
                        <a href="https://turonmun.com/about">About TuronMUN</a>
                    </p>
                    
                    <div class="social-links">
                        <a href="https://turonmun.com">Website</a>
                        <a href="https://turonmun.com">Facebook</a>
                        <a href="https://turonmun.com">Instagram</a>
                    </div>
                    
                    <p style="margin-top: 20px; font-size: 12px; color: #cdd5e0;">
                        © 2025 TuronMUN. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
```

### Step 3: Configure Email Sender

In Supabase Authentication settings:
1. Go to **Authentication** → **Email Templates**
2. Set the **From Email** to: `admin@turonmun.com`
3. Set the **From Name** to: `TuronMUN`

### Step 4: Test the Email

1. Go to **Authentication** → **Users**
2. Create a test user or use an existing one
3. Click the user and select **Send Password Reset Email**
4. Check your email inbox to see the formatted reset password email

## Email Template Variables

The template uses these Supabase variables:
- `{{ .ConfirmationURL }}` - The password reset link (automatically generated by Supabase)

## Key Differences from Confirmation Email

✅ **Security Focus** - Emphasizes account security
✅ **Warning Box** - Highlights 1-hour expiration
✅ **Fraud Alert** - Includes "Didn't request this?" section
✅ **Password Tips** - Suggests strong password creation
✅ **Different Header** - "Password Reset" instead of "Welcome"

## Customization

### Change Colors
- **Primary Blue**: `#173873` (diplomatic color)
- **Gold Accent**: `#f7a31c` (secondary color)
- **Warning Yellow**: `#fff3cd` (for security notice)
- **Text**: `#4f586a` (neutral dark)
- **Light Background**: `#f8f9fb` (neutral light)

### Change Logo
The logo is configured with absolute URL:
```html
<img src="https://turonmun.com/logos/turonmun-logo.jpg" alt="TuronMUN Logo" style="max-width: 80px; height: auto;">
```

**Logo Location**: `public/logos/turonmun-logo.jpg`

### Change Links
Update these URLs to match your domain:
- `https://turonmun.com/contact`
- `https://turonmun.com/about`
- Social media links

## Features

✅ **Professional Design** - Clean, modern layout with TuronMUN branding
✅ **Responsive** - Works on mobile, tablet, and desktop
✅ **Security-Focused** - Emphasizes account protection
✅ **Clear CTA** - Prominent reset password button
✅ **Alternative Link** - Backup link for email clients
✅ **Fraud Alert** - Protects users from phishing concerns
✅ **Password Tips** - Helps users create strong passwords
✅ **Footer** - Contact and social media links

## Troubleshooting

### Email Not Sending
- Verify email is configured in Supabase
- Check that SMTP settings are correct
- Ensure `admin@turonmun.com` is verified

### Template Not Showing
- Clear browser cache
- Try in an incognito/private window
- Check browser console for errors

### Images Not Loading
- Ensure logo URL is accessible
- Use absolute URLs (starting with https://)
- Test the image URL directly in browser

## Support

For questions about email configuration in Supabase, visit:
https://supabase.com/docs/guides/auth/auth-email
