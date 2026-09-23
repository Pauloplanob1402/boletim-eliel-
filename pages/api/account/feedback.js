// Canal de feedback direto do assinante ativo para a equipe do Pavinatto
// (seção "Superfãs" em /minha-conta) — grava em subscriber_messages, visível
// só para o admin.
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { requireUserApi } from '../../../lib/supabase/requireAdminApi';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const auth = await requireUserApi(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { message } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Escreva algo antes de enviar.' });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('subscriber_messages').insert({ user_id: auth.user.id, message: message.trim() });

  if (error) return res.status(500).json({ error: 'Erro ao enviar: ' + error.message });
  return res.status(200).json({ ok: true });
}
