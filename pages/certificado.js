import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SiteLayout from '../components/SiteLayout';
import {
  drawCertificate,
  canvasToPdfBlob,
  certCode,
  dataPorExtenso,
  getFontFamilies,
  loadFonts,
} from '../lib/certificate/draw';

// Página pública /certificado — o leitor digita o nome e baixa o próprio certificado
// ("Turma Sem Mimimi"). Tudo acontece no navegador: nenhum nome é enviado ou salvo.
//
// Ideias de persuasão aplicadas (resumo em cada bloco):
//  - Cialdini (Pré-suasão/Unidade): o certificado vem ANTES do pedido de assinatura; o orgulho
//    de pertencer prepara o "sim". "Turma" e "você não está sozinho" reforçam o nós.
//  - Berger (Palavras Mágicas): identidade em substantivo ("LEITOR da Turma"), não só verbo.
//  - Donald Miller (StoryBrand): o leitor é o herói; o Sem Mimimi é o guia.
//  - Adam Grant (Dar e Receber): o link de convite carrega o nome de quem convidou.
//  - Sugarman (escorregador): cada bloco termina empurrando para o próximo passo.
//  - Voss (rótulo emocional): "Parece que você está cansado de notícia mastigada."

const TITULOS = [
  { id: 'leitor', label: 'Leitor(a) — quem lê o contexto' },
  { id: 'embaixador', label: 'Embaixador(a) — quem espalha' },
  { id: 'apoiador', label: 'Apoiador(a) — quem sustenta' },
];

function primeiroNome(n) {
  return (n || '').trim().split(/\s+/)[0] || '';
}

