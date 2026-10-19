export const TILE = 16;
export const GAME_W = 480;
export const GAME_H = 270;
export const PLAYER_SPEED = 92;
export const MAX_HP = 3;

export const FONT = 'Verdana, Geneva, Tahoma, sans-serif';
export const TEXT_RES = 3;

/** Paleta geral (16-bit, cores chapadas). */
export const PAL = {
  grass: '#4f8a3a',
  grassLight: '#67a44d',
  grassDark: '#3f7230',
  path: '#c9a66b',
  pathDark: '#b08f55',
  sand: '#e9dba3',
  sandDark: '#d4c384',
  water: '#3b7dd8',
  waterLight: '#7cb2ff',
  waterDark: '#2c62b4',
  wall: '#6b6b7c',
  wallDark: '#4b4b5c',
  wallLight: '#8c8c9e',
  floor: '#a39383',
  floorDark: '#8a7a6a',
  floorLight: '#b8a898',
  wood: '#a0703c',
  woodDark: '#75502a',
  woodLight: '#c08a4a',
  trunk: '#6b4a2b',
  leaf: '#2f6b2a',
  leafLight: '#4a8f3a',
  leafDark: '#1f4b1c',
  rock: '#8a8a8a',
  rockDark: '#5f5f5f',
  cliff: '#7a6a5a',
  cliffDark: '#5a4a3a',
  night: '#0b0b14',
  ink: '#1a1a22',
  paper: '#f4ecd8',
  gold: '#e6c45a',
  red: '#d04545',
  blue: '#4a90e2',
  purple: '#8b5cf6',
  teal: '#2ab7a9',
  white: '#ffffff',
  black: '#000000',
} as const;

export type Dir = 'down' | 'up' | 'left' | 'right';

export const DIR_VEC: Record<Dir, { x: number; y: number }> = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
