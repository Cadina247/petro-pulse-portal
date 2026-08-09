-- 1. WALLETS ---------------------------------------------------------------
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type text NOT NULL DEFAULT 'station',
  balance_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NGN',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read own wallet" ON public.wallets
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owner can create own wallet" ON public.wallets
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Admins can read all wallets" ON public.wallets
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can update wallets" ON public.wallets
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER wallets_touch_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. CREDIT TRANSACTIONS ----------------------------------------------------
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents bigint NOT NULL,
  kind text NOT NULL DEFAULT 'topup',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read own transactions" ON public.credit_transactions
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owner can add own top-ups" ON public.credit_transactions
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND kind = 'topup' AND amount_cents > 0);
CREATE POLICY "Admins can read all transactions" ON public.credit_transactions
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.apply_credit_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.wallets
     SET balance_cents = GREATEST(balance_cents + NEW.amount_cents, 0)
   WHERE id = NEW.wallet_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER credit_transactions_apply
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW EXECUTE FUNCTION public.apply_credit_transaction();

-- 3. WALLET AUTO-CREATION ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_wallet(_owner uuid, _type text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.wallets (owner_id, account_type)
  VALUES (_owner, COALESCE(_type, 'station'))
  ON CONFLICT (owner_id) DO NOTHING;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_station_wallet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_wallet(NEW.id, 'station');
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_vendor_wallet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_wallet(NEW.user_id, 'vendor');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_station_created_wallet
  AFTER INSERT ON public.stations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_station_wallet();

CREATE TRIGGER on_vendor_created_wallet
  AFTER INSERT ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_vendor_wallet();

INSERT INTO public.wallets (owner_id, account_type)
  SELECT id, 'station' FROM public.stations ON CONFLICT (owner_id) DO NOTHING;
INSERT INTO public.wallets (owner_id, account_type)
  SELECT user_id, 'vendor' FROM public.vendors ON CONFLICT (owner_id) DO NOTHING;

-- 4. CREDIT HELPER ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_credit(_owner uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT balance_cents > 0 FROM public.wallets WHERE owner_id = _owner), false);
$$;

-- 5. SERVICES ---------------------------------------------------------------
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type text NOT NULL DEFAULT 'station',
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  description text,
  is_free boolean NOT NULL DEFAULT false,
  is_available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, name)
);

GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services are publicly readable" ON public.services
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owner can add services with credit or free" ON public.services
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND (is_free OR public.has_credit(auth.uid())));
CREATE POLICY "Owner can update services with credit or free" ON public.services
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND (is_free OR public.has_credit(auth.uid())))
  WITH CHECK (owner_id = auth.uid() AND (is_free OR public.has_credit(auth.uid())));
CREATE POLICY "Owner can delete own services" ON public.services
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TRIGGER services_touch_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.seed_default_services(_owner uuid, _type text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.services (owner_id, account_type, name, category, is_free, is_available, sort_order)
  VALUES
    (_owner, _type, 'Toilet Facility', 'toilet',   true,  false, 1),
    (_owner, _type, 'Car Wash',        'carwash',  false, false, 2),
    (_owner, _type, 'EV Charging',     'ev',       false, false, 3),
    (_owner, _type, 'Mini Mart',       'shop',     false, false, 4)
  ON CONFLICT (owner_id, name) DO NOTHING;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_station_services()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.seed_default_services(NEW.id, 'station');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_station_created_services
  AFTER INSERT ON public.stations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_station_services();

INSERT INTO public.services (owner_id, account_type, name, category, is_free, is_available, sort_order)
SELECT s.id, 'station', v.name, v.category, v.is_free, false, v.sort_order
FROM public.stations s
CROSS JOIN (VALUES
  ('Toilet Facility','toilet',true,1),
  ('Car Wash','carwash',false,2),
  ('EV Charging','ev',false,3),
  ('Mini Mart','shop',false,4)
) AS v(name, category, is_free, sort_order)
ON CONFLICT (owner_id, name) DO NOTHING;

-- 6. CREDIT GATE ON PAID FUEL LISTINGS --------------------------------------
DROP POLICY IF EXISTS "Station can insert own fuel products" ON public.fuel_products;
DROP POLICY IF EXISTS "Station can update own fuel products" ON public.fuel_products;

CREATE POLICY "Station can insert own fuel products" ON public.fuel_products
  FOR INSERT TO authenticated
  WITH CHECK (station_id = auth.uid() AND public.has_credit(auth.uid()));
CREATE POLICY "Station can update own fuel products" ON public.fuel_products
  FOR UPDATE TO authenticated
  USING (station_id = auth.uid() AND public.has_credit(auth.uid()))
  WITH CHECK (station_id = auth.uid() AND public.has_credit(auth.uid()));

-- 7. PUBLIC LISTINGS GATED BY VERIFICATION + CREDIT -------------------------
CREATE OR REPLACE FUNCTION public.list_public_stations()
RETURNS TABLE(id uuid, station_name text, address text, latitude numeric, longitude numeric,
              logo_url text, is_available boolean, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.station_name, s.address, s.latitude, s.longitude, s.logo_url,
         s.is_available, s.created_at, s.updated_at
  FROM public.stations s
  WHERE s.verification_status = 'verified' AND public.has_credit(s.id);
$$;

CREATE OR REPLACE FUNCTION public.list_public_vendors()
RETURNS TABLE(id uuid, business_name text, address text, latitude numeric, longitude numeric,
              products_sold text[], estimated_quantity text, delivery_available boolean,
              is_available boolean, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.id, v.business_name, v.address, v.latitude, v.longitude, v.products_sold,
         v.estimated_quantity, v.delivery_available, v.is_available, v.created_at
  FROM public.vendors v
  WHERE v.verification_status = 'verified' AND public.has_credit(v.user_id);
$$;

-- 8. FULL STATION PROFILE FOR THE MOBILE APP --------------------------------
CREATE OR REPLACE FUNCTION public.get_station_profile(_station_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'station', jsonb_build_object(
      'id', s.id, 'station_name', s.station_name, 'address', s.address,
      'phone', s.phone, 'latitude', s.latitude, 'longitude', s.longitude,
      'logo_url', s.logo_url, 'is_available', s.is_available,
      'has_credit', public.has_credit(s.id)
    ),
    'fuel_products', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', f.id, 'product_name', f.product_name, 'price', f.price,
        'quantity_available', f.quantity_available, 'unit', f.unit,
        'currency', f.currency, 'is_available', f.is_available,
        'last_updated_at', f.last_updated_at
      ) ORDER BY f.sort_order)
      FROM public.fuel_products f
      WHERE f.station_id = s.id AND public.has_credit(s.id)
    ), '[]'::jsonb),
    'services', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', sv.id, 'name', sv.name, 'category', sv.category,
        'description', sv.description, 'is_free', sv.is_free,
        'is_available', sv.is_available
      ) ORDER BY sv.sort_order)
      FROM public.services sv
      WHERE sv.owner_id = s.id
        AND sv.is_available
        AND (sv.is_free OR public.has_credit(s.id))
    ), '[]'::jsonb)
  )
  FROM public.stations s
  WHERE s.id = _station_id AND s.verification_status = 'verified';
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;