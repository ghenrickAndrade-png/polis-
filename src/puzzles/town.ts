import { bus } from '../engine/bus';
import { state } from '../engine/state';
import type { RoomScene } from '../scenes/RoomScene';
import { registerController, type Interactable, type RoomController } from './registry';

/** Pólis — overworld. Só cuida das chegadas. */
class TownController implements RoomController {
  constructor(private s: RoomScene) {}

  create(): void {
    if (state.look === 'gray' && state.has('island.log')) {
      state.look = 'hero';
      this.s.player.setLook('hero');
    }
    if (!state.has('town.arrived') && this.s.spawnId === 'dock') {
      this.s.time.delayedCall(500, () => {
        this.s.dialogue('lia_town', () => {
          state.set('town.arrived');
          bus.emit('hint', 'A escola fica a noroeste da praça. Fale com a Profª Clara.');
        });
      });
    }
    if (state.has('lens.done') && !state.has('town.returned')) {
      state.set('town.returned');
      this.s.time.delayedCall(800, () => bus.emit('toast', 'Zé, Maria e Bia têm coisas novas a dizer. E a Profª Clara espera você.', 'info'));
    }
  }

  onInteract(t: Interactable): boolean {
    if (t.id === 'praca_sign') {
      this.s.dialogue(state.has('praca.22') ? 'praca_22' : 'praca_18');
      return true;
    }
    return false;
  }

  update(): void {
    /* nada */
  }

  destroy(): void {
    /* nada */
  }
}

registerController('town', (s) => new TownController(s));
