// Confere um cupom para mostrar o novo preço na tela de /assinar.
// Só consulta — a vaga é reservada de verdade em /api/subscribe e /api/pix/create.
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { previewCoupon, COUPON_MESSAGES } from '../../../lib/coupons';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { cupom } = req.body || {};
  try {
    const r = await previewCoupon(createAdminClient(), cupom);
    if (!r.ok) return res.status(200).json({ valid: false, error: COUPON_MESSAGES[r.reason] });
    return res.status(200).json({ valid: true, percentOff: r.percentOff });
  } catch (err) {
    console.error('Erro em /api/coupon/validate:', err.message);
    return res.status(502).json({ error: 'Não foi possível validar o cupom agora.' });
  }
}
