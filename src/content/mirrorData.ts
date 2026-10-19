/** Família: quem fala à mesa, em ordem. */
export const FAMILY_SPEAKERS = [
  { id: 'mae', name: 'Mãe', look: 'maria', x: 7, y: 6, line: 'Hoje o Tide chegou tarde da escola. Ele vai explicar.' },
  { id: 'pai', name: 'Pai', look: 'ze', x: 10, y: 6, line: 'Eu levei o carro pra oficina. Amanhã volto a buscar.' },
  { id: 'irma', name: 'Irmã', look: 'bia', x: 7, y: 9, line: 'A prova foi difícil, mas eu tirei sete.' },
];
export const FAMILY_QUEUE = [
  { id: 'q1', look: 'townA', x: 22, y: 5 },
  { id: 'q2', look: 'townB', x: 24, y: 5 },
  { id: 'q3', look: 'townC', x: 26, y: 5 },
];

/** Escola: a lição no quadro. */
export const LESSON_STEPS = [
  'A professora escreve: "Toda placa diz alguma coisa. Olhe as formas."',
  'A professora escreve: "Cada forma é um som. Junte os sons."',
  'A professora escreve: "Agora leia a placa da sua frente." Você lê: CHAVE.',
];
export const SCHOOL_BOXES = [
  { id: 'b1', label: 'VAZIA', x: 6, y: 9 },
  { id: 'b2', label: 'CHAVE', x: 14, y: 11 },
  { id: 'b3', label: 'LIVROS', x: 22, y: 9 },
];

/** Estado: propostas para votar. */
export const PROPOSALS = [
  { id: 'p1', text: 'A praça de Pólis fica aberta até as 22h', result: 'A praça de Pólis passou a fechar às 22h.' },
  { id: 'p2', text: 'A praça de Pólis continua fechando às 18h', result: 'A praça de Pólis continua fechando às 18h.' },
];

/** Ágora: pedras escondidas que só a barqueira vê (alteridade). */
export const HIDDEN_STONES = [19, 20, 21, 22, 23, 24].map((x) => ({ x, y: 8 }));

/** Ágora: quem ajuda a consertar o barco do Eremita, e com que verbo. */
export const AGORA_HELPERS = [
  { id: 'ag_mae', name: 'Dona Cida', look: 'maria', x: 5, y: 5, verb: 'respeitar', gives: 'tábuas', line: 'Tenho tábuas. Mas espera: estou terminando de falar com a vizinha.' },
  { id: 'ag_prof', name: 'Profª Lúcia', look: 'teacher', x: 11, y: 5, verb: 'ler', gives: 'o nó do manual', line: 'O manual do nó está aqui. Você sabe ler? Então lê.' },
  { id: 'ag_escr', name: 'Escrivão', look: 'guard', x: 8, y: 11, verb: 'documento', gives: 'a licença de atracar', line: 'Licença pra atracar na pólis? Só com documento.' },
];
