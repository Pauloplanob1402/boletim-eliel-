import { useEffect, useState } from 'react';
import SiteLayout from '../components/SiteLayout';
import { createClient } from '../lib/supabase/browserClient';

const DIAS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

export async function getServerSideProps() {
  // Mesmo motivo do admin/login.js — evita pré-renderização estática no build.
  return { props: {} };
}

export default function MinhaContaPage() {
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState(undefined); // undefined = carregando
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [subscriberRow, setSubscriberRow] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const [dayDraft, setDayDraft] = useState('');
  const [daySaving, setDaySaving] = useState(false);
  const [daySaved, setDaySaved] = useState(false);

  const [edicoes, setEdicoes] = useState(null);
  const [edicoesError, setEdicoesError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session) return;
    setLoadingData(true);
    (async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone')
        .eq('id', session.user.id)
        .single();
      setProfile(prof);

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setSubscription(sub);

      // Linha de "quem recebe a newsletter" — existe tanto para quem paga a
      // própria assinatura quanto para quem recebeu de presente (nesse caso
      // não há necessariamente uma linha em `subscriptions` para esta conta).
      const { data: subRow } = await supabase
        .from('newsletter_subscribers')
        .select('id, status, preferred_day, receive_newsletter')
        .eq('user_id', session.user.id)
        .maybeSingle();
      setSubscriberRow(subRow);
      setDayDraft(subRow?.preferred_day || 'terça');

      setLoadingData(false);

      // Seção VIP ("Superfãs"): só busca o arquivo se a pessoa recebe a
      // newsletter ativamente (assinante pagante ou presenteado).
      if (subRow?.status === 'active') {
        try {
          const {
            data: { session: freshSession },
          } = await supabase.auth.getSession();
          const res = await fetch('/api/account/newsletters', {
            headers: { Authorization: `Bearer ${freshSession?.access_token}` },
          });
          const data = await res.json();
          if (res.ok) {
            setEdicoes(data.newsletters);
          } else {
            setEdicoesError(data.error || 'Não foi possível carregar o arquivo agora.');
          }
        } catch {
          setEdicoesError('Erro de conexão ao carregar o arquivo.');
        }
      }
    })();
  }, [session, supabase]);

  async function handleSendFeedback(e) {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;
    setFeedbackSending(true);
    setFeedbackError('');
    try {
      const {
        data: { session: freshSession },
      } = await supabase.auth.getSession();
      const res = await fetch('/api/account/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${freshSession?.access_token}` },
        body: JSON.stringify({ message: feedbackMessage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedbackError(data.error || 'Não foi possível enviar agora.');
      } else {
        setFeedbackSent(true);
        setFeedbackMessage('');
      }
    } catch {
      setFeedbackError('Erro de conexão ao enviar.');
    }
    setFeedbackSending(false);
  }

  async function handleSaveDay(e) {
    e.preventDefault();
    if (!subscriberRow) return;
    setDaySaving(true);
    setDaySaved(false);
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ preferred_day: dayDraft })
      .eq('id', subscriberRow.id);
    if (!error) {
      setSubscriberRow((r) => ({ ...r, preferred_day: dayDraft }));
      setDaySaved(true);
    }
    setDaySaving(false);
  }

  async function sendMagicLink(e) {
    e.preventDefault();
    setLoginError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/minha-conta` },
    });
    if (error) {
      setLoginError('Não foi possível enviar o link de acesso. Confira o e-mail e tente de novo.');
      return;
    }
    setMagicLinkSent(true);
  }

  async function handleCancel() {
    setCancelError('');
    setCancelLoading(true);
    try {
      const {
        data: { session: freshSession },
      } = await supabase.auth.getSession();

      const res = await fetch('/api/account/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${freshSession?.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data?.error || 'Não foi possível cancelar agora. Tente novamente.');
      } else {
        setCancelled(true);
        setSubscription((s) => (s ? { ...s, status: 'canceled' } : s));
      }
    } catch {
      setCancelError('Erro de conexão. Tente novamente.');
    }
    setCancelLoading(false);
  }

  return (
    <SiteLayout title="Minha Conta — Sem Mimimi" description="Gerencie sua assinatura da newsletter Sem Mimimi.">
      <section className="tight">
        <div className="wrap" style={{ maxWidth: 520 }}>
          <span className="eyebrow">Minha conta</span>
          <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)' }}>Gerencie sua assinatura</h1>

          {session === undefined && <p className="lede">Carregando…</p>}

          {session === null && (
            <>
              <p className="lede" style={{ marginBottom: 24 }}>
                Digite o e-mail usado na assinatura. Vamos te enviar um link de acesso — sem
                senha.
              </p>
              {!magicLinkSent ? (
                <form onSubmit={sendMagicLink}>
                  <div className="form-field">
                    <label htmlFor="login-email">E-mail</label>
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@email.com"
                    />
                  </div>
                  {loginError && <div className="admin-alert error">{loginError}</div>}
                  <button type="submit" className="btn block">
                    Enviar link de acesso
                  </button>
                </form>
              ) : (
                <div className="admin-alert success">
                  Link enviado! Confira sua caixa de entrada (e o spam) e clique nele para entrar.
                </div>
              )}
            </>
          )}

          {session && (
            <>
              {loadingData && <p className="lede">Carregando seus dados…</p>}

              {!loadingData && subscription && (
                <div style={{ border: '1px solid var(--line)', background: 'var(--bg2)', padding: 24, marginTop: 20 }}>
                  {subscription.is_gift && (
                    <div style={{ marginBottom: 16, fontFamily: 'var(--mono)', fontSize: '.72rem', textTransform: 'uppercase', color: 'var(--red)' }}>
                      🎁 Presente para {subscription.gift_recipient_name}
                    </div>
                  )}
                  <div style={{ marginBottom: 14 }}>
                    <span className="label" style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', textTransform: 'uppercase', color: 'var(--faint)' }}>
                      Nome
                    </span>
                    <div>{profile?.nome || '—'}</div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', textTransform: 'uppercase', color: 'var(--faint)' }}>
                      E-mail
                    </span>
                    <div>{profile?.email}</div>
                  </div>
                  {subscription.is_gift && (
                    <div style={{ marginBottom: 14 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', textTransform: 'uppercase', color: 'var(--faint)' }}>
                        Presenteado(a)
                      </span>
                      <div>{subscription.gift_recipient_name} — {subscription.gift_recipient_email}</div>
                    </div>
                  )}
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', textTransform: 'uppercase', color: 'var(--faint)' }}>
                      Plano
                    </span>
                    <div>{subscription.plan_id === 'anual' ? 'Anual' : 'Mensal'}</div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', textTransform: 'uppercase', color: 'var(--faint)' }}>
                      Status
                    </span>
                    <div>
                      <span className={`badge ${subscription.status === 'active' ? 'ok' : subscription.status === 'canceled' ? 'bad' : 'warn'}`}>
                        {subscription.status}
                      </span>
                    </div>
                  </div>
                  {subscription.next_billing_at && (
                    <div style={{ marginBottom: 14 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', textTransform: 'uppercase', color: 'var(--faint)' }}>
                        Próxima cobrança
                      </span>
                      <div>{new Date(subscription.next_billing_at).toLocaleDateString('pt-BR')}</div>
                    </div>
                  )}

                  {cancelError && <div className="admin-alert error">{cancelError}</div>}
                  {cancelled && <div className="admin-alert success">Assinatura cancelada. {subscription.is_gift ? 'O presente continua ativo até o fim do período já pago.' : 'Você continua recebendo até o fim do período já pago.'}</div>}

                  {subscription.status === 'active' && !cancelled && (
                    <button className="admin-btn danger" style={{ marginTop: 10 }} onClick={handleCancel} disabled={cancelLoading}>
                      {cancelLoading ? 'Cancelando…' : subscription.is_gift ? 'Cancelar presente' : 'Cancelar assinatura'}
                    </button>
                  )}
                </div>
              )}

              {!loadingData && !subscription && !subscriberRow && (
                <p className="lede">Nenhuma assinatura encontrada para esta conta ainda.</p>
              )}

              {!loadingData && subscriberRow && (
                <div style={{ border: '1px solid var(--line)', padding: 24, marginTop: subscription ? 16 : 20 }}>
                  <span className="eyebrow">Você recebe a newsletter</span>
                  <h2 style={{ fontSize: '1.05rem', margin: '4px 0 16px' }}>
                    {subscriberRow.status === 'active' ? 'Ativo — chega no dia que você escolher' : subscriberRow.status}
                  </h2>
                  <form onSubmit={handleSaveDay}>
                    <div className="form-field" style={{ maxWidth: 240 }}>
                      <label htmlFor="dia-pref">Dia preferido</label>
                      <select id="dia-pref" value={dayDraft} onChange={(e) => setDayDraft(e.target.value)}>
                        {DIAS.map((d) => (
                          <option key={d} value={d}>
                            {d.charAt(0).toUpperCase() + d.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="admin-btn secondary" disabled={daySaving}>
                      {daySaving ? 'Salvando…' : 'Salvar dia'}
                    </button>
                    {daySaved && <span style={{ marginLeft: 10, fontSize: '.85rem', color: 'var(--dim)' }}>Salvo ✓</span>}
                  </form>
                </div>
              )}

              {!loadingData && subscriberRow?.status === 'active' && (
                <div style={{ marginTop: 36 }}>
                  <span className="eyebrow">Área de assinante</span>
                  <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}>Suas edições</h2>

                  {edicoesError && <div className="admin-alert error">{edicoesError}</div>}

                  {edicoes === null && !edicoesError && <p className="lede">Carregando arquivo…</p>}

                  {edicoes && edicoes.length === 0 && (
                    <p className="lede">Ainda não há edições enviadas no arquivo.</p>
                  )}

                  {edicoes && edicoes.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'grid', gap: 10 }}>
                      {edicoes.map((n) => (
                        <li key={n.id} style={{ border: '1px solid var(--line)', padding: '14px 16px' }}>
                          <a href={`/edicoes/${n.id}`} style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                            {n.title}
                          </a>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', color: 'var(--faint)' }}>
                            {n.sent_at ? new Date(n.sent_at).toLocaleDateString('pt-BR') : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <h2 style={{ fontSize: '1.3rem', marginBottom: 12 }}>Fale direto com a equipe</h2>
                  <p className="lede" style={{ marginBottom: 16 }}>
                    Assinante ativo tem canal direto — sua mensagem cai direto pra equipe, sem formulário genérico de
                    suporte.
                  </p>
                  {feedbackSent ? (
                    <div className="admin-alert success">Mensagem enviada. Obrigado pelo retorno!</div>
                  ) : (
                    <form onSubmit={handleSendFeedback}>
                      <div className="form-field">
                        <textarea
                          rows={4}
                          value={feedbackMessage}
                          onChange={(e) => setFeedbackMessage(e.target.value)}
                          placeholder="O que você quer dizer pra gente?"
                          required
                        />
                      </div>
                      {feedbackError && <div className="admin-alert error">{feedbackError}</div>}
                      <button type="submit" className="btn" disabled={feedbackSending}>
                        {feedbackSending ? 'Enviando…' : 'Enviar mensagem'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
