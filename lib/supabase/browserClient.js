// Cliente Supabase para uso no navegador (frontend).
// Usa a chave ANÔNIMA — segura para expor, protegida pelas políticas de RLS no banco.
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
