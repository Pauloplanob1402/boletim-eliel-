// Gera códigos de certificado (só admin). Usado em /admin/certificados.
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { requireAdminApi } from '../../../lib/supabase/requireAdminApi';
import { gerarCodigo, TITULOS_VALIDOS } from '../../../lib/certificate/codes';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const adminCheck = await requireAdminApi(req);
  if (!adminCheck.ok) return res.status(adminCheck.status).json({ error: adminCheck.error });

  const { titulo, quantidade, destinatario } = req.body || {};
  if (!TITULOS_VALIDOS.includes(titulo)) return res.status(400).json({ error: 'Título inválido.' });
  const qtd = Math.min(200, Math.max(1, parseInt(quantidade, 10) || 1));
  const nota = String(destinatario || '').trim().slice(0, 80) || null;

  const admin = createAdminClient();
  const criados = [];
  // gera um a um; se bater num código repetido (raríssimo), tenta outro
  for (let i = 0; i < qtd; i++) {
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const code = gerarCodigo();
      const { error } = await admin.from('certificate_codes').insert({ code, titulo, destinatario: nota });
      if (!error) {
        criados.push(code);
        break;
      }
      if (error.code !== '23505') return res.status(500).json({ error: error.message });
    }
  }
  return res.status(200).json({ ok: true, codes: criados });
}
