import type { Cause, DistrictDef } from '../logic/Districts';

export interface DistrictCard extends DistrictDef {
  /** tile do marco (placa) do distrito */
  x: number;
  y: number;
  /** ficha lida na fase de observação (cada linha ≤ 190 chars) */
  ficha: string[];
}

/** Os cinco distritos citados no livro (pág. 29) + o centro, para comparar. */
export const DISTRICTS: DistrictCard[] = [
  {
    id: 'centro',
    name: 'Centro',
    zona: 'centro expandido',
    periferia: false,
    exposicao: 0.35,
    plano: 0.7,
    x: 20,
    y: 8,
    ficha: [
      'CENTRO. Renda: alta. Moradores por casa: 2. Transporte: carro ou metrô com espaço.',
      'Trabalho: a maioria pôde ficar em casa (home office). Plano de saúde: 7 em cada 10 moradores.',
    ],
  },
  {
    id: 'brasilandia',
    name: 'Brasilândia',
    zona: 'zona norte',
    periferia: true,
    exposicao: 0.75,
    plano: 0.2,
    x: 6,
    y: 7,
    ficha: [
      'BRASILÂNDIA (zona norte). Renda: baixa. Moradores por casa: 4. Transporte: ônibus lotado.',
      'Trabalho: presencial (limpeza, comércio, obras): não dava para ficar em casa. Plano de saúde: 2 em cada 10.',
    ],
  },
  {
    id: 'sapopemba',
    name: 'Sapopemba',
    zona: 'zona leste',
    periferia: true,
    exposicao: 0.7,
    plano: 0.25,
    x: 34,
    y: 8,
    ficha: [
      'SAPOPEMBA (zona leste). Renda: baixa. Moradores por casa: 4. Transporte: ônibus e trem lotados.',
      'Trabalho: presencial, longe de casa. Plano de saúde: 2 ou 3 em cada 10. Distrito populoso.',
    ],
  },
  {
    id: 'capao',
    name: 'Capão Redondo',
    zona: 'zona sul',
    periferia: true,
    exposicao: 0.75,
    plano: 0.2,
    x: 6,
    y: 18,
    ficha: [
      'CAPÃO REDONDO (zona sul). Renda: baixa. Moradores por casa: 4 ou 5. Transporte: ônibus lotado.',
      'Trabalho: presencial (serviços, entregas, cuidado). Plano de saúde: 2 em cada 10.',
    ],
  },
  {
    id: 'angela',
    name: 'Jardim Ângela',
    zona: 'zona sul',
    periferia: true,
    exposicao: 0.8,
    plano: 0.15,
    x: 17,
    y: 20,
    ficha: [
      'JARDIM ÂNGELA (zona sul). Renda: baixa. Moradores por casa: 5. Transporte: 1 h 30 de ônibus lotado.',
      'Trabalho: presencial. Plano de saúde: 1 ou 2 em cada 10. Região populosa, no extremo da cidade.',
    ],
  },
  {
    id: 'grajau',
    name: 'Grajaú',
    zona: 'zona sul',
    periferia: true,
    exposicao: 0.8,
    plano: 0.15,
    x: 32,
    y: 20,
    ficha: [
      'GRAJAÚ (zona sul). Renda: baixa. Moradores por casa: 5. Transporte: 2 h de ônibus lotado até o trabalho.',
      'Trabalho: presencial. Plano de saúde: 1 ou 2 em cada 10. O distrito mais populoso da zona sul.',
    ],
  },
];

export const ACTION_INFO = {
  testes: { label: 'Posto de testes', effect: 'menos casos (quem testa positivo se isola)' },
  leitos: { label: 'Leitos de UTI', effect: 'mais cuidado para quem não tem plano' },
  vacina: { label: 'Vacinação', effect: 'a partir da semana seguinte: menos casos e menos mortes' },
} as const;

/** Relatório: por que a periferia morreu mais? */
export const CAUSES: Cause[] = [
  { id: 'casas', text: 'casas cheias (mais moradores por casa)', nosDados: true },
  { id: 'transporte', text: 'transporte público lotado', nosDados: true },
  { id: 'trabalho', text: 'trabalho presencial, sem home office', nosDados: true },
  { id: 'plano', text: 'poucos têm plano de saúde', nosDados: true },
  { id: 'renda', text: 'menor renda', nosDados: true },
  { id: 'descuido', text: 'as pessoas da periferia se cuidaram menos', nosDados: false },
  { id: 'virus', text: 'o vírus é mais forte na zona sul', nosDados: false },
  { id: 'arvores', text: 'há menos árvores na periferia', nosDados: false },
];
