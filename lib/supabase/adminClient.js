// Cliente Supabase com a SERVICE ROLE KEY — ignora RLS.
// NUNCA importe este arquivo em código que roda no navegador.
// Use apenas dentro de pages/api/** (server-side) ou getServerSideProps.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let _adminClient = null;

export function createAdminClient() {
  if (_adminClient) return _adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL não configurados nas variáveis de ambiente.'
    );
  }

  _adminClient = createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _adminClient;
}
