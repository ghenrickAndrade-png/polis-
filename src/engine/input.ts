import Phaser from 'phaser';

export type Button = 'A' | 'B' | 'C' | 'ESC' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'DEBUG';

/**
 * Entrada unificada: teclado + controles de toque (a UI escreve em `touch`).
 * A = Z/Enter/Espaço (interagir/atacar), B = X (item), C = C (Caderno), ESC = pausa.
 */
class InputHub {
  private keys: Partial<Record<Button, Phaser.Input.Keyboard.Key[]>> = {};
  touch = { x: 0, y: 0, pressed: new Set<Button>(), justPressed: new Set<Button>() };
  private consumed = new Set<Button>();
  ready = false;

  bind(scene: Phaser.Scene): void {
    const kb = scene.input.keyboard;
    if (!kb) return;
    const K = Phaser.Input.Keyboard.KeyCodes;
    const add = (codes: number[]) => codes.map((c) => kb.addKey(c, false));
    this.keys = {
      A: add([K.Z, K.ENTER, K.SPACE, K.J]),
      B: add([K.X, K.SHIFT, K.K]),
      C: add([K.C, K.TAB, K.L]),
      ESC: add([K.ESC, K.P]),
      UP: add([K.UP, K.W]),
      DOWN: add([K.DOWN, K.S]),
      LEFT: add([K.LEFT, K.A]),
      RIGHT: add([K.RIGHT, K.D]),
      DEBUG: add([K.F2]),
    };
    // Evita rolagem da página com setas/espaço quando o jogo tem foco
    kb.addCapture([K.UP, K.DOWN, K.LEFT, K.RIGHT, K.SPACE, K.TAB]);
    this.ready = true;
  }

  /** Vetor de movimento normalizado (-1..1). */
  axis(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.down('LEFT')) x -= 1;
    if (this.down('RIGHT')) x += 1;
    if (this.down('UP')) y -= 1;
    if (this.down('DOWN')) y += 1;
    if (x === 0 && y === 0) {
      x = this.touch.x;
      y = this.touch.y;
    }
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  down(b: Button): boolean {
    if (this.touch.pressed.has(b)) return true;
    const ks = this.keys[b];
    return !!ks && ks.some((k) => k.isDown);
  }

  /** Verdadeiro uma vez por pressionamento (compartilhado entre cenas no mesmo frame via `consume`). */
  justDown(b: Button): boolean {
    if (this.consumed.has(b)) return false;
    if (this.touch.justPressed.has(b)) return true;
    const ks = this.keys[b];
    if (!ks) return false;
    // avalia todas (sem curto-circuito) para não deixar JustDown pendente em outra tecla
    return ks.map((k) => Phaser.Input.Keyboard.JustDown(k)).some(Boolean);
  }

  /** Marca o botão como consumido neste frame (a UI chama quando trata o botão). */
  consume(b: Button): void {
    this.consumed.add(b);
    // JustDown do teclado já zera; para toque, limpamos agora
    this.touch.justPressed.delete(b);
  }

  /** Chamado uma vez por frame (pela UI, que atualiza por último) para limpar o estado de toque. */
  endFrame(): void {
    this.consumed.clear();
    this.touch.justPressed.clear();
  }

  pressTouch(b: Button): void {
    if (!this.touch.pressed.has(b)) this.touch.justPressed.add(b);
    this.touch.pressed.add(b);
  }

  releaseTouch(b: Button): void {
    this.touch.pressed.delete(b);
  }
}

export const input = new InputHub();
