import Phaser from 'phaser';
import { FONT, TEXT_RES, TILE } from '../config';
import {
  BOSS_ISSUES,
  BOSS_TROUBLES,
  LENS1_ISSUES,
  LENS1_TROUBLES,
  LENS2_HISTORY,
  LENS2_PERSONAL,
  LENS3_RULES,
  LENS4_POSTERS,
  SAGE_ISSUES,
  SAGE_TROUBLES,
} from '../content/lensData';
import type { Dialogue } from '../content/types';
import { bus } from '../engine/bus';
import { Npc } from '../engine/Npc';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { T } from '../engine/textures';
import { LensGraph, narrateLens } from '../logic/LensGraph';
import { OriginReveal } from '../logic/OriginReveal';
import { PressureSquare } from '../logic/PressureSquare';
import { Timeline } from '../logic/Timeline';
import type { RoomScene } from '../scenes/RoomScene';
import { LensBoard } from './lensBoard';
import { registerController, type Interactable, type RoomController } from './registry';

function label(s: RoomScene, x: number, y: number, text: string, bg = '#2a3a5acc', width = 76): Phaser.GameObjects.Text {
  return s.add
    .text(x, y, text, { fontFamily: FONT, fontSize: '7px', color: '#ffffff', align: 'center', wordWrap: { width }, backgroundColor: bg, padding: { x: 3, y: 2 } })
    .setOrigin(0.5, 1)
    .setResolution(TEXT_RES)
    .setDepth(y + 1);
}

// ===================================================================== Sala 1
class Lens1 implements RoomController {
  private board!: LensBoard;
  constructor(private s: RoomScene) {}

  create(): void {
    const graph = new LensGraph(LENS1_TROUBLES, LENS1_ISSUES);
    this.board = new LensBoard(this.s, graph, {
      npcFor: (id) => this.s.npcs.get(id),
      pillarFor: (id) => this.s.props.get(`pillar:${id}`),
      onSolved: () => this.solved(),
    });
    if (state.has('lens1.done')) {
      for (const t of LENS1_TROUBLES) {
        graph.pick(t.id);
        graph.attach(t.issue);
        this.s.props.get(`pillar:${t.issue}`)?.setTexture('pillar_lit');
      }
    } else if (!state.has('lens1.intro')) {
      this.s.time.delayedCall(400, () => this.s.dialogue('lens1_intro', () => state.set('lens1.intro')));
    }
  }

  private solved(): void {
    state.set('lens1.done');
    sfx.success();
    this.s.dialogue('lens1_done', () => {
      state.unlockPage('imaginacao', 'Liguei o desemprego do Zé, o aluguel da Maria e os estudos da Bia ao mesmo nó: a Metalúrgica que fechou. Três problemas "privados", uma causa pública.');
      state.save();
    });
  }

  onInteract(t: Interactable): boolean {
    if (t.kind === 'npc') return this.board.interactNpc(t.id);
    if (t.id.startsWith('pillar:')) return this.board.interactPillar(t.id.slice(7));
    return false;
  }
  onLens(on: boolean): void {
    this.board.setLens(on);
  }
  update(): void {
    this.board.update();
  }
  destroy(): void {
    this.board.destroy();
  }
}
registerController('lens1', (s) => new Lens1(s));

// ===================================================================== Sala 2
class Lens2 implements RoomController {
  private tl = new Timeline(LENS2_PERSONAL, LENS2_HISTORY);
  private pedLabels = new Map<string, Phaser.GameObjects.Text>();
  private carryText?: Phaser.GameObjects.Text;
  constructor(private s: RoomScene) {}

