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
  const contentImageInputRef = useRef(null);
  const savedRangeRef = useRef(null);
  const mountedRef = useRef(false);

  const [id, setId] = useState(initialNewsletter?.id || null);
  const [title, setTitle] = useState(initialNewsletter?.title || '');
  const [subject, setSubject] = useState(initialNewsletter?.subject || '');
  const [subjectB, setSubjectB] = useState(initialNewsletter?.subject_b || '');
  const [preheader, setPreheader] = useState(initialNewsletter?.preheader || '');
  const [heroImageUrl, setHeroImageUrl] = useState(initialNewsletter?.hero_image_url || '');
  const [whyItMatters, setWhyItMatters] = useState(initialNewsletter?.why_it_matters || '');
  const [status, setStatus] = useState(initialNewsletter?.status || 'draft');

  const [wordCount, setWordCount] = useState(0);
  const [hasImage, setHasImage] = useState(false);

  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewed, setPreviewed] = useState(false);

  const [testEmail, setTestEmail] = useState(adminUser?.email || '');
  const [sendingTest, setSendingTest] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const [scheduledAt, setScheduledAt] = useState('');
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [recipientCountPreview, setRecipientCountPreview] = useState(null);
  const [sending, setSending] = useState(false);

  const [dialog, setDialog] = useState(null); // { type, values, hasSel }

  const [showGuide, setShowGuide] = useState(true);
  useEffect(() => {
    try {
      setShowGuide(window.localStorage.getItem('sm_hide_newsletter_guide') !== '1');
    } catch {
      // localStorage indisponível (ex.: modo privado) — deixa o guia visível.
    }
  }, []);
  function toggleGuide() {
    setShowGuide((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem('sm_hide_newsletter_guide', next ? '0' : '1');
      } catch {
        // ignora
      }
      return next;
    });
  }

  useEffect(() => {
    if (editorRef.current && initialNewsletter?.content_html) {
      editorRef.current.innerHTML = initialNewsletter.content_html;
    }
    updateReadingTime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNewsletter]);

  // Qualquer edição = "alterações não salvas" e exige rever prévia/teste de novo.
  function markDirty() {
    setDirty(true);
    setPreviewed(false);
    setTestSent(false);
  }
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    markDirty();
  }, [title, subject, subjectB, preheader, heroImageUrl, whyItMatters]);

  // Avisa antes de fechar a aba com alterações não salvas.
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Mensagem de sucesso some sozinha; erro fica até o usuário fechar.
  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => setMessage(''), 7000);
    return () => clearTimeout(t);
  }, [message]);

  function exec(command, value = null) {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    saveSelection();
    markDirty();
    updateReadingTime();
  }

  // Como formatBlock (Título/Subtítulo/Texto normal) cria <h2>/<h3>/<p> "puros",
  // sem tamanho de fonte definido, alguns clientes de e-mail (Outlook em especial,
  // e às vezes o Gmail) ignoram o tamanho padrão do navegador e mostram tudo do
  // mesmo tamanho pequeno. Por isso aplicamos o estilo direto no elemento depois
  // do comando, em vez de confiar no tamanho padrão do H2/H3/P.
  function execFormatBlock(tag, styleString) {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand('formatBlock', false, tag);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node = sel.anchorNode;
      if (node && node.nodeType === 3) node = node.parentElement;
      const block = node ? node.closest(tag.toLowerCase()) : null;
      if (block && editorRef.current && editorRef.current.contains(block)) {
        block.setAttribute('style', styleString);
      }
    }
    saveSelection();
    markDirty();
    updateReadingTime();
  }

  function insertHtml(html) {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand('insertHTML', false, html);
    saveSelection();
    markDirty();
    updateReadingTime();
  }

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current && editorRef.current.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    if (!savedRangeRef.current) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRangeRef.current);
  }

  function updateReadingTime() {
    const el = editorRef.current;
    const text = (el?.innerText || '').trim();
    setWordCount(text ? text.split(/\s+/).length : 0);
    setHasImage(!!el?.querySelector('img'));
  }

  function scrollToField(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => el.focus?.(), 300);
  }

  // Colar sempre como texto puro: evita a "sujeira" de formatação do Word/Google Docs/site.
  function handlePaste(e) {
    const text = e.clipboardData?.getData('text/plain');
    if (!text) return;
    e.preventDefault();
    saveSelection();
    if (!/\n/.test(text.trim())) {
      editorRef.current?.focus();
      restoreSelection();
      document.execCommand('insertText', false, text);
      saveSelection();
      markDirty();
      updateReadingTime();
      return;
    }
    const html = text
      .trim()
      .split(/\r?\n+/)
      .filter((line) => line.trim())
      .map((line) => `<p style="font-family:Georgia, 'Times New Roman', serif; font-size:17px; line-height:1.6; color:#6f6252; margin:0 0 16px;">${escapeHtml(line)}</p>`)
      .join('');
    insertHtml(html);
  }

  // ---------- Janelas de inserção (no lugar dos prompts do navegador) ----------
  function openDialog(type) {
    saveSelection();
    const sel = window.getSelection();
    const hasSel = !!(
      sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRef.current && editorRef.current.contains(sel.anchorNode)
    );
    const defaults = {
      link: { url: '', text: 'clique aqui' },
      button: { text: 'SAIBA MAIS', url: '' },
      image: { url: '' },
      youtube: { url: '', title: 'Assista ao vídeo de hoje' },
    };
    setDialog({ type, values: defaults[type], hasSel });
  }
  function setDialogValue(key, value) {
    setDialog((d) => ({ ...d, values: { ...d.values, [key]: value } }));
  }

  function submitDialog() {
    if (!dialog) return;
    const { type, values, hasSel } = dialog;
    const url = normalizeUrl(values.url);
    if (!url) {
      setError('Cole o endereço (URL) para continuar.');
      return;
    }
    setError('');

    if (type === 'link') {
      if (hasSel) {
        exec('createLink', url);
      } else {
        const texto = escapeHtml((values.text || '').trim() || url);
        insertHtml(`<a href="${escapeAttr(url)}" style="color:#d9591a; text-decoration:underline;">${texto}</a>`);
      }
    } else if (type === 'button') {
      const texto = escapeHtml((values.text || '').trim() || 'SAIBA MAIS');
      insertHtml(
        `<p style="text-align:center; margin:24px 0;"><a href="${escapeAttr(url)}" style="display:inline-block; background:#d9591a; color:#fbf6ee; font-family:Arial,sans-serif; font-weight:bold; text-transform:uppercase; letter-spacing:1px; font-size:13px; padding:14px 26px; text-decoration:none;">${texto}</a></p>`
      );
    } else if (type === 'image') {
      insertHtml(`<img src="${escapeAttr(url)}" alt="" style="max-width:100%; display:block; margin:16px 0;" />`);
    } else if (type === 'youtube') {
      const videoId = extractYoutubeId(url);
      if (!videoId) {
        setError('Não consegui reconhecer esse link do YouTube. Copie o endereço direto da barra do navegador.');
        return;
      }
      const tituloVideo = escapeHtml((values.title || '').trim());
      const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      insertHtml(`
        <div style="margin:28px 0; text-align:center;">
          <h3 style="margin:0 0 14px;">${tituloVideo}</h3>
          <a href="https://www.youtube.com/watch?v=${videoId}" style="display:block; position:relative; margin:0 0 14px;">
            <img src="${thumb}" alt="" style="max-width:100%; display:block;" />
          </a>
          <a href="https://www.youtube.com/watch?v=${videoId}" style="display:inline-block; background:#d9591a; color:#fbf6ee; font-family:Arial,sans-serif; font-weight:bold; text-transform:uppercase; letter-spacing:1px; font-size:13px; padding:14px 26px; text-decoration:none;">ASSISTIR NO YOUTUBE</a>
        </div>
      `);
    }
    setDialog(null);
  }

  function handleSeparator() {
    insertHtml('<hr style="border:none; border-top:1px solid #e2d5bd; margin:28px 0;" />');
  }
  function handleQuote() {
    insertHtml('<blockquote style="border-left:3px solid #d9591a; margin:20px 0; padding:4px 0 4px 16px; font-family:Georgia, \'Times New Roman\', serif; font-size:17px; line-height:1.6; color:#6f6252; font-style:italic;">Cite algo aqui</blockquote>');
  }
  function handleDestaque() {
    insertHtml('<div style="background:#f4ecdd; border-left:3px solid #d9591a; padding:14px 18px; margin:20px 0;"><strong>Destaque:</strong> escreva aqui o resumo em 1-2 frases.</div>');
  }
  function handleNomeLeitor() {
    insertHtml('{{nome}}');
  }

  // ---------- Upload de imagens ----------
  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setError('');
    setUploading(true);
    const path = `hero/${Date.now()}-${safeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from('newsletter-media').upload(path, file);
    setUploading(false);
    if (uploadError) {
      setError('Não consegui enviar a imagem: ' + uploadError.message);
      return;
    }
    const { data } = supabase.storage.from('newsletter-media').getPublicUrl(path);
    setHeroImageUrl(data.publicUrl);
  }

  async function handleContentImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // permite selecionar o mesmo arquivo de novo depois
    setError('');
    setUploading(true);
    const path = `content/${Date.now()}-${safeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from('newsletter-media').upload(path, file);
    setUploading(false);
    if (uploadError) {
      setError('Não consegui enviar a imagem: ' + uploadError.message);
      return;
    }
    const { data } = supabase.storage.from('newsletter-media').getPublicUrl(path);
    insertHtml(`<img src="${escapeAttr(data.publicUrl)}" alt="" style="max-width:100%; display:block; margin:16px 0;" />`);
    setDialog(null);
  }

  // ---------- Validação amigável ----------
  const hasContent = wordCount > 0 || hasImage;
  const readingMinutes = wordCount ? Math.max(1, Math.round(wordCount / 200)) : 0;
  const effectiveTitle = title.trim() || subject.trim();

  // Retorna true se pode seguir; senão mostra o que falta e leva o usuário até o campo.
  function checkRequired() {
    if (!subject.trim()) {
      setError('Falta o assunto do e-mail. É a primeira coisa que o leitor vê.');
      scrollToField('field-subject');
      return false;
    }
    if (!hasContent) {
      setError('O e-mail está sem conteúdo. Escreva algo na caixa do passo 2.');
      scrollToField('field-content');
      editorRef.current?.focus();
      return false;
    }
    return true;
  }

  function getContentHtml() {
    return editorRef.current?.innerHTML || '';
  }

  async function saveDraft() {
    if (!checkRequired()) return null;
    setSaving(true);
    setError('');
    setMessage('');
    let savedId = null;
    try {
      const headers = { 'Content-Type': 'application/json', ...(await authHeader(supabase)) };
      const res = await fetch('/api/newsletter/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id,
          title: effectiveTitle,
          subject,
          subject_b: subjectB,
          preheader,
          hero_image_url: heroImageUrl,
          why_it_matters: whyItMatters,
          content_html: getContentHtml(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Não consegui salvar. Tente de novo.');
      } else {
        savedId = data.newsletter.id;
        setId(savedId);
        setStatus(data.newsletter.status);
        setDirty(false);
        setLastSavedAt(new Date());
        setMessage('Rascunho salvo.');
        if (!router.query.id) {
          router.replace(`/admin/newsletters/nova?id=${savedId}`, undefined, { shallow: true });
        }
      }
    } catch (err) {
      setError('Sem conexão. Confira sua internet e tente salvar de novo.');
    }
    setSaving(false);
    return savedId;
  }

  async function handlePreview() {
    if (!hasContent) {
      checkRequired();
      return;
    }
    setError('');
    const headers = { 'Content-Type': 'application/json', ...(await authHeader(supabase)) };
    const res = await fetch('/api/newsletter/preview', {
      method: 'POST',
      headers,
      body: JSON.stringify({ id, title: effectiveTitle, preheader, hero_image_url: heroImageUrl, why_it_matters: whyItMatters, content_html: getContentHtml() }),
    });
    const data = await res.json();
    if (res.ok) {
      setPreviewHtml(data.html);
      setShowPreview(true);
      setPreviewed(true);
    } else {
      setError(data.error || 'Não consegui gerar a prévia.');
    }
  }

  async function handleSendTest() {
    if (!checkRequired()) return;
    if (!testEmail) {
      setError('Digite o e-mail que vai receber o teste.');
      scrollToField('field-test-email');
      return;
    }
    setSendingTest(true);
    setError('');
    setMessage('');
    try {
      const headers = { 'Content-Type': 'application/json', ...(await authHeader(supabase)) };
      const res = await fetch('/api/newsletter/send-test', {
        method: 'POST',
        headers,
        body: JSON.stringify({ toEmail: testEmail, id, title: effectiveTitle, subject, preheader, hero_image_url: heroImageUrl, why_it_matters: whyItMatters, content_html: getContentHtml() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Não consegui enviar o teste.');
      } else {
        setTestSent(true);
        setMessage(`Teste enviado para ${testEmail}. Abra seu e-mail e confira (olhe também o spam).`);
      }
    } catch {
      setError('Sem conexão ao enviar o teste.');
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
        setError(data.error || 'Não consegui enviar.');
      } else {
        setStatus('sent');
        setMessage(`Enviada para ${data.recipientCount} assinantes.`);
        setShowSendConfirm(false);
      }
    } catch {
      setError('Sem conexão ao enviar.');
    }
    setSending(false);
  }

  async function confirmSchedule() {
    if (!scheduledAt) {
      setError('Escolha o dia e a hora do envio.');
      return;
    }
    if (new Date(scheduledAt).getTime() <= Date.now()) {
      setError('Essa data já passou. Escolha um horário no futuro.');
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
        setError(data.error || 'Não consegui agendar.');
      } else {
        setStatus('scheduled');
        setMessage('Newsletter agendada.');
        setShowSendConfirm(false);
      }
    } catch {
      setError('Sem conexão ao agendar.');
    }
    setSending(false);
  }

  function pickQuickTime(hour, daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, 0, 0, 0);
    setScheduledAt(toLocalInput(d));
  }

  const saveLabel = saving
    ? 'Salvando…'
    : dirty
      ? 'Alterações não salvas'
      : lastSavedAt
        ? `Salvo às ${lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        : id
          ? 'Tudo salvo'
          : 'Ainda não salvo';

  const checklist = [
    { ok: !!subject.trim(), label: 'Assunto preenchido', required: true, go: () => scrollToField('field-subject') },
    { ok: hasContent, label: 'Conteúdo escrito', required: true, go: () => scrollToField('field-content') },
    { ok: previewed, label: 'Prévia conferida', go: handlePreview },
    { ok: testSent, label: 'Teste enviado e conferido', go: () => scrollToField('field-test-email') },
  ];

  return (
    <AdminLayout title={id ? 'Editar newsletter' : 'Nova newsletter'} adminUser={adminUser}>
      <div className="edit-bar">
        <span className={`save-status${dirty ? ' dirty' : ''}`}>{saveLabel}</span>
        <div className="edit-bar-actions">
          <button className="admin-btn secondary" onClick={saveDraft} disabled={saving}>
            Salvar
          </button>
          <button className="admin-btn secondary" onClick={handlePreview}>
            👁 Visualizar
          </button>
          <button className="admin-btn secondary" onClick={() => scrollToField('send-section')}>
            Ir para o envio ↓
          </button>
        </div>
      </div>

      {status !== 'draft' && (
        <div className="admin-alert" style={{ marginBottom: 20 }}>
          Status atual: <strong>{STATUS_LABEL[status] || status}</strong>
          {status === 'sent' && ' — esta newsletter já foi enviada e não pode ser reenviada por aqui.'}
        </div>
      )}

      <div className="toast-area">
        {error && (
          <div className="admin-alert error toast">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} aria-label="Fechar aviso">×</button>
          </div>
        )}
        {message && (
          <div className="admin-alert success toast">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')} aria-label="Fechar aviso">×</button>
          </div>
        )}
      </div>

      <div className="guide-box">
        <button type="button" className="guide-title" onClick={toggleGuide}>
          <span>💡 Como preencher esta página (3 passos)</span>
          <span>{showGuide ? 'ocultar' : 'mostrar'}</span>
        </button>
        {showGuide && (
          <ol>
            <li>
              <strong>Passo 1 — Informações básicas.</strong> Só o <strong>assunto</strong> é obrigatório. Ele e o
              pré-header aparecem na caixa de entrada do leitor — logo abaixo você vê uma simulação.
            </li>
            <li>
              <strong>Passo 2 — Escreva o conteúdo.</strong> Digite ou cole seu texto na caixa e edite depois. Para
              colocar link, imagem ou botão, use os botões acima dela: cada um abre uma janelinha que pergunta o que
              precisa.
            </li>
            <li>
              <strong>Passo 3 — Confira e envie.</strong> Siga a lista: veja a prévia, mande um teste pra você e só
              então use <strong>Agendar / Enviar</strong>.
            </li>
          </ol>
        )}
      </div>

      <div className="step-section">
        <div className="step-head">
          <span className="step-num">1</span>
          <div>
            <h2>Informações básicas</h2>
            <p>O que o leitor vê antes mesmo de abrir o e-mail.</p>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="field-subject">Assunto do e-mail (A) *</label>
          <input id="field-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="O que ninguém te contou sobre..." />
          <Counter value={subject} ideal={60} />
        </div>

        <div className="form-field">
          <label htmlFor="field-preheader">Pré-header (opcional)</label>
          <input id="field-preheader" value={preheader} onChange={(e) => setPreheader(e.target.value)} placeholder="Uma frase curta que complementa o assunto" />
          <Counter value={preheader} ideal={100} />
        </div>

        <div className="inbox-preview" aria-label="Simulação da caixa de entrada">
          <span className="inbox-tag">Assim aparece na caixa de entrada do leitor</span>
          <div className="inbox-row">
            <span className="inbox-sender">Sem Mimimi</span>
            <span className="inbox-line">
              <b>{subject.trim() || 'Seu assunto aparece aqui'}</b>
              {preheader.trim() && <span className="inbox-pre"> — {preheader.trim()}</span>}
            </span>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="field-why">Por que isso importa (opcional — 1 tópico por linha)</label>
          <textarea
            id="field-why"
            rows={3}
            value={whyItMatters}
            onChange={(e) => setWhyItMatters(e.target.value)}
            placeholder={'O STF suspendeu o julgamento mais importante do ano\nUm banqueiro preso deixou 52 mensagens que ninguém explicou\nVocê não vai ver isso resumido em nenhum outro lugar'}
          />
          <div className="field-hint">
            <b>Vira um quadro em destaque</b> no topo do e-mail. Uma frase por linha. Pode deixar em branco.
          </div>
        </div>

        <div className="form-field">
          <label>Imagem principal (opcional)</label>
          {heroImageUrl ? (
            <div className="hero-preview">
              <img src={heroImageUrl} alt="" />
              <button type="button" className="admin-btn secondary" onClick={() => setHeroImageUrl('')}>
                Remover imagem
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <label className="admin-btn secondary" style={{ margin: 0, cursor: 'pointer' }}>
                {uploading ? 'Enviando…' : '📁 Escolher imagem do computador'}
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
              </label>
              <span className="field-hint" style={{ margin: 0 }}>ou cole um link:</span>
              <input
                style={{ flex: 1, minWidth: 220 }}
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}
          <div className="field-hint">
            <b>Aparece no topo do e-mail</b>, em largura total, antes do título.
          </div>
        </div>

        <details className="more-options">
          <summary>Opções avançadas (título interno e teste A/B)</summary>
          <div className="form-field" style={{ marginTop: 14 }}>
            <label htmlFor="field-title">Título interno</label>
            <input id="field-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Se deixar em branco, usamos o assunto" />
            <div className="field-hint">Só pra você se organizar na lista de newsletters — o assinante nunca vê.</div>
          </div>
          <div className="form-field">
            <label htmlFor="field-subject-b">Assunto B (ativa teste A/B)</label>
            <input id="field-subject-b" value={subjectB} onChange={(e) => setSubjectB(e.target.value)} placeholder="Deixe em branco para enviar só o assunto A" />
            <div className="field-hint">
              Se preencher, metade dos assinantes recebe o assunto A e metade o B. O resultado de cada um fica em{' '}
              <strong>Envios</strong>.
            </div>
          </div>
        </details>
      </div>

      <div className="step-section">
        <div className="step-head">
          <span className="step-num">2</span>
          <div>
            <h2>Escreva o conteúdo</h2>
            <p>
              O corpo do e-mail. Digite ou cole seu texto na caixa e edite depois
              {readingMinutes > 0 ? ` — ⏱️ leitura estimada: ${readingMinutes} min.` : '.'}
            </p>
          </div>
        </div>

        <ContentMapReminder />

        <div className="editor-toolbar" onMouseDown={(e) => { if (e.target.closest('button')) e.preventDefault(); }}>
          <div className="toolbar-group">
            <span className="toolbar-label">Formatar texto</span>
            <div className="toolbar-buttons">
              <button type="button" onClick={() => exec('bold')} title="Negrito: deixa o texto selecionado mais forte"><strong>N</strong></button>
              <button type="button" onClick={() => exec('italic')} title="Itálico: deixa o texto selecionado inclinado"><em>I</em></button>
              <button type="button" onClick={() => execFormatBlock('H2', 'font-family:Arial, sans-serif; font-size:24px; line-height:1.25; font-weight:bold; color:#2b2118; margin:26px 0 10px;')} title="Transforma a linha em título grande">Título</button>
              <button type="button" onClick={() => execFormatBlock('H3', 'font-family:Arial, sans-serif; font-size:19px; line-height:1.3; font-weight:bold; color:#2b2118; margin:22px 0 8px;')} title="Transforma a linha em título menor">Subtítulo</button>
              <button type="button" onClick={() => execFormatBlock('P', "font-family:Georgia, 'Times New Roman', serif; font-size:17px; line-height:1.6; color:#6f6252; margin:0 0 16px;")} title="Volta a linha para texto comum">Texto normal</button>
              <button type="button" onClick={() => exec('justifyLeft')} title="Alinhar à esquerda">⬅ Esquerda</button>
              <button type="button" onClick={() => exec('justifyCenter')} title="Centralizar">↔ Centro</button>
            </div>
          </div>

          <div className="toolbar-group">
            <span className="toolbar-label">Organizar</span>
            <div className="toolbar-buttons">
              <button type="button" onClick={() => exec('insertUnorderedList')} title="Lista com bolinhas">• Lista</button>
              <button type="button" onClick={() => exec('insertOrderedList')} title="Lista com números">1. Lista numerada</button>
              <button type="button" onClick={handleSeparator} title="Linha para separar assuntos">— Linha</button>
              <button type="button" onClick={handleQuote} title="Trecho citado, com barra lateral">❝ Citação</button>
              <button type="button" onClick={handleDestaque} title="Caixa colorida para o resumo">▣ Caixa de destaque</button>
            </div>
          </div>

          <div className="toolbar-group">
            <span className="toolbar-label">Inserir</span>
            <div className="toolbar-buttons">
              <button type="button" className="highlight" onClick={() => openDialog('link')} title="Transforma um texto em link clicável">🔗 Link</button>
              <button type="button" onClick={() => openDialog('button')} title="Botão grande e clicável (ex.: 'Leia a matéria')">🔘 Botão</button>
              <button type="button" onClick={() => openDialog('image')} title="Foto ou imagem dentro do texto">🖼 Imagem</button>
              <button type="button" onClick={() => openDialog('youtube')} title="Vídeo do YouTube com miniatura clicável">▶ Vídeo</button>
              <button type="button" onClick={handleNomeLeitor} title="Coloca o nome de cada assinante (vira 'Olá.' se ele não tiver nome)">👤 Nome do leitor</button>
            </div>
          </div>
        </div>
        <div
          id="field-content"
          ref={editorRef}
          className="editor-canvas"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Clique aqui e comece a escrever. Para formatar, selecione o texto e use os botões acima."
          tabIndex={0}
          onInput={() => { markDirty(); updateReadingTime(); }}
          onBlur={updateReadingTime}
          onPaste={handlePaste}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
        />
        <input
          type="file"
          accept="image/*"
          ref={contentImageInputRef}
          onChange={handleContentImageUpload}
          style={{ display: 'none' }}
        />
      </div>

      <div className="step-section" id="send-section">
        <div className="step-head">
          <span className="step-num">3</span>
          <div>
            <h2>Confira e envie</h2>
            <p>Siga a lista de cima para baixo. Cada item vira ✓ quando você faz.</p>
          </div>
        </div>

        <ul className="checklist">
          {checklist.map((item) => (
            <li key={item.label} className={item.ok ? 'ok' : ''}>
              <span className="check-mark">{item.ok ? '✓' : '○'}</span>
              <button type="button" className="check-label" onClick={item.go}>
                {item.label}
              </button>
              {!item.required && !item.ok && <span className="check-tag">recomendado</span>}
            </li>
          ))}
        </ul>

        <div className="send-steps">
          <div className="send-step">
            <div>
              <strong>A. Veja como fica</strong>
              <p>Abre a prévia exatamente como o leitor vai receber.</p>
            </div>
            <button className="admin-btn secondary" onClick={handlePreview}>👁 Visualizar</button>
          </div>

          <div className="send-step">
            <div style={{ flex: 1 }}>
              <strong>B. Mande um teste pra você</strong>
              <p>Já deixamos o seu e-mail preenchido. Confira no celular também.</p>
              <div style={{ display: 'flex', gap: 8, maxWidth: 460 }}>
                <input
                  id="field-test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="seuemail@email.com"
                  style={{ flex: 1, padding: '11px 12px', border: '1px solid var(--line)', background: 'var(--bg)', fontSize: '.98rem' }}
                />
                <button className="admin-btn secondary" onClick={handleSendTest} disabled={sendingTest}>
                  {sendingTest ? 'Enviando…' : 'Enviar teste'}
                </button>
              </div>
            </div>
          </div>

          <div className="send-step primary">
            <div>
              <strong>C. Envie para os assinantes</strong>
              <p>Você ainda poderá revisar tudo antes de confirmar.</p>
            </div>
            <button className="admin-btn" onClick={openSendConfirm} disabled={status === 'sent' || saving}>
              Agendar / Enviar
            </button>
          </div>
        </div>
      </div>

      {showPreview && (
        <Modal onClose={() => setShowPreview(false)} title="Prévia do e-mail">
          <iframe title="preview" srcDoc={previewHtml} style={{ width: '100%', height: '70vh', border: '1px solid var(--line)', background: '#fff' }} />
        </Modal>
      )}

      {dialog && (
        <Modal onClose={() => { setDialog(null); setError(''); }} title={DIALOG_TITLES[dialog.type]}>
          {dialog.type === 'image' && (
            <div className="form-field">
              <label>Opção 1 — foto do seu computador</label>
              <button type="button" className="admin-btn" onClick={() => contentImageInputRef.current?.click()} disabled={uploading}>
                {uploading ? 'Enviando…' : '📁 Escolher foto'}
              </button>
              <div className="field-hint">A foto entra no texto, onde o cursor estava.</div>
            </div>
          )}
          {dialog.type === 'link' && (
            <>
              <div className="form-field">
                <label htmlFor="dlg-url">Para onde o link leva?</label>
                <input id="dlg-url" autoFocus value={dialog.values.url} onChange={(e) => setDialogValue('url', e.target.value)} placeholder="https://..." onKeyDown={dlgEnter(submitDialog)} />
                <div className="field-hint">Cole o endereço do site. Se esquecer o https://, a gente coloca.</div>
              </div>
              {!dialog.hasSel && (
                <div className="form-field">
                  <label htmlFor="dlg-text">Texto que o leitor vai clicar</label>
                  <input id="dlg-text" value={dialog.values.text} onChange={(e) => setDialogValue('text', e.target.value)} onKeyDown={dlgEnter(submitDialog)} />
                </div>
              )}
              {dialog.hasSel && <div className="field-hint" style={{ marginBottom: 16 }}>O texto que você selecionou vai virar o link.</div>}
            </>
          )}
          {dialog.type === 'button' && (
            <>
              <div className="form-field">
                <label htmlFor="dlg-btn-text">O que está escrito no botão?</label>
                <input id="dlg-btn-text" autoFocus value={dialog.values.text} onChange={(e) => setDialogValue('text', e.target.value)} onKeyDown={dlgEnter(submitDialog)} />
              </div>
              <div className="form-field">
                <label htmlFor="dlg-url">Para onde o botão leva?</label>
                <input id="dlg-url" value={dialog.values.url} onChange={(e) => setDialogValue('url', e.target.value)} placeholder="https://..." onKeyDown={dlgEnter(submitDialog)} />
              </div>
            </>
          )}
          {dialog.type === 'image' && (
            <div className="form-field">
              <label htmlFor="dlg-url">Opção 2 — imagem que já está na internet</label>
              <input id="dlg-url" value={dialog.values.url} onChange={(e) => setDialogValue('url', e.target.value)} placeholder="https://..." onKeyDown={dlgEnter(submitDialog)} />
            </div>
          )}
          {dialog.type === 'youtube' && (
            <>
              <div className="form-field">
                <label htmlFor="dlg-url">Link do vídeo no YouTube</label>
                <input id="dlg-url" autoFocus value={dialog.values.url} onChange={(e) => setDialogValue('url', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." onKeyDown={dlgEnter(submitDialog)} />
              </div>
              <div className="form-field">
                <label htmlFor="dlg-yt-title">Chamada acima do vídeo</label>
                <input id="dlg-yt-title" value={dialog.values.title} onChange={(e) => setDialogValue('title', e.target.value)} onKeyDown={dlgEnter(submitDialog)} />
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="admin-btn" onClick={submitDialog}>
              {dialog.type === 'image' ? 'Inserir pelo link' : 'Inserir'}
            </button>
            <button className="admin-btn secondary" onClick={() => { setDialog(null); setError(''); }}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {showSendConfirm && (
        <Modal onClose={() => setShowSendConfirm(false)} title="Confirmar envio">
          <p>
            Você está prestes a enviar esta newsletter para <strong>{recipientCountPreview}</strong> assinantes.
          </p>
          <ul style={{ marginBottom: 20 }}>
            <li>
              <strong>Assunto A:</strong> {subject || '(sem assunto)'}
            </li>
            {subjectB && (
              <li>
                <strong>Assunto B:</strong> {subjectB} — teste A/B ativo, metade dos assinantes recebe cada variante.
              </li>
            )}
            <li>
              <strong>Remetente:</strong> Sem Mimimi
            </li>
          </ul>

          {(!testSent || !previewed) && (
            <div className="admin-alert" style={{ marginBottom: 20 }}>
              ⚠️ Atenção:{' '}
              {!testSent && !previewed
                ? 'você ainda não viu a prévia nem mandou um teste desta versão.'
                : !testSent
                  ? 'você ainda não mandou um teste desta versão.'
                  : 'você ainda não viu a prévia desta versão.'}{' '}
              Recomendamos fechar esta janela e conferir antes.
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <button className="admin-btn danger" onClick={confirmSendNow} disabled={sending}>
              {sending ? 'Enviando…' : `Enviar agora para ${recipientCountPreview} assinantes`}
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18 }}>
            <div className="form-field">
              <label>Ou agendar para</label>
              <div className="quick-times">
                <button type="button" className="admin-btn secondary" onClick={() => pickQuickTime(8, 1)}>Amanhã 8h</button>
                <button type="button" className="admin-btn secondary" onClick={() => pickQuickTime(12, 1)}>Amanhã 12h</button>
                <button type="button" className="admin-btn secondary" onClick={() => pickQuickTime(18, 1)}>Amanhã 18h</button>
              </div>
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

function Counter({ value, ideal }) {
  const n = value.length;
  return (
    <div className={`char-counter${n > ideal ? ' over' : ''}`}>
      {n}/{ideal} caracteres{n > ideal ? ' — pode ser cortado em alguns celulares' : ''}
    </div>
  );
}

// Mapa da escrita: o foco de conteúdo de cada dia de envio fixo (quarta e
// sexta), pra quem estiver escrevendo lembrar sem precisar abrir outro doc.
const MAPA_ESCRITA = {
  3: {
    dia: 'Quarta-feira',
    foco: 'Bastidores da Câmara, comissões da semana e o que esperar do STF.',
    objetivo: '"O que está acontecendo agora e o que você precisa prestar atenção hoje."',
  },
  5: {
    dia: 'Sexta-feira',
    foco: 'Análise das votações finais, vereditos do STF e os desdobramentos para a próxima semana.',
    objetivo: '"O balanço definitivo da semana política e o impacto no seu bolso/liberdade."',
  },
};

function ContentMapReminder() {
  const hoje = MAPA_ESCRITA[new Date().getDay()];
  return (
    <div className="guide-box" style={{ marginBottom: 16 }}>
      <div className="guide-title" style={{ cursor: 'default' }}>
        <span>🗺️ Mapa da escrita — foco de cada dia</span>
      </div>
      {hoje && (
        <p style={{ margin: '0 0 10px' }}>
          Hoje é <strong>{hoje.dia}</strong>: foco em {hoje.foco} Objetivo pro leitor: {hoje.objetivo}
        </p>
      )}
      {!hoje && (
        <p style={{ margin: '0 0 10px', fontStyle: 'italic' }}>
          Hoje não é dia de envio (quarta ou sexta). Veja abaixo o foco de cada edição pra se planejar com antecedência.
        </p>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.92rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '4px 8px 4px 0' }}>Dia</th>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Foco do conteúdo</th>
            <th style={{ textAlign: 'left', padding: '4px 0' }}>Objetivo pro leitor</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(MAPA_ESCRITA).map((row) => (
            <tr key={row.dia} style={hoje?.dia === row.dia ? { fontWeight: 'bold' } : undefined}>
              <td style={{ padding: '4px 8px 4px 0', verticalAlign: 'top' }}>{row.dia}</td>
              <td style={{ padding: '4px 8px', verticalAlign: 'top' }}>{row.foco}</td>
              <td style={{ padding: '4px 0', verticalAlign: 'top' }}>{row.objetivo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const STATUS_LABEL = { draft: 'rascunho', scheduled: 'agendada', sending: 'enviando', sent: 'enviada' };
const DIALOG_TITLES = { link: 'Inserir link', button: 'Inserir botão', image: 'Inserir imagem', youtube: 'Inserir vídeo do YouTube' };

function dlgEnter(fn) {
  return (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fn();
    }
  };
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}
function normalizeUrl(raw) {
  const v = (raw || '').trim();
  if (!v) return '';
  if (/^(https?:\/\/|mailto:)/i.test(v)) return v;
  return 'https://' + v;
}
function safeFileName(name) {
  const dot = name.lastIndexOf('.');
  const ext = dot > -1 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, '') : '';
  const base = (dot > -1 ? name.slice(0, dot) : name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .slice(0, 40);
  return (base || 'imagem') + ext;
}
function toLocalInput(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
