/**
 * Timeline — sala das duas linhas do tempo.
 * Eventos da esfera particular (biografia) são encaixados sobre os
 * acontecimentos da esfera pública (história) que os explicam.
 */
export interface PersonalEvent {
  id: string;
  text: string;
  year: number;
  /** evento público que explica */
  cause: string;
}
export interface PublicEvent {
  id: string;
  text: string;
  year: number;
}

export class Timeline {
  readonly personal: PersonalEvent[];
  readonly history: PublicEvent[];
  private placed = new Map<string, string>();
  carrying: string | null = null;

  constructor(personal: PersonalEvent[], history: PublicEvent[]) {
    this.personal = personal;
    this.history = history;
  }

  pick(personalId: string): boolean {
    if (this.placed.has(personalId)) return false;
    if (!this.personal.some((p) => p.id === personalId)) return false;
    this.carrying = personalId;
    return true;
  }

  /** Tenta encaixar o evento carregado sobre um acontecimento público. */
  place(publicId: string): { ok: boolean; personal: PersonalEvent; pub: PublicEvent } | null {
    if (!this.carrying) return null;
    const personal = this.personal.find((p) => p.id === this.carrying);
    const pub = this.history.find((h) => h.id === publicId);
    if (!personal || !pub) return null;
    this.carrying = null;
    const taken = [...this.placed.values()].includes(publicId);
    const ok = personal.cause === publicId && !taken;
    if (ok) this.placed.set(personal.id, publicId);
    return { ok, personal, pub };
  }

  isPlaced(personalId: string): boolean {
    return this.placed.has(personalId);
  }

  get placedCount(): number {
    return this.placed.size;
  }

  get solved(): boolean {
    return this.placed.size === this.personal.length;
  }
}
