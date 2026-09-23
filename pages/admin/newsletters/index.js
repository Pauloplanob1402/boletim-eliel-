import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';
import { requireAdmin } from '../../../lib/supabase/requireAdmin';
import { createAdminClient } from '../../../lib/supabase/adminClient';

export async function getServerSideProps(context) {
  const adminResult = await requireAdmin(context);
  if (adminResult.redirect) return adminResult;

  const admin = createAdminClient();
  const { data: newsletters } = await admin
    .from('newsletters')
    .select('id, title, subject, status, scheduled_at, sent_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100);

  return { props: { adminUser: adminResult.props.adminUser, newsletters: newsletters || [] } };
}

const STATUS_BADGE = { draft: 'neutral', scheduled: 'warn', sending: 'warn', sent: 'ok', failed: 'bad' };

export default function NewslettersIndexPage({ adminUser, newsletters }) {
  return (
    <AdminLayout title="Newsletters" adminUser={adminUser}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/newsletters/nova" className="admin-btn">
          + Nova newsletter
        </Link>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Status</th>
              <th>Agendada / enviada</th>
              <th>Atualizada</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {newsletters.map((n) => (
              <tr key={n.id}>
                <td className="strong">{n.title}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[n.status] || 'neutral'}`}>{n.status}</span>
                </td>
                <td>
                  {n.sent_at
                    ? new Date(n.sent_at).toLocaleString('pt-BR')
                    : n.scheduled_at
                    ? new Date(n.scheduled_at).toLocaleString('pt-BR')
                    : '—'}
                </td>
                <td>{new Date(n.updated_at).toLocaleString('pt-BR')}</td>
                <td>
                  <Link href={`/admin/newsletters/nova?id=${n.id}`}>Abrir</Link>
                </td>
              </tr>
            ))}
            {newsletters.length === 0 && (
              <tr>
                <td colSpan={5}>Nenhuma newsletter criada ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
