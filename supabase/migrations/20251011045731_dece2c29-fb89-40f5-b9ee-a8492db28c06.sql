-- Habilitar extensões necessárias para cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Configurar cron job para gerar salários mensalmente
-- Todo dia 1º de cada mês às 00:00 (horário UTC)
SELECT cron.schedule(
  'generate-monthly-salaries',
  '0 0 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://ylejfvqwkrgvfcixlpze.supabase.co/functions/v1/team-automation?action=generate_salaries',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsZWpmdnF3a3JndmZjaXhscHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjMyNzYsImV4cCI6MjA3NTIzOTI3Nn0.aZcI9E1nMZpk5ns402bZ7WFk-bFBeo8sF6-5amo7Q1o"}'::jsonb
  ) AS request_id;
  $$
);

-- Configurar cron job para atualizar status de pagamentos atrasados
-- Todo dia às 01:00 (horário UTC)
SELECT cron.schedule(
  'update-overdue-payments',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ylejfvqwkrgvfcixlpze.supabase.co/functions/v1/team-automation?action=update_overdue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsZWpmdnF3a3JndmZjaXhscHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjMyNzYsImV4cCI6MjA3NTIzOTI3Nn0.aZcI9E1nMZpk5ns402bZ7WFk-bFBeo8sF6-5amo7Q1o"}'::jsonb
  ) AS request_id;
  $$
);