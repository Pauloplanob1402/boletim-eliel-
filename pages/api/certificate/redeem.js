// Resgata um certificado: confere o código e grava o nome UMA vez.
// Chamar de novo com o mesmo código devolve o mesmo certificado (sem trocar o nome).
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { normalizarCodigo, limiteExcedido, registrarFalha, ipDe } from '../../../lib/certificate/codes';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const ip = ipDe(req);
  if (limiteExcedido(ip)) {
    return res.status(429).json({ error: 'Muitas tentativas. Espere alguns minutos e tente de novo.' });
  }

  const { code, nome, genero } = req.body || {};
  const codigo = normalizarCodigo(code);
  if (!codigo) {
    registrarFalha(ip);
    return res.status(400).json({ error: 'Código inválido. Ele tem o formato SM-XXXX-XXXX.' });
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('certificate_codes')
    .select('id, code, titulo, nome, genero, resgatado_em')
    .eq('code', codigo)
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Erro ao consultar o código. Tente de novo.' });
  if (!row) {
    registrarFalha(ip);
    return res.status(404).json({ error: 'Não encontramos esse código. Confira se digitou certo.' });
  }

  let final = row;
  let jaResgatado = !!row.resgatado_em;

  if (!jaResgatado) {
    const nomeLimpo = String(nome || '').trim().replace(/\s+/g, ' ');
    if (nomeLimpo.length < 2 || nomeLimpo.length > 60) {
      return res.status(400).json({ error: 'Digite seu nome (entre 2 e 60 letras).' });
    }
    if (genero !== 'm' && genero !== 'f') {
      return res.status(400).json({ error: 'Escolha a forma de tratamento.' });
    }
    const { data: atualizado, error: upErr } = await admin
      .from('certificate_codes')
      .update({ nome: nomeLimpo, genero, resgatado_em: new Date().toISOString() })
      .eq('id', row.id)
      .is('resgatado_em', null)
      .select('id, code, titulo, nome, genero, resgatado_em')
      .maybeSingle();
    if (upErr) return res.status(500).json({ error: 'Erro ao gerar o certificado. Tente de novo.' });
    if (atualizado) {
      final = atualizado;
    } else {
      // alguém resgatou no mesmo instante: devolve o que ficou gravado
      const { data: de } = await admin
        .from('certificate_codes')
        .select('id, code, titulo, nome, genero, resgatado_em')
        .eq('id', row.id)
        .single();
      final = de;
      jaResgatado = true;
    }
  }

  return res.status(200).json({
    ok: true,
    jaResgatado,
    codigo: final.code,
    titulo: final.titulo,
    nome: final.nome,
    genero: final.genero,
    emitidoEm: final.resgatado_em,
  });
}
