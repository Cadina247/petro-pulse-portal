-- =========================================================
-- Run this in the Supabase SQL Editor for project
-- fytksuhwheohqcobuzbk AFTER supabase/schema.sql.
--
-- Goal: keep station registration data safe.
--   * public.stations keeps ALL fields (including phone, email,
--     owner_name) but SELECT is restricted to the owning station.
--   * public.public_stations exposes ONLY safe, non-sensitive
--     fields for the mobile app / anonymous readers.
-- =========================================================

-- 1) Lock down the sensitive stations table.
--    Drop the old public-read policy if it exists.
DROP POLICY IF EXISTS "Stations are publicly readable" ON public.stations;

-- Owner-only read policy
DO $$ BEGIN
  CREATE POLICY "Station owner can read own row"
  ON public.stations FOR SELECT TO authenticated
  USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Revoke anon SELECT on the raw table
REVOKE SELECT ON public.stations FROM anon;

-- 2) Create a safe public view with ONLY non-sensitive fields.
--    No phone, no email, no owner_name.
CREATE OR REPLACE VIEW public.public_stations
WITH (security_invoker = true) AS
SELECT
  id,
  station_name,
  address,
  latitude,
  longitude,
  logo_url,
  created_at,
  updated_at
FROM public.stations;

-- 3) Backing policy so the view can read rows for anon/auth.
--    (security_invoker views run under the caller; we need a
--     SELECT policy on stations that permits reading the safe
--     columns. Simplest: a permissive policy scoped to the view
--     via a SECURITY DEFINER function.)
CREATE OR REPLACE FUNCTION public.list_public_stations()
RETURNS TABLE (
  id uuid,
  station_name text,
  address text,
  latitude numeric,
  longitude numeric,
  logo_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, station_name, address, latitude, longitude, logo_url,
         created_at, updated_at
  FROM public.stations;
$$;

-- Grants: anon + authenticated can call the safe function.
GRANT EXECUTE ON FUNCTION public.list_public_stations() TO anon, authenticated;

-- Drop the view-based grants (view isn't reachable without a
-- SELECT policy on stations for anon, which we intentionally
-- removed). Prefer the function above from the mobile app:
--   supabase.rpc('list_public_stations')
REVOKE ALL ON public.public_stations FROM anon, authenticated;
