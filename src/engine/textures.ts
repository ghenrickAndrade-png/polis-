import Phaser from 'phaser';
import { PAL, TILE } from '../config';

import { LOOKS, type Look } from '../content/looks';
export { LOOKS, type Look };

// ---------------------------------------------------------------------------
// Personagens: padrões 16x16 (H cabelo, S pele, E olho, T camisa, P calça, B bota, G óculos)
// ---------------------------------------------------------------------------
const DOWN = [
  '................',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '....HHSSSSHH....',
  '....HSESSESH....',
  '.....SSSSSS.....',
  '......SSSS......',
  '....TTTTTTTT....',
  '...STTTTTTTTS...',
  '...STTTTTTTTS...',
  '....TTTTTTTT....',
  '.....PPPPPP.....',
  '.....PP..PP.....',
  '.....PP..PP.....',
  '.....BB..BB.....',
  '................',
];
const UP = [
  '................',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '....HHHHHHHH....',
  '....HHHHHHHH....',
  '.....HHHHHH.....',
  '......SSSS......',
  '....TTTTTTTT....',
  '...STTTTTTTTS...',
  '...STTTTTTTTS...',
  '....TTTTTTTT....',
  '.....PPPPPP.....',
  '.....PP..PP.....',
  '.....PP..PP.....',
  '.....BB..BB.....',
  '................',
];
const SIDE = [
  '................',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '....HHHHSSSS....',
  '....HHHSSESS....',
  '.....HSSSSSS....',
  '......SSSS......',
  '.....TTTTTT.....',
  '.....TTTTTTS....',
  '.....TTTTTTS....',
  '.....TTTTTT.....',
  '.....PPPPPP.....',
  '.....PP.PP......',
  '.....PP.PP......',
  '.....BB.BB......',
  '................',
];

/** Quadros de caminhada: trocam só as pernas (linhas 11–14). */
function legsFrames(base: string[], side: boolean): string[][] {
  const f0 = base;
  const f1 = base.slice();
  const f2 = base.slice();
  if (!side) {
    f1[12] = '.....PP..PP.....';
    f1[13] = '.....BB..PP.....';
    f1[14] = '.........BB.....';
    f2[12] = '.....PP..PP.....';
    f2[13] = '.....PP..BB.....';
    f2[14] = '.....BB.........';
  } else {
    f1[12] = '....PP...PP.....';
    f1[13] = '....PP...PP.....';
    f1[14] = '....BB...BB.....';
    f2[12] = '......PPPP......';
    f2[13] = '......PPPP......';
    f2[14] = '......BBBB......';
  }
  return [f0, f1, f2];
}

function withGlasses(rows: string[], dir: 'down' | 'side'): string[] {
  const r = rows.slice();
  if (dir === 'down') r[4] = '....HGGSSGGH....';
  else r[4] = '....HHHSGEGS....';
  return r;
}

