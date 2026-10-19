import Phaser from 'phaser';
import { FONT, GAME_W, TEXT_RES } from '../config';
import { AGORA_HELPERS, FAMILY_QUEUE, FAMILY_SPEAKERS, HIDDEN_STONES, LESSON_STEPS, PROPOSALS, SCHOOL_BOXES } from '../content/mirrorData';
import { bus } from '../engine/bus';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { T } from '../engine/textures';
import { BridgeRepair, Civic, Lesson, TurnTaking, type Verb } from '../logic/Socialization';
import type { RoomScene } from '../scenes/RoomScene';
import { registerController, type Interactable, type RoomController } from './registry';

const VERB_LABEL: Record<Verb, string> = { respeitar: 'respeitar a vez', ler: 'ler', consertar: 'consertar', documento: 'documento', voto: 'voto' };

function verbs(): Verb[] {
  return (['respeitar', 'ler', 'consertar', 'documento', 'voto'] as Verb[]).filter((v) => state.has(`verb.${v}`));
}

function hud(s: RoomScene): Phaser.GameObjects.Text {
  const t = s.add
    .text(GAME_W / 2, 8, '', { fontFamily: FONT, fontSize: '8px', color: '#ffffff', backgroundColor: '#1a1a22cc', padding: { x: 4, y: 2 } })
    .setOrigin(0.5, 0)
    .setScrollFactor(0)
    .setResolution(TEXT_RES)
    .setDepth(45000);
  refreshHud(t);
  return t;
}

function refreshHud(t: Phaser.GameObjects.Text): void {
  const v = verbs();
  t.setText(state.has('mirror.subject') ? `SUJEITO · verbos: ${v.map((x) => VERB_LABEL[x]).join(', ')}` : `INDIVÍDUO · verbos: ${v.length ? v.map((x) => VERB_LABEL[x]).join(', ') : 'nenhum'}`);
}

function learn(v: Verb, did: string): void {
  state.set(`verb.${v}`);
  state.unlockPage('sujeito', did);
  bus.emit('toast', `Verbo aprendido: ${VERB_LABEL[v].toUpperCase()}`, 'item');
  sfx.pickup();
  state.save();
}

// ===================================================================== Hall
class MirrorHall implements RoomController {
  private hud!: Phaser.GameObjects.Text;
  constructor(private s: RoomScene) {}