  create(): void {
    for (const p of LENS2_PERSONAL) {
      const img = this.s.props.get(`ped:${p.id}`);
      if (img) this.pedLabels.set(p.id, label(this.s, img.x, img.y - 14, `${p.year} · ${p.text}`, '#5a3a6acc'));
    }
    for (const h of LENS2_HISTORY) {
      const img = this.s.props.get(`pub:${h.id}`);
      if (img) label(this.s, img.x, img.y - 20, `${h.year} · ${h.text}`, '#2a3a5acc', 90);
    }
    this.carryText = this.s.add
      .text(0, 0, '', { fontFamily: FONT, fontSize: '7px', color: '#ffffff', backgroundColor: '#5a3a6acc', padding: { x: 3, y: 1 } })
      .setOrigin(0.5, 1)
      .setResolution(TEXT_RES)
      .setDepth(30001)
      .setVisible(false);
    if (state.has('lens2.done')) {
      for (let i = 0; i < 4; i++) this.bridge(i);
      for (const p of LENS2_PERSONAL) {
        this.tl.pick(p.id);
        this.tl.place(p.cause);
        this.moveLabel(p.id, p.cause);
      }
    } else if (!state.has('lens2.intro')) {
      this.s.time.delayedCall(400, () => this.s.dialogue('lens2_intro', () => state.set('lens2.intro')));
    }
  }

  private bridge(i: number): void {
    const row = 8 - i;
    this.s.setTile(16, row, T.bridge);
    this.s.setTile(17, row, T.bridge);
  }

  private moveLabel(personalId: string, publicId: string): void {
    const t = this.pedLabels.get(personalId);
    const img = this.s.props.get(`pub:${publicId}`);
    if (t && img) {
      this.s.tweens.add({ targets: t, x: img.x, y: img.y - 46, duration: 500, ease: 'Sine.out' });
      t.setDepth(img.y + 2);
    }
  }

  onInteract(t: Interactable): boolean {
    if (t.id.startsWith('ped:')) {
      const id = t.id.slice(4);
      const p = LENS2_PERSONAL.find((x) => x.id === id)!;
      if (this.tl.isPlaced(id)) {
        this.s.say(undefined, '(Pedestal vazio. O momento já está sobre a história.)');
        return true;
      }
      if (this.tl.carrying === id) {
        this.s.say(undefined, `(Você já carrega "${p.text}". Leve-o a um acontecimento na beira do abismo.)`);
        return true;
      }
      this.tl.pick(id);
      sfx.thread();
      this.s.say(undefined, [`${p.year}: "${p.text}".`, '(Que acontecimento da história explica isso? Leve o momento até a placa certa.)']);
      return true;
    }
    if (t.id.startsWith('pub:')) {
      const id = t.id.slice(4);
      const h = LENS2_HISTORY.find((x) => x.id === id)!;
      if (!this.tl.carrying) {
        this.s.say(undefined, `${h.year}: "${h.text}". (Pegue um momento da sua vida nos pedestais e traga até aqui.)`);
        return true;
      }
      const r = this.tl.place(id);
      if (!r) return true;
      if (r.ok) {
        sfx.thread();
        this.moveLabel(r.personal.id, id);
        this.bridge(this.tl.placedCount - 1);
        this.s.cameras.main.flash(80, 255, 240, 180, false);
        if (this.tl.solved) this.s.time.delayedCall(400, () => this.solved());
        else bus.emit('hint', `Encaixou. A ponte cresceu. Faltam ${4 - this.tl.placedCount}.`);
      } else {
        sfx.fray();
        this.s.shake(120, 0.003);
        this.s.say(undefined, [`(Nada se move. "${r.personal.text}", ${r.personal.year}, escorrega e volta ao pedestal.)`, `(${h.year}: "${h.text}". O que isso explicaria na sua vida?)`]);
      }
      return true;
    }
    return false;
  }

  private solved(): void {
    state.set('lens2.done');
    sfx.success();
    state.addDid('imaginacao', 'Encaixei quatro momentos da minha vida sobre os acontecimentos da história que os explicavam: a biografia (esfera particular) sobre a sociedade (esfera pública).');
    this.s.dialogue('lens2_done', () => state.save());
  }

