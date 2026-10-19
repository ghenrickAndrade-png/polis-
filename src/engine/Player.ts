import Phaser from 'phaser';
import { DIR_VEC, PLAYER_SPEED, type Dir } from '../config';
import { input } from './input';
import { LOOKS, ensureCharacter } from './textures';
import { state } from './state';
import { sfx } from './sfx';

export class Player extends Phaser.Physics.Arcade.Sprite {
  facing: Dir = 'down';
  lookId = 'gray';
  frozen = false;
  invulnUntil = 0;
  attackUntil = 0;
  knockUntil = 0;
  private shadow: Phaser.GameObjects.Image;
  private slash: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, lookId: string) {
    ensureCharacter(scene, lookId, LOOKS[lookId] ?? LOOKS.gray);
    super(scene, x, y, `${lookId}_down_0`);
    this.lookId = lookId;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setSize(10, 8).setOffset(3, 8);
    this.setCollideWorldBounds(true);
    this.shadow = scene.add.image(x, y + 7, 'shadow').setDepth(0.5).setAlpha(0.6);
    this.slash = scene.add.image(x, y, 'slash').setVisible(false).setDepth(10000);
  }

  setLook(lookId: string): void {
    ensureCharacter(this.scene, lookId, LOOKS[lookId] ?? LOOKS.gray);
    this.lookId = lookId;
    this.setTexture(`${lookId}_${this.facing === 'left' ? 'side' : this.facing === 'right' ? 'side' : this.facing}_0`);
    this.setFlipX(this.facing === 'left');
  }

  private dirKey(): string {
    return this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
  }

  /** Ponto à frente do jogador usado para interagir. */
  interactPoint(dist = 14): { x: number; y: number } {
    const v = DIR_VEC[this.facing];
    return { x: this.x + v.x * dist, y: this.y + 4 + v.y * dist };
  }

  faceTowards(x: number, y: number): void {
    const dx = x - this.x;
    const dy = y - this.y;
    this.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    this.setTexture(`${this.lookId}_${this.dirKey()}_0`);
    this.setFlipX(this.facing === 'left');
  }

  attack(): boolean {
    const now = this.scene.time.now;
    if (now < this.attackUntil || this.frozen) return false;
    this.attackUntil = now + 220;
    const p = this.interactPoint(10);
    this.slash.setPosition(p.x, p.y - 4).setVisible(true).setAlpha(1);
    const angle = { down: 90, up: -90, left: 180, right: 0 }[this.facing];
    this.slash.setAngle(angle).setFlipY(this.facing === 'left');
    this.scene.tweens.add({ targets: this.slash, alpha: 0, duration: 200, onComplete: () => this.slash.setVisible(false) });
    sfx.swing();
    return true;
  }

  /** Retângulo da espada enquanto ataca (ou null). */
  slashRect(): Phaser.Geom.Rectangle | null {
    if (this.scene.time.now >= this.attackUntil) return null;
    const p = this.interactPoint(12);
    return new Phaser.Geom.Rectangle(p.x - 10, p.y - 12, 20, 22);
  }

  hurt(fromX: number, fromY: number, dmg = 1): boolean {
    const now = this.scene.time.now;
    if (now < this.invulnUntil || state.god) return false;
    this.invulnUntil = now + 1000;
    this.knockUntil = now + 180;
    const ang = Math.atan2(this.y - fromY, this.x - fromX);
    this.setVelocity(Math.cos(ang) * 160, Math.sin(ang) * 160);
    this.scene.tweens.add({ targets: this, alpha: 0.2, yoyo: true, repeat: 5, duration: 80, onComplete: () => this.setAlpha(1) });
    sfx.hurt();
    state.damage(dmg);
    return true;
  }

  override preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.shadow.setPosition(this.x, this.y + 7);
    this.setDepth(this.y);
    if (time < this.knockUntil) return;
    if (this.frozen) {
      this.setVelocity(0, 0);
      this.anims.stop();
      this.setTexture(`${this.lookId}_${this.dirKey()}_0`);
      return;
    }
    const a = input.axis();
    const bd = state.blockedDir;
    if (bd === 'left' && a.x < 0) a.x = 0;
    if (bd === 'right' && a.x > 0) a.x = 0;
    if (bd === 'up' && a.y < 0) a.y = 0;
    if (bd === 'down' && a.y > 0) a.y = 0;
    if (a.x !== 0 || a.y !== 0) {
      this.setVelocity(a.x * PLAYER_SPEED, a.y * PLAYER_SPEED);
      if (Math.abs(a.x) >= Math.abs(a.y)) this.facing = a.x > 0 ? 'right' : 'left';
      else this.facing = a.y > 0 ? 'down' : 'up';
      this.setFlipX(this.facing === 'left');
      const key = `${this.lookId}_walk_${this.dirKey()}`;
      if (this.anims.currentAnim?.key !== key || !this.anims.isPlaying) this.play(key, true);
    } else {
      this.setVelocity(0, 0);
      this.anims.stop();
      this.setTexture(`${this.lookId}_${this.dirKey()}_0`);
    }
  }

  override destroy(fromScene?: boolean): void {
    this.shadow?.destroy();
    this.slash?.destroy();
    super.destroy(fromScene);
  }
}
