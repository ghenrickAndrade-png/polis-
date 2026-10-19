/**
 * Castelo das Luzes — lógica pura.
 */

/** Tochas da Razão: levar a chama do centro a cada tocha; o Dogma apaga a chama. */
export class FlameCarry {
  readonly torches: { id: string; idea: string }[];
  private lit = new Set<string>();
  carrying = false;
  extinguished = 0;

  constructor(torches: { id: string; idea: string }[]) {
    this.torches = torches;
  }

  take(): void {
    this.carrying = true;
  }

  /** O Dogma sopra: a chama apaga. */
  extinguish(): boolean {
    if (!this.carrying) return false;
    this.carrying = false;
    this.extinguished++;
    return true;
  }

  light(id: string): boolean {
    if (!this.carrying || !this.torches.some((t) => t.id === id) || this.lit.has(id)) return false;
    this.lit.add(id);
    this.carrying = false;
    return true;
  }

  isLit(id: string): boolean {
    return this.lit.has(id);
  }

  get litCount(): number {
    return this.lit.size;
  }

  get allLit(): boolean {
    return this.lit.size === this.torches.length;
  }
}

/** Três Chaves (Montesquieu): legislar, executar, julgar. */
export type Holder = 'trono' | 'A' | 'B' | 'C' | 'player';

export class PowerKeys {
  readonly keys = ['legislar', 'executar', 'julgar'] as const;
  private holder = new Map<string, Holder>();

  constructor() {
    for (const k of this.keys) this.holder.set(k, 'trono');
  }

  holderOf(key: string): Holder | undefined {
    return this.holder.get(key);
  }

  carrying(): string | null {
    for (const [k, h] of this.holder) if (h === 'player') return k;
    return null;
  }

  take(key: string): boolean {
    if (!this.holder.has(key) || this.carrying()) return false;
    this.holder.set(key, 'player');
    return true;
  }

  /** Coloca a chave carregada num pedestal (ou de volta no trono). */
  place(where: Exclude<Holder, 'player'>): string | null {
    const k = this.carrying();
    if (!k) return null;
    this.holder.set(k, where);
    return k;
  }

  keysAt(where: Holder): string[] {
    return [...this.holder].filter(([, h]) => h === where).map(([k]) => k);
  }

  /** Alguém (fora o jogador) segura duas ou mais chaves: poder arbitrário. */
  get concentrated(): boolean {
    for (const w of ['trono', 'A', 'B', 'C'] as const) if (this.keysAt(w).length >= 2) return true;
    return false;
  }

  /** Cada pedestal com exatamente uma chave: os poderes se vigiam. */
  get separated(): boolean {
    return (['A', 'B', 'C'] as const).every((p) => this.keysAt(p).length === 1);
  }
}

/** Torre dos Três Estados (Comte). */
export class ThreeStates {
  prayed = false;
  orbPlaced = false;
  private observed = new Set<string>();
  readonly subjects: string[];
  constructor(subjects: string[]) {
    this.subjects = subjects;
  }

  pray(floor: 1 | 2 | 3): boolean {
    if (floor === 1) {
      this.prayed = true;
      return true;
    }
    return false;
  }

  placeOrb(floor: 1 | 2 | 3): boolean {
    if (floor === 2) {
      this.orbPlaced = true;
      return true;
    }
    return false;
  }

  observe(subject: string): boolean {
    if (!this.subjects.includes(subject) || this.observed.has(subject)) return false;
    this.observed.add(subject);
    return true;
  }

  get observedCount(): number {
    return this.observed.size;
  }

  isOpen(floor: 1 | 2 | 3): boolean {
    if (floor === 1) return this.prayed;
    if (floor === 2) return this.orbPlaced;
    return this.observed.size === this.subjects.length;
  }
}

/** Fábrica de Alfinetes (Smith). */
export class PinFactory {
  readonly stations: { id: string; name: string }[];
  readonly workers: string[];
  private assignment = new Map<string, string>();
  readonly tolls: string[];
  private openTolls = new Set<string>();
  gold = 0;
  readonly target: number;

  constructor(stations: { id: string; name: string }[], workers: string[], tolls: string[], target = 100) {
    this.stations = stations;
    this.workers = workers;
    this.tolls = tolls;
    this.target = target;
  }

  assign(worker: string, station: string): boolean {
    if (!this.workers.includes(worker) || !this.stations.some((s) => s.id === station)) return false;
    this.assignment.set(worker, station);
    return true;
  }

  stationOf(worker: string): string | undefined {
    return this.assignment.get(worker);
  }

  get divided(): boolean {
    const distinct = new Set(this.assignment.values());
    return distinct.size === this.stations.length && this.assignment.size === this.workers.length;
  }

  /** Alfinetes por ciclo: sozinhos, quase nada; divididos, muitos. */
  get rate(): number {
    if (this.divided) return 48;
    return this.assignment.size === 0 ? 1 : Math.max(1, Math.round((this.assignment.size * 2) / 5));
  }

  openToll(id: string): boolean {
    if (!this.tolls.includes(id) || this.openTolls.has(id)) return false;
    this.openTolls.add(id);
    return true;
  }

  isOpen(id: string): boolean {
    return this.openTolls.has(id);
  }

  /** Riqueza que circula: produção × estradas abertas. Pedágio fechado barra tudo. */
  get flow(): number {
    const open = this.openTolls.size / this.tolls.length;
    return this.rate * open;
  }

  tick(seconds: number): void {
    this.gold = Math.min(this.target, this.gold + this.flow * seconds);
  }

  get full(): boolean {
    return this.gold >= this.target;
  }
}
