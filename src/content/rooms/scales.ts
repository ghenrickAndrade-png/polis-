import type { EntityDef, RoomDef } from '../types';
import { FLOOR1, FLOOR2, FLOOR3, SORT_CARDS, type FloorDef } from '../scalesData';

const BG = '#0b0b14';

const FLOOR_GRID = [
  '###############DD###############',
  '#oooooooooooooooooooooooooooooo#',
  '#oooooooooooooooooooooooooooooo#',
  '#..............CC..............#',
  '#..............CC..............#',
  '#..............CC..............#',
  '#..............CC..............#',
  '#..............CC..............#',
  '#..............CC..............#',
  '#..............CC..............#',
  '#..............CC..............#',
  '#..............CC..............#',
  '#oooooooooooooooooooooooooooooo#',
  '#oooooooooooooooooooooooooooooo#',
  '#oooooooooooooooooooooooooooooo#',
  '#oooooooooooooooooooooooooooooo#',
  '#oooooooooooooooooooooooooooooo#',
  '###############DD###############',
];

function floorEntities(f: FloorDef, next: string, nextRequires: string, back: string, backSpawn: string): EntityDef[] {
  return [
    { type: 'door', id: 'to_back', x: 15, y: 17, w: 2, to: back, spawn: backSpawn },
    { type: 'door', id: 'to_next', x: 15, y: 0, w: 2, to: next, spawn: 'start', requires: nextRequires, lockedText: '(A escada só sobe quando o quadro de análise fechar.)' },
    { type: 'prop', id: 'board', x: 15, y: 2, sprite: 'bench', dx: 8, interact: 'board', radius: 30 },
    ...f.micro.map((m): EntityDef => ({ type: 'npc', id: `micro:${m.id}`, x: m.x, y: m.y, look: m.look, name: m.name, facing: 'down', dialogue: 'walker_line' })),
    ...f.macro.map((n): EntityDef => ({ type: 'prop', id: `macro:${n.id}`, x: n.x, y: n.y, sprite: 'pillar', solid: true, interact: 'macro' })),
  ];
}

export const scales_hall: RoomDef = {
  id: 'scales_hall',
  name: 'Torre das Escalas — Base',
  controller: 'scales_hall',
  bg: BG,
  grid: [
    '##############DD##############',
    '#............................#',
    '#.............CC.............#',
    '#.............CC.............#',
    '#.............CC.............#',
    '#.............CC.............#',
    '#.............CC.............#',
    '#.............CC.............#',
    '#.............CC.............#',
    '#.............CC.............#',
    '#.............CC.............#',
    '#.............CC.............#',
    '#.............CC.............#',
    '#.............CC.............#',
    '#.............CC.............#',
    '#.............CC.............#',
    '##############DD##############',
  ],
  spawns: { start: { x: 14, y: 14, face: 'up' }, back: { x: 14, y: 2, face: 'down' } },
  entities: [
    { type: 'door', id: 'to_town', x: 14, y: 16, w: 2, to: 'town', spawn: 'tower' },
    { type: 'door', id: 'to_f1', x: 14, y: 0, w: 2, to: 'scales_f1', spawn: 'start', requires: 'item.crystal', lockedText: '(A escada não cede. O cristal do pedestal espera.)' },
    { type: 'item', id: 'crystal', x: 14, y: 7, item: 'crystal', sprite: 'crystal', name: 'Cristal de Escala', hint: 'Aperte X para trocar de escala. Rua (micro): as pessoas falam. Mapa (macro): os fluxos aparecem.' },
    { type: 'prop', id: 'ped_crystal', x: 14, y: 8, sprite: 'pedestal', dy: -6 },
    { type: 'sign', id: 'tower_plaque', x: 10, y: 4, sprite: 'plaque', text: ['"Perto demais, você vê o gesto. Longe demais, você vê o mapa. Precisa dos dois."'] },
  ],
};

export const scales_f1: RoomDef = {
  id: 'scales_f1',
  name: 'Andar 1 — A Oficina',
  controller: 'scales_f1',
  bg: BG,
  grid: FLOOR_GRID,
  spawns: { start: { x: 15, y: 15, face: 'up' }, back: { x: 15, y: 2, face: 'down' } },
  entities: floorEntities(FLOOR1, 'scales_f2', 'scales.f1', 'scales_hall', 'back'),
};

export const scales_f2: RoomDef = {
  id: 'scales_f2',
  name: 'Andar 2 — A Vila Turística',
  controller: 'scales_f2',
  bg: BG,
  grid: FLOOR_GRID,
  spawns: { start: { x: 15, y: 15, face: 'up' }, back: { x: 15, y: 2, face: 'down' } },
  entities: floorEntities(FLOOR2, 'scales_f3', 'scales.f2', 'scales_f1', 'back'),
};

export const scales_f3: RoomDef = {
  id: 'scales_f3',
  name: 'Andar 3 — Os Mecanismos',
  controller: 'scales_f3',
  bg: BG,
  grid: FLOOR_GRID,
  spawns: { start: { x: 15, y: 15, face: 'up' }, back: { x: 15, y: 2, face: 'down' } },
  entities: floorEntities(FLOOR3, 'scales_boss', 'scales.f3', 'scales_f2', 'back'),
};

export const scales_boss: RoomDef = {
  id: 'scales_boss',
  name: 'O Míope e o Gigante Cego',
  controller: 'scales_boss',
  bg: BG,
  grid: [
    '##############DD##############',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '##############DD##############',
  ],
  spawns: { start: { x: 14, y: 15, face: 'up' } },
  entities: [
    { type: 'door', id: 'to_f3', x: 14, y: 17, w: 2, to: 'scales_f3', spawn: 'back' },
    { type: 'door', id: 'to_town', x: 14, y: 0, w: 2, to: 'town', spawn: 'tower', requires: 'tower.done', lockedText: '(A porta do fundo abre quando a prova terminar.)' },
    { type: 'prop', id: 'board', x: 14, y: 4, sprite: 'bench', dx: 8, interact: 'board', radius: 30 },
    ...SORT_CARDS.map((c, i): EntityDef => ({ type: 'prop', id: `card:${c.id}`, x: 4 + i * 5, y: 12, sprite: 'plaque', interact: 'card', if: 'scales.boss' })),
  ],
};
