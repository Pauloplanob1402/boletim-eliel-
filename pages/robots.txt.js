// /robots.txt dinâmico — mesma lógica do sitemap.xml.js (ver comentário lá).
// Bloqueia o /admin inteiro e as rotas de API de buscadores, e aponta pro sitemap.

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://semmimimi.com.br').replace(/\/$/, '');

function buildRobots() {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /minha-conta

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(buildRobots());
  res.end();

  return { props: {} };
}

export default function Robots() {
  return null;
}
