// Personalização da newsletter: substitui {{nome}} e {{email}} pelos dados reais
// do assinante antes do envio. Nunca deixa a variável "vazando" no e-mail final.

export function renderNewsletter(template, subscriber) {
  if (!template) return '';

  const nome = (subscriber?.nome || '').trim();
  const email = subscriber?.email || '';

  let output = template.replace(/\{\{\s*nome\s*\}\}/gi, nome);
  output = output.replace(/\{\{\s*email\s*\}\}/gi, email);

  // Limpa saudações que ficariam estranhas sem nome: "Olá, ." -> "Olá."
  output = output.replace(/Olá,\s*\./gi, 'Olá.');
  output = output.replace(/Ol\u00e1,\s*,/gi, 'Olá,');
  // Remove qualquer variável não reconhecida que tenha sobrado, por segurança.
  output = output.replace(/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/g, '');

  return output;
}

/**
 * Para ENVIOS EM MASSA (campanha para um grupo inteiro), não é viável nem
 * eficiente chamar a API da Sender uma vez por assinante só para personalizar
 * o nome. Em vez disso, convertemos {{nome}}/{{email}} para o campo
 * personalizado equivalente na Sender ({$nome}/{$email}), e é a própria Sender
 * quem faz a substituição por destinatário no momento do envio da campanha.
 *
 * Pré-requisito: ao cadastrar/atualizar o assinante na Sender (ver
 * lib/sender/client.js -> upsertSubscriber), o nome é salvo no campo
 * personalizado "nome" — por isso o merge tag usado aqui é "{$nome}".
 *
 * CONFIGURAR/VERIFICAR: a sintaxe exata de merge tag de campo personalizado
 * ({$campo}) foi confirmada na documentação da Sender para POST /v2/subscribers
 * (parâmetro "fields"); confirme no painel da Sender, ao montar uma campanha,
 * que o mesmo texto "{$nome}" é reconhecido e substituído — se o nome do campo
 * ficar diferente lá, ajuste aqui.
 */
export function toSenderMergeTags(template) {
  if (!template) return '';
  return template
    .replace(/\{\{\s*nome\s*\}\}/gi, '{$nome}')
    .replace(/\{\{\s*email\s*\}\}/gi, '{$email}');
}
