import { requireAdminApi } from '../../../lib/supabase/requireAdminApi';
import { scheduleNewsletter } from '../../../lib/newsletter/dispatch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const auth = await requireAdminApi(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { id, scheduledAt } = req.body || {};
  if (!id || !scheduledAt) return res.status(400).json({ error: 'Informe o id da newsletter e a data/hora.' });

  try {
    await scheduleNewsletter(id, scheduledAt);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
