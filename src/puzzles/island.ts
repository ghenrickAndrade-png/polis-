import Phaser from 'phaser';
import { TILE } from '../config';
import { bus } from '../engine/bus';
import { state } from '../engine/state';
import { sfx } from '../engine/sfx';
import type { RoomScene } from '../scenes/RoomScene';
import { registerController, type Interactable, type RoomController } from './registry';

/**
 * Ilha do Eremita — tutorial.
 * Ensina, pela mecânica: sociabilidade (Cooperar), razão e cultura
 * (a jangada fica para quem chega depois), identidade construída na
 * convivência (nome e cor) e a tendência a se isolar (escolha final).
 */
class IslandController implements RoomController {
  private newcomers: string[] = [];
  private legacyShown = false;

  constructor(private s: RoomScene) {}

  create(): void {
    const lia = this.s.npcs.get('lia');
    if (lia && state.has('island.lia')) {
      lia.followTarget = this.s.player;
      this.s.npcColliders.get('lia')?.destroy();
      lia.def.dialogue = state.has('island.raft') ? 'lia_after_raft' : state.has('island.log') ? 'lia_after_log' : 'lia_follow';
    }
    if (!state.has('island.intro')) {
      this.s.time.delayedCall(400, () => {
        this.s.dialogue('island_intro', () => state.set('island.intro'));
      });
    }
    if (state.has('island.raft') && !state.has('island.legacy')) this.spawnNewcomers(true);
  }

  update(): void {
    // Recém-chegados param perto da jangada e comentam
    for (const id of this.newcomers) {
      const n = this.s.npcs.get(id);
      if (!n || n.route !== null || n.getData('arrived')) continue;
      n.setData('arrived', true);
      n.faceTowards(this.s.tc(18, 4).x, this.s.tc(18, 4).y);
      if (!this.legacyShown && !state.has('island.legacy')) {
        this.legacyShown = true;
        n.setBubble('Uma jangada pronta!');
      }
    }
  }

  onInteract(target: Interactable): boolean {
    const lia = this.s.npcs.get('lia');
    const liaNear = !!lia && state.has('island.lia') && Phaser.Math.Distance.Between(lia.x, lia.y, this.s.player.x, this.s.player.y) < 56;
    if (target.id === 'log') {
      if (!state.has('island.lia')) this.s.dialogue('log_alone');
      else if (!liaNear) this.s.dialogue('log_far');
      else this.s.dialogue('lia_cooperate');
      return true;
    }
    if (target.id === 'woodpile') {
      if (!state.has('island.lia') || !liaNear) this.s.dialogue('woodpile_alone');
      else this.s.dialogue('woodpile_build');
      return true;
    }
    if (target.id === 'raft') {
      this.s.dialogue('raft_choice');
      return true;
    }
    return false;
  }

  onEvent(name: string): void {
    const lia = this.s.npcs.get('lia');
    if (name.startsWith('name:')) {
      state.name = name.slice(5);
      bus.emit('name');
      return;
    }
    switch (name) {
      case 'lia:join': {
        state.set('island.lia');
        if (lia) {
          lia.followTarget = this.s.player;
          lia.paused = false;
          this.s.npcColliders.get('lia')?.destroy();
          lia.def.dialogue = 'lia_follow';
        }
        bus.emit('toast', `Lia agora anda com você.`, 'info');
        break;
      }
      case 'island:lift': {
        // Cooperar: o tronco sai do caminho
        const log = this.s.props.get('log');
        this.s.shake(300, 0.006);
        sfx.hit();
        if (log) {
          this.s.tweens.add({
            targets: log,
            x: log.x + 40,
            y: log.y - 10,
            angle: 25,
            alpha: 0,
            duration: 600,
            onComplete: () => this.s.removeProp('log'),
          });
        }
        state.set('island.log');
        bus.emit('toast', 'Novo verbo: Cooperar — o que não dá sozinho, dá a dois.', 'item');
        this.s.time.delayedCall(700, () => {
          state.unlockPage('sociabilidade', 'Levantei um tronco que sozinho não saía do lugar: precisou de duas pessoas combinando a força.');
          this.s.player.setLook('hero');
          state.look = 'hero';
          this.s.time.delayedCall(900, () => bus.emit('toast', 'Você ganhou cor. Conviver muda quem você é.', 'journal'));
          if (lia) lia.def.dialogue = 'lia_after_log';
        });
        break;
      }
      case 'island:build': {
        state.set('island.raft');
        this.s.removeProp('woodpile');
        this.s.shake(200, 0.004);
        const raft = this.s.spawnProp({ type: 'prop', id: 'raft', x: 18, y: 3, sprite: 'raft', solid: true, interact: 'raft', dy: 6, bodyW: 28, bodyH: 10 });
        raft.setAlpha(0);
        this.s.tweens.add({ targets: raft, alpha: 1, duration: 800 });
        sfx.success();
        state.addDid('sociabilidade', 'Construí uma jangada com a Lia, cada um fazendo uma parte: a razão combinada com outra pessoa cria ferramentas.');
        if (lia) lia.def.dialogue = 'lia_after_raft';
        this.s.time.delayedCall(1800, () => this.spawnNewcomers(false));
        break;
      }
      case 'island:legacy': {
        state.set('island.legacy');
        state.addDid('sociabilidade', 'Quem chegou depois usou a jangada pronta, sem precisar começar do zero: é assim que a cultura passa de geração em geração.');
        for (const id of this.newcomers) {
          const n = this.s.npcs.get(id);
          if (n) {
            n.def.dialogue = 'newcomers_after';
            n.setBubble(null);
          }
        }
        break;
      }
      case 'island:stay': {
        state.set('island.stayed');
        state.addDid('sociabilidade', 'Pensei em ficar sozinho na ilha: a tendência a se isolar também existe. Mas a jangada só navega com dois.');
        this.s.dialogue('raft_stay');
        break;
      }
      case 'island:go': {
        this.s.dialogue('raft_go');
        break;
      }
      case 'island:depart': {
        state.set('island.done');
        state.addDid('sociabilidade', 'Fui para Pólis com a Lia: a tendência a se associar venceu, e a viagem só existiu porque éramos dois.');
        this.s.goTo('town', 'dock');
        break;
      }
    }
  }

  private spawnNewcomers(silent: boolean): void {
    const defs = [
      { id: 'nc1', look: 'townA', name: 'Náufrago', x: 14, y: 15 },
      { id: 'nc2', look: 'townB', name: 'Náufraga', x: 15, y: 15 },
    ];
    defs.forEach((d, i) => {
      const n = this.s.spawnNpc({ type: 'npc', id: d.id, x: d.x, y: d.y, look: d.look, name: d.name, dialogue: state.has('island.legacy') ? 'newcomers_after' : 'newcomers', speed: 46 });
      this.s.npcColliders.get(d.id)?.destroy();
      n.route = silent
        ? [{ x: 17 + i * 2, y: 6 }]
        : [
            { x: 18, y: 13 },
            { x: 18, y: 10 },
            { x: 17 + i * 2, y: 6 },
          ];
      if (silent) n.setPosition(this.s.tc(17 + i * 2, 6).x, this.s.tc(17 + i * 2, 6).y);
      (n.body as Phaser.Physics.Arcade.Body).checkCollision.none = true;
      this.newcomers.push(d.id);
    });
    if (!silent) bus.emit('toast', 'Um barco encostou na praia. Mais dois náufragos.', 'info');
  }

  destroy(): void {
    /* nada a limpar além dos objetos da cena */
  }
}

registerController('island', (s) => new IslandController(s));

export const ISLAND_TILE = TILE;
