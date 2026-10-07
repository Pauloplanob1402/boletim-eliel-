-- ============================================================
-- Sem Mimimi — migração 005: manter o projeto Supabase ativo
-- O plano gratuito pausa o projeto após 7 dias sem uso. Esta tabelinha pública, só de leitura,
-- é consultada pelo GitHub a cada 3 dias (.github/workflows/keep-supabase-alive.yml).
-- Rode no SQL Editor do Supabase. Seguro rodar mais de uma vez.
-- ============================================================

create table if not exists public.keep_alive (
  id int primary key,
  nota text
);
insert into public.keep_alive (id, nota) values (1, 'ping') on conflict (id) do nothing;

alter table public.keep_alive enable row level security;
drop policy if exists "keep_alive: leitura publica" on public.keep_alive;
create policy "keep_alive: leitura publica" on public.keep_alive for select to anon, authenticated using (true);
grant select on public.keep_alive to anon, authenticated;
