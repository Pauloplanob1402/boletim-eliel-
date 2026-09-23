// Helper usado em getServerSideProps das páginas /admin/** para garantir que
// só um usuário autenticado com role = 'admin' consiga ver a página.
import { createServerSupabase } from './serverClient';
import { createAdminClient } from './adminClient';

export async function requireAdmin(context) {
  const { req, res } = context;
  const supabase = createServerSupabase(req, res);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: { destination: '/admin/login', permanent: false },
    };
  }

  // A role nunca é confiada a partir do frontend/sessão — sempre consultada no
  // banco com a service role, que ignora RLS.
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, role, nome, email')
    .eq('id', user.id)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    return {
      redirect: { destination: '/admin/login', permanent: false },
    };
  }

  return { props: { adminUser: { id: user.id, nome: profile.nome, email: profile.email } } };
}
