// Link de descadastro presente em toda newsletter (obrigatório por LGPD).
// Aceita ?id=<newsletter_subscribers.id> (link canônico) ou ?email=... como
// fallback simples. GET para funcionar como link direto no e-mail.
import { createAdminClient } from '../../lib/supabase/adminClient';
import { emailProvider } from '../../lib/sender/client';

export default async function handler(req, res) {
  const { id, email } = req.query;
  if (!id && !email) return res.status(400).send('Link de descadastro inválido.');

  const admin = createAdminClient();

  let query = admin.from('newsletter_subscribers').update({ status: 'unsubscribed', receive_newsletter: false, updated_at: new Date().toISOString() });
  query = id ? query.eq('id', id) : query.eq('email', email);

  const { data, error } = await query.select('email').maybeSingle();

  if (!error && data?.email) {
    try {
      await emailProvider.removeContact(data.email);
    } catch (err) {
      console.error('Falha ao remover contato da Sender no descadastro:', err.message);
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Inscrição cancelada</title></head>
  <body style="font-family:Arial,sans-serif; background:#fbf6ee; color:#2b2118; padding:60px 20px; text-align:center;">
    <h1 style="font-size:1.4rem;">Inscrição cancelada</h1>
    <p>Você não vai mais receber a newsletter Sem Mimimi. Sentiremos sua falta.</p>
    <a href="${process.env.APP_URL}" style="color:#d9591a;">Voltar ao site</a>
  </body></html>`);
}
