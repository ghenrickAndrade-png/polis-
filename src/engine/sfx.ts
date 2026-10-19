import { state } from './state';

/** Efeitos sonoros gerados em código (WebAudio). Desligados por padrão. */
class Sfx {
  private ctx: AudioContext | null = null;

  private ensure(): AudioContext | null {
    if (!state.soundOn) return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, dur: number, type: OscillatorType = 'square', gain = 0.05, slide = 0): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  }

  blip(): void {
    this.tone(880, 0.04, 'square', 0.03);
  }
  select(): void {
    this.tone(660, 0.08, 'square', 0.04, 220);
  }
  pickup(): void {
    this.tone(523, 0.1, 'square', 0.05, 400);
    setTimeout(() => this.tone(784, 0.15, 'square', 0.05, 300), 90);
  }
  door(): void {
    this.tone(220, 0.25, 'triangle', 0.06, -100);
  }
  hit(): void {
    this.tone(160, 0.15, 'sawtooth', 0.06, -80);
  }
  hurt(): void {
    this.tone(110, 0.3, 'sawtooth', 0.07, -60);
  }
  thread(): void {
    this.tone(1046, 0.12, 'sine', 0.05, 200);
  }
  fray(): void {
    this.tone(300, 0.3, 'sawtooth', 0.04, -200);
  }
  success(): void {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.2, 'square', 0.05), i * 90));
  }
  swing(): void {
    this.tone(500, 0.08, 'sawtooth', 0.03, -300);
  }
}

export const sfx = new Sfx();
