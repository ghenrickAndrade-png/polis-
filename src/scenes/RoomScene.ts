import Phaser from 'phaser';
import { DIR_VEC, FONT, GAME_H, GAME_W, TEXT_RES, TILE, type Dir } from '../config';
import type { DoorDef, EntityDef, NpcDef, PropDef, RoomDef, TriggerDef } from '../content/types';
import { ROOMS } from '../content/rooms';
import { DIALOGUES } from '../content/dialogues';
import { bus } from '../engine/bus';
import { input } from '../engine/input';
import { activeItem, ITEM_NAMES } from '../engine/items';
import { Npc } from '../engine/Npc';
import { Player } from '../engine/Player';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { LEGEND, SOLID_TILES, T } from '../engine/textures';
import { getController, type Interactable, type RoomController } from '../puzzles/registry';
import type { UIScene } from './UIScene';

interface DoorRt {
  def: DoorDef;
  zone: Phaser.GameObjects.Zone;
  open: boolean;
  /** encostando neste frame / no frame anterior: a porta só dispara ao ENTRAR nela */
  touching?: boolean;
  wasTouching?: boolean;
}

export class RoomScene extends Phaser.Scene {
  room!: RoomDef;
  roomId = 'island';
  spawnId = 'start';
  player!: Player;
  map!: Phaser.Tilemaps.Tilemap;
  layer!: Phaser.Tilemaps.TilemapLayer;
  npcs = new Map<string, Npc>();
  props = new Map<string, Phaser.GameObjects.Image>();
  doors: DoorRt[] = [];
  interactables: Interactable[] = [];
  controller: RoomController | null = null;
  solids!: Phaser.Physics.Arcade.StaticGroup;
  npcColliders = new Map<string, Phaser.Physics.Arcade.Collider>();
  private transitioning = false;
  private lensRT!: Phaser.GameObjects.RenderTexture;
  private prompt!: Phaser.GameObjects.Text;
  private promptTarget: Interactable | null = null;
  private triggersFired = new Set<string>();
  private busHandlers: { ev: string; fn: (...a: never[]) => void }[] = [];
  elapsed = 0;

  constructor() {
    super({ key: 'Room' });
  }

  init(data: { roomId?: string; spawn?: string }): void {
    this.roomId = data.roomId ?? state.room;
    this.spawnId = data.spawn ?? state.spawn;
  }

  get ui(): UIScene {
    return this.scene.get('UI') as UIScene;
  }

  get blocking(): boolean {
    const ui = this.ui;
    return !!ui && ui.blocking;
  }

  create(): void {
    const room = ROOMS[this.roomId];
    if (!room) throw new Error(`sala não encontrada: ${this.roomId}`);
    this.room = room;
    this.npcs.clear();
    this.props.clear();
    this.doors = [];
    this.interactables = [];
    this.transitioning = false;
    this.promptTarget = null;
    this.elapsed = 0;
    state.room = this.roomId;
    state.spawn = this.spawnId;
    state.lensOn = false;
    state.blockedDir = null;

    this.cameras.main.setBackgroundColor(room.bg ?? '#0b0b14');
    this.buildMap();
    this.solids = this.physics.add.staticGroup();
    for (const t of this.pendingTrees) {
      this.spawnProp({ type: 'prop', id: `tree_${t.x}_${t.y}`, x: t.x, y: t.y, sprite: 'tree', solid: true, dy: 2 });
    }
    this.pendingTrees = [];

    const sp = room.spawns[this.spawnId] ?? room.spawns.start ?? Object.values(room.spawns)[0];
    this.player = new Player(this, sp.x * TILE + TILE / 2, sp.y * TILE + TILE / 2 - 2, state.look);
    this.player.facing = sp.face ?? 'down';
    this.player.faceTowards(this.player.x + (sp.face === 'left' ? -1 : sp.face === 'right' ? 1 : 0), this.player.y + (sp.face === 'up' ? -1 : 1));
    this.physics.add.collider(this.player, this.layer);
    this.physics.add.collider(this.player, this.solids);

    for (const e of room.entities) this.spawnEntity(e);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    cam.startFollow(this.player, true, 0.18, 0.18);
    cam.setRoundPixels(true);
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    this.lensRT = this.add.renderTexture(0, 0, GAME_W, GAME_H).setOrigin(0).setScrollFactor(0).setDepth(40000).setVisible(false).setAlpha(0);
    this.prompt = this.add
      .text(0, 0, '', { fontFamily: FONT, fontSize: '7px', color: '#ffffff', backgroundColor: '#1a1a22cc', padding: { x: 3, y: 1 } })
      .setOrigin(0.5, 1)
      .setResolution(TEXT_RES)
      .setDepth(30000)
      .setVisible(false);

    this.on('flag', (f: string) => {
      this.refreshDoors(true);
      this.controller?.onFlag?.(f);
    });
    this.on('item', () => this.refreshDoors(true));
    this.on('dialogue:event', (name: string) => this.controller?.onEvent?.(name));
    this.on('player:died', () => this.onDied());
    this.on('go', (roomId: string, spawn: string) => this.goTo(roomId, spawn));
    this.on('go:title', () => this.toTitle());
    this.on('debug:tp', (x: number, y: number, face?: Dir) => {
      this.player.setPosition(x * TILE + TILE / 2, y * TILE + TILE / 2 - 2);
      if (face) this.player.faceTowards(this.player.x + DIR_VEC[face].x, this.player.y + DIR_VEC[face].y);
    });

    const factory = room.controller ? getController(room.controller) : undefined;
    this.controller = factory ? factory(this) : null;
    this.controller?.create();
    this.refreshDoors(false);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    bus.emit('room:enter', room.name);
    bus.emit('fade', false, 350);
    if (room.autosave !== false && !state.debug) state.save();
  }

