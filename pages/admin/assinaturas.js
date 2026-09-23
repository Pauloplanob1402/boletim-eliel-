import AdminLayout from '../../components/AdminLayout';
import { requireAdmin } from '../../lib/supabase/requireAdmin';
import { createAdminClient } from '../../lib/supabase/adminClient';

export async function getServerSideProps(context) {
  const adminResult = await requireAdmin(context);
  if (adminResult.redirect) return adminResult;

  const admin = createAdminClient();
  const { data: assinaturas } = await admin
    .from('subscriptions')
    .select('id, plan_id, status, amount, started_at, next_billing_at, canceled_at, profiles(nome, email)')
    .order('created_at', { ascending: false })
    .limit(200);

  return { props: { adminUser: adminResult.props.adminUser, assinaturas: assinaturas || [] } };
}

const STATUS_BADGE = {
  active: 'ok',
  authorized: 'ok',
  pending: 'warn',
  paused: 'warn',
  canceled: 'bad',
  expired: 'bad',
  rejected: 'bad',
};

export default function AssinaturasPage({ adminUser, assinaturas }) {
  return (
    <AdminLayout title="Assinaturas" adminUser={adminUser}>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Assinante</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Valor</th>
              <th>Próx. cobrança</th>
            </tr>
          </thead>
          <tbody>
            {assinaturas.map((s) => (
              <tr key={s.id}>
                <td className="strong">{s.profiles?.nome || s.profiles?.email || '—'}</td>
                <td style={{ textTransform: 'capitalize' }}>{s.plan_id}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[s.status] || 'neutral'}`}>{s.status}</span>
                </td>
                <td>{Number(s.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td>{s.next_billing_at ? new Date(s.next_billing_at).toLocaleDateString('pt-BR') : '—'}</td>
              </tr>
            ))}
            {assinaturas.length === 0 && (
              <tr>
                <td colSpan={5}>Nenhuma assinatura ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
