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

export const TITULOS = {
  leitor: { m: 'LEITOR', f: 'LEITORA', verbo: 'lê' },
  embaixador: { m: 'EMBAIXADOR', f: 'EMBAIXADORA', verbo: 'espalha' },
  apoiador: { m: 'APOIADOR', f: 'APOIADORA', verbo: 'apoia' },
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

// Código curto e estável a partir do nome (só identifica ESTE certificado; não é registro de nada).
export function certCode(nome, ano) {
  let h = 5381;
  const s = nome.trim().toUpperCase();
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `SM-${ano}-${h.toString(36).toUpperCase().padStart(6, '0').slice(-6)}`;
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

function drawHalftone(ctx, x, y, w, h, color, step, maxR) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = color;
  for (let j = 0; j * step < h + step; j++) {
    for (let i = 0; i * step < w + step; i++) {
      const px = x + i * step + (j % 2 ? step / 2 : 0);
      const py = y + j * step;
      // pontos maiores perto do canto (efeito de gradiente de quadrinho)
      const dx = px - x;
      const dy = py - y;
      const t = 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy) / Math.sqrt(w * w + h * h));
      const r = maxR * Math.pow(t, 1.3);
      if (r > 0.6) {
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
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

function drawSeal(ctx, cx, cy, fonts) {
  // selo "Turma Sem Mimimi"
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-8 * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  burst(ctx, cx + 8, cy + 8, 190, 168, 28);
  ctx.fillStyle = C.ink;
  ctx.fill();

  burst(ctx, cx, cy, 190, 168, 28);
  ctx.fillStyle = C.red;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = C.ink;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 138, 0, Math.PI * 2);
  ctx.fillStyle = C.gold;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 112, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.setLineDash([2, 10]);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = C.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `400 62px ${fonts.display}`;
  ctx.fillText('SEM', cx, cy - 26);
  ctx.fillStyle = C.redDark;
  ctx.fillText('MIMIMI', cx, cy + 34);

  ctx.fillStyle = C.ink;
  ctx.font = `600 19px ${fonts.mono}`;
  textOnArc(ctx, '★ TURMA ★', cx, cy, 98, -Math.PI / 2 + 0, 6);
  textOnArc(ctx, 'QUARTA E SEXTA', cx, cy, 98 + 14, Math.PI / 2, 5);
  ctx.restore();
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{nome:string, titulo:'leitor'|'embaixador'|'apoiador', genero:'m'|'f', dataStr:string, codigo:string}} opts
 * @param {{display:string, body:string, mono:string}} fonts
 */
export function drawCertificate(canvas, opts, fonts) {
  const { titulo = 'leitor', genero = 'm', dataStr, codigo } = opts;
  const nome = (opts.nome || '').trim().replace(/\s+/g, ' ').toUpperCase() || 'SEU NOME AQUI';
  const t = TITULOS[titulo] || TITULOS.leitor;
  const cargo = t[genero] || t.m;

  canvas.width = CERT_W;
  canvas.height = CERT_H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, CERT_W, CERT_H);

  // ---- fundo de papel ----
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, CERT_W, CERT_H);

  // pontilhado discreto no papel inteiro
  ctx.fillStyle = 'rgba(229,50,45,0.10)';
  for (let y = 20; y < CERT_H; y += 26) {
    for (let x = ((y / 26) % 2) * 13 + 10; x < CERT_W; x += 26) {
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- moldura ----
  const m = 64;
  // sombra deslocada
  ctx.fillStyle = C.ink;
  ctx.fillRect(m + 14, m + 14, CERT_W - m * 2, CERT_H - m * 2);
  // folha
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(m, m, CERT_W - m * 2, CERT_H - m * 2);
  ctx.lineWidth = 12;
  ctx.strokeStyle = C.ink;
  ctx.strokeRect(m, m, CERT_W - m * 2, CERT_H - m * 2);
  // filete interno
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.strokeRect(m + 34, m + 34, CERT_W - (m + 34) * 2, CERT_H - (m + 34) * 2);
  ctx.setLineDash([]);

  // pontos de quadrinho nos cantos
  drawHalftone(ctx, m + 6, m + 6, 520, 520, 'rgba(229,50,45,0.55)', 22, 8);
  ctx.save();
  ctx.translate(CERT_W, CERT_H);
  ctx.rotate(Math.PI);
  drawHalftone(ctx, m + 6, m + 6, 520, 520, 'rgba(31,95,209,0.45)', 22, 8);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const cx = CERT_W / 2;

  // ---- cabeçalho ----
  ctx.fillStyle = C.teal;
  const tagW = 560;
  const tagH = 58;
  ctx.save();
  ctx.translate(cx, 214);
  ctx.rotate((-1.5 * Math.PI) / 180);
  ctx.fillStyle = C.ink;
  ctx.fillRect(-tagW / 2 + 6, -tagH / 2 + 6, tagW, tagH);
  ctx.fillStyle = C.teal;
  ctx.fillRect(-tagW / 2, -tagH / 2, tagW, tagH);
  ctx.lineWidth = 4;
  ctx.strokeStyle = C.ink;
  ctx.strokeRect(-tagW / 2, -tagH / 2, tagW, tagH);
  ctx.fillStyle = C.paper;
  ctx.font = `600 26px ${fonts.mono}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('TURMA SEM MIMIMI · QUARTA E SEXTA', 0, 2);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';

  // título gigante com sombra de quadrinho
  fitFont(ctx, 'CERTIFICADO', 250, fonts.display, CERT_W - 260);
  ctx.fillStyle = C.ink;
  ctx.fillText('CERTIFICADO', cx + 10, 520 + 10);
  ctx.fillStyle = C.red;
  ctx.fillText('CERTIFICADO', cx, 520);
  ctx.lineWidth = 7;
  ctx.strokeStyle = C.ink;
  ctx.lineJoin = 'round';
  ctx.strokeText('CERTIFICADO', cx, 520);

  fitFont(ctx, 'DE QUEM LÊ BRASÍLIA SEM PANO QUENTE', 74, fonts.display, CERT_W - 340);
  ctx.fillStyle = C.ink;
  ctx.fillText('DE QUEM LÊ BRASÍLIA SEM PANO QUENTE', cx, 626);

  // linha dupla
  ctx.fillStyle = C.ink;
  ctx.fillRect(210, 668, CERT_W - 420, 6);
  ctx.fillRect(210, 684, CERT_W - 420, 2);

  // ---- corpo ----
  ctx.fillStyle = C.dim;
  ctx.font = `italic 400 46px ${fonts.body}`;
  ctx.fillText('Num país de manchete mastigada, alguém precisava dizer:', cx, 800);
  ctx.fillText('quem lê o que está por trás da notícia merece ser reconhecido.', cx, 864);

  ctx.font = `italic 400 52px ${fonts.body}`;
  ctx.fillStyle = C.ink;
  ctx.fillText('Por isso, com todas as letras e nenhum mimimi, declaramos que', cx, 990);

  // faixa amarela de marca-texto atrás do nome
  const maxNameW = CERT_W - 420;
  let size = 150;
  ctx.font = `400 ${size}px ${fonts.display}`;
  while (ctx.measureText(nome).width > maxNameW && size > 54) {
    size -= 4;
    ctx.font = `400 ${size}px ${fonts.display}`;
  }
  const nameW = ctx.measureText(nome).width;
  const bandH = size * 1.02;
  const nameY = 1190;
  ctx.save();
  ctx.translate(cx, nameY - size * 0.36);
  ctx.rotate((-1 * Math.PI) / 180);
  ctx.fillStyle = C.ink;
  ctx.fillRect(-nameW / 2 - 40 + 8, -bandH / 2 + 8, nameW + 80, bandH);
  ctx.fillStyle = C.gold;
  ctx.fillRect(-nameW / 2 - 40, -bandH / 2, nameW + 80, bandH);
  ctx.lineWidth = 5;
  ctx.strokeStyle = C.ink;
  ctx.strokeRect(-nameW / 2 - 40, -bandH / 2, nameW + 80, bandH);
  ctx.restore();
  ctx.fillStyle = C.ink;
  ctx.textBaseline = 'middle';
  ctx.fillText(nome, cx, nameY - size * 0.36);
  ctx.textBaseline = 'alphabetic';

  // cargo / identidade (substantivo, não verbo)
  ctx.textAlign = 'left';
  const cargoTxt = `${cargo} DA TURMA SEM MIMIMI`;
  ctx.font = `400 64px ${fonts.display}`;
  fitFont(ctx, cargoTxt, 64, fonts.display, CERT_W - 480);
  const cargoW = ctx.measureText(cargoTxt).width;
  const startX = cx - (cargoW + 70) / 2 + 70;
  ctx.fillStyle = C.ink;
  ctx.fillText('é', startX - 70, 1338);
  ctx.fillStyle = C.redDark;
  ctx.fillText(cargoTxt, startX, 1338);
  ctx.textAlign = 'center';

  // parágrafo
  ctx.fillStyle = C.ink;
  ctx.font = `400 43px ${fonts.body}`;
  const paragrafo =
    `Gente que ${t.verbo} o contexto antes de repetir a opinião dos outros. ` +
    'Que não aceita resumo que protege alguém. ' +
    'Que sabe que informação boa dá trabalho — e faz o trabalho.';
  const lines = wrapLines(ctx, paragrafo, CERT_W - 480);
  lines.forEach((ln, i) => ctx.fillText(ln, cx, 1450 + i * 66));

  ctx.font = `italic 700 46px ${fonts.body}`;
  ctx.fillStyle = C.teal;
  ctx.fillText('Você não está sozinho(a). Tem muita gente do seu lado.', cx, 1450 + lines.length * 66 + 52);

  // data
  ctx.font = `600 30px ${fonts.mono}`;
  ctx.fillStyle = C.dim;
  ctx.fillText(`Brasília, ${dataStr}`.toUpperCase(), cx, 1790);

  // ---- selo + assinatura coletiva ----
  drawSeal(ctx, cx, 2030, fonts);

  // linha de "assinatura" da turma (esquerda)
  ctx.fillStyle = C.ink;
  ctx.fillRect(190, 2110, 380, 4);
  ctx.font = `400 34px ${fonts.display}`;
  ctx.fillText('A TURMA', 190 + 190, 2160);
  ctx.font = `600 20px ${fonts.mono}`;
  ctx.fillStyle = C.dim;
  ctx.fillText('QUEM LÊ, SABE', 190 + 190, 2192);

  // linha do leitor (direita)
  ctx.fillStyle = C.ink;
  ctx.fillRect(CERT_W - 570, 2110, 380, 4);
  ctx.font = `400 34px ${fonts.display}`;
  ctx.fillText(cargo, CERT_W - 380, 2160);
  ctx.font = `600 20px ${fonts.mono}`;
  ctx.fillStyle = C.dim;
  ctx.fillText('ORGULHO DE ESTAR AQUI', CERT_W - 380, 2192);

  // rodapé honesto
  ctx.fillStyle = C.dim;
  ctx.font = `600 19px ${fonts.mono}`;
  ctx.textAlign = 'left';
  ctx.fillText(`CÓDIGO ${codigo}`, 130, 2262);
  ctx.textAlign = 'right';
  ctx.fillText('CERTIFICADO SIMBÓLICO DE COMUNIDADE · SEM VALOR OFICIAL', CERT_W - 130, 2262);
  ctx.textAlign = 'center';
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