export function paintPattern(
  scene: Phaser.Scene,
  key: string,
  rows: string[],
  pal: Record<string, string>,
): void {
  if (scene.textures.exists(key)) return;
  const h = rows.length;
  const w = rows[0].length;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = rows[y][x];
      if (c === '.' || c === ' ') continue;
      const col = pal[c];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

export function ensureCharacter(scene: Phaser.Scene, id: string, look: Look): void {
  if (scene.textures.exists(`${id}_down_0`)) return;
  const pal: Record<string, string> = {
    H: look.hair,
    S: look.skin,
    E: '#1a1a1a',
    T: look.shirt,
    P: look.pants,
    B: '#1f1f1f',
    G: look.glasses ?? '#1a1a1a',
  };
  const down = look.glasses ? withGlasses(DOWN, 'down') : DOWN;
  const side = look.glasses ? withGlasses(SIDE, 'side') : SIDE;
  const sets: Record<string, string[][]> = {
    down: legsFrames(down, false),
    up: legsFrames(UP, false),
    side: legsFrames(side, true),
  };
  for (const [dir, frames] of Object.entries(sets)) {
    frames.forEach((rows, i) => paintPattern(scene, `${id}_${dir}_${i}`, rows, pal));
    const walkKey = `${id}_walk_${dir}`;
    if (!scene.anims.exists(walkKey)) {
      scene.anims.create({
        key: walkKey,
        frames: [{ key: `${id}_${dir}_1` }, { key: `${id}_${dir}_0` }, { key: `${id}_${dir}_2` }, { key: `${id}_${dir}_0` }],
        frameRate: 8,
        repeat: -1,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Tileset procedural
// ---------------------------------------------------------------------------
import { LEGEND, SOLID_TILES, T } from './tiles';
export { LEGEND, SOLID_TILES, T };

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

type Ctx = CanvasRenderingContext2D;

function fill(ctx: Ctx, ox: number, oy: number, col: string, x: number, y: number, w = 1, h = 1): void {
  ctx.fillStyle = col;
  ctx.fillRect(ox + x, oy + y, w, h);
}

function specks(ctx: Ctx, ox: number, oy: number, base: string, cols: string[], n: number, seed: number): void {
  fill(ctx, ox, oy, base, 0, 0, TILE, TILE);
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * TILE);
    const y = Math.floor(r() * TILE);
    fill(ctx, ox, oy, cols[Math.floor(r() * cols.length)], x, y, 1 + Math.floor(r() * 2), 1);
  }
}

const TILE_PAINTERS: Record<number, (ctx: Ctx, ox: number, oy: number) => void> = {
  [T.grass]: (c, x, y) => specks(c, x, y, PAL.grass, [PAL.grassLight, PAL.grassDark], 14, 7),
  [T.flower]: (c, x, y) => {
    specks(c, x, y, PAL.grass, [PAL.grassLight, PAL.grassDark], 10, 11);
    fill(c, x, y, '#f2d84a', 3, 4);
    fill(c, x, y, '#ffffff', 10, 9);
    fill(c, x, y, '#f08aa0', 6, 12);
    fill(c, x, y, '#f2d84a', 12, 3);
  },
  [T.path]: (c, x, y) => specks(c, x, y, PAL.path, [PAL.pathDark, '#d8b67a'], 12, 3),
  [T.sand]: (c, x, y) => specks(c, x, y, PAL.sand, [PAL.sandDark, '#f4ebbf'], 10, 5),
  [T.water]: (c, x, y) => {
    fill(c, x, y, PAL.water, 0, 0, TILE, TILE);
    fill(c, x, y, PAL.waterLight, 2, 3, 5, 1);
    fill(c, x, y, PAL.waterLight, 9, 10, 5, 1);
    fill(c, x, y, PAL.waterDark, 1, 12, 4, 1);
    fill(c, x, y, PAL.waterDark, 10, 5, 4, 1);
  },
  [T.deep]: (c, x, y) => {
    fill(c, x, y, PAL.waterDark, 0, 0, TILE, TILE);
    fill(c, x, y, PAL.water, 3, 6, 4, 1);
    fill(c, x, y, PAL.water, 10, 13, 4, 1);
  },
  [T.wall]: (c, x, y) => {
    fill(c, x, y, PAL.wall, 0, 0, TILE, TILE);
    fill(c, x, y, PAL.wallDark, 0, 7, TILE, 1);
    fill(c, x, y, PAL.wallDark, 0, 15, TILE, 1);
    fill(c, x, y, PAL.wallDark, 7, 0, 1, 7);
    fill(c, x, y, PAL.wallDark, 3, 8, 1, 7);
    fill(c, x, y, PAL.wallDark, 11, 8, 1, 7);
    fill(c, x, y, PAL.wallLight, 0, 0, TILE, 1);
    fill(c, x, y, PAL.wallLight, 0, 8, TILE, 1);
  },
  [T.wallTop]: (c, x, y) => {
    fill(c, x, y, PAL.wallDark, 0, 0, TILE, TILE);
    fill(c, x, y, PAL.wall, 2, 2, 12, 12);
    fill(c, x, y, PAL.wallLight, 2, 2, 12, 1);
  },
  [T.floor]: (c, x, y) => {
    fill(c, x, y, PAL.floor, 0, 0, TILE, TILE);
    fill(c, x, y, PAL.floorDark, 0, 0, TILE, 1);
    fill(c, x, y, PAL.floorDark, 0, 0, 1, TILE);
    fill(c, x, y, PAL.floorLight, 2, 2, 5, 1);
  },
  [T.wood]: (c, x, y) => {
    fill(c, x, y, PAL.wood, 0, 0, TILE, TILE);
    fill(c, x, y, PAL.woodDark, 0, 3, TILE, 1);
    fill(c, x, y, PAL.woodDark, 0, 8, TILE, 1);
    fill(c, x, y, PAL.woodDark, 0, 13, TILE, 1);
    fill(c, x, y, PAL.woodLight, 2, 5, 6, 1);
    fill(c, x, y, PAL.woodLight, 9, 10, 5, 1);
  },
  [T.rock]: (c, x, y) => {
    specks(c, x, y, PAL.grass, [PAL.grassDark], 6, 19);
    fill(c, x, y, PAL.rockDark, 2, 4, 12, 10);
    fill(c, x, y, PAL.rock, 3, 3, 10, 9);
    fill(c, x, y, '#b0b0b0', 4, 4, 4, 2);
  },
  [T.cliff]: (c, x, y) => {
    fill(c, x, y, PAL.cliff, 0, 0, TILE, TILE);
    fill(c, x, y, PAL.cliffDark, 0, 0, TILE, 2);
    fill(c, x, y, PAL.cliffDark, 4, 6, 1, 6);
    fill(c, x, y, PAL.cliffDark, 11, 4, 1, 8);
  },
  [T.bridge]: (c, x, y) => {
    fill(c, x, y, PAL.water, 0, 0, TILE, TILE);
    fill(c, x, y, PAL.wood, 0, 1, TILE, 14);
    fill(c, x, y, PAL.woodDark, 0, 5, TILE, 1);
    fill(c, x, y, PAL.woodDark, 0, 10, TILE, 1);
    fill(c, x, y, PAL.woodLight, 0, 1, TILE, 1);
  },
  [T.doorClosed]: (c, x, y) => {
    fill(c, x, y, PAL.wallDark, 0, 0, TILE, TILE);
    fill(c, x, y, PAL.woodDark, 2, 1, 12, 15);
    fill(c, x, y, PAL.wood, 3, 2, 10, 13);
    fill(c, x, y, PAL.woodDark, 8, 2, 1, 13);
    fill(c, x, y, PAL.gold, 10, 8, 2, 2);
  },
  [T.doorOpen]: (c, x, y) => {
    fill(c, x, y, PAL.wallDark, 0, 0, TILE, TILE);
    fill(c, x, y, PAL.night, 2, 1, 12, 15);
    fill(c, x, y, '#2a2a3a', 4, 3, 8, 13);
  },
  [T.void]: (c, x, y) => fill(c, x, y, PAL.night, 0, 0, TILE, TILE),
  [T.carpet]: (c, x, y) => {
    fill(c, x, y, '#8a2a3a', 0, 0, TILE, TILE);
    fill(c, x, y, '#963646', 1, 1, 14, 14);
    fill(c, x, y, '#a84a58', 3, 3, 10, 1);
    fill(c, x, y, '#a84a58', 3, 12, 10, 1);
  },
  [T.cobble]: (c, x, y) => {
    fill(c, x, y, '#c4bcaa', 0, 0, TILE, TILE);
    fill(c, x, y, '#b2aa98', 0, 15, TILE, 1);
    fill(c, x, y, '#b2aa98', 15, 0, 1, TILE);
    fill(c, x, y, '#d0c8b6', 2, 2, 4, 1);
    fill(c, x, y, '#b8b09e', 9, 10, 3, 1);
  },
  [T.dirt]: (c, x, y) => {
    specks(c, x, y, '#8a6a4a', ['#7a5a3a', '#9a7a5a'], 8, 23);
    fill(c, x, y, '#6e5236', 0, 3, TILE, 1);
    fill(c, x, y, '#6e5236', 0, 11, TILE, 1);
    fill(c, x, y, '#5f9a3a', 3, 1, 1, 2);
    fill(c, x, y, '#5f9a3a', 11, 9, 1, 2);
    fill(c, x, y, '#5f9a3a', 7, 1, 1, 2);
  },
  [T.fog]: (c, x, y) => fill(c, x, y, '#c0c0d0', 0, 0, TILE, TILE),
  [T.ice]: (c, x, y) => {
    fill(c, x, y, '#cfe8ff', 0, 0, TILE, TILE);
    fill(c, x, y, '#ffffff', 2, 3, 6, 1);
  },
};

export const TILE_COUNT = 21;

export function buildTileset(scene: Phaser.Scene): void {
  if (scene.textures.exists('tiles')) return;
  const tex = scene.textures.createCanvas('tiles', TILE * TILE_COUNT, TILE);
  if (!tex) return;
  const ctx = tex.getContext();
  for (let i = 0; i < TILE_COUNT; i++) {
    const painter = TILE_PAINTERS[i];
    if (painter) painter(ctx, i * TILE, 0);
    else fill(ctx, i * TILE, 0, '#ff00ff', 0, 0, TILE, TILE);
  }
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

// ---------------------------------------------------------------------------
// Props e ícones
// ---------------------------------------------------------------------------
const TREE = [
  '......LLLL......',
  '....LLLLLLLL....',
  '...LLLlLLLLLL...',
  '..LLlLLLLLLLLL..',
  '..LLLLLLLLlLLL..',
  '.LLLLLLlLLLLLLL.',
  '.LLLLLLLLLLLLLL.',
  '.LlLLLLLLLLLlLL.',
  '.LLLLLLLLLLLLLL.',
  '..LLLLLLLlLLLL..',
  '..dLLLLLLLLLLd..',
  '...ddLLLLLLdd...',
  '....dddddddd....',
  '......TTTT......',
  '......TtTT......',
  '......TTTT......',
  '......TtTT......',
  '.....TTTTTT.....',
];
const CRAB0 = [
  '.R........R.',
  '..R..RR..R..',
  '..RRRRRRRR..',
  '.RRERRRRERR.',
  '.RRRRRRRRRR.',
  '..RRRRRRRR..',
  '.R.R....R.R.',
  'R..R....R..R',
];
const CRAB1 = [
  '.R........R.',
  '..R..RR..R..',
  '..RRRRRRRR..',
  '.RRERRRRERR.',
  '.RRRRRRRRRR.',
  '..RRRRRRRR..',
  '..R.R..R.R..',
  '..R.R..R.R..',
];
const LENS = [
  '....GGGG....',
  '..GG....GG..',
  '.G..wwww..G.',
  '.G.w....w.G.',
  'G..w....w..G',
  'G..w....w..G',
  '.G..wwww..G.',
  '.G........G.',
  '..GG....GG..',
  '....GGGGGG..',
  '.........GG.',
  '..........GG',
];
const HEART = [
  '.RR..RR.',
  'RRRRRRRR',
  'RRRRRRRR',
  '.RRRRRR.',
  '..RRRR..',
  '...RR...',
];
const GEAR = [
  '....GG..GG....',
  '...GGGGGGGG...',
  '..GGGGGGGGGG..',
  '.GGGG....GGGG.',
  'GGGG......GGGG',
  'GGG........GGG',
  '.GG........GG.',
  '.GG........GG.',
  'GGG........GGG',
  'GGGG......GGGG',
  '.GGGG....GGGG.',
  '..GGGGGGGGGG..',
  '...GGGGGGGG...',
  '....GG..GG....',
];
const SLASH = [
  '..........WW..',
  '........WWWW..',
  '......WWWW....',
  '....WWWW......',
  '...WWW........',
  '..WWW.........',
  '.WWW..........',
  '.WW...........',
  'WW............',
];

function gfx(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

/** Depois de gerar as texturas por Graphics, aplica filtro NEAREST em todas as do jogo. */
function nearestAll(scene: Phaser.Scene, keys: string[]): void {
  for (const k of keys) scene.textures.get(k)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function hex(c: string): number {
  return Phaser.Display.Color.HexStringToColor(c).color;
}

export function buildProps(scene: Phaser.Scene): void {
  if (scene.textures.exists('tree')) return;
  paintPattern(scene, 'tree', TREE, { L: PAL.leaf, l: PAL.leafLight, d: PAL.leafDark, T: PAL.trunk, t: '#8a6a3a' });
  paintPattern(scene, 'crab_0', CRAB0, { R: '#d85a3a', E: '#1a1a1a' });
  paintPattern(scene, 'crab_1', CRAB1, { R: '#d85a3a', E: '#1a1a1a' });
  paintPattern(scene, 'lens', LENS, { G: PAL.gold, w: '#cfe8ff' });
  paintPattern(scene, 'heart', HEART, { R: PAL.red });
  paintPattern(scene, 'heart_empty', HEART, { R: '#3a2a2a' });
  paintPattern(scene, 'gear', GEAR, { G: '#c0a040' });
  paintPattern(scene, 'gear_dark', GEAR, { G: '#5a5a6a' });
  paintPattern(scene, 'slash', SLASH, { W: '#ffffff' });
  if (!scene.anims.exists('crab_walk')) {
    scene.anims.create({ key: 'crab_walk', frames: [{ key: 'crab_0' }, { key: 'crab_1' }], frameRate: 6, repeat: -1 });
  }

  // tronco caído (32x12)
  let g = gfx(scene);
  g.fillStyle(hex(PAL.woodDark)).fillRoundedRect(0, 2, 32, 10, 4);
  g.fillStyle(hex(PAL.wood)).fillRoundedRect(1, 1, 30, 8, 4);
  g.fillStyle(hex(PAL.woodDark)).fillRect(8, 2, 1, 6).fillRect(20, 2, 1, 6);
  g.fillStyle(hex(PAL.woodLight)).fillRect(3, 3, 6, 1).fillRect(14, 4, 8, 1);
  g.generateTexture('log', 32, 12);
  g.destroy();

  // pilha de madeira (16x12)
  g = gfx(scene);
  for (let i = 0; i < 3; i++) {
    g.fillStyle(hex(PAL.woodDark)).fillRect(1 + i * 5, 4, 5, 8);
    g.fillStyle(hex(PAL.wood)).fillRect(2 + i * 5, 5, 3, 6);
  }
  g.fillStyle(hex(PAL.woodDark)).fillRect(4, 0, 5, 5).fillStyle(hex(PAL.wood)).fillRect(5, 1, 3, 3);
  g.generateTexture('woodpile', 16, 12);
  g.destroy();

  // jangada (32x20)
  g = gfx(scene);
  g.fillStyle(hex(PAL.woodDark)).fillRect(0, 4, 32, 14);
  for (let i = 0; i < 6; i++) g.fillStyle(hex(i % 2 ? PAL.wood : PAL.woodLight)).fillRect(1, 5 + i * 2, 30, 2);
  g.fillStyle(hex(PAL.woodDark)).fillRect(15, 0, 2, 18);
  g.fillStyle(hex(PAL.paper)).fillTriangle(17, 0, 28, 8, 17, 10);
  g.generateTexture('raft', 32, 20);
  g.destroy();

  // pilar / nó público (16x28)
  g = gfx(scene);
  g.fillStyle(hex('#5a5a6a')).fillRect(1, 22, 14, 6);
  g.fillStyle(hex('#c8c0b0')).fillRect(3, 2, 10, 22);
  g.fillStyle(hex('#a8a090')).fillRect(11, 2, 2, 22).fillRect(3, 22, 10, 2);
  g.fillStyle(hex('#e8e0d0')).fillRect(2, 0, 12, 3);
  g.generateTexture('pillar', 16, 28);
  g.destroy();

  // pilar aceso (versão com topo dourado)
  g = gfx(scene);
  g.fillStyle(hex('#5a5a6a')).fillRect(1, 22, 14, 6);
  g.fillStyle(hex('#d8d0c0')).fillRect(3, 2, 10, 22);
  g.fillStyle(hex('#b8b0a0')).fillRect(11, 2, 2, 22).fillRect(3, 22, 10, 2);
  g.fillStyle(hex(PAL.gold)).fillRect(2, 0, 12, 3);
  g.generateTexture('pillar_lit', 16, 28);
  g.destroy();

  // placa (14x16)
  g = gfx(scene);
  g.fillStyle(hex(PAL.woodDark)).fillRect(6, 8, 2, 8);
  g.fillStyle(hex(PAL.woodDark)).fillRect(0, 0, 14, 10);
  g.fillStyle(hex(PAL.wood)).fillRect(1, 1, 12, 8);
  g.fillStyle(hex(PAL.woodDark)).fillRect(3, 3, 8, 1).fillRect(3, 6, 6, 1);
  g.generateTexture('sign', 14, 16);
  g.destroy();

  // placa de pedra (regra) (14x18)
  g = gfx(scene);
  g.fillStyle(hex('#4a4a5a')).fillRect(5, 12, 4, 6);
  g.fillStyle(hex('#8a8a9a')).fillRoundedRect(0, 0, 14, 13, 3);
  g.fillStyle(hex('#5a5a6a')).fillRect(3, 3, 8, 1).fillRect(3, 6, 8, 1).fillRect(3, 9, 5, 1);
  g.generateTexture('plaque', 14, 18);
  g.destroy();

  // placa questionável (vermelha)
  g = gfx(scene);
  g.fillStyle(hex('#4a4a5a')).fillRect(5, 12, 4, 6);
  g.fillStyle(hex('#c05050')).fillRoundedRect(0, 0, 14, 13, 3);
  g.fillStyle(hex('#ffffff')).fillRect(3, 3, 8, 1).fillRect(3, 6, 8, 1).fillRect(3, 9, 5, 1);
  g.generateTexture('plaque_q', 14, 18);
  g.destroy();

  // portão fechado / aberto (16x16)
  g = gfx(scene);
  g.fillStyle(hex('#3a3a4a')).fillRect(0, 0, 16, 16);
  for (let i = 0; i < 4; i++) g.fillStyle(hex('#8a8a9a')).fillRect(2 + i * 4, 0, 2, 16);
  g.fillStyle(hex('#8a8a9a')).fillRect(0, 3, 16, 2).fillRect(0, 11, 16, 2);
  g.generateTexture('gate', 16, 16);
  g.destroy();
  g = gfx(scene);
  g.fillStyle(hex('#8a8a9a')).fillRect(0, 0, 2, 16).fillRect(14, 0, 2, 16);
  g.generateTexture('gate_open', 16, 16);
  g.destroy();

  // pódio (24x14)
  g = gfx(scene);
  g.fillStyle(hex('#5a2a2a')).fillRect(0, 4, 24, 10);
  g.fillStyle(hex('#8a3a3a')).fillRect(2, 0, 20, 6);
  g.fillStyle(hex(PAL.gold)).fillRect(10, 6, 4, 2);
  g.generateTexture('podium', 24, 14);
  g.destroy();

  // pedestal (16x12)
  g = gfx(scene);
  g.fillStyle(hex('#5a5a6a')).fillRect(0, 6, 16, 6);
  g.fillStyle(hex('#9a9aaa')).fillRect(2, 0, 12, 8);
  g.fillStyle(hex('#c8c8d8')).fillRect(2, 0, 12, 2);
  g.generateTexture('pedestal', 16, 12);
  g.destroy();

  // baú (16x14)
  g = gfx(scene);
  g.fillStyle(hex(PAL.woodDark)).fillRect(0, 2, 16, 12);
  g.fillStyle(hex(PAL.wood)).fillRect(1, 3, 14, 10);
  g.fillStyle(hex(PAL.gold)).fillRect(7, 6, 2, 3).fillRect(0, 7, 16, 1);
  g.generateTexture('chest', 16, 14);
  g.destroy();

  // projétil (6x6) e marcador (!)
  g = gfx(scene);
  g.fillStyle(hex('#ff6a4a')).fillCircle(3, 3, 3).fillStyle(hex('#ffd0a0')).fillCircle(3, 3, 1);
  g.generateTexture('shot', 6, 6);
  g.destroy();
  g = gfx(scene);
  g.fillStyle(hex(PAL.gold)).fillRect(2, 0, 2, 5).fillRect(2, 6, 2, 2);
  g.generateTexture('marker', 6, 8);
  g.destroy();

  // névoa / wisp (12x12)
  g = gfx(scene);
  g.fillStyle(hex('#b0b0c8')).fillCircle(6, 6, 6).fillStyle(hex('#e0e0f0')).fillCircle(5, 5, 3);
  g.fillStyle(hex('#3a3a5a')).fillRect(3, 5, 2, 2).fillRect(7, 5, 2, 2);
  g.generateTexture('wisp', 12, 12);
  g.destroy();

  // pixel branco e sombra
  g = gfx(scene);
  g.fillStyle(0xffffff).fillRect(0, 0, 1, 1);
  g.generateTexture('px', 1, 1);
  g.destroy();
  g = gfx(scene);
  g.fillStyle(0x000000, 0.35).fillEllipse(6, 3, 12, 5);
  g.generateTexture('shadow', 12, 6);
  g.destroy();

  // casa (fachada 48x40) e escola (64x40) — blocos simples com telhado
  const house = (key: string, w: number, h: number, wall: string, roof: string, label?: boolean) => {
    const gg = gfx(scene);
    gg.fillStyle(hex(roof)).fillRect(0, 0, w, 12);
    gg.fillStyle(hex('#3a2a1a')).fillRect(0, 12, w, 1);
    gg.fillStyle(hex(wall)).fillRect(2, 13, w - 4, h - 13);
    gg.fillStyle(hex('#3a2a1a')).fillRect(2, 13, 1, h - 13).fillRect(w - 3, 13, 1, h - 13);
    gg.fillStyle(hex('#5a3a1a')).fillRect(w / 2 - 6, h - 16, 12, 16);
    gg.fillStyle(hex('#7cb2ff')).fillRect(8, 18, 8, 8).fillRect(w - 16, 18, 8, 8);
    if (label) gg.fillStyle(hex(PAL.paper)).fillRect(w / 2 - 14, 2, 28, 8);
    gg.generateTexture(key, w, h);
    gg.destroy();
  };
  house('house_a', 48, 40, '#d8c8a8', '#a04040');
  house('house_b', 48, 40, '#c8d8e8', '#4060a0');
  house('school', 64, 44, '#f0e0c0', '#6a4a8a', true);
  house('temple_face', 64, 36, '#6b6b7c', '#4b4b5c');
  // casinha da periferia (24x22): telhado de laje, parede de tijolo
  g = gfx(scene);
  g.fillStyle(hex('#8a5a3a')).fillRect(0, 0, 24, 6);
  g.fillStyle(hex('#b87a5a')).fillRect(1, 6, 22, 16);
  g.fillStyle(hex('#3a2a1a')).fillRect(1, 6, 1, 16).fillRect(22, 6, 1, 16).fillRect(0, 6, 24, 1);
  g.fillStyle(hex('#5a3a1a')).fillRect(9, 12, 6, 10);
  g.fillStyle(hex('#7cb2ff')).fillRect(3, 10, 4, 4).fillRect(17, 10, 4, 4);
  g.generateTexture('shack', 24, 22);
  g.destroy();
  // predinho do centro (32x44)
  g = gfx(scene);
  g.fillStyle(hex('#d0d0dc')).fillRect(0, 0, 32, 44);
  g.fillStyle(hex('#9a9aaa')).fillRect(0, 0, 32, 3).fillRect(0, 43, 32, 1);
  for (let yy = 6; yy < 36; yy += 8) g.fillStyle(hex('#7cb2ff')).fillRect(4, yy, 6, 5).fillRect(13, yy, 6, 5).fillRect(22, yy, 6, 5);
  g.fillStyle(hex('#3a3a4a')).fillRect(12, 34, 8, 10);
  g.generateTexture('tower_bld', 32, 44);
  g.destroy();

  // tocha apagada / acesa (10x20)
  g = gfx(scene);
  g.fillStyle(hex('#5a5a6a')).fillRect(3, 6, 4, 14);
  g.fillStyle(hex('#3a3a4a')).fillRect(2, 4, 6, 3);
  g.generateTexture('torch', 10, 20);
  g.destroy();
  g = gfx(scene);
  g.fillStyle(hex('#5a5a6a')).fillRect(3, 6, 4, 14);
  g.fillStyle(hex('#3a3a4a')).fillRect(2, 4, 6, 3);
  g.fillStyle(hex('#ff8a2a')).fillTriangle(5, -1, 1, 6, 9, 6);
  g.fillStyle(hex('#ffe28a')).fillTriangle(5, 2, 3, 6, 7, 6);
  g.generateTexture('torch_lit', 10, 20);
  g.destroy();

  // braseiro da Chama da Razão (20x16)
  g = gfx(scene);
  g.fillStyle(hex('#4a4a5a')).fillRect(2, 8, 16, 8);
  g.fillStyle(hex('#6a6a7a')).fillRect(0, 6, 20, 3);
  g.fillStyle(hex('#ff8a2a')).fillTriangle(10, -2, 4, 8, 16, 8);
  g.fillStyle(hex('#ffe28a')).fillTriangle(10, 2, 7, 8, 13, 8);
  g.generateTexture('brazier', 20, 16);
  g.destroy();

  // chave (12x6)
  g = gfx(scene);
  g.fillStyle(hex(PAL.gold)).fillCircle(3, 3, 3).fillRect(5, 2, 7, 2).fillRect(9, 4, 1, 2).fillRect(11, 4, 1, 2);
  g.generateTexture('key', 12, 6);
  g.destroy();

  // trono (24x28)
  g = gfx(scene);
  g.fillStyle(hex('#5a1a6a')).fillRect(2, 0, 20, 28);
  g.fillStyle(hex('#8a2a9a')).fillRect(4, 2, 16, 18);
  g.fillStyle(hex(PAL.gold)).fillRect(2, 0, 20, 2).fillRect(4, 20, 16, 2);
  g.generateTexture('throne', 24, 28);
  g.destroy();

  // altar (20x14) e orbe (8x8)
  g = gfx(scene);
  g.fillStyle(hex('#8a8a9a')).fillRect(0, 6, 20, 8);
  g.fillStyle(hex('#c8c8d8')).fillRect(2, 2, 16, 6);
  g.fillStyle(hex('#ffe28a')).fillRect(9, 0, 2, 4);
  g.generateTexture('altar', 20, 14);
  g.destroy();
  g = gfx(scene);
  g.fillStyle(hex('#8b5cf6')).fillCircle(4, 4, 4).fillStyle(hex('#e0d0ff')).fillCircle(3, 3, 1.5);
  g.generateTexture('orb', 8, 8);
  g.destroy();

  // luneta (14x6)
  g = gfx(scene);
  g.fillStyle(hex('#4a3a2a')).fillRect(0, 1, 14, 4).fillStyle(hex(PAL.gold)).fillRect(10, 0, 4, 6).fillStyle(hex('#7cb2ff')).fillRect(12, 1, 2, 4);
  g.generateTexture('scope', 14, 6);
  g.destroy();

  // bancada (24x14) e carroça (18x12)
  g = gfx(scene);
  g.fillStyle(hex(PAL.woodDark)).fillRect(0, 4, 24, 10);
  g.fillStyle(hex(PAL.wood)).fillRect(1, 2, 22, 4);
  g.fillStyle(hex('#9a9aaa')).fillRect(4, 0, 6, 3).fillRect(14, 0, 6, 3);
  g.generateTexture('bench', 24, 14);
  g.destroy();
  g = gfx(scene);
  g.fillStyle(hex(PAL.woodDark)).fillRect(0, 2, 18, 7);
  g.fillStyle(hex(PAL.wood)).fillRect(1, 3, 16, 4);
  g.fillStyle(hex('#2a2a2a')).fillCircle(4, 10, 2).fillCircle(14, 10, 2);
  g.fillStyle(hex(PAL.gold)).fillRect(5, 0, 8, 3);
  g.generateTexture('cart', 18, 12);
  g.destroy();

  // cristal de escala (12x16): duas faces, rua e mapa
  g = gfx(scene);
  g.fillStyle(hex('#4fd1c5')).fillTriangle(6, 0, 0, 7, 6, 16).fillStyle(hex('#7cb2ff')).fillTriangle(6, 0, 12, 7, 6, 16);
  g.fillStyle(hex('#e0f7ff')).fillRect(5, 3, 2, 4);
  g.generateTexture('crystal', 12, 16);
  g.destroy();

  // foco da Lente (gradiente radial, 180x180)
  const spot = scene.textures.createCanvas('spot', 180, 180);
  if (spot) {
    const ctx = spot.getContext();
    const grad = ctx.createRadialGradient(90, 90, 20, 90, 90, 90);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.85)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 180, 180);
    spot.refresh();
  }
  const spotS = scene.textures.createCanvas('spot_s', 90, 90);
  if (spotS) {
    const ctx = spotS.getContext();
    const grad = ctx.createRadialGradient(45, 45, 8, 45, 45, 45);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 90, 90);
    spotS.refresh();
  }
  nearestAll(scene, [
    'log', 'woodpile', 'raft', 'pillar', 'pillar_lit', 'sign', 'plaque', 'plaque_q', 'gate', 'gate_open', 'podium', 'pedestal', 'chest', 'shot', 'marker', 'wisp', 'px', 'shadow',
    'house_a', 'house_b', 'school', 'temple_face', 'torch', 'torch_lit', 'brazier', 'key', 'throne', 'altar', 'orb', 'scope', 'bench', 'cart', 'crystal', 'shack', 'tower_bld',
  ]);
}
