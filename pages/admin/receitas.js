import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { requireAdmin } from '../../lib/supabase/requireAdmin';
import { createAdminClient } from '../../lib/supabase/adminClient';
import { createClient } from '../../lib/supabase/browserClient';
import { buildPixPayload } from '../../lib/newsletter/pix';

// Mesma ordem/nomes de lib/newsletter/revenue.js -> REVENUE_SPLIT_TABLE.
const RECIPIENT_ORDER = ['Tiago Pavinatto', 'Eliel Duarte', 'Paulo Nascimento'];

const PIX_KEY_TYPE_LABELS = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  telefone: 'Telefone',
  aleatoria: 'Aleatória (UUID)',
};

export async function getServerSideProps(context) {
  const adminResult = await requireAdmin(context);
  if (adminResult.redirect) return adminResult;

  const admin = createAdminClient();

  const [{ data: alocacoes }, { data: recipients }] = await Promise.all([
    admin
      .from('revenue_allocations')
      .select('id, recipient_name, percentage, amount, payout_status, paid_at, created_at, payments(id, paid_at)')
      .order('created_at', { ascending: false })
      .limit(300),
    admin.from('revenue_recipients').select('*'),
  ]);

  const totals = {};
  const pending = {};
  for (const a of alocacoes || []) {
    totals[a.recipient_name] = (totals[a.recipient_name] || 0) + Number(a.amount || 0);
    if (a.payout_status === 'pending') {
      pending[a.recipient_name] = (pending[a.recipient_name] || 0) + Number(a.amount || 0);
    }
  }

  const recipientsByName = {};
  for (const r of recipients || []) recipientsByName[r.recipient_name] = r;

  return {
    props: {
      adminUser: adminResult.props.adminUser,
      alocacoes: alocacoes || [],
      totals,
      pending,
      recipientsByName,
    },
  };
}

