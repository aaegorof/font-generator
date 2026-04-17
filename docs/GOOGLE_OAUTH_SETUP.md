# Google OAuth Setup Guide

Complete guide for configuring Google OAuth authentication with Supabase for the Font Generator application.

## Prerequisites

- Google account
- Supabase running locally (via `npx supabase start`)
- Access to Google Cloud Console

## Overview

This guide walks through:

1. Creating a Google Cloud project
2. Configuring OAuth consent screen
3. Creating OAuth 2.0 credentials
4. Configuring Supabase to use Google OAuth
5. Testing the OAuth flow

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown in the top navigation bar
3. Click **"New Project"**
4. Enter project details:
   - **Project name**: `Font Generator` (or your preferred name)
   - **Organization**: Leave as default or select your organization
5. Click **"Create"**
6. Wait for the project to be created (takes ~30 seconds)
7. Select the newly created project from the project dropdown

---

## Step 2: Enable Required APIs

1. In the left sidebar, navigate to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** (or "People API")
3. Click on it and press **"Enable"**
4. Wait for the API to be enabled

> **Note**: Google+ API is deprecated but still required for OAuth. Alternatively, you can use "Google People API" which is the modern replacement.

---

## Step 3: Configure OAuth Consent Screen

1. Navigate to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** user type (for testing with any Google account)
   - If you have a Google Workspace, you can select "Internal" to restrict to your organization
3. Click **"Create"**

### App Information

Fill in the following fields:

- **App name**: `Font Generator`
- **User support email**: Your email address (select from dropdown)
- **App logo**: (Optional) Upload your app logo
- **Application home page**: `http://localhost:5173` (for development)
- **Application privacy policy link**: (Optional, can skip for development)
- **Application terms of service link**: (Optional, can skip for development)
- **Authorized domains**: Leave empty for local development

### Developer Contact Information

- **Email addresses**: Your email address

Click **"Save and Continue"**

### Scopes

1. Click **"Add or Remove Scopes"**
2. Select the following scopes:
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
3. Click **"Update"**
4. Click **"Save and Continue"**

### Test Users

