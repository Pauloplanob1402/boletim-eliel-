import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Usada para montar URL absoluta (canonical/OG) sem precisar passar isso por
// getServerSideProps em cada página. Precisa ser NEXT_PUBLIC_ porque roda no
// navegador também — não confundir com APP_URL (só servidor, usada em
// e-mails e no Mercado Pago). Ver .env.example.
const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://semmimimi.com.br').replace(/\/$/, '');

export default function SiteLayout({
  title,
  description,
  active,
  children,
  ogImage = '/og-image.png',
  noindex = false,
}) {
  const router = useRouter();
  const canonical = `${SITE_URL}${router.asPath.split('?')[0]}`;
  const absoluteOgImage = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`;

  return (
    <>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href={canonical} />
        {noindex && <meta name="robots" content="noindex, nofollow" />}

        {/* Open Graph — como o link aparece quando compartilhado no WhatsApp,
            X, LinkedIn etc. (relevante porque o e-mail tem botões de compartilhar
            que levam pra /edicoes/[id], ver lib/newsletter/emailTemplate.js) */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Sem Mimimi" />
        <meta property="og:title" content={title} />
        {description && <meta property="og:description" content={description} />}
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={absoluteOgImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        {description && <meta name="twitter:description" content={description} />}
        <meta name="twitter:image" content={absoluteOgImage} />
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
