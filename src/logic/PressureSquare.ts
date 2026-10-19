/**
 * PressureSquare — a praça digital.
 * Cada pessoa tem um pensamento (vida privada) e um post (vida pública).
 * A pressão do grupo faz o post ser diferente do pensamento.
 * Apoiar o pensamento verdadeiro de alguém baixa a pressão sobre os
 * vizinhos; abaixo de um limiar, eles também passam a postar o que pensam.
 */
export interface Poster {
  id: string;
  name: string;
  thought: string;
  post: string;
  /** quanto de pressão a pessoa sente (0–10); honesta quando pressão <= tolerance */
  pressure: number;
  tolerance: number;
  /** ids dos vizinhos que ela influencia */
  neighbors: string[];
}

export class PressureSquare {
  readonly posters: Poster[];
  private honest = new Set<string>();

  constructor(posters: Poster[]) {
    this.posters = posters.map((p) => ({ ...p }));
    for (const p of this.posters) if (p.pressure <= p.tolerance) this.honest.add(p.id);
  }

  isHonest(id: string): boolean {
    return this.honest.has(id);
  }

  get honestCount(): number {
    return this.honest.size;
  }

  /** Pressão média do grupo (0–10). */
  get groupPressure(): number {
    const sum = this.posters.reduce((a, p) => a + p.pressure, 0);
    return Math.round((sum / this.posters.length) * 10) / 10;
  }

  /**
   * Apoia o pensamento de `id`: ela passa a postar o que pensa e a pressão
   * cai nos vizinhos; vizinhos abaixo da tolerância também viram honestos
   * (cascata). Retorna quem mudou.
   */
  support(id: string): string[] {
    const p = this.posters.find((x) => x.id === id);
    if (!p || this.honest.has(id)) return [];
    const changed: string[] = [];
    const queue = [id];
    this.honest.add(id);
    changed.push(id);
    while (queue.length) {
      const curId = queue.shift()!;
      const cur = this.posters.find((x) => x.id === curId);
      if (!cur) continue;
      for (const nId of cur.neighbors) {
        const n = this.posters.find((x) => x.id === nId);
        if (!n) continue;
        n.pressure = Math.max(0, n.pressure - 3);
        if (!this.honest.has(n.id) && n.pressure <= n.tolerance) {
          this.honest.add(n.id);
          changed.push(n.id);
          queue.push(n.id);
        }
      }
    }
    return changed;
  }

  /** "Deixar quieto": nada muda; a pressão continua. */
  ignore(): void {
    /* consequência: nenhuma mudança */
  }

  get solved(): boolean {
    return this.honest.size === this.posters.length;
  }
}
