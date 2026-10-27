// Desenha o certificado "Turma Sem Mimimi" num <canvas> (A4 em pé, 1654x2339 = 200 dpi).
// Tudo roda no navegador: nada é enviado a servidor nenhum, nenhum dado do leitor é salvo.
//
// Identidade 100% do Sem Mimimi (pop-art: creme, amarelo, vermelho, verde-petróleo, contorno preto).
// De propósito NÃO usa brasão, símbolos oficiais, cargos públicos nem assinatura de pessoa real:
// é um certificado simbólico de comunidade, e diz isso no próprio rodapé.

export const CERT_W = 1654;
export const CERT_H = 2339;

const C = {
  paper: '#fff7e0',
  paper2: '#ffeeb8',
  ink: '#141414',
  dim: '#3d372c',
  red: '#e5322d',
  redDark: '#c4231e',
  gold: '#ffd21f',
  teal: '#0f5a52',
  blue: '#1f5fd1',
};

// Três certificados em fundo branco, com acabamento metálico que sobe de valor:
// PRATA (leitor) → OURO (embaixador) → DIAMANTE (apoiador).
// Cada nível muda o metal, o padrão de fundo, o selo e o texto.
export const TEMAS = {
  leitor: {
    nivel: 'PRATA',
    cargo: { m: 'LEITOR', f: 'LEITORA' },
    metal: [[0, '#fafbfc'], [0.22, '#c6cbd2'], [0.48, '#868e99'], [0.7, '#dde1e6'], [1, '#a2a9b3']],
    titleStops: [[0, '#b4bac3'], [0.5, '#6b7380'], [1, '#3d434d']],
    dark: '#2c3036', accent: '#5b6470', ink: '#1a1d23', dim: '#4b525c',
    pattern: 'silver', sealPts: 24, sealInner: 150,
    tag: 'TURMA SEM MIMIMI · NÍVEL PRATA',
    sub: 'DE QUEM LÊ BRASÍLIA SEM PANO QUENTE',
    intro: ['Num país de manchete mastigada, alguém precisava dizer:', 'quem lê o que está por trás da notícia merece ser reconhecido.'],
    paragrafo: 'Gente que lê o contexto antes de repetir a opinião dos outros. Que não aceita resumo que protege alguém. Que sabe que informação boa dá trabalho — e faz o trabalho.',
    fecho: { m: 'Você não está sozinho. Tem muita gente do seu lado.', f: 'Você não está sozinha. Tem muita gente do seu lado.' },
    esq: ['A TURMA', 'QUEM LÊ, SABE'], dir: 'ORGULHO DE ESTAR AQUI',
    sealTop: '★ TURMA ★', sealBottom: 'NÍVEL PRATA',
  },
  embaixador: {
    nivel: 'OURO',
    cargo: { m: 'EMBAIXADOR', f: 'EMBAIXADORA' },
    metal: [[0, '#fff6c2'], [0.25, '#f0c030'], [0.5, '#b8860b'], [0.72, '#f7d96e'], [1, '#c99a1c']],
    titleStops: [[0, '#f2c744'], [0.5, '#b8860b'], [1, '#7a5200']],
    dark: '#5e3f00', accent: '#8a6200', ink: '#1f1a10', dim: '#5a5040',
    pattern: 'gold', sealPts: 32, sealInner: 160,
    tag: 'EMBAIXADA SEM MIMIMI · NÍVEL OURO',
    sub: 'DE QUEM LEVA O SEM MIMIMI PARA A MESA',
    intro: ['Toda turma forte começa com alguém que chama o próximo.', 'Quem espalha o contexto merece ser reconhecido.'],
    paragrafo: 'Gente que não guarda a boa informação para si. Que leva o contexto para a conversa, o grupo e a mesa — e faz a turma crescer, um convite de cada vez.',
    fecho: { m: 'Cada convite seu é um leitor a mais do nosso lado.', f: 'Cada convite seu é um leitor a mais do nosso lado.' },
    esq: ['A TURMA', 'QUEM CHAMA, CRESCE'], dir: 'ORGULHO DE ESPALHAR',
    sealTop: '★ EMBAIXADA ★', sealBottom: 'NÍVEL OURO',
  },
  apoiador: {
    nivel: 'DIAMANTE',
    cargo: { m: 'APOIADOR', f: 'APOIADORA' },
    metal: [[0, '#ffffff'], [0.2, '#c4ecff'], [0.42, '#7cc6f2'], [0.62, '#e8dcff'], [0.8, '#d6f3ff'], [1, '#8fd3ff']],
    titleStops: [[0, '#8fd6ff'], [0.5, '#3a9ad0'], [1, '#14608a']],
    dark: '#0b4f73', accent: '#0e6f8f', ink: '#10202b', dim: '#44596a',
    pattern: 'diamond', sealPts: 16, sealInner: 140,
    tag: 'APOIO SEM MIMIMI · NÍVEL DIAMANTE',
    sub: 'DE QUEM SUSTENTA O SEM MIMIMI',
    intro: ['Análise independente não se mantém sozinha.', 'Quem sustenta merece ser lembrado por nome.'],
    paragrafo: 'Gente que ajuda a manter de pé o que não pede licença. Que apoia a análise sem pano quente — e garante que a próxima edição chegue.',
    fecho: { m: 'Sem você, a próxima edição não existe. Obrigado.', f: 'Sem você, a próxima edição não existe. Obrigada.' },
    esq: ['A TURMA', 'QUEM SUSTENTA, SEGURA'], dir: 'GRATIDÃO',
    sealTop: '★ APOIO ★', sealBottom: 'NÍVEL DIAMANTE',
  },
};

