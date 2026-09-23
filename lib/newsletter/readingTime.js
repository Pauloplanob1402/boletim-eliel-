// Estima o tempo de leitura a partir do HTML do corpo da newsletter.
// Regra simples e comum de mercado: ~200 palavras por minuto, arredondado
// para cima e com piso de 1 minuto (nunca mostra "0 min").
export function estimateReadingMinutes(html) {
  const text = (html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