  update(): void {
    if (this.carryText) {
      const c = this.tl.carrying;
      if (c) {
        const p = LENS2_PERSONAL.find((x) => x.id === c)!;
        this.carryText.setText(`${p.year} · ${p.text}`).setPosition(Math.round(this.s.player.x), Math.round(this.s.player.y - 14)).setVisible(true);
      } else this.carryText.setVisible(false);
    }
  }
  destroy(): void {
    this.carryText?.destroy();
  }
}
registerController('lens2', (s) => new Lens2(s));

// ===================================================================== Sala 3
class Lens3 implements RoomController {
  private or = new OriginReveal(LENS3_RULES);
  private gates = new Map<string, Phaser.GameObjects.Image[]>();
  private gateX: Record<string, number> = { r1: 10, r2: 17, r3: 24 };
  constructor(private s: RoomScene) {}

  create(): void {
    for (const r of LENS3_RULES) {
      const img = this.s.props.get(`rule:${r.id}`);
      if (img) label(this.s, img.x, img.y - 20, r.rule, '#4a3a3acc', 100);
      const done = state.has('lens3.done');
      if (!done) {
        const col: Phaser.GameObjects.Image[] = [];
        for (let y = 6; y <= 10; y++) {
          col.push(this.s.spawnProp({ type: 'prop', id: `gate:${r.id}:${y}`, x: this.gateX[r.id], y, sprite: 'gate', solid: true, bodyW: 14, bodyH: 16 }));
        }
        this.gates.set(r.id, col);
      } else {
        this.or.reveal(r.id);
        this.or.question(r.id);
        img?.setTexture('plaque_q');
      }
    }
    if (!state.has('lens3.done') && !state.has('lens3.intro')) {
      this.s.time.delayedCall(400, () => this.s.dialogue('lens3_intro', () => state.set('lens3.intro')));
    }
  }

  onInteract(t: Interactable): boolean {
    if (t.id.startsWith('rule:')) {
      const id = t.id.slice(5);
      const r = LENS3_RULES.find((x) => x.id === id)!;
      if (!state.lensOn) {
        this.s.say(undefined, [`Regra: "${r.rule}"`, '(Ligue a Lente com X para ver de onde ela veio.)']);
        return true;
      }
      if (this.or.isRevealed(id)) {
        this.s.say(undefined, [`Origem: ${r.origin}`, '(Agora fale com o guarda.)']);
        return true;
      }
      this.or.reveal(id);
      sfx.thread();
      this.s.props.get(t.id)?.setTexture('plaque_q');
      this.s.cameras.main.flash(80, 255, 240, 180, false);
      this.s.say(undefined, [`Regra: "${r.rule}"`, `Origem: ${r.origin}`, '(Tem data. Tem autor. Então não é natural. Fale com o guarda.)']);
      return true;
    }
    if (t.id.startsWith('guard:')) {
      const id = t.id.slice(6);
      const r = LENS3_RULES.find((x) => x.id === id)!;
      const npc = this.s.npcs.get(t.id)!;
      const unpause = () => (npc.paused = false);
      if (this.or.isOpen(id)) {
        this.s.say('Guarda', 'Pode passar. Eu também vou pensar sobre as outras regras.', unpause);
        return true;
      }
      if (this.or.isRevealed(id)) {
        this.or.question(id);
        this.s.say('Guarda', r.guardAfter, () => {
          unpause();
          this.openGate(id);
          if (this.or.solved) this.s.time.delayedCall(600, () => this.solved());
        });
        return true;
      }
      this.s.say('Guarda', [r.guardBefore, '(A placa ao lado dele diz a regra. Olhe-a com a Lente.)'], unpause);
      return true;
    }
    return false;
  }

