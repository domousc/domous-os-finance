-- Add new fields to clients table and separate CPF/CNPJ
ALTER TABLE public.clients
  ADD COLUMN company_name TEXT,
  ADD COLUMN responsible_name TEXT,
  ADD COLUMN cpf TEXT,
  ADD COLUMN cnpj TEXT;

-- Rename existing 'name' column to be clearer
COMMENT ON COLUMN public.clients.name IS 'Legacy field - use company_name or responsible_name instead';

-- Add check constraints for CPF and CNPJ formats (optional but recommended)
ALTER TABLE public.clients
  ADD CONSTRAINT cpf_format CHECK (cpf IS NULL OR length(cpf) >= 11),
  ADD CONSTRAINT cnpj_format CHECK (cnpj IS NULL OR length(cnpj) >= 14);