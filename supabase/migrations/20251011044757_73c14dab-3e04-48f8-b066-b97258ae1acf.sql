-- Remover o trigger e a função em CASCADE
DROP TRIGGER IF EXISTS sync_team_payment_trigger ON public.team_payments CASCADE;
DROP FUNCTION IF EXISTS public.sync_team_payment_to_payables() CASCADE;