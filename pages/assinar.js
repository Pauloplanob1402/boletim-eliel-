import { useState } from 'react';
import { useRouter } from 'next/router';
import SiteLayout from '../components/SiteLayout';

const DIAS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

export default function AssinarPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: '',
    email: '',
    plano: 'anual',
    preferredDay: 'terça',
    aceitaTermos: false,
    querNewsletter: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.nome.trim() || !form.email.trim()) {
      setError('Preencha nome e e-mail para continuar.');
      return;
    }
    if (!form.aceitaTermos) {
      setError('Você precisa aceitar os Termos de Uso e a Política de Privacidade para assinar.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Não foi possível iniciar a assinatura. Tente novamente.');
        setLoading(false);
        return;
      }

      // O usuário só é considerado ativo depois que o webhook do Mercado Pago
      // confirmar o pagamento no servidor — este redirect apenas leva o
      // visitante ao checkout, não ativa nada por si só.
      window.location.href = data.init_point;
    } catch (err) {
      setError('Erro de conexão. Tente novamente em instantes.');
      setLoading(false);
    }
  }

  return (
    <SiteLayout
      title="Assinar — Sem Mimimi"
      description="Assine a newsletter Sem Mimimi, de Tiago Pavinatto. Duas edições por semana, sem pano quente."
      active="assinar"
    >
      <section className="tight">
        <div className="wrap">
          <span className="eyebrow">Última etapa</span>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,2.8rem)', maxWidth: '18ch' }}>
            Escolha como quer receber a verdade sem filtro
          </h1>
          <p className="lede">
            Você já viu uma edição inteira. Sabe o tom, sabe o nível de detalhe. Agora é só
            decidir a frequência do plano e os seus dados de assinante.
          </p>
        </div>
      </section>

      <section className="tight">
        <div className="wrap">
          <form onSubmit={handleSubmit}>
            <div className="plans" style={{ marginBottom: 36 }}>
              <label className="plan-card" style={{ cursor: 'pointer', borderColor: form.plano === 'mensal' ? 'var(--red)' : undefined }}>
                <input
                  type="radio"
                  name="plano"
                  value="mensal"
                  checked={form.plano === 'mensal'}
                  onChange={() => update('plano', 'mensal')}
                  style={{ display: 'none' }}
                />
                <h3>Plano Mensal</h3>
                <div className="price">
                  R$ <span>22,00</span>
                </div>
                <div className="per">por mês · cancele quando quiser</div>
                <ul>
                  <li>Duas edições por semana (terça e quinta)</li>
                  <li>Acesso ao arquivo de edições anteriores</li>
                  <li>Sem anúncio, sem patrocínio disfarçado de matéria</li>
                </ul>
                <span className={`btn ${form.plano === 'mensal' ? '' : 'ghost'} block`}>
                  {form.plano === 'mensal' ? 'Selecionado ✓' : 'Escolher plano mensal'}
                </span>
              </label>

              <label className="plan-card featured" style={{ cursor: 'pointer' }}>
                <span className="ribbon">Sai mais em conta</span>
                <input
                  type="radio"
                  name="plano"
                  value="anual"
                  checked={form.plano === 'anual'}
                  onChange={() => update('plano', 'anual')}
                  style={{ display: 'none' }}
                />
                <h3>Plano Anual</h3>
                <div className="price">
                  R$ <span>220</span>
                </div>
                <div className="per">
                  por ano · equivale a <span>R$18,33</span>/mês
                </div>
                <ul>
                  <li>
                    <strong>Tudo</strong> do plano mensal
                  </li>
                  <li>Preço travado por 12 meses, mesmo se o valor subir</li>
                  <li>Prioridade nas próximas edições especiais</li>
                </ul>
                <span className="btn block">
                  {form.plano === 'anual' ? 'Selecionado ✓' : 'Escolher plano anual'}
                </span>
              </label>
            </div>

            <div style={{ maxWidth: 520 }}>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="nome">Nome</label>
                  <input
                    id="nome"
                    type="text"
                    value={form.nome}
                    onChange={(e) => update('nome', e.target.value)}
                    placeholder="Como podemos te chamar"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="email">E-mail</label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="voce@email.com"
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="dia">Quando você quer receber sua newsletter?</label>
                <select id="dia" value={form.preferredDay} onChange={(e) => update('preferredDay', e.target.value)}>
                  {DIAS.map((d) => (
                    <option key={d} value={d}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="newsletter-optin"
                  checked={form.querNewsletter}
                  onChange={(e) => update('querNewsletter', e.target.checked)}
                />
                <label htmlFor="newsletter-optin" style={{ margin: 0, textTransform: 'none', fontFamily: 'var(--body)' }}>
                  Quero receber a newsletter por e-mail.
                </label>
              </div>

              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="termos"
                  checked={form.aceitaTermos}
                  onChange={(e) => update('aceitaTermos', e.target.checked)}
                  required
                />
                <label htmlFor="termos" style={{ margin: 0, textTransform: 'none', fontFamily: 'var(--body)' }}>
                  Li e concordo com os{' '}
                  <a href="/termos-de-uso" style={{ textDecoration: 'underline' }}>
                    Termos de Uso
                  </a>{' '}
                  e a{' '}
                  <a href="/politica-de-privacidade" style={{ textDecoration: 'underline' }}>
                    Política de Privacidade
                  </a>
                  .
                </label>
              </div>

              {error && <div className="admin-alert error">{error}</div>}

              <button type="submit" className="btn block" disabled={loading}>
                {loading ? 'Preparando checkout…' : `Ir para o pagamento — Plano ${form.plano === 'anual' ? 'Anual' : 'Mensal'}`}
              </button>
              <div className="trust-note" style={{ marginTop: 14 }}>
                Você será redirecionado ao Mercado Pago para concluir o pagamento com segurança.
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="tight">
        <div className="wrap">
          <span className="eyebrow">Antes de fechar</span>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 20 }}>
            As perguntas que você provavelmente está se fazendo agora
          </h2>
          <dl>
            <div className="faq-item">
              <dt>&quot;Será que vale mesmo pagar por isso?&quot;</dt>
              <dd>
                É justo pensar assim — a internet te acostumou a achar que informação devia ser
                sempre grátis. Mas você já viu o nível da edição de exemplo: é o tempo que o
                Pavinatto gasta apurando, não um resumo de outro site. Isso tem custo pra fazer, e
                é por isso que não é patrocinado por quem está sendo criticado ali dentro.
              </dd>
            </div>
            <div className="faq-item">
              <dt>&quot;E se eu assinar e não gostar?&quot;</dt>
              <dd>
                Cancele quando quiser, direto no link que vem em todo e-mail ou na sua página{' '}
                <a href="/minha-conta">Minha Conta</a>. Sem ligação de retenção, sem formulário de
                10 perguntas.
              </dd>
            </div>
            <div className="faq-item">
              <dt>&quot;Vou receber spam ou e-mail todo dia?&quot;</dt>
              <dd>
                Só terça e quinta. Duas vezes por semana, sempre. Nada de &quot;edição bônus&quot;
                toda hora lotando sua caixa de entrada.
              </dd>
            </div>
            <div className="faq-item">
              <dt>&quot;Por que não é grátis, se é só uma newsletter?&quot;</dt>
              <dd>
                Porque grátis, no fim, sempre tem alguém pagando a conta — e geralmente é um
                patrocinador que não pode ser criticado. Aqui quem paga a conta é o assinante, e é
                por isso que ninguém aqui dentro está de mãos atadas.
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </SiteLayout>
  );
}
