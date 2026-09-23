// Consulta o status atual de uma assinatura — útil para a tela de retorno do
// checkout mostrar algo enquanto o webhook (assíncrono) ainda não chegou.
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { requireUserApi } from '../../../lib/supabase/requireAdminApi';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });

  const auth = await requireUserApi(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const admin = createAdminClient();
  const { data: subscription, error } = await admin
    .from('subscriptions')
    .select('status, plan_id, next_billing_at, started_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ subscription });
}