// Lê o nome real da família de fonte que o next/font criou (as variáveis CSS ficam no <html>).
export function getFontFamilies() {
  const fallback = {
    display: "'Arial Black', Impact, sans-serif",
    body: 'Georgia, serif',
    mono: 'Courier New, monospace',
  };
  if (typeof window === 'undefined') return fallback;
  const cs = getComputedStyle(document.documentElement);
  const pick = (v, fb) => (cs.getPropertyValue(v).trim() ? `${cs.getPropertyValue(v).trim()}, ${fb}` : fb);
  return {
    display: pick('--font-display', fallback.display),
    body: pick('--font-body', fallback.body),
    mono: pick('--font-ibm-plex-mono', fallback.mono),
  };
}

// Garante que as fontes já baixaram antes de desenhar (senão o canvas usa a fonte reserva).
export async function loadFonts(fonts) {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`80px ${fonts.display}`),
      document.fonts.load(`italic 40px ${fonts.body}`),
      document.fonts.load(`700 40px ${fonts.body}`),
      document.fonts.load(`400 40px ${fonts.body}`),
      document.fonts.load(`600 30px ${fonts.mono}`),
    ]);
  } catch (e) {
    /* segue com a fonte reserva */
  }
}

export function dataPorExtenso(d = new Date()) {
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

function fitFont(ctx, text, startPx, family, maxW, minPx = 30) {
  let size = startPx;
  ctx.font = `400 ${size}px ${family}`;
  while (ctx.measureText(text).width > maxW && size > minPx) {
    size -= 4;
    ctx.font = `400 ${size}px ${family}`;
  }
  return size;
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function burst(ctx, cx, cy, rOuter, rInner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function textOnArc(ctx, text, cx, cy, radius, centerAngle, spacing) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0);
  let angle = centerAngle - total / radius / 2;
  chars.forEach((ch, i) => {
    const a = angle + widths[i] / radius / 2;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    angle += widths[i] / radius;
  });
}

function metalGrad(ctx, stops, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([p, c]) => g.addColorStop(p, c));
  return g;
}

function sparkle(ctx, x, y, r, T) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r * 0.12, -r * 0.12, r, 0);
  ctx.quadraticCurveTo(r * 0.12, r * 0.12, 0, r);
  ctx.quadraticCurveTo(-r * 0.12, r * 0.12, -r, 0);
  ctx.quadraticCurveTo(-r * 0.12, -r * 0.12, 0, -r);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = T.dark;
  ctx.stroke();
  ctx.restore();
}

