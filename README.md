# Sem Mimimi — plataforma de newsletter paga

Next.js (Pages Router) + Supabase (banco/auth) + Mercado Pago (assinatura recorrente) +
Sender (envio de e-mail), pronto para deploy na Vercel.

O design das 3 páginas originais (`index.html`, `assinar.html`, `edicao-exemplo.html`) foi
preservado — o CSS foi movido para `styles/globals.css` sem alterações de estética, e o
HTML das páginas estáticas (`/` e `/edicao-exemplo`) foi mantido byte a byte.
`assinar.html` virou `pages/assinar.js`: manteve a mesma seção de planos, o mesmo FAQ e o
mesmo texto, mas o botão "Assinar" agora é um formulário real (nome, e-mail, plano, dia de
recebimento, aceite de termos) que leva ao checkout do Mercado Pago.

---

## 1. Arquivos criados

```
package.json, next.config.js, vercel.json, .env.example, .gitignore
styles/globals.css                          (CSS original + estilos do admin)
components/SiteLayout.js                    (header/footer do site público)
components/AdminLayout.js                   (sidebar/topbar do admin)
pages/_app.js, pages/_document.js
pages/index.js                              (era index.html)
pages/edicao-exemplo.js                     (era edicao-exemplo.html)
pages/assinar.js                            (era assinar.html — agora com formulário real)
pages/minha-conta.js                        (login por magic link + cancelamento)
pages/termos-de-uso.js
pages/politica-de-privacidade.js
pages/politica-de-cancelamento.js
pages/admin/login.js
pages/admin/index.js                        (dashboard)
pages/admin/assinantes.js
pages/admin/assinaturas.js
pages/admin/pagamentos.js
pages/admin/envios.js
pages/admin/receitas.js
pages/admin/newsletters/index.js
pages/admin/newsletters/nova.js             (editor — criar/editar/agendar/enviar)
pages/api/subscribe.js
pages/api/unsubscribe.js
pages/api/account/cancel.js
pages/api/mercadopago/create-subscription.js  (reexport — ver nota abaixo)
pages/api/mercadopago/webhook.js
pages/api/mercadopago/subscription-status.js
pages/api/newsletter/save.js
pages/api/newsletter/preview.js
pages/api/newsletter/send-test.js
pages/api/newsletter/send.js
pages/api/newsletter/schedule.js
pages/api/cron/newsletters.js
lib/supabase/browserClient.js, serverClient.js, adminClient.js, requireAdmin.js, requireAdminApi.js
lib/mercadopago/client.js
lib/sender/client.js
lib/newsletter/render.js, revenue.js, emailTemplate.js, dispatch.js
supabase/schema.sql
supabase/seed.sql
```

> Nota: a criação da assinatura no Mercado Pago acontece dentro de `/api/subscribe`
> (que já faz tudo: cria usuário, perfil, assinante pendente e assinatura no MP).
> `pages/api/mercadopago/create-subscription.js` existe como um endpoint fino que
> reaproveita a mesma função de `lib/mercadopago/client.js`, para bater exatamente com o
> endpoint pedido no briefing — mas o fluxo real de assinatura usa `/api/subscribe`, que
> já cuida do usuário + assinatura numa chamada só (ver seção 21 do briefing original).

## 2. Arquivos alterados
Nenhum arquivo do zip original foi alterado "no lugar" — o conteúdo de `index.html`,
`assinar.html` e `edicao-exemplo.html` foi **migrado** para as páginas Next.js acima,
porque HTML estático não roda API routes, autenticação nem SSR. Os `.html` originais
podem ser descartados depois que você validar que o site novo está igual visualmente.

## 3. SQL completo
Veja `supabase/schema.sql` (schema, índices, triggers, RLS, bucket de storage) e
`supabase/seed.sql` (dados de teste).

## 4. Variáveis de ambiente necessárias
Veja `.env.example` — copie para `.env.local` (dev) e configure as mesmas na Vercel
(Project Settings → Environment Variables) para produção.

---

## 5. Passo a passo — Supabase

