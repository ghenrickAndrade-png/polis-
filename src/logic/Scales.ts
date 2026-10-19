/**
 * Torre das Escalas — micro × macro.
 * Um fato só aparece numa escala: as pessoas (micro) só se ouvem na rua;
 * os fluxos (macro) só se veem no mapa. A análise fecha com os dois.
 */
export type Scale = 'micro' | 'macro';

export interface Fact {
  id: string;
  scale: Scale;
  text: string;
}

export class ScaleAnalysis {
  readonly facts: Fact[];
  private collected = new Set<string>();

  constructor(facts: Fact[]) {
    this.facts = facts;
  }

  /** Coleta um fato se a escala atual for a escala do fato. */
  collect(id: string, current: Scale): 'ok' | 'wrong-scale' | 'done' | 'unknown' {
    const f = this.facts.find((x) => x.id === id);
    if (!f) return 'unknown';
    if (this.collected.has(id)) return 'done';
    if (f.scale !== current) return 'wrong-scale';
    this.collected.add(id);
    return 'ok';
  }

  has(id: string): boolean {
    return this.collected.has(id);
  }

  count(scale: Scale): number {
    return this.facts.filter((f) => f.scale === scale && this.collected.has(f.id)).length;
  }

  total(scale: Scale): number {
    return this.facts.filter((f) => f.scale === scale).length;
  }

  get complete(): boolean {
    return this.collected.size === this.facts.length;
  }
}

/** Prova: classificar situações novas; a errada "não fecha" e volta. */
export class ScaleSort {
  readonly cards: { id: string; text: string; scale: Scale }[];
  private placed = new Map<string, Scale>();
  wrong = 0;

  constructor(cards: { id: string; text: string; scale: Scale }[]) {
    this.cards = cards;
  }

  place(id: string, scale: Scale): boolean {
    const c = this.cards.find((x) => x.id === id);
    if (!c) return false;
    if (c.scale === scale) {
      this.placed.set(id, scale);
      return true;
    }
    this.wrong++;
    return false;
  }

  isPlaced(id: string): boolean {
    return this.placed.has(id);
  }

  get complete(): boolean {
    return this.placed.size === this.cards.length;
  }
}
