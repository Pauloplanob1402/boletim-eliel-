// Integração com a API v2 da Sender (https://api.sender.net/v2).
// Endpoints usados nesta implementação (confirmados na documentação oficial):
//   POST   /v2/subscribers                 — criar/atualizar assinante
//   DELETE /v2/subscribers                 — remover assinante(s) por e-mail
//   POST   /v2/groups                      — criar grupo (rodar uma vez, ver README)
//   POST   /v2/subscribers/groups/{id}     — adicionar assinantes a um grupo
//   POST   /v2/campaigns                   — criar campanha (subject, from, reply_to, content_type, content, groups)
//   POST   /v2/campaigns/{id}/schedule     — agendar campanha
//   POST   /v2/campaigns/{id}/send         — enviar campanha imediatamente
//   GET    /v2/campaigns/{id}/errors       — erros de envio
//
// CONFIGURAR/VERIFICAR: a Sender não documenta publicamente (no momento desta
// implementação) um endpoint dedicado de "enviar e-mail de teste para 1 endereço"
// separado do envio de campanha. Este arquivo contorna isso criando um grupo
// temporário de um único assinante e enviando a campanha só para ele — funciona,
// mas vale checar no painel da Sender se existe uma opção nativa de teste antes
// de ir para produção (Account > Campaigns > Test send).
//
// CONFIGURAR/VERIFICAR: limites do plano gratuito da Sender (nº de contatos,
// nº de envios/mês, exigência de cartão) mudam com frequência — confirme em
// https://www.sender.net/pricing/ antes de assumir que o volume de assinantes
// do Sem Mimimi cabe no plano gratuito.

const SENDER_API = 'https://api.sender.net/v2';

function apiKey() {
  const key = process.env.SENDER_API_KEY;
  if (!key) throw new Error('SENDER_API_KEY não configurado.');
  return key;
}

async function senderFetch(path, options = {}) {
  const res = await fetch(`${SENDER_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(`Sender API error (${res.status}) em ${path}: ${JSON.stringify(data)}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/** Cria (ou atualiza, se o e-mail já existir) um assinante na Sender e o coloca no grupo pago. */
export async function upsertSubscriber({ email, nome, groupId }) {
  const [firstname, ...rest] = (nome || '').trim().split(' ').filter(Boolean);
  return senderFetch('/subscribers', {
    method: 'POST',
    body: JSON.stringify({
      email,
      firstname: firstname || undefined,
      lastname: rest.join(' ') || undefined,
      groups: groupId ? [groupId] : undefined,
      // Campo personalizado usado para personalização {$nome} nos envios em
      // massa — ver lib/newsletter/render.js -> toSenderMergeTags().
      // Campo personalizado "nome" — o merge tag correspondente no CONTEÚDO da
      // campanha é {$nome} (ver toSenderMergeTags), mas o parâmetro `fields`
      // ao criar/atualizar o assinante usa a chave "crua" do campo.
      // CONFIGURAR/VERIFICAR: confirme esse nome de chave no painel da Sender
      // (Subscribers > Custom Fields) — se lá o campo tiver outro identificador,
      // ajuste tanto aqui quanto em toSenderMergeTags().
      fields: nome ? { nome } : undefined,
    }),
  });
}

/** Remove um assinante da Sender (usado quando a assinatura é cancelada ou o pagamento falha em definitivo). */
export async function removeSubscriber(email) {
  return senderFetch('/subscribers', {
    method: 'DELETE',
    body: JSON.stringify({ subscribers: [email] }),
  });
}

/** Cria um grupo — só precisa ser rodado uma vez na configuração inicial (ver README). */
export async function createGroup(title) {
  return senderFetch('/groups', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

/**
 * Cria uma campanha de e-mail (rascunho) apontada para um ou mais grupos.
 * `htmlContent` já deve vir pronto (ver lib/newsletter/emailTemplate.js), pois a
 * Sender só aceita HTML/texto puro via API — templates de arrastar-e-soltar
 * precisam ser feitos na interface da Sender, não pela API.
 */
export async function createCampaign({ subject, groupIds, htmlContent, textContent }) {
  return senderFetch('/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      subject,
      from: process.env.SENDER_FROM_NAME || 'Sem Mimimi',
      reply_to: process.env.SENDER_FROM_EMAIL,
      content_type: 'html',
      content: htmlContent,
      plain_content: textContent,
      groups: groupIds,
    }),
  });
}

/** Envia uma campanha (já criada como rascunho) imediatamente. */
export async function sendCampaign(campaignId) {
  return senderFetch(`/campaigns/${campaignId}/send`, { method: 'POST' });
}

/** Agenda uma campanha para uma data/hora futura (ISO 8601). */
export async function scheduleCampaign(campaignId, scheduledAtIso) {
  return senderFetch(`/campaigns/${campaignId}/schedule`, {
    method: 'POST',
    body: JSON.stringify({ schedule_time: scheduledAtIso }),
  });
}

/** Busca os erros de envio de uma campanha (para a tela "Envios" do admin). */
export async function getCampaignErrors(campaignId) {
  return senderFetch(`/campaigns/${campaignId}/errors`);
}

/**
 * Envia um teste de uma newsletter para um único e-mail (ver aviso CONFIGURAR/VERIFICAR
 * no topo do arquivo). Cria um grupo temporário de 1 assinante, cria a campanha
 * apontada só para ele e envia — depois o grupo pode ficar (baixo custo) ou ser
 * limpo manualmente no painel da Sender.
 */
export async function sendTestEmail({ toEmail, subject, htmlContent, textContent }) {
  const group = await createGroup(`teste-${Date.now()}`);
  await senderFetch(`/subscribers/groups/${group.data.id}`, {
    method: 'POST',
    body: JSON.stringify({ subscribers: [toEmail], trigger_automation: false }),
  });
  const campaign = await createCampaign({
    subject,
    groupIds: [group.data.id],
    htmlContent,
    textContent,
  });
  await sendCampaign(campaign.data.id);
  return campaign;
}

// ============================================
// Camada de abstração "emailProvider" (pedida explicitamente no briefing) —
// para que o resto do sistema não fique acoplado à Sender. Trocar de provedor
// no futuro significa reimplementar só este objeto.
// ============================================
export const emailProvider = {
  async upsertContact({ email, nome }) {
    return upsertSubscriber({ email, nome, groupId: process.env.SENDER_GROUP_ID });
  },
  async removeContact(email) {
    return removeSubscriber(email);
  },
  async sendNewsletter({ subject, htmlContent, textContent, groupIds }) {
    const campaign = await createCampaign({
      subject,
      groupIds: groupIds || [process.env.SENDER_GROUP_ID],
      htmlContent,
      textContent,
    });
    await sendCampaign(campaign.data.id);
    return campaign;
  },
  async scheduleNewsletter({ subject, htmlContent, textContent, groupIds, scheduledAtIso }) {
    const campaign = await createCampaign({
      subject,
      groupIds: groupIds || [process.env.SENDER_GROUP_ID],
      htmlContent,
      textContent,
    });
    await scheduleCampaign(campaign.data.id, scheduledAtIso);
    return campaign;
  },
  async sendTest({ toEmail, subject, htmlContent, textContent }) {
    return sendTestEmail({ toEmail, subject: `[TESTE] ${subject}`, htmlContent, textContent });
  },
  /** E-mail de boas-vindas (onboarding) — usa o mesmo mecanismo de envio unitário do sendTest. */
  async sendWelcome({ toEmail, htmlContent }) {
    return sendTestEmail({ toEmail, subject: 'Bem-vindo ao Sem Mimimi', htmlContent, textContent: '' });
  },
};
