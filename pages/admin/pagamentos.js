import AdminLayout from '../../components/AdminLayout';
import { requireAdmin } from '../../lib/supabase/requireAdmin';
import { createAdminClient } from '../../lib/supabase/adminClient';

export async function getServerSideProps(context) {
  const adminResult = await requireAdmin(context);
  if (adminResult.redirect) return adminResult;

  const admin = createAdminClient();
  const { data: pagamentos } = await admin
    .from('payments')
    .select('id, amount, status, payment_method, paid_at, created_at, profiles(nome, email)')
    .order('created_at', { ascending: false })
    .limit(200);

  return { props: { adminUser: adminResult.props.adminUser, pagamentos: pagamentos || [] } };
}

const STATUS_BADGE = { approved: 'ok', pending: 'warn', in_process: 'warn', rejected: 'bad', refunded: 'bad', cancelled: 'bad' };

export default function PagamentosPage({ adminUser, pagamentos }) {
  return (
    <AdminLayout title="Pagamentos" adminUser={adminUser}>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Assinante</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Método</th>
              <th>Pago em</th>
            </tr>
          </thead>
          <tbody>
            {pagamentos.map((p) => (
              <tr key={p.id}>
                <td className="strong">{p.profiles?.nome || p.profiles?.email || '—'}</td>
                <td>{Number(p.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[p.status] || 'neutral'}`}>{p.status}</span>
                </td>
                <td style={{ textTransform: 'capitalize' }}>{p.payment_method || '—'}</td>
                <td>{p.paid_at ? new Date(p.paid_at).toLocaleString('pt-BR') : '—'}</td>
              </tr>
            ))}
            {pagamentos.length === 0 && (
              <tr>
                <td colSpan={5}>Nenhum pagamento ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