1. Crie um projeto em https://supabase.com.
2. Vá em **SQL Editor → New query**, cole o conteúdo de `supabase/schema.sql` e rode.
3. (Opcional, só para testar) rode `supabase/seed.sql` do mesmo jeito.
4. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ nunca no frontend, nunca no git)
5. Em **Authentication → Providers**, confirme que **Email** está habilitado. O login do
   admin usa e-mail/senha; o login do assinante em `/minha-conta` usa magic link (OTP por
   e-mail) — ambos já vêm habilitados por padrão no Supabase.
6. Em **Authentication → URL Configuration**, adicione a URL do seu site (local e/ou
   produção) em "Redirect URLs", para o magic link funcionar.

## 6. Como criar o primeiro administrador

O Supabase não deixa criar usuário de Auth só com SQL. Faça assim:

1. No Dashboard do Supabase → **Authentication → Users → Add user** → crie com e-mail e
   senha (ou peça para o próprio Tiago se cadastrar por lá).
2. Copie o `UID` do usuário criado.
3. No **SQL Editor**, rode:
   ```sql
   insert into profiles (id, email, nome, role, status)
   values ('COLE-O-UID-AQUI', 'email@do-admin.com', 'Nome do Admin', 'admin', 'active')
   on conflict (id) do update set role = 'admin';
   ```
4. Acesse `/admin/login` no site com esse e-mail/senha.

## 7. Passo a passo — Mercado Pago

1. Crie/entre na sua conta em https://www.mercadopago.com.br/developers.
2. Em **Suas integrações → Criar aplicação**, crie uma aplicação do tipo "Pagamentos online".
3. Copie o **Access Token** (use o de teste primeiro) → `MERCADOPAGO_ACCESS_TOKEN`.
4. Crie os dois planos de assinatura (uma vez só) chamando a API — pode usar o `curl` abaixo
   trocando o token (rode isso no seu terminal, não no navegador):
   ```bash
   # Plano mensal — R$ 22,00/mês
   curl -X POST 'https://api.mercadopago.com/preapproval_plan' \
     -H 'Authorization: Bearer SEU_ACCESS_TOKEN' \
     -H 'Content-Type: application/json' \
     -d '{
       "reason": "Sem Mimimi — Plano Mensal",
       "auto_recurring": { "frequency": 1, "frequency_type": "months", "transaction_amount": 22.00, "currency_id": "BRL" },
       "back_url": "https://SEUDOMINIO.com.br/minha-conta"
     }'

   # Plano anual — R$ 220,00/ano (equivalente a R$18,33/mês — 10x o valor mensal)
   curl -X POST 'https://api.mercadopago.com/preapproval_plan' \
     -H 'Authorization: Bearer SEU_ACCESS_TOKEN' \
     -H 'Content-Type: application/json' \
     -d '{
       "reason": "Sem Mimimi — Plano Anual",
       "auto_recurring": { "frequency": 12, "frequency_type": "months", "transaction_amount": 220.00, "currency_id": "BRL" },
       "back_url": "https://SEUDOMINIO.com.br/minha-conta"
     }'
   ```
   **CONFIGURAR/VERIFICAR**: confirme na documentação atual
   (`developers.mercadopago.com.br`) que `frequency: 12, frequency_type: "months"` é
   mesmo a forma correta de representar cobrança anual antes de criar o plano — o
   Mercado Pago não tem um `frequency_type: "years"` direto.
5. Copie o `id` retornado de cada plano →
   `MERCADOPAGO_PLAN_ID_MENSAL` / `MERCADOPAGO_PLAN_ID_ANUAL`.
6. Em **Suas integrações → (sua aplicação) → Webhooks**, configure a URL
   `https://SEUDOMINIO.com.br/api/mercadopago/webhook` e assine os tópicos
   **Assinaturas** (`subscription_preapproval`, `subscription_authorized_payment`) e
   **Pagamentos** (`payment`).
7. Copie a **Chave secreta** exibida ali → `MERCADOPAGO_WEBHOOK_SECRET`.
8. Quando for para produção, troque o Access Token de teste pelo de produção
   (`APP_USR-...`) e recrie os planos com o token de produção (planos de teste e de
   produção não se misturam).

## 8. Passo a passo — Sender

