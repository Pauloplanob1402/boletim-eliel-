// Página pública de leitura de uma edição já enviada — é para onde apontam os
// botões de compartilhar do e-mail (WhatsApp/X/e-mail, ver
// lib/newsletter/emailTemplate.js) e também o que a seção "Suas edições" em
// /minha-conta abre. Pública de propósito: um link compartilhado precisa
// funcionar para quem ainda não é assinante — é o próprio gatilho de
// viralidade (Contagious). O arquivo organizado/listado continua sendo o
// diferencial pago (ver /minha-conta), não o link individual em si.
import SiteLayout from '../../components/SiteLayout';
import { createAdminClient } from '../../lib/supabase/adminClient';
import { renderNewsletter } from '../../lib/newsletter/render';

export async function getServerSideProps({ params }) {
  const admin = createAdminClient();
  const { data: newsletter } = await admin
    .from('newsletters')
    .select('id, title, subject, preheader, content_html, hero_image_url, sent_at, status')
    .eq('id', params.id)
    .eq('status', 'sent')
    .maybeSingle();

  if (!newsletter) return { notFound: true };

  // Leitor público/anônimo — sem nome para personalizar.
  const bodyHtml = renderNewsletter(newsletter.content_html, { nome: '', email: '' });

  return { props: { newsletter: { ...newsletter, bodyHtml } } };
}

export default function EdicaoPublicaPage({ newsletter }) {
  const dataFormatada = newsletter.sent_at
    ? new Date(newsletter.sent_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  return (
    <SiteLayout title={`${newsletter.title} — Sem Mimimi`} description={newsletter.preheader || newsletter.subject}>
      <section className="tight">
        <article className="wrap" style={{ maxWidth: 680 }}>
          <span className="eyebrow">{dataFormatada}</span>
          <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)' }}>{newsletter.title}</h1>

          {newsletter.hero_image_url && (
            <img src={newsletter.hero_image_url} alt="" style={{ width: '100%', height: 'auto', margin: '20px 0', display: 'block' }} />
          )}

          <div
            style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--dim)' }}
            dangerouslySetInnerHTML={{ __html: newsletter.bodyHtml }}
          />

          <div style={{ borderTop: '1px solid var(--line)', marginTop: 40, paddingTop: 28, textAlign: 'center' }}>
            <p className="lede" style={{ marginBottom: 16 }}>
              Essa edição chegou pronta na caixa de quem assina — no dia certo, sem esperar alguém compartilhar.
            </p>
            <a href="/assinar" className="btn">
              Quero ser assinante
            </a>
          </div>
        </article>
      </section>
    </SiteLayout>
  );
}
