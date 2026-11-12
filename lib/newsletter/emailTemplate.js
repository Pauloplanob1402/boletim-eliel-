// Monta o HTML final do e-mail a partir do conteúdo criado no editor do admin.
// Regras seguidas (clientes de e-mail não são navegadores):
//   - sem <script>, sem CSS externo/complexo — tudo inline;
//   - layout em tabelas (<table>), não flexbox/grid;
//   - imagens sempre via HTTPS;
//   - link de descadastro obrigatório em toda newsletter (LGPD).
//
// Cores de marca (pop-art, mesmas do site; e-mail não aceita variáveis CSS):
const COLORS = {
  bg: '#fff7e0',
  bg2: '#ffeeb8',
  ink: '#141414',
  dim: '#3d372c',
  red: '#e5322d',
  redDark: '#c4231e',
  gold: '#ffd21f',
  line: '#141414',
};

// Fonte dos títulos: no site é Lilita One (fonte da web, que quase nenhum cliente de e-mail carrega).
// Arial Black é a parente mais próxima que existe em Windows, macOS e iOS; no Android/Gmail cai em Arial bold.
const FONT_DISPLAY = "'Arial Black', Arial, sans-serif";
// A "sombra dura" pop-art do site (box-shadow) é feita com bordas grossas à direita e embaixo, que funcionam em
// todos os clientes, inclusive Outlook.
const CARD_BORDER = `border:2px solid ${COLORS.line}; border-right:5px solid ${COLORS.line}; border-bottom:5px solid ${COLORS.line};`;
const BTN_BORDER = `border:2px solid ${COLORS.line}; border-right:4px solid ${COLORS.line}; border-bottom:4px solid ${COLORS.line};`;

// Cabeçalho de marca, igual ao do site: "SEM" em tinta e "MIMIMI" em vermelho, com régua grossa embaixo.
function brandHeaderRow(rightCell = '') {
  return `<tr>
            <td style="padding:0 4px 16px; border-bottom:3px solid ${COLORS.line};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:${FONT_DISPLAY}; font-weight:bold; font-size:22px; line-height:1; letter-spacing:.5px; text-transform:uppercase; color:${COLORS.ink};">SEM <span style="color:${COLORS.redDark};">MIMIMI</span></td>
                  ${rightCell}
                </tr>
              </table>
            </td>
          </tr>`;
}

/**
 * @param {object} params
 * @param {string} params.title            Título interno (exibido como H1 no topo do e-mail)
 * @param {string} params.preheader        Pré-header (texto de prévia na caixa de entrada)
 * @param {string} params.heroImageUrl     URL https opcional da imagem principal
 * @param {string} params.bodyHtml         HTML já produzido pelo editor (ver lib/newsletter/editorHtml.js)
 * @param {number} [params.readingMinutes] Tempo estimado de leitura (Smart Brevity) — ver lib/newsletter/readingTime.js
 * @param {string} [params.whyItMatters]   Texto (1 tópico por linha) do bloco "Por que isso importa"
 * @param {string} [params.shareUrl]       Link público da edição, usado nos botões de compartilhar (Contagious)
 * @param {object} [params.ratingLinks]    { excelente, boa, pode_melhorar } — URLs da enquete rápida
 * @param {string} params.unsubscribeUrl
 */
// Imagens inseridas no texto podem ter milhares de pixels de largura. Sem uma largura explícita,
// o Outlook (e outros clientes) ignora o max-width, alarga o e-mail inteiro e "encolhe" tudo para caber
// na tela: o texto fica minúsculo. Aqui toda <img> do corpo sai com largura fixa de 592px (o miolo do
// e-mail de 600px) e altura automática, mantendo a proporção.
const CONTENT_IMG_WIDTH = 592;
function constrainContentImages(html) {
  return String(html || '').replace(/<img\b[^>]*>/gi, (tag) => {
    const src = tag.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)')/i);
    if (!src) return tag;
    const alt = tag.match(/\balt\s*=\s*("([^"]*)"|'([^']*)')/i);
    const srcValue = src[2] !== undefined ? src[2] : src[3];
    const altValue = alt ? (alt[2] !== undefined ? alt[2] : alt[3]) : '';
    return `<img src="${srcValue}" alt="${altValue}" width="${CONTENT_IMG_WIDTH}" style="display:block; width:100%; max-width:${CONTENT_IMG_WIDTH}px; height:auto; border:0; margin:16px 0;">`;
  });
}

