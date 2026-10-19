import Phaser from 'phaser';
import { FONT, GAME_H, GAME_W, TEXT_RES, TILE } from '../config';
import type { Dialogue } from '../content/types';
import { CITY_NORMS, CITY_NPC_LINES, CITY_WORKSHOPS, NORM_PATH, NORM_WALLS, PROVA_SETTLERS, ROLES, SETTLERS, WORDS, type Workshop } from '../content/villagesData';
import { bus } from '../engine/bus';
import type { Npc } from '../engine/Npc';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { T } from '../engine/textures';
import { GearChain, Settlement, narrateSettlement } from '../logic/GearChain';
import { Anomie, LanguageGate, NormCorridor } from '../logic/Norms';
import type { RoomScene } from '../scenes/RoomScene';
import { registerController, type Interactable, type RoomController } from './registry';

// ------------------------------------------------------------------ helpers

/** Luz coletiva: overlay amarelo na tela inteira. */
class CollectiveLight {
  private rect: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private target: number;
  private flicker = 0;

  constructor(s: RoomScene, alpha: number, label: string) {
    this.target = alpha;
    this.rect = s.add.rectangle(0, 0, GAME_W, GAME_H, 0xffe28a, alpha).setOrigin(0).setScrollFactor(0).setDepth(39000);
    this.label = s.add
      .text(GAME_W / 2, 10, label, { fontFamily: FONT, fontSize: '7px', color: '#ffe28a', backgroundColor: '#1a1a22cc', padding: { x: 4, y: 2 } })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setResolution(TEXT_RES)
      .setDepth(45000);
  }

  set(alpha: number, label?: string): void {
    this.target = alpha;
    if (label) this.label.setText(label);
  }

  setFlicker(f: number): void {
    this.flicker = f;
  }

  update(time: number): void {
    const pulse = Math.sin(time / 700) * 0.02;
    const fl = this.flicker ? (Math.sin(time / 60) > 0.3 ? -this.flicker : 0) : 0;
    this.rect.setAlpha(Math.max(0, this.target + pulse + fl));
  }

  destroy(): void {
    this.rect.destroy();
    this.label.destroy();
  }
}

/** Luzes individuais (consciência individual) ao redor de NPCs. */
function drawIndividualLights(g: Phaser.GameObjects.Graphics, npcs: Iterable<Npc>, time: number, strength: number): void {
  for (const n of npcs) {
    const r = 11 + Math.sin(time / 400 + n.x) * 1.5;
    g.fillStyle(0xfff2b0, strength);
    g.fillCircle(n.x, n.y + 2, r);
  }
}

/**
 * GearBoard — engrenagens sobre as oficinas e o anel de dependência.
 * `positions[role]` = posição (px) da engrenagem; `npcFor(role)` = quem trabalha.
 */
class GearBoard {
  private gears = new Map<string, Phaser.GameObjects.Image>();
  private g: Phaser.GameObjects.Graphics;
  private angle = 0;
  running = true;
  showRing = false;

  constructor(
    s: RoomScene,
    private positions: Map<string, { x: number; y: number }>,
  ) {
    this.g = s.add.graphics().setDepth(3);
    for (const [role, p] of positions) this.gears.set(role, s.add.image(p.x, p.y, 'gear').setDepth(p.y + 40).setAlpha(0.95));
  }

  setPresent(role: string, present: boolean): void {
    const img = this.gears.get(role);
    if (img) img.setTexture(present ? 'gear' : 'gear_dark').setAlpha(present ? 0.95 : 0.6);
  }

  update(delta: number): void {
    if (this.running) this.angle += delta * 0.08;
    let i = 0;
    for (const img of this.gears.values()) {
      img.setAngle((i % 2 ? -1 : 1) * this.angle);
      i++;
    }
    this.g.clear();
    if (!this.showRing) return;
    const roles = ROLES.map((r) => r.id).filter((r) => this.positions.has(r));
    for (let k = 0; k < roles.length; k++) {
      const a = this.positions.get(roles[k])!;
      const b = this.positions.get(roles[(k + 1) % roles.length])!;
      this.g.lineStyle(2, this.running ? 0xe6c45a : 0x6a6a7a, 0.9);
      this.g.lineBetween(a.x, a.y, b.x, b.y);
      // seta: ponta no meio
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      this.g.fillStyle(this.running ? 0xe6c45a : 0x6a6a7a, 0.9);
      this.g.fillTriangle(
        mx + Math.cos(ang) * 4,
        my + Math.sin(ang) * 4,
        mx + Math.cos(ang + 2.5) * 4,
        my + Math.sin(ang + 2.5) * 4,
        mx + Math.cos(ang - 2.5) * 4,
        my + Math.sin(ang - 2.5) * 4,
      );
    }
  }

  destroy(): void {
    this.g.destroy();
    for (const img of this.gears.values()) img.destroy();
  }
}

function workshopGearPos(w: Workshop): { x: number; y: number } {
  return { x: w.x * TILE + TILE / 2 + (w.sprite === 'school' ? 0 : 0), y: w.y * TILE + TILE + w.gearDy };
}

/**
 * SettlementBoard — colonos escolhem funções e vão para a casa certa.
 * Reutilizado na Vila Nova e na Prova dos Sábios.
 */
class SettlementBoard {
  readonly settlement: Settlement;
  private gearBoard: GearBoard;
  private lights: Phaser.GameObjects.Graphics;

  constructor(
    private s: RoomScene,
    private settlers: { id: string; name: string }[],
    private housePos: Map<string, { x: number; y: number }>, // role → tile em frente à casa
    gearPos: Map<string, { x: number; y: number }>,
    private onChange: (board: SettlementBoard) => void,
  ) {
    this.settlement = new Settlement(ROLES, settlers.map((x) => x.id));
    this.gearBoard = new GearBoard(s, gearPos);
    this.gearBoard.running = false;
    for (const r of ROLES) this.gearBoard.setPresent(r.id, false);
    this.lights = s.add.graphics().setDepth(2);
  }

