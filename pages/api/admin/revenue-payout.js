// Marca como "repassado" tudo que estava pendente para um beneficiário —
// chamado depois que o admin efetivamente pagou o Pix (o clique é uma
// confirmação manual, não existe conciliação automática pra Pix estático,
// ver lib/newsletter/pix.js). Usado pelo botão "Marcar como repassado" em
// /admin/receitas.
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { requireAdminApi } from '../../../lib/supabase/requireAdminApi';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const adminCheck = await requireAdminApi(req);
  if (!adminCheck.ok) return res.status(adminCheck.status).json({ error: adminCheck.error });

  const { recipientName } = req.body || {};
  if (!recipientName) return res.status(400).json({ error: 'recipientName é obrigatório.' });

  const admin = createAdminClient();

  // Só atualiza o que estava pendente NESTE momento — se um novo pagamento
  // entrar um segundo depois (webhook concorrente), ele fica pendente pro
  // próximo repasse, não é marcado como pago por engano.
  const { data: updated, error } = await admin
    .from('revenue_allocations')
    .update({ payout_status: 'paid', paid_at: new Date().toISOString(), paid_by: adminCheck.user.id })
    .eq('recipient_name', recipientName)
    .eq('payout_status', 'pending')
    .select('id, amount');

  if (error) return res.status(500).json({ error: error.message });

  const total = (updated || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return res.status(200).json({ ok: true, count: updated?.length || 0, total });
}
