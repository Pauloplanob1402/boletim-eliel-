import SiteLayout from '../components/SiteLayout';

// Edição degustação aberta ao público. O texto abaixo é o do Pavinatto, na íntegra.
// Para trocar de edição: substitua os itens de EDICAO (t: p = parágrafo, h3 = título de seção,
// sign = signo, sub = subtítulo, quote = frase solta, src = fonte com link) e ajuste as constantes.
const ASSUNTO = 'Nossa Senhora parou no STF (e o Brasil judicializou o céu)';
const PRE_HEADER = 'Toque, tarifa de 67%, bets e caviar: o resumo sem mimimi para ler com seu café.';
const DATA_EDICAO = '30/09/2026';
const LEITURA_MIN = 14;
const RODAPE = "BOLETIM “AS SOBRAS DE ONTEM” • 30/09/2026";

const EDICAO = [
  {
    "t": "p",
    "x": "Comecemos pelo toque."
  },
  {
    "t": "p",
    "x": "Não pelo toque de recolher — embora, a julgar pela Justiça Eleitoral, certas publicações já estejam conhecendo algo parecido. O toque da vez é outro."
  },
  {
    "t": "p",
    "x": "Em Belém, Lula falava sobre saúde masculina, câncer de próstata e a conhecida resistência dos homens aos exames preventivos quando pronunciou a frase que imediatamente ganhou vida própria nas redes sociais: “As mulheres aprendem a tomar toque desde pequenas.”"
  },
  {
    "t": "p",
    "x": "O contexto era médico. A frase, convenhamos, não ganhou o Nobel da precisão vocabular."
  },
  {
    "t": "p",
    "x": "Nikolas Ferreira pegou o trecho e lhe deu interpretação sexual, chegando a mencionar pedofilia. Lula reagiu dizendo que o deputado havia distorcido sua fala; explicou que pretendia comparar a resistência masculina aos exames com a disposição das mulheres para exames preventivos. Janja entrou no assunto e chamou Nikolas de “piá de bosta”."
  },
  {
    "t": "p",
    "x": "Está aí uma pequena joia do debate público brasileiro de 2026: o presidente precisa da primeira-dama para traduzir o presidente, a primeira-dama traduz o presidente xingando um deputado, e o deputado responde ao xingamento."
  },
  {
    "t": "p",
    "x": "Champollion precisou da Pedra de Roseta para decifrar os hieróglifos egípcios. Nós temos Janja."
  },
  {
    "t": "p",
    "x": "Mas a história não terminou no palanque."
  },
  {
    "t": "p",
    "x": "A campanha de Lula procurou o Tribunal Superior Eleitoral. Nesta quarta-feira, a ministra Estela Aranha determinou que Nikolas removesse a publicação. Segundo a ministra, o deputado atribuiu à declaração presidencial uma “conotação inteiramente diversa” daquela do discurso original, deslocando uma discussão sobre saúde pública para o terreno dos crimes sexuais."
  },
  {
    "t": "p",
    "x": "Portanto, juridicamente, há duas coisas distintas que não convém misturar: Lula efetivamente pronunciou a frase que circulou; o TSE entendeu, em decisão individual, que a interpretação acrescentada por Nikolas alterou seu sentido contextual."
  },
  {
    "t": "p",
    "x": "O Brasil conseguiu assim transformar um exame de próstata em matéria de Direito Eleitoral. É talento."
  },
  {
    "t": "src",
    "label": "VEJA — decisão do TSE sobre a publicação",
    "url": "https://veja.abril.com.br/brasil/ministra-do-tse-diz-que-nikolas-distorceu-fala-de-lula-sobre-toque-em-mulheres-e-manda-remover-video/"
  },
  {
    "t": "h3",
    "x": "NOSSA SENHORA ENTRE O TSE E O STF"
  },
  {
    "t": "p",
    "x": "E já que entramos no TSE, permaneçamos nele."
  },
  {
    "t": "p",
    "x": "Nossa Senhora Aparecida, depois de quase trezentos anos de devoção nacional, conseguiu em 2026 uma façanha talvez inédita em sua história: tornou-se assunto de disputa de competência entre tribunais superiores."
  },
  {
    "t": "p",
    "x": "A controvérsia nasceu de publicações que atribuíam a Flávio Bolsonaro a intenção de retirar de Nossa Senhora Aparecida o título de Padroeira do Brasil. André Mendonça, no TSE, determinou a remoção de conteúdos. Flávio Dino, no STF, posteriormente derrubou uma dessas determinações e mandou restabelecer publicações, entendendo não haver elementos suficientes para justificar restrição tão ampla à liberdade de expressão."
  },
  {
    "t": "p",
    "x": "A situação ficou tão harmoniosa que Kassio Nunes Marques, presidente do TSE, enviou ofício a Edson Fachin manifestando “elevada preocupação” com decisões individuais do Supremo que interferissem na Justiça Eleitoral. Falou inclusive em risco de “captura institucional” do TSE por decisões externas à estrutura eleitoral."
  },
  {
    "t": "p",
    "x": "Quando o presidente de um tribunal superior começa a advertir outro tribunal superior contra “captura institucional”, não estamos exatamente diante de divergência sobre vírgula no regimento."
  },
  {
    "t": "p",
    "x": "Nesta quarta-feira, o próprio TSE passou a examinar colegiadamente a questão. O placar chegou a 3 a 1 pela manutenção da retirada das publicações, com votos nesse sentido de André Mendonça, Dias Toffoli e Kassio Nunes Marques."
  },
  {
    "t": "p",
    "x": "Enquanto Nossa Senhora passeia processualmente entre Supremo e TSE, Flávio Dino abriu outro capítulo religioso."
  },
  {
    "t": "p",
    "x": "O ministro determinou que a Polícia Federal investigasse aquilo que classificou como uma “onda de ataques” contra imagens religiosas em diferentes estados. A PF identificou elementos para instaurar investigação. Os episódios citados incluem destruição, incêndio e vandalismo contra imagens católicas, além de ataques a objetos e espaços de religiões de matriz africana. Dino apontou possíveis crimes como vilipêndio a culto, incêndio, dano, ameaça, furto e outras condutas."
  },
  {
    "t": "p",
    "x": "Aqui é importante separar a piada do processo: ataques físicos a templos, imagens e terreiros são assunto penal sério e podem justificar investigação."
  },
  {
    "t": "p",
    "x": "O aspecto extraordinário está no cenário institucional."
  },
  {
    "t": "p",
    "x": "Nossa Senhora virou simultaneamente objeto de propaganda eleitoral, decisão do TSE, contradecisão do STF, reclamação entre ministros e investigação federal sobre ataques religiosos."
  },
  {
    "t": "p",
    "x": "O Brasil não secularizou a política. Judicializou o céu."
  },
  {
    "t": "src",
    "label": "Metrópoles — julgamento no TSE",
    "url": "https://www.metropoles.com/colunas/manoela-alcantara/tse-toffoli-mendonca-e-kassio-votam-para-proibir-posts-de-nossa-senhora"
  },
  {
    "t": "src",
    "label": "Metrópoles — inquérito sobre ataques a imagens religiosas",
    "url": "https://www.metropoles.com/brasil/pf-abre-inquerito-sobre-ataques-a-imagens-religiosas-apos-pedido-de-dino"
  },
  {
    "t": "h3",
    "x": "MUDANDO PARA O EXTERIOR? CONSULTE O ITAMARATY"
  },
  {
    "t": "p",
    "x": "Passemos da religião à diplomacia — mudança menos brusca do que parece, porque ambas trabalham historicamente com milagres."
  },
  {
    "t": "p",
    "x": "Segundo reportagem de Andreza Matais, no Metrópoles, a embaixada brasileira em Madri foi mobilizada para prestar auxílio a Fábio Luís Lula da Silva, o Lulinha, durante sua mudança para a Espanha. A reportagem afirma que mensagens recuperadas pela Polícia Federal mostram o então embaixador Orlando Leite Ribeiro oferecendo apoio da representação brasileira."
  },
  {
    "t": "p",
    "x": "O episódio evidentemente exige uma distinção: assistência consular a brasileiros é atividade normal do Estado. A questão jornalística relevante é saber qual auxílio foi prestado, em que extensão e se houve tratamento diferenciado em razão de o beneficiário ser filho do presidente da República."
  },
  {
    "t": "p",
    "x": "É aí que mora o problema."
  },
  {
    "t": "p",
    "x": "Porque o Itamaraty existe para cuidar dos interesses do Brasil no exterior."
  },
  {
    "t": "p",
    "x": "Mudança residencial de filho de presidente não costuma aparecer entre os grandes pilares da política externa brasileira ao lado de Mercosul, ONU, comércio internacional e relações bilaterais."
  },
  {
    "t": "p",
    "x": "Talvez seja a nova diplomacia de resultados. O resultado, neste caso, chega encaixotado."
  },
  {
    "t": "src",
    "label": "Metrópoles — Itamaraty e mudança de Lulinha",
    "url": "https://www.metropoles.com/colunas/andreza-matais/itamaraty-mobilizou-embaixada-para-ajudar-lulinha-na-mudanca-para-madri"
  },
  {
    "t": "h3",
    "x": "A CHINA, A CARNE E A CONTA"
  },
  {
    "t": "p",
    "x": "E chegamos à política externa propriamente dita."
  },
  {
    "t": "p",
    "x": "Enquanto o debate político brasileiro costuma reservar seus grandes adjetivos para Donald Trump e os Estados Unidos, a realidade econômica continua lembrando Brasília de uma circunstância menos retórica: a China compra."
  },
  {
    "t": "p",
    "x": "E quem compra muito dispõe de extraordinário poder para dispensar discursos."
  },
  {
    "t": "p",
    "x": "Nesta quarta-feira apareceu primeiro a conta doméstica."
  },
  {
    "t": "p",
    "x": "A dívida bruta do governo geral alcançou 82,9% do PIB em agosto, o maior patamar em cinco anos. Desde dezembro de 2022, o indicador aumentou mais de onze pontos percentuais. A dívida líquida chegou a 69,3% do PIB, cerca de R$ 9,2 trilhões, e os juros nominais somaram R$ 1,18 trilhão em doze meses."
  },
  {
    "t": "p",
    "x": "Um trilhão e cento e oitenta bilhões de reais em juros. É uma cifra que possui a delicadeza de um piano caindo pela janela."
  },
  {
    "t": "p",
    "x": "Mas enquanto a dívida cresce aqui, a China resolveu cuidar de seus pecuaristas lá."
  },
  {
    "t": "p",
    "x": "O Brasil esgotou a cota anual de carne bovina sujeita ao regime mais favorável de importação chinês. A partir de 1º de outubro, a parcela que exceder o limite ficará sujeita a uma sobretaxa adicional de 55%. Como já existe tarifa ordinária de 12%, a incidência total sobre o excedente chega a 67%."
  },
  {
    "t": "p",
    "x": "É importante registrar a precisão porque “China aumentou a tarifa para 67%” conta apenas metade da história. São 12% existentes mais 55% adicionais sobre as remessas acima da cota."
  },
  {
    "t": "p",
    "x": "Pequim também não aceitou, segundo a reportagem especializada, a transferência ao Brasil de parcela ociosa da cota uruguaia. Ao mesmo tempo, habilitou quatro novos frigoríficos brasileiros, sinal de que a relação comercial não se resume à sobretaxa e continua estruturalmente relevante."
  },
  {
    "t": "p",
    "x": "A China pratica uma modalidade de diplomacia muito antiga. Não precisa elevar a voz. Eleva a tarifa."
  },
  {
    "t": "src",
    "label": "Folha de S.Paulo — dívida bruta",
    "url": "https://www1.folha.uol.com.br/mercado/2026/09/divida-bruta-do-brasil-atinge-829-do-pib-em-agosto-maior-nivel-em-5-anos-mostra-bc.shtml"
  },
  {
    "t": "src",
    "label": "Poder360 — sobretaxa chinesa",
    "url": "https://www.poder360.com.br/poder-agro/brasil-esgota-cota-de-carne-bovina-e-china-passa-a-cobrar-sobretaxa-de-55/"
  },
  {
    "t": "h3",
    "x": "SE TEM BET, APOSTE NA CONFUSÃO"
  },
  {
    "t": "p",
    "x": "E então chegamos às bets."
  },
  {
    "t": "p",
    "x": "Aqui convém sentar, porque a legislação brasileira conseguiu realizar aquilo que parecia impossível: transformar jogo de azar numa aposta sobre o próprio Estado."
  },
  {
    "t": "p",
    "x": "A história começa em 2018, quando a Lei nº 13.756, sancionada por Michel Temer, criou a modalidade de aposta de quota fixa e abriu juridicamente esse mercado no Brasil. A regulamentação não foi concluída no governo Bolsonaro."
  },
  {
    "t": "p",
    "x": "Em 2023, já no terceiro governo Lula, veio a Lei nº 14.790, que estruturou o mercado: autorização, fiscalização, tributação, publicidade, proteção do consumidor, prevenção à lavagem de dinheiro e sanções."
  },
  {
    "t": "p",
    "x": "Ou seja: o Estado primeiro permitiu. Depois regulamentou. Depois autorizou empresas. Depois tributou. E agora resolveu proibir."
  },
  {
    "t": "p",
    "x": "Em 25 de setembro, a MP nº 1.394/2026 proibiu a exploração, oferta, intermediação e publicidade das apostas de quota fixa. A medida entrou imediatamente em vigor e estabeleceu prazos para encerramento das operações, retirada dos sites e extinção das autorizações."
  },
  {
    "t": "p",
    "x": "O governo sustenta que a medida responde ao endividamento, à ludopatia e aos danos sociais provocados pelas apostas."
  },
  {
    "t": "p",
    "x": "E esses problemas existem."
  },
  {
    "t": "p",
    "x": "A questão jurídica levantada pelas empresas é outra: o que acontece quando o próprio Estado cria um mercado, regulamenta-o, cobra bilhões para autorizar operadores e, pouco depois, decide extingui-lo?"
  },
  {
    "t": "p",
    "x": "ANJL e IBJR foram ao Supremo contestar a medida. A ANJL pediu a Luiz Fux a suspensão da MP; as entidades alegam, entre outros pontos, insegurança jurídica e prejuízo a investimentos realizados sob autorizações concedidas pela União."
  },
  {
    "t": "p",
    "x": "Mas Brasília decidiu que uma controvérsia jurídica dessa dimensão ainda estava simples demais."
  },
  {
    "t": "p",
    "x": "Na segunda-feira, a Advocacia-Geral da União entrou na Justiça contra 17 empresas de apostas, pedindo pelo menos R$ 1 bilhão por danos morais coletivos, ressarcimento de despesas do SUS relacionadas à ludopatia e restituição em dobro de valores apostados por pessoas diagnosticadas com o transtorno."
  },
  {
    "t": "p",
    "x": "É uma sequência peculiar."
  },
  {
    "t": "p",
    "x": "O Estado diz: “Pode.”"
  },
  {
    "t": "p",
    "x": "Depois: “Pode, mas regulamentado.”"
  },
  {
    "t": "p",
    "x": "Depois: “Pague para poder.”"
  },
  {
    "t": "p",
    "x": "Depois: “Não pode mais.”"
  },
  {
    "t": "p",
    "x": "E finalmente: “Agora talvez você me deva dinheiro pelo período em que eu disse que podia.”"
  },
  {
    "t": "p",
    "x": "Kafka teria recusado o enredo por considerá-lo excessivamente administrativo."
  },
  {
    "t": "p",
    "x": "Só que faltava o futebol."
  },
  {
    "t": "p",
    "x": "Quatorze dos vinte clubes da Série A tinham casas de apostas como patrocinadoras máster. Em 2025, os patrocínios das bets movimentaram cerca de R$ 1,03 bilhão entre os clubes da primeira divisão, aproximadamente um terço de suas receitas comerciais."
  },
  {
    "t": "p",
    "x": "De repente, dirigentes descobriram que o problema filosófico das apostas possui uma unidade de medida bastante objetiva: reais por temporada."
  },
  {
    "t": "p",
    "x": "O Flamengo pediu para entrar como amicus curiae no processo do STF. Outros clubes discutem atuação conjunta e defendem um período de transição de seis meses a um ano para os contratos existentes. Chegou a entrar no debate uma possível paralisação do Campeonato Brasileiro — hipótese discutida por dirigentes, mas sem decisão formal de paralisação até agora."
  },
  {
    "t": "p",
    "x": "Eis a metamorfose completa."
  },
  {
    "t": "p",
    "x": "A bet começou como aposta. Virou negócio. Depois imposto. Depois problema de saúde pública. Depois medida provisória. Depois ação de um bilhão. Depois processo no Supremo. E terminou ameaçando o Campeonato Brasileiro."
  },
  {
    "t": "p",
    "x": "No Brasil, até o jogo termina no Judiciário."
  },
  {
    "t": "src",
    "label": "CNN Brasil — impacto no futebol",
    "url": "https://www.cnnbrasil.com.br/esportes/brasileirao/fim-das-bets-pode-paralisar-o-brasileirao-entenda-o-cenario/"
  },
  {
    "t": "h3",
    "x": "CAVIAR, NORUEGUESAS E “DEUS ME LIVRE”"
  },
  {
    "t": "p",
    "x": "E finalmente chegamos a Daniel Vorcaro."
  },
  {
    "t": "p",
    "x": "A esta altura, talvez seja mais fácil relacionar as autoridades brasileiras que não aparecem nas mensagens do banqueiro."
  },
  {
    "t": "p",
    "x": "Segundo reportagens publicadas nesta quarta-feira a partir de mensagens extraídas do celular de Vorcaro, houve preparativos para um almoço oferecido a Alexandre de Moraes em Campos do Jordão, com chef especial e cardápio que incluía produtos de alto padrão, como caviar, vieiras, trufas e vinhos caros."
  },
  {
    "t": "p",
    "x": "O dado jornalístico relevante não é o caviar."
  },
  {
    "t": "p",
    "x": "Caviar não é crime. Vieira também não. Trufa, até onde o Código Penal conseguiu resistir, continua lícita."
  },
  {
    "t": "p",
    "x": "A relevância está na natureza das relações reveladas pelas mensagens e em seu eventual interesse para investigações envolvendo Vorcaro — matéria que precisa ser apurada institucionalmente, sem transformar gastronomia em tipo penal."
  },
  {
    "t": "p",
    "x": "Mas o telefone de Vorcaro reservou ainda outro gênero literário."
  },
  {
    "t": "p",
    "x": "Mensagens divulgadas por O Globo revelaram contatos frequentes com o senador Irajá, inclusive uma mensagem atribuída ao parlamentar: “Cadê nossas norueguesas!? Rs”"
  },
  {
    "t": "p",
    "x": "Irajá afirmou que os diálogos diziam respeito ao projeto de legalização dos cassinos e apresentou sua versão para as conversas."
  },
  {
    "t": "p",
    "x": "É reconfortante saber que, mesmo durante crises institucionais, alguém preserva o espírito internacionalista do Senado Federal."
  },
  {
    "t": "p",
    "x": "Mas o melhor resumo do estado das coisas talvez tenha vindo de quem menos pretendia produzi-lo."
  },
  {
    "t": "p",
    "x": "Segundo Andreza Matais, Edson Fachin tentou convencer Cármen Lúcia a assumir os casos relacionados às menções a ministros do Supremo no material envolvendo Vorcaro."
  },
  {
    "t": "p",
    "x": "A ministra teria respondido: “Deus me livre.”"
  },
  {
    "t": "p",
    "x": "A coluna informa que estão em questão menções a Alexandre de Moraes, Kassio Nunes Marques, Dias Toffoli e Luiz Fux e que, diante da recusa de Cármen Lúcia, Fachin terá de decidir o destino desse material. A mesma reportagem descreve um ambiente de forte tensão interna na Corte, inclusive com comunicação entre Fachin e Flávio Dino sendo feita por intermédio de Cristiano Zanin."
  },
  {
    "t": "p",
    "x": "Não há frase melhor para terminar."
  },
  {
    "t": "p",
    "x": "Começamos o boletim discutindo toque. Passamos por Nossa Senhora. Nossa Senhora chegou ao Supremo. Dino chamou a Polícia Federal. O Itamaraty apareceu numa mudança para Madri. A dívida pública bateu 82,9% do PIB. A China colocou 67% de tarifa total sobre a carne que exceder a cota. As bets foram autorizadas, regulamentadas, tributadas, proibidas, processadas e levadas ao Supremo. Os clubes cogitaram parar o futebol. Vorcaro serviu caviar. Irajá perguntou pelas norueguesas."
  },
  {
    "t": "p",
    "x": "E, quando alguém finalmente perguntou quem gostaria de pegar determinados processos no Supremo, Cármen Lúcia teria resumido tudo em três palavras."
  },
  {
    "t": "quote",
    "x": "“Deus me livre.”"
  },
  {
    "t": "p",
    "x": "Ministra, desta vez não é decisão monocrática."
  },
  {
    "t": "p",
    "x": "É sentimento nacional."
  },
  {
    "t": "src",
    "label": "Metrópoles — Cármen Lúcia e casos ligados a Vorcaro",
    "url": "https://www.metropoles.com/colunas/andreza-matais/deus-me-livre-carmen-recusa-assumir-casos-de-ministros-ligados-a-vorcaro"
  },
  {
    "t": "h3",
    "x": "BOLETIM “AS SOBRAS DE ONTEM” • 30/09/2026"
  },
  {
    "t": "h3",
    "x": "SAIDEIRA"
  },
  {
    "t": "h3",
    "x": "REVISÃO DOS SIGNOS PARA ONTEM"
  },
  {
    "t": "sub",
    "x": "Astrologia aplicada ao consumo de “As Sobras de Ontem”"
  },
  {
    "t": "p",
    "x": "Abandonemos solenemente a hermenêutica constitucional e ingressemos numa ciência de rigor ainda mais duvidoso: a astrologia aplicada ao consumo de “As Sobras de Ontem”. Imaginando os arquétipos clássicos de cada signo — e, evidentemente, tratando tudo como caricatura humorística —, depois de ler o editorial inteiro, teríamos mais ou menos isto:"
  },
  {
    "t": "sign",
    "x": "♈ ÁRIES"
  },
  {
    "t": "p",
    "x": "Não chega ao segundo parágrafo sem querer participar da briga. Na parte do TSE, já está discutindo com a televisão. Nas bets, propõe interditar alguma coisa. No caviar, grita: “MAS QUEM PAGOU A CONTA?” Termina o editorial mais indignado do que começou e pergunta quando entra no ar para dar sua opinião."
  },
  {
    "t": "sign",
    "x": "♉ TOURO"
  },
  {
    "t": "p",
    "x": "Tolera Lula, Nikolas, TSE, STF, dívida pública e crise institucional com admirável estabilidade emocional. Aí chega ao trecho do almoço: “Caviar, vieiras, trufas e vinhos caros…”. Finalmente demonstra interesse. “Volta. Que vinho?” Sua conclusão sobre a República dependerá fundamentalmente de saber se a comida estava boa."
  },
  {
    "t": "sign",
    "x": "♊ GÊMEOS"
  },
  {
    "t": "p",
    "x": "Concorda com o editorial, discorda do editorial, formula uma terceira interpretação, manda três áudios sobre o assunto e, no quarto, percebe que mudou de opinião. Fica especialmente fascinado com a sucessão Nossa Senhora → TSE → STF → PF → Lulinha → China → bets → caviar → norueguesas. Diz: “Esse país é maravilhoso. Amanhã penso o contrário.”"
  },
  {
    "t": "sign",
    "x": "♋ CÂNCER"
  },
  {
    "t": "p",
    "x": "Tenta acompanhar racionalmente até chegar em Nossa Senhora. A partir daí, envolve-se emocionalmente. Quando aparece “Deus me livre”, sente que Cármen Lúcia finalmente verbalizou algo que estava represado em seu próprio coração. No fim, não quer discutir Direito Constitucional. Quer saber se Nossa Senhora está bem."
  },
  {
    "t": "sign",
    "x": "♌ LEÃO"
  },
  {
    "t": "p",
    "x": "Gostou do editorial, mas percebe uma falha estrutural gravíssima: ele não aparece nele. Considera o caviar aceitável, Campos do Jordão adequado e o almoço bastante compatível com suas expectativas. Só desaprova o fato de não ter sido convidado. Ao ouvir “Cadê nossas norueguesas?”, pensa: “Finalmente alguém fez a pergunta certa.”"
  },
  {
    "t": "sign",
    "x": "♍ VIRGEM"
  },
  {
    "t": "p",
    "x": "Não ri imediatamente porque está conferindo os números. Para no trecho da China: “Espere. Não são 67% adicionais. São 55% adicionais, que, somados aos 12%, chegam a 67%. Ah, o texto explicou. Excelente.” Descobre uma vírgula discutível na página quatro e esquece completamente a crise institucional. Dorme feliz porque “ludopatia” foi grafada corretamente."
  },
  {
    "t": "sign",
    "x": "♎ LIBRA"
  },
  {
    "t": "p",
    "x": "Chega ao fim profundamente angustiado porque compreendeu todos os lados. “Veja bem, Lula se expressou mal, mas Nikolas interpretou… porém existe liberdade de expressão… embora haja Direito Eleitoral… por outro lado…” Quando chega às bets, entra em colapso. À pergunta “Você é a favor ou contra?”, responde: “Eu acho que precisamos amadurecer o debate.” É imediatamente nomeado para uma comissão."
  },
  {
    "t": "sign",
    "x": "♏ ESCORPIÃO"
  },
  {
    "t": "p",
    "x": "Não está interessado na notícia publicada. Quer a notícia que ainda não foi publicada. Ignora metade do editorial e concentra-se nas mensagens do celular de Vorcaro. “Quem estava no almoço? Quem apresentou quem? Quem mandou mensagem depois? Por que Cármen disse ‘Deus me livre’?” Quando você termina, Escorpião permanece imóvel e diz apenas: “Tem mais coisa aí.” E vai embora sem explicar."
  },
  {
    "t": "sign",
    "x": "♐ SAGITÁRIO"
  },
  {
    "t": "p",
    "x": "Ri desde “Champollion” e começa a acrescentar piadas ao editorial em voz alta. Na parte do Itamaraty pergunta se a embaixada também ajuda com excesso de bagagem. Ao chegar às norueguesas, perde definitivamente qualquer compromisso com a seriedade. Sua análise jurídico-institucional final é: “O Brasil não existe.” Cinco minutos depois está contando a história inteira para desconhecidos num restaurante."
  },
  {
    "t": "sign",
    "x": "♑ CAPRICÓRNIO"
  },
  {
    "t": "p",
    "x": "Passa por toda a crise política sem alterar a frequência cardíaca. Mas encontra R$ 1,18 trilhão em juros, ergue lentamente os olhos e pergunta: “Quanto?” Depois aparecem R$ 1 bilhão contra as bets, contratos milionários dos clubes e prejuízos potenciais. Pronto. Agora existe um assunto sério. Para Capricórnio, a República pode até acabar — desde que alguém apresente a planilha antes."
  },
  {
    "t": "sign",
    "x": "♒ AQUÁRIO"
  },
  {
    "t": "p",
    "x": "Considera todos os personagens ultrapassados e anuncia que o problema é “estrutural”. Enquanto todos discutem Lula, STF, bets e Vorcaro, Aquário explica que a verdadeira questão envolve “a arquitetura informacional do poder na pós-democracia algorítmica”. Ninguém entende. Ele fica satisfeito. Ao ouvir “Deus me livre”, corrige: “Deus é uma construção epistemológica.” Câncer para de falar com ele."
  },
  {
    "t": "sign",
    "x": "♓ PEIXES"
  },
  {
    "t": "p",
    "x": "Começa prestando atenção. Em algum ponto entre Nossa Senhora e a mudança para Madri, sua mente abandona o noticiário. Imagina Nossa Senhora chegando ao TSE, Kafka trabalhando na Secretaria de Prêmios e Apostas e Cármen Lúcia fugindo de um processo enquanto Vorcaro atravessa o corredor oferecendo caviar. Quando volta à realidade, o editorial terminou. Perguntam o que achou. Responde, sinceramente: “Pesado… mas eu senti uma energia estranha nas norueguesas.”"
  },
  {
    "t": "p",
    "x": "O 13.º SIGNO: O BRASILEIRO"
  },
  {
    "t": "p",
    "x": "E existe ainda o 13.º signo, desconhecido pela astrologia babilônica: o brasileiro. Ele ouve toque, TSE, Nossa Senhora, PF, embaixada, dívida de 82,9% do PIB, China, bets, STF, caviar e norueguesas; fica alguns segundos em silêncio e pergunta:"
  },
  {
    "t": "quote",
    "x": "“Tá. Mas e amanhã? Tem programa?”"
  }
];

