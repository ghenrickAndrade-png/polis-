import { describe, expect, it } from 'vitest';
import { CAUSES, DISTRICTS } from '../../src/content/districtsData';
import { ACTIONS_PER_WEEK, DistrictSim, Report, WEEKS, narrateDistricts } from '../../src/logic/Districts';

function run(sim: DistrictSim): void {
  while (!sim.finished) sim.tick();
}

describe('DistrictSim (Distritos)', () => {
  it('sem ação nenhuma, a periferia morre mais que o centro', () => {
    const sim = new DistrictSim(DISTRICTS);
    run(sim);
    const r = sim.resumo();
    expect(r.periferia).toBeGreaterThan(r.centro * 2);
    expect(sim.ranking()[0].id).not.toBe('centro');
  });

  it('sem SUS, morre mais — e a desigualdade aumenta', () => {
    const sim = new DistrictSim(DISTRICTS);
    run(sim);
    const alt = sim.counterfactual().resumo();
    const r = sim.resumo();
    expect(alt.periferia).toBeGreaterThan(r.periferia);
    expect(alt.centro).toBeGreaterThanOrEqual(r.centro);
    // a diferença absoluta periferia−centro cresce sem SUS
    expect(alt.periferia - alt.centro).toBeGreaterThan(r.periferia - r.centro);
  });

  it('ações do SUS num distrito reduzem as mortes dele', () => {
    const a = new DistrictSim(DISTRICTS);
    const b = new DistrictSim(DISTRICTS);
    expect(b.act('grajau', 'leitos')).toBe('ok');
    expect(b.act('grajau', 'vacina')).toBe('ok');
    run(a);
    run(b);
    expect(b.mortes('grajau')).toBeLessThan(a.mortes('grajau'));
    expect(b.mortes('centro')).toBe(a.mortes('centro'));
  });

  it('só há 2 ações por semana, e não se repete a mesma ação no mesmo distrito', () => {
    const sim = new DistrictSim(DISTRICTS);
    expect(sim.act('grajau', 'testes')).toBe('ok');
    expect(sim.act('grajau', 'testes')).toBe('already');
    expect(sim.act('angela', 'testes')).toBe('ok');
    expect(sim.act('capao', 'testes')).toBe('no-actions');
    sim.tick();
    expect(sim.actionsLeft).toBe(ACTIONS_PER_WEEK);
    expect(sim.act('capao', 'testes')).toBe('ok');
  });

  it('a onda dura 6 semanas e depois acaba', () => {
    const sim = new DistrictSim(DISTRICTS);
    for (let i = 0; i < WEEKS; i++) expect(sim.finished).toBe(false), sim.tick();
    expect(sim.finished).toBe(true);
    expect(sim.act('centro', 'leitos')).toBe('finished');
    expect(Object.keys(sim.tick())).toHaveLength(0);
  });

  it('a vacinação só vale a partir da semana seguinte', () => {
    const a = new DistrictSim(DISTRICTS);
    const b = new DistrictSim(DISTRICTS);
    b.act('grajau', 'vacina');
    const ta = a.tick();
    const tb = b.tick();
    expect(tb.grajau.mortes).toBe(ta.grajau.mortes);
    const ta2 = a.tick();
    const tb2 = b.tick();
    expect(tb2.grajau.mortes).toBeLessThan(ta2.grajau.mortes);
  });

  it('concentrar o SUS na periferia fecha a diferença mais que espalhar no centro', () => {
    const peri = new DistrictSim(DISTRICTS);
    const cen = new DistrictSim(DISTRICTS);
    const periIds = DISTRICTS.filter((d) => d.periferia).map((d) => d.id);
    // mesma quantidade de ações: 6 no total
    for (let w = 0; w < 3; w++) {
      peri.act(periIds[w * 2], 'leitos');
      peri.act(periIds[w * 2 + 1], 'leitos');
      cen.act('centro', (['leitos', 'testes', 'vacina'] as const)[w]);
      cen.act(periIds[w], 'testes');
      peri.tick();
      cen.tick();
    }
    run(peri);
    run(cen);
    const gp = peri.resumo();
    const gc = cen.resumo();
    expect(gp.periferia - gp.centro).toBeLessThan(gc.periferia - gc.centro);
  });
});

describe('Report (relatório dos Distritos)', () => {
  it('aceita só causas que estão nos dados; a errada não entra e conta', () => {
    const r = new Report(CAUSES);
    expect(r.pick('descuido')).toBe('wrong');
    expect(r.chosen).toHaveLength(0);
    expect(r.wrong).toBe(1);
    expect(r.pick('casas')).toBe('ok');
    expect(r.pick('casas')).toBe('dup');
    expect(r.pick('zzz')).toBe('unknown');
    expect(r.remaining().some((c) => c.id === 'casas')).toBe(false);
  });

  it('fecha com três causas dos dados', () => {
    const r = new Report(CAUSES);
    r.pick('casas');
    r.pick('transporte');
    expect(r.complete).toBe(false);
    r.pick('plano');
    expect(r.complete).toBe(true);
  });

  it('há cinco causas nos dados e três do senso comum', () => {
    expect(CAUSES.filter((c) => c.nosDados)).toHaveLength(5);
    expect(CAUSES.filter((c) => !c.nosDados)).toHaveLength(3);
  });
});

describe('narrateDistricts', () => {
  it('conta a onda do jogador com os nomes e números dele', () => {
    const sim = new DistrictSim(DISTRICTS);
    sim.act('grajau', 'leitos');
    sim.act('angela', 'vacina');
    run(sim);
    const r = new Report(CAUSES);
    r.pick('casas');
    r.pick('transporte');
    r.pick('plano');
    const t = narrateDistricts(sim, r);
    expect(t).toContain('2 ações do SUS');
    expect(t).toContain('a maior parte na periferia');
    expect(t).toContain('casas cheias');
    expect(t).toContain('Sem o SUS');
    expect(t).toContain('direito de todos e dever do Estado');
    expect(t).not.toMatch(/grajau|angela/); // ids não vazam
  });
});
