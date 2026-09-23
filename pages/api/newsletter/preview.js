// Monta o HTML final de pré-visualização (com {{nome}}/{{email}} já substituídos
// por um assinante de exemplo) para o botão "Visualizar" do admin.
import { requireAdminApi } from '../../../lib/supabase/requireAdminApi';
import { renderNewsletter } from '../../../lib/newsletter/render';
import { buildNewsletterEmailHtml } from '../../../lib/newsletter/emailTemplate';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const auth = await requireAdminApi(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { title, preheader, hero_image_url, content_html } = req.body || {};

  const sampleSubscriber = { nome: 'Maria', email: 'maria@exemplo.com' };
  const personalized = renderNewsletter(content_html || '', sampleSubscriber);

  const html = buildNewsletterEmailHtml({
    title,
    preheader,
    heroImageUrl: hero_image_url,
    bodyHtml: personalized,
    unsubscribeUrl: `${process.env.APP_URL}/api/unsubscribe?email=maria%40exemplo.com&token=preview`,
  });

  return res.status(200).json({ html });
}