  private openGate(id: string): void {
    const col = this.gates.get(id) ?? [];
    sfx.door();
    col.forEach((img, i) => {
      this.s.tweens.add({ targets: img, alpha: 0, y: img.y - 6, delay: i * 60, duration: 350, onComplete: () => this.s.removeProp(`gate:${id}:${6 + i}`) });
      const body = (img as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.StaticBody | null;
      if (body) body.enable = false;
    });
    this.gates.delete(id);
  }

  private solved(): void {
    state.set('lens3.done');
    sfx.success();
    state.unlockPage('desnaturalizar', 'Descobri que três regras ditas "naturais" tinham data e autor. Quando mostrei isso aos guardas, as três deixaram de ser muro.');
    this.s.dialogue('lens3_done', () => state.save());
  }

  update(): void {
    /* nada contínuo */
  }
  destroy(): void {
    /* nada */
  }
}
registerController('lens3', (s) => new Lens3(s));

// ===================================================================== Sala 4
class Lens4 implements RoomController {
  private sq = new PressureSquare(LENS4_POSTERS);
  private meter!: Phaser.GameObjects.Text;
  constructor(private s: RoomScene) {}

  create(): void {
    this.meter = this.s.add
      .text(this.s.tc(14, 7).x + 8, this.s.tc(14, 7).y - 4, '', { fontFamily: FONT, fontSize: '7px', color: '#ffffff', align: 'center', backgroundColor: '#1a1a22cc', padding: { x: 4, y: 2 } })
      .setOrigin(0.5, 1)
      .setResolution(TEXT_RES)
      .setDepth(20000);
    if (state.has('lens4.done')) for (const p of LENS4_POSTERS) this.sq.support(p.id);
    this.refresh();
    if (!state.has('lens4.done') && !state.has('lens4.intro')) {
      this.s.time.delayedCall(400, () => this.s.dialogue('lens4_intro', () => state.set('lens4.intro')));
    }
  }

  private refresh(): void {
    for (const p of this.sq.posters) {
      const npc = this.s.npcs.get(`post:${p.id}`);
      if (!npc) continue;
      const honest = this.sq.isHonest(p.id);
      if (state.lensOn) npc.setBubble((honest ? '✓ ' : 'pensa: ') + p.thought);
      else npc.setBubble('posta: ' + (honest ? p.thought : p.post));
    }
    this.meter.setText(`MURAL · pressão do grupo: ${this.sq.groupPressure}/10 · ${this.sq.honestCount}/${this.sq.posters.length} dizem o que pensam`);
  }

  onLens(): void {
    this.refresh();
  }

  onInteract(t: Interactable): boolean {
    if (!t.id.startsWith('post:')) return false;
    const id = t.id.slice(5);
    const p = this.sq.posters.find((x) => x.id === id)!;
    const npc = this.s.npcs.get(t.id)!;
    const unpause = () => (npc.paused = false);
    if (this.sq.isHonest(id)) {
      this.s.say(p.name, `Postei o que eu penso: "${p.thought}". Ficou mais leve.`, unpause);
      return true;
    }
    if (!state.lensOn) {
      this.s.say(p.name, [`Postei: "${p.post}".`, '(Com a Lente ligada dá para ver o que a pessoa pensa de verdade.)'], unpause);
      return true;
    }
    const steps: Dialogue = [
      { who: p.name, text: `Penso: "${p.thought}". Mas posto: "${p.post}". Pressão: ${p.pressure}/10.` },
      {
        choice: 'O que você faz?',
        options: [
          { label: 'Apoiar o que ela pensa de verdade', event: `support:${id}` },
          { label: 'Deixar quieto', event: `ignore:${id}` },
        ],
      },
    ];
    bus.emit('dialogue:start', steps, unpause);
    return true;
  }

