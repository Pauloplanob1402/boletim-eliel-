// Fontes auto-hospedadas via next/font/google (baixadas uma vez no build, servidas do mesmo domínio).
// Usado só em pages/_document.js. As variáveis CSS (--font-display, --font-body, --font-ibm-plex-mono)
// são aplicadas na tag <Html>, e styles/globals.css as referencia em --display/--body/--mono.
//
// Direção pop-art: títulos em fonte de quadrinhos (Lilita One, pesada e arredondada);
// texto das edições em serifa (Lora), que lê bem em textos longos e irônicos;
// IBM Plex Mono mantida nas etiquetas e notas de "Fonte:" (cara de rodapé de jornal).
import { Lilita_One, Lora, IBM_Plex_Mono } from 'next/font/google';

export const display = Lilita_One({
  // Lilita One existe em um único peso (400), já bem pesado.
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const body = Lora({
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
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
