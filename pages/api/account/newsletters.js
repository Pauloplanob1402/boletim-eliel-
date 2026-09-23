// Lista as edições já enviadas para o assinante logado — é a seção "Suas
// edições" em /minha-conta (Superfans: acesso organizado ao histórico
// completo é o benefício pago; o link individual de cada edição já é
// público, ver pages/edicoes/[id].js).
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { requireUserApi } from '../../../lib/supabase/requireAdminApi';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });

  const auth = await requireUserApi(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const admin = createAdminClient();

  // Só assinante com assinatura ativa (ou já paga alguma vez) vê o arquivo
  // organizado — verificado no servidor, nunca confiando em estado do cliente.
  const { data: subscription } = await admin
    .from('subscriptions')
    .select('status')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription || subscription.status !== 'active') {
    return res.status(403).json({ error: 'Arquivo disponível só para assinantes ativos.' });
  }

  const { data: newsletters, error } = await admin
    .from('newsletters')
    .select('id, title, preheader, sent_at')
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(200);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ newsletters: newsletters || [] });
}
