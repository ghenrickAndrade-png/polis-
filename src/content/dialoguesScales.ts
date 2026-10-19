import type { Dialogue } from './types';

/** Diálogos da Torre das Escalas. */
export const SCALES_DIALOGUES: Record<string, Dialogue> = {
  // ---------------------------------------------------------------- Pólis
  sign_tower: [{ text: 'TORRE DAS ESCALAS — "Perto demais, você vê o gesto. Longe demais, você vê o mapa. Precisa dos dois."' }],
  clara_tower: [
    { who: 'Profª Clara', text: 'A torre ao norte da praça, entre os dois templos, tem um cristal que muda a escala do que você vê.' },
    { who: 'Profª Clara', text: 'Na rua, as interações: duas pessoas, um gesto. No mapa, as relações: leis, economia, globalização.' },
    { who: 'Profª Clara', text: 'Micro e macro. Nenhuma análise fecha só com uma das duas.' },
    { set: 'town.clara9' },
  ],
  clara_tower_wait: [{ who: 'Profª Clara', text: 'A Torre das Escalas fica ao norte da praça, entre os dois templos. Use o Cristal (X) para trocar de escala.' }],
  clara_after_tower: [
    { who: 'Profª Clara', text: 'Você desceu da torre com as duas escalas. Micro e macro estão no Caderno, com os termos do livro.' },
    { set: 'town.clara10' },
  ],
  clara_tower_done: [{ who: 'Profª Clara', text: 'Falta só o templo dos Distritos, ao sul da praça, pela rua da esquerda do porto.' }],

  // ----------------------------------------------------------------- Hall
  tower_intro: [
    { text: '(A base da torre. Num pedestal, um cristal lapidado em duas faces: RUA e MAPA.)' },
    { text: '(Com o Cristal ligado você vê o mapa: fluxos, leis, dinheiro. Desligado, você ouve as pessoas na rua.)' },
    { text: '(Cada andar tem um quadro de análise com duas colunas. Só fecha com um fato de cada escala.)' },
  ],
  crystal_hint: [{ text: 'Aperte X para trocar de escala. Rua (micro): as pessoas falam. Mapa (macro): os fluxos aparecem.' }],
  board_empty: [{ text: '(Quadro de análise. Duas colunas: MICRO e MACRO. Traga um fato de cada escala.)' }],
  fact_wrong_micro: [{ text: '(No mapa, as pessoas são pontos. Você não ouve o que dizem. Desligue o Cristal para ouvir.)' }],
  fact_wrong_macro: [{ text: '(Na rua, você não enxerga o fluxo. Ligue o Cristal para ver o mapa.)' }],
  f1_intro: [{ text: '(Uma oficina. Um patrão e um operário discutem. Ouça os dois; depois ligue o Cristal e veja de onde vem a regra.)' }],
  f1_done: [
    { text: '(Rua: um patrão e um operário. Mapa: uma reforma que vale para a categoria inteira.)' },
    { text: '(A discussão dos dois é micro. A lei que a explica é macro. O quadro fechou.)' },
  ],
  f2_intro: [{ text: '(Uma vila turística. Uma turista pechincha; uma moradora conta histórias. Ouça; depois veja o mapa dos voos.)' }],
  f2_done: [
    { text: '(Rua: pechincha e hospitalidade entre culturas diferentes. Mapa: voos, câmbio, globalização.)' },
    { text: '(O turismo é objeto da Sociologia nas duas escalas, mas sobretudo na macro.)' },
  ],
  f3_intro: [{ text: '(Quatro mecanismos do livro. Dois se veem na rua, dois só no mapa. Colete os quatro.)' }],
  f3_done: [{ text: '(Ação social e controle social, na rua. Relações de produção e coesão social, no mapa. Processos e questões da análise social.)' }],
  boss_intro2: [
    { who: 'O Míope', text: 'Eu vejo cada gesto seu. Cada passo. Não existe nada além do que está na minha frente!' },
    { who: 'O Gigante Cego', text: 'E eu vejo o mapa inteiro. Pessoas? Pontos. Não existe nada além do padrão!' },
    { text: '(O Míope só enxerga a rua: no mapa ele está cego. O Gigante só enxerga o mapa: na rua ele está cego. Troque de escala e ataque.)' },
  ],
  boss_defeat2: [
    { who: 'O Míope', text: 'Eu via o gesto... e não via a lei por trás dele.' },
    { who: 'O Gigante Cego', text: 'Eu via a lei... e não via o gesto que ela produz.' },
    { text: '(Os dois caem juntos. Nenhuma escala sozinha explica uma sociedade.)' },
  ],
  analista_intro: [
    { who: 'Analista', text: 'Você venceu os dois cegos. A prova: cinco situações novas. Ponha cada uma na coluna certa do quadro.' },
    { who: 'Analista', text: 'Se a situação não cabe na coluna, ela escorrega e volta. Pense: gesto entre pessoas, ou estrutura que vale para todos?' },
  ],
  analista_pre: [{ who: 'Analista', text: 'Deixe-me dizer, com as palavras do livro, o que você acabou de fazer.' }],
  analista_post: [{ who: 'Analista', text: 'Está no Caderno. A porta do fundo leva a Pólis.' }],
};
