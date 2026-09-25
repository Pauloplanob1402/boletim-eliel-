// Gerador de "Pix Copia e Cola" (BR Code / EMV MPM estático) — SEM depender de
// nenhum gateway, biblioteca de pagamento ou credencial. É só formatação de
// texto (padrão TLV) seguindo o Manual do BR Code e o Manual de Padrões para
// Iniciação do Pix, ambos do Banco Central — a mesma string que o app do banco
// mostra quando você pede "copiar código Pix" pra receber.
//
// Usado em /admin/receitas para o botão "Copiar Pix" do repasse mensal
// (60/20/20) — ver pages/admin/receitas.js e api/admin/revenue-payout.js.
//
// IMPORTANTE — isto gera um Pix ESTÁTICO (valor fixo, sem confirmação
// automática de pagamento). Depois de pagar, é o admin quem clica em
// "Marcar como repassado" — não existe webhook nem conciliação automática
// pra esse tipo de Pix (só existiria com Pix dinâmico via API de um PSP, o
// que não se justifica aqui pra um repasse interno mensal entre 3 pessoas).
//
// Três detalhes que quebram um Pix "de aparência válida" sem erro nenhum,
// então valem o comentário:
//  1. A GUI do arranjo (`br.gov.bcb.pix`) — usamos maiúsculo
//     (`BR.GOV.BCB.PIX`); testes públicos mostram bancos que só aceitam
//     assim, mesmo o manual do BC exibindo minúsculo nos exemplos.
//  2. A chave Pix precisa estar EXATAMENTE no formato que o DICT guarda
//     (telefone com +55 e sem pontuação, CPF/CNPJ só dígitos, e-mail
//     minúsculo) — por isso normalizePixKey() abaixo, por tipo.
//  3. O campo raiz `01` (Point of Initiation Method) fica de fora de
//     propósito: é o valor certo para Pix estático (omitir ou mandar "11";
//     nunca "12", que é para QR dinâmico).

const GUI_PIX = 'BR.GOV.BCB.PIX';

function tlv(id, value) {
  const str = String(value);
  return `${id}${String(str.length).padStart(2, '0')}${str}`;
}

// CRC-16/CCITT-FALSE — poli 0x1021, init 0xFFFF, sem reflexão, sem XOR final.
// Vetor de teste canônico: crc16ccitt('123456789') === '29B1'.
function crc16ccitt(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Nome/cidade no payload Pix são ASCII maiúsculo sem acento, com limite de
// tamanho — "João Cão" precisa virar "JOAO CAO", senão o payload "parece" ok
// (CRC fecha) mas o banco recusa.
function sanitizeAscii(text, maxLen, fallback) {
  const cleaned = (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^\x20-\x7e]/g, '') // só ASCII imprimível
    .trim()
    .toUpperCase();
  const result = cleaned.slice(0, maxLen);
  return result || fallback;
}

const PIX_KEY_TYPES = ['cpf', 'cnpj', 'email', 'telefone', 'aleatoria'];

/**
 * Normaliza a chave Pix para o formato exato que o DICT (diretório de
 * chaves do Banco Central) espera. O tipo precisa ser informado —
 * adivinhar o tipo pelo formato é arriscado (um CPF e um telefone sem DDI
 * têm o mesmo tanto de dígitos).
 *
 * @returns {string} chave normalizada
 * @throws {Error} se a chave não bater com o formato esperado do tipo
 */
export function normalizePixKey(rawKey, keyType) {
  const key = (rawKey || '').trim();
  if (!key) throw new Error('Chave Pix vazia.');
  if (!PIX_KEY_TYPES.includes(keyType)) {
    throw new Error(`Tipo de chave Pix inválido: ${keyType}`);
  }

  if (keyType === 'cpf') {
    const digits = key.replace(/\D/g, '');
    if (digits.length !== 11) throw new Error('CPF precisa ter 11 dígitos.');
    return digits;
  }

  if (keyType === 'cnpj') {
    const digits = key.replace(/\D/g, '');
    if (digits.length !== 14) throw new Error('CNPJ precisa ter 14 dígitos.');
    return digits;
  }

  if (keyType === 'email') {
    const email = key.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('E-mail de chave Pix inválido.');
    return email;
  }

  if (keyType === 'telefone') {
    let digits = key.replace(/\D/g, '');
    // Remove um "55" de DDI já presente antes de recolocar, para não
    // duplicar (ex.: usuário já digitou "55" na frente).
    if (digits.length === 12 || digits.length === 13) {
      if (digits.startsWith('55')) digits = digits.slice(2);
    }
    if (digits.length !== 10 && digits.length !== 11) {
      throw new Error('Telefone de chave Pix precisa ter DDD + número (10 ou 11 dígitos).');
    }
    return `+55${digits}`;
  }

  // aleatoria (EVP) — é um UUID, minúsculo, como o Pix gerou.
  const evp = key.toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(evp)) {
    throw new Error('Chave aleatória (EVP) precisa ser um UUID válido.');
  }
  return evp;
}

/**
 * Monta o payload "Pix Copia e Cola" (BR Code estático).
 *
 * @param {object} params
 * @param {string} params.pixKey - chave já normalizada (ver normalizePixKey)
 * @param {number} params.amount - valor em reais (ex.: 132.40)
 * @param {string} params.recipientName - nome de quem recebe (aparece no app de quem paga)
 * @param {string} [params.city] - cidade de quem recebe (default "BRASILIA")
 * @param {string} [params.txId] - identificador da transação (default "***", a convenção
 *   do Manual de Padrões quando não há um identificador específico)
 * @returns {string} o payload completo, pronto pra copiar/colar ou virar QR Code
 */
export function buildPixPayload({ pixKey, amount, recipientName, city = 'BRASILIA', txId }) {
  if (!pixKey) throw new Error('pixKey é obrigatório.');
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error('amount precisa ser um número maior que zero.');

  const merchantAccountInfo = tlv('00', GUI_PIX) + tlv('01', pixKey);
  const additionalData = tlv('05', sanitizeAscii(txId, 25, '***').replace(/[^A-Z0-9]/g, '') || '***');

  const payloadSemCrc =
    tlv('26', merchantAccountInfo) + // Merchant Account Info (Pix) — campo raiz "00" fica de fora de propósito, ver comentário no topo do arquivo
    tlv('52', '0000') + // Merchant Category Code — 0000 = não informado
    tlv('53', '986') + // moeda — 986 = BRL (ISO 4217)
    tlv('54', value.toFixed(2)) + // valor — sempre ponto decimal, nunca vírgula
    tlv('58', 'BR') +
    tlv('59', sanitizeAscii(recipientName, 25, 'RECEBEDOR')) +
    tlv('60', sanitizeAscii(city, 15, 'BRASILIA')) +
    tlv('62', additionalData);

  const comPayloadFormatIndicator = tlv('00', '01') + payloadSemCrc + '6304';
  return comPayloadFormatIndicator + crc16ccitt(comPayloadFormatIndicator);
}

export { PIX_KEY_TYPES };
