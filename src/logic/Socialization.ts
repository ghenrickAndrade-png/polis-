/**
 * Templo do Espelho — indivíduo → sujeito.
 * Cada instituição dá um verbo; com os quatro, o indivíduo vira sujeito.
 */
export const VERBS = ['respeitar', 'ler', 'consertar', 'documento', 'voto'] as const;
export type Verb = (typeof VERBS)[number];

export const INSTITUTIONS: { id: string; name: string; verb: Verb; teaches: string }[] = [
  { id: 'familia', name: 'Família', verb: 'respeitar', teaches: 'respeitar a vez' },
  { id: 'escola', name: 'Escola', verb: 'ler', teaches: 'ler' },
  { id: 'trabalho', name: 'Trabalho', verb: 'consertar', teaches: 'consertar' },
  { id: 'estado', name: 'Estado', verb: 'documento', teaches: 'ter documento e votar' },
];

export class Socialization {
  private verbs = new Set<Verb>();

  learn(v: Verb): boolean {
    const fresh = !this.verbs.has(v);
    this.verbs.add(v);
    return fresh;
  }

  has(v: Verb): boolean {
    return this.verbs.has(v);
  }

  get list(): Verb[] {
    return VERBS.filter((v) => this.verbs.has(v));
  }

  /** Sujeito: passou pelas quatro instituições (o voto vem com o documento). */
  get isSubject(): boolean {
    return (['respeitar', 'ler', 'consertar', 'documento'] as Verb[]).every((v) => this.verbs.has(v));
  }
}

/** Família: a fila. Quem fala por cima não é ouvido; quem espera a vez, chega. */
export class TurnTaking {
  readonly speakers: string[];
  private idx = 0;
  interrupted = 0;
  constructor(speakers: string[]) {
    this.speakers = speakers;
  }
  get current(): string | null {
    return this.speakers[this.idx] ?? null;
  }
  wait(): boolean {
    if (this.idx >= this.speakers.length) return false;
    this.idx++;
    return true;
  }
  interrupt(): void {
    this.interrupted++;
    this.idx = 0;
  }
  get done(): boolean {
    return this.idx >= this.speakers.length;
  }
}

/** Escola: a lição. Três passos no quadro e as placas ficam legíveis. */
export class Lesson {
  readonly steps: string[];
  private done = 0;
  constructor(steps: string[]) {
    this.steps = steps;
  }
  next(): string | null {
    if (this.done >= this.steps.length) return null;
    return this.steps[this.done++];
  }
  get complete(): boolean {
    return this.done >= this.steps.length;
  }
  get progress(): number {
    return this.done;
  }
}

/** Trabalho: a ponte. Tábuas levadas uma a uma. */
export class BridgeRepair {
  readonly needed: number;
  carrying = false;
  placed = 0;
  constructor(needed: number) {
    this.needed = needed;
  }
  take(): boolean {
    if (this.carrying || this.placed >= this.needed) return false;
    this.carrying = true;
    return true;
  }
  place(): boolean {
    if (!this.carrying) return false;
    this.carrying = false;
    this.placed++;
    return true;
  }
  get complete(): boolean {
    return this.placed >= this.needed;
  }
}

/** Estado: documento e voto. */
export class Civic {
  document = false;
  voted: string | null = null;
  readonly proposals: { id: string; text: string; result: string }[];
  constructor(proposals: { id: string; text: string; result: string }[]) {
    this.proposals = proposals;
  }
  getDocument(): void {
    this.document = true;
  }
  vote(id: string): boolean {
    if (!this.document || !this.proposals.some((p) => p.id === id)) return false;
    this.voted = id;
    return true;
  }
  get result(): string | null {
    return this.proposals.find((p) => p.id === this.voted)?.result ?? null;
  }
}
