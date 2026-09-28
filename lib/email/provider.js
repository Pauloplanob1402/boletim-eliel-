// Escolhe o provedor de e-mail em tempo de execução, pela variável EMAIL_PROVIDER:
//   EMAIL_PROVIDER=sender  (padrão)  -> lib/sender/client.js
//   EMAIL_PROVIDER=brevo             -> lib/email/brevo.js
// Para trocar de provedor basta mudar a variável na Vercel e fazer Redeploy.
import { emailProvider as senderProvider } from '../sender/client';
import { emailProvider as brevoProvider } from './brevo';

export function getEmailProvider() {
  const name = (process.env.EMAIL_PROVIDER || 'sender').trim().toLowerCase();
  return name === 'brevo' ? brevoProvider : senderProvider;
}

// Mantém a API antiga (`emailProvider.sendWelcome(...)`, etc.) para o resto do código.
export const emailProvider = new Proxy(
  {},
  {
    get(_target, prop) {
      return getEmailProvider()[prop];
    },
  }
);