function renderItem(item, i) {
  switch (item.t) {
    case 'h3':
      return <h3 key={i}>{item.x}</h3>;
    case 'sign':
      return (
        <h4 key={i} style={{ margin: '1.4em 0 .3em', fontSize: '1.05rem' }}>
          {item.x}
        </h4>
      );
    case 'sub':
      return (
        <p key={i}>
          <em>{item.x}</em>
        </p>
      );
    case 'quote':
      return (
        <p key={i}>
          <strong>{item.x}</strong>
        </p>
      );
    case 'src':
      return (
        <p key={i} style={{ fontSize: '.85rem' }}>
          Fonte:{' '}
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            {item.label}
          </a>
        </p>
      );
    default:
      return <p key={i}>{item.x}</p>;
  }
}

function PorQueAssinar({ destaque }) {
  return (
    <div className={`launch-callout${destaque ? ' strong' : ''}`}>
      <span className="eyebrow">Por que vale a pena pagar</span>
      <h2>Por que eu vou cobrar pra falar o que sempre falei de graça</h2>
      <p>
        Antes de qualquer análise, Tiago Pavinatto explica o que muda quando quem paga a conta é o leitor. Uma
        explicação de verdade, não um discurso de vendas.
      </p>
      <a href="/edicao-de-lancamento" className="btn ghost">
        Ler a edição de lançamento →
      </a>
    </div>
  );
}

