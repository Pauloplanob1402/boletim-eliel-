// Cancela a assinatura do usuário logado. A confirmação de que o cancelamento
// "pegou" acontece pelo webhook (subscription_preapproval) — aqui só disparamos
// o pedido de cancelamento no Mercado Pago.
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { requireUserApi } from '../../../lib/supabase/requireAdminApi';
import { cancelSubscription } from '../../../lib/mercadopago/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const auth = await requireUserApi(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const admin = createAdminClient();
  const { data: subscription, error } = await admin
    .from('subscriptions')
    .select('id, mp_preapproval_id, status')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !subscription) return res.status(404).json({ error: 'Assinatura não encontrada.' });
  if (subscription.status !== 'active') return res.status(400).json({ error: 'Esta assinatura já não está ativa.' });

  try {
    await cancelSubscription(subscription.mp_preapproval_id);
    // Não apagamos histórico — só marcamos o cancelamento; o status final
    // "canceled" também será confirmado pelo webhook quando o MP processar.
    await admin
      .from('subscriptions')
      .update({ canceled_at: new Date().toISOString() })
      .eq('id', subscription.id);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(502).json({ error: 'Não foi possível cancelar no Mercado Pago agora: ' + err.message });
  }
}
