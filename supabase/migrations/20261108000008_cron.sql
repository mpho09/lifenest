-- 0008 Scheduled jobs (Section 8.5)
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('hourly_jobs', '5 * * * *', 'select public.run_hourly_jobs()');
select cron.schedule('send_emails', '*/5 * * * *', 'select public.trigger_send_emails()');
