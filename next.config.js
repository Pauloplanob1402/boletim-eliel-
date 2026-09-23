/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Redirects para os nomes de arquivo antigos (site estático em .html),
  // caso algum link antigo (e-mail já enviado, favorito, post) ainda aponte
  // para eles. 308 = redirect permanente (bom para SEO e para o navegador
  // memorizar o destino certo).
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/assinar.html', destination: '/assinar', permanent: true },
      { source: '/edicao-exemplo.html', destination: '/edicao-exemplo', permanent: true },
    ];
  },
};

module.exports = nextConfig;
