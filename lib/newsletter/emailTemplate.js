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
 * @param {string} params.subscriberId     usado para montar o link de descadastro
 */
export function buildNewsletterEmailHtml({ title, preheader, heroImageUrl, bodyHtml, unsubscribeUrl }) {
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

          <tr>
            <td style="padding:8px 4px 32px; font-size:17px; line-height:1.6; color:${COLORS.dim};">
              ${bodyHtml || ''}
            </td>
          </tr>

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
