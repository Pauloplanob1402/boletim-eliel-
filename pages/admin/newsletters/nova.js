import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { requireAdmin } from '../../../lib/supabase/requireAdmin';
import { createAdminClient } from '../../../lib/supabase/adminClient';
import { createClient } from '../../../lib/supabase/browserClient';

export async function getServerSideProps(context) {
  const adminResult = await requireAdmin(context);
  if (adminResult.redirect) return adminResult;

  const { id } = context.query;
  let newsletter = null;
  if (id) {
    const admin = createAdminClient();
    const { data } = await admin.from('newsletters').select('*').eq('id', id).single();
    newsletter = data || null;
  }

  return { props: { adminUser: adminResult.props.adminUser, initialNewsletter: newsletter } };
}

async function authHeader(supabase) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session?.access_token}` };
}

export default function NovaNewsletterPage({ adminUser, initialNewsletter }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const editorRef = useRef(null);

  const [id, setId] = useState(initialNewsletter?.id || null);
  const [title, setTitle] = useState(initialNewsletter?.title || '');
  const [subject, setSubject] = useState(initialNewsletter?.subject || '');
  const [preheader, setPreheader] = useState(initialNewsletter?.preheader || '');
  const [heroImageUrl, setHeroImageUrl] = useState(initialNewsletter?.hero_image_url || '');
  const [status, setStatus] = useState(initialNewsletter?.status || 'draft');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const [scheduledAt, setScheduledAt] = useState('');
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [recipientCountPreview, setRecipientCountPreview] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (editorRef.current && initialNewsletter?.content_html) {
      editorRef.current.innerHTML = initialNewsletter.content_html;
    }
  }, [initialNewsletter]);

  function exec(command, value = null) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  }

  function insertHtml(html) {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, html);
  }

  function handleLink() {
    const url = window.prompt('URL do link:');
    if (url) exec('createLink', url);
  }

  function handleImage() {
    const url = window.prompt('URL https da imagem:');
    if (url) insertHtml(`<img src="${url}" alt="" style="max-width:100%; display:block; margin:16px 0;" />`);
  }

  function handleButton() {
    const texto = window.prompt('Texto do botão:', 'SAIBA MAIS');
    if (!texto) return;
    const url = window.prompt('URL do botão:');
    if (!url) return;
    insertHtml(
      `<p style="text-align:center; margin:24px 0;"><a href="${url}" style="display:inline-block; background:#d9591a; color:#fbf6ee; font-family:Arial,sans-serif; font-weight:bold; text-transform:uppercase; letter-spacing:1px; font-size:13px; padding:14px 26px; text-decoration:none;">${texto}</a></p>`
    );
  }

  function handleSeparator() {
    insertHtml('<hr style="border:none; border-top:1px solid #e2d5bd; margin:28px 0;" />');
  }

  function handleQuote() {
    insertHtml('<blockquote style="border-left:3px solid #d9591a; margin:20px 0; padding:4px 0 4px 16px; color:#6f6252; font-style:italic;">Cite algo aqui</blockquote>');
  }

  function handleYoutube() {
    const url = window.prompt('Link do vídeo no YouTube:');
    if (!url) return;
    const videoId = extractYoutubeId(url);
    if (!videoId) {
      window.alert('Não consegui identificar o ID do vídeo nesse link. Cole a URL completa do YouTube.');
      return;
    }
    const tituloVideo = window.prompt('Título/chamada para o vídeo:', 'Assista ao vídeo de hoje');
    const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    insertHtml(`
      <div style="margin:28px 0; text-align:center;">
        <h3 style="margin:0 0 14px;">${tituloVideo || ''}</h3>
        <a href="https://www.youtube.com/watch?v=${videoId}" style="display:block; position:relative; margin:0 0 14px;">
          <img src="${thumb}" alt="" style="max-width:100%; display:block;" />
        </a>
        <a href="https://www.youtube.com/watch?v=${videoId}" style="display:inline-block; background:#d9591a; color:#fbf6ee; font-family:Arial,sans-serif; font-weight:bold; text-transform:uppercase; letter-spacing:1px; font-size:13px; padding:14px 26px; text-decoration:none;">ASSISTIR NO YOUTUBE</a>
      </div>
    `);
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const path = `hero/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('newsletter-media').upload(path, file);
    if (uploadError) {
      setError('Falha ao enviar imagem: ' + uploadError.message);
      return;
    }
    const { data } = supabase.storage.from('newsletter-media').getPublicUrl(path);
    setHeroImageUrl(data.publicUrl);
  }

  function getContentHtml() {
    return editorRef.current?.innerHTML || '';
  }

  async function saveDraft() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const headers = { 'Content-Type': 'application/json', ...(await authHeader(supabase)) };
      const res = await fetch('/api/newsletter/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id,
          title,
          subject,
          preheader,
          hero_image_url: heroImageUrl,
          content_html: getContentHtml(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao salvar.');
      } else {
        setId(data.newsletter.id);
        setStatus(data.newsletter.status);
        setMessage('Rascunho salvo.');
        if (!router.query.id) {
          router.replace(`/admin/newsletters/nova?id=${data.newsletter.id}`, undefined, { shallow: true });
        }
      }
    } catch (err) {
      setError('Erro de conexão ao salvar.');
    }
    setSaving(false);
    return id;
  }

  async function handlePreview() {
    const headers = { 'Content-Type': 'application/json', ...(await authHeader(supabase)) };
    const res = await fetch('/api/newsletter/preview', {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, preheader, hero_image_url: heroImageUrl, content_html: getContentHtml() }),
    });
    const data = await res.json();
    if (res.ok) {
      setPreviewHtml(data.html);
      setShowPreview(true);
    } else {
      setError(data.error || 'Erro ao gerar prévia.');
    }
  }

  async function handleSendTest() {
    if (!testEmail) return;
    setSendingTest(true);
    setError('');
    setMessage('');
    try {
      const headers = { 'Content-Type': 'application/json', ...(await authHeader(supabase)) };
      const res = await fetch('/api/newsletter/send-test', {
        method: 'POST',
        headers,
        body: JSON.stringify({ toEmail: testEmail, title, subject, preheader, hero_image_url: heroImageUrl, content_html: getContentHtml() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao enviar teste.');
      } else {
        setMessage(`Teste enviado para ${testEmail}.`);
      }
    } catch {
      setError('Erro de conexão ao enviar teste.');
    }
    setSendingTest(false);
  }

  async function openSendConfirm() {
    setError('');
    const savedId = await saveDraft();
    if (!savedId) return;
    const { count } = await supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('receive_newsletter', true);
    setRecipientCountPreview(count || 0);
    setShowSendConfirm(true);
  }

  async function confirmSendNow() {
    setSending(true);
    setError('');
    try {
      const headers = { 'Content-Type': 'application/json', ...(await authHeader(supabase)) };
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers,
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao enviar.');
      } else {
        setStatus('sent');
        setMessage(`Enviada para ${data.recipientCount} assinantes.`);
        setShowSendConfirm(false);
      }
    } catch {
      setError('Erro de conexão ao enviar.');
    }
    setSending(false);
  }

  async function confirmSchedule() {
    if (!scheduledAt) {
      setError('Escolha data e hora para agendar.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const savedId = await saveDraft();
      if (!savedId) {
        setSending(false);
        return;
      }
      const headers = { 'Content-Type': 'application/json', ...(await authHeader(supabase)) };
      const res = await fetch('/api/newsletter/schedule', {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: savedId, scheduledAt: new Date(scheduledAt).toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao agendar.');
      } else {
        setStatus('scheduled');
        setMessage('Newsletter agendada.');
        setShowSendConfirm(false);
      }
    } catch {
      setError('Erro de conexão ao agendar.');
    }
    setSending(false);
  }

  return (
    <AdminLayout title={id ? 'Editar newsletter' : 'Nova newsletter'} adminUser={adminUser}>
      {status !== 'draft' && (
        <div className="admin-alert" style={{ marginBottom: 20 }}>
          Status atual: <strong>{status}</strong>
          {status === 'sent' && ' — esta newsletter já foi enviada e não pode ser reenviada por aqui.'}
        </div>
      )}

      {error && <div className="admin-alert error">{error}</div>}
      {message && <div className="admin-alert success">{message}</div>}

      <div className="form-row">
        <div className="form-field">
          <label>Título interno</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sem Mimimi — Edição #48" />
        </div>
        <div className="form-field">
          <label>Assunto do e-mail</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="O que ninguém te contou sobre..." />
        </div>
      </div>

      <div className="form-field">
        <label>Pré-header</label>
        <input value={preheader} onChange={(e) => setPreheader(e.target.value)} placeholder="Aparece ao lado do assunto na caixa de entrada" />
      </div>

      <div className="form-field">
        <label>Imagem principal</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            style={{ flex: 1, minWidth: 220 }}
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
            placeholder="https://... ou envie um arquivo →"
          />
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </div>
        {heroImageUrl && <img src={heroImageUrl} alt="" style={{ maxWidth: 260, marginTop: 10, display: 'block' }} />}
      </div>

      <div className="form-field">
        <label>Conteúdo</label>
        <div className="editor-toolbar">
          <button type="button" onClick={() => exec('bold')}><strong>N</strong></button>
          <button type="button" onClick={() => exec('italic')}><em>I</em></button>
          <button type="button" onClick={() => exec('formatBlock', 'H2')}>Título</button>
          <button type="button" onClick={() => exec('formatBlock', 'H3')}>Subtítulo</button>
          <button type="button" onClick={() => exec('formatBlock', 'P')}>Parágrafo</button>
          <button type="button" onClick={() => exec('insertUnorderedList')}>Lista</button>
          <button type="button" onClick={handleLink}>Link</button>
          <button type="button" onClick={handleButton}>Botão</button>
          <button type="button" onClick={handleImage}>Imagem</button>
          <button type="button" onClick={handleSeparator}>Separador</button>
          <button type="button" onClick={handleQuote}>Citação</button>
          <button type="button" onClick={() => exec('justifyLeft')}>Esq.</button>
          <button type="button" onClick={() => exec('justifyCenter')}>Centro</button>
          <button type="button" onClick={handleYoutube}>▶ YouTube</button>
        </div>
        <div ref={editorRef} className="editor-canvas" contentEditable suppressContentEditableWarning />
        <div className="trust-note" style={{ marginTop: 8 }}>
          Use {'{{nome}}'} em qualquer lugar do texto para personalizar com o nome do assinante (vira &quot;Olá.&quot; se ele não informou nome).
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
        <button className="admin-btn secondary" onClick={saveDraft} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar rascunho'}
        </button>
        <button className="admin-btn secondary" onClick={handlePreview}>
          Visualizar
        </button>
        <button className="admin-btn" onClick={openSendConfirm} disabled={status === 'sent'}>
          Agendar / Enviar
        </button>
      </div>

      <div style={{ marginTop: 28, maxWidth: 420 }}>
        <div className="form-field">
          <label>Enviar teste para</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="seuemail@email.com" />
            <button className="admin-btn secondary" onClick={handleSendTest} disabled={sendingTest || !testEmail}>
              {sendingTest ? 'Enviando…' : 'Enviar teste'}
            </button>
          </div>
        </div>
      </div>

      {showPreview && (
        <Modal onClose={() => setShowPreview(false)} title="Prévia do e-mail">
          <iframe title="preview" srcDoc={previewHtml} style={{ width: '100%', height: '70vh', border: '1px solid var(--line)', background: '#fff' }} />
        </Modal>
      )}

      {showSendConfirm && (
        <Modal onClose={() => setShowSendConfirm(false)} title="Confirmar envio">
          <p>
            Você está prestes a enviar esta newsletter para <strong>{recipientCountPreview}</strong> assinantes.
          </p>
          <ul style={{ marginBottom: 20 }}>
            <li>
              <strong>Assunto:</strong> {subject || '(sem assunto)'}
            </li>
            <li>
              <strong>Remetente:</strong> Sem Mimimi
            </li>
          </ul>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
            <button className="admin-btn danger" onClick={confirmSendNow} disabled={sending}>
              {sending ? 'Enviando…' : 'Confirmar envio agora'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18 }}>
            <div className="form-field">
              <label>Ou agendar para</label>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <button className="admin-btn secondary" onClick={confirmSchedule} disabled={sending}>
              {sending ? 'Agendando…' : 'Agendar envio'}
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(43,33,24,0.6)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 28, maxWidth: 640, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{title}</h2>
          <button className="admin-btn secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function extractYoutubeId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}
