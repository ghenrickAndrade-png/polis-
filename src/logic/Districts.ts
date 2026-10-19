/**
 * Distritos — SUS, desigualdade e pandemia (pág. 29).
 * Uma onda de 6 semanas passa pela cidade. Cada distrito tem exposição (casas cheias,
 * transporte lotado, trabalho presencial) e acesso a cuidado (plano de saúde). O SUS
 * cobre quem não tem plano; as ações do jogador (testes, leitos, vacinação) reforçam
 * o SUS onde ele escolher. Tudo por 100 mil habitantes, para comparar distritos.
 */
export type Action = 'testes' | 'leitos' | 'vacina';
export const ACTIONS: Action[] = ['testes', 'leitos', 'vacina'];

export interface DistrictDef {
  id: string;
  name: string;
  zona: string;
  periferia: boolean;
  /** 0..1 — casas cheias, transporte lotado, trabalho presencial */
  exposicao: number;
  /** 0..1 — parcela com plano de saúde */
  plano: number;
}

export interface DistrictState {
  casos: number;
  mortes: number;
  actions: Set<Action>;
  /** semana em que a vacinação começou (vale a partir da seguinte) */
  vacinaDesde: number | null;
}

export const WEEKS = 6;
export const ACTIONS_PER_WEEK = 2;
/** forma da onda, semana a semana */
export const WAVE = [0.4, 0.8, 1.0, 0.9, 0.6, 0.3];
const CASOS_BASE = 600; // por 100 mil, numa semana de pico, com exposição 1
const CFR_COM_CUIDADO = 0.015;
const CFR_SEM_CUIDADO = 0.06;
/** cobertura do SUS para quem não tem plano (capacidade limitada) */
const SUS_COBERTURA = 0.55;

export interface SimOptions {
  /** contrafactual: e se não houvesse SUS? só quem tem plano recebe cuidado */
  semSus?: boolean;
}

export class DistrictSim {
  readonly defs: DistrictDef[];
  readonly st = new Map<string, DistrictState>();
  week = 0;
  actionsLeft = ACTIONS_PER_WEEK;
  private opts: SimOptions;

  constructor(defs: DistrictDef[], opts: SimOptions = {}) {
    this.defs = defs;
    this.opts = opts;
    for (const d of defs) this.st.set(d.id, { casos: 0, mortes: 0, actions: new Set(), vacinaDesde: null });
  }

  get finished(): boolean {
    return this.week >= WEEKS;
  }

  canAct(id: string, a: Action): 'ok' | 'no-actions' | 'already' | 'finished' | 'unknown' {
    const s = this.st.get(id);
    if (!s) return 'unknown';
    if (this.finished) return 'finished';
    if (s.actions.has(a)) return 'already';
    if (this.actionsLeft <= 0) return 'no-actions';
    return 'ok';
  }

  act(id: string, a: Action): ReturnType<DistrictSim['canAct']> {
    const r = this.canAct(id, a);
    if (r !== 'ok') return r;
    const s = this.st.get(id)!;
    s.actions.add(a);
    if (a === 'vacina') s.vacinaDesde = this.week;
    this.actionsLeft--;
    return 'ok';
  }

  /** Taxa de cuidado (0..1) de um distrito, dadas as ações. */
  cuidado(d: DistrictDef, s: DistrictState): number {
    let c = this.opts.semSus ? d.plano : d.plano + (1 - d.plano) * SUS_COBERTURA;
    if (!this.opts.semSus && s.actions.has('leitos')) c += 0.3;
    return Math.min(1, c);
  }

  /** Avança uma semana. Devolve mortes novas por distrito. */
  tick(): Record<string, { casos: number; mortes: number }> {
    const out: Record<string, { casos: number; mortes: number }> = {};
    if (this.finished) return out;
    const w = WAVE[this.week];
    for (const d of this.defs) {
      const s = this.st.get(d.id)!;
      const sus = !this.opts.semSus;
      const vacinaAtiva = sus && s.vacinaDesde !== null && this.week > s.vacinaDesde;
      let casos = CASOS_BASE * d.exposicao * w;
      if (sus && s.actions.has('testes')) casos *= 0.75;
      if (vacinaAtiva) casos *= 0.7;
      const c = this.cuidado(d, s);
      let cfr = c * CFR_COM_CUIDADO + (1 - c) * CFR_SEM_CUIDADO;
      if (vacinaAtiva) cfr *= 0.5;
      const mortes = casos * cfr;
      s.casos += casos;
      s.mortes += mortes;
      out[d.id] = { casos: Math.round(casos), mortes: Math.round(mortes) };
    }
    this.week++;
    this.actionsLeft = ACTIONS_PER_WEEK;
    return out;
  }

