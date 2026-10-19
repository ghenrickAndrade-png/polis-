import Phaser from 'phaser';
import { FONT, GAME_W, TEXT_RES } from '../config';
import { FLOOR1, FLOOR2, FLOOR3, SORT_CARDS, type FloorDef } from '../content/scalesData';
import type { Dialogue } from '../content/types';
import { bus } from '../engine/bus';
import type { Npc } from '../engine/Npc';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { ScaleAnalysis, ScaleSort, type Scale } from '../logic/Scales';
import type { RoomScene } from '../scenes/RoomScene';
import { registerController, type Interactable, type RoomController } from './registry';

function hud(s: RoomScene): Phaser.GameObjects.Text {
  return s.add
    .text(GAME_W / 2, 8, '', { fontFamily: FONT, fontSize: '8px', color: '#ffffff', backgroundColor: '#1a1a22cc', padding: { x: 4, y: 2 } })
    .setOrigin(0.5, 0)
    .setScrollFactor(0)
    .setResolution(TEXT_RES)
    .setDepth(45000);
}

function label(s: RoomScene, x: number, y: number, text: string, bg: string, width = 90, originY = 1): Phaser.GameObjects.Text {
  return s.add
    .text(x, y, text, { fontFamily: FONT, fontSize: '7px', color: '#ffffff', align: 'center', wordWrap: { width }, backgroundColor: bg, padding: { x: 3, y: 2 } })
    .setOrigin(0.5, originY)
    .setResolution(TEXT_RES)
    .setDepth(20000);
}

const scale = (): Scale => (state.lensOn ? 'macro' : 'micro');

