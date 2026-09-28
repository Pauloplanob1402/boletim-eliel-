// Provedor de e-mail Brevo (https://developers.brevo.com). Expõe o MESMO formato
// de `emailProvider` que lib/sender/client.js, então o resto do site não precisa
// saber qual provedor está ativo. A escolha é feita em lib/email/provider.js
// pela variável de ambiente EMAIL_PROVIDER.
//
// Variáveis: BREVO_API_KEY, BREVO_LIST_ID, BREVO_FROM_EMAIL (opcional, cai em
// SENDER_FROM_EMAIL), BREVO_FROM_NAME (opcional, cai em SENDER_FROM_NAME).
//
// Endpoints usados (API v3, cabeçalho `api-key`):
//   POST /contacts                                  cria/atualiza contato e põe na lista
//   POST /contacts/lists/{id}/contacts/remove       tira o contato da lista
//   POST /smtp/email                                e-mail avulso (teste, boas-vindas, presente)
//   POST /emailCampaigns  +  POST /emailCampaigns/{id}/sendNow    campanha para a lista

const BASE = 'https://api.brevo.com/v3';

async function brevoFetch(path, { method = 'GET', body } = {}) {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error('BREVO_API_KEY não configurada.');

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Vários endpoints do Brevo respondem 201/204 sem corpo.
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const detail = data && typeof data === 'object' ? JSON.stringify(data) : text || res.statusText;
    const err = new Error(`Brevo API error (${res.status}) em ${path}: ${detail}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function fromAddress() {
  const email = process.env.BREVO_FROM_EMAIL || process.env.SENDER_FROM_EMAIL;
  if (!email) throw new Error('BREVO_FROM_EMAIL (ou SENDER_FROM_EMAIL) não configurado.');
  return { email, name: process.env.BREVO_FROM_NAME || process.env.SENDER_FROM_NAME || 'Sem Mimimi' };
}

function listId() {
  const id = Number(process.env.BREVO_LIST_ID);
  if (!id) throw new Error('BREVO_LIST_ID não configurado (use o número da lista).');
  return id;
}

/**
 * O template da newsletter traz o link de descadastro da Sender ({{unsubscribe_link}}),
 * que no Brevo não existe. Removemos esse trecho aqui. Nas campanhas, o Brevo
 * acrescenta sozinho o rodapé de descadastro dele quando não detecta o link.
 */
export function stripSenderUnsubscribe(html) {
  return (html || '')
    .replace(/<br>\s*<!--[^>]*-->\s*<a href="\{\{unsubscribe_link\}\}"[^>]*>\{\{unsubscribe_text\}\}<\/a>/g, '')
    .replace(/\{\{\s*unsubscribe_(link|text)\s*\}\}/g, '');
}

/** Cria ou atualiza o contato (com nome) e o coloca na lista do Sem Mimimi. */
export async function upsertContact({ email, nome }) {
  const body = { email, listIds: [listId()], updateEnabled: true };
  if (nome) body.attributes = { FIRSTNAME: nome };
  return brevoFetch('/contacts', { method: 'POST', body });
}

/** Tira o contato da lista (ele deixa de receber a newsletter). */
export async function removeContact(email) {
  try {
    return await brevoFetch(`/contacts/lists/${listId()}/contacts/remove`, {
      method: 'POST',
      body: { emails: [email] },
    });
  } catch (err) {
    // Contato que nunca esteve na lista não é erro para quem quer descadastrar.
    if (err.status === 404) return null;
    throw err;
  }
}

/** E-mail avulso (não usa lista nem campanha). */
export async function sendTransactionalEmail({ toEmail, toName, subject, htmlContent, textContent }) {
  const body = {
    sender: fromAddress(),
    to: [toName ? { email: toEmail, name: toName } : { email: toEmail }],
    subject,
    htmlContent: stripSenderUnsubscribe(htmlContent),
  };
  if (textContent) body.textContent = textContent;
  return brevoFetch('/smtp/email', { method: 'POST', body });
}

async function createCampaign({ subject, htmlContent, scheduledAtIso }) {
  const body = {
    name: `${subject} (${new Date().toISOString()})`,
    subject,
    sender: fromAddress(),
    type: 'classic',
    htmlContent: stripSenderUnsubscribe(htmlContent),
    recipients: { listIds: [listId()] },
  };
  if (scheduledAtIso) body.scheduledAt = scheduledAtIso;
  const created = await brevoFetch('/emailCampaigns', { method: 'POST', body });
  // Mesmo formato que o cliente da Sender devolve: dispatch.js lê `campaign.data.id`.
  return { data: { id: created?.id } };
}

export const emailProvider = {
  // Como {{nome}} e {{email}} viram variáveis de cada destinatário no envio em massa.
  mergeTags: { nome: '{{ contact.FIRSTNAME }}', email: '{{ contact.EMAIL }}' },

  async upsertContact({ email, nome }) {
    return upsertContact({ email, nome });
  },
  async removeContact(email) {
    return removeContact(email);
  },
  async sendNewsletter({ subject, htmlContent }) {
    const campaign = await createCampaign({ subject, htmlContent });
    await brevoFetch(`/emailCampaigns/${campaign.data.id}/sendNow`, { method: 'POST' });
    return campaign;
  },
  async scheduleNewsletter({ subject, htmlContent, scheduledAtIso }) {
    return createCampaign({ subject, htmlContent, scheduledAtIso });
  },
  async sendTest({ toEmail, subject, htmlContent, textContent }) {
    return sendTransactionalEmail({ toEmail, subject: `[TESTE] ${subject}`, htmlContent, textContent });
  },
  async sendWelcome({ toEmail, htmlContent }) {
    return sendTransactionalEmail({ toEmail, subject: 'Bem-vindo ao Sem Mimimi', htmlContent });
  },
  async sendGiftNotice({ toEmail, htmlContent }) {
    return sendTransactionalEmail({ toEmail, subject: 'Alguém te presenteou com o Sem Mimimi 🎁', htmlContent });
  },
};
