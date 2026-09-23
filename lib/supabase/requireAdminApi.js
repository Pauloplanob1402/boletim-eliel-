// Helper equivalente a requireAdmin.js, mas para uso dentro de pages/api/** (API
// routes), onde não existe getServerSideProps/context — a sessão chega via
// header "Authorization: Bearer <access_token>" enviado pelo frontend.
import { createAdminClient } from './adminClient';

/**
 * @returns {Promise<{ ok: true, user: object, profile: object } | { ok: false, status: number, error: string }>}
 */
export async function requireAdminApi(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return { ok: false, status: 401, error: 'Não autenticado.' };
  }

  const admin = createAdminClient();
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);

  if (userError || !user) {
    return { ok: false, status: 401, error: 'Sessão inválida ou expirada.' };
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role, nome, email')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return { ok: false, status: 403, error: 'Acesso restrito ao administrador.' };
  }

  return { ok: true, user, profile };
}

/**
 * Mesma ideia, mas para o usuário comum (assinante) autenticado — usado em
 * /api/account/cancel para confirmar quem está pedindo o cancelamento.
 */
export async function requireUserApi(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { ok: false, status: 401, error: 'Não autenticado.' };

  const admin = createAdminClient();
  const {
    data: { user },
    error,
  } = await admin.auth.getUser(token);

  if (error || !user) return { ok: false, status: 401, error: 'Sessão inválida ou expirada.' };
  return { ok: true, user };
}
