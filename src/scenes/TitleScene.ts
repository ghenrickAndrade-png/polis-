import Phaser from 'phaser';
import { FONT, GAME_H, GAME_W, TEXT_RES } from '../config';
import { input } from '../engine/input';
import { state } from '../engine/state';
import { sfx } from '../engine/sfx';
import { openResumao } from '../engine/resumao';

export class TitleScene extends Phaser.Scene {
  private idx = 0;
  private items: Phaser.GameObjects.Text[] = [];
  private options: { label: string; run: () => void }[] = [];

  constructor() {
    super({ key: 'Title' });
  }

  create(): void {
    input.bind(this);
    this.cameras.main.setBackgroundColor('#0b0b14');
    // fundo: faixa de "cidade" simples
    const g = this.add.graphics();
    const base = GAME_H - 34;
    g.fillStyle(0x1a1a2e).fillRect(0, base - 60, GAME_W, 60);
    const r = (n: number) => ((n * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 28; i++) {
      const w = 10 + Math.floor(r(i) * 18);
      const h = 14 + Math.floor(r(i + 7) * 34);
      const x = i * 17;
      g.fillStyle(0x24243a).fillRect(x, base - h, w, h);
      for (let wy = 0; wy < h - 6; wy += 7) {
        for (let wx = 2; wx < w - 3; wx += 5) if (r(i * 31 + wy + wx) > 0.55) g.fillStyle(0xe6c45a, 0.8).fillRect(x + wx, base - h + wy + 3, 2, 3);
      }
    }
    g.fillStyle(0x3b7dd8).fillRect(0, base, GAME_W, 34);
    this.add.image(GAME_W / 2 - 150, GAME_H - 18, 'raft').setScale(1.2);

    const title = this.add
      .text(GAME_W / 2, 58, 'PÓLIS', { fontFamily: FONT, fontSize: '34px', color: '#f4ecd8', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setResolution(TEXT_RES);
    title.setShadow(2, 2, '#8b5cf6', 0, true, true);
    this.add
      .text(GAME_W / 2, 84, 'um jogo para ver a sociedade', { fontFamily: FONT, fontSize: '9px', color: '#c9b99a' })
      .setOrigin(0.5)
      .setResolution(TEXT_RES);
    this.add
      .text(GAME_W / 2, 98, 'Sociologia · 2º ano do ensino médio · págs. 12–51', { fontFamily: FONT, fontSize: '7px', color: '#8a7a5a' })
      .setOrigin(0.5)
      .setResolution(TEXT_RES);

    this.options = [];
    if (state.hasSave()) this.options.push({ label: 'Continuar', run: () => this.continueGame() });
    this.options.push({ label: 'Novo jogo', run: () => this.newGame() });
    this.options.push({ label: 'Resumão (Caderno para imprimir)', run: () => this.resumao() });
    this.options.push({ label: `Som: ${state.soundOn ? 'ligado' : 'desligado'}`, run: () => this.toggleSound() });

    this.items = this.options.map((o, i) =>
      this.add
        .text(GAME_W / 2, 122 + i * 15, o.label, { fontFamily: FONT, fontSize: '10px', color: '#f4ecd8' })
        .setOrigin(0.5)
        .setResolution(TEXT_RES)
        .setInteractive()
        .on('pointerdown', () => {
          this.idx = i;
          this.pick();
        }),
    );
    this.render();
    this.add
      .text(GAME_W / 2, GAME_H - 8, 'Setas/WASD mover · Z interagir · X item · C Caderno · Esc pausa', { fontFamily: FONT, fontSize: '7px', color: '#c9b99a' })
      .setOrigin(0.5, 1)
      .setResolution(TEXT_RES);
    this.cameras.main.fadeIn(300);
  }

  private render(): void {
    this.items.forEach((t, i) => {
      t.setText((i === this.idx ? '▶ ' : '') + this.options[i].label);
      t.setColor(i === this.idx ? '#e6c45a' : '#f4ecd8');
    });
  }

  private pick(): void {
    sfx.select();
    this.options[this.idx].run();
  }

  private toggleSound(): void {
    state.soundOn = !state.soundOn;
    this.options[this.options.length - 1].label = `Som: ${state.soundOn ? 'ligado' : 'desligado'}`;
    this.render();
  }

  private resumao(): void {
    if (!state.hasSave()) {
      state.reset();
    } else state.load();
    openResumao();
  }

  private newGame(): void {
    state.reset();
    this.startGame('island', 'start');
  }

  private continueGame(): void {
    if (!state.load()) {
      this.newGame();
      return;
    }
    this.startGame(state.room, state.spawn);
  }

  private startGame(room: string, spawn: string): void {
    this.cameras.main.fadeOut(250);
    this.time.delayedCall(260, () => {
      this.scene.start('Room', { roomId: room, spawn });
      this.scene.launch('UI');
    });
  }

  override update(): void {
    if (input.justDown('UP')) {
      this.idx = (this.idx + this.options.length - 1) % this.options.length;
      this.render();
    } else if (input.justDown('DOWN')) {
      this.idx = (this.idx + 1) % this.options.length;
      this.render();
    }
    if (input.justDown('A')) this.pick();
    input.endFrame();
  }
}
