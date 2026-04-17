# Google OAuth Quick Start

**TL;DR**: Configuration is ready. Just add your Google credentials and restart Supabase.

## Current Status

✅ **Configuration Complete** — All files configured, awaiting real credentials from Google Cloud Console.

## Quick Setup (5 minutes)

### 1. Get Google Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - **Application type**: Web application
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     http://127.0.0.1:54321
     ```
   - **Authorized redirect URIs**:
     ```
     http://127.0.0.1:54321/auth/v1/callback
     http://localhost:5173/auth/callback
     ```
6. Copy your **Client ID** and **Client Secret**

### 2. Update .env

Edit `.env` in the project root:

```bash
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=YOUR_CLIENT_SECRET_HERE
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```

### 3. Restart Supabase

```bash
npx supabase stop
npx supabase start
```

### 4. Test

Run the test script:

```bash
./scripts/test-google-oauth.sh
```

Or test in browser:

```
http://127.0.0.1:54321/auth/v1/authorize?provider=google&redirect_to=http://localhost:5173
```

## Files Already Configured

- ✅ `supabase/config.toml` — Google OAuth enabled
- ✅ `.env` — Placeholder variables added
- ✅ `.env.example` — Documented structure
- ✅ `scripts/test-google-oauth.sh` — Test script ready

## Need More Details?

See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for complete step-by-step instructions including:

- OAuth consent screen setup
- Test user configuration
- Troubleshooting
- Production considerations

## Common Issues

### "provider is not enabled"

**Solution**: Restart Supabase after updating `.env`

```bash
npx supabase stop && npx supabase start
```

### "redirect_uri_mismatch"

**Solution**: Ensure redirect URIs in Google Console exactly match:

- `http://127.0.0.1:54321/auth/v1/callback`
- `http://localhost:5173/auth/callback`

### "invalid_client"

**Solution**: Double-check Client ID and Secret in `.env` match Google Console values exactly (no extra spaces).

## What Happens Next?

Once configured, users can:

1. Click "Sign in with Google" in your app
2. Get redirected to Google's OAuth page
3. Authorize the app
4. Get redirected back with an access token
5. Frontend creates a session
6. User is logged in

The user record is automatically created in `auth.users` table in Supabase.

---

**Quick Links**:

- [Full Setup Guide](./GOOGLE_OAUTH_SETUP.md)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
