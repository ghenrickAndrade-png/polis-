import Phaser from 'phaser';
import { FONT, TEXT_RES } from '../config';
import { bus } from '../engine/bus';
import type { Npc } from '../engine/Npc';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { LensGraph, type LinkResult } from '../logic/LensGraph';
import type { RoomScene } from '../scenes/RoomScene';

export interface LensBoardOpts {
  npcFor: (troubleId: string) => Npc | undefined;
  pillarFor: (issueId: string) => Phaser.GameObjects.Image | undefined;
  onLink?: (r: LinkResult) => void;
  onSolved: () => void;
  /** fala curta quando o jogador tenta pegar um fio já ligado */
  linkedLine?: string;
}

interface Frayed {
  from: { x: number; y: number };
  to: { x: number; y: number };
  until: number;
}

/**
 * LensBoard — a parte visual da mecânica da Lente (fios, bolhas, pilares).
 * Reutilizada pela Sala dos Fios, pelo chefe e pela Prova do Sábio.
 */
export class LensBoard {
  readonly graph: LensGraph;
  private g: Phaser.GameObjects.Graphics;
  private labels = new Map<string, Phaser.GameObjects.Text>();
  private frayed: Frayed[] = [];
  private lensOn = false;
  private pillarPos = new Map<string, { x: number; y: number }>();

  constructor(
    private s: RoomScene,
    graph: LensGraph,
    private opts: LensBoardOpts,
  ) {
    this.graph = graph;
    this.g = s.add.graphics().setDepth(4);
    for (const issue of graph.issues) {
      const p = opts.pillarFor(issue.id);
      if (!p) continue;
      this.pillarPos.set(issue.id, { x: p.x, y: p.y - 14 });
      const t = s.add
        .text(p.x, p.y - 32, issue.label, {
          fontFamily: FONT,
          fontSize: '7px',
          color: issue.commonSense ? '#f4ecd8' : '#ffffff',
          align: 'center',
          wordWrap: { width: 72 },
          backgroundColor: issue.commonSense ? '#4a3a3acc' : '#2a3a5acc',
          padding: { x: 3, y: 2 },
        })
        .setOrigin(0.5, 1)
        .setResolution(TEXT_RES)
        .setDepth(p.y + 1);
      this.labels.set(issue.id, t);
    }
    this.setLens(state.lensOn);
  }

  setLens(on: boolean): void {
    this.lensOn = on;
    for (const t of this.graph.troubles) {
      const npc = this.opts.npcFor(t.id);
      if (!npc) continue;
      if (on) npc.setBubble(this.graph.isLinked(t.id) ? '✓ ' + t.text : t.text);
      else npc.setBubble(null);
    }
    if (!on && this.graph.carrying) {
      this.graph.drop();
      bus.emit('hint', 'O fio escapou quando a Lente apagou.');
    }
  }

  /** Interação com um NPC que carrega um problema. Retorna true se tratou. */
  interactNpc(troubleId: string): boolean {
    if (!this.lensOn) return false;
    const t = this.graph.troubles.find((x) => x.id === troubleId);
    const npc = this.opts.npcFor(troubleId);
    if (!t || !npc) return false;
    if (this.graph.isLinked(troubleId)) {
      this.s.say(t.who, this.opts.linkedLine ?? 'Esse fio já achou o nó. Obrigado por olhar.', () => (npc.paused = false));
      return true;
    }
    if (this.graph.carrying === troubleId) {
      this.s.say(t.who, 'Leva meu fio até um pilar. O que explica o que aconteceu comigo?', () => (npc.paused = false));
      return true;
    }
    this.graph.pick(troubleId);
    sfx.thread();
    this.s.say(t.who, [t.clue, '(Você segura o fio. Leve-o a um pilar.)'], () => (npc.paused = false));
    return true;
  }

