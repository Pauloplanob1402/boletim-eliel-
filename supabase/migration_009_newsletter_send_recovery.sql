-- Recuperação de envios travados (ver pages/api/cron/newsletters.js e
-- lib/newsletter/dispatch.js). Rode no SQL Editor do Supabase.
alter table newsletters
  add column if not exists sending_started_at timestamptz,
  add column if not exists campaign_a_id text,
  add column if not exists campaign_b_id text;

-- Ajuda a achar rápido o que está em 'sending'.
create index if not exists idx_newsletters_sending_started_at
  on newsletters(sending_started_at) where status = 'sending';
