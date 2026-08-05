CREATE TABLE public.delivery_personnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL,
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) > 0),
  phone TEXT NOT NULL CHECK (length(trim(phone)) > 0),
  vehicle_info TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX delivery_personnel_station_id_idx
  ON public.delivery_personnel (station_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_personnel TO authenticated;
GRANT ALL ON public.delivery_personnel TO service_role;

ALTER TABLE public.delivery_personnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stations can view own delivery personnel"
  ON public.delivery_personnel
  FOR SELECT
  TO authenticated
  USING (station_id = auth.uid());

CREATE POLICY "Stations can add own delivery personnel"
  ON public.delivery_personnel
  FOR INSERT
  TO authenticated
  WITH CHECK (station_id = auth.uid());

CREATE POLICY "Stations can edit own delivery personnel"
  ON public.delivery_personnel
  FOR UPDATE
  TO authenticated
  USING (station_id = auth.uid())
  WITH CHECK (station_id = auth.uid());

CREATE POLICY "Stations can remove own delivery personnel"
  ON public.delivery_personnel
  FOR DELETE
  TO authenticated
  USING (station_id = auth.uid());