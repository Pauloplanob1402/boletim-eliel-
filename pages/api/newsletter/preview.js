// Monta o HTML final de pré-visualização (com {{nome}}/{{email}} já substituídos
// por um assinante de exemplo) para o botão "Visualizar" do admin.
import { requireAdminApi } from '../../../lib/supabase/requireAdminApi';
import { renderNewsletter } from '../../../lib/newsletter/render';
import { estimateReadingMinutes } from '../../../lib/newsletter/readingTime';
import { buildNewsletterEmailHtml } from '../../../lib/newsletter/emailTemplate';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const auth = await requireAdminApi(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { id, title, preheader, hero_image_url, content_html, why_it_matters } = req.body || {};

  const sampleSubscriber = { nome: 'Maria', email: 'maria@exemplo.com' };
  const personalized = renderNewsletter(content_html || '', sampleSubscriber);
  const readingMinutes = estimateReadingMinutes(content_html || '');

  const previewId = id || 'preview';
  const html = buildNewsletterEmailHtml({
    title,
    preheader,
    heroImageUrl: hero_image_url,
    bodyHtml: personalized,
    readingMinutes,
    whyItMatters: why_it_matters,
    shareUrl: `${process.env.APP_URL}/edicoes/${previewId}`,
    ratingLinks: {
      excelente: '#preview-enquete',
      boa: '#preview-enquete',
      pode_melhorar: '#preview-enquete',
    },
    unsubscribeUrl: `${process.env.APP_URL}/api/unsubscribe?email=maria%40exemplo.com&token=preview`,
  });

  return res.status(200).json({ html, readingMinutes });
}
