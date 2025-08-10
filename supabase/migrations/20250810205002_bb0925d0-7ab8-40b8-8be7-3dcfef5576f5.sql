-- Create enum for token statuses
DO $$ BEGIN
  CREATE TYPE public.token_status AS ENUM ('issued', 'redeemed', 'void');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create tokens table
CREATE TABLE IF NOT EXISTS public.tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  value_cents INTEGER NOT NULL CHECK (value_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  status public.token_status NOT NULL DEFAULT 'issued',
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies (temporary open access; recommend enabling auth + roles later)
DO $$ BEGIN
  CREATE POLICY "Public can read tokens"
  ON public.tokens
  FOR SELECT
  TO public
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can redeem issued tokens"
  ON public.tokens
  FOR UPDATE
  TO public
  USING (status = 'issued'::public.token_status)
  WITH CHECK (status = 'redeemed'::public.token_status AND redeemed_at IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Updated at trigger
DO $$ BEGIN
  CREATE TRIGGER update_tokens_updated_at
  BEFORE UPDATE ON public.tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
