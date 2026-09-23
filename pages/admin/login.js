import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '../../lib/supabase/browserClient';

export async function getServerSideProps() {
  // Força renderização dinâmica (sem isso, o Next tentaria pré-renderizar esta
  // página estaticamente no build, o que falha porque o cliente Supabase do
  // navegador só pode ser instanciado com as env vars disponíveis em runtime).
  return { props: {} };
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('E-mail ou senha inválidos.');
      setLoading(false);
      return;
    }

    router.push('/admin');
  }

  return (
    <>
      <Head>
        <title>Login — Admin Sem Mimimi</title>
      </Head>
      <div className="login-box">
        <div className="brand" style={{ marginBottom: 24, fontFamily: 'var(--display)', textTransform: 'uppercase' }}>
          SEM <span style={{ color: 'var(--red)' }}>MIMIMI</span>
        </div>
        <h1 style={{ fontSize: '1.3rem', marginBottom: 20 }}>Painel administrativo</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="password">Senha</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="admin-alert error">{error}</div>}
          <button type="submit" className="admin-btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </>
  );
}
