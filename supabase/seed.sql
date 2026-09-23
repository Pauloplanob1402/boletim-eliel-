-- ============================================================
-- Sem Mimimi — dados de teste (rode DEPOIS do schema.sql)
-- Use só em ambiente de desenvolvimento/teste, nunca em produção.
-- ============================================================

-- Newsletter de exemplo (item 24 do briefing) — fica como rascunho.
insert into newsletters (title, subject, preheader, content_html, content_text, status)
values (
  'Sem Mimimi — Edição de Teste',
  'Uma mensagem de teste do Sem Mimimi',
  'Isso é só um teste, mas leia mesmo assim.',
  '<p>Olá, {{nome}}.</p><p>Esta é uma newsletter de teste.</p><p>Clique abaixo para conhecer o conteúdo.</p><p style="text-align:center; margin:24px 0;"><a href="https://www.youtube.com/" style="display:inline-block; background:#d9591a; color:#fbf6ee; font-family:Arial,sans-serif; font-weight:bold; text-transform:uppercase; letter-spacing:1px; font-size:13px; padding:14px 26px; text-decoration:none;">ASSISTIR NO YOUTUBE</a></p>',
  'Olá, {{nome}}. Esta é uma newsletter de teste. Clique no link para conhecer o conteúdo.',
  'draft'
)
on conflict do nothing;

-- Alguns assinantes fictícios (SUBSTITUA por e-mails reais se for testar envio de verdade;
-- não use e-mails de terceiros sem consentimento, mesmo em teste).
insert into newsletter_subscribers (email, nome, status, receive_newsletter, preferred_day)
values
  ('teste1@example.com', 'Assinante Um', 'active', true, 'terça'),
  ('teste2@example.com', 'Assinante Dois', 'active', true, 'quinta'),
  ('teste3@example.com', null, 'pending', true, 'terça')
on conflict (email) do nothing;

-- NOTA SOBRE O PRIMEIRO ADMIN:
-- Não dá para inserir um admin só com SQL, porque profiles.id referencia
-- auth.users, e a Auth do Supabase não é gerenciada por INSERT direto.
-- Siga o passo "Como criar o primeiro administrador" no README.md.
