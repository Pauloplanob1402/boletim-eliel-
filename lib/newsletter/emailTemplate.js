// Monta o HTML final do e-mail a partir do conteúdo criado no editor do admin.
// Regras seguidas (clientes de e-mail não são navegadores):
//   - sem <script>, sem CSS externo/complexo — tudo inline;
//   - layout em tabelas (<table>), não flexbox/grid;
//   - imagens sempre via HTTPS;
//   - link de descadastro obrigatório em toda newsletter (LGPD).
//
// Cores de marca (mesmas do site):
const COLORS = {
  bg: '#fbf6ee',
  bg2: '#f4ecdd',
  ink: '#2b2118',
  dim: '#6f6252',
  red: '#d9591a',
  redDark: '#a8420f',
  gold: '#b3852c',
  line: '#e2d5bd',
};

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
<title>${escapeHtml(title || 'Sem Mimimi')}</title>
</head>
<body style="margin:0; padding:0; background:${COLORS.bg}; font-family:Georgia, 'Times New Roman', serif;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(preheader || '')}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:${COLORS.bg};">

          <tr>
            <td style="padding:0 4px 20px; border-bottom:1px solid ${COLORS.line};">
              <span style="font-family:Arial, sans-serif; font-size:12px; letter-spacing:2px; text-transform:uppercase; color:${COLORS.red}; font-weight:bold;">SEM MIMIMI</span>
              ${readingMinutes ? `<span style="float:right; font-family:Arial, sans-serif; font-size:12px; color:${COLORS.dim};">⏱️ Leitura de ${readingMinutes} min</span>` : ''}
            </td>
          </tr>

          ${heroImageUrl ? `
          <tr>
            <td style="padding:24px 0 0;">
              <img src="${escapeAttr(heroImageUrl)}" alt="" width="600" style="width:100%; max-width:600px; height:auto; display:block; border:0;">
            </td>
          </tr>` : ''}

          <tr>
            <td style="padding:24px 4px 8px;">
              <h1 style="margin:0; font-family:Arial, sans-serif; font-size:26px; line-height:1.15; text-transform:uppercase; color:${COLORS.ink};">${escapeHtml(title || '')}</h1>
            </td>
          </tr>

          ${whyItMattersHtml}

          <tr>
            <td style="padding:8px 4px 32px; font-size:17px; line-height:1.6; color:${COLORS.dim};">
              ${bodyHtml || ''}
            </td>
          </tr>

          ${ratingHtml}
          ${shareHtml}

          <tr>
            <td style="padding:24px 4px; border-top:1px solid ${COLORS.line}; font-family:Arial, sans-serif; font-size:12px; color:#a3937c;">
              Você está recebendo este e-mail porque assinou a newsletter Sem Mimimi.<br>
              <a href="${escapeAttr(unsubscribeUrl || '#')}" style="color:${COLORS.dim};">Cancelar inscrição</a>
              &nbsp;·&nbsp;
              <a href="${escapeAttr(process.env.APP_URL || '#')}" style="color:${COLORS.dim};">Sem Mimimi</a>
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
    <td style="padding:0 4px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg2}; border-left:3px solid ${COLORS.red};">
        <tr>
          <td style="padding:16px 18px;">
            <div style="font-family:Arial, sans-serif; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:${COLORS.red}; font-weight:bold; margin-bottom:8px;">Por que isso importa</div>
            <ul style="margin:0; padding-left:18px; font-family:Arial, sans-serif; font-size:14px; line-height:1.5; color:${COLORS.ink};">${items}</ul>
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

  const linkStyle = `display:inline-block; margin:0 10px 0 0; font-family:Arial, sans-serif; font-size:12px; color:${COLORS.red}; text-decoration:none; border:1px solid ${COLORS.line}; padding:8px 14px;`;

  return `
  <tr>
    <td style="padding:6px 4px 22px; text-align:center;">
      <div style="font-family:Arial, sans-serif; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:${COLORS.dim}; margin-bottom:10px;">Achou que valeu a pena? Manda pra alguém</div>
      <a href="${escapeAttr(whatsappUrl)}" style="${linkStyle}">WhatsApp</a>
      <a href="${escapeAttr(twitterUrl)}" style="${linkStyle}">X (Twitter)</a>
      <a href="${escapeAttr(mailUrl)}" style="${linkStyle}">E-mail</a>
    </td>
  </tr>`;
}

