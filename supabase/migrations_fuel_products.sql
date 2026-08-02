-- =========================================================
-- Run in the Supabase SQL Editor for project fytksuhwheohqcobuzbk
-- AFTER supabase/schema.sql.
--
-- Single source of truth for fuel/product availability consumed by
-- the "Fuel Forward Drive" mobile app.
-- =========================================================

-- 1) TABLE ------------------------------------------------
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

-- 2) GRANTS -----------------------------------------------
GRANT SELECT ON public.fuel_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fuel_products TO authenticated;
GRANT ALL ON public.fuel_products TO service_role;

-- 3) RLS --------------------------------------------------
ALTER TABLE public.fuel_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Fuel products are publicly readable" ON public.fuel_products;
CREATE POLICY "Fuel products are publicly readable"
  ON public.fuel_products FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Station can insert own fuel products" ON public.fuel_products;
CREATE POLICY "Station can insert own fuel products"
  ON public.fuel_products FOR INSERT TO authenticated
  WITH CHECK (station_id = auth.uid());

DROP POLICY IF EXISTS "Station can update own fuel products" ON public.fuel_products;
CREATE POLICY "Station can update own fuel products"
  ON public.fuel_products FOR UPDATE TO authenticated
  USING (station_id = auth.uid())
  WITH CHECK (station_id = auth.uid());

DROP POLICY IF EXISTS "Station can delete own fuel products" ON public.fuel_products;
CREATE POLICY "Station can delete own fuel products"
  ON public.fuel_products FOR DELETE TO authenticated
  USING (station_id = auth.uid());

-- 4) last_updated_at trigger ------------------------------
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

-- 5) Seed default products for every station --------------
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

-- Backfill existing stations
SELECT public.seed_fuel_products(id) FROM public.stations;

-- 6) REALTIME ---------------------------------------------
ALTER TABLE public.fuel_products REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.fuel_products;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
