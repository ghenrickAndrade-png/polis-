/** Tochas da Razão: uma por ideia do Iluminismo. */
export const TORCHES = [
  { id: 't1', idea: 'Razão e ciência no lugar da tradição e da fé', x: 4, y: 4 },
  { id: 't2', idea: 'Crítica ao absolutismo e ao poder divino dos reis', x: 27, y: 4 },
  { id: 't3', idea: 'Liberdade individual: pensamento, expressão, religião', x: 4, y: 8 },
  { id: 't4', idea: 'Igualdade de todos perante a lei', x: 27, y: 8 },
  { id: 't5', idea: 'Divisão dos poderes', x: 4, y: 13 },
  { id: 't6', idea: 'Soberania popular', x: 27, y: 13 },
];

/** Dogma: patrulha em volta da Chama; perto dele, a chama apaga. */
export const DOGMA_PATH = [
  { x: 11, y: 5 },
  { x: 20, y: 5 },
  { x: 20, y: 12 },
  { x: 11, y: 12 },
];

/** O espírito das leis: a mesma lei em três terrenos. */
export const LAW_TERRAINS = [
  { id: 'frio', x: 2, y: 2, w: 4, h: 4, name: 'Clima frio', effect: 'Aqui o sal conserva a comida do inverno. A lei do sal pesa sobre quem precisa sobreviver.' },
  { id: 'agric', x: 2, y: 7, w: 4, h: 4, name: 'Economia agrícola', effect: 'Aqui o sal salga o gado e a colheita. A mesma lei vira custo de produção.' },
  { id: 'comercio', x: 2, y: 12, w: 4, h: 4, name: 'Cidade comerciante', effect: 'Aqui o sal é mercadoria. A mesma lei vira imposto sobre o comércio e afasta os navios.' },
];

/** Torre dos Três Estados: pessoas para observar e medir no andar positivo. */
export const COMTE_SUBJECTS = [
  { id: 'obs1', name: 'Padeiro', look: 'baker', x: 24, y: 3, fact: 'acorda às 5' },
  { id: 'obs2', name: 'Ferreira', look: 'smith', x: 28, y: 5, fact: 'acorda às 6' },
  { id: 'obs3', name: 'Estudante', look: 'kid', x: 23, y: 11, fact: 'acorda às 6' },
  { id: 'obs4', name: 'Médica', look: 'doctor', x: 28, y: 13, fact: 'acorda às 6' },
  { id: 'obs5', name: 'Lavradora', look: 'farmer', x: 25, y: 15, fact: 'acorda às 5' },
];

/** Fábrica de Alfinetes: etapas e operários. */
export const STATIONS = [
  { id: 'cortar', name: 'Cortar o arame', x: 3, y: 4 },
  { id: 'afiar', name: 'Afiar a ponta', x: 8, y: 4 },
  { id: 'cabeca', name: 'Fazer a cabeça', x: 13, y: 4 },
  { id: 'polir', name: 'Polir', x: 18, y: 4 },
  { id: 'embalar', name: 'Embalar', x: 23, y: 4 },
];
export const WORKERS = [
  { id: 'wk:1', name: 'Rui' },
  { id: 'wk:2', name: 'Lena' },
  { id: 'wk:3', name: 'Tito' },
  { id: 'wk:4', name: 'Bela' },
  { id: 'wk:5', name: 'Zeca' },
];
export const TOLLS = [
  { id: 'toll1', name: 'Pedágio do rio', y: 5 },
  { id: 'toll2', name: 'Pedágio da serra', y: 10 },
];

/** Portas da Prova: cada uma abre com uma construção. */
export const SAGE_DOORS = [
  { id: 'eua', x: 6, label: '1776 · Independência dos EUA', opensWith: 'keys' },
  { id: 'franca', x: 14, label: '1789 · Revolução Francesa', opensWith: 'torches' },
  { id: 'minas', x: 22, label: '1789 · Inconfidência Mineira', opensWith: 'tolls' },
];