export default function CertificadoPage() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [nome, setNome] = useState('');
  const [titulo, setTitulo] = useState('leitor');
  const [genero, setGenero] = useState('f');
  const [fontsReady, setFontsReady] = useState(false);
  const [convidadoPor, setConvidadoPor] = useState('');
  const [baixou, setBaixou] = useState(false);
  const [aviso, setAviso] = useState('');
  const fontsRef = useRef(null);

  const hoje = useMemo(() => new Date(), []);
  const dataStr = useMemo(() => dataPorExtenso(hoje), [hoje]);
  const nomeLimpo = nome.trim().replace(/\s+/g, ' ');
  const pronto = nomeLimpo.length >= 2;

  // lê ?nome= e ?de= da URL (link de convite)
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query;
    if (typeof q.nome === 'string') setNome(q.nome.slice(0, 60));
    if (typeof q.de === 'string') setConvidadoPor(q.de.slice(0, 30));
  }, [router.isReady, router.query]);

  // carrega as fontes uma vez
  useEffect(() => {
    let vivo = true;
    (async () => {
      fontsRef.current = getFontFamilies();
      await loadFonts(fontsRef.current);
      if (vivo) setFontsReady(true);
    })();
    return () => {
      vivo = false;
    };
  }, []);

  // redesenha ao vivo
  useEffect(() => {
    if (!fontsReady || !canvasRef.current) return;
    drawCertificate(
      canvasRef.current,
      {
        nome: pronto ? nomeLimpo : '',
        titulo,
        genero,
        dataStr,
        codigo: certCode(pronto ? nomeLimpo : 'SEM MIMIMI', hoje.getFullYear()),
      },
      fontsRef.current
    );
  }, [fontsReady, nomeLimpo, pronto, titulo, genero, dataStr, hoje]);

  const arquivoBase = `certificado-sem-mimimi-${nomeLimpo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;

  function baixarBlob(blob, nomeArquivo) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function baixarPng() {
    if (!pronto) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        baixarBlob(blob, `${arquivoBase}.png`);
        setBaixou(true);
      }
    }, 'image/png');
  }

  function baixarPdf() {
    if (!pronto) return;
    baixarBlob(canvasToPdfBlob(canvasRef.current), `${arquivoBase}.pdf`);
    setBaixou(true);
  }

  function linkDeConvite() {
    const base = `${window.location.origin}/certificado`;
    const de = primeiroNome(nomeLimpo);
    return de ? `${base}?de=${encodeURIComponent(de)}` : base;
  }

  const textoConvite = () =>
    `Acabei de pegar meu certificado da Turma Sem Mimimi 😎 Quem lê Brasília sem pano quente merece um. Pega o seu em 10 segundos (de graça):`;

  function whatsapp() {
    const url = `https://wa.me/?text=${encodeURIComponent(`${textoConvite()} ${linkDeConvite()}`)}`;
    window.open(url, '_blank', 'noopener');
    setBaixou(true);
  }

  async function compartilhar() {
    if (!pronto) return;
    const link = linkDeConvite();
    try {
      const blob = await new Promise((res) => canvasRef.current.toBlob(res, 'image/png'));
      const file = new File([blob], `${arquivoBase}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: `${textoConvite()} ${link}` });
        setBaixou(true);
        return;
      }
      if (navigator.share) {
        await navigator.share({ text: textoConvite(), url: link });
        setBaixou(true);
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    copiarLink();
  }

  async function copiarLink() {
    const link = linkDeConvite();
    try {
      await navigator.clipboard.writeText(link);
      setAviso('Link copiado! Cole onde quiser.');
    } catch (e) {
      setAviso(link);
    }
    setTimeout(() => setAviso(''), 4000);
  }

  return (
    <SiteLayout
      title="Pegue seu certificado da Turma Sem Mimimi"
      description="Digite seu nome e baixe, de graça, o certificado de quem lê Brasília sem pano quente."
      ogTitle="Pegue o seu certificado da Turma Sem Mimimi"
      ogDescription="Quem lê Brasília sem pano quente merece um certificado. Leva 10 segundos."
      active="certificado"
    >
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
            Parece que você cansou de notícia mastigada. A gente também. Digite seu nome e leve,
            de graça, o certificado de quem prefere entender a história inteira.
          </p>
        </div>
      </section>

      <section className="tight cert-tool">
        <div className="wrap cert-grid">
          <div className="cert-form">
            <span className="eyebrow">Passo 1</span>
            <h2 style={{ fontSize: '1.5rem' }}>Como você quer ser chamado(a)?</h2>

            <div className="form-field">
              <label htmlFor="cert-nome">Seu nome completo</label>
              <input
                id="cert-nome"
                type="text"
                value={nome}
                maxLength={60}
                autoComplete="name"
                placeholder="Ex.: Maria da Silva"
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="cert-titulo">Seu título na turma</label>
              <select id="cert-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)}>
                {TITULOS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="cert-seg" role="group" aria-label="Forma de tratamento">
              <button
                type="button"
                className={genero === 'f' ? 'on' : ''}
                onClick={() => setGenero('f')}
              >
                Leitora / a
              </button>
              <button
                type="button"
                className={genero === 'm' ? 'on' : ''}
                onClick={() => setGenero('m')}
              >
                Leitor / o
              </button>
            </div>

            <span className="eyebrow" style={{ marginTop: 28 }}>
              Passo 2
            </span>
            <h2 style={{ fontSize: '1.5rem' }}>Leve o seu</h2>
            <div className="cert-actions">
              <button type="button" className="btn" onClick={baixarPng} disabled={!pronto}>
                Baixar imagem (PNG)
              </button>
              <button type="button" className="btn ghost" onClick={baixarPdf} disabled={!pronto}>
                Baixar PDF (A4)
              </button>
            </div>
            {!pronto && <p className="cert-hint">Digite seu nome para liberar o download.</p>}

            <span className="eyebrow" style={{ marginTop: 28 }}>
              Passo 3
            </span>
            <h2 style={{ fontSize: '1.5rem' }}>Chame a sua turma</h2>
            <p className="cert-hint" style={{ marginTop: 0 }}>
              Quem pega o certificado sozinho, guarda. Quem manda para um amigo, começa uma
              turma. O link leva seu primeiro nome, para ninguém achar que é spam.
            </p>
            <div className="cert-actions">
              <button type="button" className="btn" onClick={whatsapp} disabled={!pronto}>
                Mandar no WhatsApp
              </button>
              <button type="button" className="btn ghost" onClick={compartilhar} disabled={!pronto}>
                Compartilhar
              </button>
              <button type="button" className="btn ghost" onClick={copiarLink}>
                Copiar link
              </button>
            </div>
            {aviso && <p className="cert-toast" role="status">{aviso}</p>}
            <p className="cert-fine">
              Seu nome fica só no seu aparelho: nada é enviado nem guardado. O certificado é um
              símbolo da comunidade, sem valor oficial.
            </p>
          </div>

          <div className="cert-preview">
            <canvas
              ref={canvasRef}
              className="cert-canvas"
              aria-label={`Prévia do certificado${pronto ? ` de ${nomeLimpo}` : ''}`}
            />
            {!fontsReady && <p className="cert-hint">Preparando o certificado…</p>}
          </div>
        </div>
      </section>

      <section className={`cert-cta${baixou ? ' on' : ''}`}>
        <div className="wrap">
          <span className="eyebrow">{baixou ? 'Seu certificado está na mão' : 'Falta só uma coisa'}</span>
          <h2 style={{ fontSize: 'clamp(1.5rem,4vw,2.1rem)', maxWidth: '22ch' }}>
            Agora receba o que justifica o certificado.
          </h2>
          <p className="lede" style={{ marginBottom: 22 }}>
            Toda quarta e sexta, Tiago Pavinatto descasca o que acontece em Brasília, sem
            pano quente, em cinco minutos de leitura. Você já é da turma. Falta só entrar na
            lista.
          </p>
          <div className="cta-row">
            <Link href="/edicao-exemplo" className="btn ghost">
              Ler uma edição grátis
            </Link>
            <Link href="/assinar" className="btn">
              Quero receber toda semana
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
