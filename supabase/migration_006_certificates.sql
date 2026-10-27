-- ============================================================
-- Sem Mimimi — migração 006: certificados com código de acesso
-- Cada certificado só sai com um código gerado no painel admin (/admin/certificados).
-- O código define o título (leitor, embaixador ou apoiador) e só pode ser resgatado por um nome.
-- Rode no SQL Editor do Supabase. Seguro rodar mais de uma vez.
-- ============================================================

create table if not exists public.certificate_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  titulo text not null check (titulo in ('leitor', 'embaixador', 'apoiador')),
  destinatario text,                      -- anotação do admin: para quem é este código
  nome text,                              -- nome que sai no certificado (preenchido ao resgatar)
  genero text check (genero in ('m', 'f')),
  resgatado_em timestamptz,
  criado_em timestamptz not null default now()
);

-- RLS ligada e SEM policies: ninguém acessa pelo navegador. Só as API routes (service role).
alter table public.certificate_codes enable row level security;
