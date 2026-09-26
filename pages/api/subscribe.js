// Passo 1 do fluxo de assinatura: cria o usuário (sem senha — login será por
// magic link), o perfil, o registro pendente de assinante de newsletter e a
// assinatura no Mercado Pago. NADA aqui ativa o acesso pago — isso só
// acontece quando o webhook confirmar o pagamento no servidor (ver
// pages/api/mercadopago/webhook.js).
//
// Suporta assinatura de presente: quem preenche o formulário (nome/email) é
// sempre quem PAGA; se isGift = true, quem recebe as edições é
// giftRecipientEmail — um perfil e um registro de assinante próprios são
// criados para essa pessoa, para que ela também possa entrar em /minha-conta
// (via magic link com o próprio e-mail) e escolher o dia preferido dela.
import { createAdminClient } from '../../lib/supabase/adminClient';
import { createSubscription } from '../../lib/mercadopago/client';
import { emailProvider } from '../../lib/sender/client';
import { buildWelcomeEmailHtml } from '../../lib/newsletter/emailTemplate';

const PLAN_CONFIG = {
  mensal: { amount: 22.0, frequency: 1, frequencyType: 'months', reason: 'Sem Mimimi — Plano Mensal' },
  anual: { amount: 220.0, frequency: 12, frequencyType: 'months', reason: 'Sem Mimimi — Plano Anual' },
};

async function findOrCreateProfile(admin, { email, nome, querNewsletter, nowIso }) {
  const { data: existingProfile } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();

  if (existingProfile) {
    if (nome) await admin.from('profiles').update({ nome, updated_at: nowIso }).eq('id', existingProfile.id);
    return existingProfile.id;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { nome },
  });
  if (createError) throw createError;

  await admin.from('profiles').insert({
    id: created.user.id,
    email,
    nome,
    role: 'subscriber',
    status: 'active',
    accepted_terms_at: nowIso,
    accepted_privacy_at: nowIso,
    newsletter_opt_in_at: querNewsletter ? nowIso : null,
  });

  return created.user.id;
}

async function upsertNewsletterSubscriber(admin, { userId, email, nome, preferredDay, receiveNewsletter, nowIso }) {
  const { data: existingSub } = await admin.from('newsletter_subscribers').select('id').eq('email', email).maybeSingle();

  if (existingSub) {
    await admin
      .from('newsletter_subscribers')
      .update({ nome, status: 'pending', receive_newsletter: receiveNewsletter, preferred_day: preferredDay, updated_at: nowIso })
      .eq('id', existingSub.id);
  } else {
    await admin.from('newsletter_subscribers').insert({
      user_id: userId,
      email,
      nome,
      status: 'pending',
      receive_newsletter: receiveNewsletter,
      preferred_day: preferredDay,
    });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const {
    nome,
    email,
    plano,
    preferredDay,
    aceitaTermos,
    querNewsletter,
    isGift,
    giftRecipientName,
    giftRecipientEmail,
    giftMessage,
  } = req.body || {};

  if (!nome || !email || !aceitaTermos) {
    return res.status(400).json({ error: 'Nome, e-mail e aceite dos termos são obrigatórios.' });
  }
  if (isGift && (!giftRecipientName || !giftRecipientEmail)) {
    return res.status(400).json({ error: 'Preencha nome e e-mail de quem vai receber o presente.' });
  }
  const planConfig = PLAN_CONFIG[plano];
  if (!planConfig) return res.status(400).json({ error: 'Plano inválido.' });

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  try {
    // 1) Perfil de quem paga (sempre existe — é quem faz login para gerenciar
    // a assinatura/cobrança, mesmo em modo presente).
    const payerUserId = await findOrCreateProfile(admin, { email, nome, querNewsletter, nowIso });

    if (isGift) {
      // 2a) Perfil de quem RECEBE o presente — para poder logar em
      // /minha-conta com o próprio e-mail e escolher o dia preferido.
      const recipientUserId = await findOrCreateProfile(admin, {
        email: giftRecipientEmail,
        nome: giftRecipientName,
        querNewsletter: true,
        nowIso,
      });
      // Quem recebe as edições é o presenteado, não quem paga.
      await upsertNewsletterSubscriber(admin, {
        userId: recipientUserId,
        email: giftRecipientEmail,
        nome: giftRecipientName,
        preferredDay: preferredDay || null,
        receiveNewsletter: true,
        nowIso,
      });
    } else {
      // 2b) Fluxo normal — quem paga é quem recebe.
      await upsertNewsletterSubscriber(admin, {
        userId: payerUserId,
        email,
        nome,
        preferredDay,
        receiveNewsletter: !!querNewsletter,
        nowIso,
      });
    }

    // 3) Cria a assinatura no Mercado Pago — sempre cobrada de quem paga.
    const mpSubscription = await createSubscription({
      reason: planConfig.reason,
      frequency: planConfig.frequency,
      frequencyType: planConfig.frequencyType,
      amount: planConfig.amount,
      payerEmail: email,
      externalReference: payerUserId,
    });

    // 4) Registra a assinatura localmente como "pending" — o webhook
    // atualiza para o status real assim que o Mercado Pago confirmar, e é lá
    // que o presenteado é efetivamente ativado e avisado (ver
    // pages/api/mercadopago/webhook.js).
    await admin.from('subscriptions').insert({
      user_id: payerUserId,
      mp_preapproval_id: mpSubscription.id,
      plan_id: plano,
      status: 'pending',
      amount: planConfig.amount,
      currency: 'BRL',
      is_gift: !!isGift,
      gift_sender_name: isGift ? nome : null,
      gift_recipient_name: isGift ? giftRecipientName : null,
      gift_recipient_email: isGift ? giftRecipientEmail : null,
      gift_message: isGift ? giftMessage || null : null,
    });

    // 5) E-mail imediato para quem PAGA (loop de hábito / confirmação).
    // O presenteado só é avisado depois que o pagamento for confirmado de
    // verdade (webhook) — ver buildGiftWelcomeEmailHtml.
    try {
      const welcomeHtml = buildWelcomeEmailHtml({
        nome,
        tema: isGift ? `o presente que você está preparando para ${giftRecipientName}` : undefined,
      });
      await emailProvider.sendWelcome({ toEmail: email, htmlContent: welcomeHtml });
    } catch (err) {
      console.error('Falha ao enviar e-mail de boas-vindas:', err.message);
    }

    return res.status(200).json({ init_point: mpSubscription.init_point });
  } catch (err) {
    console.error('Erro em /api/subscribe:', err.message);
    return res.status(502).json({ error: 'Não foi possível iniciar a assinatura agora. Tente novamente em instantes.' });
  }
}
