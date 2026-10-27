import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SiteLayout from '../components/SiteLayout';
import {
  TEMAS,
  drawCertificate,
  canvasToPdfBlob,
  dataPorExtenso,
  getFontFamilies,
  loadFonts,
} from '../lib/certificate/draw';

// /certificado — o leitor digita o CÓDIGO que recebeu e leva o certificado.
// O código (gerado em /admin/certificados) define o título: leitor, embaixador ou apoiador.
// Persuasão: Cialdini (pré-suasão/unidade: o orgulho vem antes do convite), Berger (identidade
// em substantivo), StoryBrand (o leitor é o herói), Grant (convite leva o nome de quem chamou),
// Sugarman (cada bloco empurra para o próximo), Voss (rótulo emocional no texto de abertura).

const CHAVE = 'sm_cert_codigo';
const ROTULOS = { leitor: 'Prata · Leitor(a)', embaixador: 'Ouro · Embaixador(a)', apoiador: 'Diamante · Apoiador(a)' };

const primeiroNome = (n) => (n || '').trim().split(/\s+/)[0] || '';
const guardar = (v) => {
  try { v ? localStorage.setItem(CHAVE, v) : localStorage.removeItem(CHAVE); } catch (e) { /* sem storage */ }
};
const lembrado = () => {
  try { return localStorage.getItem(CHAVE) || ''; } catch (e) { return ''; }
};

