import Phaser from 'phaser';
import { GAME_H, GAME_W } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { RoomScene } from './scenes/RoomScene';
import { UIScene } from './scenes/UIScene';
// Controladores de sala (registram-se ao importar)
import './puzzles/island';
import './puzzles/town';
import './puzzles/lens';
import './puzzles/villages';
import './puzzles/castle';
import './puzzles/mirror';
import './puzzles/scales';
import './puzzles/districts';

import { state } from './engine/state';
import { bus } from './engine/bus';

// acesso para scripts de QA (tools/shots.cjs)
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0b0b14',
  antialias: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: new URLSearchParams(location.search).has('physics') },
  },
  input: { activePointers: 4 },
  scene: [BootScene, TitleScene, RoomScene, UIScene],
});

(window as unknown as { __polis: unknown }).__polis = { state, bus, game };
