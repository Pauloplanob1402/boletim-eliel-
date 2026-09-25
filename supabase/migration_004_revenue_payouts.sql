-- ============================================================
-- Sem Mimimi — migração 004: repasse do split 60/20/20 (Pix pré-calculado)
-- Rode isto no SQL Editor do Supabase DEPOIS das migrações 001/002/003.
-- ============================================================

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

create trigger trg_revenue_recipients_updated_at before update on revenue_recipients
  for each row execute function set_updated_at();

-- Garante uma linha por beneficiário do split, mesmo sem chave Pix ainda —
-- assim a tela de admin já mostra os 3 cards prontos para preencher.
insert into revenue_recipients (recipient_name)
values ('Tiago Pavinatto'), ('Eliel Duarte'), ('Paulo Nascimento')
on conflict (recipient_name) do nothing;

alter table revenue_recipients enable row level security;

create policy "revenue_recipients_admin_only" on revenue_recipients
  for all using (is_admin()) with check (is_admin());
