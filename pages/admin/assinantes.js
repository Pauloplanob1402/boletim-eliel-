import AdminLayout from '../../components/AdminLayout';
import { requireAdmin } from '../../lib/supabase/requireAdmin';
import { createAdminClient } from '../../lib/supabase/adminClient';

export async function getServerSideProps(context) {
  const adminResult = await requireAdmin(context);
  if (adminResult.redirect) return adminResult;

  const admin = createAdminClient();
  const { data: assinantes } = await admin
    .from('newsletter_subscribers')
    .select('id, email, nome, status, preferred_day, preferred_time, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  return { props: { adminUser: adminResult.props.adminUser, assinantes: assinantes || [] } };
}

export default function AssinantesPage({ adminUser, assinantes }) {
  return (
    <AdminLayout title="Assinantes" adminUser={adminUser}>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Status</th>
              <th>Dia preferido</th>
              <th>Desde</th>
            </tr>
          </thead>
          <tbody>
            {assinantes.map((a) => (
              <tr key={a.id}>
                <td className="strong">{a.nome || '—'}</td>
                <td>{a.email}</td>
                <td>
                  <span className={`badge ${a.status === 'active' ? 'ok' : 'neutral'}`}>{a.status}</span>
                </td>
                <td style={{ textTransform: 'capitalize' }}>{a.preferred_day || '—'}</td>
                <td>{new Date(a.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
            {assinantes.length === 0 && (
              <tr>
                <td colSpan={5}>Nenhum assinante ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
