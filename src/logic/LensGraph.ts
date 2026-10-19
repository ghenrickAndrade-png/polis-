/**
 * LensGraph — a mecânica da Lente de Mills.
 *
 * Problemas privados (troubles) são ligados a questões públicas (issues).
 * Cada trouble tem exatamente uma issue correta. Uma ligação correta fica;
 * uma ligação errada "esgarça" e some, e o jogo mostra a consequência.
 * O puzzle fecha quando todos os troubles estão ligados ao nó certo.
 */
export interface Trouble {
  id: string;
  /** quem sofre o problema */
  who: string;
  /** o problema, como a pessoa conta ("perdi o emprego") */
  text: string;
  /** pista que a Lente revela */
  clue: string;
  /** issue correta */
  issue: string;
  /** fala de consequência quando ligado ao nó errado (genérica) */
  wrongLine?: string;
  /** falas por nó errado (sobrepõem a genérica) */
  wrongLines?: Record<string, string>;
}

export interface Issue {
  id: string;
  label: string;
  /** verdadeiro quando o nó representa uma explicação do senso comum ("falta de esforço") */
  commonSense?: boolean;
}

export interface LinkResult {
  ok: boolean;
  trouble: Trouble;
  issue: Issue;
  /** quantos troubles já estão corretamente ligados a esta issue */
  countOnIssue: number;
  solved: boolean;
}

export class LensGraph {
  readonly troubles: Trouble[];
  readonly issues: Issue[];
  private links = new Map<string, string>();
  private wrongAttempts = 0;
  carrying: string | null = null;

  constructor(troubles: Trouble[], issues: Issue[]) {
    this.troubles = troubles;
    this.issues = issues;
    for (const t of troubles) {
      if (!issues.some((i) => i.id === t.issue)) throw new Error(`issue desconhecida: ${t.issue}`);
    }
  }

  pick(troubleId: string): boolean {
    if (this.links.has(troubleId)) return false;
    if (!this.troubles.some((t) => t.id === troubleId)) return false;
    this.carrying = troubleId;
    return true;
  }

  drop(): void {
    this.carrying = null;
  }

  attach(issueId: string): LinkResult | null {
    if (!this.carrying) return null;
    const trouble = this.troubles.find((t) => t.id === this.carrying);
    const issue = this.issues.find((i) => i.id === issueId);
    if (!trouble || !issue) return null;
    this.carrying = null;
    const ok = trouble.issue === issueId;
    if (ok) this.links.set(trouble.id, issueId);
    else this.wrongAttempts++;
    return { ok, trouble, issue, countOnIssue: this.countOn(issueId), solved: this.solved };
  }

  countOn(issueId: string): number {
    let n = 0;
    for (const v of this.links.values()) if (v === issueId) n++;
    return n;
  }

  isLinked(troubleId: string): boolean {
    return this.links.has(troubleId);
  }

  linkOf(troubleId: string): string | undefined {
    return this.links.get(troubleId);
  }

  get linkedCount(): number {
    return this.links.size;
  }

  get wrong(): number {
    return this.wrongAttempts;
  }

  get solved(): boolean {
    return this.links.size === this.troubles.length;
  }

  /** Issues que receberam pelo menos uma ligação correta, com contagem. */
  summary(): { issue: Issue; troubles: Trouble[] }[] {
    return this.issues
      .map((issue) => ({ issue, troubles: this.troubles.filter((t) => this.links.get(t.id) === issue.id) }))
      .filter((s) => s.troubles.length > 0);
  }
}

/** Narra, nas palavras do livro, o que o jogador construiu. */
export function narrateLens(graph: LensGraph): string {
  const parts = graph.summary().map((s) => {
    const whos = s.troubles.map((t) => `${t.who} (${t.text})`);
    const list = whos.length > 1 ? whos.slice(0, -1).join(', ') + ' e ' + whos[whos.length - 1] : whos[0];
    return `${list} → ${s.issue.label}`;
  });
  return (
    `Você ligou ${graph.linkedCount} problemas privados a ${graph.summary().length} questão(ões) pública(s): ` +
    parts.join('; ') +
    '. Isso é imaginação sociológica: relacionar a vida do indivíduo (esfera particular) com a sociedade e a história (esfera pública).'
  );
}
