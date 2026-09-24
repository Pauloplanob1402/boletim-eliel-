-- ============================================================
-- Sem Mimimi — migração 003: assinatura de presente
-- Rode isto no SQL Editor do Supabase DEPOIS das migrações 001/002.
-- ============================================================

alter table subscriptions add column if not exists is_gift boolean not null default false;
alter table subscriptions add column if not exists gift_sender_name text;
alter table subscriptions add column if not exists gift_recipient_name text;
alter table subscriptions add column if not exists gift_recipient_email text;
alter table subscriptions add column if not exists gift_message text;

create index if not exists idx_subscriptions_is_gift on subscriptions(is_gift);
