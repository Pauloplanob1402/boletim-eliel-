// Integração com a API de Assinaturas (Subscriptions / preapproval) do Mercado Pago.
// Documentação oficial consultada nesta implementação:
//   POST   https://api.mercadopago.com/preapproval_plan   (criar plano)
//   POST   https://api.mercadopago.com/preapproval          (criar assinatura)
//   GET    https://api.mercadopago.com/preapproval/{id}     (consultar assinatura)
//   PUT    https://api.mercadopago.com/preapproval/{id}     (cancelar/pausar assinatura)
//   GET    https://api.mercadopago.com/v1/payments/{id}     (consultar pagamento)
// Webhooks (tópicos): subscription_preapproval, subscription_authorized_payment, payment.
// Assinatura do webhook enviada no header x-signature: "ts=...,v1=..." — ver verifyWebhookSignature().

import crypto from 'crypto';

const MP_API = 'https://api.mercadopago.com';

function accessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.');
  return token;
}

async function mpFetch(path, options = {}) {
  const res = await fetch(`${MP_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken()}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(
      `Mercado Pago API error (${res.status}) em ${path}: ${JSON.stringify(data)}`
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * Cria uma assinatura (preapproval) associada a um plano já existente no Mercado Pago
 * (ver README — os planos mensal/anual são criados uma única vez e o id fica em
 * MERCADOPAGO_PLAN_ID_MENSAL / MERCADOPAGO_PLAN_ID_ANUAL).
 *
 * Retorna o objeto da assinatura, que inclui `init_point` — a URL para onde o
 * assinante deve ser redirecionado para concluir o checkout.
 */
export async function createSubscription({ planId, payerEmail, externalReference }) {
  return mpFetch('/preapproval', {
    method: 'POST',
    body: JSON.stringify({
      preapproval_plan_id: planId,
      payer_email: payerEmail,
      external_reference: externalReference,
      back_url: `${process.env.APP_URL}/minha-conta`,
      status: 'pending',
    }),
  });
}

/** Busca uma assinatura pelo ID (mp_preapproval_id salvo em subscriptions). */
export async function getSubscription(preapprovalId) {
  return mpFetch(`/preapproval/${preapprovalId}`);
}

/** Cancela uma assinatura ativa. */
export async function cancelSubscription(preapprovalId) {
  return mpFetch(`/preapproval/${preapprovalId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'cancelled' }),
  });
}

/** Busca um pagamento específico pelo ID (usado ao processar o webhook do tópico "payment"). */
export async function getPayment(paymentId) {
  return mpFetch(`/v1/payments/${paymentId}`);
}

/**
 * Valida a autenticidade de uma notificação de webhook comparando o HMAC-SHA256
 * calculado com a chave secreta (MERCADOPAGO_WEBHOOK_SECRET) contra o valor `v1`
 * enviado no header `x-signature`.
 *
 * Template oficial: "id:[data.id];request-id:[x-request-id];ts:[ts];"
 * (data.id em minúsculas quando alfanumérico).
 */
export function verifyWebhookSignature({ xSignature, xRequestId, dataId }) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('MERCADOPAGO_WEBHOOK_SECRET não configurado — não é seguro processar o webhook sem validação.');
  }
  if (!xSignature) return false;

  const parts = Object.fromEntries(
    xSignature.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k?.trim(), v?.trim()];
    })
  );

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const normalizedId = dataId ? String(dataId).toLowerCase() : '';
  const template = `id:${normalizedId};request-id:${xRequestId || ''};ts:${ts};`;

  const computed = crypto.createHmac('sha256', secret).update(template).digest('hex');

  // Comparação em tempo constante para evitar timing attacks.
  const a = Buffer.from(computed, 'utf8');
  const b = Buffer.from(v1, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Calcula a divisão de receita 60/20/20 sobre um valor de pagamento confirmado. */
export function calculateRevenueSplit(paymentAmount) {
  const round2 = (n) => Math.round(n * 100) / 100;
  const amount = Number(paymentAmount) || 0;

  return {
    tiago: round2(amount * 0.6),
    eliel: round2(amount * 0.2),
    paulo: round2(amount * 0.2),
  };
}
