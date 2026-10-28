// Processa um pagamento Pix do Mercado Pago: registra o pagamento, divide a
// receita 60/20/20 e ativa (ou prorroga) a assinatura. É chamado tanto pelo
// webhook quanto pela consulta de status da tela de pagamento — as duas
// vias podem rodar quase ao mesmo tempo, então tudo aqui é idempotente.
import { calculateRevenueSplit } from '../mercadopago/client';
import { REVENUE_SPLIT_TABLE } from '../newsletter/revenue';
import { emailProvider } from '../email/provider';
import { buildGiftWelcomeEmailHtml } from '../newsletter/emailTemplate';

export const PIX_PLANS = {
  mensal: { amount: 22.0, months: 1, reason: 'Sem Mimimi — Plano Mensal (Pix)' },
  anual: { amount: 220.0, months: 12, reason: 'Sem Mimimi — Plano Anual (Pix)' },
};

function addMonths(date, months) {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/** Descobre o id da assinatura local a partir do pagamento do Mercado Pago. */
export function getPixSubscriptionId(payment) {
  const ref = String(payment?.external_reference || '');
  return payment?.metadata?.subscription_id || (ref.startsWith('pix:') ? ref.slice(4) : null);
}

/**
 * @returns {Promise<{ handled: boolean, status?: string }>}
 *   handled = false quando o pagamento não é um Pix deste fluxo.
 */
export async function processPixPayment(admin, payment) {
  const subscriptionId = getPixSubscriptionId(payment);
  if (!subscriptionId) return { handled: false };

  const { data: sub } = await admin
    .from('subscriptions')
    .select('id, user_id, plan_id, is_gift, gift_sender_name, gift_recipient_name, gift_recipient_email, gift_message, valid_until, started_at')
    .eq('id', subscriptionId)
    .maybeSingle();
  if (!sub) return { handled: false };

  const mpPaymentId = String(payment.id);
  const paidAt = payment.date_approved || null;
  let claimed = false; // true só para quem "ganhou" a transição para aprovado

  const { data: inserted, error: insertError } = await admin
    .from('payments')
    .insert({
      user_id: sub.user_id,
      subscription_id: sub.id,
      mp_payment_id: mpPaymentId,
      mp_external_reference: payment.external_reference,
      amount: payment.transaction_amount,
      currency: payment.currency_id || 'BRL',
      status: payment.status,
      payment_method: 'pix',
      paid_at: paidAt,
    })
    .select('id')
    .single();

  let paymentRowId = inserted?.id;

  if (!insertError) {
    claimed = payment.status === 'approved';
  } else {
    // Já existia (webhook anterior ou outra via): atualiza o status. Só uma
    // das vias consegue mudar para "approved" — essa é quem ativa a assinatura.
    const { data: existing } = await admin.from('payments').select('id').eq('mp_payment_id', mpPaymentId).maybeSingle();
    if (!existing) throw new Error('Erro ao registrar pagamento Pix: ' + insertError.message);
    paymentRowId = existing.id;

    if (payment.status === 'approved') {
      const { data: changed } = await admin
        .from('payments')
        .update({ status: 'approved', paid_at: paidAt })
        .eq('id', existing.id)
        .neq('status', 'approved')
        .select('id');
      claimed = !!(changed && changed.length > 0);
    } else {
      await admin.from('payments').update({ status: payment.status }).eq('id', existing.id).neq('status', 'approved');
    }
  }

  if (!claimed) return { handled: true, status: payment.status };

  // --- Pagamento aprovado agora: divide a receita e ativa o acesso ---
  const split = calculateRevenueSplit(payment.transaction_amount);
  await admin.from('revenue_allocations').insert(
    REVENUE_SPLIT_TABLE.map((r) => ({
      payment_id: paymentRowId,
      recipient_name: r.recipient_name,
      percentage: r.percentage,
      amount: r.recipient_name === 'Tiago Pavinatto' ? split.tiago : r.recipient_name === 'Eliel Duarte' ? split.eliel : split.paulo,
    }))
  );

  const months = (PIX_PLANS[sub.plan_id] || PIX_PLANS.mensal).months;
  const now = new Date();
  // Renovação antes de vencer soma ao tempo que ainda restava.
  const base = sub.valid_until && new Date(sub.valid_until) > now ? new Date(sub.valid_until) : now;
  const validUntil = addMonths(base, months).toISOString();

  await admin
    .from('subscriptions')
    .update({
      status: 'active',
      started_at: sub.started_at || now.toISOString(),
      valid_until: validUntil,
      next_billing_at: validUntil,
      canceled_at: null,
      updated_at: now.toISOString(),
    })
    .eq('id', sub.id);

  // Quem recebe as edições: o presenteado (se for presente) ou quem pagou.
  const { data: payer } = await admin.from('profiles').select('email, nome').eq('id', sub.user_id).single();
  const target = sub.is_gift
    ? (await admin.from('profiles').select('email, nome').eq('email', sub.gift_recipient_email).maybeSingle()).data
    : payer;
  if (!target) {
    console.error('Pix: perfil do destinatário da newsletter não encontrado.', { subscriptionId: sub.id });
    return { handled: true, status: payment.status };
  }

  const { data: current } = await admin.from('newsletter_subscribers').select('status').eq('email', target.email).maybeSingle();
  const wasAlreadyActive = current?.status === 'active';

  await admin
    .from('newsletter_subscribers')
    .update({ status: 'active', updated_at: now.toISOString() })
    .eq('email', target.email);

  try {
    await emailProvider.upsertContact({ email: target.email, nome: target.nome });
  } catch (err) {
    console.error('Falha ao sincronizar assinante com o provedor de e-mail:', err.message);
  }

  if (sub.is_gift && !wasAlreadyActive) {
    try {
      const html = buildGiftWelcomeEmailHtml({
        recipientNome: sub.gift_recipient_name,
        gifterNome: sub.gift_sender_name,
        gifterMessage: sub.gift_message,
        manageUrl: `${process.env.APP_URL}/minha-conta`,
      });
      await emailProvider.sendGiftNotice({ toEmail: target.email, htmlContent: html });
    } catch (err) {
      console.error('Falha ao enviar aviso de presente:', err.message);
    }
  }

  return { handled: true, status: payment.status };
}