export function buildNewsletterEmailHtml({
  title,
  preheader,
  heroImageUrl,
  bodyHtml,
  readingMinutes,
  whyItMatters,
  shareUrl,
  ratingLinks,
  unsubscribeUrl,
}) {
  const whyItMattersHtml = buildWhyItMattersBlock(whyItMatters);
  const shareHtml = buildShareBlock({ title, shareUrl });
  const ratingHtml = buildRatingBlock(ratingLinks);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>${escapeHtml(title || 'Sem Mimimi')}</title>
<style>
img{max-width:100%; height:auto; border:0;} table{border-collapse:collapse;}
.nl-body a{color:${COLORS.redDark};}
.nl-body h2{font-family:${FONT_DISPLAY}; font-weight:bold; font-size:21px; line-height:1.2; text-transform:uppercase; color:${COLORS.ink}; margin:30px 0 10px;}
.nl-body h3{font-family:Arial, sans-serif; font-size:15px; letter-spacing:.5px; text-transform:uppercase; color:${COLORS.ink}; margin:24px 0 8px;}
.nl-body blockquote{margin:22px 0; padding:14px 18px; background:${COLORS.bg2}; border-left:5px solid ${COLORS.red}; font-style:italic; color:${COLORS.ink};}
.nl-body li{margin-bottom:6px;}
</style>
</head>
<body style="margin:0; padding:0; background:${COLORS.bg}; font-family:Georgia, 'Times New Roman', serif;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(preheader || '')}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="table-layout:fixed; max-width:600px; width:100%; background:${COLORS.bg};">

          ${brandHeaderRow(readingMinutes ? `<td align="right" style="font-family:Arial, sans-serif; font-size:12px; color:${COLORS.dim};">⏱️ Leitura de ${readingMinutes} min</td>` : '')}

          ${heroImageUrl ? `
          <tr>
            <td style="padding:24px 0 0;">
              <img src="${escapeAttr(heroImageUrl)}" alt="" width="600" style="width:100%; max-width:600px; height:auto; display:block; border:0;">
            </td>
          </tr>` : ''}

          <tr>
            <td style="padding:28px 4px 14px;">
              <h1 style="margin:0; font-family:${FONT_DISPLAY}; font-weight:bold; font-size:27px; line-height:1.12; letter-spacing:-.3px; text-transform:uppercase; color:${COLORS.ink};">${escapeHtml(title || '')}</h1>
            </td>
          </tr>

          ${whyItMattersHtml}

          <tr>
            <td class="nl-body" style="padding:8px 4px 32px; font-size:17px; line-height:1.7; color:${COLORS.dim}; word-wrap:break-word; overflow-wrap:break-word; word-break:break-word;">
              ${constrainContentImages(bodyHtml)}
            </td>
          </tr>

          ${ratingHtml}
          ${shareHtml}

          <tr>
            <td style="padding:22px 4px 24px; border-top:3px solid ${COLORS.line}; font-family:Arial, sans-serif; font-size:12px; line-height:1.6; color:#7a7058;">
              <span style="font-family:${FONT_DISPLAY}; font-weight:bold; font-size:14px; text-transform:uppercase; color:${COLORS.ink};">SEM <span style="color:${COLORS.redDark};">MIMIMI</span></span><br>
              Você está recebendo este e-mail porque assinou a newsletter Sem Mimimi.<br>
              <a href="${escapeAttr(unsubscribeUrl || '#')}" style="color:${COLORS.dim};">Cancelar inscrição</a>
              &nbsp;·&nbsp;
              <a href="${escapeAttr(process.env.APP_URL || '#')}" style="color:${COLORS.dim};">Sem Mimimi</a>
              <br>
              <!-- Link exigido pela Sender para liberar o envio via API. Não alterar as chaves duplas. -->
              <a href="{{unsubscribe_link}}" style="color:${COLORS.dim};">{{unsubscribe_text}}</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Bloco "Por que isso importa" (Smart Brevity / TL;DR) — 1 tópico por linha de texto. */
function buildWhyItMattersBlock(whyItMatters) {
  const lines = (whyItMatters || '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';

  const items = lines
    .map(
      (line) =>
        `<li style="margin:0 0 8px; padding-left:4px;">${escapeHtml(line)}</li>`
    )
    .join('');

  return `
  <tr>
    <td style="padding:0 9px 22px 4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg2}; ${CARD_BORDER} border-left:6px solid ${COLORS.red};">
        <tr>
          <td style="padding:16px 18px;">
            <div style="font-family:${FONT_DISPLAY}; font-weight:bold; font-size:13px; letter-spacing:1px; text-transform:uppercase; color:${COLORS.redDark}; margin-bottom:10px;">Por que isso importa</div>
            <ul style="margin:0; padding-left:18px; font-family:Arial, sans-serif; font-size:15px; line-height:1.55; color:${COLORS.ink};">${items}</ul>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/** Botões de compartilhamento (WhatsApp / X / e-mail) — gatilho de viralidade (Contagious). */
function buildShareBlock({ title, shareUrl }) {
  if (!shareUrl) return '';
  const shareText = `Olha o que o Pavinatto analisou hoje: ${title || ''}. Leia aqui: ${shareUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(title || 'Sem Mimimi')}&body=${encodeURIComponent(shareText)}`;

  const linkStyle = `display:inline-block; margin:0 8px 10px 0; font-family:Arial, sans-serif; font-size:12px; font-weight:bold; color:${COLORS.ink}; text-decoration:none; background:#ffffff; ${BTN_BORDER} padding:8px 14px;`;

  return `
  <tr>
    <td style="padding:6px 4px 22px; text-align:center;">
      <div style="font-family:Arial, sans-serif; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:${COLORS.dim}; margin-bottom:12px; font-weight:bold;">Achou que valeu a pena? Manda pra alguém</div>
      <a href="${escapeAttr(whatsappUrl)}" style="${linkStyle}">WhatsApp</a>
      <a href="${escapeAttr(twitterUrl)}" style="${linkStyle}">X (Twitter)</a>
      <a href="${escapeAttr(mailUrl)}" style="${linkStyle}">E-mail</a>
    </td>
  </tr>`;
}

/** Enquete rápida de 1 clique no fim da edição (loop de hábito / Hooked). */
function buildRatingBlock(ratingLinks) {
  if (!ratingLinks?.excelente) return '';
  const linkStyle = `display:inline-block; margin:0 5px 10px; font-family:Arial, sans-serif; font-size:13px; font-weight:bold; color:${COLORS.ink}; text-decoration:none; background:#ffffff; ${BTN_BORDER} padding:9px 14px;`;

  return `
  <tr>
    <td style="padding:10px 4px 22px; text-align:center; border-top:2px solid ${COLORS.line};">
      <div style="font-family:Arial, sans-serif; font-size:13px; color:${COLORS.dim}; margin:18px 0 10px;">O que achou da edição de hoje?</div>
      <a href="${escapeAttr(ratingLinks.excelente)}" style="${linkStyle}">🎯 Excelente</a>
      <a href="${escapeAttr(ratingLinks.boa)}" style="${linkStyle}">👍 Boa</a>
      <a href="${escapeAttr(ratingLinks.pode_melhorar)}" style="${linkStyle}">👎 Pode melhorar</a>
    </td>
  </tr>`;
}

/** Versão texto simples (fallback para clientes sem HTML), gerada a partir do HTML do corpo. */
export function buildNewsletterEmailText({ title, bodyHtml, unsubscribeUrl }) {
  const plain = (bodyHtml || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return `${title || ''}\n\n${plain}\n\n---\nCancelar inscrição: ${unsubscribeUrl || ''}`;
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeAttr(str = '') {
  return String(str).replace(/"/g, '&quot;');
}

/**
 * Bloco de destaque que ensina a tirar o remetente do spam. Vai nos e-mails de
 * boas-vindas, que são o primeiro contato da pessoa com o remetente e onde o
 * Gmail e o Outlook ainda estão decidindo para qual pasta mandar as próximas edições.
 */
function spamTipRow() {
  const fromEmail = process.env.BREVO_FROM_EMAIL || process.env.SENDER_FROM_EMAIL || 'contato@tiagopavinatto.com.br';
  return `
          <tr>
            <td style="padding:0 9px 26px 4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg2}; ${CARD_BORDER} border-left:6px solid ${COLORS.red};">
                <tr>
                  <td style="padding:16px 18px; font-family:Georgia,serif; font-size:15px; line-height:1.6; color:${COLORS.ink};">
                    <strong style="font-family:${FONT_DISPLAY}; text-transform:uppercase; font-size:13px; letter-spacing:1px; color:${COLORS.redDark};">Para não perder nenhuma edição</strong><br>
                    1. Olhe a sua caixa de <strong>spam</strong> e as abas <strong>Promoções</strong> e <strong>Atualizações</strong>. Se este e-mail estiver em uma delas, clique em <strong>&quot;Não é spam&quot;</strong> ou arraste para a <strong>Caixa de entrada</strong>.<br>
                    2. Adicione <strong>${escapeHtml(fromEmail)}</strong> aos seus contatos.<br>
                    3. Responda este e-mail com um oi. Isso avisa o seu provedor de que você quer receber.
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

/**
 * E-mail de boas-vindas / onboarding (loop de hábito — Hooked).
 * Enviado assim que o formulário de assinatura é submetido (ver
 * pages/api/subscribe.js). Pede uma resposta rápida — gatilho de ação que
 * também ajuda a tirar o remetente da caixa de spam (responder um e-mail
 * sinaliza engajamento para os filtros anti-spam).
 */
export function buildWelcomeEmailHtml({ nome, tema }) {
  const primeiroNome = (nome || '').trim().split(' ')[0] || '';
  const saudacao = primeiroNome ? `Olá, ${primeiroNome}.` : 'Olá.';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Bem-vindo ao Sem Mimimi</title></head>
<body style="margin:0; padding:0; background:${COLORS.bg}; font-family:Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:${COLORS.bg};">
          ${brandHeaderRow()}
          <tr>
            <td style="padding:28px 4px 12px;">
              <h1 style="margin:0; font-family:${FONT_DISPLAY}; font-weight:bold; font-size:25px; line-height:1.15; text-transform:uppercase; color:${COLORS.ink};">Bem-vindo a bordo</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 4px 28px; font-size:17px; line-height:1.65; color:${COLORS.dim};">
              <p>${saudacao}</p>
              <p>Sua assinatura está sendo processada. Assim que o pagamento for confirmado, a próxima edição já cai direto na sua caixa de entrada, sempre de segunda a sexta — sem exceção.</p>
              <p>Enquanto isso, já separei uma coisa pra você: <a href="${process.env.APP_URL}/edicao-exemplo" style="color:${COLORS.redDark};">a edição de lançamento na íntegra</a>, de graça, pra você já entrar no clima antes da primeira edição paga chegar.</p>
              <p>Uma coisa rápida antes de continuar: <strong>responda este e-mail</strong> contando o que te fez assinar${tema ? ` ou o que você acha sobre ${escapeHtml(tema)}` : ''}. Não é automático — eu leio. E, na prática, isso também ajuda a garantir que os próximos e-mails não caiam no spam.</p>
              <p>Até a próxima edição.</p>
            </td>
          </tr>
          ${spamTipRow()}
          <tr>
            <td style="padding:22px 4px 24px; border-top:3px solid ${COLORS.line}; font-family:Arial, sans-serif; font-size:12px; color:#7a7058;">
              Sem Mimimi — a newsletter que não pede licença.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * E-mail enviado para quem RECEBEU uma assinatura de presente — dispara na
 * ativação (webhook do Mercado Pago), não no checkout, porque só faz sentido
 * avisar o presenteado depois que o pagamento de quem presenteou foi
 * confirmado de verdade.
 */
export function buildGiftWelcomeEmailHtml({ recipientNome, gifterNome, gifterMessage, manageUrl }) {
  const primeiroNome = (recipientNome || '').trim().split(' ')[0] || '';
  const saudacao = primeiroNome ? `Olá, ${primeiroNome}.` : 'Olá.';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Você recebeu um presente — Sem Mimimi</title></head>
<body style="margin:0; padding:0; background:${COLORS.bg}; font-family:Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:${COLORS.bg};">
          ${brandHeaderRow()}
          <tr>
            <td style="padding:28px 4px 12px;">
              <h1 style="margin:0; font-family:${FONT_DISPLAY}; font-weight:bold; font-size:25px; line-height:1.15; text-transform:uppercase; color:${COLORS.ink};">🎁 Alguém te presenteou</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 4px 12px; font-size:17px; line-height:1.65; color:${COLORS.dim};">
              <p>${saudacao}</p>
              <p><strong>${escapeHtml(gifterNome || 'Alguém')}</strong> assinou o Sem Mimimi pra você — sem pedir nada em troca, só porque sabe que você curte o que o Pavinatto escreve e como ele escreve.</p>
            </td>
          </tr>
          ${gifterMessage ? `
          <tr>
            <td style="padding:0 9px 22px 4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg2}; ${CARD_BORDER} border-left:6px solid ${COLORS.red};">
                <tr><td style="padding:16px 18px; font-family:Georgia,serif; font-style:italic; font-size:15px; color:${COLORS.ink};">"${escapeHtml(gifterMessage)}"</td></tr>
              </table>
            </td>
          </tr>` : ''}
          <tr>
            <td style="padding:0 4px 28px; font-size:17px; line-height:1.65; color:${COLORS.dim};">
              <p>A partir de agora, a newsletter cai na sua caixa de entrada de segunda a sexta. Agora você também faz parte de quem lê o Pavinatto antes de todo mundo comentar. Dá pra ver os detalhes do presente aqui:</p>
              <p style="text-align:center; margin:24px 0;">
                <a href="${escapeAttr(manageUrl || process.env.APP_URL)}" style="display:inline-block; background:${COLORS.redDark}; color:#ffffff; ${BTN_BORDER} font-family:Arial,sans-serif; font-weight:bold; text-transform:uppercase; letter-spacing:1px; font-size:13px; padding:14px 26px; text-decoration:none;">Escolher meu dia</a>
              </p>
            </td>
          </tr>
          ${spamTipRow()}
          <tr>
            <td style="padding:22px 4px 24px; border-top:3px solid ${COLORS.line}; font-family:Arial, sans-serif; font-size:12px; color:#7a7058;">
              Sem Mimimi — a newsletter que não pede licença.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
