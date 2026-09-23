import AdminLayout from '../../components/AdminLayout';
import { requireAdmin } from '../../lib/supabase/requireAdmin';
import { createAdminClient } from '../../lib/supabase/adminClient';

export async function getServerSideProps(context) {
  const adminResult = await requireAdmin(context);
  if (adminResult.redirect) return adminResult;

  const admin = createAdminClient();
  const { data: newsletters } = await admin
    .from('newsletters')
    .select('id, title, status, sent_at, scheduled_at')
    .in('status', ['sent', 'sending', 'scheduled', 'failed'])
    .order('created_at', { ascending: false })
    .limit(50);

  const newsletterIds = (newsletters || []).map((n) => n.id);
  let sendsByNewsletter = {};
  if (newsletterIds.length > 0) {
    const { data: sends } = await admin
      .from('newsletter_sends')
      .select('newsletter_id, status')
      .in('newsletter_id', newsletterIds);
    for (const s of sends || []) {
      sendsByNewsletter[s.newsletter_id] = sendsByNewsletter[s.newsletter_id] || { sent: 0, failed: 0, pending: 0 };
      sendsByNewsletter[s.newsletter_id][s.status] = (sendsByNewsletter[s.newsletter_id][s.status] || 0) + 1;
    }
  }

  return {
    props: {
      adminUser: adminResult.props.adminUser,
      newsletters: newsletters || [],
      sendsByNewsletter,
    },
  };
}

const STATUS_BADGE = { sent: 'ok', sending: 'warn', scheduled: 'warn', failed: 'bad' };

export default function EnviosPage({ adminUser, newsletters, sendsByNewsletter }) {
  return (
    <AdminLayout title="Envios" adminUser={adminUser}>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Newsletter</th>
              <th>Status</th>
              <th>Enviados</th>
              <th>Falhas</th>
              <th>Pendentes</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {newsletters.map((n) => {
              const counts = sendsByNewsletter[n.id] || { sent: 0, failed: 0, pending: 0 };
              return (
                <tr key={n.id}>
                  <td className="strong">{n.title}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[n.status] || 'neutral'}`}>{n.status}</span>
                  </td>
                  <td>{counts.sent}</td>
                  <td>{counts.failed}</td>
                  <td>{counts.pending}</td>
                  <td>
                    {n.sent_at
                      ? new Date(n.sent_at).toLocaleString('pt-BR')
                      : n.scheduled_at
                      ? new Date(n.scheduled_at).toLocaleString('pt-BR')
                      : '—'}
                  </td>
                </tr>
              );
            })}
            {newsletters.length === 0 && (
              <tr>
                <td colSpan={6}>Nenhum envio registrado ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