1. Crie uma conta em https://www.sender.net.
2. Em **Settings → API Access Tokens**, gere um token → `SENDER_API_KEY`.
3. Crie o grupo de assinantes pagantes (uma vez só):
   ```bash
   curl -X POST 'https://api.sender.net/v2/groups' \
     -H 'Authorization: Bearer SEU_TOKEN' -H 'Content-Type: application/json' -H 'Accept: application/json' \
     -d '{"title":"Assinantes Sem Mimimi"}'
   ```
   Copie o `id` retornado → `SENDER_GROUP_ID`.
4. Configure um domínio de e-mail verificado na Sender e defina
   `SENDER_FROM_EMAIL` / `SENDER_FROM_NAME` de acordo.
5. **CONFIGURAR/VERIFICAR antes de ir para produção**, direto em
   https://www.sender.net/pricing/ e no painel da sua conta:
   - limite de contatos e de envios do plano gratuito;
   - se o plano gratuito exige cartão de crédito;
   - mecanismo de webhook de eventos (aberturas/cliques) — a Sender documenta
     `POST /v2/account/webhooks`; se quiser métricas de abertura/clique reais (ver
     `25. MÉTRICAS` do briefing), configure esse webhook e crie um endpoint próprio para
     recebê-lo (não incluído nesta primeira versão);
   - a sintaxe exata do merge tag de campo personalizado usada para personalizar
     `{{nome}}` nos envios em massa (implementado como `{$nome}` em
     `lib/newsletter/render.js` — confirme que a Sender substitui esse texto de fato ao
     montar uma campanha manualmente no painel antes de confiar no envio em produção).

## 9. Configuração da Vercel

1. Importe o repositório no painel da Vercel (Framework preset: Next.js, detecta sozinho).
2. Em **Settings → Environment Variables**, cadastre todas as variáveis de `.env.example`.
3. Defina `APP_URL` como a URL final do seu domínio (ex.: `https://semmimimi.com.br`).
4. Defina `CRON_SECRET` com um valor aleatório longo (ex.: `openssl rand -hex 32`) — a
   Vercel usa isso automaticamente como Bearer token ao chamar os crons definidos em
   `vercel.json`.
5. **Já ajustado para o plano Hobby**: `vercel.json` roda o cron `/api/cron/newsletters`
   uma vez por dia, às **11:00 UTC (08:00 no horário de Brasília)** — `"0 11 * * *"`. Isso
   porque o plano **Hobby** da Vercel só permite cron 1x/dia; uma expressão como
   `*/15 * * * *` (a cada 15 min) **derruba o deploy** com o erro "Hobby accounts are
   limited to daily cron jobs".
   - **O que isso significa na prática**: o envio de uma newsletter agendada só acontece
     na próxima passada do cron das 08:00, não no minuto exato que você escolheu no admin.
     Se você agendar para terça às 09:00, ela sai no cron de quarta às 08:00 — porque o
     cron busca `scheduled_at <= agora`, então "atrasado" ainda é pego, só não no horário
     certinho. Para newsletters que saem sempre de manhã (terça/quinta), rodar 1x por dia
     de manhã já cobre o fluxo real de uso.
   - Se algum dia precisar de precisão maior (ex.: agendar pra um horário exato do dia),
     migre para o plano **Pro** e troque o `schedule` para algo como `*/15 * * * *`.
     Confirme os limites atuais em https://vercel.com/docs/cron-jobs/usage-and-pricing.
   - Se seu público estiver em outro fuso, ajuste o `11` em `vercel.json` (o valor é em
     UTC, não no horário local).
6. Configure o domínio customizado normalmente em **Settings → Domains**.

## 10. Variáveis de ambiente (resumo)

Veja o arquivo `.env.example` — cada uma está comentada com onde obtê-la.

## 11. Como fazer o primeiro teste de assinatura

1. Rode `npm install` e `npm run dev`.
2. Acesse `/assinar`, preencha o formulário com um e-mail seu real e use as
   **credenciais de teste** do Mercado Pago (cartões de teste — veja
   "Testar pagamentos" na documentação do Mercado Pago) para simular o pagamento.