// padrão de fundo bem discreto, diferente em cada nível
function drawPattern(ctx, T, m) {
  const x = m + 20, y = m + 20, w = CERT_W - (m + 20) * 2, h = CERT_H - (m + 20) * 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const cx = CERT_W / 2;
  const cy = 1180;
  if (T.pattern === 'silver') {
    // hachura diagonal fina (aço escovado)
    ctx.strokeStyle = 'rgba(120,128,140,0.11)';
    ctx.lineWidth = 2;
    for (let k = -CERT_H; k < CERT_W + CERT_H; k += 18) {
      ctx.beginPath();
      ctx.moveTo(k, 0);
      ctx.lineTo(k + CERT_H, CERT_H);
      ctx.stroke();
    }
  } else if (T.pattern === 'gold') {
    // anéis concêntricos (guilhochê)
    ctx.strokeStyle = 'rgba(184,134,11,0.13)';
    ctx.lineWidth = 2;
    for (let r = 30; r < 1500; r += 22) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    // losangos de lapidação
    ctx.strokeStyle = 'rgba(80,170,225,0.16)';
    ctx.lineWidth = 2;
    const g = 110;
    for (let k = -CERT_H; k < CERT_W + CERT_H; k += g) {
      ctx.beginPath();
      ctx.moveTo(k, 0);
      ctx.lineTo(k + CERT_H, CERT_H);
      ctx.moveTo(k + CERT_H, 0);
      ctx.lineTo(k, CERT_H);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFrame(ctx, T, m) {
  const W = CERT_W - m * 2;
  const H = CERT_H - m * 2;

  // folha branca com sombra suave
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(m, m, W, H);
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(m, m, W, H);

  drawPattern(ctx, T, m);
  // véu branco no centro para o texto respirar
  const fade = ctx.createRadialGradient(CERT_W / 2, 1200, 200, CERT_W / 2, 1200, 1100);
  fade.addColorStop(0, 'rgba(255,255,255,0.88)');
  fade.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(m + 20, m + 20, W - 40, H - 40);

  // borda metálica grossa
  const mg = metalGrad(ctx, T.metal, m, m, m + W, m + H);
  ctx.lineWidth = 24;
  ctx.strokeStyle = mg;
  ctx.strokeRect(m + 12, m + 12, W - 24, H - 24);
  // contornos finos escuros nos dois lados da borda (dá relevo)
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = T.dark;
  ctx.strokeRect(m, m, W, H);
  ctx.strokeRect(m + 24, m + 24, W - 48, H - 48);
  // filete interno
  ctx.lineWidth = 4;
  ctx.strokeStyle = mg;
  ctx.strokeRect(m + 44, m + 44, W - 88, H - 88);

  // cantos: arcos concêntricos
  const corners = [
    [m + 44, m + 44, 0],
    [m + W - 44, m + 44, Math.PI / 2],
    [m + W - 44, m + H - 44, Math.PI],
    [m + 44, m + H - 44, -Math.PI / 2],
  ];
  corners.forEach(([x, y, rot]) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.lineWidth = 5;
    for (let r = 34; r <= 102; r += 34) {
      ctx.strokeStyle = r === 68 ? T.dark : mg;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI / 2);
      ctx.stroke();
    }
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = T.dark;
    ctx.stroke();
    ctx.restore();
  });
}

function drawSeal(ctx, cx, cy, fonts, T) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-6 * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  const g = metalGrad(ctx, T.metal, cx - 190, cy - 190, cx + 190, cy + 190);
  // sombra
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  burst(ctx, cx, cy, 190, T.sealInner + 18, T.sealPts);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  burst(ctx, cx, cy, 190, T.sealInner + 18, T.sealPts);
  ctx.lineWidth = 4;
  ctx.strokeStyle = T.dark;
  ctx.stroke();

  // facetas (mais visíveis no diamante)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 160, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = T.pattern === 'diamond' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 3;
  const n = T.pattern === 'diamond' ? 16 : 24;
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 200, cy + Math.sin(a) * 200);
    ctx.stroke();
  }
  ctx.restore();

  // miolo branco com aro metálico
  ctx.beginPath();
  ctx.arc(cx, cy, 128, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = metalGrad(ctx, T.metal, cx - 128, cy - 128, cx + 128, cy + 128);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = T.dark;
  ctx.beginPath();
  ctx.arc(cx, cy, 134, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 122, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = T.ink;
  ctx.font = `400 58px ${fonts.display}`;
  ctx.fillText('SEM', cx, cy - 24);
  ctx.fillStyle = T.accent;
  ctx.fillText('MIMIMI', cx, cy + 32);

  ctx.fillStyle = T.dark;
  ctx.font = `600 17px ${fonts.mono}`;
  textOnArc(ctx, T.sealTop, cx, cy, 92, -Math.PI / 2, 5);
  textOnArc(ctx, T.sealBottom, cx, cy, 106, Math.PI / 2, 5);
  ctx.restore();
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{nome:string, titulo:'leitor'|'embaixador'|'apoiador', genero:'m'|'f', dataStr:string, codigo:string, host?:string, amostra?:boolean}} opts
 */
export function drawCertificate(canvas, opts, fonts) {
  const { titulo = 'leitor', genero = 'm', dataStr, codigo, host = '', amostra = false } = opts;
  const T = TEMAS[titulo] || TEMAS.leitor;
  const nome = (opts.nome || '').trim().replace(/\s+/g, ' ').toUpperCase() || 'SEU NOME AQUI';
  const cargo = T.cargo[genero] || T.cargo.m;

  canvas.width = CERT_W;
  canvas.height = CERT_H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, CERT_W, CERT_H);
  ctx.lineJoin = 'round';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CERT_W, CERT_H);

  const m = 64;
  drawFrame(ctx, T, m);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const cx = CERT_W / 2;

  // ---- etiqueta do topo (pílula metálica) ----
  const tagW = 700;
  const tagH = 60;
  const ty = 214;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.roundRect(cx - tagW / 2, ty - tagH / 2, tagW, tagH, 30);
  ctx.fillStyle = metalGrad(ctx, T.metal, cx - tagW / 2, ty - tagH / 2, cx + tagW / 2, ty + tagH / 2);
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 3;
  ctx.strokeStyle = T.dark;
  ctx.stroke();
  ctx.fillStyle = T.dark;
  ctx.font = `600 25px ${fonts.mono}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(T.tag, cx, ty + 2);
  ctx.textBaseline = 'alphabetic';

  // ---- título metálico ----
  const tSize = fitFont(ctx, 'CERTIFICADO', 250, fonts.display, CERT_W - 300);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = metalGrad(ctx, T.titleStops, 0, 520 - tSize * 0.75, 0, 520);
  ctx.fillText('CERTIFICADO', cx, 520);
  ctx.restore();
  ctx.lineWidth = 5;
  ctx.strokeStyle = T.dark;
  ctx.strokeText('CERTIFICADO', cx, 520);

  fitFont(ctx, T.sub, 70, fonts.display, CERT_W - 360);
  ctx.fillStyle = T.ink;
  ctx.fillText(T.sub, cx, 626);

  // régua com losango central
  const rg = metalGrad(ctx, T.metal, 210, 0, CERT_W - 210, 0);
  ctx.fillStyle = rg;
  ctx.fillRect(210, 662, CERT_W / 2 - 250, 5);
  ctx.fillRect(CERT_W / 2 + 40, 662, CERT_W / 2 - 250, 5);
  ctx.save();
  ctx.translate(cx, 664);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = rg;
  ctx.fillRect(-14, -14, 28, 28);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = T.dark;
  ctx.strokeRect(-14, -14, 28, 28);
  ctx.restore();

  // ---- corpo ----
  ctx.fillStyle = T.dim;
  ctx.font = `italic 400 46px ${fonts.body}`;
  ctx.fillText(T.intro[0], cx, 800);
  ctx.fillText(T.intro[1], cx, 864);

  ctx.font = `italic 400 52px ${fonts.body}`;
  ctx.fillStyle = T.ink;
  ctx.fillText('Por isso, com todas as letras e nenhum mimimi, declaramos que', cx, 990);

  // faixa metálica com o nome
  const size = fitFont(ctx, nome, 140, fonts.display, CERT_W - 460, 54);
  const nameW = ctx.measureText(nome).width;
  const bandH = size * 1.12;
  const bandCY = 1190 - size * 0.36;
  const bx = cx - nameW / 2 - 50;
  const bw = nameW + 100;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 7;
  ctx.fillStyle = metalGrad(ctx, T.metal, bx, bandCY - bandH / 2, bx + bw, bandCY + bandH / 2);
  ctx.fillRect(bx, bandCY - bandH / 2, bw, bandH);
  ctx.restore();
  ctx.lineWidth = 3;
  ctx.strokeStyle = T.dark;
  ctx.strokeRect(bx, bandCY - bandH / 2, bw, bandH);
  // brilho no topo da faixa
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(bx + 4, bandCY - bandH / 2 + 4, bw - 8, bandH * 0.22);
  ctx.fillStyle = T.ink;
  ctx.textBaseline = 'middle';
  ctx.fillText(nome, cx, bandCY + 2);
  ctx.textBaseline = 'alphabetic';

  // identidade (substantivo)
  const cargoTxt = `${cargo} DA TURMA SEM MIMIMI`;
  fitFont(ctx, cargoTxt, 64, fonts.display, CERT_W - 480);
  const cargoW = ctx.measureText(cargoTxt).width;
  const startX = cx - (cargoW + 70) / 2 + 70;
  ctx.textAlign = 'left';
  ctx.fillStyle = T.ink;
  ctx.fillText('é', startX - 70, 1338);
  ctx.fillStyle = T.accent;
  ctx.fillText(cargoTxt, startX, 1338);
  ctx.textAlign = 'center';

  ctx.fillStyle = T.ink;
  ctx.font = `400 43px ${fonts.body}`;
  const lines = wrapLines(ctx, T.paragrafo, CERT_W - 480);
  lines.forEach((ln, i) => ctx.fillText(ln, cx, 1450 + i * 66));

  ctx.font = `italic 700 46px ${fonts.body}`;
  ctx.fillStyle = T.accent;
  ctx.fillText(T.fecho[genero] || T.fecho.m, cx, 1450 + lines.length * 66 + 52);

  ctx.font = `600 30px ${fonts.mono}`;
  ctx.fillStyle = T.dim;
  ctx.fillText(`Brasília, ${dataStr}`.toUpperCase(), cx, 1782);
  ctx.font = `600 17px ${fonts.mono}`;
  ctx.fillText('CERTIFICADO SIMBÓLICO DE COMUNIDADE · SEM VALOR OFICIAL', cx, 1816);

  // ---- selo e linhas de assinatura ----
  drawSeal(ctx, cx, 2040, fonts, T);

  const lg = metalGrad(ctx, T.metal, 0, 0, 380, 0);
  ctx.fillStyle = lg;
  ctx.fillRect(190, 2110, 380, 5);
  ctx.fillRect(CERT_W - 570, 2110, 380, 5);
  ctx.font = `400 34px ${fonts.display}`;
  ctx.fillStyle = T.ink;
  ctx.fillText(T.esq[0], 190 + 190, 2160);
  ctx.fillText(cargo, CERT_W - 380, 2160);
  ctx.font = `600 19px ${fonts.mono}`;
  ctx.fillStyle = T.dim;
  ctx.fillText(T.esq[1], 190 + 190, 2192);
  ctx.fillText(T.dir, CERT_W - 380, 2192);

  // ---- rodapé: código e verificação ----
  ctx.fillStyle = T.dim;
  ctx.font = `600 19px ${fonts.mono}`;
  ctx.textAlign = 'left';
  ctx.fillText(`CÓDIGO ${codigo || 'SM-XXXX-XXXX'}`, 150, 2246);
  ctx.textAlign = 'right';
  ctx.fillText(`VERIFICAR: ${(host || 'SEU-SITE') + '/CERTIFICADO/VERIFICAR'}`.toUpperCase(), CERT_W - 150, 2246);
  ctx.textAlign = 'center';

  // ---- brilhos ----
  if (T.pattern === 'diamond') {
    [[300, 260, 34], [1350, 260, 26], [330, 735, 22], [1330, 735, 30], [220, 1700, 26], [1440, 1700, 34], [360, 1930, 22], [1290, 1930, 24]].forEach(([x, y, r]) => sparkle(ctx, x, y, r, T));
  } else if (T.pattern === 'gold') {
    [[300, 260, 24], [1350, 260, 28], [220, 1700, 22]].forEach(([x, y, r]) => sparkle(ctx, x, y, r, T));
  } else {
    [[1350, 260, 22]].forEach(([x, y, r]) => sparkle(ctx, x, y, r, T));
  }

  // ---- marca d'água de amostra ----
  if (amostra) {
    ctx.save();
    ctx.translate(cx, CERT_H / 2);
    ctx.rotate((-24 * Math.PI) / 180);
    ctx.font = `400 340px ${fonts.display}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(110,110,110,0.20)';
    ctx.fillText('AMOSTRA', 0, 0);
    ctx.restore();
  }
}

// ---------- PDF (1 página A4, imagem JPEG), sem biblioteca ----------
export function canvasToPdfBlob(canvas) {
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const bin = atob(jpegDataUrl.split(',')[1]);
  const jpeg = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) jpeg[i] = bin.charCodeAt(i);

  const enc = new TextEncoder();
  const chunks = [];
  const offsets = [];
  let pos = 0;
  const push = (data) => {
    const bytes = typeof data === 'string' ? enc.encode(data) : data;
    chunks.push(bytes);
    pos += bytes.length;
  };
  const obj = (n, body) => {
    offsets[n] = pos;
    push(`${n} 0 obj\n`);
    push(body);
    push('\nendobj\n');
  };

  const PW = 595.28;
  const PH = 841.89;
  const content = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;

  push('%PDF-1.4\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`
  );
  offsets[4] = pos;
  push(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`
  );
  push(jpeg);
  push('\nendstream\nendobj\n');
  obj(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

  const xref = pos;
  let table = 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) table += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  push(table);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);

  return new Blob(chunks, { type: 'application/pdf' });
}
