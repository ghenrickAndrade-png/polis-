import type { Fact, Scale } from '../logic/Scales';

export interface MicroNpc {
  id: string;
  name: string;
  look: string;
  x: number;
  y: number;
  /** o que diz na rua (micro) */
  line: string;
  fact: string;
}
export interface MacroNode {
  id: string;
  label: string;
  x: number;
  y: number;
  fact: string;
  /** ligações do fluxo (ids de outros nós) */
  to?: string[];
}

export interface FloorDef {
  id: string;
  facts: Fact[];
  micro: MicroNpc[];
  macro: MacroNode[];
}

/** Andar 1 — a oficina. */
export const FLOOR1: FloorDef = {
  id: 'f1',
  facts: [
    { id: 'm1', scale: 'micro', text: 'O patrão diz ao operário que agora pode chamá-lo só nos dias que quiser.' },
    { id: 'M1', scale: 'macro', text: 'A reforma trabalhista (2017) criou o contrato intermitente para toda a categoria.' },
  ],
  micro: [
    { id: 'patrao', name: 'Patrão', look: 'mayor', x: 10, y: 7, line: 'A partir de hoje eu te chamo só nos dias que precisar. A lei deixa.', fact: 'm1' },
    { id: 'operario', name: 'Operário', look: 'smith', x: 13, y: 7, line: 'E nos outros dias eu como o quê? Isso é entre eu e ele? Ou é maior?', fact: 'm1' },
  ],
  macro: [
    { id: 'reforma', label: 'Reforma trabalhista (2017)', x: 6, y: 12, fact: 'M1', to: ['categoria'] },
    { id: 'categoria', label: 'Toda a categoria: 300 oficinas', x: 20, y: 12, fact: 'M1', to: ['sindicato'] },
    { id: 'sindicato', label: 'Sindicato e Justiça do Trabalho', x: 26, y: 5, fact: 'M1' },
  ],
};

/** Andar 2 — a vila turística. */
export const FLOOR2: FloorDef = {
  id: 'f2',
  facts: [
    { id: 'm2', scale: 'micro', text: 'A turista pechincha o artesanato; a moradora conta a história da peça e fecha o preço.' },
    { id: 'M2', scale: 'macro', text: 'Voos baratos e câmbio favorável trouxeram cinco vezes mais turistas à vila: globalização.' },
  ],
  micro: [
    { id: 'turista', name: 'Turista', look: 'townB', x: 9, y: 6, line: 'Quanto é a cestinha? Faz mais barato? Na minha terra não existe isso.', fact: 'm2' },
    { id: 'moradora', name: 'Moradora', look: 'farmer', x: 12, y: 6, line: 'Minha avó trançava assim. Pra você, faço um preço. Senta, vou contar.', fact: 'm2' },
  ],
  macro: [
    { id: 'voos', label: 'Voos baratos (companhias globais)', x: 5, y: 12, fact: 'M2', to: ['cambio'] },
    { id: 'cambio', label: 'Câmbio: moeda estrangeira vale mais', x: 16, y: 13, fact: 'M2', to: ['fluxo'] },
    { id: 'fluxo', label: '5× mais turistas na vila', x: 26, y: 8, fact: 'M2' },
  ],
};

/** Andar 3 — os termos do livro como mecanismos. */
export const FLOOR3: FloorDef = {
  id: 'f3',
  facts: [
    { id: 'acao', scale: 'micro', text: 'Ação social: ele age pensando no que os outros vão fazer (segura a porta porque vêm pessoas).' },
    { id: 'controle', scale: 'micro', text: 'Controle social: o olhar do guarda e dos vizinhos corrige o comportamento na praça.' },
    { id: 'producao', scale: 'macro', text: 'Relações de produção: quem é dono da oficina e quem trabalha nela.' },
    { id: 'coesao', scale: 'macro', text: 'Coesão social: a ponte só se sustenta quando os dois lados puxam juntos.' },
  ],
  micro: [
    { id: 'porteiro', name: 'Porteiro', look: 'townA', x: 6, y: 6, line: 'Seguro a porta porque vem gente atrás. Ajo pensando nos outros.', fact: 'acao' },
    { id: 'guarda3', name: 'Guarda', look: 'guard', x: 12, y: 10, line: 'Não preciso falar. Basta olhar: o pessoal se corrige sozinho.', fact: 'controle' },
  ],
  macro: [
    { id: 'dono', label: 'Dono da oficina', x: 20, y: 5, fact: 'producao', to: ['trab'] },
    { id: 'trab', label: 'Quem trabalha nela', x: 27, y: 5, fact: 'producao' },
    { id: 'ladoA', label: 'Lado A da ponte', x: 20, y: 13, fact: 'coesao', to: ['ladoB'] },
    { id: 'ladoB', label: 'Lado B da ponte', x: 27, y: 13, fact: 'coesao' },
  ],
};

/** Prova: situações novas para classificar. */
export interface SortCard {
  id: string;
  text: string;
  /** rótulo curto, para a coluna do quadro */
  short: string;
  scale: Scale;
}
export const SORT_CARDS: SortCard[] = [
  { id: 'c1', text: 'Dois alunos combinam quem faz cada parte do trabalho em grupo.', short: 'Trabalho em grupo', scale: 'micro' },
  { id: 'c2', text: 'A taxa de câmbio subiu e o turismo no país caiu pela metade.', short: 'Câmbio e turismo', scale: 'macro' },
  { id: 'c3', text: 'Uma vendedora cumprimenta cada cliente pelo nome.', short: 'Vendedora e cliente', scale: 'micro' },
  { id: 'c4', text: 'Uma lei nova muda as regras de contratação de toda a indústria.', short: 'Lei da indústria', scale: 'macro' },
  { id: 'c5', text: 'Turista e morador negociam o preço de um passeio de barco.', short: 'Passeio de barco', scale: 'micro' },
];