  setGearVisible(on: boolean): void {
    this.gearBoard.showRing = on;
  }

  /** Diálogo de escolha de função para um colono. */
  ask(settlerId: string): boolean {
    const st = this.settlers.find((x) => x.id === settlerId);
    if (!st) return false;
    const npc = this.s.npcs.get(settlerId);
    if (!npc) return false;
    if (!state.lensOn) {
      this.s.say(st.name, ['Cheguei pra ficar. Só não sei o que vou fazer aqui.', '(Ligue a Engrenagem com X para combinar as funções.)'], () => (npc.paused = false));
      return true;
    }
    const current = this.settlement.roleOf(settlerId);
    const steps: Dialogue = [
      { who: st.name, text: current ? `Hoje eu sou ${ROLES.find((r) => r.id === current)!.name.toLowerCase()}. Quer que eu mude?` : 'O que eu faço na vila?' },
      {
        choice: `O que ${st.name} vai fazer?`,
        options: ROLES.map((r) => ({ label: `${r.name} (${r.gives})`, event: `assign:${settlerId}:${r.id}` })),
      },
    ];
    bus.emit('dialogue:start', steps, () => (npc.paused = false));
    return true;
  }

  assign(settlerId: string, roleId: string): void {
    this.settlement.assign(settlerId, roleId);
    const npc = this.s.npcs.get(settlerId);
    const target = this.housePos.get(roleId);
    if (npc && target) {
      const n = this.settlement.countOf(roleId);
      npc.route = [{ x: target.x + (n - 1) * 1, y: target.y }];
      npc.setBubble(ROLES.find((r) => r.id === roleId)!.name);
    }
    for (const r of ROLES) this.gearBoard.setPresent(r.id, this.settlement.countOf(r.id) > 0);
    this.gearBoard.running = this.settlement.running;
    sfx.select();
    this.onChange(this);
  }

  update(time: number, delta: number): void {
    this.gearBoard.update(delta);
    this.lights.clear();
    if (this.settlement.kind === 'organica') {
      drawIndividualLights(this.lights, this.settlers.map((x) => this.s.npcs.get(x.id)).filter((n): n is Npc => !!n), time, 0.22);
    }
  }

  destroy(): void {
    this.gearBoard.destroy();
    this.lights.destroy();
  }
}

// ===================================================================== Hall
class VHall implements RoomController {
  constructor(private s: RoomScene) {}
  create(): void {
    if (state.has('aldeia.seen') && state.has('cidade.seen')) state.set('villages.both');
    if (!state.has('v_hall.intro')) {
      this.s.time.delayedCall(400, () => this.s.dialogue('hall_sign', () => state.set('v_hall.intro')));
    }
  }
  onFlag(f: string): void {
    if (f === 'villages.both') {
      for (const id of ['chain', 'chain2', 'chain3']) this.s.removeProp(id);
      bus.emit('toast', 'A corrente do leste caiu. Vila Nova está aberta.', 'info');
    }
  }
  update(): void {
    /* nada */
  }
  destroy(): void {
    /* nada */
  }
}
registerController('v_hall', (s) => new VHall(s));

// =================================================================== Aldeia
class Aldeia implements RoomController {
  private light!: CollectiveLight;
  private guardRoute = false;
  constructor(private s: RoomScene) {}

