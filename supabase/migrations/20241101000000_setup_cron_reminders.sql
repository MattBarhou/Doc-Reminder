-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call our Edge Function
CREATE OR REPLACE FUNCTION send_daily_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function will be called by pg_cron
  -- It makes an HTTP request to our Edge Function
  PERFORM
    net.http_post(
      url := 'https://sjgivrbdebenyrlbmizg.supabase.co/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
END;
$$;

-- Schedule the function to run daily at 9 AM EST (which is 14:00 UTC during Eastern Standard Time)
SELECT cron.schedule(
  'daily-reminder-emails',
  '0 14 * * *', -- Every day at 9 AM EST (14:00 UTC)
  'SELECT send_daily_reminders();'
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