// ===================================================================== Hall
class ScalesHall implements RoomController {
  constructor(private s: RoomScene) {}
  create(): void {
    if (!state.has('tower.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('tower_intro', () => state.set('tower.intro')));
  }
  update(): void {
    /* nada */
  }
  destroy(): void {
    /* nada */
  }
}
registerController('scales_hall', (s) => new ScalesHall(s));

// ==================================================================== Andar
class Floor implements RoomController {
  private analysis: ScaleAnalysis;
  private hud!: Phaser.GameObjects.Text;
  private macroLabels = new Map<string, Phaser.GameObjects.Text>();
  private g!: Phaser.GameObjects.Graphics;
  private pageDid: string;

  constructor(
    private s: RoomScene,
    private f: FloorDef,
    private doneFlag: string,
    private introId: string,
    private doneId: string,
    pageDid: string,
  ) {
    this.analysis = new ScaleAnalysis(f.facts);
    this.pageDid = pageDid;
  }

  create(): void {
    this.hud = hud(this.s);
    this.g = this.s.add.graphics().setDepth(4);
    for (const n of this.f.macro) {
      const img = this.s.props.get(`macro:${n.id}`);
      if (img) this.macroLabels.set(n.id, label(this.s, img.x, img.y - 36, n.label, '#2a3a5acc'));
    }
    if (state.has(this.doneFlag)) for (const fact of this.f.facts) this.analysis.collect(fact.id, fact.scale);
    else if (!state.has(`${this.doneFlag}.intro`)) this.s.time.delayedCall(400, () => this.s.dialogue(this.introId, () => state.set(`${this.doneFlag}.intro`)));
    this.applyScale();
  }

  private applyScale(): void {
    const macro = state.lensOn;
    for (const m of this.f.micro) {
      const npc = this.s.npcs.get(`micro:${m.id}`);
      if (!npc) continue;
      npc.setBubble(macro ? null : this.analysis.has(m.fact) ? '✓' : '…');
      npc.setAlpha(macro ? 0.35 : 1);
    }
    for (const n of this.f.macro) {
      this.macroLabels.get(n.id)?.setVisible(macro);
      this.s.props.get(`macro:${n.id}`)?.setAlpha(macro ? 1 : 0.35);
    }
    this.refresh();
  }

  private refresh(): void {
    const mi = `${this.analysis.count('micro')}/${this.analysis.total('micro')}`;
    const ma = `${this.analysis.count('macro')}/${this.analysis.total('macro')}`;
    this.hud.setText(`${state.lensOn ? 'MAPA (macro)' : 'RUA (micro)'} · quadro: micro ${mi} · macro ${ma}`);
  }

  onLens(): void {
    this.applyScale();
  }

  onInteract(t: Interactable): boolean {
    if (t.id.startsWith('micro:')) {
      const m = this.f.micro.find((x) => x.id === t.id.slice(6))!;
      const npc = this.s.npcs.get(t.id)!;
      const unpause = () => (npc.paused = false);
      const r = this.analysis.collect(m.fact, scale());
      if (r === 'wrong-scale') this.s.dialogue('fact_wrong_micro', unpause);
      else if (r === 'done') this.s.say(m.name, m.line, unpause);
      else {
        const fact = this.f.facts.find((x) => x.id === m.fact)!;
        sfx.thread();
        this.s.say(m.name, [m.line, `(Fato micro anotado: ${fact.text})`], () => {
          unpause();
          this.applyScale();
          this.check();
        });
      }
      return true;
    }
    if (t.id.startsWith('macro:')) {
      const n = this.f.macro.find((x) => x.id === t.id.slice(6))!;
      const r = this.analysis.collect(n.fact, scale());
      if (r === 'wrong-scale') this.s.dialogue('fact_wrong_macro');
      else if (r === 'done') this.s.say(undefined, `${n.label}. (Fato macro já anotado.)`);
      else {
        const fact = this.f.facts.find((x) => x.id === n.fact)!;
        sfx.thread();
        this.s.say(undefined, [`${n.label}.`, `(Fato macro anotado: ${fact.text})`], () => {
          this.applyScale();
          this.check();
        });
      }
      return true;
    }
    if (t.id === 'board') {
      if (this.analysis.complete) this.s.say(undefined, '(Quadro fechado: um fato de cada escala.)');
      else {
        const lines = this.f.facts.map((x) => `${x.scale.toUpperCase()}: ${this.analysis.has(x.id) ? x.text : '…'}`);
        this.s.say(undefined, ['(Quadro de análise.)', ...lines]);
      }
      return true;
    }
    return false;
  }

  private check(): void {
    if (this.analysis.complete && !state.has(this.doneFlag)) {
      state.set(this.doneFlag);
      sfx.success();
      state.unlockPage('micro-macro', this.pageDid);
      this.s.dialogue(this.doneId, () => state.save());
    }
  }

  update(time: number): void {
    this.g.clear();
    if (!state.lensOn) return;
    for (const n of this.f.macro) {
      const a = this.s.props.get(`macro:${n.id}`);
      if (!a || !n.to) continue;
      for (const toId of n.to) {
        const b = this.s.props.get(`macro:${toId}`);
        if (!b) continue;
        this.g.lineStyle(2, 0x7cb2ff, 0.9);
        const segs = 10;
        for (let i = 0; i < segs; i += 2) {
          const t0 = i / segs;
          const t1 = (i + 1) / segs;
          const off = Math.sin(time / 300) * 2;
          this.g.lineBetween(Phaser.Math.Linear(a.x, b.x, t0), Phaser.Math.Linear(a.y - 14, b.y - 14, t0) + off, Phaser.Math.Linear(a.x, b.x, t1), Phaser.Math.Linear(a.y - 14, b.y - 14, t1) + off);
        }
      }
    }
  }
  destroy(): void {
    this.hud.destroy();
    this.g.destroy();
    for (const l of this.macroLabels.values()) l.destroy();
  }
}
registerController('scales_f1', (s) => new Floor(s, FLOOR1, 'scales.f1', 'f1_intro', 'f1_done', 'No Andar 1, ouvi na rua o patrão e o operário (micro) e vi no mapa a reforma trabalhista que vale para toda a categoria (macro): o quadro só fechou com as duas escalas.'));
registerController('scales_f2', (s) => new Floor(s, FLOOR2, 'scales.f2', 'f2_intro', 'f2_done', 'No Andar 2, ouvi a turista e a moradora (micro: interação entre culturas) e vi no mapa voos, câmbio e globalização (macro).'));
registerController('scales_f3', (s) => new Floor(s, FLOOR3, 'scales.f3', 'f3_intro', 'f3_done', 'No Andar 3, achei ação social e controle social na rua, e relações de produção e coesão social no mapa.'));

// ===================================================================== Boss
class ScalesBoss implements RoomController {
  private miope?: Npc;
  private gigante?: Npc;
  private hp = { miope: 3, gigante: 3 };
  private shots!: Phaser.Physics.Arcade.Group;
  private active = false;
  private nextShot = 0;
  private hud!: Phaser.GameObjects.Text;
  private sort = new ScaleSort(SORT_CARDS);
  private cardLabels = new Map<string, Phaser.GameObjects.Text>();
  private headers: Phaser.GameObjects.Text[] = [];
  private placedIds = new Set<string>();
  private defeated = false;
  constructor(private s: RoomScene) {}

  create(): void {
    this.hud = hud(this.s);
    this.shots = this.s.physics.add.group({ maxSize: 40 });
    this.s.physics.add.collider(this.shots, this.s.layer, (shot) => (shot as Phaser.Physics.Arcade.Image).destroy());
    this.s.physics.add.overlap(this.s.player, this.shots, (_p, shot) => {
      const sh = shot as Phaser.Physics.Arcade.Image;
      if (this.s.player.hurt(sh.x, sh.y)) sh.destroy();
    });
    if (state.has('scales.boss')) {
      this.defeated = true;
      this.setupProva(true);
      return;
    }
    this.miope = this.s.spawnNpc({ type: 'npc', id: 'miope', x: 8, y: 6, look: 'guard', name: 'O Míope', facing: 'down', dialogue: 'walker_line', speed: 40, patrol: [{ x: 8, y: 6 }, { x: 12, y: 8 }, { x: 8, y: 10 }] });
    this.gigante = this.s.spawnNpc({ type: 'npc', id: 'gigante', x: 21, y: 6, look: 'dogma', name: 'O Gigante Cego', facing: 'down', dialogue: 'walker_line', speed: 28, patrol: [{ x: 21, y: 6 }, { x: 18, y: 9 }, { x: 22, y: 11 }] });
    this.gigante.setScale(1.5);
    this.s.removeInteractable('miope');
    this.s.removeInteractable('gigante');
    this.refresh();
    this.s.time.delayedCall(500, () => this.s.dialogue('boss_intro2', () => (this.active = true)));
  }

  private refresh(): void {
    if (this.defeated) {
      const placed = SORT_CARDS.filter((c) => this.sort.isPlaced(c.id)).length;
      this.hud.setText(state.has('tower.done') ? 'Prova concluída' : `PROVA · ${placed}/${SORT_CARDS.length} situações no quadro`);
      return;
    }
    const vis = state.lensOn ? 'MAPA: o Gigante te vê; o Míope está cego' : 'RUA: o Míope te vê; o Gigante está cego';
    this.hud.setText(`${vis} · Míope ${'♥'.repeat(this.hp.miope)} · Gigante ${'♥'.repeat(this.hp.gigante)}`);
    this.miope?.setTint(state.lensOn ? 0x9999ff : 0xffffff);
    this.gigante?.setTint(state.lensOn ? 0xffffff : 0x9999ff);
    this.miope?.setBubble(state.lensOn ? '?? Cadê você?' : 'Te vejo!');
    this.gigante?.setBubble(state.lensOn ? 'Um ponto no mapa!' : '...');
  }

  onLens(): void {
    this.refresh();
    if (this.defeated) this.applyCards();
  }

  private shooter(): Npc | undefined {
    return state.lensOn ? this.gigante : this.miope;
  }
  private vulnerable(): Npc | undefined {
    return state.lensOn ? this.miope : this.gigante;
  }

  private shoot(): void {
    const from = this.shooter();
    if (!from || !from.active) return;
    const shot = this.shots.get(from.x, from.y, 'shot') as Phaser.Physics.Arcade.Image | null;
    if (!shot) return;
    shot.setActive(true).setVisible(true).setDepth(5000);
    const ang = Phaser.Math.Angle.Between(from.x, from.y, this.s.player.x, this.s.player.y);
    shot.setVelocity(Math.cos(ang) * 115, Math.sin(ang) * 115);
    this.s.time.delayedCall(4000, () => shot.destroy());
    sfx.swing();
  }

  onAttack(rect: Phaser.Geom.Rectangle): void {
    if (this.defeated || !this.active) return;
    const v = this.vulnerable();
    if (!v || !v.active) return;
    const vb = new Phaser.Geom.Rectangle(v.x - 10, v.y - 10, 20, 28);
    if (!Phaser.Geom.Intersects.RectangleToRectangle(rect, vb)) return;
    const key = v === this.miope ? 'miope' : 'gigante';
    this.hp[key]--;
    sfx.hit();
    this.s.shake(140, 0.004);
    v.setTint(0xff6666);
    this.s.time.delayedCall(120, () => this.refresh());
    if (this.hp[key] <= 0) {
      this.s.tweens.add({ targets: v, alpha: 0, duration: 500, onComplete: () => this.s.removeNpc(key) });
      if (key === 'miope') this.miope = undefined;
      else this.gigante = undefined;
      if (!this.miope && !this.gigante) this.defeat();
    }
    this.refresh();
  }

  private defeat(): void {
    this.defeated = true;
    this.active = false;
    this.shots.clear(true, true);
    sfx.success();
    state.set('scales.boss');
    state.addDid('micro-macro', 'Venci o Míope (só via a rua) e o Gigante Cego (só via o mapa) trocando de escala: cada um estava cego na escala do outro.');
    this.s.dialogue('boss_defeat2', () => {
      this.setupProva(false);
      this.s.dialogue('analista_intro');
    });
  }

  private setupProva(silent: boolean): void {
    this.s.spawnNpc({ type: 'npc', id: 'analista', x: 14, y: 8, look: 'comte', name: 'Analista', facing: 'down', dialogue: state.has('tower.done') ? 'analista_post' : 'analista_intro' });
    // as cartas têm `if: 'scales.boss'`: se a sala abriu antes da vitória, elas ainda não existem
    for (const e of this.s.room.entities) {
      if (e.type === 'prop' && e.id.startsWith('card:') && !this.s.props.has(e.id)) this.s.spawnProp(e);
    }
    for (const c of SORT_CARDS) {
      const img = this.s.props.get(`card:${c.id}`);
      if (!img) continue;
      this.cardLabels.set(c.id, label(this.s, img.x, img.y + 2, c.text, '#4a3a3acc', 70, 0));
    }
    const board = this.s.props.get('board')!;
    this.headers.push(label(this.s, board.x - 70, board.y - 6, 'MICRO\ninterações', '#2a5a3acc', 80));
    this.headers.push(label(this.s, board.x + 70, board.y - 6, 'MACRO\nestruturas', '#2a3a5acc', 80));
    if (state.has('tower.done')) for (const c of SORT_CARDS) this.sort.place(c.id, c.scale);
    this.applyCards();
    this.refresh();
    if (!silent) bus.emit('hint', 'Cinco situações. Para cada uma, escolha a coluna: MICRO ou MACRO.');
  }

  private applyCards(): void {
    const board = this.s.props.get('board')!;
    for (const c of SORT_CARDS) {
      const img = this.s.props.get(`card:${c.id}`);
      const l = this.cardLabels.get(c.id);
      if (!img || !l) continue;
      if (this.sort.isPlaced(c.id) && !this.placedIds.has(c.id)) {
        this.placedIds.add(c.id);
        this.s.removeInteractable(`card:${c.id}`);
        const idx = SORT_CARDS.filter((x) => x.scale === c.scale && this.sort.isPlaced(x.id)).indexOf(c);
        const tx = board.x + (c.scale === 'micro' ? -70 : 70);
        const ty = board.y + 6 + idx * 16;
        l.setText(c.short).setOrigin(0.5, 0).setBackgroundColor(c.scale === 'micro' ? '#2a5a3acc' : '#2a3a5acc');
        this.s.tweens.add({ targets: l, x: tx, y: ty, duration: 500 });
        this.s.tweens.add({ targets: img, x: tx, y: ty + 4, alpha: 0, duration: 500, onComplete: () => img.setVisible(false) });
      }
    }
  }

  onInteract(t: Interactable): boolean {
    if (t.id.startsWith('card:')) {
      const c = SORT_CARDS.find((x) => x.id === t.id.slice(5))!;
      if (this.sort.isPlaced(c.id)) {
        this.s.say(undefined, `(Já no quadro, coluna ${c.scale.toUpperCase()}.)`);
        return true;
      }
      const steps: Dialogue = [
        { text: `"${c.text}"` },
        { choice: 'Em que coluna isso entra?', options: [{ label: 'MICRO: interação entre pessoas', event: `sort:${c.id}:micro` }, { label: 'MACRO: estrutura que vale para todos', event: `sort:${c.id}:macro` }] },
      ];
      bus.emit('dialogue:start', steps);
      return true;
    }
    if (t.id === 'board') {
      this.s.say(undefined, '(Quadro de análise: coluna MICRO à esquerda, MACRO à direita.)');
      return true;
    }
    if (t.id === 'analista') {
      const npc = this.s.npcs.get('analista')!;
      const unpause = () => (npc.paused = false);
      if (state.has('tower.done')) this.s.dialogue('analista_post', unpause);
      else this.s.dialogue('analista_intro', unpause);
      return true;
    }
    return false;
  }

  onEvent(name: string): void {
    if (!name.startsWith('sort:')) return;
    const [, id, sc] = name.split(':');
    const c = SORT_CARDS.find((x) => x.id === id)!;
    if (this.sort.place(id, sc as Scale)) {
      sfx.thread();
      this.applyCards();
      this.refresh();
      if (this.sort.complete) this.s.time.delayedCall(700, () => this.finish());
    } else {
      sfx.fray();
      const img = this.s.props.get(`card:${id}`);
      if (img) this.s.tweens.add({ targets: img, x: img.x + 6, yoyo: true, repeat: 3, duration: 60 });
      this.s.say(undefined, `(A situação escorrega da coluna ${sc.toUpperCase()} e volta ao chão. ${c.scale === 'micro' ? 'É um gesto entre pessoas.' : 'É uma estrutura que vale para todos.'})`);
    }
  }

  private finish(): void {
    const text =
      'Você pôs na coluna MICRO as interações do dia a dia entre pessoas (o trabalho em grupo, a vendedora e o cliente, turista e morador negociando) e na coluna MACRO as estruturas amplas (o câmbio e o turismo do país, a lei que muda as regras de toda a indústria). ' +
      'Microssociologia analisa interações sociais em pequenos grupos; macrossociologia analisa relações sociais: economia, leis, globalização. E você venceu dois cegos que só viam uma escala.';
    this.s.dialogue('analista_pre', () => {
      this.s.say('Analista', text, () => {
        state.setMine('micro-macro', text);
        state.set('tower.done');
        sfx.success();
        this.s.dialogue('analista_post', () => state.save());
      });
    });
  }

  update(time: number): void {
    if (this.defeated || !this.active) return;
    if (time > this.nextShot && !this.s.blocking) {
      this.nextShot = time + 1100;
      this.shoot();
    }
  }
  destroy(): void {
    this.hud.destroy();
    for (const l of this.cardLabels.values()) l.destroy();
    for (const h of this.headers) h.destroy();
  }
}
registerController('scales_boss', (s) => new ScalesBoss(s));
