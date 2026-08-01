# SemMimimi — Tiago Pavinatto

Site multi-página (HTML/CSS puro, sem build step) — mesmo formato do seu
repositório `boletim-eliel-`. O CSS vai embutido em cada página (`<style>`),
então o visual aparece igual em qualquer lugar, inclusive em previews que só
abrem um arquivo isolado.

## Identidade visual

Preto, vermelho, tipografia condensada e agressiva (Anton pros títulos,
Archivo pro corpo, IBM Plex Mono pros rótulos). Selo "SEM MIMIMI" rotacionado
como elemento de assinatura. Cards sem cantos arredondados, bordas duras,
zero suavidade — a estética segue o tom direto da marca.

## Estrutura

```
index.html              → Home — manifesto SemMimimi
perfil.html              → Perfil de Tiago Pavinatto
principios.html          → Biblioteca de princípios (listagem)
principios/*.html        → Um dossiê por princípio (1 exemplo pronto)
teses.html                → As ~100 grandes teses (12 de exemplo)
autores.html              → Biblioteca de autores
autores/*.html            → Um dossiê por autor (1 exemplo pronto)
livros.html                → Biblioteca de livros
livros/*.html               → Um dossiê por livro (1 exemplo pronto)
casos.html                  → Biblioteca de casos
casos/*.html                 → Um dossiê por caso (1 exemplo pronto)
linha-do-tempo.html          → Linha do tempo intelectual
comunidade.html               → Jornada do membro / regras da casa
glossario.html                 → Vocabulário navegável
newsletter.html                 → Edição #00 completa + formulário de assinatura
css/style.css                    → Referência do sistema visual (já embutido em cada página)
```

## Como crescer o site

Cada biblioteca (princípios, autores, livros, casos) segue o mesmo padrão:
uma página de listagem com cards + uma subpasta com um dossiê por item.
Para adicionar um item novo: duplique o arquivo-modelo da subpasta, troque o
conteúdo e adicione o card correspondente na listagem.

## Deploy (mesmo fluxo que você já usa)

```
git init
git add .
git commit -m "SemMimimi — identidade e edição 00"
git remote add origin <seu-repo>
git push -u origin main
```

Depois é só conectar o repositório na Vercel.

## Próximos passos sugeridos

- [ ] Trocar o formulário de newsletter por integração real (Brevo)
- [ ] Completar as ~100 teses
- [ ] Popular princípios/autores/livros/casos com o conteúdo real
- [ ] Ligar o botão "Quero assinar" ao Mercado Pago/Pix para o plano pago
