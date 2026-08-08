-- =========================================================
-- Retail Vendor accounts + availability toggles
-- Run in the Supabase SQL Editor for project fytksuhwheohqcobuzbk (once).
-- =========================================================

-- 1. Availability flag on stations (idempotent)
ALTER TABLE public.stations
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;

-- 2. Vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  products_sold TEXT[] NOT NULL DEFAULT '{}',
  estimated_quantity TEXT,
  delivery_available BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.vendors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Vendors are publicly readable"
  ON public.vendors FOR SELECT TO anon, authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Vendor can insert own row"
  ON public.vendors FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Vendor can update own row"
  ON public.vendors FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Vendor can delete own row"
  ON public.vendors FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Realtime for the mobile app
ALTER TABLE public.vendors REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.vendors;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Signup trigger now branches on account_type metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acct TEXT := COALESCE(NEW.raw_user_meta_data->>'account_type', 'station');
BEGIN
  IF acct = 'vendor' THEN
    INSERT INTO public.vendors (
      user_id, business_name, owner_name, phone, email, address,
      latitude, longitude, products_sold, estimated_quantity, delivery_available
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Shop'),
      NEW.raw_user_meta_data->>'owner_name',
      NEW.raw_user_meta_data->>'phone',
      NEW.email,
      NEW.raw_user_meta_data->>'address',
      NULLIF(NEW.raw_user_meta_data->>'latitude','')::numeric,
      NULLIF(NEW.raw_user_meta_data->>'longitude','')::numeric,
      COALESCE(
        (SELECT array_agg(value::text)
         FROM jsonb_array_elements_text(
           COALESCE(NEW.raw_user_meta_data->'products_sold', '[]'::jsonb)
         ) AS value),
        '{}'::text[]
      ),
      NEW.raw_user_meta_data->>'estimated_quantity',
      COALESCE((NEW.raw_user_meta_data->>'delivery_available')::boolean, false)
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
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
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
