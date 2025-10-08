-- Adicionar coluna para tipo de chave PIX
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS pix_key_type text;