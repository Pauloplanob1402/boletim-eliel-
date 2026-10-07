import { Html, Head, Main, NextScript } from 'next/document';
import { display, body, ibmPlexMono } from '../lib/fonts';

// As classes de fonte (next/font) vão na tag <Html> — é o único lugar que preenche
// o :root do CSS (styles/globals.css usa var(--font-display) etc. dentro de
// --display/--body/--mono), então toda página do site herda as 3 fontes sem
// precisar importar nada disso de novo em nenhum outro arquivo.
export default function Document() {
  return (
    <Html lang="pt-BR" className={`${display.variable} ${body.variable} ${ibmPlexMono.variable}`}>
      <Head>
        {/* Favicon — ver components/SiteLayout.js e components/AdminLayout.js para as
            meta tags de título/descrição/OG, que mudam por página. Os ícones ficam aqui
            porque são os mesmos em todo o site. */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <meta name="theme-color" content="#111111" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
