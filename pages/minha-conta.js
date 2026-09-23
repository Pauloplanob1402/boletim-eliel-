import { useEffect, useState } from 'react';
import SiteLayout from '../components/SiteLayout';
import { createClient } from '../lib/supabase/browserClient';

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
  const [loadingData, setLoadingData] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);

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
      setLoadingData(false);
    })();
  }, [session, supabase]);

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
                  {cancelled && <div className="admin-alert success">Assinatura cancelada. Você continua recebendo até o fim do período já pago.</div>}

                  {subscription.status === 'active' && !cancelled && (
                    <button className="admin-btn danger" style={{ marginTop: 10 }} onClick={handleCancel} disabled={cancelLoading}>
                      {cancelLoading ? 'Cancelando…' : 'Cancelar assinatura'}
                    </button>
                  )}
                </div>
              )}

              {!loadingData && !subscription && (
                <p className="lede">Nenhuma assinatura encontrada para esta conta ainda.</p>
              )}
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
