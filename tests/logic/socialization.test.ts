import { describe, expect, it } from 'vitest';
import { BridgeRepair, Civic, Lesson, Socialization, TurnTaking } from '../../src/logic/Socialization';

describe('Socialization', () => {
  it('vira sujeito com os quatro verbos das instituições', () => {
    const s = new Socialization();
    expect(s.isSubject).toBe(false);
    s.learn('respeitar');
    s.learn('ler');
    s.learn('consertar');
    expect(s.isSubject).toBe(false);
    expect(s.learn('documento')).toBe(true);
    expect(s.learn('documento')).toBe(false);
    expect(s.isSubject).toBe(true);
    expect(s.list).toEqual(['respeitar', 'ler', 'consertar', 'documento']);
  });
});

describe('TurnTaking', () => {
  it('falar por cima volta ao começo; esperar avança até o fim', () => {
    const t = new TurnTaking(['mãe', 'pai', 'irmã']);
    expect(t.current).toBe('mãe');
    t.wait();
    t.interrupt();
    expect(t.current).toBe('mãe');
    expect(t.interrupted).toBe(1);
    t.wait();
    t.wait();
    t.wait();
    expect(t.done).toBe(true);
    expect(t.wait()).toBe(false);
  });
});

describe('Lesson, BridgeRepair, Civic', () => {
  it('lição em três passos', () => {
    const l = new Lesson(['a', 'b', 'c']);
    expect(l.next()).toBe('a');
    l.next();
    l.next();
    expect(l.complete).toBe(true);
    expect(l.next()).toBeNull();
  });
  it('ponte: uma tábua por vez', () => {
    const b = new BridgeRepair(2);
    expect(b.place()).toBe(false);
    b.take();
    expect(b.take()).toBe(false);
    b.place();
    b.take();
    b.place();
    expect(b.complete).toBe(true);
    expect(b.take()).toBe(false);
  });
  it('só vota com documento', () => {
    const c = new Civic([{ id: 'p1', text: 'x', result: 'r' }]);
    expect(c.vote('p1')).toBe(false);
    c.getDocument();
    expect(c.vote('p1')).toBe(true);
    expect(c.result).toBe('r');
  });
});
