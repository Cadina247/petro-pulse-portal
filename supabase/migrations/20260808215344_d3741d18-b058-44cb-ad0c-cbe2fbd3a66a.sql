-- ============ schema.sql ============
DO $$ BEGIN
  CREATE TYPE public.token_status AS ENUM ('issued','redeemed','void');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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

GRANT SELECT, INSERT, UPDATE ON public.stations TO authenticated;
GRANT ALL ON public.stations TO service_role;

ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Station owner can read own row"
  ON public.stations FOR SELECT TO authenticated USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Station owner can insert own row"
  ON public.stations FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
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

DO $$ BEGIN
  CREATE POLICY "Public read station logos"
  ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'station-logos');
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

-- ============ fuel_products ============
CREATE TABLE IF NOT EXISTS public.fuel_products (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id         UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  product_name       TEXT NOT NULL,
  price              NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  quantity_available NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  capacity           NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (capacity >= 0),
  is_available       BOOLEAN NOT NULL DEFAULT true,
  unit               TEXT NOT NULL DEFAULT 'L',
  currency           TEXT NOT NULL DEFAULT 'NGN',
  sort_order         INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (station_id, product_name)
);

CREATE INDEX IF NOT EXISTS fuel_products_station_idx ON public.fuel_products(station_id);
CREATE INDEX IF NOT EXISTS fuel_products_available_idx ON public.fuel_products(is_available);

GRANT SELECT ON public.fuel_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fuel_products TO authenticated;
GRANT ALL ON public.fuel_products TO service_role;

ALTER TABLE public.fuel_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Fuel products are publicly readable" ON public.fuel_products;
CREATE POLICY "Fuel products are publicly readable"
  ON public.fuel_products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Station can insert own fuel products" ON public.fuel_products;
CREATE POLICY "Station can insert own fuel products"
  ON public.fuel_products FOR INSERT TO authenticated WITH CHECK (station_id = auth.uid());

DROP POLICY IF EXISTS "Station can update own fuel products" ON public.fuel_products;
CREATE POLICY "Station can update own fuel products"
  ON public.fuel_products FOR UPDATE TO authenticated
  USING (station_id = auth.uid()) WITH CHECK (station_id = auth.uid());

DROP POLICY IF EXISTS "Station can delete own fuel products" ON public.fuel_products;
CREATE POLICY "Station can delete own fuel products"
  ON public.fuel_products FOR DELETE TO authenticated USING (station_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_fuel_products_last_updated()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fuel_products_touch ON public.fuel_products;
CREATE TRIGGER fuel_products_touch
BEFORE UPDATE ON public.fuel_products
FOR EACH ROW EXECUTE FUNCTION public.touch_fuel_products_last_updated();

CREATE OR REPLACE FUNCTION public.seed_fuel_products(_station_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.fuel_products
    (station_id, product_name, price, quantity_available, capacity, unit, sort_order)
  VALUES
    (_station_id, 'Petrol',      617, 0, 3000, 'L',  1),
    (_station_id, 'Diesel',      750, 0, 2500, 'L',  2),
    (_station_id, 'Kerosene',    430, 0, 1500, 'L',  3),
    (_station_id, 'Cooking Gas', 1200, 0, 200, 'KG', 4)
  ON CONFLICT (station_id, product_name) DO NOTHING;
$$;

GRANT EXECUTE ON FUNCTION public.seed_fuel_products(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_station()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.seed_fuel_products(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_station_created ON public.stations;
CREATE TRIGGER on_station_created
AFTER INSERT ON public.stations
FOR EACH ROW EXECUTE FUNCTION public.handle_new_station();

ALTER TABLE public.fuel_products REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.fuel_products;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ vendors ============
ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;

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
  CREATE POLICY "Vendor can insert own row"
  ON public.vendors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Vendor can update own row"
  ON public.vendors FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Vendor can delete own row"
  ON public.vendors FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.vendors REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.vendors;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

-- ============ verification ============
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

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lower(COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), ''))
         IN ('obehi247m@gmail.com');
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

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

CREATE OR REPLACE FUNCTION public.list_public_stations()
RETURNS TABLE (
  id uuid, station_name text, address text, latitude numeric, longitude numeric,
  logo_url text, is_available boolean, created_at timestamptz, updated_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, station_name, address, latitude, longitude, logo_url,
         is_available, created_at, updated_at
  FROM public.stations WHERE verification_status = 'verified';
$$;

GRANT EXECUTE ON FUNCTION public.list_public_stations() TO anon, authenticated;

DO $$ BEGIN
  CREATE POLICY "Verified vendors are publicly readable"
  ON public.vendors FOR SELECT TO anon, authenticated
  USING (verification_status = 'verified');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Vendor can read own row"
  ON public.vendors FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.list_public_vendors()
RETURNS TABLE (
  id uuid, business_name text, address text, latitude numeric, longitude numeric,
  products_sold text[], estimated_quantity text, delivery_available boolean,
  is_available boolean, created_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, business_name, address, latitude, longitude, products_sold,
         estimated_quantity, delivery_available, is_available, created_at
  FROM public.vendors WHERE verification_status = 'verified';
$$;

GRANT EXECUTE ON FUNCTION public.list_public_vendors() TO anon, authenticated;

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

-- ============ orders ============
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id       UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  customer_id      UUID,
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT,
  product_name     TEXT NOT NULL,
  quantity         NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit             TEXT NOT NULL DEFAULT 'L',
  unit_price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_address TEXT,
  latitude         DOUBLE PRECISION,
  longitude        DOUBLE PRECISION,
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','accepted','assigned','in-transit','delivered','cancelled')),
  assigned_personnel_id UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_station_idx ON public.orders(station_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);

GRANT SELECT, INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order"
  ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Station can view own orders" ON public.orders;
CREATE POLICY "Station can view own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (station_id = auth.uid() OR customer_id = auth.uid());

DROP POLICY IF EXISTS "Station can update own orders" ON public.orders;
CREATE POLICY "Station can update own orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (station_id = auth.uid()) WITH CHECK (station_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_touch_updated_at ON public.orders;
CREATE TRIGGER orders_touch_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_orders_updated_at();

ALTER TABLE public.orders REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;