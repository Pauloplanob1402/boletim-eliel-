// Utilidades dos códigos de certificado (só servidor).
import { randomInt } from 'crypto';

// Sem 0/O/1/I/L para ninguém errar ao digitar um código recebido por WhatsApp.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const TITULOS_VALIDOS = ['leitor', 'embaixador', 'apoiador'];

export function gerarCodigo() {
  let s = '';
  for (let i = 0; i < 8; i++) s += ALFABETO[randomInt(ALFABETO.length)];
  return `SM-${s.slice(0, 4)}-${s.slice(4)}`;
}

// Aceita "sm-abcd-efgh", "SMABCDEFGH", com espaços etc. Devolve "SM-ABCD-EFGH" ou null.
export function normalizarCodigo(raw) {
  const limpo = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const m = limpo.match(/^SM([A-Z0-9]{8})$/);
  if (!m) return null;
  return `SM-${m[1].slice(0, 4)}-${m[1].slice(4)}`;
}

// Freio simples contra quem tenta adivinhar códigos (por IP, em memória; melhor esforço).
const tentativas = new Map();
export function limiteExcedido(ip) {
  const agora = Date.now();
  const janela = 10 * 60 * 1000;
  const lista = (tentativas.get(ip) || []).filter((t) => agora - t < janela);
  tentativas.set(ip, lista);
  return lista.length >= 12;
}
export function registrarFalha(ip) {
  const lista = tentativas.get(ip) || [];
  lista.push(Date.now());
  tentativas.set(ip, lista);
}
export function ipDe(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'x').split(',')[0].trim();
}
