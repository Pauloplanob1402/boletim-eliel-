// Endpoint fino pedido explicitamente no briefing (seção 5). O fluxo real de
// assinatura usado pelo formulário de /assinar é /api/subscribe, que já chama
// createSubscription() internamente e também cria o usuário/perfil/assinante
// numa única chamada. Este endpoint fica disponível para reuso futuro (ex.:
// trocar de plano, criar uma segunda assinatura para um usuário já existente)
// sem duplicar a lógica de integração com o Mercado Pago.
import { requireUserApi } from '../../../lib/supabase/requireAdminApi';
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { createSubscription } from '../../../lib/mercadopago/client';

const PLAN_CONFIG = {
  mensal: { amount: 22.0, frequency: 1, frequencyType: 'months', reason: 'Sem Mimimi — Plano Mensal' },
  anual: { amount: 220.0, frequency: 12, frequencyType: 'months', reason: 'Sem Mimimi — Plano Anual' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const auth = await requireUserApi(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { plano } = req.body || {};
  const planConfig = PLAN_CONFIG[plano];
  if (!planConfig) return res.status(400).json({ error: 'Plano inválido.' });

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('email').eq('id', auth.user.id).single();
  if (!profile) return res.status(404).json({ error: 'Perfil não encontrado.' });

  try {
    const mpSubscription = await createSubscription({
      reason: planConfig.reason,
      frequency: planConfig.frequency,
      frequencyType: planConfig.frequencyType,
      amount: planConfig.amount,
      payerEmail: profile.email,
      externalReference: auth.user.id,
    });
    return res.status(200).json({ init_point: mpSubscription.init_point, id: mpSubscription.id });
  } catch (err) {
    return res.status(502).json({ error: 'Erro ao criar assinatura no Mercado Pago: ' + err.message });
  }
}
