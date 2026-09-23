// Rotina periódica (ver vercel.json -> crons) que dispara newsletters agendadas
// cujo horário já chegou. A Vercel autentica automaticamente chamadas de cron
// enviando "Authorization: Bearer $CRON_SECRET" quando essa env var existe —
// checamos isso para impedir que qualquer pessoa dispare envios batendo nesta URL.
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { dispatchNewsletterNow } from '../../../lib/newsletter/dispatch';

export default async function handler(req, res) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const authHeader = req.headers.authorization || '';
    if (authHeader !== `Bearer ${expected}`) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: due, error } = await admin
    .from('newsletters')
    .select('id, title')
    .eq('status', 'scheduled')
    .lte('scheduled_at', nowIso);

  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar newsletters agendadas: ' + error.message });
  }

  const results = [];
  for (const newsletter of due || []) {
    // Trava simples de idempotência: tenta mudar de 'scheduled' -> 'sending'
    // com uma condição na cláusula WHERE; se outro processo já pegou esta
    // newsletter (corrida entre execuções do cron), a atualização não afeta
    // nenhuma linha e pulamos — evita enviar duas vezes.
    const { data: locked } = await admin
      .from('newsletters')
      .update({ status: 'sending' })
      .eq('id', newsletter.id)
      .eq('status', 'scheduled')
      .select('id');

    if (!locked || locked.length === 0) {
      results.push({ id: newsletter.id, skipped: true });
      continue;
    }

    try {
      const result = await dispatchNewsletterNow(newsletter.id);
      results.push({ id: newsletter.id, title: newsletter.title, sent: true, recipientCount: result.recipientCount });
    } catch (err) {
      results.push({ id: newsletter.id, title: newsletter.title, sent: false, error: err.message });
    }
  }

  return res.status(200).json({ processed: results.length, results });
}