  create(): void {
    if (!state.has('mirror.subject')) {
      state.look = 'gray';
      this.s.player.setLook('gray');
    }
    this.hud = hud(this.s);
    if (!state.has('mirror.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('mirror_intro', () => state.set('mirror.intro')));
    this.check();
  }

  private check(): void {
    const keys = ['key_familia', 'key_escola', 'key_trabalho', 'key_estado'].filter((k) => state.hasItem(k)).length;
    if (keys === 4 && !state.has('mirror.subject')) {
      state.set('mirror.subject');
      state.look = 'hero';
      this.s.player.setLook('hero');
      sfx.success();
      state.addDid('sujeito', 'Passei pelas quatro instituições do Templo do Espelho (família, escola, trabalho, Estado) e a silhueta cinza virou sujeito: ganhou cor, nome e quatro verbos.');
      this.s.time.delayedCall(300, () => this.s.dialogue('hall_subject', () => state.save()));
    }
    refreshHud(this.hud);
  }

  onFlag(): void {
    refreshHud(this.hud);
  }

  update(): void {
    /* nada */
  }
  destroy(): void {
    this.hud.destroy();
  }
}
registerController('mirror_hall', (s) => new MirrorHall(s));

// ================================================================== Família
class Familia implements RoomController {
  private turns = new TurnTaking(FAMILY_SPEAKERS.map((x) => x.id));
  private hud!: Phaser.GameObjects.Text;
  constructor(private s: RoomScene) {}

  create(): void {
    this.hud = hud(this.s);
    if (state.has('familia.queue')) for (const q of FAMILY_QUEUE) this.s.removeNpc(q.id);
    if (!state.has('familia.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('familia_intro', () => state.set('familia.intro')));
  }

  onInteract(t: Interactable): boolean {
    const npc = this.s.npcs.get(t.id);
    const unpause = () => {
      if (npc) npc.paused = false;
    };
    if (t.id === 'table' || FAMILY_SPEAKERS.some((x) => x.id === t.id)) {
      if (state.has('verb.respeitar')) this.s.say('Mãe', 'Você já sabe esperar a vez. A fila do balcão é logo ali.', unpause);
      else this.s.dialogue('table_choice', unpause);
      return true;
    }
    if (FAMILY_QUEUE.some((q) => q.id === t.id)) {
      if (!state.has('verb.respeitar')) this.s.dialogue('queue_blocked', unpause);
      else this.s.dialogue('queue_ok', unpause);
      return true;
    }
    return false;
  }

  onEvent(name: string): void {
    if (name === 'fam:wait') {
      const cur = this.turns.current;
      const sp = FAMILY_SPEAKERS.find((x) => x.id === cur);
      this.turns.wait();
      if (sp) {
        this.s.say(sp.name, sp.line, () => {
          if (this.turns.done) this.s.dialogue('table_done');
          else this.s.dialogue('table_choice');
        });
      }
    } else if (name === 'fam:interrupt') {
      this.turns.interrupt();
      sfx.fray();
      for (const sp of FAMILY_SPEAKERS) this.s.npcs.get(sp.id)?.setBubble('...');
      this.s.time.delayedCall(1500, () => FAMILY_SPEAKERS.forEach((sp) => this.s.npcs.get(sp.id)?.setBubble(null)));
      this.s.dialogue('table_interrupt');
    } else if (name === 'fam:learned') {
      learn('respeitar', 'Na Ala da Família, esperei cada pessoa terminar de falar à mesa (quem fala por cima não é ouvido) e aprendi a respeitar a vez.');
      refreshHud(this.hud);
    } else if (name === 'fam:queue') {
      state.set('familia.queue');
      FAMILY_QUEUE.forEach((q, i) => {
        const n = this.s.npcs.get(q.id);
        if (n) this.s.tweens.add({ targets: n, alpha: 0, delay: 600 + i * 500, duration: 300, onComplete: () => this.s.removeNpc(q.id) });
      });
      sfx.select();
    }
  }

  update(): void {
    /* nada */
  }
  destroy(): void {
    this.hud.destroy();
  }
}
registerController('mirror_familia', (s) => new Familia(s));

// =================================================================== Escola
class Escola implements RoomController {
  private lesson = new Lesson(LESSON_STEPS);
  private hud!: Phaser.GameObjects.Text;
  private labels = new Map<string, Phaser.GameObjects.Text>();
  constructor(private s: RoomScene) {}

  create(): void {
    this.hud = hud(this.s);
    for (const b of SCHOOL_BOXES) {
      const img = this.s.props.get(`box:${b.id}`);
      if (!img) continue;
      const t = this.s.add
        .text(img.x, img.y - 16, '▓▒░▓▒', { fontFamily: FONT, fontSize: '7px', color: '#ffffff', backgroundColor: '#1a1a22cc', padding: { x: 3, y: 1 } })
        .setOrigin(0.5, 1)
        .setResolution(TEXT_RES)
        .setDepth(img.y + 1);
      this.labels.set(b.id, t);
    }
    if (state.has('verb.ler')) this.reveal();
    if (!state.has('escola.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('escola_intro', () => state.set('escola.intro')));
  }

  private reveal(): void {
    for (const b of SCHOOL_BOXES) this.labels.get(b.id)?.setText(b.label);
  }

  onInteract(t: Interactable): boolean {
    if (t.id === 'professora') {
      const npc = this.s.npcs.get(t.id)!;
      const unpause = () => (npc.paused = false);
      if (state.has('verb.ler')) {
        this.s.say('Professora', 'Agora que você lê, as placas dizem o que tem em cada caixa.', unpause);
        return true;
      }
      const step = this.lesson.next();
      if (!step) return true;
      this.s.say(undefined, step, () => {
        unpause();
        if (this.lesson.complete) this.s.dialogue('lesson_done');
        else bus.emit('hint', `Lição ${this.lesson.progress}/3. Fale com a professora de novo.`);
      });
      return true;
    }
    if (t.id.startsWith('box:')) {
      const id = t.id.slice(4);
      const b = SCHOOL_BOXES.find((x) => x.id === id)!;
      if (!state.has('verb.ler')) {
        this.s.dialogue('box_scribble');
        return true;
      }
      if (b.label === 'CHAVE') {
        if (state.hasItem('key_escola')) this.s.say(undefined, '(A caixa está vazia: você já pegou a chave.)');
        else {
          state.set('item.key_escola');
          state.give('key_escola');
          sfx.pickup();
          this.s.dialogue('escola_key');
        }
      } else this.s.dialogue('box_wrong');
      return true;
    }
    return false;
  }

  onEvent(name: string): void {
    if (name === 'esc:learned') {
      learn('ler', 'Na Ala da Escola, segui a lição da professora em três passos e as placas rabiscadas viraram palavras: aprendi a ler.');
      this.reveal();
      refreshHud(this.hud);
    }
  }

  update(): void {
    /* nada */
  }
  destroy(): void {
    this.hud.destroy();
    for (const l of this.labels.values()) l.destroy();
  }
}
registerController('mirror_escola', (s) => new Escola(s));

// ================================================================= Trabalho
class Trabalho implements RoomController {
  private bridge = new BridgeRepair(3);
  private carried: Phaser.GameObjects.Image;
  private hud!: Phaser.GameObjects.Text;
  constructor(private s: RoomScene) {
    this.carried = s.add.image(0, 0, 'log').setScale(0.6).setVisible(false).setDepth(30000);
  }

  create(): void {
    this.hud = hud(this.s);
    if (state.has('verb.consertar')) {
      for (let i = 0; i < 3; i++) this.plank(i);
    } else if (!state.has('trabalho.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('trabalho_intro', () => state.set('trabalho.intro')));
  }

  private plank(i: number): void {
    if (i === 0) {
      this.s.setTile(18, 8, T.bridge);
      this.s.setTile(19, 8, T.bridge);
    } else if (i === 1) {
      this.s.setTile(18, 9, T.bridge);
      this.s.setTile(19, 9, T.bridge);
    } else {
      this.s.setTile(18, 7, T.bridge);
      this.s.setTile(19, 7, T.bridge);
    }
  }

  onInteract(t: Interactable): boolean {
    if (t.id === 'planks') {
      if (this.bridge.complete) this.s.say(undefined, '(Sobrou madeira. A ponte já está pronta.)');
      else if (this.bridge.take()) {
        sfx.pickup();
        this.s.dialogue('plank_take');
      } else this.s.say(undefined, '(Você já carrega uma tábua. Leve-a à ponte.)');
      return true;
    }
    if (t.id === 'bridge_end') {
      if (!this.bridge.carrying) {
        this.s.say(undefined, this.bridge.complete ? '(Ponte pronta.)' : `(Faltam ${3 - this.bridge.placed} tábua(s). Pegue na pilha da mestra.)`);
        return true;
      }
      this.bridge.place();
      this.plank(this.bridge.placed - 1);
      sfx.thread();
      if (this.bridge.complete) this.s.dialogue('bridge_done');
      else this.s.dialogue('plank_place');
      return true;
    }
    return false;
  }

  onEvent(name: string): void {
    if (name === 'trab:learned') {
      learn('consertar', 'Na Ala do Trabalho, levei três tábuas, uma por vez, até o abismo e consertei a ponte: aprendi a fazer.');
      refreshHud(this.hud);
    }
  }

  update(): void {
    this.carried.setVisible(this.bridge.carrying).setPosition(this.s.player.x, this.s.player.y - 14);
  }
  destroy(): void {
    this.carried.destroy();
    this.hud.destroy();
  }
}
registerController('mirror_trabalho', (s) => new Trabalho(s));

// =================================================================== Estado
class Estado implements RoomController {
  private civic = new Civic(PROPOSALS);
  private hud!: Phaser.GameObjects.Text;
  constructor(private s: RoomScene) {}

  create(): void {
    this.hud = hud(this.s);
    if (state.has('verb.documento')) {
      this.civic.getDocument();
      this.openGate();
    }
    if (state.has('verb.voto')) this.civic.vote(state.has('praca.22') ? 'p1' : 'p2');
    if (!state.has('estado.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('estado_intro', () => state.set('estado.intro')));
  }

  private openGate(): void {
    this.s.setTile(20, 8, T.doorOpen);
    const g = this.s.npcs.get('guard');
    if (g) {
      g.def.dialogue = 'walker_line';
      g.setPosition(this.s.tc(18, 5).x, this.s.tc(18, 5).y);
    }
  }

  onInteract(t: Interactable): boolean {
    const npc = this.s.npcs.get(t.id);
    const unpause = () => {
      if (npc) npc.paused = false;
    };
    if (t.id === 'escriva') {
      this.s.dialogue(this.civic.document ? 'cartorio_again' : 'cartorio', unpause);
      return true;
    }
    if (t.id === 'presidente') {
      if (this.civic.voted) this.s.say('Presidente', `Votação encerrada. ${this.civic.result}`, unpause);
      else this.s.dialogue('assembleia', unpause);
      return true;
    }
    return false;
  }

  onEvent(name: string): void {
    if (name === 'est:doc') {
      this.civic.getDocument();
      this.s.dialogue('cartorio_done');
    } else if (name === 'est:learned') {
      learn('documento', 'Na Ala do Estado, fiz meu documento no cartório e entrei na Assembleia: com o Estado tenho documento, serviços públicos, leis e impostos.');
      this.openGate();
      sfx.door();
      refreshHud(this.hud);
    } else if (name.startsWith('est:vote:')) {
      const id = name.slice(9);
      this.civic.vote(id);
      if (id === 'p1') state.set('praca.22');
      this.s.say('Presidente', this.civic.result ?? '', () => this.s.dialogue('assembleia_done'));
    } else if (name === 'est:voted') {
      state.set('verb.voto');
      state.addDid('sujeito', `Votei na Assembleia: ${this.civic.result} Um sujeito é influenciado pela sociedade e também pode transformá-la.`);
      bus.emit('toast', 'Verbo aprendido: VOTO', 'item');
      refreshHud(this.hud);
      state.save();
    }
  }

  update(): void {
    /* nada */
  }
  destroy(): void {
    this.hud.destroy();
  }
}
registerController('mirror_estado', (s) => new Estado(s));

// ==================================================================== Ágora
class Agora implements RoomController {
  private swapped = false;
  private hud!: Phaser.GameObjects.Text;
  constructor(private s: RoomScene) {}

  create(): void {
    this.hud = hud(this.s);
    if (state.has('agora.fixed')) this.afterFix(true);
    if (state.has('agora.argued')) this.spawnAristotle();
    if (!state.has('agora.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('agora_intro', () => state.set('agora.intro')));
  }

  private stones(on: boolean): void {
    for (const st of HIDDEN_STONES) this.s.setTile(st.x, st.y, on ? T.bridge : T.water);
  }

  private onWater(): boolean {
    const tx = Math.floor(this.s.player.x / 16);
    const ty = Math.floor((this.s.player.y + 4) / 16);
    return HIDDEN_STONES.some((st) => st.x === tx && st.y === ty);
  }

  private got(): number {
    return AGORA_HELPERS.filter((h) => state.has(`agora.got.${h.verb}`)).length;
  }

  private afterFix(silent: boolean): void {
    this.s.removeNpc('eremita');
    this.s.props.get('boat')?.clearTint();
    const er = this.s.spawnNpc({ type: 'npc', id: 'eremita', x: 12, y: 9, look: 'dogma', name: 'Eremita', facing: 'left', dialogue: 'walker_line' });
    er.def.dialogue = 'walker_line';
    if (!state.has('agora.argued')) {
      this.s.spawnNpc({ type: 'npc', id: 'vizA', x: 6, y: 8, look: 'townA', name: 'Vizinho A', facing: 'right', dialogue: 'dispute_intro', bubble: '!' });
      this.s.spawnNpc({ type: 'npc', id: 'vizB', x: 9, y: 8, look: 'townC', name: 'Vizinho B', facing: 'left', dialogue: 'dispute_intro', bubble: '!' });
      if (!silent) bus.emit('hint', 'Na Ágora, dois vizinhos discutem. Vá lá.');
    }
  }

  private spawnAristotle(): void {
    if (this.s.npcs.has('aristoteles')) return;
    this.s.npcs.get('vizA')?.setBubble(null);
    this.s.npcs.get('vizB')?.setBubble(null);
    this.s.spawnNpc({ type: 'npc', id: 'aristoteles', x: 8, y: 5, look: 'mills', name: 'Aristóteles', facing: 'down', dialogue: 'aristoteles_intro' });
  }

  onInteract(t: Interactable): boolean {
    const npc = this.s.npcs.get(t.id);
    const unpause = () => {
      if (npc) npc.paused = false;
    };
    switch (t.id) {
      case 'mirror':
        if (this.swapped) {
          if (this.onWater()) {
            this.s.dialogue('mirror_onwater');
            return true;
          }
          this.swapped = false;
          this.s.player.setLook(state.look);
          this.stones(false);
          this.s.dialogue('mirror_unswap');
        } else {
          this.swapped = true;
          this.s.player.setLook('farmer');
          this.stones(true);
          sfx.thread();
          this.s.cameras.main.flash(120, 200, 220, 255, false);
          state.unlockPage('alteridade', 'Na Ágora, olhei no espelho e vi o lago com os olhos da barqueira: as pedras do raso, que eu não via, apareceram.');
          this.s.dialogue('mirror_swap');
        }
        return true;
      case 'eremita':
        if (state.has('agora.fixed')) {
          this.s.say('Eremita', 'Voltei pra pólis. Nem deus nem bicho vive fora dela; eu também não.', unpause);
          return true;
        }
        if (!state.has('agora.help')) this.s.dialogue('eremita_first', unpause);
        else if (this.got() < 3) this.s.dialogue('eremita_wait', unpause);
        else if (!state.has('verb.consertar')) this.s.say('Eremita', 'Tábuas, nó, licença. Agora só falta alguém que saiba consertar.', unpause);
        else this.s.dialogue('eremita_fix', unpause);
        return true;
      case 'vizA':
      case 'vizB':
        if (state.has('agora.argued')) this.s.say(npc?.npcName ?? 'Vizinho', 'Ele cuida do poço, todos usam. Resolvido na fala.', unpause);
        else this.s.dialogue('dispute_intro', unpause);
        return true;
      case 'aristoteles':
        if (state.has('mirror.done')) this.s.dialogue('aristoteles_post', unpause);
        else this.s.dialogue('aristoteles_intro', () => this.prova(unpause));
        return true;
    }
    const h = AGORA_HELPERS.find((x) => x.id === t.id);
    if (h) {
      if (!state.has('agora.help')) this.s.say(h.name, 'Bom dia. O Eremita da ilha continua lá, sozinho. Teimoso.', unpause);
      else if (state.has(`agora.got.${h.verb}`)) this.s.say(h.name, `Já te dei ${h.gives}. Vai lá consertar.`, unpause);
      else if (!state.has(`verb.${h.verb}`)) this.s.dialogue('helper_needs_verb', unpause);
      else this.s.dialogue(h.verb === 'respeitar' ? 'helper_cida_wait' : h.verb === 'ler' ? 'helper_prof' : 'helper_escr', unpause);
      return true;
    }
    return false;
  }

  private prova(unpause: () => void): void {
    const text =
      'Você entrou como indivíduo, um ser humano isolado, e passou por quatro instituições: ' +
      'família (respeitar a vez), escola (ler), trabalho (consertar) e Estado (documento e voto). ' +
      'Isso é virar sujeito: aprender normas, valores e papéis, formar identidade e agir de forma consciente. ' +
      'Viu o lago com os olhos da barqueira (alteridade), trouxe a pólis inteira ao Eremita, que voltou, e resolveu a disputa do poço pela fala: ' +
      'o ser humano é um animal político, só se realiza na pólis e discute pela razão o que é justo e injusto.';
    this.s.say('Aristóteles', text, () => {
      state.setMine('sujeito', text);
      state.unlockPage('aristoteles', 'Na Ágora, resolvi a disputa do poço pela fala, não pela espada: ele cuida do poço, todos usam. E o Eremita voltou à pólis quando a pólis chegou até ele.');
      state.set('mirror.done');
      sfx.success();
      this.s.dialogue('aristoteles_post', () => {
        unpause();
        state.save();
      });
    });
  }

  onEvent(name: string): void {
    switch (name) {
      case 'ag:help':
        state.set('agora.help');
        this.s.props.get('boat')?.setTint(0x886655);
        this.s.dialogue('eremita_help');
        break;
      case 'ag:leave':
        this.s.props.get('boat')?.setTint(0x886655);
        state.set('agora.help');
        this.s.dialogue('eremita_leave');
        break;
      case 'ag:fixed':
        state.set('agora.fixed');
        state.addDid('aristoteles', 'Consertei o barco do Eremita com tábuas da Dona Cida, o nó do manual da professora e a licença do escrivão: cada instituição trouxe uma parte.');
        sfx.success();
        this.s.time.delayedCall(300, () => {
          const er = this.s.npcs.get('eremita');
          if (er) this.s.tweens.add({ targets: er, alpha: 0, duration: 600, onComplete: () => this.afterFix(false) });
          else this.afterFix(false);
        });
        break;
      case 'ag:force': {
        sfx.fray();
        this.s.dialogue('dispute_force');
        for (const id of ['vizA', 'vizB', ...AGORA_HELPERS.map((h) => h.id)]) {
          const n = this.s.npcs.get(id);
          if (n) this.s.tweens.add({ targets: n, alpha: 0.2, yoyo: true, duration: 1500 });
        }
        break;
      }
      case 'ag:argue':
        this.s.dialogue('dispute_argue');
        break;
      case 'ag:argued':
        state.set('agora.argued');
        sfx.success();
        this.spawnAristotle();
        bus.emit('hint', 'Aristóteles apareceu na Ágora.');
        break;
      default:
        if (name.startsWith('ag:got:')) {
          state.set(`agora.got.${name.slice(7)}`);
          sfx.pickup();
          bus.emit('hint', `${this.got()}/3 coisas para o barco.`);
        }
    }
  }

  update(): void {
    /* nada */
  }
  destroy(): void {
    this.hud.destroy();
  }
}
registerController('mirror_agora', (s) => new Agora(s));
