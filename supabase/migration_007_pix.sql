-- ============================================================
-- Sem Mimimi — migração 007: pagamento avulso por Pix
-- Rode no SQL Editor do Supabase. Seguro rodar mais de uma vez.
-- Assinatura por Pix não renova sozinha: billing_type = 'pix' e o acesso
-- vale até valid_until (o cron diário marca como 'expired' depois disso).
-- ============================================================

alter table subscriptions
  add column if not exists billing_type text not null default 'recurring';

alter table subscriptions drop constraint if exists subscriptions_billing_type_check;
alter table subscriptions
  add constraint subscriptions_billing_type_check check (billing_type in ('recurring', 'pix'));

alter table subscriptions add column if not exists valid_until timestamptz;

create index if not exists idx_subscriptions_billing_valid
  on subscriptions(billing_type, status, valid_until);
