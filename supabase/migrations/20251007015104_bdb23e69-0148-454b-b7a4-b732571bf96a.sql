-- Limpar banco de dados - deletar dados de clientes, parceiros e financeiros
-- Ordem correta para respeitar foreign keys

-- 1. Deletar comissões de parceiros
DELETE FROM public.partner_commissions;

-- 2. Deletar comissões de clientes
DELETE FROM public.commissions;

-- 3. Deletar faturas
DELETE FROM public.invoices;

-- 4. Deletar serviços vinculados a clientes
DELETE FROM public.client_services;

-- 5. Deletar acordos entre parceiros e clientes
DELETE FROM public.partner_client_agreements;

-- 6. Deletar parceiros
DELETE FROM public.partners;

-- 7. Deletar clientes
DELETE FROM public.clients;