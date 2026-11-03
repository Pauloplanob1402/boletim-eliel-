-- ============================================================
-- Sem Mimimi — migração 008: cupons de desconto
-- Rode no SQL Editor do Supabase. Seguro rodar mais de uma vez.
--
-- Como funciona:
--  * coupons: o cupom (código, % de desconto, limite de usos).
--  * coupon_redemptions: quem usou. 'reserved' = pegou o cupom no checkout
--    (a vaga fica guardada por 24h); 'redeemed' = o pagamento foi confirmado
--    e a vaga é definitiva. Reservas de 24h+ que nunca foram pagas liberam a vaga.
--  * reserve_coupon(): reserva a vaga de forma atômica (sem passar do limite
--    mesmo com várias pessoas ao mesmo tempo).
--  * Quem já tem um cupom 'redeemed' mantém o desconto nas próximas cobranças.
-- ============================================================

create table if not exists coupons (
  code text primary key,
  percent_off integer not null check (percent_off between 1 and 100),
  max_redemptions integer not null check (max_redemptions > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_code text not null references coupons(code) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'reserved' check (status in ('reserved', 'redeemed')),
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  unique (coupon_code, user_id)
);
create index if not exists idx_coupon_redemptions_user on coupon_redemptions(user_id);
create index if not exists idx_coupon_redemptions_code_status on coupon_redemptions(coupon_code, status);

-- Sem policies de propósito: só o backend (service role) lê e escreve.
alter table coupons enable row level security;
alter table coupon_redemptions enable row level security;

create or replace function reserve_coupon(p_code text, p_user uuid)
returns table (o_ok boolean, o_percent integer, o_reason text)
language plpgsql
as $$
declare
  c coupons%rowtype;
  used integer;
begin
  -- Trava a linha do cupom: reservas simultâneas entram uma de cada vez.
  select * into c from coupons where code = upper(trim(p_code)) for update;
  if not found or not c.active then
    return query select false, 0, 'invalido'::text;
    return;
  end if;

  -- Libera vagas reservadas há mais de 24h que nunca viraram pagamento.
  delete from coupon_redemptions
   where coupon_code = c.code and status = 'reserved' and created_at < now() - interval '24 hours';

  -- Quem já tem o cupom (reservado ou pago) não gasta outra vaga.
  if exists (select 1 from coupon_redemptions where coupon_code = c.code and user_id = p_user) then
    return query select true, c.percent_off, 'ok'::text;
    return;
  end if;

  select count(*) into used from coupon_redemptions where coupon_code = c.code;
  if used >= c.max_redemptions then
    return query select false, 0, 'esgotado'::text;
    return;
  end if;

  insert into coupon_redemptions (coupon_code, user_id) values (c.code, p_user);
  return query select true, c.percent_off, 'ok'::text;
end;
$$;

-- A função não pode ser chamada pela chave pública (anon) do Supabase.
revoke all on function reserve_coupon(text, uuid) from public, anon, authenticated;
grant execute on function reserve_coupon(text, uuid) to service_role;

-- O cupom de lançamento: 10% para os 274 primeiros.
insert into coupons (code, percent_off, max_redemptions)
values ('PRIMEIROS274', 10, 274)
on conflict (code) do nothing;

-- Para acompanhar: quantas vagas já foram usadas
--   select status, count(*) from coupon_redemptions where coupon_code = 'PRIMEIROS274' group by status;
