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

  // Acesso ao arquivo é por RECEBER a newsletter (newsletter_subscribers
  // ativo), não por ter uma linha de cobrança própria — isso cobre tanto
  // quem paga a própria assinatura quanto quem recebeu de presente.
  const { data: subscriberRow } = await admin
    .from('newsletter_subscribers')
    .select('status')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (!subscriberRow || subscriberRow.status !== 'active') {
    return res.status(403).json({ error: 'Arquivo disponível só para quem recebe a newsletter ativamente.' });
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
