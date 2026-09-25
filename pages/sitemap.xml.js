// Sitemap gerado dinamicamente em /sitemap.xml (sem precisar de arquivo estático).
// Next.js Pages Router não tem um gerador de sitemap pronto (isso é recurso do App
// Router), então esta página nunca renderiza nada — ela só escreve XML na resposta e
// encerra, dentro de getServerSideProps. Ver README item 15.
//
// Se no futuro as edições ganharem página pública indexável em massa (hoje
// /edicoes/[id] existe mas cada edição paga normalmente não deve ser indexada,
// já que é conteúdo pago), adicione aqui um loop buscando os ids no Supabase.

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://semmimimi.com.br').replace(/\/$/, '');

// Páginas públicas e permanentes do site. `changefreq`/`priority` são só uma dica para
// os buscadores, não uma garantia.
const STATIC_PAGES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/edicao-exemplo', changefreq: 'monthly', priority: '0.8' },
  { path: '/assinar', changefreq: 'monthly', priority: '0.9' },
  { path: '/termos-de-uso', changefreq: 'yearly', priority: '0.2' },
  { path: '/politica-de-privacidade', changefreq: 'yearly', priority: '0.2' },
  { path: '/politica-de-cancelamento', changefreq: 'yearly', priority: '0.2' },
];

function buildSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const urls = STATIC_PAGES.map(
    (page) => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'application/xml');
  // Cache de 1h na borda da Vercel — o sitemap muda raríssimo, não precisa gerar a
  // cada acesso do Google.
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(buildSitemap());
  res.end();

  return { props: {} };
}

// Nunca chega a renderizar — getServerSideProps encerra a resposta antes.
export default function Sitemap() {
  return null;
}
