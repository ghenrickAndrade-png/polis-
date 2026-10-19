import Phaser from 'phaser';
import { FONT, GAME_H, GAME_W, TEXT_RES, TILE, type Dir } from '../config';
import { COMTE_SUBJECTS, LAW_TERRAINS, SAGE_DOORS, STATIONS, TOLLS, TORCHES, WORKERS } from '../content/castleData';
import type { Dialogue } from '../content/types';
import { bus } from '../engine/bus';
import type { Npc } from '../engine/Npc';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { T } from '../engine/textures';
import { FlameCarry, PinFactory, PowerKeys, ThreeStates } from '../logic/Castle';
import type { RoomScene } from '../scenes/RoomScene';
import { registerController, type Interactable, type RoomController } from './registry';

function label(s: RoomScene, x: number, y: number, text: string, bg = '#2a3a5acc', width = 90): Phaser.GameObjects.Text {
  return s.add
    .text(x, y, text, { fontFamily: FONT, fontSize: '7px', color: '#ffffff', align: 'center', wordWrap: { width }, backgroundColor: bg, padding: { x: 3, y: 2 } })
    .setOrigin(0.5, 1)
    .setResolution(TEXT_RES)
    .setDepth(y + 1);
}

function hud(s: RoomScene, text: string): Phaser.GameObjects.Text {
  return s.add
    .text(GAME_W / 2, 8, text, { fontFamily: FONT, fontSize: '8px', color: '#ffffff', backgroundColor: '#1a1a22cc', padding: { x: 4, y: 2 } })
    .setOrigin(0.5, 0)
    .setScrollFactor(0)
    .setResolution(TEXT_RES)
    .setDepth(45000);
}

function disableProp(s: RoomScene, id: string): void {
  const img = s.props.get(id);
  if (!img) return;
  const body = (img as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.StaticBody | null;
  if (body) body.enable = false;
  s.tweens.add({ targets: img, alpha: 0, duration: 400, onComplete: () => s.removeProp(id) });
}

// ------------------------------------------------------------------ rigs

/** Chama: braseiro + tochas; o jogador carrega um graveto aceso. */
class FlameRig {
  readonly flame: FlameCarry;
  private carried: Phaser.GameObjects.Image;
  private labels = new Map<string, Phaser.GameObjects.Text>();

  constructor(
    private s: RoomScene,
    torches: { id: string; idea: string }[],
    private onLit: (id: string) => void,
  ) {
    this.flame = new FlameCarry(torches);
    this.carried = s.add.image(0, 0, 'torch_lit').setVisible(false).setDepth(30000).setScale(0.8);
  }

  interact(id: string): boolean {
    if (id === 'brazier') {
      if (this.flame.carrying) this.s.dialogue('flame_carrying');
      else {
        this.flame.take();
        sfx.thread();
        this.s.dialogue('flame_take');
      }
      return true;
    }
    if (id.startsWith('torch:')) {
      const tid = id.slice(6);
      const t = this.flame.torches.find((x) => x.id === tid);
      if (!t) return false;
      if (this.flame.isLit(tid)) {
        this.s.say(undefined, `Tocha acesa: "${t.idea}".`);
        return true;
      }
      if (!this.flame.carrying) {
        this.s.say(undefined, '(Tocha apagada. Pegue fogo no braseiro e traga até aqui.)');
        return true;
      }
      this.flame.light(tid);
      const img = this.s.props.get(id);
      img?.setTexture('torch_lit');
      if (img) this.labels.set(tid, label(this.s, img.x, img.y - 24, t.idea, '#5a3a1acc'));
      sfx.pickup();
      this.s.cameras.main.flash(90, 255, 220, 150, false);
      this.onLit(tid);
      return true;
    }
    return false;
  }

  extinguish(): boolean {
    if (!this.flame.extinguish()) return false;
    sfx.fray();
    return true;
  }

  update(): void {
    this.carried.setVisible(this.flame.carrying).setPosition(this.s.player.x + 7, this.s.player.y - 12);
  }

  destroy(): void {
    this.carried.destroy();
    for (const l of this.labels.values()) l.destroy();
  }
}

/** Três chaves: pega no trono, coloca nos pedestais A/B/C. */
class KeyRig {
  readonly keys = new PowerKeys();
  private carried: Phaser.GameObjects.Image;
  private g: Phaser.GameObjects.Graphics;
  private placed = new Map<string, Phaser.GameObjects.Image>();

  constructor(
    private s: RoomScene,
    private onChange: () => void,
  ) {
    this.carried = s.add.image(0, 0, 'key').setVisible(false).setDepth(30000);
    this.g = s.add.graphics().setDepth(2);
  }

  interact(id: string): boolean {
    if (id.startsWith('key:')) {
      const k = id.slice(4);
      if (this.keys.carrying()) {
        this.s.say(undefined, '(Você já carrega uma chave. Uma de cada vez: coloque-a num pedestal primeiro.)');
        return true;
      }
      if (!this.keys.take(k)) return true;
      const img = this.s.props.get(id);
      img?.setVisible(false);
      sfx.pickup();
      this.s.say(undefined, `(Chave "${k.toUpperCase()}". Leve-a a um pedestal.)`);
      this.onChange();
      return true;
    }
    if (id.startsWith('ped:')) {
      const ped = id.slice(4) as 'A' | 'B' | 'C';
      const carrying = this.keys.carrying();
      if (!carrying) {
        const at = this.keys.keysAt(ped);
        this.s.say(undefined, at.length ? `(Pedestal ${ped}: ${at.map((x) => x.toUpperCase()).join(' e ')}.)` : `(Pedestal ${ped}, vazio.)`);
        return true;
      }
      this.keys.place(ped);
      const pimg = this.s.props.get(id)!;
      const n = this.keys.keysAt(ped).length;
      const kimg = this.s.add.image(pimg.x - 6 + (n - 1) * 8, pimg.y - 14, 'key').setDepth(pimg.y + 1);
      this.placed.set(carrying, kimg);
      sfx.thread();
      this.onChange();
      return true;
    }
    return false;
  }

  /** Permite re-pegar uma chave já colocada num pedestal (interagindo no pedestal com as mãos vazias e segurando B). */
  takeBack(ped: 'A' | 'B' | 'C'): boolean {
    const at = this.keys.keysAt(ped);
    if (!at.length || this.keys.carrying()) return false;
    const k = at[at.length - 1];
    this.keys.take(k);
    this.placed.get(k)?.destroy();
    this.placed.delete(k);
    this.onChange();
    return true;
  }

  update(): void {
    this.carried.setVisible(!!this.keys.carrying()).setPosition(this.s.player.x + 8, this.s.player.y - 12);
    this.g.clear();
    if (this.keys.separated) {
      const pts = (['A', 'B', 'C'] as const).map((p) => this.s.props.get(`ped:${p}`)).filter((x): x is Phaser.GameObjects.Image => !!x);
      this.g.lineStyle(2, 0xe6c45a, 0.9);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        this.g.lineBetween(a.x, a.y - 8, b.x, b.y - 8);
      }
    }
  }

  destroy(): void {
    this.carried.destroy();
    this.g.destroy();
    for (const k of this.placed.values()) k.destroy();
  }
}