async function authHeader(supabase) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session?.access_token}` };
}

function maskPixKey(key, type) {
  if (!key) return '';
  if (type === 'email') {
    const [user, domain] = key.split('@');
    return `${(user || '').slice(0, 2)}***@${domain || ''}`;
  }
  if (key.length <= 6) return '••••';
  return `${key.slice(0, 3)}••••${key.slice(-3)}`;
}

function RecipientCard({ name, pending, recipient }) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const [editing, setEditing] = useState(!recipient?.pix_key && !recipient?.is_platform_account);
  const [pixKeyType, setPixKeyType] = useState(recipient?.pix_key_type || 'email');
  const [pixKeyInput, setPixKeyInput] = useState('');
  const [pixCity, setPixCity] = useState(recipient?.pix_city || 'BRASILIA');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [payingOut, setPayingOut] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState('');

  const brl = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const isPlatformAccount = !!recipient?.is_platform_account;
  const hasPixKey = !!recipient?.pix_key;

  async function handleSaveRecipient(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const headers = await authHeader(supabase);
      const res = await fetch('/api/admin/revenue-recipient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          recipientName: name,
          pixKey: pixKeyInput,
          pixKeyType,
          pixCity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar.');
      setEditing(false);
      router.replace(router.asPath, undefined, { scroll: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPlatformAccount() {
    setSaving(true);
    setError('');
    try {
      const headers = await authHeader(supabase);
      const res = await fetch('/api/admin/revenue-recipient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ recipientName: name, isPlatformAccount: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar.');
      router.replace(router.asPath, undefined, { scroll: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCopyPix() {
    setError('');
    try {
      const txId = `SEMMIMIMI${new Date().toISOString().slice(0, 7).replace('-', '')}`;
      const payload = buildPixPayload({
        pixKey: recipient.pix_key,
        amount: pending,
        recipientName: name,
        city: recipient.pix_city || 'BRASILIA',
        txId,
      });
      navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      setError(`Não deu pra gerar o código Pix: ${err.message}`);
    }
  }

  async function handleMarkPaidOut() {
    if (!window.confirm(`Confirma que você já pagou ${brl(pending)} para ${name} via Pix?`)) return;
    setPayingOut(true);
    setPayoutMsg('');
    setError('');
    try {
      const headers = await authHeader(supabase);
      const res = await fetch('/api/admin/revenue-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ recipientName: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao marcar repasse.');
      setPayoutMsg(`Marcado: ${brl(data.total)} repassado(s).`);
      router.replace(router.asPath, undefined, { scroll: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setPayingOut(false);
    }
  }

  return (
    <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="label">{name}</span>
          <span className="value">{brl(pending)}</span>
          <div className="sub">pendente de repasse</div>
        </div>
        {isPlatformAccount && <span className="badge neutral">Conta da plataforma</span>}
        {!isPlatformAccount && !hasPixKey && <span className="badge warn">Sem chave Pix</span>}
        {!isPlatformAccount && hasPixKey && pending > 0 && <span className="badge bad">Pendente</span>}
        {!isPlatformAccount && hasPixKey && pending === 0 && <span className="badge ok">Em dia</span>}
      </div>

      {isPlatformAccount && (
        <p className="sub" style={{ margin: 0 }}>
          Marcado como a conta do Mercado Pago que já recebe a assinatura — não precisa de Pix, o
          valor já está nesta conta.{' '}
          <button
            type="button"
            className="admin-btn secondary"
            style={{ padding: '4px 10px', fontSize: '.72rem' }}
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                const headers = await authHeader(supabase);
                await fetch('/api/admin/revenue-recipient', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...headers },
                  body: JSON.stringify({ recipientName: name, pixKey: '', pixKeyType: 'email', isPlatformAccount: false }),
                });
              } finally {
                setSaving(false);
                setEditing(true);
                router.replace(router.asPath, undefined, { scroll: false });
              }
            }}
          >
            Desmarcar
          </button>
        </p>
      )}

      {!isPlatformAccount && !editing && hasPixKey && (
        <>
          <p className="sub" style={{ margin: 0 }}>
            Pix: {PIX_KEY_TYPE_LABELS[recipient.pix_key_type] || ''} · {maskPixKey(recipient.pix_key, recipient.pix_key_type)}{' '}
            <button
              type="button"
              className="admin-btn secondary"
              style={{ padding: '2px 8px', fontSize: '.7rem', marginLeft: 6 }}
              onClick={() => setEditing(true)}
            >
              editar
            </button>
          </p>

          {pending > 0 ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="admin-btn" onClick={handleCopyPix}>
                {copied ? 'Copiado ✓' : 'Copiar Pix Copia e Cola'}
              </button>
              <button type="button" className="admin-btn secondary" disabled={payingOut} onClick={handleMarkPaidOut}>
                {payingOut ? 'Marcando…' : 'Marcar como repassado'}
              </button>
            </div>
          ) : (
            <p className="sub" style={{ margin: 0 }}>Nada pendente agora.</p>
          )}
          {payoutMsg && <p className="sub" style={{ margin: 0, color: '#3f6b1f' }}>{payoutMsg}</p>}
        </>
      )}

      {!isPlatformAccount && editing && (
        <form onSubmit={handleSaveRecipient} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Tipo de chave Pix</label>
              <select value={pixKeyType} onChange={(e) => setPixKeyType(e.target.value)}>
                {Object.entries(PIX_KEY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Cidade (aparece no Pix)</label>
              <input value={pixCity} onChange={(e) => setPixCity(e.target.value)} placeholder="BRASILIA" />
            </div>
          </div>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>Chave Pix</label>
            <input
              value={pixKeyInput}
              onChange={(e) => setPixKeyInput(e.target.value)}
              placeholder={recipient?.pix_key ? 'Digite a nova chave para trocar' : 'CPF, e-mail, telefone ou chave aleatória'}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar chave Pix'}
            </button>
            {hasPixKey && (
              <button type="button" className="admin-btn secondary" onClick={() => setEditing(false)}>
                Cancelar
              </button>
            )}
            <button type="button" className="admin-btn secondary" disabled={saving} onClick={handleMarkPlatformAccount}>
              É a conta da plataforma (sem Pix)
            </button>
          </div>
        </form>
      )}

      {error && <div className="admin-alert error" style={{ margin: 0 }}>{error}</div>}
    </div>
  );
}

export default function ReceitasPage({ adminUser, alocacoes, totals, pending, recipientsByName }) {
  const brl = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const orderedNames = [
    ...RECIPIENT_ORDER.filter((n) => n in totals || n in recipientsByName),
    ...Object.keys(totals).filter((n) => !RECIPIENT_ORDER.includes(n)),
  ];

  return (
    <AdminLayout title="Receitas" adminUser={adminUser}>
      <h2 className="admin-title" style={{ fontSize: '1.15rem', marginBottom: 16 }}>
        Repasse do split (60/20/20)
      </h2>
      <p className="sub" style={{ marginTop: -8, marginBottom: 20 }}>
        Cada card mostra o quanto está pendente de repasse manual. Configure a chave Pix uma vez
        — depois é só copiar o código pronto e marcar como repassado todo mês.
      </p>

      <div className="admin-grid">
        {orderedNames.map((nome) => (
          <RecipientCard key={nome} name={nome} pending={pending[nome] || 0} recipient={recipientsByName[nome]} />
        ))}
        {orderedNames.length === 0 && (
          <div className="admin-card">
            <span className="label">Sem receita registrada ainda</span>
          </div>
        )}
      </div>

      <h2 className="admin-title" style={{ fontSize: '1.15rem', marginTop: 40, marginBottom: 16 }}>
        Histórico
      </h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Beneficiário</th>
              <th>%</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {alocacoes.map((a) => (
              <tr key={a.id}>
                <td className="strong">{a.recipient_name}</td>
                <td>{a.percentage}%</td>
                <td>{brl(a.amount)}</td>
                <td>
                  <span className={`badge ${a.payout_status === 'paid' ? 'ok' : 'warn'}`}>
                    {a.payout_status === 'paid' ? 'Repassado' : 'Pendente'}
                  </span>
                </td>
                <td>{new Date(a.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
            {alocacoes.length === 0 && (
              <tr>
                <td colSpan={5}>Nenhuma alocação registrada ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
