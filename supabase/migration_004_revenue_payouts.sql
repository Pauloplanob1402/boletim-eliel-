-- ============================================================
-- Sem Mimimi — migração 004: repasse do split 60/20/20 (Pix pré-calculado)
-- Rode isto no SQL Editor do Supabase DEPOIS das migrações 001/002/003.
-- ============================================================

-- Isso não deveria ser necessário (revenue_allocations é criada no schema.sql
-- original), mas o erro "relation does not exist" mostra que ela não chegou a
-- ser criada no seu banco — então criamos aqui também, de forma segura
-- (create if not exists: se ela já existir, esta parte não faz nada).
-- Requer que "payments" e "profiles" já existam (login do admin funcionando
-- confirma que profiles existe; se "payments" também não existir, o erro
-- abaixo vai mudar de "revenue_allocations" para "payments" — me avisa).
create table if not exists revenue_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references payments(id) on delete cascade,
  recipient_name text not null,
  percentage numeric(5,2) not null,
  amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_revenue_allocations_payment_id on revenue_allocations(payment_id);

alter table revenue_allocations enable row level security;
drop policy if exists "revenue_allocations_admin_only" on revenue_allocations;
create policy "revenue_allocations_admin_only" on revenue_allocations
  for all using (is_admin()) with check (is_admin());

-- revenue_allocations já existe (schema.sql) e é só contábil — cada linha
-- registra quanto CADA UM deveria receber a cada pagamento aprovado. Esta
-- migração adiciona o controle de "isso já foi repassado de verdade ou
-- ainda está pendente", pra alimentar o botão de repasse em /admin/receitas.
alter table revenue_allocations
  add column if not exists payout_status text not null default 'pending'
    check (payout_status in ('pending', 'paid'));
alter table revenue_allocations add column if not exists paid_at timestamptz;
alter table revenue_allocations add column if not exists paid_by uuid references profiles(id);

create index if not exists idx_revenue_allocations_payout_status on revenue_allocations(payout_status);

-- ------------------------------------------------------------
-- revenue_recipients: configuração da chave Pix de cada um dos 3
-- beneficiários (ver lib/newsletter/revenue.js -> REVENUE_SPLIT_TABLE, que
-- define os nomes e percentuais). Preenchido pelo admin na própria tela de
-- /admin/receitas, não precisa editar SQL depois de rodar esta migração.
-- ------------------------------------------------------------
create table if not exists revenue_recipients (
  id uuid primary key default gen_random_uuid(),
  recipient_name text not null unique,
  pix_key text,
  pix_key_type text check (pix_key_type in ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
  pix_city text not null default 'BRASILIA',
  -- Marque true para quem JÁ é o dono da conta do Mercado Pago que recebe a
  -- assinatura (essa pessoa não precisa de repasse via Pix — o dinheiro já
  -- está na conta dela). Ver README seção 17.
  is_platform_account boolean not null default false,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_revenue_recipients_updated_at on revenue_recipients;
create trigger trg_revenue_recipients_updated_at before update on revenue_recipients
  for each row execute function set_updated_at();

-- Garante uma linha por beneficiário do split, mesmo sem chave Pix ainda —
-- assim a tela de admin já mostra os 3 cards prontos para preencher.
insert into revenue_recipients (recipient_name)
values ('Tiago Pavinatto'), ('Eliel Duarte'), ('Paulo Nascimento')
on conflict (recipient_name) do nothing;

alter table revenue_recipients enable row level security;

drop policy if exists "revenue_recipients_admin_only" on revenue_recipients;
create policy "revenue_recipients_admin_only" on revenue_recipients
  for all using (is_admin()) with check (is_admin());
