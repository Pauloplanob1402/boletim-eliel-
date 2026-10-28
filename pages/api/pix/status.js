// A tela de pagamento Pix consulta esta rota a cada poucos segundos. Ela
// pergunta o estado real ao Mercado Pago e, se já estiver aprovado, ativa a
// assinatura na hora (o webhook faz o mesmo — o processamento é idempotente).
// Só devolve o status; nenhum dado pessoal sai daqui.
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { getPayment } from '../../../lib/mercadopago/client';
import { processPixPayment, getPixSubscriptionId } from '../../../lib/pix/process';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });

  const paymentId = String(req.query.payment_id || '').replace(/\D/g, '');
  if (!paymentId) return res.status(400).json({ error: 'payment_id inválido.' });

  try {
    const payment = await getPayment(paymentId);
    if (!getPixSubscriptionId(payment)) return res.status(404).json({ error: 'Pagamento não encontrado.' });

    const admin = createAdminClient();
    await processPixPayment(admin, payment);
    return res.status(200).json({ status: payment.status });
  } catch (err) {
    console.error('Erro em /api/pix/status:', err.message);
    return res.status(502).json({ error: 'Não foi possível consultar o pagamento agora.' });
  }
}
