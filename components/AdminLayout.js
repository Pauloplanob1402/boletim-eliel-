import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createClient } from '../lib/supabase/browserClient';

const MENU = [
  { href: '/admin', label: 'Início' },
  { href: '/admin/assinantes', label: 'Assinantes' },
  { href: '/admin/assinaturas', label: 'Assinaturas' },
  { href: '/admin/pagamentos', label: 'Pagamentos' },
  { href: '/admin/newsletters', label: 'Newsletters' },
  { href: '/admin/envios', label: 'Envios' },
  { href: '/admin/receitas', label: 'Receitas' },
];

export default function AdminLayout({ title, adminUser, children }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  }

  return (
    <div className="admin-shell">
      <Head>
        <title>{title ? `${title} — Admin Sem Mimimi` : 'Admin Sem Mimimi'}</title>
      </Head>

      <aside className="admin-sidebar">
        <div className="brand">
          SEM <span style={{ color: 'var(--red)' }}>MIMIMI</span>
        </div>
        <nav>
          {MENU.map((item) => (
            <Link key={item.href} href={item.href} className={router.pathname === item.href ? 'active' : ''}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '20px 22px 0', marginTop: 20, borderTop: '1px solid var(--line)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', color: 'var(--dim)', marginBottom: 10 }}>
            {adminUser?.nome || adminUser?.email}
          </div>
          <button className="admin-btn secondary" onClick={handleLogout} style={{ width: '100%' }}>
            Sair
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <h1 className="admin-title">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