export default function CertificadoPage() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const fontsRef = useRef(null);
  const [fontsReady, setFontsReady] = useState(false);

  const [code, setCode] = useState('');
  const [nome, setNome] = useState('');
  const [genero, setGenero] = useState('f');
  const [modelo, setModelo] = useState('leitor'); // amostra exibida antes de resgatar
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [convidadoPor, setConvidadoPor] = useState('');
  const [baixou, setBaixou] = useState(false);
  const [aviso, setAviso] = useState('');

  const hoje = useMemo(() => new Date(), []);

  useEffect(() => {
    let vivo = true;
    (async () => {
      fontsRef.current = getFontFamilies();
      await loadFonts(fontsRef.current);
      if (vivo) setFontsReady(true);
    })();
    return () => { vivo = false; };
  }, []);

  async function chamarResgate(corpo, silencioso) {
    setErro('');
    setLoading(true);
    try {
      const r = await fetch('/api/certificate/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Não deu certo. Tente de novo.');
      setResultado(j);
      setModelo(j.titulo);
      guardar(j.codigo);
      return true;
    } catch (e) {
      if (!silencioso) setErro(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  // ?de= (convite), ?codigo= (link com código) e certificado já resgatado neste aparelho
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query;
    if (typeof q.de === 'string') setConvidadoPor(q.de.slice(0, 30));
    if (typeof q.codigo === 'string') setCode(q.codigo.slice(0, 20));
    const salvo = lembrado();
    if (salvo) chamarResgate({ code: salvo }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // desenho ao vivo: amostra (com o nome digitado) ou certificado real
  useEffect(() => {
    if (!fontsReady || !canvasRef.current) return;
    const host = typeof window !== 'undefined' ? window.location.host : '';
    if (resultado) {
      drawCertificate(
        canvasRef.current,
        {
          nome: resultado.nome,
          titulo: resultado.titulo,
          genero: resultado.genero,
          dataStr: dataPorExtenso(new Date(resultado.emitidoEm)),
          codigo: resultado.codigo,
          host,
        },
        fontsRef.current
      );
    } else {
      drawCertificate(
        canvasRef.current,
        { nome: nome.trim().length >= 2 ? nome : '', titulo: modelo, genero, dataStr: dataPorExtenso(hoje), codigo: '', host, amostra: true },
        fontsRef.current
      );
    }
  }, [fontsReady, resultado, modelo, nome, genero, hoje]);

  function liberar(e) {
    e.preventDefault();
    chamarResgate({ code, nome, genero }, false);
  }

  function trocarCodigo() {
    guardar('');
    setResultado(null);
    setCode('');
    setBaixou(false);
  }

  const cargoLabel = resultado ? TEMAS[resultado.titulo].cargo[resultado.genero] : '';
  const arquivoBase = resultado
    ? `certificado-sem-mimimi-${resultado.nome
        .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
    : 'certificado';

  function baixarBlob(blob, nomeArquivo) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nomeArquivo;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function baixarPng() {
    canvasRef.current.toBlob((b) => { if (b) { baixarBlob(b, `${arquivoBase}.png`); setBaixou(true); } }, 'image/png');
  }
  function baixarPdf() {
    baixarBlob(canvasToPdfBlob(canvasRef.current), `${arquivoBase}.pdf`);
    setBaixou(true);
  }

  const linkConvite = () => {
    const base = `${window.location.origin}/certificado`;
    const de = primeiroNome(resultado?.nome);
    return de ? `${base}?de=${encodeURIComponent(de)}` : base;
  };
  const linkVerificacao = () => `${window.location.origin}/certificado/verificar?codigo=${encodeURIComponent(resultado.codigo)}`;
  const textoConvite = () =>
    `Sou ${cargoLabel} da Turma Sem Mimimi 😎 Quem lê Brasília sem pano quente entra para a turma. Conheça:`;

  function whatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${textoConvite()} ${linkConvite()}`)}`, '_blank', 'noopener');
    setBaixou(true);
  }
  async function compartilhar() {
    try {
      const blob = await new Promise((res) => canvasRef.current.toBlob(res, 'image/png'));
      const file = new File([blob], `${arquivoBase}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: `${textoConvite()} ${linkConvite()}` });
        setBaixou(true);
        return;
      }
      if (navigator.share) {
        await navigator.share({ text: textoConvite(), url: linkConvite() });
        setBaixou(true);
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    copiar(linkConvite(), 'Link de convite copiado!');
  }
  async function copiar(texto, msg) {
    try { await navigator.clipboard.writeText(texto); setAviso(msg); } catch (e) { setAviso(texto); }
    setTimeout(() => setAviso(''), 4000);
  }

  return (
    <SiteLayout
      title="Pegue seu certificado da Turma Sem Mimimi"
      description="Tem um código? Digite e leve o certificado de quem lê Brasília sem pano quente."
      ogTitle="Pegue o seu certificado da Turma Sem Mimimi"
      ogDescription="Prata, ouro ou diamante: três níveis de certificado, um código para cada pessoa."
      active="certificado"
    >
      <div className="cert-page">
        <section className="hero cert-hero">
          <div className="wrap">
            {convidadoPor && (
              <div className="cert-invite">
                🎟️ <strong>{convidadoPor}</strong> te chamou para a Turma Sem Mimimi.
              </div>
            )}
            <span className="eyebrow">Para quem faz parte da turma</span>
            <h1>
              Seu nome na parede de quem lê Brasília <span className="hl">sem pano quente.</span>
            </h1>
            <p className="lede">
              Parece que você cansou de notícia mastigada. A gente também. Quem faz parte da
              turma recebe um código, e o código abre o certificado com o seu nome.
            </p>
          </div>
        </section>

        <section className="tight cert-tool">
          <div className="wrap cert-grid">
            <div className="cert-form">
              {!resultado ? (
                <>
                  <form className="cert-card" onSubmit={liberar}>
                    <h2>Digite o código que você recebeu</h2>
                    <p className="sub">
                      O código define o seu título e o seu nível: prata, ouro ou diamante. O nome que você digitar fica gravado nele, então confira antes de liberar.
                    </p>

                    <div className="form-field">
                      <label className="cert-label" htmlFor="cert-code">Código</label>
                      <input
                        id="cert-code" className="code" type="text" value={code} maxLength={20}
                        autoComplete="off" autoCapitalize="characters" placeholder="SM-XXXX-XXXX"
                        onChange={(e) => setCode(e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label className="cert-label" htmlFor="cert-nome">Seu nome completo</label>
                      <input
                        id="cert-nome" type="text" value={nome} maxLength={60} autoComplete="name"
                        placeholder="Ex.: Maria da Silva" onChange={(e) => setNome(e.target.value)}
                      />
                    </div>
                    <span className="cert-label">Como prefere ser tratado(a)</span>
                    <div className="cert-seg" role="group" aria-label="Forma de tratamento">
                      <button type="button" className={genero === 'f' ? 'on' : ''} onClick={() => setGenero('f')}>Feminino (a)</button>
                      <button type="button" className={genero === 'm' ? 'on' : ''} onClick={() => setGenero('m')}>Masculino (o)</button>
                    </div>

                    {erro && <p className="cert-error" role="alert">{erro}</p>}
                    <button className="btn" type="submit" disabled={loading || code.trim().length < 8 || nome.trim().length < 2}>
                      {loading ? 'Conferindo…' : 'Liberar meu certificado'}
                    </button>
                  </form>

                  <div className="cert-card soft">
                    <h2 style={{ fontSize: '1.2rem' }}>Ainda não tem código?</h2>
                    <p className="sub" style={{ marginBottom: 0 }}>
                      Os códigos são enviados pela equipe do Sem Mimimi a quem faz parte da turma. Enquanto isso, leia uma edição e entre na lista.
                    </p>
                    <div className="cert-links">
                      <Link href="/edicao-exemplo">Ler uma edição grátis</Link>
                      <Link href="/assinar">Assinar a newsletter</Link>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="cert-card">
                    <span className="cert-ok-badge">Certificado liberado</span>
                    <h2>
                      Pronto, {primeiroNome(resultado.nome)}. Você é {cargoLabel.toLowerCase()} da turma, nível {TEMAS[resultado.titulo].nivel.toLowerCase()}.
                    </h2>
                    <p className="sub">
                      {resultado.jaResgatado
                        ? 'Este código já tinha sido usado, então mostramos o certificado que ficou gravado nele.'
                        : 'Seu nome ficou gravado neste código. Baixe agora e guarde.'}
                    </p>
                    <div className="cert-actions">
                      <button type="button" className="btn" onClick={baixarPng}>Baixar imagem (PNG)</button>
                      <button type="button" className="btn neutral" onClick={baixarPdf}>Baixar PDF (A4)</button>
                    </div>

                    <h3>Chame a sua turma</h3>
                    <p className="sub" style={{ marginBottom: 'var(--s3)' }}>
                      Quem guarda o certificado sozinho, guarda. Quem mostra, começa uma turma. O convite leva o seu primeiro nome.
                    </p>
                    <div className="cert-actions">
                      <button type="button" className="btn neutral" onClick={whatsapp}>Mandar no WhatsApp</button>
                      <button type="button" className="btn neutral" onClick={compartilhar}>Compartilhar</button>
                      <button type="button" className="btn neutral" onClick={() => copiar(linkVerificacao(), 'Link de verificação copiado!')}>
                        Copiar link de verificação
                      </button>
                    </div>
                    {aviso && <p className="cert-toast" role="status">{aviso}</p>}
                    <p className="cert-fine">
                      O link de verificação prova que o certificado é verdadeiro: qualquer pessoa confere o nome e o título dele.
                      Para usar outro código,{' '}
                      <button type="button" onClick={trocarCodigo} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: 'var(--blue)', textDecoration: 'underline', cursor: 'pointer' }}>
                        clique aqui
                      </button>.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="cert-preview">
              <canvas
                ref={canvasRef}
                className="cert-canvas"
                aria-label={resultado ? `Certificado de ${resultado.nome}` : 'Amostra do certificado'}
              />
              {!resultado && (
                <>
                  <div className="cert-seg" role="group" aria-label="Modelos de certificado">
                    {Object.keys(TEMAS).map((t) => (
                      <button key={t} type="button" className={modelo === t ? 'on' : ''} onClick={() => setModelo(t)}>
                        {ROTULOS[t]}
                      </button>
                    ))}
                  </div>
                  <p className="cert-caption">Amostra: três níveis, cada um com um acabamento mais raro.</p>
                </>
              )}
              {!fontsReady && <p className="cert-caption">Preparando o certificado…</p>}
            </div>
          </div>
        </section>

        <section className="cert-cta" style={{ background: baixou ? 'var(--gold)' : undefined }}>
          <div className="wrap">
            <span className="eyebrow">{baixou ? 'Seu certificado está na mão' : 'O que justifica o certificado'}</span>
            <h2>Agora receba o que faz a turma existir.</h2>
            <p className="lede">
              Toda quarta e sexta, Tiago Pavinatto descasca o que acontece em Brasília, sem pano quente,
              em cinco minutos de leitura. Quem é da turma não fica de fora da lista.
            </p>
            <div className="cta-row">
              <Link href="/edicao-exemplo" className="btn neutral">Ler uma edição grátis</Link>
              <Link href="/assinar" className="btn">Quero receber toda semana</Link>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
