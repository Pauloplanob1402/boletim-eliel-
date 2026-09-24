import { useState } from 'react';
import { useRouter } from 'next/router';
import SiteLayout from '../components/SiteLayout';
import { createAdminClient } from '../lib/supabase/adminClient';

const DIAS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

export async function getServerSideProps() {
  let subscriberCount = 0;
  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');
    subscriberCount = count || 0;
  } catch (err) {
    console.error('Falha ao buscar contagem de assinantes:', err.message);
  }
  return { props: { subscriberCount } };
}

export default function AssinarPage({ subscriberCount }) {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: '',
    email: '',
    plano: 'anual',
    preferredDay: 'terça',
    aceitaTermos: false,
    querNewsletter: true,
    isGift: false,
    giftRecipientName: '',
    giftRecipientEmail: '',
    giftMessage: '',
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
      setError(form.isGift ? 'Preencha seu nome e seu e-mail (quem paga) para continuar.' : 'Preencha nome e e-mail para continuar.');
      return;
    }
    if (form.isGift && (!form.giftRecipientName.trim() || !form.giftRecipientEmail.trim())) {
      setError('Preencha o nome e o e-mail de quem vai receber o presente.');
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
          {subscriberCount > 0 && (
            <span
              style={{
                display: 'inline-block',
                fontFamily: 'var(--mono)',
                fontSize: '.78rem',
                letterSpacing: '.04em',
                textTransform: 'uppercase',
                color: 'var(--dim)',
                border: '1px solid var(--line)',
                padding: '8px 16px',
                marginTop: 6,
              }}
            >
              Junte-se a +{subscriberCount} leitores que não aceitam mimimi
            </span>
          )}
        </div>
      </section>

      <section className="tight">
        <div className="wrap">
          <form onSubmit={handleSubmit}>
            <div className="plans" style={{ marginBottom: 20, gridTemplateColumns: '1fr 1fr', maxWidth: 480 }}>
              <label
                className="plan-card"
                style={{ cursor: 'pointer', padding: '18px 20px', borderColor: !form.isGift ? 'var(--red)' : undefined }}
              >
                <input type="radio" name="paraQuem" checked={!form.isGift} onChange={() => update('isGift', false)} style={{ display: 'none' }} />
                <h3 style={{ fontSize: '1rem' }}>Para mim</h3>
              </label>
              <label
                className="plan-card"
                style={{ cursor: 'pointer', padding: '18px 20px', borderColor: form.isGift ? 'var(--red)' : undefined }}
              >
                <input type="radio" name="paraQuem" checked={form.isGift} onChange={() => update('isGift', true)} style={{ display: 'none' }} />
                <h3 style={{ fontSize: '1rem' }}>🎁 De presente</h3>
              </label>
            </div>

            {form.isGift && (
              <div style={{ maxWidth: 520, marginBottom: 32, border: '1px solid var(--line)', background: 'var(--bg2)', padding: 24 }}>
                <p className="lede" style={{ fontSize: '.95rem', marginBottom: 18 }}>
                  Cliente, amigo, esposa, marido, sócio — se você sabe que essa pessoa curte o que o Pavinatto
                  aborda e como ele aborda, é só preencher abaixo. Quem paga é você (nos campos mais abaixo); quem
                  recebe as edições é quem você indicar aqui.
                </p>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="gift-nome">Nome de quem vai receber</label>
                    <input
                      id="gift-nome"
                      type="text"
                      value={form.giftRecipientName}
                      onChange={(e) => update('giftRecipientName', e.target.value)}
                      placeholder="Nome do presenteado"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="gift-email">E-mail de quem vai receber</label>
                    <input
                      id="gift-email"
                      type="email"
                      value={form.giftRecipientEmail}
                      onChange={(e) => update('giftRecipientEmail', e.target.value)}
                      placeholder="email-do-presenteado@..."
                    />
                  </div>
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="gift-msg">Uma mensagem (opcional)</label>
                  <textarea
                    id="gift-msg"
                    rows={2}
                    value={form.giftMessage}
                    onChange={(e) => update('giftMessage', e.target.value)}
                    placeholder="Vai junto no e-mail de aviso do presente"
                  />
                </div>
              </div>
            )}

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
                  <li>Duas edições por semana, no dia que você escolher</li>
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
              {form.isGift && (
                <div className="trust-note" style={{ marginBottom: 14 }}>
                  Agora os seus dados — quem está pagando o presente e vai receber o recibo.
                </div>
              )}
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="nome">{form.isGift ? 'Seu nome' : 'Nome'}</label>
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
                  <label htmlFor="email">{form.isGift ? 'Seu e-mail' : 'E-mail'}</label>
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

              {!form.isGift && (
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
              )}

              {!form.isGift && (
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
              )}

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
                {loading
                  ? 'Preparando checkout…'
                  : form.isGift
                  ? `Presentear — Plano ${form.plano === 'anual' ? 'Anual' : 'Mensal'}`
                  : `Ir para o pagamento — Plano ${form.plano === 'anual' ? 'Anual' : 'Mensal'}`}
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
                Só duas vezes por semana, sempre no dia que você escolher no cadastro. Nada de
                &quot;edição bônus&quot; toda hora lotando sua caixa de entrada.
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
