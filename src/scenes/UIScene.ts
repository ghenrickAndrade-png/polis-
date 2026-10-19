import Phaser from 'phaser';
import { FONT, GAME_H, GAME_W, MAX_HP, TEXT_RES } from '../config';
import { bus } from '../engine/bus';
import { input, type Button } from '../engine/input';
import { activeItem } from '../engine/items';
import { state } from '../engine/state';
import { sfx } from '../engine/sfx';
import { DIALOGUES } from '../content/dialogues';
import { CONCEPTS, CONCEPT_BY_ID } from '../content/concepts';
import type { Dialogue, DialogueStep } from '../content/types';
import { openResumao } from '../engine/resumao';

type Choice = { label: string; next?: string; event?: string; set?: string };

const BOX_H = 66;

export class UIScene extends Phaser.Scene {
  // estado
  blocking = false;
  private dlgSteps: Dialogue = [];
  private dlgIndex = 0;
  private dlgDone: (() => void) | null = null;
  private dlgOpen = false;
  private dlgOpenedAt = 0;
  private dlgToken = 0;
  private fullText = '';
  private shown = 0;
  private typing = false;
  private typeAcc = 0;
  private choices: Choice[] | null = null;
  private choiceIdx = 0;
  private journalOpen = false;
  private journalIdx = 0;
  private journalScroll = 0;
  private pauseOpen = false;
  private pauseIdx = 0;

