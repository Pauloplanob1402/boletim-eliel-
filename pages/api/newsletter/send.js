import { requireAdminApi } from '../../../lib/supabase/requireAdminApi';
import { dispatchNewsletterNow } from '../../../lib/newsletter/dispatch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const auth = await requireAdminApi(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Informe o id da newsletter.' });

  try {
    const result = await dispatchNewsletterNow(id);
    return res.status(200).json({ ok: true, recipientCount: result.recipientCount });
  } catch (err) {
    return res.status(502).json({ error: 'Falha ao enviar: ' + err.message });
  }
}
