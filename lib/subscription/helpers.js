// Funções compartilhadas entre /api/subscribe (cartão) e /api/pix/create (Pix).

export async function findOrCreateProfile(admin, { email, nome, querNewsletter, nowIso }) {
  const { data: existingProfile } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();

  if (existingProfile) {
    if (nome) await admin.from('profiles').update({ nome, updated_at: nowIso }).eq('id', existingProfile.id);
    return existingProfile.id;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { nome },
  });
  if (createError) throw createError;

  await admin.from('profiles').insert({
    id: created.user.id,
    email,
    nome,
    role: 'subscriber',
    status: 'active',
    accepted_terms_at: nowIso,
    accepted_privacy_at: nowIso,
    newsletter_opt_in_at: querNewsletter ? nowIso : null,
  });

  return created.user.id;
}

export async function upsertNewsletterSubscriber(admin, { userId, email, nome, receiveNewsletter, nowIso }) {
  const { data: existingSub } = await admin.from('newsletter_subscribers').select('id').eq('email', email).maybeSingle();

  if (existingSub) {
    await admin
      .from('newsletter_subscribers')
      .update({ nome, status: 'pending', receive_newsletter: receiveNewsletter, updated_at: nowIso })
      .eq('id', existingSub.id);
  } else {
    await admin.from('newsletter_subscribers').insert({
      user_id: userId,
      email,
      nome,
      status: 'pending',
      receive_newsletter: receiveNewsletter,
    });
  }
}
