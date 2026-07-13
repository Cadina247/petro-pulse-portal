
## Goal

Switch backend to the new Supabase project (`fytksuhwheohqcobuzbk`) and add a full station-registration/login/forgot-password flow. Each logged-in station manages their own data; the fuel-forward-drive mobile app reads station profiles publicly from the same Supabase.

## 1. Disconnect current Lovable Cloud, connect new Supabase

- Remove `supabase/config.toml` (`wzgtfrshhzdvkiwdhacz`) reference.
- Update `.env` and `src/integrations/supabase/client.ts` to use:
  - URL: `https://fytksuhwheohqcobuzbk.supabase.co`
  - Publishable key: `sb_publishable_6S1XcrawI4mYXc1yKVG1Bw_qf_eZUrI`
- Regenerate `src/integrations/supabase/types.ts` for the new schema.

Note: the existing `tokens` table lives on the old project. It will be re-created on the new one (see step 2). No data migration.

## 2. Database schema on the new Supabase

Run one migration containing:

- `stations` table:
  - `id uuid PK` (= `auth.users.id`, FK cascade)
  - `station_name`, `address`, `phone`, `owner_name` text
  - `latitude`, `longitude` numeric
  - `logo_url` text (nullable)
  - `email` text
  - `created_at`, `updated_at` timestamptz
- `tokens` table (re-created from the old schema): `code` unique, `value_cents`, `currency`, `status` enum, `redeemed_at`, `station_id uuid` FK → `stations.id` (so tokens are per-station).
- Trigger `handle_new_user()` on `auth.users` insert → inserts a stations row using signup metadata.
- `update_updated_at_column()` trigger on both tables.
- RLS:
  - `stations`: public SELECT (mobile app reads); INSERT/UPDATE only by owner (`auth.uid() = id`).
  - `tokens`: SELECT/UPDATE limited to `station_id = auth.uid()`; public SELECT NOT enabled.
- Storage bucket `station-logos` (public) with RLS: any auth user can upload to their own `{uid}/…` path; public read.
- GRANTs per public-schema rule.

## 3. Auth pages (web portal)

New routes in `src/App.tsx`:

- `/auth` — tabs for Sign in / Create account.
  - Create account collects: email, password, station name, address, phone, owner name, GPS (auto-detect via `navigator.geolocation` with manual override), optional logo upload.
  - On signup: `supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { station_name, address, phone, owner_name, latitude, longitude } } })`; upload logo after user is created, then `update` stations.logo_url.
- `/forgot-password` — calls `resetPasswordForEmail` with `redirectTo: origin + '/reset-password'`.
- `/reset-password` — reads recovery hash, calls `updateUser({ password })`.

Auth state:

- `src/hooks/useAuth.tsx` context using `onAuthStateChange` + `getSession` on mount; stores `user` and `session`.
- `ProtectedRoute` wrapper redirects unauthenticated users from `/` to `/auth`.

## 4. Scope dashboard to logged-in station

- `DashboardHeader`: replace hardcoded "Admin User" with the station name from `stations` row; add real Sign-out.
- Add a "Station Profile" section (edit name/address/phone/owner/GPS/logo) — writes to `stations` where `id = auth.uid()`.
- `RedeemToken`: filter/update tokens by `station_id = auth.uid()`.
- Other sections (FuelManagement, Pricing, OtherActivities) stay client-only for now; not persisted per-station in this pass (call out to user, wire in a follow-up if desired).

## 5. Mobile app contract

- Mobile app uses the same Supabase URL + publishable key.
- Reads `public.stations` (public SELECT) to list stations, show pins on map, show logos from `station-logos` bucket.
- No changes to the mobile repo in this task — just document the table shape and bucket in the closing message.

## Technical notes

- Handle `user_already_exists` and `invalid_credentials` toasts on the auth page.
- Password reset page must be a public route above the catch-all.
- Never call `signUp` without `emailRedirectTo` — otherwise confirmation links break.
- Trigger uses `SECURITY DEFINER` + `SET search_path = public` to satisfy linter.
- Sidebar items that don't exist as routes (Orders, Analytics, etc.) remain visual only — no route changes needed beyond `/auth`, `/forgot-password`, `/reset-password`.

## Open confirmation

Auth confirmation email is on by default in Supabase. Do you want me to turn **email confirmation off** for faster testing, or leave it on so stations must confirm their email before first login?