/** Enquete rápida de 1 clique no fim da edição (loop de hábito / Hooked). */
function buildRatingBlock(ratingLinks) {
  if (!ratingLinks?.excelente) return '';
  const linkStyle = `display:inline-block; margin:0 6px; font-family:Arial, sans-serif; font-size:13px; color:${COLORS.ink}; text-decoration:none; border:1px solid ${COLORS.line}; padding:9px 14px;`;

  return `
  <tr>
    <td style="padding:10px 4px 22px; text-align:center; border-top:1px solid ${COLORS.line};">
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
          <tr>
            <td style="padding:0 4px 20px; border-bottom:1px solid ${COLORS.line};">
              <span style="font-family:Arial, sans-serif; font-size:12px; letter-spacing:2px; text-transform:uppercase; color:${COLORS.red}; font-weight:bold;">SEM MIMIMI</span>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 4px 8px;">
              <h1 style="margin:0; font-family:Arial, sans-serif; font-size:22px; text-transform:uppercase; color:${COLORS.ink};">Bem-vindo a bordo</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 4px 28px; font-size:17px; line-height:1.65; color:${COLORS.dim};">
              <p>${saudacao}</p>
              <p>Sua assinatura está sendo processada. Assim que o pagamento for confirmado, a próxima edição já cai direto na sua caixa de entrada, no dia que você escolheu — sem exceção.</p>
              <p>Uma coisa rápida antes de continuar: <strong>responda este e-mail</strong> contando o que te fez assinar${tema ? ` ou o que você acha sobre ${escapeHtml(tema)}` : ''}. Não é automático — eu leio. E, na prática, isso também ajuda a garantir que os próximos e-mails não caiam no spam.</p>
              <p>Até a próxima edição.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 4px; border-top:1px solid ${COLORS.line}; font-family:Arial, sans-serif; font-size:12px; color:#a3937c;">
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
          <tr>
            <td style="padding:0 4px 20px; border-bottom:1px solid ${COLORS.line};">
              <span style="font-family:Arial, sans-serif; font-size:12px; letter-spacing:2px; text-transform:uppercase; color:${COLORS.red}; font-weight:bold;">SEM MIMIMI</span>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 4px 8px;">
              <h1 style="margin:0; font-family:Arial, sans-serif; font-size:22px; text-transform:uppercase; color:${COLORS.ink};">🎁 Alguém te presenteou</h1>
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
            <td style="padding:0 4px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg2}; border-left:3px solid ${COLORS.red};">
                <tr><td style="padding:16px 18px; font-family:Georgia,serif; font-style:italic; font-size:15px; color:${COLORS.ink};">"${escapeHtml(gifterMessage)}"</td></tr>
              </table>
            </td>
          </tr>` : ''}
          <tr>
            <td style="padding:0 4px 28px; font-size:17px; line-height:1.65; color:${COLORS.dim};">
              <p>A partir de agora, a newsletter cai na sua caixa de entrada no dia que você escolher. Dá pra ajustar isso e ver os detalhes do presente aqui:</p>
              <p style="text-align:center; margin:24px 0;">
                <a href="${escapeAttr(manageUrl || process.env.APP_URL)}" style="display:inline-block; background:${COLORS.red}; color:${COLORS.bg}; font-family:Arial,sans-serif; font-weight:bold; text-transform:uppercase; letter-spacing:1px; font-size:13px; padding:14px 26px; text-decoration:none;">Escolher meu dia</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 4px; border-top:1px solid ${COLORS.line}; font-family:Arial, sans-serif; font-size:12px; color:#a3937c;">
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
