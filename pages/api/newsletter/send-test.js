// Envia uma cópia de teste da newsletter para um único e-mail informado no admin,
// sem tocar na tabela newsletter_sends nem nos assinantes reais.
import { requireAdminApi } from '../../../lib/supabase/requireAdminApi';
import { renderNewsletter } from '../../../lib/newsletter/render';
import { buildNewsletterEmailHtml, buildNewsletterEmailText } from '../../../lib/newsletter/emailTemplate';
import { emailProvider } from '../../../lib/sender/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const auth = await requireAdminApi(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { toEmail, title, subject, preheader, hero_image_url, content_html } = req.body || {};
  if (!toEmail || !content_html || !subject) {
    return res.status(400).json({ error: 'Informe o e-mail de teste, o assunto e o conteúdo.' });
  }

  const sampleSubscriber = { nome: 'Teste', email: toEmail };
  const personalized = renderNewsletter(content_html, sampleSubscriber);
  const unsubscribeUrl = `${process.env.APP_URL}/api/unsubscribe?email=${encodeURIComponent(toEmail)}&token=teste`;

  const html = buildNewsletterEmailHtml({ title, preheader, heroImageUrl: hero_image_url, bodyHtml: personalized, unsubscribeUrl });
  const text = buildNewsletterEmailText({ title, bodyHtml: personalized, unsubscribeUrl });

  try {
    await emailProvider.sendTest({ toEmail, subject, htmlContent: html, textContent: text });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(502).json({ error: 'Falha ao enviar teste pela Sender: ' + err.message });
  }
}
