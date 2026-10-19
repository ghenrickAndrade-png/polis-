import { describe, expect, it } from 'vitest';
import { GearChain, Settlement, narrateSettlement } from '../../src/logic/GearChain';
import { Anomie, LanguageGate, NormCorridor } from '../../src/logic/Norms';

const ROLES = [
  { id: 'agric', name: 'Agricultora', gives: 'farinha' },
  { id: 'padeiro', name: 'Padeiro', gives: 'pão' },
  { id: 'ferreira', name: 'Ferreira', gives: 'ferramentas' },
  { id: 'medica', name: 'Médica', gives: 'saúde' },
  { id: 'professor', name: 'Professor', gives: 'ensino' },
];

describe('GearChain', () => {
  it('na cidade (cadeia), tirar um papel trava todos os outros', () => {
    const c = new GearChain(ROLES, true);
    expect(c.running).toBe(true);
    c.remove('padeiro');
    expect(c.running).toBe(false);
    expect(c.stoppedBy('padeiro').map((r) => r.id)).toEqual(['agric', 'ferreira', 'medica', 'professor']);
    c.restore('padeiro');
    expect(c.running).toBe(true);
  });
  it('na aldeia (paralelo), tirar um não muda nada', () => {
    const a = new GearChain(
      ['a', 'b', 'c'].map((id) => ({ id, name: 'Agricultor', gives: 'milho' })),
      false,
    );
    a.remove('b');
    expect(a.running).toBe(true);
    expect(a.stoppedBy('b')).toEqual([]);
  });
  it('anel: o seguinte do último é o primeiro', () => {
    const c = new GearChain(ROLES, true);
    expect(c.next('professor')!.id).toBe('agric');
  });
});

describe('Settlement', () => {
  const settlers = ['Ana', 'Beto', 'Cida', 'Dedé', 'Edu'];
  it('todas as funções diferentes → orgânica e gira', () => {
    const s = new Settlement(ROLES, settlers);
    expect(s.kind).toBe('vazia');
    settlers.forEach((name, i) => s.assign(name, ROLES[i].id));
    expect(s.kind).toBe('organica');
    expect(s.running).toBe(true);
    expect(narrateSettlement(s)).toContain('solidariedade orgânica');
  });
  it('todas iguais → mecânica, não gira', () => {
    const s = new Settlement(ROLES, settlers);
    settlers.forEach((name) => s.assign(name, 'agric'));
    expect(s.kind).toBe('mecanica');
    expect(s.running).toBe(false);
    expect(narrateSettlement(s)).toContain('mecânica');
  });
  it('mista enquanto faltam funções', () => {
    const s = new Settlement(ROLES, settlers);
    s.assign('Ana', 'agric');
    s.assign('Beto', 'agric');
    s.assign('Cida', 'padeiro');
    expect(s.kind).toBe('mista');
    expect(s.missingRoles.map((r) => r.id)).toEqual(['ferreira', 'medica', 'professor']);
    s.assign('Beto', 'ferreira');
    expect(s.countOf('agric')).toBe(1);
  });
});

describe('NormCorridor e LanguageGate', () => {
  it('só revela os muros depois de esbarrar ou observar', () => {
    const n = new NormCorridor([{ id: 'n1', rule: 'x' }]);
    expect(n.reveal()).toBe(false);
    n.bump('n1');
    expect(n.bumpsOf('n1')).toBe(1);
    expect(n.reveal()).toBe(true);
  });
  it('só cumprimenta depois de aprender com o grupo inteiro', () => {
    const g = new LanguageGate([
      { id: 'w1', word: 'Taná', meaning: 'bom dia', teacher: 'A' },
      { id: 'w2', word: 'Oré', meaning: 'com licença', teacher: 'B' },
    ]);
    expect(g.canGreet).toBe(false);
    expect(g.learn('w1')).toBe(true);
    expect(g.learn('w1')).toBe(false);
    g.learn('w2');
    expect(g.canGreet).toBe(true);
    expect(g.greeting()).toBe('Taná Oré');
  });
});

describe('Anomie', () => {
  it('a névoa dissipa conforme normas reacendem e papéis voltam', () => {
    const a = new Anomie(['n1', 'n2'], ['r1', 'r2']);
    expect(a.density).toBe(1);
    expect(a.relight('n1')).toBe(true);
    expect(a.relight('n1')).toBe(false);
    a.bringBack('r1');
    expect(a.density).toBe(0.5);
    a.relight('n2');
    a.bringBack('r2');
    expect(a.dissipated).toBe(true);
  });
});