3. Depois do checkout de teste, o Mercado Pago chama seu `/api/mercadopago/webhook`
   (em produção/preview; localmente use `ngrok`/`vercel dev --listen` ou o recurso de
   "Simular notificação" no painel do Mercado Pago).
4. Confira em `/admin/assinantes` e `/admin/pagamentos` se os registros apareceram.

## 12. Como criar e enviar a primeira newsletter

1. Faça login em `/admin/login`.
2. Vá em **Newsletters → + Nova newsletter**.
3. Preencha título, assunto, pré-header, imagem (opcional) e escreva o conteúdo no editor.
4. Clique em **Visualizar** para conferir o HTML final.
5. Coloque seu e-mail em **Enviar teste** e confira a caixa de entrada.
6. Clique em **Agendar / Enviar**, confira a quantidade de destinatários mostrada, e
   escolha **Confirmar envio agora** ou **Agendar envio**.
7. Acompanhe o resultado em **Envios**.

---

## Decisões técnicas registradas

- **Personalização em massa ({{nome}})**: como a API da Sender envia uma campanha por vez
  para um grupo inteiro (não uma chamada por destinatário), a personalização em envios em
  massa é feita convertendo `{{nome}}`/`{{email}}` para o merge tag de campo personalizado
  da própria Sender (`{$nome}`) — é a Sender quem substitui por destinatário no momento do
  envio. Para o **envio de teste** (1 destinatário só), a substituição é feita direto pelo
  nosso servidor (`renderNewsletter`), sem depender da Sender. Ver comentários em
  `lib/newsletter/render.js`.
- **Agendamento**: resolvido pelo nosso próprio cron (`/api/cron/newsletters`), não pelo
  agendador nativo da Sender — mantém o Supabase como única fonte de verdade sobre o que
  está agendado.
- **"Enviar teste" na Sender**: não há, na documentação pública consultada, um endpoint
  dedicado de teste de 1 e-mail separado de campanha. `lib/sender/client.js` contorna isso
  criando um grupo temporário de 1 assinante — funciona, mas vale checar no painel da
  Sender se existe uma opção nativa antes de depender disso.

---

## 13. Funcionalidades de growth adicionadas (Smart Brevity, viralidade, hábito, superfãs, A/B)

**Antes de usar em produção**, rode `supabase/migration_002_growth_features.sql` no SQL
Editor do Supabase (schema.sql já foi atualizado também, mas se seu banco já existe, use a
migração — ela é segura rodar mais de uma vez).

Resumo do que foi adicionado, arquivo por arquivo:

| Funcionalidade | Arquivos principais |
|---|---|
| Tempo de leitura + "Por que isso importa" | `lib/newsletter/readingTime.js`, `lib/newsletter/emailTemplate.js`, campo novo no editor (`pages/admin/newsletters/nova.js`) |
| Botões de compartilhar (WhatsApp/X/e-mail) + página pública de cada edição | `lib/newsletter/emailTemplate.js` (`buildShareBlock`), `pages/edicoes/[id].js` |
| Selo de prova social (contagem real de assinantes) | `pages/index.js`, `pages/assinar.js` |
| E-mail de boas-vindas / onboarding | `lib/newsletter/emailTemplate.js` (`buildWelcomeEmailHtml`), `pages/api/subscribe.js` |
| Enquete de 1 clique no fim da edição | `lib/newsletter/emailTemplate.js` (`buildRatingBlock`), `pages/api/newsletter/feedback.js` |
| Arquivo de edições + canal direto de feedback ("Superfãs") | `pages/minha-conta.js`, `pages/api/account/newsletters.js`, `pages/api/account/feedback.js`, painel em `pages/admin/assinantes.js` |
| Teste A/B de assunto | `pages/admin/newsletters/nova.js` (campo "Assunto B"), `lib/newsletter/dispatch.js` (divide a lista e envia 2 campanhas) |

**CONFIGURAR/VERIFICAR** — dois pontos que dependem de o painel da Sender se comportar como
a documentação pública sugere (confirme na prática antes de confiar em produção):
- O merge tag `{$email}` usado nos links de compartilhar/enquete dentro do corpo do e-mail
  em massa — precisa que a Sender substitua isso pelo e-mail real de cada destinatário ao
  montar a campanha.
