// Salva/atualiza a chave Pix de um dos 3 beneficiários do split (Tiago,
// Eliel, Paulo) — usado pelo formulário inline em /admin/receitas.
// Ver supabase/migration_004_revenue_payouts.sql (tabela revenue_recipients)
// e lib/newsletter/pix.js (normalização da chave por tipo).
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { requireAdminApi } from '../../../lib/supabase/requireAdminApi';
import { normalizePixKey, PIX_KEY_TYPES } from '../../../lib/newsletter/pix';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const adminCheck = await requireAdminApi(req);
  if (!adminCheck.ok) return res.status(adminCheck.status).json({ error: adminCheck.error });

  const { recipientName, pixKey, pixKeyType, pixCity, isPlatformAccount } = req.body || {};

  if (!recipientName) {
    return res.status(400).json({ error: 'recipientName é obrigatório.' });
  }

  const admin = createAdminClient();

  // Quem já é dono da conta que recebe a assinatura não precisa de chave Pix
  // — o dinheiro já está na conta dele. Nesse caso, salva só a flag e limpa
  // a chave, pra não ficar um Pix "morto" configurado por engano.
  if (isPlatformAccount) {
    const { error } = await admin
      .from('revenue_recipients')
      .update({ is_platform_account: true, pix_key: null, pix_key_type: null })
      .eq('recipient_name', recipientName);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  if (!pixKey || !pixKeyType) {
    return res.status(400).json({ error: 'Informe a chave Pix e o tipo.' });
  }
  if (!PIX_KEY_TYPES.includes(pixKeyType)) {
    return res.status(400).json({ error: 'Tipo de chave Pix inválido.' });
  }

  let normalizedKey;
  try {
    normalizedKey = normalizePixKey(pixKey, pixKeyType);
  } catch (err) {
    // Erro de validação de formato — devolve a mensagem específica
    // (ex.: "CPF precisa ter 11 dígitos") pra aparecer direto no formulário.
    return res.status(400).json({ error: err.message });
  }

  const { error } = await admin
    .from('revenue_recipients')
    .update({
      pix_key: normalizedKey,
      pix_key_type: pixKeyType,
      pix_city: (pixCity || 'BRASILIA').trim() || 'BRASILIA',
      is_platform_account: false,
    })
    .eq('recipient_name', recipientName);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true, normalizedKey });
}
