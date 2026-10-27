// Confirma se um certificado é autêntico (usado em /certificado/verificar).
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { normalizarCodigo, limiteExcedido, registrarFalha, ipDe } from '../../../lib/certificate/codes';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });

  const ip = ipDe(req);
  if (limiteExcedido(ip)) return res.status(429).json({ valid: false, error: 'Muitas tentativas. Tente mais tarde.' });

  const codigo = normalizarCodigo(req.query.code);
  if (!codigo) {
    registrarFalha(ip);
    return res.status(200).json({ valid: false });
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from('certificate_codes')
    .select('titulo, nome, genero, resgatado_em')
    .eq('code', codigo)
    .maybeSingle();

  // Mesma resposta para "não existe" e "ainda não resgatado": não revela quais códigos existem.
  if (!row || !row.resgatado_em) {
    registrarFalha(ip);
    return res.status(200).json({ valid: false });
  }

  return res.status(200).json({
    valid: true,
    codigo,
    titulo: row.titulo,
    nome: row.nome,
    genero: row.genero,
    emitidoEm: row.resgatado_em,
  });
}
