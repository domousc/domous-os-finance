-- Modify client_services to support direct service management
-- Make service_id nullable since we'll use custom service names
ALTER TABLE public.client_services 
ALTER COLUMN service_id DROP NOT NULL;

-- Add service_name field for custom or predefined service names
ALTER TABLE public.client_services
ADD COLUMN IF NOT EXISTS service_name TEXT;

-- Add package_total_value for when multiple services are part of a package
ALTER TABLE public.client_services
ADD COLUMN IF NOT EXISTS package_total_value NUMERIC;

-- Update existing records to copy service name from services table
UPDATE public.client_services cs
SET service_name = s.title
FROM public.services s
WHERE cs.service_id = s.id AND cs.service_name IS NULL;