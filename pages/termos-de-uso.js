import SiteLayout from '../components/SiteLayout';

export default function TermosDeUso() {
  return (
    <SiteLayout title="Termos de Uso — Sem Mimimi" description="Termos de uso da newsletter Sem Mimimi.">
      <section className="tight">
        <div className="wrap" style={{ maxWidth: 720 }}>
          <span className="eyebrow">Termos de Uso</span>
          <h1 style={{ fontSize: '2rem' }}>Termos de Uso</h1>
          <p className="lede">
            Estes Termos regulam o uso do site e da newsletter Sem Mimimi. Ao assinar, você
            concorda com as condições abaixo.
          </p>
          <div style={{ color: 'var(--dim)', lineHeight: 1.7 }}>
            <h3>1. O serviço</h3>
            <p>O Sem Mimimi é uma newsletter paga, enviada por e-mail duas vezes por semana, com
            conteúdo de análise e opinião de autoria de Tiago Pavinatto.</p>
            <h3>2. Assinatura e cobrança</h3>
            <p>A assinatura é recorrente (mensal ou anual) e processada pelo Mercado Pago. O
            valor é cobrado automaticamente até que a assinatura seja cancelada.</p>
            <h3>3. Cancelamento</h3>
            <p>Você pode cancelar a qualquer momento em <a href="/minha-conta">Minha Conta</a> ou
            pelo link presente em todo e-mail. O acesso permanece ativo até o fim do período já
            pago — ver <a href="/politica-de-cancelamento">Política de Cancelamento</a>.</p>
            <h3>4. Conteúdo</h3>
            <p>O conteúdo publicado reflete a opinião do autor e não constitui aconselhamento
            jurídico, financeiro ou de qualquer natureza profissional.</p>
            <h3>5. Alterações</h3>
            <p>Estes termos podem ser atualizados; mudanças relevantes serão comunicadas por
            e-mail aos assinantes ativos.</p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
