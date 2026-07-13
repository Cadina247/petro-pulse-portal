-- =========================================================
-- Run this in the Supabase SQL Editor for project
-- fytksuhwheohqcobuzbk (once).
-- =========================================================

-- Enum
DO $$ BEGIN
  CREATE TYPE public.token_status AS ENUM ('issued','redeemed','void');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- stations
CREATE TABLE IF NOT EXISTS public.stations (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  station_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  owner_name TEXT,
  email TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stations TO anon;
GRANT SELECT, INSERT, UPDATE ON public.stations TO authenticated;
GRANT ALL ON public.stations TO service_role;

ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Stations are publicly readable"
  ON public.stations FOR SELECT TO anon, authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Station owner can insert own row"
  ON public.stations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Station owner can update own row"
  ON public.stations FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_stations_updated_at
  BEFORE UPDATE ON public.stations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Auto-create station on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.stations (
    id, station_name, address, phone, owner_name, email, latitude, longitude
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'station_name', 'My Station'),
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'owner_name',
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'latitude','')::numeric,
    NULLIF(NEW.raw_user_meta_data->>'longitude','')::numeric
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- tokens
CREATE TABLE IF NOT EXISTS public.tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  value_cents INTEGER NOT NULL CHECK (value_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  status public.token_status NOT NULL DEFAULT 'issued',
  redeemed_at TIMESTAMPTZ,
  station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.tokens TO authenticated;
GRANT ALL ON public.tokens TO service_role;

ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Station can read own or unassigned tokens"
  ON public.tokens FOR SELECT TO authenticated
  USING (station_id IS NULL OR station_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Station can redeem issued tokens"
  ON public.tokens FOR UPDATE TO authenticated
  USING (status = 'issued')
  WITH CHECK (status = 'redeemed' AND station_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_tokens_updated_at
  BEFORE UPDATE ON public.tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Storage bucket for station logos (run once in dashboard OR here):
INSERT INTO storage.buckets (id, name, public)
VALUES ('station-logos', 'station-logos', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public read station logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'station-logos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Station can upload own logo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'station-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Station can update own logo"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'station-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
