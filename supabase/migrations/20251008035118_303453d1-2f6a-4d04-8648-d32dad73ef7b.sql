-- Migrar dados existentes de 'marketing' e 'team' para 'others'
UPDATE company_expenses 
SET type = 'others' 
WHERE type IN ('marketing', 'team');