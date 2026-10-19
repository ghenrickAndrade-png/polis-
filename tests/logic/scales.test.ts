import { describe, expect, it } from 'vitest';
import { FLOOR1, FLOOR2, FLOOR3, SORT_CARDS } from '../../src/content/scalesData';
import { ScaleAnalysis, ScaleSort } from '../../src/logic/Scales';

describe('ScaleAnalysis (Torre das Escalas)', () => {
  it('só coleta um fato na escala em que ele existe', () => {
    const a = new ScaleAnalysis(FLOOR1.facts);
    expect(a.collect('m1', 'macro')).toBe('wrong-scale'); // no mapa, as pessoas são pontos
    expect(a.collect('m1', 'micro')).toBe('ok');
    expect(a.collect('m1', 'micro')).toBe('done');
    expect(a.collect('M1', 'micro')).toBe('wrong-scale'); // na rua, não se vê o fluxo
    expect(a.collect('M1', 'macro')).toBe('ok');
    expect(a.complete).toBe(true);
  });

  it('o quadro só fecha com um fato de cada escala', () => {
    const a = new ScaleAnalysis(FLOOR1.facts);
    a.collect('m1', 'micro');
    expect(a.complete).toBe(false);
    expect(a.count('micro')).toBe(1);
    expect(a.count('macro')).toBe(0);
    expect(a.total('macro')).toBe(1);
  });

  it('ignora fatos desconhecidos', () => {
    const a = new ScaleAnalysis(FLOOR2.facts);
    expect(a.collect('zzz', 'micro')).toBe('unknown');
  });

  it('andar 3 tem dois fatos por escala (ação/controle × produção/coesão)', () => {
    const a = new ScaleAnalysis(FLOOR3.facts);
    expect(a.total('micro')).toBe(2);
    expect(a.total('macro')).toBe(2);
    for (const f of FLOOR3.facts) expect(a.collect(f.id, f.scale)).toBe('ok');
    expect(a.complete).toBe(true);
  });

  it('todo NPC micro e todo pilar macro apontam para um fato da própria escala', () => {
    for (const f of [FLOOR1, FLOOR2, FLOOR3]) {
      for (const m of f.micro) expect(f.facts.find((x) => x.id === m.fact)?.scale).toBe('micro');
      for (const n of f.macro) {
        expect(f.facts.find((x) => x.id === n.fact)?.scale).toBe('macro');
        for (const to of n.to ?? []) expect(f.macro.some((x) => x.id === to)).toBe(true);
      }
    }
  });
});

describe('ScaleSort (prova da torre)', () => {
  it('a situação na coluna errada escorrega e conta um erro', () => {
    const s = new ScaleSort(SORT_CARDS);
    expect(s.place('c1', 'macro')).toBe(false);
    expect(s.isPlaced('c1')).toBe(false);
    expect(s.wrong).toBe(1);
    expect(s.place('c1', 'micro')).toBe(true);
    expect(s.isPlaced('c1')).toBe(true);
  });

  it('fecha quando as cinco estão na coluna certa', () => {
    const s = new ScaleSort(SORT_CARDS);
    for (const c of SORT_CARDS) s.place(c.id, c.scale);
    expect(s.complete).toBe(true);
    expect(s.wrong).toBe(0);
  });

  it('as cartas misturam as duas escalas', () => {
    expect(SORT_CARDS.some((c) => c.scale === 'micro')).toBe(true);
    expect(SORT_CARDS.some((c) => c.scale === 'macro')).toBe(true);
    expect(new Set(SORT_CARDS.map((c) => c.id)).size).toBe(SORT_CARDS.length);
  });
});
