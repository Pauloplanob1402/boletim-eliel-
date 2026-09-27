// Fontes auto-hospedadas via next/font/google — em vez do site pedir os arquivos de
// fonte pro Google a cada visita (Google Fonts CSS -> cada arquivo .woff2, uma cadeia de
// pedidos externos), o Next.js baixa tudo isso UMA VEZ no build e serve os arquivos
// junto com o resto do site, no mesmo domínio. Zero conexão externa, zero cadeia.
//
// Usado só em pages/_document.js — nenhum outro arquivo deveria importar isto.
// As 3 variáveis CSS abaixo (--font-anton, --font-archivo, --font-ibm-plex-mono) são
// aplicadas na tag <Html> pelo _document.js, e o styles/globals.css já referencia elas
// dentro de --display/--body/--mono — então nenhuma outra parte do CSS precisou mudar.
import { Anton, Archivo, IBM_Plex_Mono } from 'next/font/google';

export const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
  display: 'swap',
});

// weights e estilos cobrem o que o link antigo do Google Fonts pedia
// (family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500) — os arquivos
// só são baixados pelo navegador quando um peso/estilo é realmente usado na página,
// então ter a faixa completa aqui não pesa nada que não fosse usado antes.
export const archivo = Archivo({
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

export const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});
