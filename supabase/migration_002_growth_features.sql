-- ============================================================
-- Sem Mimimi — migração 002: funcionalidades de growth/retenção
-- (Smart Brevity, viralidade, hábito, superfãs, teste A/B de assunto)
-- Rode isto no SQL Editor do Supabase DEPOIS do schema.sql original.
-- Seguro rodar mais de uma vez (tudo usa IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- ============================================================

-- ------------------------------------------------------------
-- newsletters: "Por que importa" (TL;DR) e Assunto B (teste A/B)
-- ------------------------------------------------------------
alter table newsletters add column if not exists why_it_matters text;
alter table newsletters add column if not exists subject_b text;

-- ------------------------------------------------------------
-- newsletter_sends: qual variante de assunto (A/B) cada assinante recebeu
-- ------------------------------------------------------------
alter table newsletter_sends add column if not exists subject_variant text default 'A' check (subject_variant in ('A','B'));

-- ------------------------------------------------------------
-- newsletter_feedback: enquete rápida no fim de cada edição
-- (excelente / boa / pode_melhorar) — 1 voto por assinante por edição.
-- ------------------------------------------------------------
create table if not exists newsletter_feedback (
  id uuid primary key default gen_random_uuid(),
  newsletter_id uuid references newsletters(id) on delete cascade,
  subscriber_id uuid references newsletter_subscribers(id) on delete cascade,
  rating text not null check (rating in ('excelente','boa','pode_melhorar')),
  created_at timestamptz not null default now(),
  unique (newsletter_id, subscriber_id)
);
create index if not exists idx_newsletter_feedback_newsletter_id on newsletter_feedback(newsletter_id);

-- ------------------------------------------------------------
-- subscriber_messages: canal de feedback direto do assinante ativo
-- (seção "Superfãs" em /minha-conta)
-- ------------------------------------------------------------
create table if not exists subscriber_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  message text not null,
  status text not null default 'new' check (status in ('new','read','answered')),
  created_at timestamptz not null default now()
);
create index if not exists idx_subscriber_messages_user_id on subscriber_messages(user_id);
create index if not exists idx_subscriber_messages_created_at on subscriber_messages(created_at);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table newsletter_feedback enable row level security;
alter table subscriber_messages enable row level security;

-- newsletter_feedback: admin vê tudo; o próprio assinante só pode inserir o
-- seu voto (a leitura fica só para o admin, para não vazar contagem de votos
-- de outros assinantes pela API pública).
drop policy if exists "newsletter_feedback_admin_read" on newsletter_feedback;
create policy "newsletter_feedback_admin_read" on newsletter_feedback
  for select using (is_admin());

-- subscriber_messages: usuário vê/insere só as próprias mensagens; admin vê tudo.
drop policy if exists "subscriber_messages_own_or_admin" on subscriber_messages;
create policy "subscriber_messages_own_or_admin" on subscriber_messages
  for select using (auth.uid() = user_id or is_admin());
