import type { Dialogue } from './types';

/** Diálogos do Castelo das Luzes. */
export const CASTLE_DIALOGUES: Record<string, Dialogue> = {
  // ---------------------------------------------------------------- Pólis
  sign_west_open: [{ text: 'Para o oeste: Castelo das Luzes. Um castelo do Antigo Regime, escuro. Dizem que lá dentro a razão é uma chama.' }],
  clara_castle: [
    { who: 'Profª Clara', text: 'A estrada do oeste leva a um castelo escuro, do tempo em que o rei dizia que mandava por vontade de Deus.' },
    { who: 'Profª Clara', text: 'Foi contra isso que o Iluminismo acendeu as luzes: razão, liberdade, igualdade, poderes separados.' },
    { who: 'Profª Clara', text: 'Montesquieu, Comte e Smith estão lá. Leve uma chama.' },
    { set: 'town.clara5' },
  ],
  clara_castle_wait: [{ who: 'Profª Clara', text: 'O Castelo das Luzes fica pela estrada do oeste. Lá dentro, tudo começa pela Chama da Razão.' }],
  clara_after_castle: [
    { who: 'Profª Clara', text: 'Você saiu pela porta de Vila Rica. Então viu as três portas: 1776, 1789 e 1789.' },
    { who: 'Profª Clara', text: 'Iluminismo, Montesquieu, Comte, Smith: está tudo no Caderno. Doze páginas. Repassa antes da prova.' },
    { set: 'town.clara6' },
  ],
  clara_castle_done: [{ who: 'Profª Clara', text: 'O Caderno tem doze páginas prontas. E a trilha do norte, atrás da escola, abriu: o Templo do Espelho.' }],

  // ----------------------------------------------------------------- Hall
  hall_intro: [
    { text: '(Escuro. Seis tochas apagadas nas paredes. No centro, um braseiro: a Chama da Razão.)' },
    { text: '(Uma figura encapuzada ronda o braseiro. Perto dela, qualquer chama apaga.)' },
    { text: '(Leve a chama a cada tocha. Cada tocha acesa é uma ideia, e as três alas só abrem com as seis.)' },
  ],
  flame_take: [{ text: '(Você acende um graveto na Chama da Razão. Leve-o a uma tocha, longe do Dogma.)' }],
  flame_carrying: [{ text: '(Seu graveto já está aceso. Leve-o a uma tocha apagada.)' }],
  dogma_blow: [
    { who: 'Dogma', text: 'Sempre foi assim. Deus quer assim. Não pergunte.' },
    { text: '(Ele sopra. Sua chama apaga. Volte ao braseiro e tente por outro caminho.)' },
  ],
  dogma_talk: [{ who: 'Dogma', text: 'Tradição e fé bastam. Quem pergunta "por quê?" acende fogo onde não deve.' }],
  torch_lit_all: [
    { text: '(Seis tochas. Seis ideias. O salão inteiro clareou e três portas apareceram: norte, oeste e leste.)' },
    { text: '(O Dogma recuou para um canto. Ele ainda fala, mas ninguém precisa ouvir.)' },
  ],
  hall_doors_locked: [{ text: '(A porta não cede. As alas só abrem quando as seis tochas estiverem acesas.)' }],
  boss_locked: [{ text: '(Uma porta pesada, com três fechaduras. "Só entra quem passou pelas três alas.")' }],

  // ---------------------------------------------------------- Montesquieu
  monte_intro: [
    { text: '(Sala do trono. No trono, uma estátua do rei com três chaves no colo: Legislar, Executar, Julgar.)' },
    { text: '(Enquanto uma só mão segura as chaves, de tempos em tempos cai um decreto. E você obedece, queira ou não.)' },
    { text: '(Três pedestais pela sala. Pegue uma chave de cada vez e distribua.)' },
  ],
  monte_concentrated: [{ text: '(Duas chaves na mesma mão. Os decretos continuam: quem faz a lei também a executa e a julga.)' }],
  monte_separated: [
    { text: '(Uma chave em cada pedestal. Linhas de luz ligam os três: cada poder vigia os outros dois.)' },
    { text: '(Os decretos pararam. Ninguém manda sozinho.)' },
  ],
  law_plaque: [{ text: '"LEI DO SAL: todo sal pago ao rei." (A mesma lei. Caminhe pelos três terrenos à esquerda e veja o que ela vira em cada um.)' }],
  monte_done: [
    { text: '(A mesma lei virou três coisas diferentes em três terrenos: clima, economia e religião mudam o que a lei faz.)' },
    { text: '(E com os poderes separados, lei nenhuma cai do céu. É o espírito das leis.)' },
  ],

  // ----------------------------------------------------------------- Comte
  comte_intro: [
    { text: '(Torre dos Três Estados. Três câmaras em sequência; cada porta obedece a uma lógica diferente.)' },
    { text: '(Na primeira, um altar. Reze e veja o que acontece.)' },
  ],
  altar_pray: [
    { who: 'Voz', text: 'A porta abre porque assim quer o deus da torre.' },
    { text: '(A porta abriu. Estado teológico: o mundo se explica pela vontade dos deuses.)' },
  ],
  altar_again: [{ text: '(O altar já serviu. A porta à direita está aberta.)' }],
  orb_take: [{ text: '(Uma esfera roxa: a "Essência da Abertura". Leve-a ao pedestal.)' }],
  orb_place: [
    { who: 'Voz', text: 'A porta abre porque a Essência da Abertura assim determina.' },
    { text: '(Abriu, de novo sem olhar para a porta. Estado metafísico: explicações por essências abstratas.)' },
  ],
  pos_altar: [{ text: '(Você reza. Nada acontece. Aqui a porta não obedece a vontade nem a essência.)' }],
  pos_orb: [{ text: '(Você encosta a esfera. Nada. Este andar não aceita essências.)' }],
  scope_take: [{ text: '(Uma luneta. "Observar, medir, achar a lei." Aponte-a para cada pessoa desta câmara.)' }],
  pos_measured: [
    { text: '(Cinco pessoas observadas. Medida: 3 em 5 acordam às 6; 2 em 5, às 5. Não há deus nem essência: há um padrão.)' },
    { text: '(A porta abre com a lei que você mediu. Estado positivo: a sociedade estudada como as ciências naturais estudam a natureza.)' },
    { who: 'Voz', text: 'Comte chamou isso de "física social". Depois, de Sociologia.' },
  ],
  comte_done: [{ text: '(Três estados, três portas: teológico, metafísico, positivo. A última abriu por medição.)' }],

  // ----------------------------------------------------------------- Smith
  smith_intro: [
    { text: '(Uma fábrica de alfinetes. Cinco operários, cada um fazendo um alfinete inteiro, do arame à caixa. Quase nada sai.)' },
    { text: '(Cinco bancadas, uma por etapa. Dois pedágios fecham a estrada. Um baú vazio espera no fim dela.)' },
    { text: '(Ligue a Engrenagem (X) para combinar a etapa de cada operário. Depois, abra a estrada.)' },
  ],
  smith_divided: [
    { text: '(Cada um numa etapa. A produção saltou: de um alfinete por hora para dezenas. Divisão do trabalho.)' },
    { text: '(Mas o baú não enche: os pedágios barram as carroças. Riqueza parada não é riqueza.)' },
  ],
  toll_open: [{ text: '(Você levanta a cancela. Uma carroça passa. O baú começa a encher: livre circulação.)' }],
  toll_closed_talk: [{ who: 'Cobrador', text: 'Pedágio do rei. Alfinete que passa paga, e o que não paga apodrece no estoque.' }],
  smith_done: [
    { text: '(O baú encheu. Trabalho dividido e estrada aberta: a riqueza vem do trabalho e cresce com a divisão dele e com a livre circulação.)' },
    { text: '(Smith chamou isso de liberalismo econômico.)' },
  ],

  // ------------------------------------------------------------------ Boss
  abs_intro: [
    { who: 'O Absolutista', text: 'Eu sou a lei, eu executo a lei, eu julgo a lei. Três chaves, uma mão: a minha.' },
    { who: 'O Absolutista', text: 'E você? Um súdito com um graveto. Decreto: você perde.' },
    { text: '(Enquanto ele assina decretos, as chaves ficam soltas ao lado do trono. Pegue uma, leve a um pedestal. Cada poder que sai da mão dele o enfraquece.)' },
  ],
  abs_defeat: [
    { who: 'O Absolutista', text: 'Três pedestais... e o povo na porta. Sem as chaves, quem sou eu?' },
    { text: '(As pessoas da Ágora entram no salão. A soberania mudou de lugar. O Absolutista cai.)' },
  ],

  // ----------------------------------------------------------------- Sábios
  sage3_intro: [
    { who: 'Montesquieu', text: 'Três portas. Cada uma se abriu na história com uma construção. Refaça as três aqui.' },
    { who: 'Comte', text: '1776: uma república com Constituição e poderes separados. 1789: a razão, a liberdade e a igualdade contra o Antigo Regime.' },
    { who: 'Smith', text: 'E 1789 em Vila Rica: a Inconfidência contra a derrama, o imposto que barrava tudo. Abra as cancelas.' },
  ],
  sage3_done_pre: [{ who: 'Montesquieu', text: 'Deixe-nos dizer, com as palavras do livro, o que você construiu.' }],
  sage3_done_post: [
    { who: 'Comte', text: 'Revolução Industrial e Revolução Francesa: é nesse pano de fundo que a Sociologia nasce.' },
    { who: 'Smith', text: 'Está no Caderno, em "com as minhas palavras". A porta de Vila Rica leva de volta a Pólis.' },
  ],
  worker_no_gear: [{ text: '(Ligue a Engrenagem com X para combinar a etapa deste operário.)' }],
};
