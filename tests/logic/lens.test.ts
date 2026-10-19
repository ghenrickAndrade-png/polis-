import { describe, expect, it } from 'vitest';
import { LensGraph, narrateLens } from '../../src/logic/LensGraph';
import { Timeline } from '../../src/logic/Timeline';
import { OriginReveal } from '../../src/logic/OriginReveal';
import { PressureSquare } from '../../src/logic/PressureSquare';

const issues = [
  { id: 'fabrica', label: 'A Metalúrgica fechou' },
  { id: 'esforco', label: 'Falta de esforço', commonSense: true },
  { id: 'azar', label: 'Azar', commonSense: true },
];
const troubles = [
  { id: 'ze', who: 'Zé', text: 'perdeu o emprego', clue: 'trabalhava na Metalúrgica', issue: 'fabrica' },
  { id: 'maria', who: 'Maria', text: 'não paga o aluguel', clue: 'a loja era na porta da Metalúrgica', issue: 'fabrica' },
  { id: 'bia', who: 'Bia', text: 'parou de estudar', clue: 'o pai era da Metalúrgica', issue: 'fabrica' },
];

describe('LensGraph', () => {
  it('liga troubles ao nó certo e fecha quando todos estão ligados', () => {
    const g = new LensGraph(troubles, issues);
    expect(g.pick('ze')).toBe(true);
    const r = g.attach('fabrica')!;
    expect(r.ok).toBe(true);
    expect(r.countOnIssue).toBe(1);
    expect(g.solved).toBe(false);
    g.pick('maria');
    g.attach('fabrica');
    g.pick('bia');
    const last = g.attach('fabrica')!;
    expect(last.solved).toBe(true);
    expect(g.countOn('fabrica')).toBe(3);
  });

  it('ligação errada esgarça: não fica e conta como tentativa', () => {
    const g = new LensGraph(troubles, issues);
    g.pick('ze');
    const r = g.attach('esforco')!;
    expect(r.ok).toBe(false);
    expect(g.isLinked('ze')).toBe(false);
    expect(g.wrong).toBe(1);
    expect(g.carrying).toBeNull();
  });

  it('não deixa pegar um trouble já ligado nem anexar sem carregar', () => {
    const g = new LensGraph(troubles, issues);
    expect(g.attach('fabrica')).toBeNull();
    g.pick('ze');
    g.attach('fabrica');
    expect(g.pick('ze')).toBe(false);
  });

  it('narra o que foi construído nas palavras do livro', () => {
    const g = new LensGraph(troubles, issues);
    for (const t of troubles) {
      g.pick(t.id);
      g.attach(t.issue);
    }
    const text = narrateLens(g);
    expect(text).toContain('3 problemas privados');
    expect(text).toContain('imaginação sociológica');
    expect(text).toContain('esfera particular');
  });

  it('rejeita issue desconhecida na construção', () => {
    expect(() => new LensGraph([{ ...troubles[0], issue: 'x' }], issues)).toThrow();
  });
});

describe('Timeline', () => {
  const personal = [
    { id: 'p1', text: 'Mudei de cidade', year: 2009, cause: 'h1' },
    { id: 'p2', text: 'Estudei em casa', year: 2020, cause: 'h2' },
  ];
  const history = [
    { id: 'h1', text: 'Crise financeira', year: 2008 },
    { id: 'h2', text: 'Pandemia', year: 2020 },
    { id: 'h3', text: 'Enchente', year: 2015 },
  ];
  it('encaixa o evento pessoal sobre o acontecimento público que o explica', () => {
    const t = new Timeline(personal, history);
    t.pick('p1');
    expect(t.place('h1')!.ok).toBe(true);
    t.pick('p2');
    expect(t.place('h3')!.ok).toBe(false);
    expect(t.isPlaced('p2')).toBe(false);
    t.pick('p2');
    expect(t.place('h2')!.ok).toBe(true);
    expect(t.solved).toBe(true);
  });
  it('não aceita dois eventos pessoais no mesmo acontecimento', () => {
    const t = new Timeline(
      [
        { id: 'a', text: 'a', year: 1, cause: 'h' },
        { id: 'b', text: 'b', year: 1, cause: 'h' },
      ],
      [{ id: 'h', text: 'h', year: 1 }],
    );
    t.pick('a');
    expect(t.place('h')!.ok).toBe(true);
    t.pick('b');
    expect(t.place('h')!.ok).toBe(false);
  });
});

describe('OriginReveal', () => {
  const rules = [
    { id: 'r1', rule: 'A', origin: 'criada em 1951', guardBefore: 'sempre foi assim', guardAfter: 'então pode mudar' },
    { id: 'r2', rule: 'B', origin: 'criada em 1887', guardBefore: 'sempre foi assim', guardAfter: 'então pode mudar' },
  ];
  it('só deixa questionar depois de revelar a origem', () => {
    const o = new OriginReveal(rules);
    expect(o.question('r1')).toBe(false);
    expect(o.reveal('r1')!.origin).toContain('1951');
    expect(o.question('r1')).toBe(true);
    expect(o.isOpen('r1')).toBe(true);
    expect(o.solved).toBe(false);
    o.reveal('r2');
    o.question('r2');
    expect(o.solved).toBe(true);
  });
});

describe('PressureSquare', () => {
  const posters = [
    { id: 'a', name: 'A', thought: 't', post: 'p', pressure: 8, tolerance: 4, neighbors: ['b', 'c'] },
    { id: 'b', name: 'B', thought: 't', post: 'p', pressure: 6, tolerance: 4, neighbors: ['a'] },
    { id: 'c', name: 'C', thought: 't', post: 'p', pressure: 9, tolerance: 4, neighbors: ['d'] },
    { id: 'd', name: 'D', thought: 't', post: 't', pressure: 2, tolerance: 4, neighbors: [] },
  ];
  it('começa com quem já está abaixo da tolerância honesto', () => {
    const s = new PressureSquare(posters);
    expect(s.isHonest('d')).toBe(true);
    expect(s.honestCount).toBe(1);
  });
  it('apoiar baixa a pressão dos vizinhos e pode causar cascata', () => {
    const s = new PressureSquare(posters);
    const changed = s.support('a');
    expect(changed).toContain('a');
    expect(changed).toContain('b'); // 6 - 3 = 3 <= 4
    expect(s.isHonest('c')).toBe(false); // 9 - 3 = 6 > 4
    expect(s.solved).toBe(false);
    s.support('c');
    expect(s.solved).toBe(true);
  });
  it('deixar quieto não muda nada', () => {
    const s = new PressureSquare(posters);
    const before = s.groupPressure;
    s.ignore();
    expect(s.groupPressure).toBe(before);
    expect(s.honestCount).toBe(1);
  });
});
