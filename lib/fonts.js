// Fontes auto-hospedadas via next/font/google — em vez do site pedir os arquivos de
// fonte pro Google a cada visita (Google Fonts CSS -> cada arquivo .woff2, uma cadeia de
// pedidos externos), o Next.js baixa tudo isso UMA VEZ no build e serve os arquivos
// junto com o resto do site, no mesmo domínio. Zero conexão externa, zero cadeia.
//
// Usado só em pages/_document.js — nenhum outro arquivo deveria importar isto.
// As 3 variáveis CSS abaixo (--font-display, --font-body, --font-ibm-plex-mono) são
// aplicadas na tag <Html> pelo _document.js, e o styles/globals.css já referencia elas
// dentro de --display/--body/--mono — então nenhuma outra parte do CSS precisou mudar.
//
// Título: Instrument Sans. Corpo: Hanken Grotesk. Escolhidas a dedo (comparação visual
// lado a lado) pra substituir Anton/Archivo, que estavam parecendo genéricas demais.
import { Instrument_Sans, Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google';

export const display = Instrument_Sans({
  // único peso usado de verdade: styles/globals.css força font-weight:700 em todo
  // lugar que usa var(--display), pra manter a mesma presença visual forte que o
  // Anton tinha (que só existia num peso só, e já era um peso "pesado").
  weight: '700',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const body = Hanken_Grotesk({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