  /** Interação com um pilar (nó público). */
  interactPillar(issueId: string): boolean {
    const issue = this.graph.issues.find((i) => i.id === issueId);
    if (!issue) return false;
    if (!this.lensOn) {
      this.s.say(undefined, `Pilar: "${issue.label}". (Ligue a Lente com X para usar os fios.)`);
      return true;
    }
    if (!this.graph.carrying) {
      this.s.say(undefined, `"${issue.label}" — ${this.graph.countOn(issueId)} fio(s) ligado(s). Pegue o fio de alguém primeiro.`);
      return true;
    }
    const from = this.opts.npcFor(this.graph.carrying);
    const r = this.graph.attach(issueId);
    if (!r) return true;
    const pillar = this.opts.pillarFor(issueId);
    if (r.ok) {
      sfx.thread();
      if (pillar) pillar.setTexture('pillar_lit');
      from?.setBubble('✓ ' + r.trouble.text);
      this.s.cameras.main.flash(80, 255, 240, 180, false);
      this.opts.onLink?.(r);
      if (r.solved) this.s.time.delayedCall(500, () => this.opts.onSolved());
      else {
        const left = this.graph.troubles.length - this.graph.linkedCount;
        bus.emit('hint', `O fio segurou. Faltam ${left}.`);
      }
    } else {
      sfx.fray();
      const to = this.pillarPos.get(issueId)!;
      if (from) this.frayed.push({ from: { x: from.x, y: from.y - 6 }, to, until: this.s.time.now + 1300 });
      this.s.shake(150, 0.003);
      this.opts.onLink?.(r);
      const line = r.trouble.wrongLines?.[issueId] ?? r.trouble.wrongLine ?? 'Isso não explica o que aconteceu comigo.';
      this.s.time.delayedCall(350, () => this.s.say(r.trouble.who, [line, '(O fio esgarçou e caiu.)']));
    }
    return true;
  }

  update(): void {
    const g = this.g;
    g.clear();
    const now = this.s.time.now;
    // ligações permanentes
    for (const t of this.graph.troubles) {
      const issueId = this.graph.linkOf(t.id);
      if (!issueId) continue;
      const npc = this.opts.npcFor(t.id);
      const to = this.pillarPos.get(issueId);
      if (!npc || !to) continue;
      this.thread(g, npc.x, npc.y - 6, to.x, to.y, 0xe6c45a, 2, now);
    }
    // fio sendo carregado
    if (this.graph.carrying && this.lensOn) {
      const npc = this.opts.npcFor(this.graph.carrying);
      if (npc) this.thread(g, npc.x, npc.y - 6, this.s.player.x, this.s.player.y - 2, 0x7cb2ff, 1.5, now);
    }
    // fios esgarçados
    this.frayed = this.frayed.filter((f) => f.until > now);
    for (const f of this.frayed) {
      const k = (f.until - now) / 1300;
      g.lineStyle(2, 0xd04545, k);
      const segs = 10;
      for (let i = 0; i < segs; i += 2) {
        const a = i / segs;
        const b = (i + 1) / segs;
        g.lineBetween(
          Phaser.Math.Linear(f.from.x, f.to.x, a),
          Phaser.Math.Linear(f.from.y, f.to.y, a) + Math.sin(now / 60 + i) * 3 * (1 - k),
          Phaser.Math.Linear(f.from.x, f.to.x, b),
          Phaser.Math.Linear(f.from.y, f.to.y, b) + Math.sin(now / 60 + i + 1) * 3 * (1 - k),
        );
      }
    }
  }

  private thread(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number, color: number, w: number, now: number): void {
    g.lineStyle(w, color, 0.95);
    g.beginPath();
    g.moveTo(x1, y1);
    const segs = 12;
    for (let i = 1; i <= segs; i++) {
      const a = i / segs;
      const sag = Math.sin(a * Math.PI) * 6 + Math.sin(now / 300 + a * 6) * 1.2;
      g.lineTo(Phaser.Math.Linear(x1, x2, a), Phaser.Math.Linear(y1, y2, a) + sag);
    }
    g.strokePath();
  }

  destroy(): void {
    this.g.destroy();
    for (const t of this.labels.values()) t.destroy();
  }
}