- O campo personalizado `nome` criado ao cadastrar o assinante (`lib/sender/client.js`) —
  precisa bater com o nome do campo que a Sender realmente usa para o merge tag `{$nome}`.

**Sobre o e-mail de boas-vindas**: ele é disparado assim que o formulário de `/assinar` é
enviado — ou seja, **antes** da confirmação de pagamento pelo Mercado Pago. O texto foi
escrito para não prometer nada que ainda não aconteceu ("sua assinatura está sendo
processada"), só para não anunciar acesso que ainda depende do webhook confirmar o
pagamento.

**Sobre o teste A/B**: a divisão é 50/50 simples (sem significância estatística), e o
resultado por variante fica em `newsletter_sends.subject_variant` — cruze com
`newsletter_feedback` manualmente por enquanto (não há dashboard de comparação A/B pronto).

---

## 14. Assinatura de presente

Na tela `/assinar`, a pessoa escolhe "Para mim" ou "🎁 De presente". No modo presente:
quem preenche nome/e-mail no formulário principal é **quem paga**; os campos extras
(nome, e-mail, mensagem opcional) são de **quem recebe**. Rode
`supabase/migration_003_gift_subscriptions.sql` no Supabase antes de usar (já está
embutido no `schema.sql` também).

Fluxo: pagamento confirmado pelo webhook → a pessoa presenteada é ativada (não quem
pagou) → ela recebe um e-mail "🎁 Alguém te presenteou" com a mensagem de quem
presenteou → o link do e-mail leva pra `/minha-conta`, onde ela entra com o próprio
e-mail (magic link) e escolhe o dia preferido dela. Quem pagou continua sendo dono da
cobrança e pode cancelar a qualquer momento em `/minha-conta` — lá aparece com a etiqueta
"🎁 Presente para [nome]" em vez do card normal de assinatura.

Também corrigi a copy do site (home, `/assinar`, e-mail de boas-vindas) que dizia fixo
"terça e quinta" — hoje reflete que cada assinante escolhe o próprio dia, e esse campo
agora é editável a qualquer momento em `/minha-conta` (tanto para quem paga a própria
assinatura quanto para quem recebeu de presente).

## 15. Editor de newsletter — upload de imagem no corpo do texto

O botão "Imagem" do editor (`/admin/newsletters/nova`) agora abre o seletor de arquivo do
computador e sobe a imagem para o Supabase Storage (bucket `newsletter-media`, mesma
pasta usada pela imagem de capa), inserindo no cursor automaticamente — antes só aceitava
colar uma URL. Um botão separado "URL de imagem" ficou disponível para quem já tem a
imagem hospedada em outro lugar. Também adicionei lista numerada.

## 16. Favicon e SEO (itens 14 e 15 da checklist de lançamento)

Adicionado nesta rodada:

- **Favicon próprio**: `public/favicon.ico`, `favicon.svg`, `apple-touch-icon.png`,
  `icon-192.png`, `icon-512.png` — gerados a partir das cores da marca (fundo `--ink`,
  letras `SM` em `--red`). Ligados em `pages/_document.js`. Se quiser um logo de verdade
  em vez de "SM", troque esses arquivos por outros do mesmo tamanho (mesmos nomes) e não
  precisa mexer em código.
- **`og-image.png`** (1200×630): aparece como preview quando alguém compartilha um link
  do site no WhatsApp/X/LinkedIn — inclui o link de "Compartilhar" que vai em cada
  e-mail (`lib/newsletter/emailTemplate.js` → `/edicoes/[id]`). Mesma observação: pode
  trocar por uma arte própria, mesmo nome de arquivo.
- **`/sitemap.xml`** e **`/robots.txt`**: agora existem como rotas dinâmicas
  (`pages/sitemap.xml.js`, `pages/robots.txt.js`), não arquivos estáticos — assim eles se
  ajustam sozinhos quando você configurar `NEXT_PUBLIC_APP_URL`. O `robots.txt` bloqueia
  `/admin`, `/api` e `/minha-conta` de buscadores. Depois do domínio final no ar, cadastre
  `https://SEUDOMINIO.com.br/sitemap.xml` no Google Search Console.
- **Nova env var `NEXT_PUBLIC_APP_URL`**: igual à `APP_URL`, mas exposta ao navegador —
  usada só para montar `<link rel="canonical">`, as tags Open Graph/Twitter e o sitemap.
  Cadastre as duas (`APP_URL` e `NEXT_PUBLIC_APP_URL`) com o mesmo valor na Vercel.
- **Meta tags completas** em todas as páginas públicas via `components/SiteLayout.js`:
  canonical, Open Graph (title/description/image/url), Twitter Card. Páginas privadas
  (`/admin/*` e `/minha-conta`) ganharam `<meta name="robots" content="noindex, nofollow">`
  para nunca aparecer no Google.

**O que ainda depende de você (não dá pra automatizar):**
- Item 16 (depoimentos reais em `/assinar`) — precisa de comentários de leitores de
  verdade; me manda 3-4 prontos que eu insiro na página.
- Cadastrar o sitemap no Google Search Console depois que o domínio final estiver no ar.
- Se quiser um favicon/logo desenhado (não só as letras "SM"), me diga o estilo e eu
  gero outra versão.

## 17. Repasse do split 60/20/20 com Pix pré-calculado

Resolve a parte manual do item 9: o Mercado Pago **não** faz split automático em
assinatura recorrente (o `preapproval` descarta qualquer campo de comissão — só
Checkout Pro/Transparente/Bricks aceitam split, e mesmo assim exigem OAuth por conta
recebedora). Então continua sendo repasse manual — mas agora `/admin/receitas` deixa
isso rápido em vez de fazer conta na mão.

**Antes de usar, rode `supabase/migration_004_revenue_payouts.sql`** no SQL Editor do
Supabase (schema.sql já foi atualizado também, mas se seu banco já existe, use a
migração — ela é segura rodar mais de uma vez).

Como funciona:

1. Em `/admin/receitas`, cada um dos três nomes (Tiago Pavinatto, Eliel Duarte, Paulo
   Nascimento) aparece com um card mostrando o valor pendente de repasse.
2. Na primeira vez, configure a chave Pix de cada um (escolha o tipo — CPF, CNPJ,
   e-mail, telefone ou chave aleatória — e digite a chave; ela é normalizada
   automaticamente pro formato exato que o Pix exige, ex.: telefone vira `+55DDDNUMERO`
   sem espaço). Se um dos três já é o dono da própria conta do Mercado Pago que recebe
   a assinatura, marque "É a conta da plataforma" em vez de cadastrar Pix — não faz
   sentido ele pagar Pix pra si mesmo.
3. Todo mês, clique em **Copiar Pix Copia e Cola** — copia um código Pix pronto (com
   o valor pendente já calculado) pra colar direto no app do banco. Depois de pagar de
   verdade, clique em **Marcar como repassado**.
4. O histórico embaixo mostra o status (Pendente/Repassado) de cada alocação.

**Sobre o código Pix gerado** (`lib/newsletter/pix.js`): é um Pix **estático** — só
texto, sem gateway, sem taxa, sem credencial nenhuma (é o mesmo padrão que o app do
seu banco usa quando você pede "copiar código Pix" pra receber). Implementado do zero
seguindo o Manual do BR Code / Manual de Padrões para Iniciação do Pix (Banco
Central), com CRC16 conferido contra o vetor de teste oficial (`123456789` → `29B1`).
**Importante**: Pix estático não tem confirmação automática de pagamento — por isso o
botão "Marcar como repassado" é uma confirmação manual, não uma verificação real. Teste
com um valor pequeno primeiro (ou peça pra cada um confirmar que recebeu) antes de
confiar 100% no fluxo.

Arquivos novos: `lib/newsletter/pix.js` (gerador + normalização de chave Pix),
`pages/api/admin/revenue-recipient.js` (salvar chave Pix), `pages/api/admin/revenue-payout.js`
(marcar como repassado), `supabase/migration_004_revenue_payouts.sql`.
