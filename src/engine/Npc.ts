import Phaser from 'phaser';
import { FONT, TEXT_RES, TILE, type Dir } from '../config';
import type { NpcDef } from '../content/types';
import { LOOKS, ensureCharacter } from './textures';

export class Npc extends Phaser.Physics.Arcade.Sprite {
  def: NpcDef;
  lookId: string;
  facing: Dir;
  private waypoint = 0;
  private bubble?: Phaser.GameObjects.Text;
  private bubbleBg?: Phaser.GameObjects.Rectangle;
  private shadow?: Phaser.GameObjects.Image;
  /** quando verdadeiro, segue `followTarget` (companheiro) */
  followTarget: { x: number; y: number } | null = null;
  /** rota única (em tiles); ao terminar, fica parado */
  route: { x: number; y: number }[] | null = null;
  paused = false;
  /** congela todos os NPCs (diálogo, pausa, Caderno) */
  static freezeAll = false;
  private isChar: boolean;

  constructor(scene: Phaser.Scene, def: NpcDef) {
    const px = def.x * TILE + TILE / 2;
    const py = def.y * TILE + TILE / 2;
    const isChar = !def.sprite;
    if (isChar) ensureCharacter(scene, def.look, LOOKS[def.look] ?? LOOKS.townA);
    super(scene, px, py, isChar ? `${def.look}_down_0` : def.sprite!);
    this.def = def;
    this.isChar = isChar;
    this.lookId = def.look;
    this.facing = def.facing ?? 'down';
    scene.add.existing(this);
    scene.physics.add.existing(this);
    if (isChar) {
      this.setSize(10, 8).setOffset(3, 8);
      this.shadow = scene.add.image(px, py + 7, 'shadow').setAlpha(0.5).setDepth(0.5);
      this.applyFacing();
    } else {
      this.setSize(this.width, this.height);
      if (def.anim) this.play(def.anim);
    }
    this.setImmovable(true);
    (this.body as Phaser.Physics.Arcade.Body).pushable = false;
    if (def.bubble) this.setBubble(def.bubble);
  }

  get npcName(): string {
    return this.def.name;
  }

  private dirKey(): string {
    return this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
  }

  private applyFacing(): void {
    if (!this.isChar) return;
    this.setTexture(`${this.lookId}_${this.dirKey()}_0`);
    this.setFlipX(this.facing === 'left');
  }

  faceTowards(x: number, y: number): void {
    const dx = x - this.x;
    const dy = y - this.y;
    this.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    this.anims.stop();
    this.applyFacing();
  }

  setBubble(text: string | null): void {
    if (!text) {
      this.bubble?.destroy();
      this.bubbleBg?.destroy();
      this.bubble = undefined;
      this.bubbleBg = undefined;
      return;
    }
    if (!this.bubble) {
      this.bubbleBg = this.scene.add.rectangle(this.x, this.y - 16, 10, 10, 0xffffff, 0.92).setStrokeStyle(1, 0x1a1a22).setDepth(20000);
      this.bubble = this.scene.add
        .text(this.x, this.y - 16, '', { fontFamily: FONT, fontSize: '7px', color: '#1a1a22', align: 'center', wordWrap: { width: 70 } })
        .setOrigin(0.5)
        .setResolution(TEXT_RES)
        .setDepth(20001);
    }
    this.bubble.setText(text);
    this.bubbleBg!.setSize(this.bubble.width + 6, this.bubble.height + 4);
  }

  setBubbleVisible(v: boolean): void {
    this.bubble?.setVisible(v);
    this.bubbleBg?.setVisible(v);
  }

  override preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.setDepth(this.y);
    this.shadow?.setPosition(this.x, this.y + 7);
    if (this.bubble) {
      this.bubble.setPosition(Math.round(this.x), Math.round(this.y - 20));
      this.bubbleBg?.setPosition(Math.round(this.x), Math.round(this.y - 20));
    }
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.paused || Npc.freezeAll) {
      body.setVelocity(0, 0);
      if (this.isChar) {
        this.anims.stop();
        this.applyFacing();
      }
      return;
    }
    const speed = this.def.speed ?? 40;
    let target: { x: number; y: number } | null = null;
    if (this.route) {
      if (this.route.length === 0) this.route = null;
      else {
        const wp = this.route[0];
        const tx = wp.x * TILE + TILE / 2;
        const ty = wp.y * TILE + TILE / 2;
        if (Phaser.Math.Distance.Between(this.x, this.y, tx, ty) < 3) this.route.shift();
        else target = { x: tx, y: ty };
      }
    } else if (this.followTarget) {
      const d = Phaser.Math.Distance.Between(this.x, this.y, this.followTarget.x, this.followTarget.y);
      if (d > 22) target = { x: this.followTarget.x, y: this.followTarget.y };
    } else if (this.def.patrol && this.def.patrol.length > 0) {
      const wp = this.def.patrol[this.waypoint];
      const tx = wp.x * TILE + TILE / 2;
      const ty = wp.y * TILE + TILE / 2;
      if (Phaser.Math.Distance.Between(this.x, this.y, tx, ty) < 3) {
        this.waypoint = (this.waypoint + 1) % this.def.patrol.length;
      } else target = { x: tx, y: ty };
    }
    if (target) {
      const ang = Math.atan2(target.y - this.y, target.x - this.x);
      body.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
      if (this.isChar) {
        const vx = body.velocity.x;
        const vy = body.velocity.y;
        if (Math.abs(vx) >= Math.abs(vy)) this.facing = vx > 0 ? 'right' : 'left';
        else this.facing = vy > 0 ? 'down' : 'up';
        this.setFlipX(this.facing === 'left');
        const key = `${this.lookId}_walk_${this.dirKey()}`;
        if (this.anims.currentAnim?.key !== key || !this.anims.isPlaying) this.play(key, true);
      }
    } else {
      body.setVelocity(0, 0);
      if (this.isChar && this.anims.isPlaying && this.anims.currentAnim?.key.includes('walk')) {
        this.anims.stop();
        this.applyFacing();
      }
    }
  }

  override destroy(fromScene?: boolean): void {
    this.shadow?.destroy();
    this.bubble?.destroy();
    this.bubbleBg?.destroy();
    super.destroy(fromScene);
  }
}
