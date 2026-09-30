import SiteLayout from '../components/SiteLayout';

const srcStyle = { fontSize: '.85rem' };

export default function EdicaoExemploPage() {
  return (
    <SiteLayout
      title="Degustação grátis: leia uma edição completa — Sem Mimimi"
      description="Leia de graça uma edição completa do Sem Mimimi, exatamente como os assinantes recebem toda quarta e sexta: a notícia pronta, em cerca de cinco minutos."
      active="edicao"
    >
      <section className="tight">
        <div className="wrap">
          <span className="eyebrow">Degustação aberta · edição completa e grátis</span>
          <h1 style={{ fontSize: 'clamp(1.9rem,5vw,2.6rem)', maxWidth: '22ch' }}>
            Leia uma edição inteira antes de assinar
          </h1>
          <p className="lede">
            É assim que o Sem Mimimi chega na sua caixa de entrada toda quarta e sexta. Sem resumo, sem trecho cortado:
            a edição de 30 de setembro de 2026, na íntegra.
          </p>

          <div className="inbox-preview" aria-label="Como aparece na caixa de entrada">
            <span className="inbox-tag">Assim aparece na sua caixa de entrada</span>
            <div className="inbox-row">
              <span className="inbox-sender">Sem Mimimi</span>
              <span className="inbox-line">
                <b>Nossa Senhora parou no STF (e o Brasil judicializou o céu)</b>
                <span className="inbox-pre">
                  {' '}— Toque, tarifa de 67%, bets e caviar: o resumo sem mimimi para ler com seu café.
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="tight">
        <div className="wrap">
          <div className="issue">
            <span className="tag">Edição degustação · As Sobras de Ontem · Leitura de 5 min</span>
            <h2>Nossa Senhora parou no STF (e o Brasil judicializou o céu)</h2>

        <p>Olá.</p>
        <p>Quando foi a última vez que você terminou o noticiário sabendo, de verdade, o que aconteceu?</p>
        <p>Não o que alguém gritou sobre o que aconteceu. O que aconteceu.</p>
        <p>Você tem um dia para tocar. O país tem Judiciário, Executivo, Congresso e uma opinião para cada tela. Alguém precisa ler tudo isso por você e separar três coisas: o que é fato, o que é interpretação e o que é piada. É isso que o Sem Mimimi faz, toda quarta e sexta, em cerca de cinco minutos.</p>
        <p>Hoje você recebe uma edição degustação. Sirva o café, abra no celular ou no computador e leia como se já fosse assinante. Vem aí: um exame de próstata que virou processo no TSE, Nossa Senhora entre dois tribunais, a China e a conta da carne, as bets e o caviar do Vorcaro.</p>
        <h3>O toque</h3>
        <p>Comecemos pelo toque.</p>
        <p>Não o de recolher, embora, a julgar pela Justiça Eleitoral, certas publicações já estejam conhecendo algo parecido. O toque da vez é outro.</p>
        <p>Em Belém, Lula falava sobre saúde masculina, câncer de próstata e a resistência dos homens aos exames preventivos quando disse a frase que ganhou vida própria nas redes: “As mulheres aprendem a tomar toque desde pequenas.”</p>
        <p>O contexto era médico. A frase, convenhamos, não ganhou o Nobel da precisão vocabular.</p>
        <p>Nikolas Ferreira pegou o trecho, deu a ele interpretação sexual e chegou a mencionar pedofilia. Lula reagiu dizendo que o deputado distorceu sua fala, e explicou que comparava a resistência masculina aos exames com a disposição das mulheres para a prevenção. Janja entrou no assunto e chamou Nikolas de “piá de bosta”.</p>
        <p>Está aí uma pequena joia do debate público brasileiro de 2026: o presidente precisa da primeira-dama para traduzir o presidente, a primeira-dama traduz o presidente xingando um deputado, e o deputado responde ao xingamento.</p>
        <p>Champollion precisou da Pedra de Roseta para decifrar os hieróglifos egípcios. Nós temos Janja.</p>
        <p>Mas a história não terminou no palanque. A campanha de Lula procurou o Tribunal Superior Eleitoral, e nesta quarta-feira a ministra Estela Aranha mandou Nikolas remover a publicação. Para ela, o deputado atribuiu à declaração presidencial uma “conotação inteiramente diversa” da original, deslocando uma discussão sobre saúde pública para o terreno dos crimes sexuais.</p>
        <p>São duas coisas distintas que não convém misturar: Lula de fato pronunciou a frase que circulou; o TSE entendeu, em decisão individual, que a interpretação acrescentada por Nikolas alterou o sentido do contexto.</p>
        <p>O Brasil conseguiu transformar um exame de próstata em matéria de Direito Eleitoral. É talento.</p>
        <p style={srcStyle}>
          Fonte:{' '}
          <a href="https://veja.abril.com.br/brasil/ministra-do-tse-diz-que-nikolas-distorceu-fala-de-lula-sobre-toque-em-mulheres-e-manda-remover-video/" target="_blank" rel="noopener noreferrer">
            VEJA — decisão do TSE sobre a publicação
          </a>
        </p>
        <h3>Nossa Senhora entre o TSE e o STF</h3>
        <p>E já que entramos no TSE, permaneçamos nele.</p>
        <p>Nossa Senhora Aparecida, depois de quase trezentos anos de devoção nacional, conseguiu em 2026 uma façanha talvez inédita: virou assunto de disputa de competência entre tribunais superiores.</p>
        <p>A controvérsia nasceu de publicações que atribuíam a Flávio Bolsonaro a intenção de tirar de Nossa Senhora Aparecida o título de Padroeira do Brasil. André Mendonça, no TSE, mandou remover conteúdos. Flávio Dino, no STF, derrubou uma dessas determinações e mandou restabelecer publicações, por entender que não havia elementos para justificar restrição tão ampla à liberdade de expressão.</p>
        <p>A situação ficou tão harmoniosa que Kassio Nunes Marques, presidente do TSE, enviou ofício a Edson Fachin manifestando “elevada preocupação” com decisões individuais do Supremo que interferissem na Justiça Eleitoral. Falou até em risco de “captura institucional” do TSE.</p>
        <p>Quando o presidente de um tribunal superior começa a advertir outro tribunal superior contra “captura institucional”, não estamos diante de divergência sobre vírgula no regimento.</p>
        <p>Nesta quarta-feira, o próprio TSE passou a examinar a questão de forma colegiada. O placar chegou a 3 a 1 pela manutenção da retirada das publicações, com votos de André Mendonça, Dias Toffoli e Kassio Nunes Marques.</p>
        <p>Enquanto Nossa Senhora passeia processualmente entre Supremo e TSE, Dino abriu outro capítulo. Determinou que a Polícia Federal investigasse o que chamou de “onda de ataques” contra imagens religiosas em diferentes estados. A PF viu elementos para instaurar investigação. Os episódios incluem destruição, incêndio e vandalismo contra imagens católicas, além de ataques a objetos e espaços de religiões de matriz africana. Dino apontou possíveis crimes como vilipêndio a culto, incêndio, dano, ameaça e furto.</p>
        <p>Aqui é importante separar a piada do processo: ataques físicos a templos, imagens e terreiros são assunto penal sério e podem justificar investigação.</p>
        <p>O extraordinário está no cenário institucional. Nossa Senhora virou, ao mesmo tempo, objeto de propaganda eleitoral, decisão do TSE, contradecisão do STF, reclamação entre ministros e investigação federal.</p>
        <p>O Brasil não secularizou a política. Judicializou o céu.</p>
        <p style={srcStyle}>
          Fonte:{' '}
          <a href="https://www.metropoles.com/colunas/manoela-alcantara/tse-toffoli-mendonca-e-kassio-votam-para-proibir-posts-de-nossa-senhora" target="_blank" rel="noopener noreferrer">
            Metrópoles — julgamento no TSE
          </a>
        </p>
        <p style={srcStyle}>
          Fonte:{' '}
          <a href="https://www.metropoles.com/brasil/pf-abre-inquerito-sobre-ataques-a-imagens-religiosas-apos-pedido-de-dino" target="_blank" rel="noopener noreferrer">
            Metrópoles — inquérito sobre ataques a imagens religiosas
          </a>
        </p>
        <h3>Mudando para o exterior? Consulte o Itamaraty</h3>
        <p>Passemos da religião à diplomacia, mudança menos brusca do que parece, porque ambas trabalham historicamente com milagres.</p>
        <p>Segundo reportagem de Andreza Matais, no Metrópoles, a embaixada brasileira em Madri foi mobilizada para ajudar Fábio Luís Lula da Silva, o Lulinha, na mudança para a Espanha. A reportagem afirma que mensagens recuperadas pela Polícia Federal mostram o então embaixador Orlando Leite Ribeiro oferecendo o apoio da representação brasileira.</p>
        <p>É preciso distinguir: assistência consular a brasileiros é atividade normal do Estado. A pergunta jornalística é qual auxílio foi prestado, em que extensão e se houve tratamento diferenciado por o beneficiário ser filho do presidente da República.</p>
        <p>É aí que mora o problema. O Itamaraty existe para cuidar dos interesses do Brasil no exterior, e mudança residencial de filho de presidente não costuma aparecer ao lado de Mercosul, ONU e comércio internacional entre os grandes pilares da política externa.</p>
        <p>Talvez seja a nova diplomacia de resultados. O resultado, neste caso, chega encaixotado.</p>
        <p style={srcStyle}>
          Fonte:{' '}
          <a href="https://www.metropoles.com/colunas/andreza-matais/itamaraty-mobilizou-embaixada-para-ajudar-lulinha-na-mudanca-para-madri" target="_blank" rel="noopener noreferrer">
            Metrópoles — Itamaraty e mudança de Lulinha
          </a>
        </p>
        <h3>A China, a carne e a conta</h3>
        <p>E chegamos à política externa propriamente dita.</p>
        <p>Enquanto o debate brasileiro reserva seus grandes adjetivos para Donald Trump e os Estados Unidos, a realidade econômica lembra Brasília de algo menos retórico: a China compra. E quem compra muito tem extraordinário poder para dispensar discursos.</p>
        <p>Primeiro veio a conta doméstica. A dívida bruta do governo geral chegou a 82,9% do PIB em agosto, o maior patamar em cinco anos. Desde dezembro de 2022, o indicador subiu mais de onze pontos percentuais. A dívida líquida foi a 69,3% do PIB, cerca de R$ 9,2 trilhões, e os juros nominais somaram R$ 1,18 trilhão em doze meses.</p>
        <p>Um trilhão e cento e oitenta bilhões de reais em juros. É uma cifra com a delicadeza de um piano caindo pela janela.</p>
        <p>Mas enquanto a dívida cresce aqui, a China resolveu cuidar dos seus pecuaristas lá. O Brasil esgotou a cota anual de carne bovina sujeita ao regime mais favorável de importação chinês. A partir de 1º de outubro, o que exceder o limite pagará sobretaxa adicional de 55%. Como já existe tarifa ordinária de 12%, a incidência total sobre o excedente chega a 67%.</p>
        <p>A precisão importa, porque “China aumentou a tarifa para 67%” conta só metade da história: são os 12% de sempre mais 55% adicionais sobre as remessas acima da cota.</p>
        <p>Segundo a reportagem especializada, Pequim também não aceitou transferir ao Brasil a parcela ociosa da cota uruguaia. Ao mesmo tempo, habilitou quatro novos frigoríficos brasileiros, sinal de que a relação comercial não se resume à sobretaxa e continua estruturalmente relevante.</p>
        <p>A China pratica uma modalidade de diplomacia muito antiga. Não precisa elevar a voz. Eleva a tarifa.</p>
        <p style={srcStyle}>
          Fonte:{' '}
          <a href="https://www1.folha.uol.com.br/mercado/2026/09/divida-bruta-do-brasil-atinge-829-do-pib-em-agosto-maior-nivel-em-5-anos-mostra-bc.shtml" target="_blank" rel="noopener noreferrer">
            Folha de S.Paulo — dívida bruta
          </a>
        </p>
        <p style={srcStyle}>
          Fonte:{' '}
          <a href="https://www.poder360.com.br/poder-agro/brasil-esgota-cota-de-carne-bovina-e-china-passa-a-cobrar-sobretaxa-de-55/" target="_blank" rel="noopener noreferrer">
            Poder360 — sobretaxa chinesa
          </a>
        </p>
        <h3>Se tem bet, aposte na confusão</h3>
        <p>E então chegamos às bets. Convém sentar, porque a legislação brasileira conseguiu transformar jogo de azar numa aposta sobre o próprio Estado.</p>
        <p>Tudo começa em 2018, quando a Lei nº 13.756, sancionada por Michel Temer, criou a aposta de quota fixa e abriu juridicamente esse mercado. A regulamentação não foi concluída no governo Bolsonaro. Em 2023, já no terceiro governo Lula, veio a Lei nº 14.790, que estruturou o mercado: autorização, fiscalização, tributação, publicidade, proteção do consumidor, prevenção à lavagem de dinheiro e sanções.</p>
        <p>Ou seja: o Estado primeiro permitiu. Depois regulamentou. Depois autorizou empresas. Depois tributou. E agora resolveu proibir.</p>
        <p>Em 25 de setembro, a MP nº 1.394/2026 proibiu a exploração, a oferta, a intermediação e a publicidade das apostas de quota fixa. A medida entrou em vigor na hora e fixou prazos para encerrar operações, tirar os sites do ar e extinguir as autorizações. O governo sustenta que responde ao endividamento, à ludopatia e aos danos sociais das apostas. Esses problemas existem.</p>
        <p>A questão jurídica levantada pelas empresas é outra: o que acontece quando o próprio Estado cria um mercado, regulamenta, cobra bilhões para autorizar operadores e, pouco depois, decide extingui-lo?</p>
        <p>ANJL e IBJR foram ao Supremo contestar a medida. A ANJL pediu a Luiz Fux a suspensão da MP, alegando, entre outros pontos, insegurança jurídica e prejuízo a investimentos feitos sob autorizações da União.</p>
        <p>Mas Brasília achou que uma controvérsia dessa dimensão ainda estava simples demais. Na segunda-feira, a Advocacia-Geral da União processou 17 empresas de apostas, pedindo pelo menos R$ 1 bilhão por danos morais coletivos, ressarcimento de despesas do SUS ligadas à ludopatia e restituição em dobro de valores apostados por pessoas diagnosticadas com o transtorno.</p>
        <p>É uma sequência peculiar. O Estado diz: “Pode.” Depois: “Pode, mas regulamentado.” Depois: “Pague para poder.” Depois: “Não pode mais.” E finalmente: “Agora talvez você me deva dinheiro pelo período em que eu disse que podia.”</p>
        <p>Kafka teria recusado o enredo por considerá-lo excessivamente administrativo.</p>
        <p>Só que faltava o futebol. Quatorze dos vinte clubes da Série A tinham casas de apostas como patrocinadoras máster. Em 2025, esses patrocínios movimentaram cerca de R$ 1,03 bilhão entre os clubes da primeira divisão, aproximadamente um terço de suas receitas comerciais.</p>
        <p>De repente, dirigentes descobriram que o problema filosófico das apostas tem uma unidade de medida bem objetiva: reais por temporada.</p>
        <p>O Flamengo pediu para entrar como amicus curiae no processo do STF. Outros clubes discutem atuação conjunta e defendem de seis meses a um ano de transição para os contratos existentes. Entrou no debate até uma possível paralisação do Campeonato Brasileiro, hipótese discutida por dirigentes, mas sem decisão formal de paralisação até agora.</p>
        <p>Eis a metamorfose completa. A bet começou como aposta. Virou negócio. Depois imposto. Depois problema de saúde pública. Depois medida provisória. Depois ação de um bilhão. Depois processo no Supremo. E terminou ameaçando o Campeonato Brasileiro.</p>
        <p>No Brasil, até o jogo termina no Judiciário.</p>
        <p style={srcStyle}>
          Fonte:{' '}
          <a href="https://www.cnnbrasil.com.br/esportes/brasileirao/fim-das-bets-pode-paralisar-o-brasileirao-entenda-o-cenario/" target="_blank" rel="noopener noreferrer">
            CNN Brasil — impacto no futebol
          </a>
        </p>
        <h3>Caviar, norueguesas e “Deus me livre”</h3>
        <p>E finalmente chegamos a Daniel Vorcaro. A esta altura, talvez seja mais fácil listar as autoridades que não aparecem nas mensagens do banqueiro.</p>
        <p>Segundo reportagens publicadas nesta quarta-feira a partir de mensagens extraídas do celular de Vorcaro, houve preparativos para um almoço oferecido a Alexandre de Moraes em Campos do Jordão, com chef especial e cardápio de alto padrão: caviar, trufas e vinhos caros.</p>
        <p>O dado jornalístico relevante não é o caviar. Caviar não é crime. Trufa, até onde o Código Penal conseguiu resistir, continua lícita.</p>
        <p>A relevância está na natureza das relações reveladas pelas mensagens e no eventual interesse delas para investigações envolvendo Vorcaro. Isso precisa ser apurado institucionalmente, sem transformar gastronomia em tipo penal.</p>
        <p>Mas o telefone de Vorcaro reservou ainda outro gênero literário. Mensagens divulgadas por O Globo mostram contatos frequentes com o senador Irajá, incluindo uma atribuída ao parlamentar: “Cadê nossas norueguesas!? Rs”. Irajá afirmou que os diálogos tratavam do projeto de legalização dos cassinos e apresentou sua versão.</p>
        <p>É reconfortante saber que, mesmo em crises institucionais, alguém preserva o espírito internacionalista do Senado Federal.</p>
        <p>Mas o melhor resumo do estado das coisas veio de quem menos pretendia produzi-lo. Segundo Andreza Matais, Edson Fachin tentou convencer Cármen Lúcia a assumir os casos ligados às menções a ministros do Supremo no material de Vorcaro. A ministra teria respondido: “Deus me livre.”</p>
        <p>A coluna informa que estão em questão menções a Alexandre de Moraes, Kassio Nunes Marques, Dias Toffoli e Luiz Fux e que, diante da recusa de Cármen Lúcia, Fachin terá de decidir o destino desse material. A mesma reportagem descreve forte tensão interna na Corte, com a comunicação entre Fachin e Flávio Dino sendo feita por intermédio de Cristiano Zanin.</p>
        <p>Não há frase melhor para terminar.</p>
        <p>Começamos discutindo toque. Passamos por Nossa Senhora, que chegou ao Supremo. Dino chamou a Polícia Federal. O Itamaraty apareceu numa mudança para Madri. A dívida pública bateu 82,9% do PIB. A China pôs 67% de tarifa total sobre a carne que exceder a cota. As bets foram autorizadas, regulamentadas, tributadas, proibidas, processadas e levadas ao Supremo. Os clubes cogitaram parar o futebol. Vorcaro serviu caviar. Irajá perguntou pelas norueguesas.</p>
        <p>E, quando alguém finalmente perguntou quem queria pegar determinados processos no Supremo, Cármen Lúcia teria resumido tudo em três palavras.</p>
        <p><strong>“Deus me livre.”</strong></p>
        <p>Ministra, desta vez não é decisão monocrática. É sentimento nacional.</p>
        <p style={srcStyle}>
          Fonte:{' '}
          <a href="https://www.metropoles.com/colunas/andreza-matais/deus-me-livre-carmen-recusa-assumir-casos-de-ministros-ligados-a-vorcaro" target="_blank" rel="noopener noreferrer">
            Metrópoles — Cármen Lúcia e casos ligados a Vorcaro
          </a>
        </p>

            <h3>Gostou da degustação?</h3>
            <p>
              Em cerca de cinco minutos, com um café na mão, você acompanhou o que agitou Brasília e saiu sabendo o que
              é fato, o que é interpretação e o que é piada.
            </p>
            <p>
              É assim toda quarta e sexta: a notícia pronta, apurada e explicada por Tiago Pavinatto, direto no seu
              celular ou computador.
            </p>
            <p>
              Quem fica só no barulho segue engolindo manchete e chegando atrasado às conversas. Quem vira leitor do Sem
              Mimimi chega sabendo.
            </p>
            <p>
              O plano custa R$ 22 por mês, cerca de R$ 2,50 por edição, menos que um cachorro-quente. Sem fidelidade:
              você cancela quando quiser.
            </p>
            <a href="/assinar" className="btn">
              Quero ser leitor do Sem Mimimi →
            </a>
            <div className="trust-note" style={{ marginTop: 16 }}>
              Conhece alguém que vive dizendo “não aguento mais notícia”? Mande o link desta página. Essa pessoa vai
              agradecer.
            </div>
            <p style={{ fontSize: '.85rem', marginTop: 22 }}>
              Boletim “As Sobras de Ontem” • 30/09/2026
            </p>
          </div>

          <p style={{ marginTop: 28, fontSize: '.95rem' }}>
            Quer entender por que o Sem Mimimi existe? <a href="/edicao-de-lancamento">Leia também a edição de lançamento</a>.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
