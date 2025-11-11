-- Create cron job to process campaigns every 5 minutes
SELECT cron.schedule(
  'process-campaigns',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/process-campaigns',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdXloaXhuandqbm9tYmdjeWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTgzMjUsImV4cCI6MjA3Njk3NDMyNX0.mqg6oW3Ec-BsNuNQ90_in3jrv2H6EWOjiNAnDwLd1P8"}'::jsonb
  ) as request_id;
  $$
);