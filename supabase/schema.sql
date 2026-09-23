-- ============================================================
-- Sem Mimimi — schema completo do Supabase (PostgreSQL)
-- Rode este arquivo inteiro no SQL Editor do Supabase (Dashboard
-- > SQL Editor > New query), uma única vez, em um projeto novo.
-- ============================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ------------------------------------------------------------
-- Função utilitária: mantém updated_at sempre em dia
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  nome text,
  telefone text,
  role text not null default 'subscriber' check (role in ('admin', 'subscriber')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  -- LGPD (item 17 do briefing)
  accepted_terms_at timestamptz,
  accepted_privacy_at timestamptz,
  newsletter_opt_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_profiles_created_at on profiles(created_at);
drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- subscriptions
-- ------------------------------------------------------------
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  mp_subscription_id text,
  mp_preapproval_id text unique,
  plan_id text not null,
  status text not null default 'pending'
    check (status in ('pending','authorized','active','paused','canceled','expired','rejected')),
  amount numeric(10,2),
  currency text not null default 'BRL',
  started_at timestamptz,
  next_billing_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_user_id on subscriptions(user_id);
create index if not exists idx_subscriptions_status on subscriptions(status);
create index if not exists idx_subscriptions_created_at on subscriptions(created_at);
drop trigger if exists trg_subscriptions_updated_at on subscriptions;
create trigger trg_subscriptions_updated_at before update on subscriptions
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- payments
-- ------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  subscription_id uuid references subscriptions(id) on delete set null,
  mp_payment_id text unique,
  mp_external_reference text,
  amount numeric(10,2),
  currency text not null default 'BRL',
  status text not null, -- approved | pending | in_process | rejected | refunded | cancelled
  payment_method text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_payments_user_id on payments(user_id);
create index if not exists idx_payments_status on payments(status);
create index if not exists idx_payments_created_at on payments(created_at);

-- ------------------------------------------------------------
-- newsletter_subscribers
-- ------------------------------------------------------------
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  email text not null unique,
  nome text,
  status text not null default 'active' check (status in ('active','inactive','pending','unsubscribed')),
  receive_newsletter boolean not null default true,
  preferred_day text check (preferred_day in ('segunda','terça','quarta','quinta','sexta','sábado','domingo')),
  preferred_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_newsletter_subscribers_email on newsletter_subscribers(email);
create index if not exists idx_newsletter_subscribers_status on newsletter_subscribers(status);
create index if not exists idx_newsletter_subscribers_preferred_day on newsletter_subscribers(preferred_day);
create index if not exists idx_newsletter_subscribers_created_at on newsletter_subscribers(created_at);
drop trigger if exists trg_newsletter_subscribers_updated_at on newsletter_subscribers;
create trigger trg_newsletter_subscribers_updated_at before update on newsletter_subscribers
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- newsletters
-- ------------------------------------------------------------
create table if not exists newsletters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  preheader text,
  content_html text not null,
  content_text text,
  hero_image_url text,
  status text not null default 'draft' check (status in ('draft','scheduled','sending','sent','failed')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_newsletters_status on newsletters(status);
create index if not exists idx_newsletters_scheduled_at on newsletters(scheduled_at);
create index if not exists idx_newsletters_created_at on newsletters(created_at);
drop trigger if exists trg_newsletters_updated_at on newsletters;
create trigger trg_newsletters_updated_at before update on newsletters
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- newsletter_sends
-- ------------------------------------------------------------
create table if not exists newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  newsletter_id uuid references newsletters(id) on delete cascade,
  subscriber_id uuid references newsletter_subscribers(id) on delete set null,
  email text,
  sender_message_id text,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);
create index if not exists idx_newsletter_sends_newsletter_id on newsletter_sends(newsletter_id);
create index if not exists idx_newsletter_sends_status on newsletter_sends(status);

-- ------------------------------------------------------------
-- revenue_allocations
-- ------------------------------------------------------------
create table if not exists revenue_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references payments(id) on delete cascade,
  recipient_name text not null,
  percentage numeric(5,2) not null,
  amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_revenue_allocations_payment_id on revenue_allocations(payment_id);

-- Regra de divisão fixa (60/20/20) — ver lib/mercadopago/client.js -> calculateRevenueSplit()
-- e pages/api/mercadopago/webhook.js, que já inserem essas linhas a cada
-- pagamento aprovado. Esta tabela é só contábil: NÃO faz nenhuma transferência
-- automática de dinheiro para Eliel Duarte ou Paulo Nascimento — isso exigiria
-- integração explícita com o split payment / marketplace do Mercado Pago e a
-- configuração de contas recebedoras, que não foi pedida neste escopo.

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table payments enable row level security;
alter table newsletter_subscribers enable row level security;
alter table newsletters enable row level security;
alter table newsletter_sends enable row level security;
alter table revenue_allocations enable row level security;

-- Helper: é admin? (evita repetir a subquery em toda policy)
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

-- profiles: usuário vê/edita só o próprio perfil; admin vê tudo.
create policy "profiles_select_own_or_admin" on profiles
  for select using (auth.uid() = id or is_admin());
create policy "profiles_update_own_or_admin" on profiles
  for update using (auth.uid() = id or is_admin());
-- Inserção/alteração de role feita só pelo backend (service role, que ignora RLS).

-- subscriptions: usuário vê só as próprias; ninguém (além do backend) atualiza direto.
create policy "subscriptions_select_own_or_admin" on subscriptions
  for select using (auth.uid() = user_id or is_admin());
-- Sem policy de insert/update/delete para authenticated: alterações de status de
-- assinatura só acontecem via service role (nas API routes), nunca direto do cliente.

-- payments: usuário vê só os próprios; admin vê tudo.
create policy "payments_select_own_or_admin" on payments
  for select using (auth.uid() = user_id or is_admin());

-- newsletter_subscribers: usuário vê/edita só o próprio registro (ex.: preferências); admin vê tudo.
create policy "newsletter_subscribers_select_own_or_admin" on newsletter_subscribers
  for select using (auth.uid() = user_id or is_admin());
create policy "newsletter_subscribers_update_own_or_admin" on newsletter_subscribers
  for update using (auth.uid() = user_id or is_admin());

-- newsletters: conteúdo administrativo — só admin.
create policy "newsletters_admin_only" on newsletters
  for all using (is_admin()) with check (is_admin());

-- newsletter_sends: só admin (métricas de envio).
create policy "newsletter_sends_admin_only" on newsletter_sends
  for all using (is_admin()) with check (is_admin());

-- revenue_allocations: só admin.
create policy "revenue_allocations_admin_only" on revenue_allocations
  for all using (is_admin()) with check (is_admin());

-- ============================================================
-- STORAGE — bucket para imagens de newsletter (hero image / upload no editor)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('newsletter-media', 'newsletter-media', true)
on conflict (id) do nothing;

create policy "newsletter_media_public_read" on storage.objects
  for select using (bucket_id = 'newsletter-media');

create policy "newsletter_media_admin_write" on storage.objects
  for insert with check (bucket_id = 'newsletter-media' and is_admin());

create policy "newsletter_media_admin_update" on storage.objects
  for update using (bucket_id = 'newsletter-media' and is_admin());

create policy "newsletter_media_admin_delete" on storage.objects
  for delete using (bucket_id = 'newsletter-media' and is_admin());
