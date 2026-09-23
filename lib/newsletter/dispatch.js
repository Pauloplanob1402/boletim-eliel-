// Lógica compartilhada entre /api/newsletter/send, /api/newsletter/schedule e
// /api/cron/newsletters: monta o HTML final e dispara pela Sender para os
// assinantes ativos, registrando o resultado em newsletter_sends.
import { createAdminClient } from '../supabase/adminClient';
import { toSenderMergeTags } from './render';
import { estimateReadingMinutes } from './readingTime';
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

/**
 * Monta o corpo do e-mail (HTML + texto) para uma newsletter já carregada do
 * banco. Reaproveitado tanto pelo envio único quanto pelo teste A/B (que só
 * muda o `subject`).
 */
function buildEmailBundle(newsletter, subject) {
  const mergedBody = toSenderMergeTags(newsletter.content_html);
  const readingMinutes = estimateReadingMinutes(newsletter.content_html);
  const shareUrl = `${process.env.APP_URL}/edicoes/${newsletter.id}`;

  // As enquetes e o e-mail usam {$email} (merge tag nativo da Sender) para
  // identificar o destinatário sem precisar de 1 chamada de API por pessoa —
  // ver toSenderMergeTags() em lib/newsletter/render.js.
  const ratingLinks = {
    excelente: `${process.env.APP_URL}/api/newsletter/feedback?nl=${newsletter.id}&rating=excelente&email={$email}`,
    boa: `${process.env.APP_URL}/api/newsletter/feedback?nl=${newsletter.id}&rating=boa&email={$email}`,
    pode_melhorar: `${process.env.APP_URL}/api/newsletter/feedback?nl=${newsletter.id}&rating=pode_melhorar&email={$email}`,
  };

  const html = buildNewsletterEmailHtml({
    title: newsletter.title,
    preheader: newsletter.preheader,
    heroImageUrl: newsletter.hero_image_url,
    bodyHtml: mergedBody,
    readingMinutes,
    whyItMatters: newsletter.why_it_matters,
    shareUrl,
    ratingLinks,
    unsubscribeUrl: `${process.env.APP_URL}/api/unsubscribe`,
  });
  const text = buildNewsletterEmailText({ title: newsletter.title, bodyHtml: mergedBody, unsubscribeUrl: `${process.env.APP_URL}/api/unsubscribe` });

  return { html, text, subject };
}

/**
 * Envia a newsletter imediatamente para todos os assinantes ativos.
 *
 * Teste A/B de assunto (Copywriter's Handbook): se `subject_b` estiver
 * preenchido, a lista de assinantes ativos é dividida ~50/50 — metade recebe
 * `subject` (variante A), metade recebe `subject_b` (variante B). O corpo do
 * e-mail é idêntico nas duas variantes; só o assunto muda. O resultado fica
 * registrado por destinatário em newsletter_sends.subject_variant, e pode ser
 * cruzado depois com newsletter_feedback para ver qual assunto gerou mais
 * abertura/engajamento.
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

  const hasAbTest = !!(newsletter.subject_b && newsletter.subject_b.trim());

  // Divide a lista em dois grupos (A/B) de forma estável — embaralha por id
  // para não sempre mandar a variante A para "quem se cadastrou primeiro".
  let groupA = subscribers;
  let groupB = [];
  if (hasAbTest) {
    const shuffled = [...subscribers].sort(() => 0.5 - Math.random());
    const half = Math.ceil(shuffled.length / 2);
    groupA = shuffled.slice(0, half);
    groupB = shuffled.slice(half);
  }

  const bundleA = buildEmailBundle(newsletter, newsletter.subject);
  const bundleB = hasAbTest ? buildEmailBundle(newsletter, newsletter.subject_b) : null;

  let campaignA = null;
  let campaignB = null;
  let sendError = null;

  try {
    if (groupA.length > 0) {
      campaignA = await emailProvider.sendNewsletter({ subject: bundleA.subject, htmlContent: bundleA.html, textContent: bundleA.text });
    }
    if (hasAbTest && groupB.length > 0) {
      campaignB = await emailProvider.sendNewsletter({ subject: bundleB.subject, htmlContent: bundleB.html, textContent: bundleB.text });
    }
  } catch (err) {
    sendError = err;
  }

  const nowIso = new Date().toISOString();
  const sendRows = [
    ...groupA.map((s) => ({
      newsletter_id: newsletterId,
      subscriber_id: s.id,
      email: s.email,
      subject_variant: 'A',
      sender_message_id: campaignA?.data?.id || null,
      status: sendError ? 'failed' : 'sent',
      sent_at: sendError ? null : nowIso,
      error_message: sendError ? sendError.message : null,
    })),
    ...groupB.map((s) => ({
      newsletter_id: newsletterId,
      subscriber_id: s.id,
      email: s.email,
      subject_variant: 'B',
      sender_message_id: campaignB?.data?.id || null,
      status: sendError ? 'failed' : 'sent',
      sent_at: sendError ? null : nowIso,
      error_message: sendError ? sendError.message : null,
    })),
  ];

  // Idempotência simples: remove envios anteriores desta newsletter antes de
  // inserir de novo (evita duplicar linhas se o endpoint for chamado 2x).
  await admin.from('newsletter_sends').delete().eq('newsletter_id', newsletterId);
  await admin.from('newsletter_sends').insert(sendRows);

  await admin
    .from('newsletters')
    .update({ status: sendError ? 'failed' : 'sent', sent_at: sendError ? null : nowIso })
    .eq('id', newsletterId);

  if (sendError) throw sendError;

  return { recipientCount: subscribers.length, abTest: hasAbTest };
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