export default function EdicaoExemploPage() {
  return (
    <SiteLayout
      title="Degustação grátis: leia uma edição completa — Sem Mimimi"
      description="Leia de graça uma edição completa do Sem Mimimi, exatamente como os assinantes recebem: a notícia pronta, sem filtro e sem pano quente."
      active="edicao"
    >
      <section className="tight">
        <div className="wrap">
          <span className="eyebrow">Degustação aberta · edição completa e grátis</span>
          <h1 style={{ fontSize: 'clamp(1.9rem,5vw,2.6rem)', maxWidth: '22ch' }}>
            Leia uma edição inteira antes de assinar
          </h1>
          <p className="lede">
            É assim que o Sem Mimimi chega na sua caixa de entrada. Sem resumo, sem trecho cortado: a edição de{' '}
            {DATA_EDICAO}, na íntegra.
          </p>

          <div className="inbox-preview" aria-label="Como aparece na caixa de entrada">
            <span className="inbox-tag">Assim aparece na sua caixa de entrada</span>
            <div className="inbox-row">
              <span className="inbox-sender">Sem Mimimi</span>
              <span className="inbox-line">
                <b>{ASSUNTO}</b>
                <span className="inbox-pre"> — {PRE_HEADER}</span>
              </span>
            </div>
          </div>

          <PorQueAssinar destaque />
        </div>
      </section>

      <section className="tight">
        <div className="wrap">
          <div className="issue">
            <span className="tag">Edição degustação · Leitura de {LEITURA_MIN} min</span>
            <h2>As Sobras de Ontem</h2>

            {EDICAO.map(renderItem)}

            <p style={{ fontSize: '.85rem', marginTop: 22 }}>{RODAPE}</p>
          </div>
        </div>
      </section>

      <section className="tight">
        <div className="wrap">
          <div className="issue">
            <h2 style={{ fontSize: '1.6rem' }}>Gostou da degustação?</h2>
            <p>
              É assim que a notícia chega pronta, apurada e explicada por Tiago Pavinatto, direto no seu celular ou
              computador.
            </p>
            <p>
              Quem fica só no barulho segue engolindo manchete e chegando atrasado às conversas. Quem vira leitor do Sem
              Mimimi chega sabendo.
            </p>
            <p>
              O plano custa R$ 22 por mês. Dá menos de um real por dia pela notícia sem filtro. Sem fidelidade: você
              cancela quando quiser.
            </p>
            <a href="/assinar" className="btn">
              Quero ser leitor do Sem Mimimi →
            </a>
            <div className="trust-note" style={{ marginTop: 16 }}>
              Conhece alguém que vive dizendo “não aguento mais notícia”? Mande o link desta página. Essa pessoa vai
              agradecer.
            </div>
          </div>

          <PorQueAssinar />
        </div>
      </section>
    </SiteLayout>
  );
}
