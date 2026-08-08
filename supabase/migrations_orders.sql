-- =========================================================
-- Run in the Supabase SQL Editor for project fytksuhwheohqcobuzbk
-- AFTER supabase/schema.sql and migrations_fuel_products.sql.
--
-- Customer orders placed from the "Fuel Forward Drive" mobile app.
-- The station selected by the customer receives them live in the portal.
-- =========================================================

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

-- Customers (mobile app) can place orders.
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order"
  ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- The station only sees its own orders.
DROP POLICY IF EXISTS "Station can view own orders" ON public.orders;
CREATE POLICY "Station can view own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (station_id = auth.uid() OR customer_id = auth.uid());

-- The station updates the status of its own orders.
DROP POLICY IF EXISTS "Station can update own orders" ON public.orders;
CREATE POLICY "Station can update own orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (station_id = auth.uid())
  WITH CHECK (station_id = auth.uid());

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

-- Realtime so the portal is notified the moment an order arrives.
ALTER TABLE public.orders REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
