# Mobile Google sign-in redirect fix

This project is deployed at `https://dailyquest-pink.vercel.app` and uses Firebase project `dailyquest-6fbb3`.

## 1. Vercel rewrite

Commit the root-level `vercel.json` file. It transparently proxies Firebase Auth helper routes through the site's own origin:

```json
{
  "rewrites": [
    {
      "source": "/__/auth/:path*",
      "destination": "https://dailyquest-6fbb3.firebaseapp.com/__/auth/:path*"
    }
  ]
}
```

## 2. Vercel environment variable

In Vercel → Project → Settings → Environment Variables, set this for **Production**:

- `VITE_FIREBASE_AUTH_DOMAIN` = `dailyquest-pink.vercel.app`

Do not include `https://` or a trailing slash. Keep the other Firebase variables unchanged. This is the production setting; for local development, keep your local `.env.local` auth domain set to the Firebase project's default auth domain unless you have separately configured local proxying.

## 3. Firebase Authentication

In Firebase Console → Authentication → Settings → Authorized domains, add:

- `dailyquest-pink.vercel.app`

Keep the project's existing Firebase auth domain there as well.

## 4. Google OAuth client

In Google Cloud Console → APIs & Services → Credentials → the Web OAuth client used by Firebase Google sign-in, add this under **Authorized redirect URIs**:

- `https://dailyquest-pink.vercel.app/__/auth/handler`

Keep the existing Firebase redirect URI (`https://dailyquest-6fbb3.firebaseapp.com/__/auth/handler`) if it is already registered or used elsewhere. If the client has an Authorized JavaScript origins section, add `https://dailyquest-pink.vercel.app` as an origin too.

## 5. Redeploy and test

Commit and push the `vercel.json` file. Confirm the Production environment variable is saved, then redeploy the production deployment so the updated Vite environment value is baked into the client bundle. Test on the exact production URL, not a Vercel preview URL.

On mobile, open the production site, sign in with Google, confirm it returns to the dashboard, then refresh to verify the persistent session. If it still returns to the login screen, inspect the browser console and Firebase Authentication errors; do not delete the user's Firestore data or reset progress.