  onEvent(name: string): void {
    if (name.startsWith('support:')) {
      const id = name.slice(8);
      const changed = this.sq.support(id);
      sfx.thread();
      this.refresh();
      const names = changed.map((c) => this.sq.posters.find((p) => p.id === c)!.name);
      const others = names.slice(1);
      const line =
        others.length > 0
          ? `${names[0]} postou o que pensa. ${others.join(' e ')} ${others.length > 1 ? 'viram' : 'viu'} e também ${others.length > 1 ? 'postaram' : 'postou'}. A pressão caiu.`
          : `${names[0]} postou o que pensa. Os vizinhos sentiram a pressão cair, mas ainda não mudaram.`;
      this.s.say(undefined, line, () => {
        if (this.sq.solved) this.solved();
      });
    } else if (name.startsWith('ignore:')) {
      this.s.say(undefined, '(Nada muda. O post continua diferente do pensamento, e a pressão sobre os outros também.)');
    }
  }

  private solved(): void {
    state.set('lens4.done');
    sfx.success();
    state.unlockPage('sociologia', 'Na praça digital, apoiei quem postava o que pensava; a pressão do grupo caiu e os outros também pararam de fingir. Vi a tensão entre a liberdade de se expressar e as expectativas do grupo.');
    this.s.dialogue('lens4_done', () => state.save());
  }

  update(): void {
    /* nada contínuo */
  }
  destroy(): void {
    this.meter.destroy();
  }
}
registerController('lens4', (s) => new Lens4(s));

// ===================================================================== Chefe
class LensBoss implements RoomController {
  private board!: LensBoard;
  private mayor?: Npc;
  private shots!: Phaser.Physics.Arcade.Group;
  private active = false;
  private hp = 5;
  private vulnerableUntil = 0;
  private nextShot = 0;
  private hpText?: Phaser.GameObjects.Text;
  private defeated = false;
  constructor(private s: RoomScene) {}

  create(): void {
    this.shots = this.s.physics.add.group({ maxSize: 40 });
    this.s.physics.add.collider(this.shots, this.s.layer, (shot) => (shot as Phaser.Physics.Arcade.Image).destroy());
    this.s.physics.add.overlap(this.s.player, this.shots, (_p, shot) => {
      const sh = shot as Phaser.Physics.Arcade.Image;
      if (this.s.player.hurt(sh.x, sh.y)) sh.destroy();
    });
    if (state.has('lens.boss')) return;
    this.mayor = this.s.spawnNpc({ type: 'npc', id: 'mayor', x: 14, y: 2, look: 'mayor', name: 'Prefeito', facing: 'down', dialogue: 'boss_intro' });
    this.mayor.setBubble('Esforço!');
    this.s.removeInteractable('mayor'); // perto dele, A = ataque
    const positions = [
      { x: 7, y: 7 },
      { x: 22, y: 7 },
      { x: 6, y: 13 },
      { x: 23, y: 13 },
      { x: 14, y: 8 },
    ];
    const looks = ['farmer', 'smith', 'teacher', 'townB', 'townC'];
    BOSS_TROUBLES.forEach((t, i) => {
      this.s.spawnNpc({ type: 'npc', id: t.id, x: positions[i].x, y: positions[i].y, look: looks[i], name: t.who, facing: 'up', dialogue: 'citizen_no_lens' });
    });
    this.board = new LensBoard(this.s, new LensGraph(BOSS_TROUBLES, BOSS_ISSUES), {
      npcFor: (id) => this.s.npcs.get(id),
      pillarFor: (id) => this.s.props.get(`pillar:${id}`),
      onLink: (r) => this.onLink(r.ok),
      onSolved: () => this.onAllLinked(),
    });
    this.hpText = this.s.add
      .text(240, 8, '', { fontFamily: FONT, fontSize: '8px', color: '#ffd0d0', backgroundColor: '#1a1a22cc', padding: { x: 4, y: 2 } })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setResolution(TEXT_RES)
      .setDepth(45000);
    this.refreshHp();
    this.s.time.delayedCall(500, () => this.s.dialogue('boss_intro', () => (this.active = true)));
  }

