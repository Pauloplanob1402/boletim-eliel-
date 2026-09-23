import SiteLayout from '../components/SiteLayout';

export default function PoliticaDePrivacidade() {
  return (
    <SiteLayout title="Política de Privacidade — Sem Mimimi" description="Como o Sem Mimimi trata os dados dos seus assinantes.">
      <section className="tight">
        <div className="wrap" style={{ maxWidth: 720 }}>
          <span className="eyebrow">LGPD</span>
          <h1 style={{ fontSize: '2rem' }}>Política de Privacidade</h1>
          <div style={{ color: 'var(--dim)', lineHeight: 1.7 }}>
            <h3>Quais dados coletamos</h3>
            <p>Nome, e-mail, telefone (opcional) e dados de pagamento processados diretamente
            pelo Mercado Pago — nunca armazenamos número de cartão.</p>
            <h3>Para que usamos</h3>
            <p>Para processar sua assinatura, enviar as newsletters e, quando aplicável,
            comunicar mudanças no serviço.</p>
            <h3>Com quem compartilhamos</h3>
            <p>Mercado Pago (pagamento), Supabase (banco de dados) e Sender (envio de e-mail) —
            cada um só recebe o mínimo de dado necessário para sua função.</p>
            <h3>Seus direitos</h3>
            <p>Você pode pedir a exclusão dos seus dados, corrigir informações incorretas ou
            cancelar o recebimento de e-mails a qualquer momento, pelo link de descadastro em
            cada newsletter ou em <a href="/minha-conta">Minha Conta</a>.</p>
            <h3>Contato</h3>
            <p>Dúvidas sobre seus dados podem ser enviadas para o e-mail de suporte informado no
            rodapé das newsletters.</p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
