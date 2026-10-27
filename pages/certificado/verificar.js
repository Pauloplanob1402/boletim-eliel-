import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SiteLayout from '../../components/SiteLayout';

const CARGO = {
  leitor: { m: 'Leitor', f: 'Leitora' },
  embaixador: { m: 'Embaixador', f: 'Embaixadora' },
  apoiador: { m: 'Apoiador', f: 'Apoiadora' },
};

const NIVEL = { leitor: 'prata', embaixador: 'ouro', apoiador: 'diamante' };

export default function VerificarPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);

  async function verificar(valor) {
    setLoading(true);
    setRes(null);
    try {
      const r = await fetch(`/api/certificate/verify?code=${encodeURIComponent(valor)}`);
      setRes(await r.json());
    } catch (e) {
      setRes({ valid: false });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof router.query.codigo === 'string') {
      setCode(router.query.codigo.slice(0, 20));
      verificar(router.query.codigo);
    }
  }, [router.isReady, router.query.codigo]);

  return (
    <SiteLayout
      title="Verificar certificado — Sem Mimimi"
      description="Confira se um certificado da Turma Sem Mimimi é verdadeiro."
      active="certificado"
      noindex
    >
      <div className="cert-page">
        <section className="hero cert-hero">
          <div className="wrap cert-verify">
            <span className="eyebrow">Verificação</span>
            <h1>Esse certificado é verdadeiro?</h1>
            <p className="lede">Digite o código que aparece no rodapé do certificado.</p>
            <form
              className="cert-card"
              onSubmit={(e) => { e.preventDefault(); verificar(code); }}
            >
              <div className="form-field">
                <label className="cert-label" htmlFor="v-code">Código</label>
                <input id="v-code" className="code" value={code} maxLength={20} placeholder="SM-XXXX-XXXX" onChange={(e) => setCode(e.target.value)} />
              </div>
              <button className="btn" disabled={loading || code.trim().length < 8}>{loading ? 'Conferindo…' : 'Verificar'}</button>
            </form>

            {res && res.valid && (
              <div className="cert-result ok" role="status">
                <span className="cert-ok-badge">Certificado verdadeiro</span>
                <div className="nome">{res.nome}</div>
                <p style={{ margin: 0 }}>
                  {CARGO[res.titulo]?.[res.genero] || 'Membro'} da Turma Sem Mimimi · nível {NIVEL[res.titulo]} · emitido em{' '}
                  {new Date(res.emitidoEm).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
            {res && !res.valid && (
              <div className="cert-result no" role="status">
                <strong>Não encontramos um certificado com esse código.</strong>
                <p style={{ margin: '8px 0 0' }}>Confira se digitou certo. Se o código estiver certo, o certificado pode não ser verdadeiro.</p>
              </div>
            )}
            <p className="cert-fine">
              <Link href="/certificado" style={{ textDecoration: 'underline' }}>Ir para a página do certificado</Link>
            </p>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
