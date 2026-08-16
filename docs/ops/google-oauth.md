# Google OAuth setup

**Owner:** Austine · **Status:** scaffolded 2026-08-05, awaiting Google Cloud Console credentials from the user.

This is the runbook to turn the "Continue with Google" sign-in flow on. Everything on the code side already ships. All that's left is provisioning the OAuth client in Google Cloud Console and pasting the two secrets into `.env`.

---

## 1. Create the OAuth 2.0 client in Google Cloud Console

1. Open <https://console.cloud.google.com/> and select (or create) a project — e.g. `navuuna-atlas`.
2. Navigate to **APIs & Services → OAuth consent screen**.
   - User type: **External**.
   - App name: **Navuuna Atlas** (or the current brand).
   - User support email: your team address.
   - Developer contact: your team address.
   - Scopes: `openid`, `profile`, `email` (all three come from the default set — you don't need to add anything custom).
   - Test users (while in "Testing" mode): add every team email that needs to log in before you publish.
3. Navigate to **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Navuuna Atlas — local dev` (create a second one later for staging + prod).
   - **Authorized JavaScript origins:**
     - `http://localhost:5173` (Vite dev server)
     - `http://localhost:8000` (Laravel dev server)
   - **Authorized redirect URIs:**
     - `http://localhost:8000/api/v1/auth/google/callback` (local)
     - `https://<your-backend-host>/api/v1/auth/google/callback` (staging + prod later)
4. Hit **Create**. Copy the **Client ID** and **Client secret** into the modal that appears.

---

## 2. Drop the creds into `.env`

Edit `nuvola-atlas-backend/.env`:

```env
GOOGLE_CLIENT_ID=<paste from step 1.4>
GOOGLE_CLIENT_SECRET=<paste from step 1.4>
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

Then flush the config cache so Laravel picks the new values up:

```bash
php artisan config:clear
```

---

## 3. Smoke test

1. Boot the API and the SPA (see `README.md`):
   ```bash
   php artisan serve                              # in nuvola-atlas-backend
   cd nuvola-atlas-frontend && npm run dev
   ```
2. Open <http://localhost:5173/sign-in> in an incognito window.
3. Click **Continue with Google**. You should:
   - Be redirected to Google's consent screen.
   - After choosing an account, land at `http://localhost:5173/auth/google/complete?token=<sanctum-token>` briefly.
   - Then land at the app's home route, signed in as the Google identity.
4. The SPA persists the returned token to `localStorage` under the same key the password sign-in flow uses, so the whole app behaves identically after Google sign-in.

If it doesn't work, check:

- `GET /api/v1/auth/google/redirect` returns `503` with `oauth-not-configured` → you missed step 2 or forgot `config:clear`.
- Google shows "Access blocked" → the JavaScript origin or the redirect URI is missing from the console (case-sensitive).
- The callback redirects with `?error=oauth_persist_failed` → check `storage/logs/laravel.log` for the underlying DB error.

---

## 4. Production hardening (before public launch)

- Move the OAuth client from **Testing** to **In production** in the consent screen. Google requires:
  - A privacy policy URL.
  - Domain verification (Search Console).
  - A completed brand-review submission (needed to remove the "unverified app" warning).
- Rotate the client secret on the 90-day cadence documented in `docs/ops/secret-rotation.md`. Google supports two active secrets during rotation so you can flip without downtime.
- Restrict the client to your production Redirect URI only — remove the `localhost:5173` / `localhost:8000` origins on the prod-only client.
- Enable **Google Workspace domain-wide restriction** (`hd` parameter) if you want to limit sign-in to a specific corporate domain.

---

## 5. Data flow (reference)

```
[SPA sign-in button]
   |
   |  GET /api/v1/auth/google/redirect
   v
[Laravel] returns { authorize_url }
   |
   |  window.location.assign(authorize_url)
   v
[Google consent screen]
   |
   |  GET {redirect_uri}?code=...&state=...
   v
[Laravel GoogleAuthController::callback]
   |
   |  1. Exchange code → Google user profile (Socialite stateless)
   |  2. Upsert by google_id, then by email
   |  3. Mint Sanctum token
   |  4. redirect(FRONTEND_URL/auth/google/complete?token=<t>)
   v
[SPA /auth/google/complete route]
   |
   |  Reads token from querystring, saves to localStorage,
   |  navigates to /
   v
[SPA is signed in]
```

The upsert order (google_id first, then email) matters: it means an existing password account with the same email as the Google identity picks up the `google_id` on first Google sign-in rather than creating a duplicate row.
