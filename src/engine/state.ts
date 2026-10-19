import { MAX_HP } from '../config';
import { bus } from './bus';

export interface JournalEntryState {
  /** Linhas "O que você fez", geradas pelas ações do jogador. */
  did: string[];
  /** Explicação com as minhas palavras (Prova do Sábio). */
  mine?: string;
  unlockedAt: number;
}

export interface SaveData {
  v: number;
  flags: string[];
  items: string[];
  journal: Record<string, JournalEntryState>;
  hp: number;
  name: string;
  look: string;
  room: string;
  spawn: string;
  playtimeMs: number;
  savedAt: number;
  counters: Record<string, number>;
}

const SAVE_KEY = 'polis.save.v1';

class GameStateImpl {
  flags = new Set<string>();
  items = new Set<string>();
  journal = new Map<string, JournalEntryState>();
  counters: Record<string, number> = {};
  hp = MAX_HP;
  name = '???';
  look = 'gray';
  room = 'island';
  spawn = 'start';
  playtimeMs = 0;
  /** Item ativo (ex.: lente ligada). */
  lensOn = false;
  soundOn = false;
  debug = false;
  /** QA: invulnerável */
  god = false;
  /** direção bloqueada por decreto (Montesquieu) */
  blockedDir: 'left' | 'right' | 'up' | 'down' | null = null;

  reset(): void {
    this.flags.clear();
    this.items.clear();
    this.journal.clear();
    this.counters = {};
    this.hp = MAX_HP;
    this.name = '???';
    this.look = 'gray';
    this.room = 'island';
    this.spawn = 'start';
    this.playtimeMs = 0;
    this.lensOn = false;
  }

  has(flag: string): boolean {
    return this.flags.has(flag);
  }

  set(flag: string): void {
    if (this.flags.has(flag)) return;
    this.flags.add(flag);
    bus.emit('flag', flag);
  }

  unset(flag: string): void {
    this.flags.delete(flag);
  }

  hasItem(item: string): boolean {
    return this.items.has(item);
  }

  give(item: string): void {
    if (this.items.has(item)) return;
    this.items.add(item);
    bus.emit('item', item);
  }

  count(key: string, delta = 1): number {
    this.counters[key] = (this.counters[key] ?? 0) + delta;
    return this.counters[key];
  }

  /** Destrava uma página do Caderno; `did` é o que o jogador acabou de fazer. */
  unlockPage(id: string, did?: string): boolean {
    const fresh = !this.journal.has(id);
    if (fresh) this.journal.set(id, { did: [], unlockedAt: Date.now() });
    if (did) this.addDid(id, did);
    if (fresh) bus.emit('journal:unlock', id);
    return fresh;
  }

  addDid(id: string, line: string): void {
    const e = this.journal.get(id);
    if (!e) {
      this.unlockPage(id, line);
      return;
    }
    if (!e.did.includes(line)) e.did.push(line);
  }

  setMine(id: string, text: string): void {
    const e = this.journal.get(id) ?? { did: [], unlockedAt: Date.now() };
    e.mine = text;
    this.journal.set(id, e);
  }

  damage(n = 1): void {
    this.hp = Math.max(0, this.hp - n);
    bus.emit('hp', this.hp, MAX_HP);
    if (this.hp === 0) bus.emit('player:died');
  }

  heal(full = true, n = 1): void {
    this.hp = full ? MAX_HP : Math.min(MAX_HP, this.hp + n);
    bus.emit('hp', this.hp, MAX_HP);
  }

  toJSON(): SaveData {
    return {
      v: 1,
      flags: [...this.flags],
      items: [...this.items],
      journal: Object.fromEntries(this.journal),
      hp: this.hp,
      name: this.name,
      look: this.look,
      room: this.room,
      spawn: this.spawn,
      playtimeMs: this.playtimeMs,
      savedAt: Date.now(),
      counters: this.counters,
    };
  }

  fromJSON(d: SaveData): void {
    this.reset();
    for (const f of d.flags ?? []) this.flags.add(f);
    for (const i of d.items ?? []) this.items.add(i);
    for (const [k, v] of Object.entries(d.journal ?? {})) this.journal.set(k, v);
    this.hp = d.hp ?? MAX_HP;
    this.name = d.name ?? '???';
    this.look = d.look ?? 'gray';
    this.room = d.room ?? 'island';
    this.spawn = d.spawn ?? 'start';
    this.playtimeMs = d.playtimeMs ?? 0;
    this.counters = d.counters ?? {};
  }

  save(): boolean {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.toJSON()));
      return true;
    } catch {
      return false;
    }
  }

  load(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const d = JSON.parse(raw) as SaveData;
      if (!d || d.v !== 1) return false;
      this.fromJSON(d);
      return true;
    } catch {
      return false;
    }
  }

  hasSave(): boolean {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch {
      return false;
    }
  }

  clearSave(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
  }
}

export const state = new GameStateImpl();
