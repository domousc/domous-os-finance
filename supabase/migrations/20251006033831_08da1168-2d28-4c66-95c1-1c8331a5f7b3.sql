-- Add billing_period enum to plans table
CREATE TYPE public.billing_period AS ENUM ('monthly', 'semiannual', 'annual');

-- Add billing_period column to plans table
ALTER TABLE public.plans
ADD COLUMN billing_period public.billing_period NOT NULL DEFAULT 'monthly';