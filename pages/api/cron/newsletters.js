// Rotina periódica (ver vercel.json -> crons) que dispara newsletters agendadas
// cujo horário já chegou. A Vercel autentica automaticamente chamadas de cron
// enviando "Authorization: Bearer $CRON_SECRET" quando essa env var existe —
// checamos isso para impedir que qualquer pessoa dispare envios batendo nesta URL.
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { dispatchNewsletterNow } from '../../../lib/newsletter/dispatch';
import { emailProvider } from '../../../lib/email/provider';

// Dá mais tempo à função na Vercel (o padrão é curto). O teto real depende do
// plano — confira em Project Settings > Functions e ajuste se necessário.
export const config = { maxDuration: 60 };

// Passado esse tempo em 'sending', consideramos que a função morreu no meio.
const STUCK_AFTER_MINUTES = 15;

export default async function handler(req, res) {
  const expected = process.env.CRON_SECRET;
  // Falha fechada: sem CRON_SECRET configurado, ninguém dispara o cron.
  if (!expected) {
    console.error('CRON_SECRET não configurado — cron bloqueado.');
    return res.status(500).json({ error: 'CRON_SECRET não configurado.' });
  }
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  // Assinaturas por Pix não renovam sozinhas: vencido o prazo, o acesso acaba.
  // Falha aqui não pode impedir o envio das newsletters agendadas.
  let expiredPix = 0;
  try {
    expiredPix = await expirePixSubscriptions(admin, nowIso);
  } catch (err) {
    console.error('Falha ao expirar assinaturas Pix:', err.message);
  }

  // Newsletters que ficaram presas em 'sending' (timeout da função) são
  // resolvidas antes de buscar as agendadas.
  let recovered = [];
  try {
    recovered = await recoverStuckNewsletters(admin);
  } catch (err) {
    console.error('Falha ao recuperar newsletters travadas:', err.message);
  }

  const { data: due, error } = await admin
    .from('newsletters')
    .select('id, title')
    .eq('status', 'scheduled')
    .lte('scheduled_at', nowIso);

  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar newsletters agendadas: ' + error.message });
  }

  const results = [];
  for (const newsletter of due || []) {
    // Trava simples de idempotência: tenta mudar de 'scheduled' -> 'sending'
    // com uma condição na cláusula WHERE; se outro processo já pegou esta
    // newsletter (corrida entre execuções do cron), a atualização não afeta
    // nenhuma linha e pulamos — evita enviar duas vezes.
    const { data: locked } = await admin
      .from('newsletters')
      .update({ status: 'sending' })
      .eq('id', newsletter.id)
      .eq('status', 'scheduled')
      .select('id');

    if (!locked || locked.length === 0) {
      results.push({ id: newsletter.id, skipped: true });
      continue;
    }

    try {
      const result = await dispatchNewsletterNow(newsletter.id);
      results.push({ id: newsletter.id, title: newsletter.title, sent: true, recipientCount: result.recipientCount });
    } catch (err) {
      results.push({ id: newsletter.id, title: newsletter.title, sent: false, error: err.message });
    }
  }

  return res.status(200).json({ processed: results.length, expiredPix, recovered, results });
}

/**
 * Resolve newsletters presas em 'sending' há mais de STUCK_AFTER_MINUTES.
 *
 * Regra de ouro: NUNCA voltar para 'scheduled' se o e-mail pode já ter saído,
 * senão todos os assinantes recebem em dobro. Por isso o dispatch grava o id da
 * campanha assim que o provedor aceita o envio:
 *  - nenhuma campanha gravada  -> nada saiu: volta para 'scheduled' (o cron
 *                                 tenta de novo na próxima execução);
 *  - campanha(s) gravada(s)    -> já saiu: marca como 'sent', sem reenviar;
 *  - teste A/B com só a A saída -> estado parcial: marca 'failed' para decisão
 *                                 manual no admin (reenviar só a B à mão).
 */
async function recoverStuckNewsletters(admin) {
  const cutoff = new Date(Date.now() - STUCK_AFTER_MINUTES * 60 * 1000).toISOString();
  const { data: stuck, error } = await admin
    .from('newsletters')
    .select('id, title, subject_b, campaign_a_id, campaign_b_id, sending_started_at, updated_at')
    .eq('status', 'sending')
    .or(`sending_started_at.lt.${cutoff},and(sending_started_at.is.null,updated_at.lt.${cutoff})`);
  if (error) throw new Error(error.message);

  const out = [];
  for (const nl of stuck || []) {
    const hasAb = !!(nl.subject_b && nl.subject_b.trim());
    const nowIso = new Date().toISOString();
    let next;
    let patch;

    if (!nl.campaign_a_id) {
      next = 'scheduled';
      patch = { status: 'scheduled', sending_started_at: null };
    } else if (hasAb && !nl.campaign_b_id) {
      next = 'failed';
      patch = { status: 'failed' };
    } else {
      next = 'sent';
      patch = { status: 'sent', sent_at: nowIso };
    }

    // Condição no WHERE: só mexe se ainda estiver 'sending' (evita corrida com
    // uma execução que terminou entre o SELECT e o UPDATE).
    const { data: changed } = await admin
      .from('newsletters')
      .update(patch)
      .eq('id', nl.id)
      .eq('status', 'sending')
      .select('id');

    if (changed && changed.length > 0) {
      console.warn(`[cron] newsletter ${nl.id} presa em 'sending' -> '${next}'`);
      out.push({ id: nl.id, title: nl.title, movedTo: next });
    }
  }
  return out;
}

async function expirePixSubscriptions(admin, nowIso) {
  const { data: expired, error } = await admin
    .from('subscriptions')
    .select('id, user_id, is_gift, gift_recipient_email')
    .eq('billing_type', 'pix')
    .eq('status', 'active')
    .lt('valid_until', nowIso);
  if (error) throw new Error(error.message);

  for (const sub of expired || []) {
    await admin.from('subscriptions').update({ status: 'expired' }).eq('id', sub.id);

    let email = sub.is_gift ? sub.gift_recipient_email : null;
    if (!email) {
      const { data: payer } = await admin.from('profiles').select('email').eq('id', sub.user_id).maybeSingle();
      email = payer?.email;
    }
    if (!email) continue;

    await admin.from('newsletter_subscribers').update({ status: 'inactive', updated_at: nowIso }).eq('email', email);
    try {
      await emailProvider.removeContact(email);
    } catch (err) {
      console.error('Falha ao remover contato expirado do provedor de e-mail:', err.message);
    }
  }
  return (expired || []).length;
}
