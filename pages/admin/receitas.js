import AdminLayout from '../../components/AdminLayout';
import { requireAdmin } from '../../lib/supabase/requireAdmin';
import { createAdminClient } from '../../lib/supabase/adminClient';

export async function getServerSideProps(context) {
  const adminResult = await requireAdmin(context);
  if (adminResult.redirect) return adminResult;

  const admin = createAdminClient();
  const { data: alocacoes } = await admin
    .from('revenue_allocations')
    .select('id, recipient_name, percentage, amount, created_at, payments(id, paid_at)')
    .order('created_at', { ascending: false })
    .limit(300);

  const totals = {};
  for (const a of alocacoes || []) {
    totals[a.recipient_name] = (totals[a.recipient_name] || 0) + Number(a.amount || 0);
  }

  return {
    props: {
      adminUser: adminResult.props.adminUser,
      alocacoes: alocacoes || [],
      totals,
    },
  };
}

export default function ReceitasPage({ adminUser, alocacoes, totals }) {
  const brl = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <AdminLayout title="Receitas" adminUser={adminUser}>
      <div className="admin-grid">
        {Object.entries(totals).map(([nome, valor]) => (
          <div className="admin-card" key={nome}>
            <span className="label">{nome}</span>
            <span className="value">{brl(valor)}</span>
          </div>
        ))}
        {Object.keys(totals).length === 0 && (
          <div className="admin-card">
            <span className="label">Sem receita registrada ainda</span>
          </div>
        )}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Beneficiário</th>
              <th>%</th>
              <th>Valor</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {alocacoes.map((a) => (
              <tr key={a.id}>
                <td className="strong">{a.recipient_name}</td>
                <td>{a.percentage}%</td>
                <td>{brl(a.amount)}</td>
                <td>{new Date(a.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
            {alocacoes.length === 0 && (
              <tr>
                <td colSpan={4}>Nenhuma alocação registrada ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
