// Recebe o clique de 1 dos 3 botões da enquete rápida no fim de cada edição
// ("🎯 Excelente / 👍 Boa / 👎 Pode melhorar"). Precisa ser GET porque é um
// link clicável dentro do e-mail, não um formulário.
import { createAdminClient } from '../../../lib/supabase/adminClient';

const VALID_RATINGS = ['excelente', 'boa', 'pode_melhorar'];

export default async function handler(req, res) {
  const { nl, email, rating } = req.query;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!nl || !email || !VALID_RATINGS.includes(rating)) {
    return res.status(400).send(renderFeedbackPage('Link inválido.', false));
  }

  const admin = createAdminClient();

  const { data: subscriber } = await admin
    .from('newsletter_subscribers')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!subscriber) {
    return res.status(200).send(renderFeedbackPage('Não encontramos sua assinatura, mas obrigado pelo retorno!', true));
  }

  // upsert: se a pessoa já votou nessa edição, atualiza o voto em vez de duplicar
  // (ver constraint unique(newsletter_id, subscriber_id) no schema).
  await admin
    .from('newsletter_feedback')
    .upsert(
      { newsletter_id: nl, subscriber_id: subscriber.id, rating },
      { onConflict: 'newsletter_id,subscriber_id' }
    );

  return res.status(200).send(renderFeedbackPage('Voto registrado. Obrigado pelo retorno!', true));
}

function renderFeedbackPage(message, ok) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Sem Mimimi</title></head>
  <body style="font-family:Arial,sans-serif; background:#fbf6ee; color:#2b2118; padding:60px 20px; text-align:center;">
    <h1 style="font-size:1.3rem;">${ok ? '✓' : '✕'} ${message}</h1>
    <a href="${process.env.APP_URL}" style="color:#d9591a;">Voltar ao site</a>
  </body></html>`;
}
