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
   trocando o token e os valores (rode isso no seu terminal, não no navegador):
   ```bash
   curl -X POST 'https://api.mercadopago.com/preapproval_plan' \
     -H 'Authorization: Bearer SEU_ACCESS_TOKEN' \
     -H 'Content-Type: application/json' \
     -d '{
       "reason": "Sem Mimimi — Plano Mensal",
       "auto_recurring": { "frequency": 1, "frequency_type": "months", "transaction_amount": 29.90, "currency_id": "BRL" },
       "back_url": "https://SEUDOMINIO.com.br/minha-conta"
     }'
   ```
   Repita trocando para `"frequency_type": "months", "frequency": 12`... **atenção**: o
   Mercado Pago não tem `frequency_type: years` — para o plano anual, verifique na
   documentação atual (`developers.mercadopago.com.br`) a forma correta de representar
   cobrança anual (pode ser `frequency: 12, frequency_type: "months"`) antes de criar o
   plano. **CONFIGURAR/VERIFICAR**.
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
