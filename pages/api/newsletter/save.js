// Cria ou atualiza uma newsletter como rascunho (status = 'draft').
// Usado pela tela "Nova newsletter" / "Editar newsletter" do admin.
import { requireAdminApi } from '../../../lib/supabase/requireAdminApi';
import { createAdminClient } from '../../../lib/supabase/adminClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const auth = await requireAdminApi(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { id, title, subject, preheader, content_html, content_text, hero_image_url } = req.body || {};

  if (!title || !subject || !content_html) {
    return res.status(400).json({ error: 'Título, assunto e conteúdo são obrigatórios.' });
  }

  const admin = createAdminClient();
  const payload = {
    title,
    subject,
    preheader: preheader || null,
    content_html,
    content_text: content_text || null,
    hero_image_url: hero_image_url || null,
    updated_at: new Date().toISOString(),
  };

  let result;
  if (id) {
    result = await admin.from('newsletters').update(payload).eq('id', id).select().single();
  } else {
    result = await admin
      .from('newsletters')
      .insert({ ...payload, status: 'draft', created_by: auth.user.id })
      .select()
      .single();
  }

  if (result.error) {
    return res.status(500).json({ error: 'Erro ao salvar rascunho: ' + result.error.message });
  }

  return res.status(200).json({ newsletter: result.data });
}
