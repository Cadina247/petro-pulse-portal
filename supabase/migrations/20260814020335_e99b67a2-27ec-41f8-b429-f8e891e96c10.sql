-- ORDERS: extra fields
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number bigint,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS fulfillment_type text NOT NULL DEFAULT 'pickup';

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1000;
ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT nextval('public.order_number_seq');
UPDATE public.orders SET order_number = nextval('public.order_number_seq') WHERE order_number IS NULL;
GRANT USAGE, SELECT ON SEQUENCE public.order_number_seq TO anon, authenticated, service_role;

-- EV CHARGING PORTS
CREATE TABLE IF NOT EXISTS public.ev_ports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  port_code text NOT NULL,
  charging_type text NOT NULL DEFAULT 'Level 2',
  power_kw numeric NOT NULL DEFAULT 0,
  connector_type text NOT NULL DEFAULT 'Type 2',
  price_per_kwh numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NGN',
  operating_hours text,
  is_available boolean NOT NULL DEFAULT true,
  maintenance_status text NOT NULL DEFAULT 'operational',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, port_code)
);

GRANT SELECT ON public.ev_ports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ev_ports TO authenticated;
GRANT ALL ON public.ev_ports TO service_role;
ALTER TABLE public.ev_ports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EV ports are publicly readable"
  ON public.ev_ports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owner can insert own ev ports"
  ON public.ev_ports FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner can update own ev ports"
  ON public.ev_ports FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner can delete own ev ports"
  ON public.ev_ports FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TRIGGER ev_ports_touch_updated_at
  BEFORE UPDATE ON public.ev_ports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EV BOOKINGS
CREATE TABLE IF NOT EXISTS public.ev_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  port_id uuid REFERENCES public.ev_ports(id) ON DELETE SET NULL,
  customer_id uuid,
  customer_name text NOT NULL,
  customer_phone text,
  booking_date date NOT NULL DEFAULT (now()::date),
  start_time time NOT NULL DEFAULT '09:00',
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'unpaid',
  amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.ev_bookings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.ev_bookings TO authenticated;
GRANT ALL ON public.ev_bookings TO service_role;
ALTER TABLE public.ev_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a booking"
  ON public.ev_bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Owner or customer can view bookings"
  ON public.ev_bookings FOR SELECT TO authenticated USING (owner_id = auth.uid() OR customer_id = auth.uid());
CREATE POLICY "Owner can update own bookings"
  ON public.ev_bookings FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TRIGGER ev_bookings_touch_updated_at
  BEFORE UPDATE ON public.ev_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FUEL STOCK MOVEMENTS
CREATE TABLE IF NOT EXISTS public.fuel_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid NOT NULL,
  product_id uuid REFERENCES public.fuel_products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  kind text NOT NULL DEFAULT 'received',
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'L',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.fuel_stock_movements TO authenticated;
GRANT ALL ON public.fuel_stock_movements TO service_role;
ALTER TABLE public.fuel_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Station can view own stock movements"
  ON public.fuel_stock_movements FOR SELECT TO authenticated USING (station_id = auth.uid());
CREATE POLICY "Station can add own stock movements"
  ON public.fuel_stock_movements FOR INSERT TO authenticated WITH CHECK (station_id = auth.uid());
CREATE POLICY "Station can delete own stock movements"
  ON public.fuel_stock_movements FOR DELETE TO authenticated USING (station_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.ev_ports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ev_bookings;