  private refreshHp(): void {
    this.hpText?.setText('O Culpador  ' + '♥'.repeat(this.hp) + '♡'.repeat(5 - this.hp));
  }

  private onLink(ok: boolean): void {
    if (!this.mayor) return;
    if (ok) {
      this.vulnerableUntil = this.s.time.now + 4000;
      this.mayor.setBubble('Ãh?! Não pode ser...');
      this.mayor.setTint(0x9999ff);
      bus.emit('hint', 'O Prefeito cambaleou! Chegue perto e ataque (A).');
    } else {
      this.mayor.setBubble('Hahaha! Viu? Culpa dele!');
      for (let i = -1; i <= 1; i++) this.s.time.delayedCall(200 + (i + 1) * 150, () => this.shoot(i * 0.4));
    }
  }

  private onAllLinked(): void {
    this.vulnerableUntil = Number.MAX_SAFE_INTEGER;
    this.mayor?.setBubble('Cinco casas... um córrego...');
    this.mayor?.setTint(0x9999ff);
    bus.emit('hint', 'Os cinco fios no mesmo nó. O Prefeito não se segura mais: ataque!');
  }

  private shoot(spread = 0): void {
    if (!this.mayor || !this.active || this.defeated) return;
    const shot = this.shots.get(this.mayor.x, this.mayor.y, 'shot') as Phaser.Physics.Arcade.Image | null;
    if (!shot) return;
    shot.setActive(true).setVisible(true).setDepth(5000);
    const ang = Phaser.Math.Angle.Between(this.mayor.x, this.mayor.y, this.s.player.x, this.s.player.y) + spread;
    shot.setVelocity(Math.cos(ang) * 110, Math.sin(ang) * 110);
    this.s.time.delayedCall(4000, () => shot.destroy());
    sfx.swing();
  }

  onAttack(rect: Phaser.Geom.Rectangle): void {
    if (!this.mayor || this.defeated || this.s.time.now > this.vulnerableUntil) return;
    const mb = new Phaser.Geom.Rectangle(this.mayor.x - 10, this.mayor.y - 10, 20, 32);
    if (!Phaser.Geom.Intersects.RectangleToRectangle(rect, mb)) return;
    this.hp--;
    this.refreshHp();
    sfx.hit();
    this.s.shake(150, 0.004);
    this.mayor.setTint(0xff6666);
    this.s.time.delayedCall(120, () => this.mayor?.setTint(this.s.time.now < this.vulnerableUntil ? 0x9999ff : 0xffffff));
    if (this.vulnerableUntil !== Number.MAX_SAFE_INTEGER) this.vulnerableUntil = this.s.time.now; // uma pancada por fio
    if (this.hp <= 0) this.defeat();
    else this.mayor.setBubble(['Ai!', 'Isso é... injusto!', 'Eu só repetia o que diziam!', 'Para!'][4 - this.hp] ?? 'Ai!');
  }

  private defeat(): void {
    this.defeated = true;
    this.active = false;
    this.shots.clear(true, true);
    this.mayor?.setBubble(null);
    this.mayor?.clearTint();
    sfx.success();
    this.s.dialogue('boss_defeat', () => {
      state.set('lens.boss');
      state.addDid('imaginacao', 'Derrotei o Prefeito que culpava cada vítima da enchente: as cinco "preguiças" eram um só córrego sem obra. Causa pública, solução pública.');
      if (this.mayor) this.s.tweens.add({ targets: this.mayor, alpha: 0, duration: 800, onComplete: () => this.s.removeNpc('mayor') });
    });
  }