// ===================================================================== Hall
class CastleHall implements RoomController {
  private rig!: FlameRig;
  private dark!: Phaser.GameObjects.RenderTexture;
  private lastBlow = 0;
  constructor(private s: RoomScene) {}

  create(): void {
    this.rig = new FlameRig(this.s, TORCHES, () => this.lit());
    this.dark = this.s.add.renderTexture(0, 0, GAME_W, GAME_H).setOrigin(0).setScrollFactor(0).setDepth(39500);
    if (state.has('castle.torches')) {
      for (const t of TORCHES) {
        this.rig.flame.take();
        this.rig.flame.light(t.id);
        this.s.props.get(`torch:${t.id}`)?.setTexture('torch_lit');
      }
      const dogma = this.s.npcs.get('dogma');
      if (dogma) {
        dogma.def.patrol = undefined;
        dogma.setPosition(this.s.tc(2, 2).x, this.s.tc(2, 2).y);
      }
    } else if (!state.has('castle.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('hall_intro', () => state.set('castle.intro')));
    if (state.has('castle.monte') && state.has('castle.comte') && state.has('castle.smith')) state.set('castle.wings');
  }

  private lit(): void {
    const n = this.rig.flame.litCount;
    bus.emit('hint', `Tocha acesa (${n}/6).`);
    if (this.rig.flame.allLit) {
      state.set('castle.torches');
      sfx.success();
      const dogma = this.s.npcs.get('dogma');
      if (dogma) {
        dogma.def.patrol = undefined;
        dogma.route = [{ x: 2, y: 2 }];
      }
      state.unlockPage('iluminismo', 'Levei a Chama da Razão a seis tochas, desviando do Dogma que a apagava: razão e ciência, crítica ao absolutismo, liberdade, igualdade perante a lei, divisão dos poderes e soberania popular.');
      this.s.dialogue('torch_lit_all', () => state.save());
    }
  }

  onInteract(t: Interactable): boolean {
    return this.rig.interact(t.id);
  }

  update(): void {
    this.rig.update();
    const dogma = this.s.npcs.get('dogma');
    if (dogma && this.rig.flame.carrying && !state.has('castle.torches')) {
      const d = Phaser.Math.Distance.Between(dogma.x, dogma.y, this.s.player.x, this.s.player.y);
      if (d < 38 && this.s.time.now - this.lastBlow > 1500) {
        this.lastBlow = this.s.time.now;
        this.rig.extinguish();
        this.s.shake(150, 0.003);
        this.s.dialogue('dogma_blow');
      }
    }
    // escuridão com focos
    const cam = this.s.cameras.main;
    const lit = this.rig.flame.litCount;
    const alpha = state.has('castle.torches') ? 0.12 : 0.78 - lit * 0.1;
    this.dark.clear();
    this.dark.fill(0x02020a, alpha);
    this.dark.erase('spot', this.s.player.x - cam.scrollX - 90, this.s.player.y - cam.scrollY - 90);
    for (const t of TORCHES) {
      if (!this.rig.flame.isLit(t.id)) continue;
      const img = this.s.props.get(`torch:${t.id}`);
      if (img) this.dark.erase('spot_s', img.x - cam.scrollX - 45, img.y - 10 - cam.scrollY - 45);
    }
    const br = this.s.props.get('brazier');
    if (br) this.dark.erase('spot_s', br.x - cam.scrollX - 45, br.y - 8 - cam.scrollY - 45);
  }

  destroy(): void {
    this.rig.destroy();
    this.dark.destroy();
  }
}
registerController('castle_hall', (s) => new CastleHall(s));

// ============================================================== Montesquieu
class Montesquieu implements RoomController {
  private rig!: KeyRig;
  private hud!: Phaser.GameObjects.Text;
  private nextDecree = 0;
  private decreeUntil = 0;
  private separatedShown = false;
  constructor(private s: RoomScene) {}

  create(): void {
    this.rig = new KeyRig(this.s, () => this.changed());
    this.hud = hud(this.s, '');
    this.refresh();
    if (state.has('castle.monte')) {
      (['legislar', 'executar', 'julgar'] as const).forEach((k, i) => {
        this.s.props.get(`key:${k}`)?.setVisible(false);
        this.rig.keys.take(k);
        this.rig.keys.place((['A', 'B', 'C'] as const)[i]);
        const p = this.s.props.get(`ped:${['A', 'B', 'C'][i]}`)!;
        this.s.add.image(p.x - 6, p.y - 14, 'key').setDepth(p.y + 1);
      });
      this.separatedShown = true;
      this.refresh();
    } else if (!state.has('monte.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('monte_intro', () => state.set('monte.intro')));
  }

  private refresh(): void {
    const k = this.rig.keys;
    const where = (['A', 'B', 'C'] as const).map((p) => `${p}:${k.keysAt(p).length}`).join(' ');
    this.hud.setText(k.separated ? 'PODERES SEPARADOS · cada um vigia os outros dois' : `PODER CONCENTRADO · trono:${k.keysAt('trono').length} ${where} · decretos caindo`);
  }

  private changed(): void {
    this.refresh();
    if (this.rig.keys.separated && !this.separatedShown) {
      this.separatedShown = true;
      state.blockedDir = null;
      sfx.success();
      state.set('castle.monte');
      state.unlockPage('montesquieu', 'Tirei as três chaves (legislar, executar, julgar) da mão do rei de pedra e pus uma em cada pedestal: os decretos arbitrários pararam e os três poderes passaram a se vigiar.');
      this.s.dialogue('monte_separated', () => this.checkDone());
    } else if (!this.rig.keys.separated && this.separatedShown) {
      this.separatedShown = false;
    }
  }

  private checkDone(): void {
    const seen = LAW_TERRAINS.every((t) => state.has(`terr.${t.id}`));
    if (seen && state.has('castle.monte') && !state.has('monte.done')) {
      state.set('monte.done');
      state.addDid('montesquieu', 'Andei pelos três terrenos da sala e a mesma Lei do Sal virou três coisas diferentes: clima, economia e religião mudam o que uma lei faz.');
      this.s.dialogue('monte_done', () => state.save());
    }
  }

  onInteract(t: Interactable): boolean {
    if (t.id.startsWith('ped:') && !this.rig.keys.carrying() && this.rig.keys.keysAt(t.id.slice(4) as 'A' | 'B' | 'C').length && state.lensOn) {
      this.rig.takeBack(t.id.slice(4) as 'A' | 'B' | 'C');
      this.s.say(undefined, '(Você pegou a chave de volta.)');
      return true;
    }
    return this.rig.interact(t.id);
  }

  onEvent(name: string): void {
    if (name.startsWith('terr:')) {
      const id = name.slice(5);
      const t = LAW_TERRAINS.find((x) => x.id === id)!;
      if (state.has(`terr.${id}`)) return;
      state.set(`terr.${id}`);
      this.s.say(undefined, [`${t.name}: ${t.effect}`]);
      this.s.time.delayedCall(100, () => this.checkDone());
    }
  }

  update(time: number): void {
    this.rig.update();
    if (this.rig.keys.separated || state.has('castle.monte')) {
      state.blockedDir = null;
      return;
    }
    if (time > this.decreeUntil && state.blockedDir) {
      state.blockedDir = null;
      bus.emit('hint', 'O decreto perdeu a validade. Até o próximo.');
    }
    if (time > this.nextDecree && !this.s.blocking) {
      this.nextDecree = time + 7000;
      this.decreeUntil = time + 3200;
      const dirs: Dir[] = ['left', 'right', 'up', 'down'];
      const d = dirs[Math.floor(Math.random() * dirs.length)];
      state.blockedDir = d;
      const names: Record<Dir, string> = { left: 'esquerda', right: 'direita', up: 'cima', down: 'baixo' };
      sfx.hurt();
      this.s.shake(120, 0.003);
      bus.emit('toast', `DECRETO REAL: proibido andar para a ${names[d]} (3 s). Quem faz a lei também a executa e a julga.`, 'info');
    }
  }

  destroy(): void {
    state.blockedDir = null;
    this.rig.destroy();
    this.hud.destroy();
  }
}
registerController('castle_montesquieu', (s) => new Montesquieu(s));

// ==================================================================== Comte
class Comte implements RoomController {
  private states = new ThreeStates(COMTE_SUBJECTS.map((o) => o.id));
  private carriedOrb: Phaser.GameObjects.Image;
  private carriedScope: Phaser.GameObjects.Image;
  private hasOrb = false;
  private hasScope = false;
  private hud!: Phaser.GameObjects.Text;
  constructor(private s: RoomScene) {
    this.carriedOrb = s.add.image(0, 0, 'orb').setVisible(false).setDepth(30000);
    this.carriedScope = s.add.image(0, 0, 'scope').setVisible(false).setDepth(30000);
  }

  create(): void {
    this.hud = hud(this.s, '');
    if (state.has('comte.f1')) this.openDoor(10);
    if (state.has('comte.f2')) {
      this.openDoor(21);
      this.s.props.get('orb')?.setVisible(false);
      const p = this.s.props.get('orbped');
      if (p) this.s.add.image(p.x, p.y - 12, 'orb').setDepth(p.y + 1);
    }
    if (state.has('comte.f3')) {
      for (const o of COMTE_SUBJECTS) this.states.observe(o.id);
      this.hasScope = true;
    } else if (!state.has('comte.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('comte_intro', () => state.set('comte.intro')));
    this.refresh();
  }

  private openDoor(x: number): void {
    this.s.setTile(x, 8, T.doorOpen);
    sfx.door();
  }

  private refresh(): void {
    const f = state.has('comte.f3') ? 3 : state.has('comte.f2') ? 2 : state.has('comte.f1') ? 1 : 0;
    const names = ['', 'teológico', 'metafísico', 'positivo'];
    this.hud.setText(`TORRE DOS TRÊS ESTADOS · ${f}/3 portas · ${f ? 'última: estado ' + names[f] : 'reze no altar'}` + (this.hasScope ? ` · observados ${this.states.observedCount}/5` : ''));
  }

  onInteract(t: Interactable): boolean {
    switch (t.id) {
      case 'altar1':
        if (state.has('comte.f1')) this.s.dialogue('altar_again');
        else {
          this.states.pray(1);
          state.set('comte.f1');
          this.openDoor(10);
          this.s.dialogue('altar_pray', () => this.refresh());
        }
        return true;
      case 'orb':
        if (this.hasOrb) return true;
        this.hasOrb = true;
        this.s.props.get('orb')?.setVisible(false);
        sfx.pickup();
        this.s.dialogue('orb_take');
        return true;
      case 'orbped':
        if (state.has('comte.f2')) {
          this.s.say(undefined, '(A Essência repousa no pedestal. A porta à direita está aberta.)');
          return true;
        }
        if (!this.hasOrb) {
          this.s.say(undefined, '(Pedestal vazio. "Aqui repousa a Essência da Abertura.")');
          return true;
        }
        this.hasOrb = false;
        this.states.placeOrb(2);
        state.set('comte.f2');
        const p = this.s.props.get('orbped')!;
        this.s.add.image(p.x, p.y - 12, 'orb').setDepth(p.y + 1);
        this.openDoor(21);
        this.s.dialogue('orb_place', () => this.refresh());
        return true;
      case 'altar3':
        this.s.dialogue(this.hasOrb ? 'pos_orb' : 'pos_altar');
        return true;
      case 'scope':
        this.hasScope = true;
        state.set('comte.scope');
        this.s.removeProp('scope');
        sfx.pickup();
        this.s.dialogue('scope_take', () => this.refresh());
        return true;
    }
    if (COMTE_SUBJECTS.some((o) => o.id === t.id)) {
      const o = COMTE_SUBJECTS.find((x) => x.id === t.id)!;
      const npc = this.s.npcs.get(t.id)!;
      const unpause = () => (npc.paused = false);
      if (!this.hasScope) {
        this.s.say(o.name, 'Bom dia. Procurando o quê? A luneta está no canto da sala.', unpause);
        return true;
      }
      if (this.states.observe(o.id)) {
        npc.setBubble(o.fact);
        sfx.blip();
        this.refresh();
        if (this.states.isOpen(3)) {
          state.set('comte.f3');
          state.set('castle.comte');
          sfx.success();
          state.unlockPage('comte', 'Na Torre dos Três Estados, a primeira porta abriu por reza (teológico), a segunda por uma "essência" (metafísico) e a terceira só quando observei e medi as cinco pessoas: 3 em 5 acordam às 6 (positivo).');
          this.s.dialogue('pos_measured', () => {
            unpause();
            this.s.dialogue('comte_done', () => state.save());
          });
        } else this.s.say(undefined, `(Observado: ${o.name} ${o.fact}. ${this.states.observedCount}/5.)`, unpause);
      } else this.s.say(undefined, `(${o.name}: já observado — ${o.fact}.)`, unpause);
      return true;
    }
    return false;
  }

  update(): void {
    this.carriedOrb.setVisible(this.hasOrb).setPosition(this.s.player.x + 8, this.s.player.y - 12);
    this.carriedScope.setVisible(this.hasScope && !state.has('comte.f3')).setPosition(this.s.player.x - 9, this.s.player.y - 10);
  }
  destroy(): void {
    this.carriedOrb.destroy();
    this.carriedScope.destroy();
    this.hud.destroy();
  }
}
registerController('castle_comte', (s) => new Comte(s));

// ==================================================================== Smith
class Smith implements RoomController {
  private factory = new PinFactory(STATIONS, WORKERS.map((w) => w.id), TOLLS.map((t) => t.id), 120);
  private hud!: Phaser.GameObjects.Text;
  private acc = 0;
  private cartTimer = 0;
  private dividedShown = false;
  constructor(private s: RoomScene) {}

  create(): void {
    this.hud = hud(this.s, '');
    for (const st of STATIONS) {
      const img = this.s.props.get(`st:${st.id}`);
      if (img) label(this.s, img.x, img.y - 16, st.name, '#5a3a1acc', 70);
    }
    if (state.has('castle.smith')) {
      WORKERS.forEach((w, i) => this.assign(w.id, STATIONS[i].id, true));
      for (const t of TOLLS) {
        this.factory.openToll(t.id);
        this.s.removeProp(`toll:${t.id}`);
      }
      this.factory.gold = this.factory.target;
      this.dividedShown = true;
    } else if (!state.has('smith.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('smith_intro', () => state.set('smith.intro')));
    this.refresh();
  }

  private refresh(): void {
    const f = this.factory;
    const pct = Math.round((f.gold / f.target) * 100);
    this.hud.setText(`FÁBRICA · ${f.divided ? 'trabalho dividido' : 'cada um faz tudo'} · ${f.rate} alfinetes/hora · estrada ${f.tolls.filter((t) => f.isOpen(t)).length}/${f.tolls.length} aberta · baú ${pct}%`);
  }

  private assign(worker: string, station: string, silent = false): void {
    this.factory.assign(worker, station);
    const npc = this.s.npcs.get(worker);
    const st = STATIONS.find((x) => x.id === station)!;
    if (npc) {
      const n = WORKERS.filter((w) => this.factory.stationOf(w.id) === station).length;
      npc.route = [{ x: st.x + 1 + (n - 1), y: st.y + 2 }];
      npc.setBubble(st.name);
    }
    if (!silent) sfx.select();
    this.refresh();
    if (this.factory.divided && !this.dividedShown) {
      this.dividedShown = true;
      state.unlockPage('smith', 'Na Fábrica de Alfinetes, pus cada operário numa etapa: a produção saltou de um alfinete por hora para dezenas (divisão do trabalho).');
      this.s.time.delayedCall(800, () => this.s.dialogue('smith_divided'));
    }
  }

  onInteract(t: Interactable): boolean {
    if (t.id.startsWith('wk:')) {
      const w = WORKERS.find((x) => x.id === t.id)!;
      const npc = this.s.npcs.get(t.id)!;
      const unpause = () => (npc.paused = false);
      if (!state.lensOn) {
        this.s.say(w.name, ['Corto, afio, faço a cabeça, polo e embalo. Um alfinete por hora, com sorte.', '(Ligue a Engrenagem com X para combinar a etapa dele.)'], unpause);
        return true;
      }
      const cur = this.factory.stationOf(t.id);
      const steps: Dialogue = [
        { who: w.name, text: cur ? `Hoje eu só ${STATIONS.find((x) => x.id === cur)!.name.toLowerCase()}. Quer que eu mude?` : 'Que etapa eu faço?' },
        { choice: `O que ${w.name} vai fazer?`, options: STATIONS.map((st) => ({ label: st.name, event: `station:${t.id}:${st.id}` })) },
      ];
      bus.emit('dialogue:start', steps, unpause);
      return true;
    }
    if (t.id.startsWith('toll:')) {
      const id = t.id.slice(5);
      if (this.factory.openToll(id)) {
        disableProp(this.s, t.id);
        sfx.door();
        this.s.dialogue('toll_open', () => this.refresh());
      }
      return true;
    }
    if (t.id === 'chest') {
      this.s.say(undefined, this.factory.full ? '(Baú cheio: trabalho dividido e estrada aberta.)' : `(Baú da fábrica: ${Math.round((this.factory.gold / this.factory.target) * 100)}%.)`);
      return true;
    }
    return false;
  }

  onEvent(name: string): void {
    if (name.startsWith('station:')) {
      const parts = name.split(':'); // station:wk:N:etapa
      if (parts.length === 4) this.assign(`${parts[1]}:${parts[2]}`, parts[3]);
    }
  }

  update(_time: number, delta: number): void {
    if (state.has('castle.smith')) return;
    this.acc += delta;
    if (this.acc >= 1000) {
      this.acc -= 1000;
      const before = this.factory.gold;
      this.factory.tick(1);
      if (this.factory.gold !== before) this.refresh();
      if (this.factory.full) this.done();
    }
    if (this.factory.flow > 0) {
      this.cartTimer += delta;
      if (this.cartTimer > 2500) {
        this.cartTimer = 0;
        const cart = this.s.add.image(this.s.tc(28, 1).x, this.s.tc(28, 1).y, 'cart').setDepth(5000);
        this.s.tweens.add({ targets: cart, y: this.s.tc(28, 15).y, duration: 3500, onComplete: () => cart.destroy() });
      }
    }
  }

  private done(): void {
    state.set('castle.smith');
    sfx.success();
    state.addDid('smith', 'Abri os dois pedágios e as carroças passaram: o baú só encheu com trabalho dividido e livre circulação das mercadorias.');
    this.s.dialogue('smith_done', () => state.save());
  }

  destroy(): void {
    this.hud.destroy();
  }
}
registerController('castle_smith', (s) => new Smith(s));

// ===================================================================== Boss
class Absolutist implements RoomController {
  private rig!: KeyRig;
  private king?: Npc;
  private shots!: Phaser.Physics.Arcade.Group;
  private active = false;
  private hp = 4;
  private phase: 'edicts' | 'signing' = 'edicts';
  private phaseUntil = 0;
  private nextShot = 0;
  private vulnerableUntil = 0;
  private defeated = false;
  private hud!: Phaser.GameObjects.Text;
  private crowdIn = false;
  constructor(private s: RoomScene) {}

  create(): void {
    this.shots = this.s.physics.add.group({ maxSize: 40 });
    this.s.physics.add.collider(this.shots, this.s.layer, (shot) => (shot as Phaser.Physics.Arcade.Image).destroy());
    this.s.physics.add.overlap(this.s.player, this.shots, (_p, shot) => {
      const sh = shot as Phaser.Physics.Arcade.Image;
      if (this.s.player.hurt(sh.x, sh.y)) sh.destroy();
    });
    this.hud = hud(this.s, '');
    if (state.has('castle.boss')) {
      this.hud.setText('Salão do Absolutista — o povo mandou.');
      return;
    }
    this.king = this.s.spawnNpc({ type: 'npc', id: 'king', x: 14, y: 3, look: 'king', name: 'O Absolutista', facing: 'down', dialogue: 'abs_intro' });
    this.s.removeInteractable('king');
    (['legislar', 'executar', 'julgar'] as const).forEach((k, i) => {
      this.s.spawnProp({ type: 'prop', id: `key:${k}`, x: 11 + i * 3, y: 4, sprite: 'key', interact: 'key', dx: i === 1 ? 8 : 0 });
    });
    this.rig = new KeyRig(this.s, () => this.keysChanged());
    this.refresh();
    this.s.time.delayedCall(500, () => this.s.dialogue('abs_intro', () => this.start()));
  }

  private start(): void {
    this.active = true;
    this.setPhase('edicts');
  }

  private setPhase(p: 'edicts' | 'signing'): void {
    this.phase = p;
    this.phaseUntil = this.s.time.now + (p === 'edicts' ? 4500 : 3200);
    this.king?.setBubble(p === 'edicts' ? 'DECRETO!' : 'assinando...');
    this.king?.setTint(p === 'signing' ? 0xdddddd : 0xffffff);
  }

  private refresh(): void {
    const left = this.rig?.keys.keysAt('trono').length ?? 3;
    this.hud.setText(`O Absolutista  ${'♥'.repeat(this.hp)}${'♡'.repeat(4 - this.hp)} · chaves na mão dele: ${left}`);
  }

  private keysChanged(): void {
    this.refresh();
    const placedAll = (['A', 'B', 'C'] as const).every((p) => this.rig.keys.keysAt(p).length === 1);
    if (this.rig.keys.carrying() === null) {
      // chave acabou de ser colocada
      this.vulnerableUntil = this.s.time.now + 4000;
      this.king?.setBubble('Minha chave! Guardas!');
      this.king?.setTint(0x9999ff);
      bus.emit('hint', 'Ele perdeu um poder e cambaleou: ataque (A)!');
    }
    if (placedAll && !this.crowdIn) {
      this.crowdIn = true;
      this.vulnerableUntil = Number.MAX_SAFE_INTEGER;
      const looks = ['townA', 'townB', 'farmer', 'baker'];
      looks.forEach((lk, i) => {
        const n = this.s.spawnNpc({ type: 'npc', id: `crowd${i}`, x: 13 + (i % 2) * 2, y: 16, look: lk, name: 'Povo da Ágora', dialogue: 'walker_line', speed: 50 });
        n.route = [{ x: 10 + i * 3, y: 7 }];
        this.s.npcColliders.get(`crowd${i}`)?.destroy();
      });
      this.king?.setBubble('O povo... aqui dentro?');
      bus.emit('hint', 'Três poderes separados e o povo na sala: ele não tem mais nada. Termine (A).');
    }
  }

  private shoot(): void {
    if (!this.king || !this.active || this.defeated) return;
    const shot = this.shots.get(this.king.x, this.king.y, 'shot') as Phaser.Physics.Arcade.Image | null;
    if (!shot) return;
    shot.setActive(true).setVisible(true).setDepth(5000);
    const ang = Phaser.Math.Angle.Between(this.king.x, this.king.y, this.s.player.x, this.s.player.y);
    shot.setVelocity(Math.cos(ang) * 120, Math.sin(ang) * 120);
    this.s.time.delayedCall(4000, () => shot.destroy());
    sfx.swing();
  }

  onAttack(rect: Phaser.Geom.Rectangle): void {
    if (!this.king || this.defeated || this.s.time.now > this.vulnerableUntil) return;
    const kb = new Phaser.Geom.Rectangle(this.king.x - 10, this.king.y - 10, 20, 32);
    if (!Phaser.Geom.Intersects.RectangleToRectangle(rect, kb)) return;
    this.hp--;
    this.refresh();
    sfx.hit();
    this.s.shake(150, 0.004);
    this.king.setTint(0xff6666);
    this.s.time.delayedCall(120, () => this.king?.setTint(this.s.time.now < this.vulnerableUntil ? 0x9999ff : 0xffffff));
    if (this.vulnerableUntil !== Number.MAX_SAFE_INTEGER) this.vulnerableUntil = this.s.time.now;
    if (this.hp <= 0) this.defeat();
  }

  private defeat(): void {
    this.defeated = true;
    this.active = false;
    this.shots.clear(true, true);
    this.king?.setBubble(null);
    this.king?.clearTint();
    sfx.success();
    this.s.dialogue('abs_defeat', () => {
      state.set('castle.boss');
      state.addDid('iluminismo', 'Derrotei o Absolutista tirando uma a uma as chaves da mão dele e pondo o povo da Ágora na sala: sem as três chaves e sem o povo do lado dele, o rei não era nada (soberania popular).');
      if (this.king) this.s.tweens.add({ targets: this.king, alpha: 0, duration: 800, onComplete: () => this.s.removeNpc('king') });
    });
  }

  onInteract(t: Interactable): boolean {
    if (!this.rig) return false;
    if (t.id.startsWith('key:') && this.phase === 'edicts' && this.active && !this.crowdIn) {
      this.s.say(undefined, '(Ele está olhando para você. Espere ele se distrair assinando decretos.)');
      return true;
    }
    return this.rig.interact(t.id);
  }

  update(time: number): void {
    this.rig?.update();
    if (!this.active || this.defeated || !this.king) return;
    if (time > this.vulnerableUntil && this.vulnerableUntil !== Number.MAX_SAFE_INTEGER && this.king.tintTopLeft === 0x9999ff) this.king.clearTint();
    if (time > this.phaseUntil && !this.crowdIn) this.setPhase(this.phase === 'edicts' ? 'signing' : 'edicts');
    if (this.phase === 'edicts' && time > this.nextShot && !this.s.blocking && !this.crowdIn) {
      this.nextShot = time + 900;
      this.shoot();
    }
  }

  destroy(): void {
    this.rig?.destroy();
    this.hud.destroy();
  }
}
registerController('castle_boss', (s) => new Absolutist(s));

// ==================================================================== Sages
class CastleSage implements RoomController {
  private keys!: KeyRig;
  private flame!: FlameRig;
  private tollsOpen = new Set<string>();
  private hud!: Phaser.GameObjects.Text;
  constructor(private s: RoomScene) {}

  create(): void {
    this.keys = new KeyRig(this.s, () => this.changed());
    this.flame = new FlameRig(
      this.s,
      [
        { id: 's1', idea: 'Razão' },
        { id: 's2', idea: 'Liberdade' },
        { id: 's3', idea: 'Igualdade' },
      ],
      () => this.changed(),
    );
    for (const d of SAGE_DOORS) {
      label(this.s, d.x * TILE + TILE, 2 * TILE, d.label, '#2a3a5acc', 80);
    }
    this.hud = hud(this.s, '');
    this.refresh();
    if (state.has('castle.done')) {
      state.set('sage3.keys');
      state.set('sage3.torches');
      state.set('sage3.tolls');
    } else if (!state.has('sage3.intro')) this.s.time.delayedCall(500, () => this.s.dialogue('sage3_intro', () => state.set('sage3.intro')));
  }

  private refresh(): void {
    const k = this.keys.keys.separated ? '✓' : '…';
    const t = this.flame.flame.allLit ? '✓' : `${this.flame.flame.litCount}/3`;
    const c = this.tollsOpen.size === 2 ? '✓' : `${this.tollsOpen.size}/2`;
    this.hud.setText(`PROVA · 1776 poderes ${k} · 1789 luzes ${t} · 1789 derrama ${c}`);
  }

  private changed(): void {
    this.refresh();
    if (this.keys.keys.separated && !state.has('sage3.keys')) {
      state.set('sage3.keys');
      sfx.success();
      this.s.say('Montesquieu', 'Três poderes, três pedestais, uma Constituição. 1776: a porta se abriu.');
    }
    if (this.flame.flame.allLit && !state.has('sage3.torches')) {
      state.set('sage3.torches');
      sfx.success();
      this.s.say('Comte', 'Razão, liberdade, igualdade: o Antigo Regime caiu. 1789, Paris: a porta se abriu.');
    }
    if (this.tollsOpen.size === 2 && !state.has('sage3.tolls')) {
      state.set('sage3.tolls');
      sfx.success();
      this.s.say('Smith', 'Sem a derrama, o ouro e as ideias circulam. 1789, Vila Rica: a porta se abriu.');
    }
    if (state.has('sage3.keys') && state.has('sage3.torches') && state.has('sage3.tolls') && !state.has('castle.done')) {
      this.s.time.delayedCall(900, () => this.finish());
    }
  }

  private finish(): void {
    if (state.has('castle.done')) return;
    const text =
      'Você separou os três poderes em três pedestais (Montesquieu: nenhuma lei cai do céu quando legislar, executar e julgar se vigiam), acendeu razão, liberdade e igualdade contra a tradição e o absolutismo (Iluminismo) e abriu as cancelas da derrama para o trabalho e as mercadorias circularem (Smith: a riqueza vem do trabalho e cresce com a divisão dele e a livre circulação). Foi com essas ideias que vieram 1776, 1789 em Paris e 1789 em Vila Rica.';
    this.s.dialogue('sage3_done_pre', () => {
      this.s.say('Montesquieu', text, () => {
        state.setMine('iluminismo', text);
        state.addDid('iluminismo', 'Na Sala dos Três Sábios, abri as portas de 1776 e das duas de 1789 refazendo as três construções: poderes separados, luzes acesas e derrama sem cancelas.');
        state.set('castle.done');
        sfx.success();
        this.s.dialogue('sage3_done_post', () => state.save());
      });
    });
  }

  onInteract(t: Interactable): boolean {
    if (t.id.startsWith('toll:')) {
      const id = t.id.slice(5);
      if (!this.tollsOpen.has(id)) {
        this.tollsOpen.add(id);
        disableProp(this.s, t.id);
        sfx.door();
        this.s.say(undefined, '(Cancela aberta. As tropas e o ouro voltam a passar.)', () => this.changed());
      }
      return true;
    }
    if (t.id === 'montesquieu' || t.id === 'comte' || t.id === 'adam') {
      const npc = this.s.npcs.get(t.id)!;
      const unpause = () => (npc.paused = false);
      this.s.dialogue(state.has('castle.done') ? 'sage3_done_post' : 'sage3_intro', unpause);
      return true;
    }
    if (this.flame.interact(t.id)) return true;
    return this.keys.interact(t.id);
  }

  update(): void {
    this.keys.update();
    this.flame.update();
  }
  destroy(): void {
    this.keys.destroy();
    this.flame.destroy();
    this.hud.destroy();
  }
}
registerController('castle_sage', (s) => new CastleSage(s));

export const CASTLE_TILE = TILE;
export const CASTLE_H = GAME_H;
