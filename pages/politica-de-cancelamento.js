import SiteLayout from '../components/SiteLayout';

export default function PoliticaDeCancelamento() {
  return (
    <SiteLayout title="Política de Cancelamento — Sem Mimimi" description="Como funciona o cancelamento da assinatura do Sem Mimimi.">
      <section className="tight">
        <div className="wrap" style={{ maxWidth: 720 }}>
          <span className="eyebrow">Sem multa, sem fidelidade</span>
          <h1 style={{ fontSize: '2rem' }}>Política de Cancelamento</h1>
          <div style={{ color: 'var(--dim)', lineHeight: 1.7 }}>
            <p>Você pode cancelar sua assinatura a qualquer momento, direto em{' '}
            <a href="/minha-conta">Minha Conta</a>. Não há multa nem período mínimo de
            permanência.</p>
            <p>Ao cancelar, a cobrança recorrente é interrompida no Mercado Pago, mas você
            continua com acesso até o fim do ciclo já pago (mês ou ano vigente).</p>
            <p>Seu histórico de pagamentos é mantido para fins contábeis e fiscais — apenas o
            status da assinatura muda para &quot;cancelada&quot;.</p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
