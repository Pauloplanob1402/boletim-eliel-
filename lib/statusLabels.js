// Rótulos em português para os status que o banco guarda em inglês.
// Só muda o que aparece na tela — os valores no banco continuam iguais.
const NEWSLETTER = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  sending: 'Enviando',
  sent: 'Enviada',
  failed: 'Falhou',
};

const SUBSCRIPTION = {
  pending: 'Pendente',
  authorized: 'Autorizada',
  active: 'Ativa',
  paused: 'Pausada',
  canceled: 'Cancelada',
  cancelled: 'Cancelada',
  expired: 'Expirada',
  rejected: 'Recusada',
};

const PAYMENT = {
  approved: 'Aprovado',
  pending: 'Pendente',
  in_process: 'Em análise',
  rejected: 'Recusado',
  refunded: 'Reembolsado',
  cancelled: 'Cancelado',
  canceled: 'Cancelado',
  charged_back: 'Estornado',
};

const SUBSCRIBER = {
  active: 'Ativo',
  inactive: 'Inativo',
  pending: 'Pendente',
  unsubscribed: 'Descadastrado',
};

const pick = (map) => (value) => map[value] || value;

export const newsletterStatusLabel = pick(NEWSLETTER);
export const subscriptionStatusLabel = pick(SUBSCRIPTION);
export const paymentStatusLabel = pick(PAYMENT);
export const subscriberStatusLabel = pick(SUBSCRIBER);
