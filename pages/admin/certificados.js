import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { requireAdmin } from '../../lib/supabase/requireAdmin';
import { createAdminClient } from '../../lib/supabase/adminClient';
import { createClient } from '../../lib/supabase/browserClient';

export async function getServerSideProps(context) {
  const adminResult = await requireAdmin(context);
  if (adminResult.redirect) return adminResult;

  const admin = createAdminClient();
  const { data: codigos, error } = await admin
    .from('certificate_codes')
    .select('id, code, titulo, destinatario, nome, resgatado_em, criado_em')
    .order('criado_em', { ascending: false })
    .limit(300);

  return {
    props: {
      adminUser: adminResult.props.adminUser,
      codigos: codigos || [],
      semTabela: !!error,
    },
  };
}

const ROTULO = { leitor: 'Prata · Leitor(a)', embaixador: 'Ouro · Embaixador(a)', apoiador: 'Diamante · Apoiador(a)' };

export default function CertificadosAdmin({ adminUser, codigos, semTabela }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [titulo, setTitulo] = useState('leitor');
  const [quantidade, setQuantidade] = useState(1);
  const [destinatario, setDestinatario] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [novos, setNovos] = useState([]);
  const [copiado, setCopiado] = useState('');

  const site = typeof window !== 'undefined' ? window.location.origin : '';

  async function gerar(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const r = await fetch('/api/admin/certificate-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ titulo, quantidade, destinatario }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erro ao gerar.');
      setNovos(j.codes.map((c) => ({ code: c, titulo })));
      router.replace(router.asPath);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  function mensagem(code) {
    return `Seu código do certificado da Turma Sem Mimimi: ${code}\nPegue o seu aqui: ${site}/certificado`;
  }

  async function copiar(texto, chave) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(chave);
      setTimeout(() => setCopiado(''), 2000);
    } catch (e) {
      /* sem permissão de área de transferência */
    }
  }

  return (
    <AdminLayout title="Certificados" adminUser={adminUser}>
      {semTabela && (
        <div className="admin-alert error">
          A tabela de certificados ainda não existe. No Supabase, abra o SQL Editor e rode o arquivo
          <strong> supabase/migration_006_certificates.sql</strong>.
        </div>
      )}

      <div className="admin-card" style={{ maxWidth: 560, marginBottom: 28 }}>
        <h2 className="admin-title" style={{ fontSize: '1.1rem', marginBottom: 14 }}>Gerar códigos</h2>
        <form onSubmit={gerar}>
          <div className="form-field">
            <label htmlFor="c-titulo">Título que o código libera</label>
            <select id="c-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)}>
              <option value="leitor">Leitor(a) — nível PRATA</option>
              <option value="embaixador">Embaixador(a) — nível OURO</option>
              <option value="apoiador">Apoiador(a) — nível DIAMANTE</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="c-qtd">Quantidade (1 a 200)</label>
              <input id="c-qtd" type="number" min="1" max="200" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor="c-dest">Para quem (anotação sua)</label>
              <input id="c-dest" value={destinatario} maxLength={80} onChange={(e) => setDestinatario(e.target.value)} placeholder="Ex.: grupo de WhatsApp" />
            </div>
          </div>
          {erro && <div className="admin-alert error">{erro}</div>}
          <button className="admin-btn" disabled={loading || semTabela}>{loading ? 'Gerando…' : 'Gerar códigos'}</button>
        </form>
      </div>

      {novos.length > 0 && (
        <div className="admin-card" style={{ marginBottom: 28 }}>
          <h2 className="admin-title" style={{ fontSize: '1.1rem', marginBottom: 10 }}>Códigos novos</h2>
          <p className="field-hint" style={{ marginTop: 0 }}>Copie e envie. Cada código resgata um certificado só.</p>
          {novos.map((n) => (
            <div key={n.code} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--line-soft)', flexWrap: 'wrap' }}>
              <code style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{n.code}</code>
              <span className="badge neutral">{ROTULO[n.titulo]}</span>
              <button className="admin-btn secondary" style={{ padding: '6px 10px' }} onClick={() => copiar(n.code, n.code)}>
                {copiado === n.code ? 'Copiado!' : 'Copiar código'}
              </button>
              <button className="admin-btn secondary" style={{ padding: '6px 10px' }} onClick={() => copiar(mensagem(n.code), n.code + 'm')}>
                {copiado === n.code + 'm' ? 'Copiado!' : 'Copiar mensagem pronta'}
              </button>
            </div>
          ))}
          <button className="admin-btn secondary" style={{ marginTop: 12 }} onClick={() => copiar(novos.map((n) => n.code).join('\n'), 'todos')}>
            {copiado === 'todos' ? 'Copiado!' : 'Copiar todos'}
          </button>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Título</th>
              <th>Para quem</th>
              <th>Resgatado por</th>
              <th>Quando</th>
            </tr>
          </thead>
          <tbody>
            {codigos.map((c) => (
              <tr key={c.id}>
                <td className="strong" style={{ fontFamily: 'var(--mono)' }}>{c.code}</td>
                <td>{ROTULO[c.titulo]}</td>
                <td>{c.destinatario || '—'}</td>
                <td>{c.nome ? c.nome : <span className="badge warn">livre</span>}</td>
                <td>{c.resgatado_em ? new Date(c.resgatado_em).toLocaleDateString('pt-BR') : '—'}</td>
              </tr>
            ))}
            {codigos.length === 0 && (
              <tr><td colSpan={5}>Nenhum código ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