  /** Roda a onda inteira com as mesmas ações, mas sem SUS. */
  counterfactual(): DistrictSim {
    const alt = new DistrictSim(this.defs, { semSus: true });
    for (const d of this.defs) {
      const s = this.st.get(d.id)!;
      const t = alt.st.get(d.id)!;
      for (const a of s.actions) t.actions.add(a);
      t.vacinaDesde = s.vacinaDesde;
    }
    while (!alt.finished) alt.tick();
    return alt;
  }

  mortes(id: string): number {
    return Math.round(this.st.get(id)?.mortes ?? 0);
  }
  casos(id: string): number {
    return Math.round(this.st.get(id)?.casos ?? 0);
  }

  /** Média de mortes por 100 mil na periferia e no centro. */
  resumo(): { periferia: number; centro: number } {
    const per = this.defs.filter((d) => d.periferia);
    const cen = this.defs.filter((d) => !d.periferia);
    const avg = (xs: DistrictDef[]) => (xs.length ? Math.round(xs.reduce((a, d) => a + this.mortes(d.id), 0) / xs.length) : 0);
    return { periferia: avg(per), centro: avg(cen) };
  }

  /** Quantas ações foram para a periferia e quantas para o centro. */
  alocacao(): { periferia: number; centro: number } {
    let p = 0;
    let c = 0;
    for (const d of this.defs) {
      const n = this.st.get(d.id)!.actions.size;
      if (d.periferia) p += n;
      else c += n;
    }
    return { periferia: p, centro: c };
  }

  ranking(): { id: string; name: string; mortes: number }[] {
    return this.defs.map((d) => ({ id: d.id, name: d.name, mortes: this.mortes(d.id) })).sort((a, b) => b.mortes - a.mortes);
  }
}

/** Relatório: causas que explicam a diferença entre periferia e centro. */
export interface Cause {
  id: string;
  text: string;
  /** aparece nas fichas lidas? */
  nosDados: boolean;
}

export class Report {
  readonly causes: Cause[];
  readonly chosen: string[] = [];
  readonly needed: number;
  wrong = 0;
  constructor(causes: Cause[], needed = 3) {
    this.causes = causes;
    this.needed = needed;
  }
  pick(id: string): 'ok' | 'wrong' | 'dup' | 'unknown' {
    const c = this.causes.find((x) => x.id === id);
    if (!c) return 'unknown';
    if (this.chosen.includes(id)) return 'dup';
    if (!c.nosDados) {
      this.wrong++;
      return 'wrong';
    }
    this.chosen.push(id);
    return 'ok';
  }
  get complete(): boolean {
    return this.chosen.length >= this.needed;
  }
  remaining(): Cause[] {
    return this.causes.filter((c) => !this.chosen.includes(c.id));
  }
}

/** "Com as minhas palavras": narra a onda que o jogador rodou. */
export function narrateDistricts(sim: DistrictSim, report: Report): string {
  const r = sim.resumo();
  const alt = sim.counterfactual().resumo();
  const al = sim.alocacao();
  const top = sim.ranking()[0];
  const causes = report.chosen
    .map((id) => report.causes.find((c) => c.id === id)?.text ?? id)
    .join(', ');
  const onde = al.periferia > al.centro ? 'a maior parte na periferia' : al.periferia < al.centro ? 'a maior parte no centro' : 'metade no centro, metade na periferia';
  const efeito =
    r.periferia > r.centro
      ? `a periferia ainda teve mais mortes que o centro (${r.periferia} contra ${r.centro} por 100 mil)`
      : `a periferia terminou com mortes iguais ou menores que as do centro (${r.periferia} contra ${r.centro} por 100 mil)`;
  return (
    `Na minha onda, ${top.name} foi o distrito com mais mortes (${top.mortes} por 100 mil). ` +
    `Coloquei ${al.periferia + al.centro} ações do SUS, ${onde}, e ${efeito}. ` +
    `Sem o SUS, a periferia teria ${alt.periferia} mortes por 100 mil e o centro ${alt.centro}: a desigualdade ficaria maior, porque quem não tem plano de saúde só tem o SUS. ` +
    `A diferença entre periferia e centro vem dos dados das fichas: ${causes}. ` +
    `Saúde é direito de todos e dever do Estado, e a pandemia atingiu mais os mais pobres.`
  );
}