1. Click **"Add Users"**
2. Add your Gmail address (the one you'll use for testing)
3. Add any other test user emails if needed
4. Click **"Add"**
5. Click **"Save and Continue"**

### Summary

Review your settings and click **"Back to Dashboard"**

> **Important**: While in "Testing" mode, only test users you've added can sign in. To make it public, you'll need to submit for verification (not required for development).

---

## Step 4: Create OAuth 2.0 Credentials

1. Navigate to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**

### Configure OAuth Client

- **Application type**: Select **"Web application"**
- **Name**: `Font Generator Web Client`

### Authorized JavaScript Origins

Add the following origins (these are where your app will run):

```
http://localhost:5173
http://localhost:3000
http://127.0.0.1:5173
http://127.0.0.1:54321
```

Click **"Add URI"** for each one.

### Authorized Redirect URIs

Add the following redirect URIs (these are where Google will send users after authentication):

```
http://127.0.0.1:54321/auth/v1/callback
http://localhost:5173/auth/callback
```

Click **"Add URI"** for each one.

> **Critical**: The Supabase auth callback URL must match your local Supabase API URL. Check with `npx supabase status` to confirm the API URL (usually `http://127.0.0.1:54321`).

### Create

1. Click **"Create"**
2. A modal will appear with your credentials

### Save Your Credentials

**IMPORTANT**: Copy these values immediately:

- **Client ID**: Something like `123456789-abc123def456.apps.googleusercontent.com`
- **Client Secret**: Something like `GOCSPX-abc123def456ghi789`

Click **"OK"** to close the modal.

> **Security Note**: Keep your Client Secret secure. Never commit it to version control.

---

## Step 5: Configure Supabase

### Update Environment Variables

Edit your `.env` file in the project root:

```bash
# Google OAuth Configuration
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=YOUR_CLIENT_SECRET_HERE

# Frontend Google Client ID (same as above)
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```

Replace `YOUR_CLIENT_ID_HERE` and `YOUR_CLIENT_SECRET_HERE` with the values you copied from Google Cloud Console.

### Verify Supabase Configuration

The `supabase/config.toml` file should already have Google OAuth configured:

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
redirect_uri = ""
skip_nonce_check = true
```

### Restart Supabase

After updating `.env`, restart Supabase to pick up the new environment variables:

```bash
npx supabase stop
npx supabase start
```

Wait for all services to start (takes ~30 seconds).

---

## Step 6: Test OAuth Flow

### Check Auth Service

Verify the auth service is running:

```bash
curl http://127.0.0.1:54321/auth/v1/health
```

Expected response:

```json
{
  "version": "v2.188.1",
  "name": "GoTrue",
  "description": "GoTrue is a user registration and authentication API"
}
```

### Test Authorization Endpoint

Get the Google OAuth authorization URL:

```bash
curl -v "http://127.0.0.1:54321/auth/v1/authorize?provider=google"
```

You should see a **302 redirect** to Google's OAuth page. The `Location` header will contain a Google URL like:

```
https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=openid+email+profile
```

### Test in Browser

1. Open your browser
2. Navigate to:
   ```
   http://127.0.0.1:54321/auth/v1/authorize?provider=google&redirect_to=http://localhost:5173
   ```
3. You should be redirected to Google's sign-in page
4. Sign in with a test user account (one you added in Step 3)
5. Grant permissions to the app
6. You should be redirected back to your app with an access token in the URL hash

### Verify User Created

After successful authentication, check that the user was created in Supabase:

```bash
npx supabase db psql -c "SELECT id, email, created_at FROM auth.users;"
```

You should see your test user in the results.

---

## OAuth Flow Diagram

```
┌──────────┐                                  ┌──────────────┐
│          │  1. Click "Sign in with Google"  │              │
│  Browser │─────────────────────────────────>│   Frontend   │
│          │                                  │ (port 5173)  │
└──────────┘                                  └──────┬───────┘
     ^                                               │
     │                                               │ 2. Redirect to Supabase Auth
     │                                               v
     │                                        ┌──────────────┐
     │                                        │   Supabase   │
     │                                        │     Auth     │
     │                                        │ (port 54321) │
     │                                        └──────┬───────┘
     │                                               │
     │                                               │ 3. Redirect to Google
     │                                               v
     │                                        ┌──────────────┐
     │                                        │    Google    │
     │                                        │    OAuth     │
     │                                        └──────┬───────┘
     │                                               │
     │                                               │ 4. User authorizes
     │                                               │
     │  8. Redirect with access_token               │ 5. Redirect to callback
     │<──────────────────────────────────────────────┘
     │
     │  9. Frontend extracts token and creates session
     v
┌──────────┐
│  User is │
│  logged  │
│    in    │
└──────────┘
```

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause**: The redirect URI in your request doesn't match any authorized redirect URIs in Google Cloud Console.

**Solution**:

1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Ensure `http://127.0.0.1:54321/auth/v1/callback` is in the "Authorized redirect URIs" list
4. Save and try again

### Error: "invalid_client"

**Cause**: Client ID or Client Secret is incorrect.

**Solution**:

1. Verify the values in your `.env` file match exactly what's in Google Cloud Console
2. Make sure there are no extra spaces or quotes
3. Restart Supabase after updating `.env`

### Error: "Access blocked: This app's request is invalid"

**Cause**: OAuth consent screen is not configured properly.

**Solution**:

1. Complete the OAuth consent screen setup (Step 3)
2. Add your test user email in the "Test users" section
3. Ensure required scopes are added

### Error: "App not verified" warning in Google

**Cause**: Your app is in "Testing" mode and hasn't been verified by Google.

**Solution**: This is normal for development. Click **"Advanced"** → **"Go to Font Generator (unsafe)"** to proceed.

### Supabase not picking up environment variables

**Cause**: Supabase was already running when you updated `.env`.

**Solution**:

```bash
npx supabase stop
npx supabase start
```

### Can't access localhost URLs

**Cause**: Some browsers or networks block localhost.

**Solution**: Use `127.0.0.1` instead of `localhost` in all URLs.

---

## Production Considerations

When deploying to production, you'll need to:

1. **Update OAuth Consent Screen**:
   - Change from "Testing" to "In Production"
   - May require Google verification process

2. **Update Authorized Origins and Redirect URIs**:
   - Add your production domain (e.g., `https://yourdomain.com`)
   - Remove localhost URLs

3. **Update Supabase Configuration**:
   - Use your production Supabase project URL
   - Update `site_url` and `additional_redirect_urls` in config

4. **Secure Environment Variables**:
   - Use proper secrets management (e.g., Vercel env vars, AWS Secrets Manager)
   - Never commit `.env` to git

5. **Enable HTTPS**:
   - Google OAuth requires HTTPS in production
   - Redirect URIs must use `https://`

---

## Security Best Practices

1. **Never commit secrets to git**:
   - Add `.env` to `.gitignore`
   - Use `.env.example` with placeholder values

2. **Rotate credentials regularly**:
   - Generate new Client Secret periodically
   - Update in both Google Console and your app

3. **Limit OAuth scopes**:
   - Only request the minimum scopes needed (email, profile)

4. **Use HTTPS in production**:
   - All OAuth flows should use HTTPS

5. **Validate tokens**:
   - Always verify JWT tokens on the backend
   - Don't trust client-side token validation alone

---

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## Support

If you encounter issues not covered in this guide:

1. Check Supabase logs: `npx supabase logs auth`
2. Check browser console for errors
3. Verify all URLs match exactly (no trailing slashes, correct ports)
4. Ensure test user is added in Google Cloud Console

---

**Last Updated**: April 8, 2026
