-- Remove the existing foreign key constraint
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_client_service_id_fkey;

-- Add the foreign key constraint with ON DELETE SET NULL
-- This allows deleting client_services and sets client_service_id to NULL in related invoices
ALTER TABLE public.invoices
ADD CONSTRAINT invoices_client_service_id_fkey 
FOREIGN KEY (client_service_id) 
REFERENCES public.client_services(id) 
ON DELETE SET NULL;