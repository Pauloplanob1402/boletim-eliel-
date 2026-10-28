// Gera uma cobrança Pix avulsa (QR Code + Pix copia e cola) para um plano.
// Como no cartão (/api/subscribe), NADA aqui libera o acesso: isso só acontece
// quando o Mercado Pago confirmar o pagamento (webhook ou /api/pix/status).
//
// Renovação: se quem paga já tem uma assinatura Pix própria (não presente),
// ela é reaproveitada — o novo pagamento soma o período ao que ainda restava.
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { createPixPayment } from '../../../lib/mercadopago/client';
import { findOrCreateProfile, upsertNewsletterSubscriber } from '../../../lib/subscription/helpers';
import { PIX_PLANS } from '../../../lib/pix/process';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { nome, email, plano, aceitaTermos, querNewsletter, isGift, giftRecipientName, giftRecipientEmail, giftMessage } =
    req.body || {};

  if (!nome || !email || !aceitaTermos) {
    return res.status(400).json({ error: 'Nome, e-mail e aceite dos termos são obrigatórios.' });
  }
  if (isGift && (!giftRecipientName || !giftRecipientEmail)) {
    return res.status(400).json({ error: 'Preencha nome e e-mail de quem vai receber o presente.' });
  }
  const plan = PIX_PLANS[plano];
  if (!plan) return res.status(400).json({ error: 'Plano inválido.' });

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  try {
    const payerUserId = await findOrCreateProfile(admin, { email, nome, querNewsletter, nowIso });

    if (isGift) {
      const recipientUserId = await findOrCreateProfile(admin, {
        email: giftRecipientEmail,
        nome: giftRecipientName,
        querNewsletter: true,
        nowIso,
      });
      await upsertNewsletterSubscriber(admin, {
        userId: recipientUserId,
        email: giftRecipientEmail,
        nome: giftRecipientName,
        receiveNewsletter: true,
        nowIso,
      });
    } else {
      await upsertNewsletterSubscriber(admin, {
        userId: payerUserId,
        email,
        nome,
        receiveNewsletter: !!querNewsletter,
        nowIso,
      });
    }

    // Assinatura Pix local: reaproveita a do próprio pagante (renovação) ou cria.
    let subscriptionId = null;
    if (!isGift) {
      const { data: existing } = await admin
        .from('subscriptions')
        .select('id')
        .eq('user_id', payerUserId)
        .eq('billing_type', 'pix')
        .eq('is_gift', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        subscriptionId = existing.id;
        await admin.from('subscriptions').update({ plan_id: plano, amount: plan.amount }).eq('id', existing.id);
      }
    }

    if (!subscriptionId) {
      const { data: created, error: subError } = await admin
        .from('subscriptions')
        .insert({
          user_id: payerUserId,
          plan_id: plano,
          status: 'pending',
          billing_type: 'pix',
          amount: plan.amount,
          currency: 'BRL',
          is_gift: !!isGift,
          gift_sender_name: isGift ? nome : null,
          gift_recipient_name: isGift ? giftRecipientName : null,
          gift_recipient_email: isGift ? giftRecipientEmail : null,
          gift_message: isGift ? giftMessage || null : null,
        })
        .select('id')
        .single();
      if (subError) throw new Error('Erro ao criar assinatura: ' + subError.message);
      subscriptionId = created.id;
    }

    const payment = await createPixPayment({
      amount: plan.amount,
      description: plan.reason,
      payerEmail: email,
      payerName: nome,
      externalReference: `pix:${subscriptionId}`,
      metadata: { subscription_id: subscriptionId, plano },
    });

    const qr = payment.point_of_interaction?.transaction_data;
    if (!qr?.qr_code) throw new Error('O Mercado Pago não devolveu o QR Code do Pix.');

    await admin.from('subscriptions').update({ mp_subscription_id: String(payment.id) }).eq('id', subscriptionId);

    return res.status(200).json({
      payment_id: payment.id,
      amount: plan.amount,
      qr_code: qr.qr_code,
      qr_code_base64: qr.qr_code_base64,
      ticket_url: qr.ticket_url || null,
    });
  } catch (err) {
    console.error('Erro em /api/pix/create:', err.message);
    return res.status(502).json({ error: 'Não foi possível gerar o Pix agora. Tente novamente em instantes.' });
  }
}
