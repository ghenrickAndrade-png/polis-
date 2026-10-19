import { describe, expect, it } from 'vitest';
import { FlameCarry, PinFactory, PowerKeys, ThreeStates } from '../../src/logic/Castle';

describe('FlameCarry', () => {
  it('leva a chama a cada tocha; o Dogma apaga', () => {
    const f = new FlameCarry([
      { id: 't1', idea: 'razão' },
      { id: 't2', idea: 'liberdade' },
    ]);
    expect(f.light('t1')).toBe(false);
    f.take();
    expect(f.extinguish()).toBe(true);
    expect(f.carrying).toBe(false);
    f.take();
    expect(f.light('t1')).toBe(true);
    expect(f.carrying).toBe(false);
    f.take();
    f.light('t2');
    expect(f.allLit).toBe(true);
    expect(f.extinguished).toBe(1);
  });
});

describe('PowerKeys', () => {
  it('trono com as três = concentrado; uma em cada pedestal = separado', () => {
    const k = new PowerKeys();
    expect(k.concentrated).toBe(true);
    expect(k.take('legislar')).toBe(true);
    expect(k.take('executar')).toBe(false); // só uma por vez
    expect(k.place('A')).toBe('legislar');
    k.take('executar');
    k.place('A');
    expect(k.concentrated).toBe(true); // A com duas
    expect(k.separated).toBe(false);
    k.take('executar');
    k.place('B');
    k.take('julgar');
    k.place('C');
    expect(k.separated).toBe(true);
    expect(k.concentrated).toBe(false);
  });
});

describe('ThreeStates', () => {
  it('reza só abre o andar teológico; medição abre o positivo', () => {
    const t = new ThreeStates(['a', 'b']);
    expect(t.pray(3)).toBe(false);
    expect(t.pray(1)).toBe(true);
    expect(t.isOpen(1)).toBe(true);
    expect(t.placeOrb(2)).toBe(true);
    expect(t.isOpen(3)).toBe(false);
    t.observe('a');
    expect(t.observe('a')).toBe(false);
    t.observe('b');
    expect(t.isOpen(3)).toBe(true);
  });
});

describe('PinFactory', () => {
  const stations = ['cortar', 'afiar', 'cabeca', 'polir', 'embalar'].map((id) => ({ id, name: id }));
  const workers = ['w1', 'w2', 'w3', 'w4', 'w5'];
  it('divisão do trabalho multiplica a produção; pedágios barram a circulação', () => {
    const f = new PinFactory(stations, workers, ['p1', 'p2'], 100);
    expect(f.rate).toBe(1);
    workers.forEach((w, i) => f.assign(w, stations[i].id));
    expect(f.divided).toBe(true);
    expect(f.rate).toBe(48);
    expect(f.flow).toBe(0); // pedágios fechados
    f.openToll('p1');
    expect(f.flow).toBe(24);
    f.openToll('p2');
    expect(f.flow).toBe(48);
    f.tick(1);
    expect(f.gold).toBe(48);
    f.tick(5);
    expect(f.full).toBe(true);
  });
  it('todos na mesma estação não é divisão', () => {
    const f = new PinFactory(stations, workers, ['p1'], 100);
    workers.forEach((w) => f.assign(w, 'cortar'));
    expect(f.divided).toBe(false);
    expect(f.rate).toBeLessThan(10);
  });
});