  // objetos
  private hearts: Phaser.GameObjects.Image[] = [];
  private nameText!: Phaser.GameObjects.Text;
  private itemBox!: Phaser.GameObjects.Rectangle;
  private itemIcon!: Phaser.GameObjects.Image;
  private itemLabel!: Phaser.GameObjects.Text;
  private hudGroup!: Phaser.GameObjects.Container;
  private box!: Phaser.GameObjects.Container;
  private boxBg!: Phaser.GameObjects.Rectangle;
  private whoBg!: Phaser.GameObjects.Rectangle;
  private whoText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private arrow!: Phaser.GameObjects.Text;
  private choiceBox!: Phaser.GameObjects.Container;
  private choiceTexts: Phaser.GameObjects.Text[] = [];
  private toastBg!: Phaser.GameObjects.Rectangle;
  private toastText!: Phaser.GameObjects.Text;
  private toastTimer?: Phaser.Time.TimerEvent;
  private toastQueue: { text: string; kind: string }[] = [];
  private banner!: Phaser.GameObjects.Text;
  private journal!: Phaser.GameObjects.Container;
  private jList: Phaser.GameObjects.Text[] = [];
  private jTitle!: Phaser.GameObjects.Text;
  private jMeta!: Phaser.GameObjects.Text;
  private jBody!: Phaser.GameObjects.Text;
  private jBodyMask!: Phaser.GameObjects.Graphics;
  private jEmpty!: Phaser.GameObjects.Text;
  private pause!: Phaser.GameObjects.Container;
  private pauseTexts: Phaser.GameObjects.Text[] = [];
  private touchUI?: Phaser.GameObjects.Container;
  private stickBase?: Phaser.GameObjects.Arc;
  private stickKnob?: Phaser.GameObjects.Arc;
  private stickPointer: number | null = null;
  private fade!: Phaser.GameObjects.Rectangle;
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UI', active: false });
  }

  create(): void {
    this.scene.bringToTop();
    input.bind(this);
    this.buildHud();
    this.buildDialogue();
    this.buildToast();
    this.buildJournal();
    this.buildPause();
    this.buildTouch();
    this.fade = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 1).setOrigin(0).setDepth(900).setAlpha(0);

    bus.on('dialogue:start', this.startDialogue, this);
    bus.on('toast', this.toast, this);
    bus.on('hp', this.refreshHearts, this);
    bus.on('room:enter', this.showBanner, this);
    bus.on('journal:unlock', (id: string) => {
      const c = CONCEPT_BY_ID[id];
      if (c) this.toast(`Caderno: nova página — ${c.title}`, 'journal');
    });
    bus.on('item', (item: string) => {
      this.refreshItem();
      if (item === 'lens') this.toast('Novo item: Lente de Mills — aperte X para usar', 'item');
      if (item === 'crystal') this.toast('Novo item: Cristal de Escala — aperte X para trocar RUA/MAPA', 'item');
    });
    bus.on('name', () => this.refreshHud());
    bus.on('fade', (out: boolean, ms: number, cb?: () => void) => this.doFade(out, ms, cb));
    bus.on('hint', (t: string) => this.showHint(t));
    bus.on('debug:skipDialogue', (choice: number | number[]) => this.skipDialogue(choice));
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      bus.off('dialogue:start', this.startDialogue, this);
      bus.off('toast', this.toast, this);
      bus.off('hp', this.refreshHearts, this);
      bus.off('room:enter', this.showBanner, this);
    });
    this.refreshHud();
  }

  // ------------------------------------------------------------------ HUD
  private buildHud(): void {
    this.hudGroup = this.add.container(0, 0).setDepth(500);
    for (let i = 0; i < MAX_HP; i++) {
      const h = this.add.image(10 + i * 10, 9, 'heart').setOrigin(0, 0);
      this.hearts.push(h);
      this.hudGroup.add(h);
    }
    this.nameText = this.add.text(10, 17, '', { fontFamily: FONT, fontSize: '7px', color: '#ffffff' }).setResolution(TEXT_RES);
    this.nameText.setShadow(1, 1, '#000000', 0, true, true);
    this.itemBox = this.add.rectangle(GAME_W - 10, 8, 20, 20, 0x1a1a22, 0.75).setOrigin(1, 0).setStrokeStyle(1, 0x8a8a9a);
    this.itemIcon = this.add.image(GAME_W - 20, 18, 'lens').setVisible(false);
    this.itemLabel = this.add.text(GAME_W - 10, 29, 'X', { fontFamily: FONT, fontSize: '7px', color: '#cfcfcf' }).setOrigin(1, 0).setResolution(TEXT_RES);
    this.hint = this.add
      .text(GAME_W / 2, GAME_H - 6, '', { fontFamily: FONT, fontSize: '7px', color: '#ffffff', backgroundColor: '#1a1a22cc', padding: { x: 4, y: 2 } })
      .setOrigin(0.5, 1)
      .setResolution(TEXT_RES)
      .setDepth(510)
      .setAlpha(0);
    this.hudGroup.add([this.nameText, this.itemBox, this.itemIcon, this.itemLabel]);
  }

  refreshHud(): void {
    this.refreshHearts(state.hp, MAX_HP);
    this.nameText.setText(state.name === '???' ? '' : state.name);
    this.refreshItem();
  }

  private refreshHearts(hp: number, _max: number): void {
    this.hearts.forEach((h, i) => h.setTexture(i < hp ? 'heart' : 'heart_empty'));
  }

  refreshItem(): void {
    const it = activeItem();
    const has = it !== null;
    this.itemBox.setVisible(has);
    this.itemLabel.setVisible(has);
    this.itemIcon.setVisible(has);
    if (it) this.itemIcon.setTexture(it);
    this.itemBox.setStrokeStyle(1, state.lensOn ? 0xe6c45a : 0x8a8a9a);
  }

  private showBanner(name: string): void {
    this.banner.setText(name).setAlpha(0);
    this.tweens.killTweensOf(this.banner);
    this.tweens.add({ targets: this.banner, alpha: 1, duration: 300, yoyo: true, hold: 1600 });
  }

  private showHint(t: string): void {
    this.hint.setText(t);
    this.tweens.killTweensOf(this.hint);
    this.hint.setAlpha(1);
    this.tweens.add({ targets: this.hint, alpha: 0, delay: 2600, duration: 400 });
  }

  private doFade(out: boolean, ms: number, cb?: () => void): void {
    this.tweens.killTweensOf(this.fade);
    this.tweens.add({ targets: this.fade, alpha: out ? 1 : 0, duration: ms, onComplete: () => cb?.() });
  }

  // ------------------------------------------------------------- Diálogo
  private buildDialogue(): void {
    const y = GAME_H - BOX_H - 6;
    this.box = this.add.container(0, 0).setDepth(600).setVisible(false);
    this.boxBg = this.add.rectangle(8, y, GAME_W - 16, BOX_H, 0x101018, 0.94).setOrigin(0).setStrokeStyle(1, 0xd8d0c0);
    this.whoBg = this.add.rectangle(14, y - 7, 60, 12, 0xd8d0c0, 1).setOrigin(0);
    this.whoText = this.add.text(18, y - 6, '', { fontFamily: FONT, fontSize: '8px', color: '#101018', fontStyle: 'bold' }).setResolution(TEXT_RES);
    this.bodyText = this.add
      .text(18, y + 10, '', { fontFamily: FONT, fontSize: '9px', color: '#f4ecd8', wordWrap: { width: GAME_W - 48 }, lineSpacing: 3 })
      .setResolution(TEXT_RES);
    this.arrow = this.add.text(GAME_W - 20, y + BOX_H - 12, '▼', { fontFamily: FONT, fontSize: '8px', color: '#e6c45a' }).setResolution(TEXT_RES);
    this.tweens.add({ targets: this.arrow, y: y + BOX_H - 9, duration: 400, yoyo: true, repeat: -1 });
    this.box.add([this.boxBg, this.whoBg, this.whoText, this.bodyText, this.arrow]);

    this.choiceBox = this.add.container(0, 0).setDepth(610).setVisible(false);
    this.boxBg.setInteractive().on('pointerdown', () => this.pressA());
  }

  private startDialogue(steps: Dialogue | string, done?: () => void): void {
    const resolved = typeof steps === 'string' ? DIALOGUES[steps] : steps;
    if (!resolved) {
      console.warn('diálogo não encontrado', steps);
      done?.();
      return;
    }
    this.dlgSteps = resolved;
    this.dlgIndex = 0;
    this.dlgDone = done ?? null;
    this.dlgOpen = true;
    this.dlgToken++;
    this.dlgOpenedAt = this.time.now;
    this.blocking = true;
    this.box.setVisible(true);
    this.runStep();
  }

  private sub(text: string): string {
    return text.replace(/\{name\}/g, state.name === '???' ? 'você' : state.name);
  }

  private runStep(): void {
    while (this.dlgIndex < this.dlgSteps.length) {
      const step: DialogueStep = this.dlgSteps[this.dlgIndex];
      if ('text' in step) {
        this.showLine(step.who, this.sub(step.text));
        return;
      }
      if ('choice' in step) {
        this.showLine(undefined, this.sub(step.choice), true);
        this.showChoices(step.options);
        return;
      }
      this.dlgIndex++;
      if ('event' in step) {
        const token = this.dlgToken;
        bus.emit('dialogue:event', step.event);
        if (this.dlgToken !== token) return; // outro diálogo começou dentro do evento
      } else if ('set' in step) state.set(step.set);
      else if ('give' in step) state.give(step.give);
      else if ('goto' in step) {
        this.dlgSteps = DIALOGUES[step.goto] ?? [];
        this.dlgIndex = 0;
      } else if ('if' in step) {
        const target = state.has(step.if) ? step.then : step.else;
        if (target) {
          this.dlgSteps = DIALOGUES[target] ?? [];
          this.dlgIndex = 0;
        }
      }
    }
    this.endDialogue();
  }

  private endDialogue(): void {
    this.dlgOpen = false;
    this.box.setVisible(false);
    this.choiceBox.setVisible(false);
    this.choices = null;
    this.blocking = this.journalOpen || this.pauseOpen;
    const cb = this.dlgDone;
    this.dlgDone = null;
    bus.emit('dialogue:end');
    cb?.();
  }

  private showLine(who: string | undefined, text: string, instant = false): void {
    this.whoBg.setVisible(!!who);
    this.whoText.setVisible(!!who);
    if (who) {
      this.whoText.setText(who);
      this.whoBg.setSize(this.whoText.width + 8, 12);
    }
    this.fullText = text;
    this.shown = instant ? text.length : 0;
    this.typing = !instant;
    this.typeAcc = 0;
    this.bodyText.setText(instant ? text : '');
    this.arrow.setVisible(instant);
  }

  private showChoices(options: Choice[]): void {
    this.choices = options;
    this.choiceIdx = 0;
    this.choiceBox.removeAll(true);
    this.choiceTexts = [];
    const maxLen = Math.max(...options.map((o) => o.label.length));
    const w = Math.min(GAME_W - 32, Math.max(220, maxLen * 5 + 30));
    const h = options.length * 14 + 10;
    const x = GAME_W - 16 - w;
    const y = GAME_H - BOX_H - 10 - h;
    const bg = this.add.rectangle(x, y, w, h, 0x101018, 0.96).setOrigin(0).setStrokeStyle(1, 0xe6c45a);
    this.choiceBox.add(bg);
    options.forEach((o, i) => {
      const t = this.add
        .text(x + 10, y + 6 + i * 14, o.label, { fontFamily: FONT, fontSize: '8px', color: '#f4ecd8' })
        .setResolution(TEXT_RES)
        .setInteractive()
        .on('pointerdown', () => {
          this.choiceIdx = i;
          this.pickChoice();
        });
      this.choiceTexts.push(t);
      this.choiceBox.add(t);
    });
    this.choiceBox.setVisible(true);
    this.renderChoices();
  }

  private renderChoices(): void {
    this.choiceTexts.forEach((t, i) => {
      const label = this.choices![i].label;
      t.setText((i === this.choiceIdx ? '▶ ' : '   ') + label);
      t.setColor(i === this.choiceIdx ? '#e6c45a' : '#f4ecd8');
    });
  }

  private pickChoice(): void {
    if (!this.choices) return;
    const c = this.choices[this.choiceIdx];
    this.choices = null;
    this.choiceBox.setVisible(false);
    sfx.select();
    if (c.set) state.set(c.set);
    if (c.event) {
      const token = this.dlgToken;
      bus.emit('dialogue:event', c.event);
      if (this.dlgToken !== token) return; // outro diálogo começou dentro do evento
    }
    if (c.next) {
      this.dlgSteps = DIALOGUES[c.next] ?? [];
      this.dlgIndex = 0;
    } else this.dlgIndex++;
    this.runStep();
  }

  /** QA: avança o diálogo até o fim, escolhendo `choice` quando houver opções. */
  skipDialogue(choice: number | number[] = 0): void {
    // um número vale para todas as escolhas; uma lista é consumida escolha a escolha (a última se repete)
    const queue = Array.isArray(choice) ? [...choice] : [choice];
    for (let i = 0; i < 60 && this.dlgOpen; i++) {
      if (this.choices) {
        const c = queue.length > 1 ? queue.shift()! : queue[0];
        this.choiceIdx = Math.min(c, this.choices.length - 1);
        this.pickChoice();
      } else {
        this.typing = false;
        this.shown = this.fullText.length;
        this.dlgIndex++;
        this.runStep();
      }
    }
  }

  private pressA(): void {
    if (!this.dlgOpen) return;
    if (this.time.now - this.dlgOpenedAt < 150) return;
    if (this.choices) {
      this.pickChoice();
      return;
    }
    if (this.typing) {
      this.shown = this.fullText.length;
      this.bodyText.setText(this.fullText);
      this.typing = false;
      this.arrow.setVisible(true);
      return;
    }
    this.dlgIndex++;
    this.runStep();
  }

  // ---------------------------------------------------------------- Toast
  private buildToast(): void {
    this.toastBg = this.add.rectangle(GAME_W / 2, 34, 10, 16, 0x1a1a22, 0.92).setStrokeStyle(1, 0xe6c45a).setDepth(700).setVisible(false);
    this.toastText = this.add
      .text(GAME_W / 2, 34, '', { fontFamily: FONT, fontSize: '8px', color: '#f4ecd8', align: 'center' })
      .setOrigin(0.5)
      .setResolution(TEXT_RES)
      .setDepth(701)
      .setVisible(false);
    this.banner = this.add
      .text(GAME_W / 2, 64, '', { fontFamily: FONT, fontSize: '13px', color: '#f4ecd8', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setResolution(TEXT_RES)
      .setDepth(702)
      .setAlpha(0);
    this.banner.setShadow(1, 1, '#000000', 2, true, true);
  }

  private toast(text: string, kind = 'info'): void {
    this.toastQueue.push({ text, kind });
    if (!this.toastBg.visible) this.nextToast();
  }

  private nextToast(): void {
    const t = this.toastQueue.shift();
    if (!t) {
      this.toastBg.setVisible(false);
      this.toastText.setVisible(false);
      return;
    }
    this.toastText.setText(t.text).setVisible(true);
    this.toastBg.setSize(this.toastText.width + 16, this.toastText.height + 8).setVisible(true);
    this.toastBg.setStrokeStyle(1, t.kind === 'journal' ? 0x8b5cf6 : t.kind === 'item' ? 0x2ab7a9 : 0xe6c45a);
    if (t.kind === 'journal') sfx.pickup();
    this.toastTimer?.remove();
    this.toastTimer = this.time.delayedCall(2600, () => this.nextToast());
  }

  // -------------------------------------------------------------- Caderno
  private buildJournal(): void {
    this.journal = this.add.container(0, 0).setDepth(800).setVisible(false);
    const bg = this.add.rectangle(10, 10, GAME_W - 20, GAME_H - 20, 0xf4ecd8, 0.98).setOrigin(0).setStrokeStyle(2, 0x6b5c3e);
    const title = this.add.text(20, 16, 'CADERNO', { fontFamily: FONT, fontSize: '11px', color: '#6b5c3e', fontStyle: 'bold' }).setResolution(TEXT_RES);
    const sep = this.add.rectangle(150, 32, 1, GAME_H - 56, 0xc9b99a).setOrigin(0);
    const foot = this.add
      .text(GAME_W / 2, GAME_H - 16, '←/→ página · ↑/↓ rolar · C fechar', { fontFamily: FONT, fontSize: '7px', color: '#8a7a5a' })
      .setOrigin(0.5, 1)
      .setResolution(TEXT_RES);
    this.jTitle = this.add.text(160, 18, '', { fontFamily: FONT, fontSize: '10px', color: '#1a1a22', fontStyle: 'bold', wordWrap: { width: 290 } }).setResolution(TEXT_RES);
    this.jMeta = this.add.text(160, 31, '', { fontFamily: FONT, fontSize: '7px', color: '#8a7a5a' }).setResolution(TEXT_RES);
    this.jBody = this.add
      .text(160, 44, '', { fontFamily: FONT, fontSize: '8px', color: '#1a1a22', wordWrap: { width: 296 }, lineSpacing: 3 })
      .setResolution(TEXT_RES);
    this.jBodyMask = this.make.graphics({ x: 0, y: 0 }, false);
    this.jBodyMask.fillRect(156, 42, 310, GAME_H - 82);
    this.jBody.setMask(this.jBodyMask.createGeometryMask());
    this.jEmpty = this.add
      .text(GAME_W / 2 + 60, GAME_H / 2, 'Nenhuma página ainda.\nAs páginas aparecem quando você faz algo no mundo.', {
        fontFamily: FONT,
        fontSize: '8px',
        color: '#8a7a5a',
        align: 'center',
      })
      .setOrigin(0.5)
      .setResolution(TEXT_RES);
    const resumao = this.add
      .text(GAME_W - 76, 18, '[ Resumão ]', { fontFamily: FONT, fontSize: '8px', color: '#8b5cf6' })
      .setOrigin(1, 0)
      .setResolution(TEXT_RES)
      .setInteractive()
      .on('pointerdown', () => openResumao());
    const close = this.add
      .text(GAME_W - 22, 18, '[ fechar ]', { fontFamily: FONT, fontSize: '8px', color: '#6b5c3e' })
      .setOrigin(1, 0)
      .setResolution(TEXT_RES)
      .setInteractive()
      .on('pointerdown', () => this.toggleJournal());
    this.journal.add([bg, title, sep, foot, this.jTitle, this.jMeta, this.jBody, this.jEmpty, resumao, close]);
  }

  private journalPages(): string[] {
    return CONCEPTS.filter((c) => state.journal.has(c.id)).map((c) => c.id);
  }

  toggleJournal(): void {
    if (this.dlgOpen || this.pauseOpen) return;
    this.journalOpen = !this.journalOpen;
    this.journal.setVisible(this.journalOpen);
    this.blocking = this.journalOpen;
    if (this.journalOpen) {
      bus.emit('journal:open');
      this.journalScroll = 0;
      this.renderJournal();
      sfx.select();
    } else bus.emit('journal:close');
  }

  openJournalAt(id: string): void {
    const pages = this.journalPages();
    const i = pages.indexOf(id);
    if (i >= 0) this.journalIdx = i;
    if (!this.journalOpen) this.toggleJournal();
    else this.renderJournal();
  }

  private renderJournal(): void {
    const pages = this.journalPages();
    this.jList.forEach((t) => t.destroy());
    this.jList = [];
    this.journalIdx = Phaser.Math.Clamp(this.journalIdx, 0, Math.max(0, pages.length - 1));
    pages.forEach((id, i) => {
      const c = CONCEPT_BY_ID[id];
      const t = this.add
        .text(20, 34 + i * 14, (i === this.journalIdx ? '▶ ' : '  ') + c.title, {
          fontFamily: FONT,
          fontSize: '7px',
          color: i === this.journalIdx ? '#8b5cf6' : '#1a1a22',
          wordWrap: { width: 124 },
        })
        .setResolution(TEXT_RES)
        .setInteractive()
        .on('pointerdown', () => {
          this.journalIdx = i;
          this.journalScroll = 0;
          this.renderJournal();
        });
      this.journal.add(t);
      this.jList.push(t);
    });
    const empty = pages.length === 0;
    this.jEmpty.setVisible(empty);
    this.jTitle.setVisible(!empty);
    this.jMeta.setVisible(!empty);
    this.jBody.setVisible(!empty);
    if (empty) return;
    const c = CONCEPT_BY_ID[pages[this.journalIdx]];
    const e = state.journal.get(c.id)!;
    this.jTitle.setText(c.title);
    this.jMeta.setText(`${c.area} · ${c.page}`);
    const did = e.did.length ? e.did.map((d) => '• ' + d).join('\n') : '• (ainda nada)';
    let body = `O QUE VOCÊ FEZ\n${did}\n\nNO LIVRO\n${c.book}`;
    if (e.mine) body += `\n\nCOM AS MINHAS PALAVRAS\n${e.mine}`;
    this.jBody.setText(body).setY(44 - this.journalScroll);
  }

  // ---------------------------------------------------------------- Pausa
  private buildPause(): void {
    this.pause = this.add.container(0, 0).setDepth(850).setVisible(false);
    const bg = this.add.rectangle(GAME_W / 2, GAME_H / 2, 200, 120, 0x101018, 0.96).setStrokeStyle(1, 0xd8d0c0);
    const title = this.add.text(GAME_W / 2, GAME_H / 2 - 48, 'PAUSA', { fontFamily: FONT, fontSize: '10px', color: '#e6c45a', fontStyle: 'bold' }).setOrigin(0.5).setResolution(TEXT_RES);
    this.pause.add([bg, title]);
    const labels = ['Continuar', 'Som: desligado', 'Caderno', 'Resumão (imprimir)', 'Salvar e voltar ao título'];
    labels.forEach((l, i) => {
      const t = this.add
        .text(GAME_W / 2, GAME_H / 2 - 28 + i * 15, l, { fontFamily: FONT, fontSize: '8px', color: '#f4ecd8' })
        .setOrigin(0.5)
        .setResolution(TEXT_RES)
        .setInteractive()
        .on('pointerdown', () => {
          this.pauseIdx = i;
          this.pausePick();
        });
      this.pauseTexts.push(t);
      this.pause.add(t);
    });
  }

  private togglePause(): void {
    if (this.dlgOpen || this.journalOpen) return;
    this.pauseOpen = !this.pauseOpen;
    this.pause.setVisible(this.pauseOpen);
    this.blocking = this.pauseOpen;
    if (this.pauseOpen) {
      this.pauseIdx = 0;
      this.renderPause();
      bus.emit('pause:open');
    } else bus.emit('pause:close');
  }

  private renderPause(): void {
    this.pauseTexts.forEach((t, i) => {
      const base = i === 1 ? `Som: ${state.soundOn ? 'ligado' : 'desligado'}` : t.text.replace(/^▶ /, '');
      t.setText((i === this.pauseIdx ? '▶ ' : '') + base);
      t.setColor(i === this.pauseIdx ? '#e6c45a' : '#f4ecd8');
    });
  }

  private pausePick(): void {
    switch (this.pauseIdx) {
      case 0:
        this.togglePause();
        break;
      case 1:
        state.soundOn = !state.soundOn;
        sfx.select();
        this.renderPause();
        break;
      case 2:
        this.togglePause();
        this.toggleJournal();
        break;
      case 3:
        openResumao();
        break;
      case 4:
        state.save();
        this.togglePause();
        bus.emit('go:title');
        break;
    }
  }

  // ---------------------------------------------------------------- Toque
  private buildTouch(): void {
    const isTouch = this.sys.game.device.input.touch || new URLSearchParams(location.search).has('touch');
    if (!isTouch) return;
    this.input.addPointer(3);
    this.touchUI = this.add.container(0, 0).setDepth(450);
    this.stickBase = this.add.circle(58, GAME_H - 56, 30, 0xffffff, 0.12).setStrokeStyle(1, 0xffffff, 0.35);
    this.stickKnob = this.add.circle(58, GAME_H - 56, 13, 0xffffff, 0.3);
    this.touchUI.add([this.stickBase, this.stickKnob]);
    const mkBtn = (x: number, y: number, r: number, label: string, b: Button) => {
      const c = this.add.circle(x, y, r, 0xffffff, 0.14).setStrokeStyle(1, 0xffffff, 0.4).setInteractive();
      const t = this.add.text(x, y, label, { fontFamily: FONT, fontSize: '9px', color: '#ffffff' }).setOrigin(0.5).setResolution(TEXT_RES).setAlpha(0.8);
      c.on('pointerdown', () => {
        input.pressTouch(b);
        c.setFillStyle(0xffffff, 0.35);
      });
      const up = () => {
        input.releaseTouch(b);
        c.setFillStyle(0xffffff, 0.14);
      };
      c.on('pointerup', up).on('pointerout', up);
      this.touchUI!.add([c, t]);
    };
    mkBtn(GAME_W - 46, GAME_H - 58, 18, 'A', 'A');
    mkBtn(GAME_W - 86, GAME_H - 40, 14, 'B', 'B');
    mkBtn(GAME_W - 30, GAME_H - 104, 12, 'C', 'C');
    mkBtn(GAME_W - 64, 14, 9, 'II', 'ESC');
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.x < GAME_W / 2 && p.y > GAME_H / 2 && this.stickPointer === null && !this.blocking) this.stickPointer = p.id;
    });
    const end = (p: Phaser.Input.Pointer) => {
      if (p.id === this.stickPointer) {
        this.stickPointer = null;
        input.touch.x = 0;
        input.touch.y = 0;
        this.stickKnob!.setPosition(this.stickBase!.x, this.stickBase!.y);
      }
    };
    this.input.on('pointerup', end);
    this.input.on('pointerupoutside', end);
  }

  private updateStick(): void {
    if (this.stickPointer === null || !this.stickBase || !this.stickKnob) return;
    const p = this.input.manager.pointers.find((pp) => pp.id === this.stickPointer);
    if (!p || !p.isDown) {
      this.stickPointer = null;
      input.touch.x = 0;
      input.touch.y = 0;
      this.stickKnob.setPosition(this.stickBase.x, this.stickBase.y);
      return;
    }
    const dx = p.x - this.stickBase.x;
    const dy = p.y - this.stickBase.y;
    const len = Math.hypot(dx, dy);
    const max = 26;
    const k = len > max ? max / len : 1;
    this.stickKnob.setPosition(this.stickBase.x + dx * k, this.stickBase.y + dy * k);
    const dead = 6;
    if (len < dead) {
      input.touch.x = 0;
      input.touch.y = 0;
    } else {
      input.touch.x = (dx / len) * Math.min(1, (len - dead) / (max - dead));
      input.touch.y = (dy / len) * Math.min(1, (len - dead) / (max - dead));
    }
  }

  // --------------------------------------------------------------- Update
  override update(_time: number, delta: number): void {
    this.updateStick();
    if (this.dlgOpen) {
      if (this.typing) {
        this.typeAcc += delta;
        const chars = Math.floor(this.typeAcc / 22);
        if (chars > 0) {
          this.typeAcc -= chars * 22;
          const before = this.shown;
          this.shown = Math.min(this.fullText.length, this.shown + chars);
          this.bodyText.setText(this.fullText.slice(0, this.shown));
          if (this.shown !== before && this.shown % 3 === 0) sfx.blip();
          if (this.shown >= this.fullText.length) {
            this.typing = false;
            this.arrow.setVisible(true);
          }
        }
      }
      if (this.choices) {
        if (input.justDown('UP')) {
          this.choiceIdx = (this.choiceIdx + this.choices.length - 1) % this.choices.length;
          this.renderChoices();
          input.consume('UP');
        } else if (input.justDown('DOWN')) {
          this.choiceIdx = (this.choiceIdx + 1) % this.choices.length;
          this.renderChoices();
          input.consume('DOWN');
        }
      }
      if (input.justDown('A')) {
        input.consume('A');
        this.pressA();
      }
    } else if (this.journalOpen) {
      const pages = this.journalPages();
      if (input.justDown('LEFT') && pages.length) {
        this.journalIdx = (this.journalIdx + pages.length - 1) % pages.length;
        this.journalScroll = 0;
        this.renderJournal();
        input.consume('LEFT');
      } else if (input.justDown('RIGHT') && pages.length) {
        this.journalIdx = (this.journalIdx + 1) % pages.length;
        this.journalScroll = 0;
        this.renderJournal();
        input.consume('RIGHT');
      }
      if (input.down('DOWN')) {
        const maxScroll = Math.max(0, this.jBody.height - (GAME_H - 86));
        this.journalScroll = Math.min(maxScroll, this.journalScroll + delta * 0.08);
        this.jBody.setY(44 - this.journalScroll);
      } else if (input.down('UP')) {
        this.journalScroll = Math.max(0, this.journalScroll - delta * 0.08);
        this.jBody.setY(44 - this.journalScroll);
      }
      if (input.justDown('C') || input.justDown('ESC') || input.justDown('B')) {
        input.consume('C');
        input.consume('ESC');
        input.consume('B');
        this.toggleJournal();
      }
    } else if (this.pauseOpen) {
      if (input.justDown('UP')) {
        this.pauseIdx = (this.pauseIdx + 4) % 5;
        this.renderPause();
        input.consume('UP');
      } else if (input.justDown('DOWN')) {
        this.pauseIdx = (this.pauseIdx + 1) % 5;
        this.renderPause();
        input.consume('DOWN');
      }
      if (input.justDown('A')) {
        input.consume('A');
        this.pausePick();
      }
      if (input.justDown('ESC')) {
        input.consume('ESC');
        this.togglePause();
      }
    } else {
      if (input.justDown('C')) {
        input.consume('C');
        this.toggleJournal();
      } else if (input.justDown('ESC')) {
        input.consume('ESC');
        this.togglePause();
      }
    }
    input.endFrame();
  }
}
