import AdminLayout from '../../components/AdminLayout';
import { requireAdmin } from '../../lib/supabase/requireAdmin';
import { createAdminClient } from '../../lib/supabase/adminClient';

const RANGE_LABELS = {
  hoje: 'Hoje',
  '7dias': 'Últimos 7 dias',
  mes: 'Este mês',
  mes_anterior: 'Mês anterior',
};

function rangeToDates(range) {
  const now = new Date();
  let start;
  let end = now;

  if (range === 'hoje') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === '7dias') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === 'mes_anterior') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  } else {
    // mes (padrão)
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getServerSideProps(context) {
  const adminResult = await requireAdmin(context);
  if (adminResult.redirect) return adminResult;

  const range = context.query.range || 'mes';
  const { start, end } = rangeToDates(range);
  const admin = createAdminClient();

  const [{ count: assinantesAtivos }, { count: assinaturasAtivas }, paymentsInRange, ultimaNewsletter, proximoEnvio, enviosStats] =
    await Promise.all([
      admin.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      admin.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      admin.from('payments').select('amount, status').eq('status', 'approved').gte('paid_at', start).lte('paid_at', end),
      admin.from('newsletters').select('id, title, sent_at, status').eq('status', 'sent').order('sent_at', { ascending: false }).limit(1).maybeSingle(),
      admin.from('newsletters').select('id, title, scheduled_at').eq('status', 'scheduled').order('scheduled_at', { ascending: true }).limit(1).maybeSingle(),
      admin.from('newsletter_sends').select('status'),
    ]);

  const receitaPeriodo = (paymentsInRange.data || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const enviados = (enviosStats.data || []).filter((s) => s.status === 'sent').length;
  const comErro = (enviosStats.data || []).filter((s) => s.status === 'failed').length;

  return {
    props: {
      adminUser: adminResult.props.adminUser,
      range,
      stats: {
        assinantesAtivos: assinantesAtivos || 0,
        assinaturasAtivas: assinaturasAtivas || 0,
        receitaPeriodo,
        ultimaNewsletter: ultimaNewsletter.data || null,
        proximoEnvio: proximoEnvio.data || null,
        enviados,
        comErro,
      },
    },
  };
}

export default function AdminDashboard({ adminUser, range, stats }) {
  const brl = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <AdminLayout title="Início" adminUser={adminUser}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {Object.entries(RANGE_LABELS).map(([key, label]) => (
          <a
            key={key}
            href={`/admin?range=${key}`}
            className="admin-btn secondary"
            style={{ borderColor: range === key ? 'var(--red)' : undefined, color: range === key ? 'var(--red)' : undefined }}
          >
            {label}
          </a>
        ))}
      </div>

      <div className="admin-grid">
        <div className="admin-card">
          <span className="label">Assinantes ativos</span>
          <span className="value">{stats.assinantesAtivos}</span>
        </div>
        <div className="admin-card">
          <span className="label">Assinaturas ativas</span>
          <span className="value">{stats.assinaturasAtivas}</span>
        </div>
        <div className="admin-card">
          <span className="label">Receita do período</span>
          <span className="value">{brl(stats.receitaPeriodo)}</span>
        </div>
        <div className="admin-card">
          <span className="label">E-mails enviados</span>
          <span className="value">{stats.enviados}</span>
        </div>
        <div className="admin-card">
          <span className="label">E-mails com erro</span>
          <span className="value">{stats.comErro}</span>
        </div>
      </div>

      <div className="admin-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="admin-card">
          <span className="label">Newsletter mais recente</span>
          <span className="value" style={{ fontSize: '1.1rem' }}>
            {stats.ultimaNewsletter?.title || '—'}
          </span>
          {stats.ultimaNewsletter?.sent_at && (
            <div className="sub">Enviada em {new Date(stats.ultimaNewsletter.sent_at).toLocaleString('pt-BR')}</div>
          )}
        </div>
        <div className="admin-card">
          <span className="label">Próximo envio agendado</span>
          <span className="value" style={{ fontSize: '1.1rem' }}>
            {stats.proximoEnvio?.title || '—'}
          </span>
          {stats.proximoEnvio?.scheduled_at && (
            <div className="sub">{new Date(stats.proximoEnvio.scheduled_at).toLocaleString('pt-BR')}</div>
          )}
        </div>
      </div>

      <div className="admin-card" style={{ maxWidth: 420 }}>
        <span className="label" style={{ marginBottom: 14 }}>
          Divisão de receita (regra fixa)
        </span>
        <div style={{ display: 'grid', gap: 8, fontSize: '.94rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tiago Pavinatto — 60%</span>
            <strong>{brl(stats.receitaPeriodo * 0.6)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Eliel Duarte — 20%</span>
            <strong>{brl(stats.receitaPeriodo * 0.2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Paulo Nascimento — 20%</span>
            <strong>{brl(stats.receitaPeriodo * 0.2)}</strong>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
