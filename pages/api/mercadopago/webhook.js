// Recebe as notificações do Mercado Pago (tópicos: payment, subscription_preapproval,
// subscription_authorized_payment). NUNCA confia no corpo da notificação por si
// só — sempre consulta a API do Mercado Pago para confirmar o estado real antes
// de mudar qualquer coisa no banco.
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { getPayment, getSubscription, verifyWebhookSignature, calculateRevenueSplit } from '../../../lib/mercadopago/client';
import { emailProvider } from '../../../lib/sender/client';
import { REVENUE_SPLIT_TABLE } from '../../../lib/newsletter/revenue';

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const type = req.body?.type || req.query.type || req.query.topic;
  const dataId = req.body?.data?.id || req.query['data.id'];

  // Responde 200 cedo para tudo que não seja assinável, evitando retries
  // desnecessários do Mercado Pago em eventos que não usamos.
  if (!type || !dataId) return res.status(200).json({ ignored: true });

  const validSignature = verifyWebhookSignature({
    xSignature: req.headers['x-signature'],
    xRequestId: req.headers['x-request-id'],
    dataId,
  });

  if (!validSignature) {
    console.error('Webhook Mercado Pago: assinatura inválida, ignorando.', { type, dataId });
    return res.status(401).json({ error: 'Assinatura inválida.' });
  }

  const admin = createAdminClient();

  try {
    if (type === 'payment') {
      await handlePaymentEvent(admin, dataId);
    } else if (type === 'subscription_preapproval') {
      await handleSubscriptionEvent(admin, dataId);
    }
    // subscription_authorized_payment: o pagamento recorrente em si já chega
    // também como evento "payment" — tratamos só um caminho para não duplicar.

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro ao processar webhook Mercado Pago:', err.message);
    // 500 faz o Mercado Pago tentar reenviar depois — correto para erros
    // transitórios (rede, banco fora do ar).
    return res.status(500).json({ error: 'Erro interno ao processar notificação.' });
  }
}

async function handlePaymentEvent(admin, paymentId) {
  // Idempotência: se este pagamento já foi registrado, não faz nada de novo.
  const { data: existing } = await admin.from('payments').select('id').eq('mp_payment_id', String(paymentId)).maybeSingle();
  if (existing) return;

  const payment = await getPayment(paymentId); // fonte da verdade — nunca confiar no webhook cru
  const preapprovalId = payment.metadata?.preapproval_id || payment.external_reference;

  const { data: subscription } = await admin
    .from('subscriptions')
    .select('id, user_id')
    .or(`mp_preapproval_id.eq.${preapprovalId},user_id.eq.${payment.external_reference}`)
    .maybeSingle();

  const { data: insertedPayment, error: paymentError } = await admin
    .from('payments')
    .insert({
      user_id: subscription?.user_id || null,
      subscription_id: subscription?.id || null,
      mp_payment_id: String(payment.id),
      mp_external_reference: payment.external_reference,
      amount: payment.transaction_amount,
      currency: payment.currency_id || 'BRL',
      status: payment.status, // approved | pending | in_process | rejected | refunded | cancelled
      payment_method: payment.payment_method_id,
      paid_at: payment.date_approved || null,
    })
    .select()
    .single();

  if (paymentError) throw new Error('Erro ao registrar pagamento: ' + paymentError.message);

  if (payment.status === 'approved') {
    const split = calculateRevenueSplit(payment.transaction_amount);
    const rows = REVENUE_SPLIT_TABLE.map((r) => ({
      payment_id: insertedPayment.id,
      recipient_name: r.recipient_name,
      percentage: r.percentage,
      amount: r.recipient_name === 'Tiago Pavinatto' ? split.tiago : r.recipient_name === 'Eliel Duarte' ? split.eliel : split.paulo,
    }));
    await admin.from('revenue_allocations').insert(rows);
  }
}

async function handleSubscriptionEvent(admin, preapprovalId) {
  const mpSubscription = await getSubscription(preapprovalId); // fonte da verdade

  const { data: localSub } = await admin
    .from('subscriptions')
    .select('id, user_id')
    .eq('mp_preapproval_id', preapprovalId)
    .maybeSingle();

  if (!localSub) {
    console.error('Webhook: assinatura não encontrada localmente para preapproval', preapprovalId);
    return;
  }

  const statusMap = {
    pending: 'pending',
    authorized: 'authorized',
    paused: 'paused',
    cancelled: 'canceled',
  };
  const newStatus = statusMap[mpSubscription.status] || mpSubscription.status;
  const isActive = ['authorized'].includes(mpSubscription.status);

  await admin
    .from('subscriptions')
    .update({
      status: isActive ? 'active' : newStatus,
      started_at: isActive ? mpSubscription.date_created || new Date().toISOString() : undefined,
      next_billing_at: mpSubscription.next_payment_date || null,
      canceled_at: mpSubscription.status === 'cancelled' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', localSub.id);

  const { data: profile } = await admin.from('profiles').select('email, nome').eq('id', localSub.user_id).single();

  if (isActive) {
    await admin
      .from('newsletter_subscribers')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('user_id', localSub.user_id);

    if (profile) {
      try {
        await emailProvider.upsertContact({ email: profile.email, nome: profile.nome });
      } catch (err) {
        console.error('Falha ao sincronizar assinante com a Sender:', err.message);
      }
    }
  } else if (['paused', 'cancelled'].includes(mpSubscription.status)) {
    await admin
      .from('newsletter_subscribers')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('user_id', localSub.user_id);

    if (profile) {
      try {
        await emailProvider.removeContact(profile.email);
      } catch (err) {
        console.error('Falha ao remover assinante da Sender:', err.message);
      }
    }
  }
}
