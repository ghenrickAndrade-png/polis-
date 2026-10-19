import Phaser from 'phaser';
import { state } from '../engine/state';
import { buildProps, buildTileset, LOOKS, ensureCharacter } from '../engine/textures';
import { ROOMS } from '../content/rooms';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create(): void {
    buildTileset(this);
    buildProps(this);
    for (const [id, look] of Object.entries(LOOKS)) ensureCharacter(this, id, look);

    const q = new URLSearchParams(location.search);
    const room = q.get('room');
    if (room && ROOMS[room]) {
      // Modo de depuração: entra direto numa sala, com flags/itens opcionais.
      state.reset();
      state.debug = true;
      state.god = q.has('god');
      state.name = q.get('name') ?? 'Teste';
      state.look = q.get('look') ?? 'hero';
      for (const f of (q.get('flags') ?? '').split(',').filter(Boolean)) state.flags.add(f);
      for (const i of (q.get('items') ?? '').split(',').filter(Boolean)) state.items.add(i);
      for (const p of (q.get('pages') ?? '').split(',').filter(Boolean)) state.unlockPage(p, 'debug');
      this.scene.start('Room', { roomId: room, spawn: q.get('spawn') ?? 'start' });
      this.scene.launch('UI');
      return;
    }
    this.scene.start('Title');
  }
}
