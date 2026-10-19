/**
 * OriginReveal — sala da desnaturalização.
 * Regras que os NPCs chamam de "naturais" têm data e autor.
 * Revelar a origem torna a regra questionável; questionar abre o caminho.
 */
export interface NaturalRule {
  id: string;
  /** como a regra é dita ("Mulheres não entram na biblioteca") */
  rule: string;
  /** o que a Lente revela */
  origin: string;
  /** fala do guarda antes de revelar */
  guardBefore: string;
  /** fala do guarda depois de revelar */
  guardAfter: string;
}

export class OriginReveal {
  readonly rules: NaturalRule[];
  private revealed = new Set<string>();
  private questioned = new Set<string>();

  constructor(rules: NaturalRule[]) {
    this.rules = rules;
  }

  reveal(id: string): NaturalRule | null {
    const r = this.rules.find((x) => x.id === id);
    if (!r) return null;
    this.revealed.add(id);
    return r;
  }

  isRevealed(id: string): boolean {
    return this.revealed.has(id);
  }

  /** Só é possível questionar uma regra cuja origem já foi revelada. */
  question(id: string): boolean {
    if (!this.revealed.has(id)) return false;
    this.questioned.add(id);
    return true;
  }

  isOpen(id: string): boolean {
    return this.questioned.has(id);
  }

  get solved(): boolean {
    return this.rules.every((r) => this.questioned.has(r.id));
  }
}