  onInteract(t: Interactable): boolean {
    if (t.id === 'mayor') {
      this.s.say('Prefeito', this.active ? 'Sai da minha frente, defensor de preguiçoso!' : '...', () => {
        const m = this.s.npcs.get('mayor');
        if (m) m.paused = false;
      });
      return true;
    }
    if (!this.board) return false;
    if (t.kind === 'npc') return this.board.interactNpc(t.id);
    if (t.id.startsWith('pillar:')) return this.board.interactPillar(t.id.slice(7));
    return false;
  }
  onLens(on: boolean): void {
    this.board?.setLens(on);
  }
  update(time: number): void {
    this.board?.update();
    if (!this.active || this.defeated || !this.mayor) return;
    if (time > this.vulnerableUntil && this.vulnerableUntil !== Number.MAX_SAFE_INTEGER) this.mayor.clearTint();
    if (time > this.nextShot && !this.s.blocking) {
      this.nextShot = time + (this.s.time.now < this.vulnerableUntil ? 2600 : 1500);
      this.shoot();
    }
  }
  destroy(): void {
    this.board?.destroy();
    this.hpText?.destroy();
  }
}
registerController('lens_boss', (s) => new LensBoss(s));

// ===================================================================== Sábio
class LensSage implements RoomController {
  private board!: LensBoard;
  constructor(private s: RoomScene) {}

  create(): void {
    const graph = new LensGraph(SAGE_TROUBLES, SAGE_ISSUES);
    this.board = new LensBoard(this.s, graph, {
      npcFor: (id) => this.s.npcs.get(id),
      pillarFor: (id) => this.s.props.get(`pillar:${id}`),
      onSolved: () => this.solved(),
    });
    if (state.has('lens.done')) {
      for (const t of SAGE_TROUBLES) {
        graph.pick(t.id);
        graph.attach(t.issue);
        this.s.props.get(`pillar:${t.issue}`)?.setTexture('pillar_lit');
      }
    } else if (!state.has('sage.intro')) {
      this.s.time.delayedCall(500, () => this.s.dialogue('sage_intro', () => state.set('sage.intro')));
    }
  }

  private solved(): void {
    sfx.success();
    const text = narrateLens(this.board.graph);
    const mills = this.s.npcs.get('mills');
    mills?.setBubble(null);
    this.s.dialogue('sage_done_pre', () => {
      const chunks = text.match(/[^;.]+[;.]?/g)?.map((c) => c.trim()).filter(Boolean) ?? [text];
      const lines: string[] = [];
      let cur = '';
      for (const c of chunks) {
        if ((cur + ' ' + c).length > 150 && cur) {
          lines.push(cur);
          cur = c;
        } else cur = cur ? cur + ' ' + c : c;
      }
      if (cur) lines.push(cur);
      this.s.say('Mills', lines, () => {
        state.setMine('imaginacao', text);
        state.addDid('imaginacao', 'Na Prova do Sábio, liguei cinco pessoas que nunca tinha visto a quatro questões públicas diferentes, sem cair no nó do "esforço".');
        state.set('lens.done');
        this.s.dialogue('sage_done_post');
      });
    });
  }

  onInteract(t: Interactable): boolean {
    if (t.id === 'mills') {
      const m = this.s.npcs.get('mills')!;
      const unpause = () => (m.paused = false);
      if (state.has('lens.done')) this.s.say('Mills', 'Sua explicação está no Caderno. A porta de baixo leva de volta a Pólis.', unpause);
      else this.s.say('Mills', 'Ligue a Lente (X), ouça cada pessoa e leve o fio dela ao pilar que explica o problema. Nem todos vão para o mesmo nó.', unpause);
      return true;
    }
    if (t.kind === 'npc') return this.board.interactNpc(t.id);
    if (t.id.startsWith('pillar:')) return this.board.interactPillar(t.id.slice(7));
    return false;
  }
  onLens(on: boolean): void {
    this.board.setLens(on);
  }
  update(): void {
    this.board.update();
  }
  destroy(): void {
    this.board.destroy();
  }
}
registerController('lens_sage', (s) => new LensSage(s));

export const LENS_TILE = TILE;
