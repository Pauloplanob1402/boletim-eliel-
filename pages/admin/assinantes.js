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

  // Canal exclusivo de feedback dos assinantes ("Superfãs") — mensagens
  // enviadas via /minha-conta, ver pages/api/account/feedback.js.
  const { data: mensagens } = await admin
    .from('subscriber_messages')
    .select('id, message, status, created_at, profiles(nome, email)')
    .order('created_at', { ascending: false })
    .limit(50);

  return {
    props: {
      adminUser: adminResult.props.adminUser,
      assinantes: assinantes || [],
      mensagens: mensagens || [],
    },
  };
}

export default function AssinantesPage({ adminUser, assinantes, mensagens }) {
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

      <div style={{ marginTop: 40 }}>
        <h2 className="admin-title" style={{ fontSize: '1.15rem', marginBottom: 16 }}>
          Mensagens dos assinantes (canal direto)
        </h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>De</th>
                <th>Mensagem</th>
                <th>Quando</th>
              </tr>
            </thead>
            <tbody>
              {mensagens.map((m) => (
                <tr key={m.id}>
                  <td className="strong" style={{ whiteSpace: 'nowrap' }}>{m.profiles?.nome || m.profiles?.email || '—'}</td>
                  <td style={{ whiteSpace: 'normal', maxWidth: 480 }}>{m.message}</td>
                  <td>{new Date(m.created_at).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
              {mensagens.length === 0 && (
                <tr>
                  <td colSpan={3}>Nenhuma mensagem ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
