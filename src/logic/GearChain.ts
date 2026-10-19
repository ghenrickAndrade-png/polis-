/**
 * GearChain — divisão do trabalho como engrenagens.
 *
 * Na Cidade (solidariedade orgânica) os papéis formam uma cadeia: cada um
 * depende do seguinte, como engrenagens em anel; tirar um papel trava todos.
 * Na Aldeia (solidariedade mecânica) todos fazem o mesmo: tirar um não muda
 * nada, porque ninguém depende de ninguém em particular.
 */
export interface Role {
  id: string;
  name: string;
  /** o que este papel entrega para o seguinte */
  gives: string;
}

export class GearChain {
  readonly roles: Role[];
  readonly chained: boolean;
  private present: Set<string>;

  constructor(roles: Role[], chained: boolean) {
    this.roles = roles;
    this.chained = chained;
    this.present = new Set(roles.map((r) => r.id));
  }

  remove(id: string): boolean {
    if (!this.present.has(id)) return false;
    this.present.delete(id);
    return true;
  }

  restore(id: string): boolean {
    if (!this.roles.some((r) => r.id === id) || this.present.has(id)) return false;
    this.present.add(id);
    return true;
  }

  isPresent(id: string): boolean {
    return this.present.has(id);
  }

  get missing(): Role[] {
    return this.roles.filter((r) => !this.present.has(r.id));
  }

  /** A produção anda? Em cadeia, só com todos; em paralelo, com qualquer um. */
  get running(): boolean {
    return this.chained ? this.missing.length === 0 : this.present.size > 0;
  }

  /** Quem para quando `id` sai: em cadeia, todos os outros; em paralelo, ninguém. */
  stoppedBy(id: string): Role[] {
    if (!this.chained) return [];
    return this.roles.filter((r) => r.id !== id);
  }

  /** O papel seguinte no anel (quem recebe o que `id` entrega). */
  next(id: string): Role | undefined {
    const i = this.roles.findIndex((r) => r.id === id);
    if (i < 0) return undefined;
    return this.roles[(i + 1) % this.roles.length];
  }
}

/**
 * Settlement — a Vila Nova: colonos escolhem funções.
 * Todas diferentes → orgânica (interdependência); todas iguais → mecânica
 * (semelhança); o resto é mista e não gira.
 */
export type SettlementKind = 'vazia' | 'mecanica' | 'organica' | 'mista';

export class Settlement {
  readonly roles: Role[];
  readonly settlers: string[];
  private choice = new Map<string, string>();

  constructor(roles: Role[], settlers: string[]) {
    this.roles = roles;
    this.settlers = settlers;
  }

  assign(settler: string, roleId: string): boolean {
    if (!this.settlers.includes(settler) || !this.roles.some((r) => r.id === roleId)) return false;
    this.choice.set(settler, roleId);
    return true;
  }

  roleOf(settler: string): string | undefined {
    return this.choice.get(settler);
  }

  /** colonos em cada função */
  countOf(roleId: string): number {
    let n = 0;
    for (const v of this.choice.values()) if (v === roleId) n++;
    return n;
  }

  get assignedCount(): number {
    return this.choice.size;
  }

  get kind(): SettlementKind {
    if (this.choice.size === 0) return 'vazia';
    const distinct = new Set(this.choice.values());
    if (distinct.size === 1 && this.choice.size === this.settlers.length) return 'mecanica';
    if (distinct.size === this.roles.length && this.choice.size === this.settlers.length) return 'organica';
    return 'mista';
  }

  get missingRoles(): Role[] {
    return this.roles.filter((r) => this.countOf(r.id) === 0);
  }

  /** A vila gira (engrenagens encaixadas) só quando é orgânica. */
  get running(): boolean {
    return this.kind === 'organica';
  }
}

export function narrateSettlement(s: Settlement, nameOf: (id: string) => string = (id) => id): string {
  const parts = s.roles.map((r) => {
    const who = s.settlers.filter((x) => s.roleOf(x) === r.id).map(nameOf);
    return who.length ? `${who.join(' e ')} → ${r.name}` : null;
  });
  const list = parts.filter(Boolean).join('; ');
  if (s.kind === 'organica')
    return `Você montou uma vila com ${s.roles.length} funções diferentes (${list}): cada um depende dos outros, como os órgãos de um corpo. Isso é solidariedade orgânica: grande divisão do trabalho, consciência coletiva mais fraca, consciência individual com mais espaço, e união pela interdependência.`;
  if (s.kind === 'mecanica')
    return `Você montou uma aldeia em que todos fazem a mesma coisa (${list}): a união vem da semelhança e a consciência coletiva é muito forte. Isso é solidariedade mecânica, típica das sociedades simples e tradicionais.`;
  return `A vila ficou mista (${list}): faltam funções (${s.missingRoles.map((r) => r.name).join(', ')}), então as engrenagens não encaixam e ninguém depende de todos.`;
}
