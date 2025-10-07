-- Make service references optional for commission invoices
ALTER TABLE public.invoices
  ALTER COLUMN client_service_id DROP NOT NULL,
  ALTER COLUMN service_id DROP NOT NULL;