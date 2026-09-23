// Lógica compartilhada entre /api/newsletter/send, /api/newsletter/schedule e
// /api/cron/newsletters: monta o HTML final e dispara pela Sender para os
// assinantes ativos, registrando o resultado em newsletter_sends.
import { createAdminClient } from '../supabase/adminClient';
import { toSenderMergeTags } from './render';
import { buildNewsletterEmailHtml, buildNewsletterEmailText } from './emailTemplate';
import { emailProvider } from '../sender/client';

/** Busca os assinantes ativos que devem receber a newsletter agora. */
export async function getActiveSubscribers(admin) {
  const { data, error } = await admin
    .from('newsletter_subscribers')
    .select('id, email, nome')
    .eq('status', 'active')
    .eq('receive_newsletter', true);
  if (error) throw new Error('Erro ao buscar assinantes: ' + error.message);
  return data || [];
}

function unsubscribeUrlFor(subscriberId) {
  return `${process.env.APP_URL}/api/unsubscribe?id=${subscriberId}`;
}

/**
 * Envia a newsletter imediatamente para todos os assinantes ativos.
 * `admin` é o client Supabase com service role (já criado pelo chamador).
 */
export async function dispatchNewsletterNow(newsletterId) {
  const admin = createAdminClient();

  const { data: newsletter, error: nlError } = await admin
    .from('newsletters')
    .select('*')
    .eq('id', newsletterId)
    .single();
  if (nlError || !newsletter) throw new Error('Newsletter não encontrada.');

  await admin.from('newsletters').update({ status: 'sending' }).eq('id', newsletterId);

  const subscribers = await getActiveSubscribers(admin);

  if (subscribers.length === 0) {
    await admin.from('newsletters').update({ status: 'failed' }).eq('id', newsletterId);
    throw new Error('Nenhum assinante ativo para enviar.');
  }

  // Corpo com merge tags da Sender ({$nome}) — a personalização por
  // destinatário acontece no envio da campanha, não aqui.
  const mergedBody = toSenderMergeTags(newsletter.content_html);
  const html = buildNewsletterEmailHtml({
    title: newsletter.title,
    preheader: newsletter.preheader,
    heroImageUrl: newsletter.hero_image_url,
    bodyHtml: mergedBody,
    // Link genérico — cada disparo real da Sender pode sobrescrever com o
    // link individual de descadastro da própria Sender, se configurado.
    unsubscribeUrl: `${process.env.APP_URL}/api/unsubscribe`,
  });
  const text = buildNewsletterEmailText({ title: newsletter.title, bodyHtml: mergedBody, unsubscribeUrl: `${process.env.APP_URL}/api/unsubscribe` });

  let campaign;
  let sendError = null;
  try {
    campaign = await emailProvider.sendNewsletter({ subject: newsletter.subject, htmlContent: html, textContent: text });
  } catch (err) {
    sendError = err;
  }

  const nowIso = new Date().toISOString();
  const sendRows = subscribers.map((s) => ({
    newsletter_id: newsletterId,
    subscriber_id: s.id,
    email: s.email,
    sender_message_id: campaign?.data?.id || null,
    status: sendError ? 'failed' : 'sent',
    sent_at: sendError ? null : nowIso,
    error_message: sendError ? sendError.message : null,
  }));

  // Idempotência simples: remove envios anteriores desta newsletter antes de
  // inserir de novo (evita duplicar linhas se o endpoint for chamado 2x).
  await admin.from('newsletter_sends').delete().eq('newsletter_id', newsletterId);
  await admin.from('newsletter_sends').insert(sendRows);

  await admin
    .from('newsletters')
    .update({ status: sendError ? 'failed' : 'sent', sent_at: sendError ? null : nowIso })
    .eq('id', newsletterId);

  if (sendError) throw sendError;

  return { recipientCount: subscribers.length, campaign };
}

/**
 * Agenda a newsletter para envio futuro.
 *
 * Importante: o agendamento é resolvido pelo NOSSO cron (/api/cron/newsletters),
 * não pelo agendador nativo da Sender — isso deixa uma única fonte de verdade
 * (o Supabase) sobre o que está agendado, evita agendar duas vezes na Sender se
 * o horário for editado depois, e permite reagir a assinantes que entraram ou
 * saíram entre o agendamento e o envio de fato.
 */
export async function scheduleNewsletter(newsletterId, scheduledAtIso) {
  const admin = createAdminClient();

  const { data: newsletter, error: nlError } = await admin
    .from('newsletters')
    .select('id')
    .eq('id', newsletterId)
    .single();
  if (nlError || !newsletter) throw new Error('Newsletter não encontrada.');

  if (!scheduledAtIso || new Date(scheduledAtIso).getTime() <= Date.now()) {
    throw new Error('A data/hora de agendamento precisa estar no futuro.');
  }

  await admin.from('newsletters').update({ status: 'scheduled', scheduled_at: scheduledAtIso }).eq('id', newsletterId);
}