  private on(ev: string, fn: (...a: never[]) => void): void {
    bus.on(ev, fn);
    this.busHandlers.push({ ev, fn });
  }

  private cleanup(): void {
    for (const h of this.busHandlers) bus.off(h.ev, h.fn);
    this.busHandlers = [];
    this.controller?.destroy();
    this.controller = null;
  }

  // ------------------------------------------------------------------ Mapa
  private buildMap(): void {
    const grid = this.room.grid;
    const h = grid.length;
    const w = Math.max(...grid.map((r) => r.length));
    const data: number[][] = [];
    const trees: { x: number; y: number }[] = [];
    for (let y = 0; y < h; y++) {
      const row: number[] = [];
      for (let x = 0; x < w; x++) {
        const ch = grid[y][x] ?? ' ';
        const idx = LEGEND[ch] ?? T.void;
        row.push(idx);
        if (ch === 't') trees.push({ x, y });
      }
      data.push(row);
    }
    this.map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = this.map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0)!;
    this.layer = this.map.createLayer(0, tileset, 0, 0)!;
    this.layer.setCollision(SOLID_TILES);
    this.layer.setDepth(0);
    this.pendingTrees = trees;
  }
  private pendingTrees: { x: number; y: number }[] = [];

  setTile(x: number, y: number, idx: number): void {
    this.layer.putTileAt(idx, x, y);
    const t = this.layer.getTileAt(x, y);
    if (t) {
      const solid = SOLID_TILES.includes(idx);
      t.setCollision(solid, solid, solid, solid);
    }
  }

  tileAt(x: number, y: number): number {
    return this.layer.getTileAt(x, y)?.index ?? -1;
  }

  // ------------------------------------------------------------ Entidades
  private visible(e: { if?: string; unless?: string }): boolean {
    if (e.if && !state.has(e.if)) return false;
    if (e.unless && state.has(e.unless)) return false;
    return true;
  }

  spawnEntity(e: EntityDef): void {
    switch (e.type) {
      case 'npc':
        if (this.visible(e)) this.spawnNpc(e);
        break;
      case 'door':
        this.spawnDoor(e);
        break;
      case 'sign': {
        const img = this.add.image(e.x * TILE + TILE / 2, e.y * TILE + TILE, e.sprite ?? 'sign').setOrigin(0.5, 1);
        img.setDepth(img.y);
        const body = this.solids.create(e.x * TILE + TILE / 2, e.y * TILE + TILE / 2, 'px') as Phaser.Physics.Arcade.Image;
        body.setVisible(false).setDisplaySize(12, 10).refreshBody();
        this.props.set(e.id, img);
        this.interactables.push({ id: e.id, kind: 'sign', obj: img, interact: () => this.say(undefined, e.text) });
        break;
      }
      case 'item': {
        if (state.has(`item.${e.id}`)) break;
        const img = this.add.image(e.x * TILE + TILE / 2, e.y * TILE + TILE / 2, e.sprite).setDepth(e.y * TILE + 4);
        this.tweens.add({ targets: img, y: img.y - 3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.props.set(e.id, img);
        this.interactables.push({
          id: e.id,
          kind: 'item',
          obj: img,
          radius: 26,
          interact: () => {
            state.set(`item.${e.id}`);
            state.give(e.item);
            img.destroy();
            this.removeInteractable(e.id);
            sfx.pickup();
            this.say(undefined, [`Você pegou: ${e.name}.`, e.hint], () => {
              if (e.page) state.unlockPage(e.page, e.did);
            });
          },
        });
        break;
      }
      case 'trigger':
        this.spawnTrigger(e);
        break;
      case 'prop':
        if (this.visible(e)) this.spawnProp(e);
        break;
    }
  }

  spawnNpc(def: NpcDef): Npc {
    const npc = new Npc(this, def);
    this.npcs.set(def.id, npc);
    const col = this.physics.add.collider(this.player, npc);
    this.npcColliders.set(def.id, col);
    this.interactables.push({
      id: def.id,
      kind: 'npc',
      obj: npc,
      radius: 24,
      interact: () => this.talkTo(npc),
    });
    return npc;
  }

  removeNpc(id: string): void {
    const npc = this.npcs.get(id);
    if (!npc) return;
    this.npcColliders.get(id)?.destroy();
    this.npcColliders.delete(id);
    npc.destroy();
    this.npcs.delete(id);
    this.removeInteractable(id);
  }

  spawnProp(def: PropDef): Phaser.GameObjects.Image {
    const x = def.x * TILE + TILE / 2 + (def.dx ?? 0);
    const y = def.y * TILE + TILE + (def.dy ?? 0);
    let img: Phaser.GameObjects.Image;
    if (def.solid) {
      const s = this.solids.create(x, y, def.sprite) as Phaser.Physics.Arcade.Image;
      s.setOrigin(0.5, 1);
      s.refreshBody();
      const body = s.body as Phaser.Physics.Arcade.StaticBody;
      const bw = def.bodyW ?? Math.min(12, s.width - 2);
      const bh = def.bodyH ?? 8;
      body.setSize(bw, bh);
      body.setOffset((s.width - bw) / 2, s.height - bh);
      img = s;
    } else {
      img = this.add.image(x, y, def.sprite).setOrigin(0.5, 1);
    }
    img.setDepth(y + (def.depthOffset ?? 0));
    this.props.set(def.id, img);
    if (def.interact || def.label) {
      this.interactables.push({
        id: def.id,
        kind: 'prop',
        obj: img,
        radius: def.radius ?? (img.height > 20 ? 34 : 26),
        interact: () => {
          const handled = def.interact ? this.controller?.onInteract?.(this.findInteractable(def.id)!) : false;
          if (!handled && def.label) this.say(undefined, [def.label]);
        },
      });
    }
    return img;
  }

  removeProp(id: string): void {
    const p = this.props.get(id);
    if (!p) return;
    p.destroy();
    this.props.delete(id);
    this.removeInteractable(id);
  }

  findInteractable(id: string): Interactable | undefined {
    return this.interactables.find((i) => i.id === id);
  }

  removeInteractable(id: string): void {
    this.interactables = this.interactables.filter((i) => i.id !== id);
    if (this.promptTarget?.id === id) this.promptTarget = null;
  }

  addInteractable(i: Interactable): void {
    this.interactables.push(i);
  }

  private spawnDoor(def: DoorDef): void {
    const w = (def.w ?? 1) * TILE;
    const h = (def.h ?? 1) * TILE;
    const zone = this.add.zone(def.x * TILE, def.y * TILE, w, h).setOrigin(0);
    this.physics.add.existing(zone, true);
    const rt: DoorRt = { def, zone, open: false };
    this.doors.push(rt);
    this.physics.add.overlap(this.player, zone, () => this.onDoorOverlap(rt));
    this.applyDoorState(rt, false);
  }

  private doorIsOpen(def: DoorDef): boolean {
    return !def.requires || state.has(def.requires);
  }

  private applyDoorState(rt: DoorRt, animate: boolean): void {
    const open = this.doorIsOpen(rt.def);
    rt.open = open;
    if (rt.def.open) return; // passagem sem tile de porta
    const idx = open ? T.doorOpen : T.doorClosed;
    const wasIdx = this.tileAt(rt.def.x, rt.def.y);
    for (let dx = 0; dx < (rt.def.w ?? 1); dx++) {
      for (let dy = 0; dy < (rt.def.h ?? 1); dy++) this.setTile(rt.def.x + dx, rt.def.y + dy, idx);
    }
    if (animate && open && wasIdx === T.doorClosed) {
      sfx.door();
      this.cameras.main.flash(120, 255, 255, 255, false);
    }
  }

  refreshDoors(animate: boolean): void {
    for (const d of this.doors) {
      const was = d.open;
      this.applyDoorState(d, animate);
      if (animate && !was && d.open && d.def.lockedText) bus.emit('hint', 'Uma porta se abriu.');
    }
  }

  private onDoorOverlap(rt: DoorRt): void {
    rt.touching = true;
  }

  /** Portas disparam só na borda (fora → dentro) e depois do fade de entrada: quem chega segurando a seta não volta. */
  private updateDoors(): void {
    for (const rt of this.doors) {
      const enter = rt.touching && !rt.wasTouching;
      rt.wasTouching = !!rt.touching;
      rt.touching = false;
      if (!enter || this.transitioning || this.blocking || this.elapsed < 350) continue;
      if (!rt.open) {
        if (rt.def.lockedText && !this.lockedShownAt.has(rt.def.id)) {
          this.lockedShownAt.add(rt.def.id);
          this.say(undefined, [rt.def.lockedText]);
        }
        continue;
      }
      this.goTo(rt.def.to, rt.def.spawn);
    }
  }
  private lockedShownAt = new Set<string>();

  private spawnTrigger(def: TriggerDef): void {
    const zone = this.add.zone(def.x * TILE, def.y * TILE, def.w * TILE, def.h * TILE).setOrigin(0);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player, zone, () => {
      if (this.blocking || this.transitioning) return;
      if (!this.visible(def)) return;
      const key = `trig.${this.roomId}.${def.id}`;
      if (def.once && (state.has(key) || this.triggersFired.has(key))) return;
      this.triggersFired.add(key);
      if (def.once) state.set(key);
      this.controller?.onEvent?.(def.event);
    });
  }

  // --------------------------------------------------------------- Ações
  say(who: string | undefined, lines: string | string[], done?: () => void): void {
    const arr = Array.isArray(lines) ? lines : [lines];
    bus.emit(
      'dialogue:start',
      arr.map((text) => ({ who, text })),
      done,
    );
  }

  dialogue(id: string, done?: () => void): void {
    if (!DIALOGUES[id]) {
      console.warn('diálogo ausente', id);
      done?.();
      return;
    }
    bus.emit('dialogue:start', id, done);
  }

  talkTo(npc: Npc): void {
    npc.paused = true;
    npc.faceTowards(this.player.x, this.player.y);
    this.player.faceTowards(npc.x, npc.y);
    const handled = this.controller?.onInteract?.(this.findInteractable(npc.def.id)!);
    if (handled) {
      // o controlador decide quando o NPC volta a andar
      return;
    }
    const d = npc.def.dialogue;
    let id: string | undefined;
    if (typeof d === 'string') id = d;
    else {
      for (const ref of d) {
        if (ref.if && !state.has(ref.if)) continue;
        if (ref.unless && state.has(ref.unless)) continue;
        id = ref.id;
        break;
      }
    }
    if (!id) {
      npc.paused = false;
      return;
    }
    this.dialogue(id, () => {
      npc.paused = false;
    });
  }

  goTo(roomId: string, spawn: string): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.player.frozen = true;
    sfx.door();
    bus.emit('fade', true, 280, () => {
      this.scene.restart({ roomId, spawn });
    });
  }

  toTitle(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    bus.emit('fade', true, 300, () => {
      this.scene.stop('UI');
      this.scene.start('Title');
    });
  }

  private onDied(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.player.frozen = true;
    bus.emit('fade', true, 600, () => {
      state.heal(true);
      bus.emit('toast', 'Você acordou na entrada da sala. Respira e tenta de novo.', 'info');
      this.scene.restart({ roomId: this.roomId, spawn: this.spawnId });
    });
  }

  shake(ms = 200, intensity = 0.004): void {
    this.cameras.main.shake(ms, intensity);
  }

  /** Posição em pixels do centro de um tile. */
  tc(x: number, y: number): { x: number; y: number } {
    return { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
  }

  setLens(on: boolean): void {
    state.lensOn = on;
    this.tweens.killTweensOf(this.lensRT);
    if (on) this.lensRT.setVisible(true);
    this.tweens.add({ targets: this.lensRT, alpha: on ? 1 : 0, duration: 300, onComplete: () => this.lensRT.setVisible(on) });
    this.ui?.refreshItem();
    this.controller?.onLens?.(on);
    const it = activeItem(this.roomId);
    const item = it ? ITEM_NAMES[it] : 'Item';
    const onText = it === 'crystal' ? 'ligado: você vê o MAPA (macro). Leia os pilares; as pessoas viram pontos.' : 'ligada: olhe e interaja com as pessoas e os objetos.';
    const offText = it === 'crystal' ? 'desligado: você está na RUA (micro). Fale com as pessoas.' : 'desligada.';
    bus.emit('hint', on ? `${item} ${onText}` : `${item} ${offText}`);
    sfx.select();
  }

  // --------------------------------------------------------------- Update
  private drawLens(): void {
    if (!this.lensRT.visible) return;
    const cam = this.cameras.main;
    const rt = this.lensRT;
    rt.clear();
    if (activeItem(this.roomId) === 'crystal') {
      // visão de MAPA: a sala inteira fica azulada, sem foco — você vê o padrão, não as pessoas
      rt.fill(0x102050, 0.3);
      return;
    }
    rt.fill(0x0c1230, 0.42);
    const sx = this.player.x - cam.scrollX;
    const sy = this.player.y - cam.scrollY;
    rt.erase('spot', sx - 90, sy - 90);
  }

  override update(time: number, delta: number): void {
    this.elapsed += delta;
    state.playtimeMs += delta;
    this.drawLens();
    this.updateDoors();
    const blocked = this.blocking || this.transitioning;
    this.player.frozen = blocked;
    Npc.freezeAll = blocked;
    this.controller?.update(time, delta);
    if (blocked) {
      this.prompt.setVisible(false);
      return;
    }
    // alvo de interação
    const target = this.nearestInteractable();
    this.promptTarget = target;
    if (target) {
      this.prompt.setText(target.kind === 'npc' ? 'A · falar' : 'A · interagir');
      // acima do alvo; se o alvo está logo abaixo do jogador (o rótulo cobriria a cabeça dele), vai para o lado do alvo
      const above = target.obj.y - 22;
      const side = above >= this.player.y - 14;
      const px = side ? target.obj.x + 14 + this.prompt.width / 2 : target.obj.x;
      const py = side ? target.obj.y - 4 : above;
      this.prompt.setPosition(Math.round(px), Math.round(py)).setVisible(true);
    } else this.prompt.setVisible(false);

    if (input.justDown('A')) {
      input.consume('A');
      if (target) target.interact();
      else if (this.player.attack()) {
        const r = this.player.slashRect();
        if (r) this.controller?.onAttack?.(r);
      }
    }
    if (input.justDown('B')) {
      input.consume('B');
      if (activeItem(this.roomId)) this.setLens(!state.lensOn);
      else bus.emit('hint', 'Você ainda não tem um item.');
    }
    if (input.justDown('DEBUG') && state.debug) {
      bus.emit('toast', `sala ${this.roomId} · (${Math.floor(this.player.x / TILE)}, ${Math.floor(this.player.y / TILE)})`);
    }
  }

  private nearestInteractable(): Interactable | null {
    const p = this.player.interactPoint(12);
    const f = DIR_VEC[this.player.facing];
    let best: Interactable | null = null;
    let bestD = Infinity;
    for (const i of this.interactables) {
      if (i.enabled && !i.enabled()) continue;
      const isProp = i.kind === 'prop' || i.kind === 'sign';
      const h = isProp ? ((i.obj as Phaser.GameObjects.Image).displayHeight ?? 16) : 0;
      const oy = i.obj.y - (isProp ? Math.min(12, h / 2) : 0);
      // só o que está à frente do jogador (meio-plano da direção em que ele olha)
      if ((i.obj.x - this.player.x) * f.x + (oy - this.player.y) * f.y < -6) continue;
      const d = Phaser.Math.Distance.Between(p.x, p.y, i.obj.x, oy);
      const r = i.radius ?? (isProp ? 26 : 16);
      if (d < r && d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  faceDir(dir: Dir): void {
    this.player.facing = dir;
  }
}
