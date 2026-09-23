// Cliente Supabase para uso em getServerSideProps / API routes, respeitando a sessão
// (cookies) do usuário logado — para operações que devem obedecer RLS normalmente.
import { createServerClient, serializeCookieHeader } from '@supabase/ssr';

export function createServerSupabase(req, res) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies || {}).map(([name, value]) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          res.setHeader(
            'Set-Cookie',
            cookiesToSet.map(({ name, value, options }) =>
              serializeCookieHeader(name, value, options)
            )
          );
        },
      },
    }
  );
}
