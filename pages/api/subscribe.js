// Passo 1 do fluxo de assinatura: cria o usuário (sem senha — login será por
// magic link), o perfil, o registro pendente de assinante de newsletter e a
// assinatura no Mercado Pago. NADA aqui ativa o acesso pago — isso só
// acontece quando o webhook confirmar o pagamento no servidor (ver
// pages/api/mercadopago/webhook.js).
import { createAdminClient } from '../../lib/supabase/adminClient';
import { createSubscription } from '../../lib/mercadopago/client';

const PLAN_CONFIG = {
  mensal: { amount: 29.9, envKey: 'MERCADOPAGO_PLAN_ID_MENSAL' },
  anual: { amount: 299.0, envKey: 'MERCADOPAGO_PLAN_ID_ANUAL' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { nome, email, plano, preferredDay, aceitaTermos, querNewsletter } = req.body || {};

  if (!nome || !email || !aceitaTermos) {
    return res.status(400).json({ error: 'Nome, e-mail e aceite dos termos são obrigatórios.' });
  }
  const planConfig = PLAN_CONFIG[plano];
  if (!planConfig) return res.status(400).json({ error: 'Plano inválido.' });

  const planId = process.env[planConfig.envKey];
  if (!planId) {
    return res.status(500).json({
      error: `Plano do Mercado Pago não configurado (${planConfig.envKey} ausente). Veja o README.`,
    });
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  try {
    // 1) Encontra ou cria o usuário (auth) para este e-mail — sem senha, ele
    // entra depois via magic link em /minha-conta.
    let userId;
    const { data: existingProfile } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();

    if (existingProfile) {
      userId = existingProfile.id;
      await admin.from('profiles').update({ nome, updated_at: nowIso }).eq('id', userId);
    } else {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { nome },
      });
      if (createError) throw createError;
      userId = created.user.id;

      await admin.from('profiles').insert({
        id: userId,
        email,
        nome,
        role: 'subscriber',
        status: 'active',
        accepted_terms_at: nowIso,
        accepted_privacy_at: nowIso,
        newsletter_opt_in_at: querNewsletter ? nowIso : null,
      });
    }

    // 2) Registro de assinante de newsletter — fica "pending" até o
    // pagamento ser confirmado pelo webhook.
    const { data: existingSub } = await admin
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingSub) {
      await admin
        .from('newsletter_subscribers')
        .update({ nome, status: 'pending', receive_newsletter: !!querNewsletter, preferred_day: preferredDay, updated_at: nowIso })
        .eq('id', existingSub.id);
    } else {
      await admin.from('newsletter_subscribers').insert({
        user_id: userId,
        email,
        nome,
        status: 'pending',
        receive_newsletter: !!querNewsletter,
        preferred_day: preferredDay,
      });
    }

    // 3) Cria a assinatura no Mercado Pago.
    const mpSubscription = await createSubscription({
      planId,
      payerEmail: email,
      externalReference: userId,
    });

    // 4) Registra a assinatura localmente como "pending" — o webhook
    // atualiza para o status real assim que o Mercado Pago confirmar.
    await admin.from('subscriptions').insert({
      user_id: userId,
      mp_preapproval_id: mpSubscription.id,
      plan_id: plano,
      status: 'pending',
      amount: planConfig.amount,
      currency: 'BRL',
    });

    return res.status(200).json({ init_point: mpSubscription.init_point });
  } catch (err) {
    console.error('Erro em /api/subscribe:', err.message);
    return res.status(502).json({ error: 'Não foi possível iniciar a assinatura agora. Tente novamente em instantes.' });
  }
}
