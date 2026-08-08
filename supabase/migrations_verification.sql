-- =========================================================
-- Account verification for stations & vendors
-- Run in the Supabase SQL Editor for project fytksuhwheohqcobuzbk (once).
-- =========================================================

-- 1) Columns -------------------------------------------------
ALTER TABLE public.stations
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS nin TEXT,
  ADD COLUMN IF NOT EXISTS business_document_url TEXT,
  ADD COLUMN IF NOT EXISTS supporting_document_url TEXT,
  ADD COLUMN IF NOT EXISTS supporting_document_note TEXT,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS nin TEXT,
  ADD COLUMN IF NOT EXISTS business_document_url TEXT,
  ADD COLUMN IF NOT EXISTS supporting_document_url TEXT,
  ADD COLUMN IF NOT EXISTS supporting_document_note TEXT,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

DO $$ BEGIN
  ALTER TABLE public.stations
    ADD CONSTRAINT stations_verification_status_check
    CHECK (verification_status IN ('pending','verified','rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.vendors
    ADD CONSTRAINT vendors_verification_status_check
    CHECK (verification_status IN ('pending','verified','rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Admin allowlist ------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), ''))
         IN ('obehi247m@gmail.com');
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Admins can read & moderate every station / vendor row.
DO $$ BEGIN
  CREATE POLICY "Admins can read all stations"
  ON public.stations FOR SELECT TO authenticated USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update all stations"
  ON public.stations FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can read all vendors"
  ON public.vendors FOR SELECT TO authenticated USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update all vendors"
  ON public.vendors FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Public listings only expose VERIFIED accounts -------------
CREATE OR REPLACE FUNCTION public.list_public_stations()
RETURNS TABLE (
  id uuid,
  station_name text,
  address text,
  latitude numeric,
  longitude numeric,
  logo_url text,
  is_available boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, station_name, address, latitude, longitude, logo_url,
         is_available, created_at, updated_at
  FROM public.stations
  WHERE verification_status = 'verified';
$$;

GRANT EXECUTE ON FUNCTION public.list_public_stations() TO anon, authenticated;

-- Vendors: replace the blanket public-read policy with a verified-only one.
DROP POLICY IF EXISTS "Vendors are publicly readable" ON public.vendors;

DO $$ BEGIN
  CREATE POLICY "Verified vendors are publicly readable"
  ON public.vendors FOR SELECT TO anon, authenticated
  USING (verification_status = 'verified');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Vendor can always read their own row (pending/rejected included).
DO $$ BEGIN
  CREATE POLICY "Vendor can read own row"
  ON public.vendors FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.list_public_vendors()
RETURNS TABLE (
  id uuid,
  business_name text,
  address text,
  latitude numeric,
  longitude numeric,
  products_sold text[],
  estimated_quantity text,
  delivery_available boolean,
  is_available boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, business_name, address, latitude, longitude, products_sold,
         estimated_quantity, delivery_available, is_available, created_at
  FROM public.vendors
  WHERE verification_status = 'verified';
$$;

GRANT EXECUTE ON FUNCTION public.list_public_vendors() TO anon, authenticated;

-- 4) Private storage bucket for verification documents ---------
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Owner can upload own verification docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-docs'
              AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner can update own verification docs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'verification-docs'
         AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner or admin can read verification docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-docs'
         AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
