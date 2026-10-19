/**
 * Norms — fatos sociais como muros invisíveis.
 * - exterioridade: os muros já existiam antes do jogador (os NPCs desviam deles)
 * - coercitividade: tocar neles empurra o jogador de volta
 * - generalidade: todos os NPCs desviam
 * A língua local é um fato social que só cai quando o jogador aprende com o grupo.
 */
export interface Norm {
  id: string;
  rule: string;
}

export class NormCorridor {
  readonly norms: Norm[];
  private bumps = new Map<string, number>();
  private observed = new Set<string>();
  revealed = false;

  constructor(norms: Norm[]) {
    this.norms = norms;
  }

  /** O jogador esbarrou na norma `id`. Retorna quantas vezes já esbarrou. */
  bump(id: string): number {
    const n = (this.bumps.get(id) ?? 0) + 1;
    this.bumps.set(id, n);
    return n;
  }

  bumpsOf(id: string): number {
    return this.bumps.get(id) ?? 0;
  }

  get totalBumps(): number {
    let t = 0;
    for (const v of this.bumps.values()) t += v;
    return t;
  }

  /** Um NPC desviou da norma perto do jogador. */
  observe(id: string): void {
    this.observed.add(id);
  }

  get observedCount(): number {
    return this.observed.size;
  }

  /** Com a Engrenagem ligada e pelo menos uma observação, os muros aparecem. */
  reveal(): boolean {
    if (this.observed.size === 0 && this.totalBumps === 0) return false;
    this.revealed = true;
    return true;
  }
}

export class LanguageGate {
  readonly words: { id: string; word: string; meaning: string; teacher: string }[];
  private learned = new Set<string>();

  constructor(words: { id: string; word: string; meaning: string; teacher: string }[]) {
    this.words = words;
  }

  learn(id: string): boolean {
    if (!this.words.some((w) => w.id === id)) return false;
    const fresh = !this.learned.has(id);
    this.learned.add(id);
    return fresh;
  }

  knows(id: string): boolean {
    return this.learned.has(id);
  }

  get learnedCount(): number {
    return this.learned.size;
  }

  /** Só sabe cumprimentar quando aprendeu com o grupo inteiro. */
  get canGreet(): boolean {
    return this.learned.size === this.words.length;
  }

  greeting(): string {
    return this.words.map((w) => w.word).join(' ');
  }
}

/** A Anomia: a névoa apaga normas e tira as pessoas de suas funções. */
export class Anomie {
  private normsLit = new Set<string>();
  private rolesBack = new Set<string>();

  constructor(
    readonly normIds: string[],
    readonly roleIds: string[],
  ) {}

  relight(normId: string): boolean {
    if (!this.normIds.includes(normId) || this.normsLit.has(normId)) return false;
    this.normsLit.add(normId);
    return true;
  }

  bringBack(roleId: string): boolean {
    if (!this.roleIds.includes(roleId) || this.rolesBack.has(roleId)) return false;
    this.rolesBack.add(roleId);
    return true;
  }

  isLit(normId: string): boolean {
    return this.normsLit.has(normId);
  }

  isBack(roleId: string): boolean {
    return this.rolesBack.has(roleId);
  }

  get total(): number {
    return this.normIds.length + this.roleIds.length;
  }

  get done(): number {
    return this.normsLit.size + this.rolesBack.size;
  }

  /** 1 = névoa total, 0 = dissipada */
  get density(): number {
    return 1 - this.done / this.total;
  }

  get dissipated(): boolean {
    return this.done === this.total;
  }
}
