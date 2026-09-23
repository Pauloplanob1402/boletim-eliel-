import Head from 'next/head';
import Link from 'next/link';

export default function SiteLayout({ title, description, active, children }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <header>
        <div className="nav-inner">
          <div className="brand">
            SEM <span>MIMIMI</span>
          </div>
          <nav className="primary">
            <Link href="/" className={active === 'inicio' ? 'active' : ''}>
              Início
            </Link>
            <Link href="/edicao-exemplo" className={active === 'edicao' ? 'active' : ''}>
              Leia uma edição
            </Link>
            <Link
              href="/assinar"
              className={`btn-nav${active === 'assinar' ? ' active' : ''}`}
            >
              Assinar
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer>
        <div className="wrap">
          <div className="brand">
            SEM <span style={{ color: 'var(--red)' }}>MIMIMI</span>
          </div>
          <nav>
            <Link href="/">Início</Link>
            <Link href="/edicao-exemplo">Leia uma edição</Link>
            <Link href="/assinar">Assinar</Link>
          </nav>
        </div>
        <div className="wrap fine" style={{ marginTop: 16 }}>
          © 2026 Sem Mimimi. Tiago Pavinatto.
        </div>
      </footer>
    </>
  );
}