  create(): void {
    state.set('aldeia.seen');
    this.light = new CollectiveLight(this.s, 0.2, 'Consciência coletiva: FORTE · individual: pequena');
    if (!state.has('aldeia.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('aldeia_intro', () => state.set('aldeia.intro')));
    if (state.has('aldeia.tonho_gone')) this.s.removeNpc('f1');
  }

  onLens(on: boolean): void {
    for (const n of this.s.npcs.values()) if (n.def.id.startsWith('f')) n.def.dialogue = n.def.id === 'f1' ? 'tonho_leave' : on ? 'farmer_line_gear' : 'farmer_line';
  }

  onInteract(t: Interactable): boolean {
    if (t.id === 'tree_common') {
      if (state.has('aldeia.picked')) this.s.dialogue('tree_wait');
      else this.s.dialogue('tree_choice');
      return true;
    }
    return false;
  }

  onEvent(name: string): void {
    switch (name) {
      case 'aldeia:leave':
        this.s.dialogue('tonho_leaving');
        break;
      case 'aldeia:tonho_goes': {
        const tonho = this.s.npcs.get('f1');
        if (tonho) {
          tonho.def.patrol = undefined;
          tonho.paused = false;
          tonho.route = [
            { x: 15, y: 8 },
            { x: 15, y: 16 },
          ];
          this.s.removeInteractable('f1');
          this.s.time.delayedCall(2600, () => {
            this.s.removeNpc('f1');
            state.set('aldeia.tonho_gone');
            state.unlockPage('solidariedade', 'Na Aldeia das Semelhanças, um morador foi embora e nada parou: todos faziam o mesmo trabalho, e a união vinha da semelhança.');
            this.s.dialogue('tonho_gone_result', () => this.checkDone());
          });
        }
        break;
      }
      case 'aldeia:wait':
        this.s.dialogue('tree_wait');
        break;
      case 'aldeia:pick': {
        state.set('aldeia.picked');
        for (const n of this.s.npcs.values()) {
          n.paused = true;
          n.faceTowards(this.s.player.x, this.s.player.y);
          n.setBubble('!');
        }
        this.light.setFlicker(0.08);
        this.s.shake(200, 0.003);
        this.s.time.delayedCall(700, () => this.s.dialogue('tree_picked'));
        break;
      }
      case 'aldeia:pushed': {
        // o guarda leva o jogador até a entrada: coercitividade da consciência coletiva
        const guard = this.s.npcs.get('guard');
        this.s.player.frozen = true;
        bus.emit('fade', true, 350, () => {
          this.s.player.setPosition(this.s.tc(15, 15).x, this.s.tc(15, 15).y);
          if (guard && !this.guardRoute) {
            guard.setPosition(this.s.tc(15, 12).x, this.s.tc(15, 12).y);
            guard.faceTowards(this.s.player.x, this.s.player.y);
            this.guardRoute = true;
          }
          for (const n of this.s.npcs.values()) {
            n.setBubble(null);
            n.paused = false;
          }
          this.light.setFlicker(0);
          bus.emit('fade', false, 350, () => {
            state.unlockPage('consciencia', 'Colhi uma fruta da árvore comum antes da festa e a aldeia inteira reagiu junto: a mesma crença em todas as cabeças, e o guarda me pôs para fora.');
            this.checkDone();
          });
        });
        break;
      }
    }
  }

  private checkDone(): void {
    if (state.has('aldeia.picked') && state.has('aldeia.tonho_gone') && !state.has('aldeia.done')) {
      state.set('aldeia.done');
      sfx.success();
      this.s.dialogue('aldeia_done', () => state.save());
    }
  }

  update(time: number): void {
    this.light.update(time);
  }
  destroy(): void {
    this.light.destroy();
  }
}
registerController('aldeia', (s) => new Aldeia(s));

// =================================================================== Cidade
class Cidade implements RoomController {
  private chain = new GearChain(ROLES, true);
  private board!: GearBoard;
  private light!: CollectiveLight;
  private lights!: Phaser.GameObjects.Graphics;
  constructor(private s: RoomScene) {}

  create(): void {
    state.set('cidade.seen');
    const pos = new Map(CITY_WORKSHOPS.map((w) => [w.role, workshopGearPos(w)]));
    this.board = new GearBoard(this.s, pos);
    this.board.showRing = state.lensOn;
    this.light = new CollectiveLight(this.s, 0.05, 'Consciência coletiva: fraca · individual: FORTE');
    this.lights = this.s.add.graphics().setDepth(2);
    for (const w of CITY_WORKSHOPS) {
      const npc = this.s.npcs.get(`work:${w.role}`);
      if (npc) npc.def.dialogue = w.role === 'padeiro' ? 'baker_choice' : 'farmer_line';
    }
    if (!state.has('cidade.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('cidade_intro', () => state.set('cidade.intro')));
  }

  onLens(on: boolean): void {
    this.board.showRing = on;
  }

  onInteract(t: Interactable): boolean {
    if (!t.id.startsWith('work:')) return false;
    const role = t.id.slice(5);
    const npc = this.s.npcs.get(t.id)!;
    const unpause = () => (npc.paused = false);
    if (role === 'padeiro') {
      this.s.dialogue(this.chain.isPresent('padeiro') ? 'baker_choice' : 'baker_stopped_choice', unpause);
      return true;
    }
    const lines = CITY_NPC_LINES[role];
    const w = CITY_WORKSHOPS.find((x) => x.role === role)!;
    this.s.say(w.name, this.chain.running ? lines.working : lines.stopped, unpause);
    return true;
  }

  onEvent(name: string): void {
    if (name === 'cidade:stop') {
      this.chain.remove('padeiro');
      this.board.running = false;
      this.board.setPresent('padeiro', false);
      this.s.time.delayedCall(600, () => {
        for (const w of CITY_WORKSHOPS) {
          const npc = this.s.npcs.get(`work:${w.role}`);
          if (npc && w.role !== 'padeiro') npc.setBubble(CITY_NPC_LINES[w.role].stopped.split('.')[0] + '.');
        }
        sfx.fray();
        this.s.shake(200, 0.003);
        this.s.dialogue('cidade_stopped', () => {
          state.unlockPage('solidariedade', 'Na Cidade das Engrenagens, o padeiro tirou um dia de folga e o anel inteiro parou: cada um dependia de todos, como as engrenagens de uma máquina.');
        });
      });
    } else if (name === 'cidade:resume') {
      this.chain.restore('padeiro');
      this.board.running = true;
      this.board.setPresent('padeiro', true);
      for (const n of this.s.npcs.values()) n.setBubble(null);
      sfx.success();
      this.s.dialogue('cidade_resumed', () => {
        if (!state.has('cidade.done')) {
          state.set('cidade.done');
          state.addDid('solidariedade', 'Quando o padeiro voltou, as engrenagens giraram de novo, uma puxando a outra: união pela interdependência.');
          this.s.dialogue('cidade_done', () => state.save());
        }
      });
    }
  }

  update(time: number, delta: number): void {
    this.board.update(delta);
    this.light.update(time);
    this.lights.clear();
    drawIndividualLights(this.lights, this.s.npcs.values(), time, 0.2);
  }
  destroy(): void {
    this.board.destroy();
    this.light.destroy();
    this.lights.destroy();
  }
}
registerController('cidade', (s) => new Cidade(s));

// ================================================================ Vila Nova
const VILA_HOUSE_X: Record<string, number> = { agric: 5, padeiro: 10, ferreira: 15, medica: 20, professor: 25 };

class VilaNova implements RoomController {
  private board!: SettlementBoard;
  private light!: CollectiveLight;
  private lastKind = 'vazia';
  constructor(private s: RoomScene) {}

  create(): void {
    const housePos = new Map(Object.entries(VILA_HOUSE_X).map(([r, x]) => [r, { x, y: 7 }]));
    const gearPos = new Map(Object.entries(VILA_HOUSE_X).map(([r, x]) => [r, { x: x * TILE + TILE / 2, y: 5 * TILE + TILE - 44 }]));
    this.board = new SettlementBoard(this.s, SETTLERS, housePos, gearPos, (b) => this.changed(b));
    this.board.setGearVisible(state.lensOn);
    this.light = new CollectiveLight(this.s, 0.0, 'Vila Nova: vazia');
    for (const [r, x] of Object.entries(VILA_HOUSE_X)) {
      const role = ROLES.find((q) => q.id === r)!;
      this.s.add
        .text(x * TILE + TILE / 2, 6 * TILE + 2, role.name, { fontFamily: FONT, fontSize: '7px', color: '#ffffff', backgroundColor: '#2a3a5acc', padding: { x: 3, y: 1 } })
        .setOrigin(0.5, 0)
        .setResolution(TEXT_RES)
        .setDepth(6 * TILE + 20);
    }
    if (state.has('vila.done')) {
      SETTLERS.forEach((st, i) => this.board.assign(st.id, ROLES[i].id));
    } else if (!state.has('vila.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('vila_intro', () => state.set('vila.intro')));
  }

  private changed(b: SettlementBoard): void {
    const kind = b.settlement.kind;
    const labels: Record<string, string> = {
      vazia: 'Vila Nova: vazia',
      mista: `Vila Nova: mista · faltam ${b.settlement.missingRoles.map((r) => r.name.toLowerCase()).join(', ')}`,
      mecanica: 'Vila Nova: ALDEIA · consciência coletiva forte · ninguém depende de ninguém',
      organica: 'Vila Nova: CIDADE · engrenagens encaixadas · cada um depende dos outros',
    };
    this.light.set(kind === 'mecanica' ? 0.2 : kind === 'organica' ? 0.05 : 0.0, labels[kind]);
    if (kind !== this.lastKind) {
      this.lastKind = kind;
      if (kind === 'mecanica') this.s.time.delayedCall(900, () => this.s.dialogue('vila_mechanical'));
      if (kind === 'organica' && !state.has('vila.done')) {
        sfx.success();
        this.s.time.delayedCall(900, () => {
          state.set('vila.done');
          state.addDid('solidariedade', 'Na Vila Nova, dei cinco funções diferentes a cinco colonos: as engrenagens encaixaram, cada luz individual acendeu e a vila girou pela interdependência.');
          this.s.dialogue('vila_organic', () => state.save());
        });
      }
    }
  }

  onLens(on: boolean): void {
    this.board.setGearVisible(on);
  }

  onInteract(t: Interactable): boolean {
    if (t.id.startsWith('set:')) return this.board.ask(t.id);
    return false;
  }

  onEvent(name: string): void {
    if (name.startsWith('assign:')) {
      const parts = name.split(':'); // assign:set:<nome>:<papel>
      if (parts.length === 4) this.board.assign(`${parts[1]}:${parts[2]}`, parts[3]);
    }
  }

  onFlag(f: string): void {
    if (f === 'vila.done') {
      this.s.removeProp('chain');
      this.s.removeProp('chain2');
    }
  }

  update(time: number, delta: number): void {
    this.board.update(time, delta);
    this.light.update(time);
  }
  destroy(): void {
    this.board.destroy();
    this.light.destroy();
  }
}
registerController('vila_nova', (s) => new VilaNova(s));

// =================================================================== Normas
class Normas implements RoomController {
  private corridor = new NormCorridor(NORM_WALLS);
  private gate = new LanguageGate(WORDS);
  private walls: Phaser.GameObjects.Zone[] = [];
  private g!: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private lastBump = 0;
  private gateProps: string[] = [];
  constructor(private s: RoomScene) {}

  create(): void {
    this.g = this.s.add.graphics().setDepth(1);
    for (const n of NORM_WALLS) {
      const z = this.s.add.zone(n.x * TILE, n.y * TILE, n.w * TILE, n.h * TILE).setOrigin(0);
      this.s.physics.add.existing(z, true);
      this.s.physics.add.collider(this.s.player, z, () => this.bump(n.id));
      this.walls.push(z);
      const t = this.s.add
        .text(n.x * TILE + TILE / 2, n.y * TILE - 2, n.rule, { fontFamily: FONT, fontSize: '7px', color: '#ffe28a', backgroundColor: '#1a1a22cc', padding: { x: 3, y: 1 }, align: 'center', wordWrap: { width: 80 } })
        .setOrigin(0.5, 1)
        .setResolution(TEXT_RES)
        .setDepth(20000)
        .setVisible(false);
      this.labels.push(t);
    }
    // passantes que desviam dos muros
    for (let i = 0; i < 3; i++) {
      const start = NORM_PATH[(i * 7) % NORM_PATH.length];
      const npc = this.s.spawnNpc({ type: 'npc', id: `walker${i}`, x: start.x, y: start.y, look: ['townA', 'townB', 'farmer'][i], name: 'Passante', dialogue: 'walker_line', speed: 34 });
      npc.def.patrol = [...NORM_PATH.slice((i * 7) % NORM_PATH.length), ...NORM_PATH.slice(0, (i * 7) % NORM_PATH.length)];
      this.s.npcColliders.get(`walker${i}`)?.destroy();
      (npc.body as Phaser.Physics.Arcade.Body).checkCollision.none = true;
    }
    if (!state.has('normas.done')) {
      for (let y = 5; y <= 11; y++) {
        this.s.spawnProp({ type: 'prop', id: `lgate:${y}`, x: 30, y, sprite: 'gate', solid: true, bodyW: 14, bodyH: 16 });
        this.gateProps.push(`lgate:${y}`);
      }
      if (!state.has('normas.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('normas_intro', () => state.set('normas.intro')));
    } else {
      this.corridor.reveal();
      for (const w of WORDS) this.gate.learn(w.id);
    }
    for (const w of WORDS) {
      const npc = this.s.npcs.get(`teach:${w.id}`);
      if (npc) npc.def.dialogue = 'walker_line';
    }
  }

  private bump(id: string): void {
    const now = this.s.time.now;
    if (now - this.lastBump < 700) return;
    this.lastBump = now;
    const n = this.corridor.bump(id);
    sfx.hit();
    const w = NORM_WALLS.find((x) => x.id === id)!;
    const cx = w.x * TILE + (w.w * TILE) / 2;
    const cy = Phaser.Math.Clamp(this.s.player.y, w.y * TILE, (w.y + w.h) * TILE);
    const ring = this.s.add.circle(cx, cy, 4, 0xffe28a, 0).setStrokeStyle(2, 0xffe28a, 0.9).setDepth(20000);
    this.s.tweens.add({ targets: ring, radius: 22, alpha: 0, duration: 450, onComplete: () => ring.destroy() });
    if (this.corridor.totalBumps === 1) this.s.dialogue('norm_bump_first');
    else if (n === 2 && !this.corridor.revealed) bus.emit('hint', 'Empurrou de novo. Ligue a Engrenagem (X) para ver o que é isso.');
    if (state.lensOn) this.tryReveal();
  }

  private tryReveal(): void {
    if (this.corridor.revealed || !this.corridor.reveal()) return;
    sfx.thread();
    this.s.dialogue('norm_reveal', () => {
      state.unlockPage('fato-social', 'Bati em muros que ninguém vê. Com a Engrenagem, apareceram: regras que existiam antes de mim (exterioridade), que me empurravam (coercitividade) e de que todos desviavam (generalidade).');
    });
  }

  onLens(on: boolean): void {
    if (on) this.tryReveal();
  }

  onInteract(t: Interactable): boolean {
    if (t.id.startsWith('teach:')) {
      const id = t.id.slice(6);
      const w = WORDS.find((x) => x.id === id)!;
      const npc = this.s.npcs.get(t.id)!;
      const unpause = () => (npc.paused = false);
      const fresh = this.gate.learn(id);
      this.corridor.observe(id);
      const lines = fresh
        ? [`"${w.word}" é como a gente diz "${w.meaning}" por aqui. Você vai precisar.`, `(Você aprendeu: ${w.word} = ${w.meaning}. ${this.gate.learnedCount}/${WORDS.length}.)`]
        : [`"${w.word}", lembra? É "${w.meaning}".`];
      this.s.say(w.teacher, lines, unpause);
      if (fresh && this.gate.canGreet) bus.emit('hint', 'Você aprendeu a saudação inteira com o grupo. Fale com o Porteiro.');
      return true;
    }
    if (t.id === 'keeper') {
      const npc = this.s.npcs.get('keeper')!;
      const unpause = () => (npc.paused = false);
      if (state.has('normas.done')) {
        this.s.say('Porteiro', 'Taná! Pode passar quantas vezes quiser.', unpause);
        return true;
      }
      if (this.gate.canGreet) this.s.dialogue('keeper_after', unpause);
      else this.s.dialogue(this.gate.learnedCount > 0 ? 'keeper_partial' : 'keeper_before', unpause);
      return true;
    }
    return false;
  }

  onEvent(name: string): void {
    if (name === 'normas:open') {
      sfx.door();
      for (const id of this.gateProps) {
        const img = this.s.props.get(id);
        if (img) {
          const body = (img as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.StaticBody | null;
          if (body) body.enable = false;
          this.s.tweens.add({ targets: img, alpha: 0, duration: 400, onComplete: () => this.s.removeProp(id) });
        }
      }
      state.set('normas.done');
      state.addDid('fato-social', 'A língua do corredor era outro fato social: só passei pelo Porteiro depois de aprender a saudação com três pessoas do grupo.');
      this.s.dialogue('normas_done', () => state.save());
    }
  }

  update(): void {
    this.g.clear();
    const show = this.corridor.revealed && state.lensOn;
    this.labels.forEach((t) => t.setVisible(show));
    if (!show) return;
    for (const n of NORM_WALLS) {
      this.g.fillStyle(0xffe28a, 0.18);
      this.g.fillRect(n.x * TILE, n.y * TILE, n.w * TILE, n.h * TILE);
      this.g.lineStyle(1, 0xffe28a, 0.7);
      this.g.strokeRect(n.x * TILE, n.y * TILE, n.w * TILE, n.h * TILE);
    }
  }
  destroy(): void {
    this.g.destroy();
    this.labels.forEach((t) => t.destroy());
  }
}
registerController('normas', (s) => new Normas(s));

// ================================================================= Conflito
class Conflito implements RoomController {
  private light!: CollectiveLight;
  private fog?: Phaser.GameObjects.Rectangle;
  constructor(private s: RoomScene) {}

  create(): void {
    this.light = new CollectiveLight(this.s, 0.12, 'Roça: consciência coletiva piscando · Praça: duas guildas em silêncio');
    this.light.setFlicker(state.has('conflito.durk') ? 0 : 0.06);
    this.fog = this.s.add.rectangle(TILE, TILE, 14 * TILE, 16 * TILE, 0xb0b0c8, 0).setOrigin(0).setDepth(38000);
    if (state.has('conflito.durk')) {
      this.s.npcs.get('brig1')?.setBubble(null);
      this.s.npcs.get('brig2')?.setBubble(null);
      const b1 = this.s.npcs.get('brig1');
      const b2 = this.s.npcs.get('brig2');
      if (state.has('conflito.letfight')) this.fog.setAlpha(0.35);
      else if (b1 && b2) {
        b1.setPosition(this.s.tc(4, 11).x, this.s.tc(4, 11).y);
        b2.setPosition(this.s.tc(10, 5).x, this.s.tc(10, 5).y);
      }
    }
    if (state.has('conflito.simmel')) this.buildBridge();
    if (!state.has('conflito.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('conflito_intro', () => state.set('conflito.intro')));
  }

  private buildBridge(): void {
    for (const y of [8, 9]) {
      this.s.setTile(15, y, T.bridge);
      this.s.setTile(16, y, T.bridge);
    }
  }

  onInteract(t: Interactable): boolean {
    const npc = this.s.npcs.get(t.id);
    const unpause = () => {
      if (npc) npc.paused = false;
    };
    if (t.id === 'brig1' || t.id === 'brig2') {
      if (state.has('conflito.durk')) this.s.say('Lavrador', state.has('conflito.letfight') ? 'A gente ainda não se acertou. E a névoa só aumenta.' : 'A regra voltou a valer. A gente se entendeu.', unpause);
      else this.s.dialogue('fight_choice', unpause);
      return true;
    }
    if (t.id === 'lider_pad' || t.id === 'lider_fer') {
      if (state.has('conflito.simmel')) this.s.say(npc?.npcName ?? 'Chefe', 'Fornos de manhã, forja à tarde. A ponte nova é dos dois.', unpause);
      else this.s.dialogue('guild_choice', unpause);
      return true;
    }
    return false;
  }

  onEvent(name: string): void {
    switch (name) {
      case 'conflito:separate': {
        state.set('conflito.durk');
        const b1 = this.s.npcs.get('brig1');
        const b2 = this.s.npcs.get('brig2');
        b1?.setBubble(null);
        b2?.setBubble(null);
        if (b1) {
          b1.paused = false;
          b1.route = [{ x: 4, y: 11 }];
        }
        if (b2) {
          b2.paused = false;
          b2.route = [{ x: 10, y: 5 }];
        }
        this.light.setFlicker(0);
        this.s.props.get('plaque_rule')?.setTexture('plaque');
        sfx.success();
        this.s.dialogue('fight_separated', () => {
          state.unlockPage('conflito', 'Na roça, dois lavradores brigavam e a luz coletiva piscava: separei os dois e reacendi a regra. Para Durkheim, conflito é sinal de normas enfraquecidas.');
          this.checkDone();
        });
        break;
      }
      case 'conflito:letfight': {
        state.set('conflito.durk');
        state.set('conflito.letfight');
        this.light.setFlicker(0.12);
        if (this.fog) this.s.tweens.add({ targets: this.fog, alpha: 0.35, duration: 1500 });
        sfx.fray();
        this.s.dialogue('fight_let', () => {
          state.unlockPage('conflito', 'Na roça, deixei dois lavradores brigarem: a luz coletiva piscou e a névoa entrou. Para Durkheim, conflito é sinal de normas enfraquecidas e ameaça a coesão.');
          this.checkDone();
        });
        break;
      }
      case 'conflito:corner':
        this.s.dialogue('guild_corner');
        break;
      case 'conflito:plaza':
        this.s.dialogue('guild_plaza');
        break;
      case 'conflito:plaza_done': {
        state.set('conflito.simmel');
        this.buildBridge();
        for (const id of ['gate:8', 'gate:9']) {
          const img = this.s.props.get(id);
          if (img) {
            const body = (img as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.StaticBody | null;
            if (body) body.enable = false;
            this.s.tweens.add({ targets: img, alpha: 0, duration: 400, onComplete: () => this.s.removeProp(id) });
          }
        }
        sfx.success();
        state.addDid('conflito', 'Na praça, levei a disputa das guildas para o meio, com regras e todo mundo olhando: resolveram, e construíram uma ponte nova. Para Simmel, o conflito pode unir e gerar mudança.');
        this.checkDone();
        break;
      }
    }
  }

  private checkDone(): void {
    if (state.has('conflito.durk') && state.has('conflito.simmel') && !state.has('conflito.done')) {
      state.set('conflito.done');
      this.s.time.delayedCall(500, () => this.s.dialogue('conflito_done', () => state.save()));
    }
  }

  update(time: number): void {
    this.light.update(time);
  }
  destroy(): void {
    this.light.destroy();
    this.fog?.destroy();
  }
}
registerController('conflito', (s) => new Conflito(s));

// =================================================================== Anomia
class AnomiaCtl implements RoomController {
  private anomie = new Anomie(
    CITY_NORMS.map((n) => n.id),
    CITY_WORKSHOPS.map((w) => w.role),
  );
  private fog!: Phaser.GameObjects.Rectangle;
  private fogG!: Phaser.GameObjects.Graphics;
  private board!: GearBoard;
  private wisps!: Phaser.Physics.Arcade.Group;
  private prova?: SettlementBoard;
  private progress!: Phaser.GameObjects.Text;
  private cleared = false;
  private wispTimer = 0;
  constructor(private s: RoomScene) {}

  create(): void {
    this.fog = this.s.add.rectangle(0, 0, GAME_W, GAME_H, 0xb0b0c8, 0.55).setOrigin(0).setScrollFactor(0).setDepth(39000);
    this.fogG = this.s.add.graphics().setScrollFactor(0).setDepth(39001);
    this.board = new GearBoard(this.s, new Map(CITY_WORKSHOPS.map((w) => [w.role, workshopGearPos(w)])));
    this.board.running = false;
    this.board.showRing = state.lensOn;
    for (const w of CITY_WORKSHOPS) this.board.setPresent(w.role, false);
    this.progress = this.s.add
      .text(GAME_W / 2, 8, '', { fontFamily: FONT, fontSize: '8px', color: '#ffffff', backgroundColor: '#1a1a22cc', padding: { x: 4, y: 2 } })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setResolution(TEXT_RES)
      .setDepth(45000);
    this.wisps = this.s.physics.add.group();
    this.s.physics.add.overlap(this.s.player, this.wisps, (_p, w) => {
      const wisp = w as Phaser.Physics.Arcade.Image;
      this.s.player.hurt(wisp.x, wisp.y);
    });

    if (state.has('villages.done')) {
      this.cleared = true;
      this.fog.setAlpha(0);
      this.board.running = true;
      for (const w of CITY_WORKSHOPS) {
        this.board.setPresent(w.role, true);
        this.s.spawnNpc({ type: 'npc', id: `work:${w.role}`, x: w.npcX, y: w.npcY, look: w.look, name: w.name, facing: 'down', dialogue: 'farmer_line' });
      }
      for (const n of CITY_NORMS) this.s.props.get(`norm:${n.id}`)?.setTexture('plaque');
      this.s.spawnNpc({ type: 'npc', id: 'durkheim', x: 14, y: 5, look: 'durkheim', name: 'Durkheim', facing: 'down', dialogue: 'sages_done_post' });
      this.s.spawnNpc({ type: 'npc', id: 'simmel', x: 17, y: 5, look: 'simmel', name: 'Simmel', facing: 'down', dialogue: 'sages_done_post' });
      this.progress.setText('Cidade das Engrenagens — névoa dissipada');
      return;
    }
    // moradores perdidos, fora dos postos
    const lostPos = [
      { x: 6, y: 6 },
      { x: 24, y: 10 },
      { x: 12, y: 14 },
      { x: 28, y: 14 },
      { x: 16, y: 10 },
    ];
    CITY_WORKSHOPS.forEach((w, i) => {
      const npc = this.s.spawnNpc({
        type: 'npc',
        id: `work:${w.role}`,
        x: lostPos[i].x,
        y: lostPos[i].y,
        look: w.look,
        name: w.name,
        dialogue: 'lost_choice',
        speed: 22,
        patrol: [
          { x: lostPos[i].x, y: lostPos[i].y },
          { x: lostPos[i].x + 2, y: lostPos[i].y + 1 },
          { x: lostPos[i].x - 1, y: lostPos[i].y + 2 },
        ],
      });
      npc.setBubble('...');
    });
    for (const n of CITY_NORMS) this.s.props.get(`norm:${n.id}`)?.setTexture('plaque_q').setTint(0x6a6a7a);
    this.refreshProgress();
    if (!state.has('anomia.intro')) this.s.time.delayedCall(500, () => this.s.dialogue('anomia_intro', () => state.set('anomia.intro')));
  }

  private refreshProgress(): void {
    this.progress.setText(`ANOMIA · normas ${CITY_NORMS.filter((n) => this.anomie.isLit(n.id)).length}/${CITY_NORMS.length} · postos ${CITY_WORKSHOPS.filter((w) => this.anomie.isBack(w.role)).length}/${CITY_WORKSHOPS.length}`);
    this.s.tweens.add({ targets: this.fog, alpha: 0.55 * this.anomie.density, duration: 800 });
  }

  private spawnWisp(): void {
    if (this.cleared || this.wisps.countActive(true) >= 3) return;
    const edges = [
      { x: 2, y: 4 },
      { x: 29, y: 4 },
      { x: 2, y: 15 },
      { x: 29, y: 15 },
    ];
    const e = edges[Math.floor(Math.random() * edges.length)];
    const w = this.wisps.create(this.s.tc(e.x, e.y).x, this.s.tc(e.x, e.y).y, 'wisp') as Phaser.Physics.Arcade.Image;
    w.setDepth(5000).setAlpha(0.9);
    w.setData('hp', 2);
  }

  onAttack(rect: Phaser.Geom.Rectangle): void {
    for (const obj of this.wisps.getChildren()) {
      const w = obj as Phaser.Physics.Arcade.Image;
      if (!w.active) continue;
      if (Phaser.Geom.Intersects.RectangleToRectangle(rect, w.getBounds())) {
        sfx.hit();
        const hp = (w.getData('hp') as number) - 1;
        if (hp <= 0) {
          this.s.tweens.add({ targets: w, alpha: 0, scale: 1.6, duration: 200, onComplete: () => w.destroy() });
        } else {
          w.setData('hp', hp);
          const ang = Phaser.Math.Angle.Between(this.s.player.x, this.s.player.y, w.x, w.y);
          w.setVelocity(Math.cos(ang) * 160, Math.sin(ang) * 160);
          this.s.time.delayedCall(250, () => w.active && w.setVelocity(0, 0));
        }
      }
    }
  }

  onLens(on: boolean): void {
    this.board.showRing = on;
    this.prova?.setGearVisible(on);
  }

  onInteract(t: Interactable): boolean {
    if (t.id.startsWith('norm:')) {
      const id = t.id.slice(5);
      const n = CITY_NORMS.find((x) => x.id === id)!;
      if (this.anomie.isLit(id) || this.cleared) {
        this.s.say(undefined, `"${n.rule}" (placa acesa)`);
        return true;
      }
      this.anomie.relight(id);
      this.s.props.get(t.id)?.setTexture('plaque').clearTint();
      sfx.thread();
      this.s.cameras.main.flash(80, 255, 240, 180, false);
      this.s.say(undefined, [`Você diz em voz alta: "${n.rule}".`, '(A placa reacende. Quem passa por perto diminui o passo.)'], () => this.progressStep());
      return true;
    }
    if (t.id.startsWith('work:') && !this.cleared) {
      const role = t.id.slice(5);
      const npc = this.s.npcs.get(t.id)!;
      const unpause = () => (npc.paused = false);
      if (this.anomie.isBack(role)) {
        this.s.say(npc.npcName, CITY_NPC_LINES[role].working, unpause);
        return true;
      }
      const steps: Dialogue = [
        { who: npc.npcName, text: 'Trabalhar pra quê? Ninguém mais faz a parte dele. Eu também não.' },
        {
          choice: 'O que você diz?',
          options: [
            { label: `Lembrar quem depende do que ${npc.npcName} faz`, event: `anomia:back:${role}` },
            { label: 'Deixar vagar', event: 'anomia:leave' },
          ],
        },
      ];
      bus.emit('dialogue:start', steps, unpause);
      return true;
    }
    if (t.id.startsWith('set:')) return this.prova?.ask(t.id) ?? false;
    if (t.id === 'durkheim' || t.id === 'simmel') {
      const npc = this.s.npcs.get(t.id)!;
      const unpause = () => (npc.paused = false);
      if (state.has('villages.done')) this.s.dialogue('sages_done_post', unpause);
      else this.s.say(npc.npcName, 'Combine uma função com cada colono (Engrenagem ligada). A vila precisa girar.', unpause);
      return true;
    }
    return false;
  }

  onEvent(name: string): void {
    if (name.startsWith('anomia:back:')) {
      const role = name.slice(12);
      const w = CITY_WORKSHOPS.find((x) => x.role === role)!;
      const npc = this.s.npcs.get(`work:${role}`);
      const roleDef = ROLES.find((r) => r.id === role)!;
      const next = ROLES[(ROLES.findIndex((r) => r.id === role) + 1) % ROLES.length];
      const nextW = CITY_WORKSHOPS.find((x) => x.role === next.id)!;
      this.anomie.bringBack(role);
      if (npc) {
        npc.def.patrol = undefined;
        npc.paused = false;
        npc.route = [{ x: w.npcX, y: w.npcY }];
        npc.setBubble(null);
      }
      this.board.setPresent(role, true);
      sfx.thread();
      this.s.say(npc?.npcName ?? w.name, [`${nextW.name} precisa de ${roleDef.gives}. Sem mim, ${nextW.name.split(' ').pop()} para.`, 'Tá certo. Volto pro meu posto.'], () => this.progressStep());
    } else if (name === 'anomia:leave') {
      this.s.dialogue('lost_leave');
    } else if (name.startsWith('assign:')) {
      const parts = name.split(':');
      if (parts.length === 4 && this.prova) this.prova.assign(`${parts[1]}:${parts[2]}`, parts[3]);
    }
  }

  private progressStep(): void {
    this.refreshProgress();
    if (this.anomie.dissipated && !this.cleared) this.clear();
  }

  private clear(): void {
    this.cleared = true;
    this.board.running = true;
    this.wisps.clear(true, true);
    sfx.success();
    this.s.tweens.add({ targets: this.fog, alpha: 0, duration: 1500 });
    state.addDid('solidariedade', 'Na Anomia, a névoa só se dissipou quando trouxe cada pessoa de volta ao seu posto e reacendi as normas: cadeia e normas de volta, coesão de volta.');
    this.s.dialogue('anomia_cleared', () => {
      this.s.spawnNpc({ type: 'npc', id: 'durkheim', x: 14, y: 5, look: 'durkheim', name: 'Durkheim', facing: 'down', dialogue: 'sages_intro' });
      this.s.spawnNpc({ type: 'npc', id: 'simmel', x: 17, y: 5, look: 'simmel', name: 'Simmel', facing: 'down', dialogue: 'sages_intro' });
      this.s.time.delayedCall(600, () => this.s.dialogue('sages_intro', () => this.startProva()));
    });
  }

  private startProva(): void {
    PROVA_SETTLERS.forEach((st, i) => {
      this.s.spawnNpc({ type: 'npc', id: st.id, x: 9 + i * 3, y: 12, look: st.look, name: st.name, facing: 'up', dialogue: 'settler_no_gear' });
    });
    const housePos = new Map(CITY_WORKSHOPS.map((w) => [w.role, { x: w.npcX + 1, y: w.npcY + 1 }]));
    const gearPos = new Map(CITY_WORKSHOPS.map((w) => [w.role, { x: workshopGearPos(w).x + 18, y: workshopGearPos(w).y }]));
    this.prova = new SettlementBoard(this.s, PROVA_SETTLERS, housePos, gearPos, (b) => {
      if (b.settlement.kind === 'organica' && !state.has('villages.done')) this.s.time.delayedCall(800, () => this.finishProva(b));
      else if (b.settlement.kind === 'mecanica') this.s.time.delayedCall(800, () => this.s.say('Durkheim', 'Todos iguais: isso é uma aldeia, união pela semelhança. Eles pediram uma cidade que gire.'));
    });
    this.prova.setGearVisible(state.lensOn);
    bus.emit('hint', 'Prova: combine uma função diferente com cada colono (Engrenagem ligada, X).');
  }

  private finishProva(b: SettlementBoard): void {
    const text = narrateSettlement(b.settlement, (id) => PROVA_SETTLERS.find((x) => x.id === id)?.name ?? id);
    const simmelLine = state.has('conflito.simmel')
      ? 'E quando as guildas brigaram, você levou a disputa para a praça: o conflito, bem conduzido, uniu os dois lados.'
      : 'E lembre do que viu na praça: conflito levado ao aberto pode unir, escondido só corrói.';
    this.s.dialogue('sages_done_pre', () => {
      this.s.say('Durkheim', text, () => {
        this.s.say('Simmel', simmelLine, () => {
          state.setMine('solidariedade', text + ' ' + simmelLine);
          state.set('villages.done');
          sfx.success();
          this.s.dialogue('sages_done_post', () => state.save());
        });
      });
    });
  }

  update(time: number, delta: number): void {
    this.board.update(delta);
    this.prova?.update(time, delta);
    // névoa viva: manchas que derivam
    this.fogG.clear();
    const d = this.fog.alpha / 0.55;
    if (d > 0.02) {
      for (let i = 0; i < 9; i++) {
        const x = ((i * 97 + time * 0.012 * (1 + (i % 3))) % (GAME_W + 120)) - 60;
        const y = 30 + ((i * 53) % (GAME_H - 60)) + Math.sin(time / 900 + i) * 12;
        this.fogG.fillStyle(0xd0d0e0, 0.16 * d);
        this.fogG.fillEllipse(x, y, 90 + (i % 4) * 20, 36);
      }
    }
    if (this.cleared) return;
    this.wispTimer += delta;
    if (this.wispTimer > 3500) {
      this.wispTimer = 0;
      this.spawnWisp();
    }
    for (const obj of this.wisps.getChildren()) {
      const w = obj as Phaser.Physics.Arcade.Image;
      if (!w.active) continue;
      if (Math.abs(w.body!.velocity.x) > 100) continue; // recuando
      const ang = Phaser.Math.Angle.Between(w.x, w.y, this.s.player.x, this.s.player.y);
      const sp = 26 + 18 * this.anomie.density;
      w.setVelocity(Math.cos(ang) * sp, Math.sin(ang) * sp);
      w.setAlpha(0.6 + Math.sin(time / 200 + w.x) * 0.3);
    }
  }
  destroy(): void {
    this.board.destroy();
    this.prova?.destroy();
    this.fog.destroy();
    this.fogG.destroy();
    this.progress.destroy();
  }
}
registerController('anomia', (s) => new AnomiaCtl(s));
