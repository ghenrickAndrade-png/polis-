import type { EntityDef, RoomDef } from '../types';
import { CITY_NORMS, CITY_WORKSHOPS, FARMERS, NORM_WALLS, SETTLERS, WORDS } from '../villagesData';

export const v_hall: RoomDef = {
  id: 'v_hall',
  name: 'Encruzilhada das Duas Aldeias',
  controller: 'v_hall',
  bg: '#1f4b1c',
  grid: [
    'ttttttttttttttggtttttttttttttt',
    'tgggggggggggggppgggggggggggggt',
    'tgggggggggggggppgggggggggggggt',
    'tgggtgggggggggppgggggtgggggggt',
    'tggggggggtggggppgggggggggggggt',
    'tgggggggggggggppgggggggggtgggt',
    'tggggggfggggggppgggggggfgggggt',
    'tgggggggggggggppgggggggggggggt',
    'gppppppppppppppppppppppppppppg',
    'gppppppppppppppppppppppppppppg',
    'gppppppppppppppppppppppppppppg',
    'tgggggggggggggppgggggggggggggt',
    'tggggggfggggggppgggggggfgggggt',
    'tggggtggggggggppggggggtggggggt',
    'tgggggggggtgggppggggggggggtggt',
    'tgggggggggggggppgggggggggggggt',
    'tgggggggggggggppgggggggggggggt',
    'ttttttttttttttggtttttttttttttt',
  ],
  spawns: {
    start: { x: 2, y: 9, face: 'right' },
    west: { x: 2, y: 9, face: 'right' },
    north: { x: 14, y: 2, face: 'down' },
    south: { x: 14, y: 15, face: 'up' },
    east: { x: 27, y: 9, face: 'left' },
  },
  entities: [
    { type: 'door', id: 'to_town', x: 0, y: 8, h: 3, to: 'town', spawn: 'east', open: true },
    { type: 'door', id: 'to_aldeia', x: 14, y: 0, w: 2, to: 'aldeia', spawn: 'start', open: true },
    { type: 'door', id: 'to_cidade', x: 14, y: 17, w: 2, to: 'cidade', spawn: 'start', open: true },
    { type: 'door', id: 'to_vila', x: 29, y: 8, h: 3, to: 'vila_nova', spawn: 'start', open: true, requires: 'villages.both', lockedText: '(Uma corrente fecha o caminho do leste. Placa: "Primeiro veja as duas aldeias.")' },
    { type: 'sign', id: 'hall_sign', x: 12, y: 6, text: ['ENCRUZILHADA DAS DUAS ALDEIAS', 'Norte: Aldeia das Semelhanças. Sul: Cidade das Engrenagens. Leste: Vila Nova (depois de ver as duas).'] },
    { type: 'item', id: 'gear', x: 17, y: 6, item: 'gear', sprite: 'gear', name: 'Engrenagem', hint: 'Aperte X para ligar a Engrenagem. Ela mostra quem depende de quem e o que ninguém vê, mas todos obedecem.' },
    { type: 'prop', id: 'pedestal_gear', x: 17, y: 7, sprite: 'pedestal', dy: -6 },
    { type: 'prop', id: 'chain', x: 28, y: 9, sprite: 'gate', solid: true, unless: 'villages.both', bodyW: 16, bodyH: 16, label: '(Uma corrente. "Primeiro veja as duas aldeias.")' },
    { type: 'prop', id: 'chain2', x: 28, y: 8, sprite: 'gate', solid: true, unless: 'villages.both', bodyW: 16, bodyH: 16 },
    { type: 'prop', id: 'chain3', x: 28, y: 10, sprite: 'gate', solid: true, unless: 'villages.both', bodyW: 16, bodyH: 16 },
  ],
};

const farmerEntities: EntityDef[] = FARMERS.map((f) => ({
  type: 'npc',
  id: f.id,
  x: f.x,
  y: f.y,
  look: 'farmer',
  name: f.name,
  facing: 'down',
  dialogue: f.id === 'f1' ? 'tonho_leave' : 'farmer_line',
  unless: f.id === 'f1' ? 'aldeia.tonho_gone' : undefined,
  speed: 20,
  patrol: [
    { x: f.x, y: f.y },
    { x: f.x + 2, y: f.y },
  ],
}));

export const aldeia: RoomDef = {
  id: 'aldeia',
  name: 'Aldeia das Semelhanças',
  controller: 'aldeia',
  bg: '#1f4b1c',
  grid: [
    'tttttttttttttttttttttttttttttttt',
    'tggggggggggggggggggggggggggggggt',
    'tggggggggggggggggggggggggggggggt',
    'tggkkkkkkgkkkkkkgggggkkkkkkgtggt',
    'tggkkkkkkgkkkkkppggggkkkkkkggggt',
    'tggkkkkkkgkkkkkppggggkkkkkkggggt',
    'tggkkkkkkgkkkkkppggggkkkkkkggggt',
    'tggggggggggggggppggggggggggggggt',
    'tggggggggggggggppgggggggggggtggt',
    'tggggggggggggggppggggggggggggggt',
    'tggggggggggggggppggggggggggggggt',
    'tggkkkkkkgkkkkkppggggkkkkkkggggt',
    'tggkkkkkkgkkkkkppggggkkkkkkggggt',
    'tggkkkkkkgkkkkkppggggkkkkkkgtggt',
    'tggkkkkkkgkkkkkppggggkkkkkkggggt',
    'tggggggggggggggppggggggggggggggt',
    'tggggggggggggggppggggggggggggggt',
    'tttttttttttttttggttttttttttttttt',
  ],
  spawns: {
    start: { x: 15, y: 15, face: 'up' },
  },
  entities: [
    { type: 'door', id: 'to_hall', x: 15, y: 17, w: 2, to: 'v_hall', spawn: 'north', open: true },
    ...farmerEntities,
    { type: 'prop', id: 'tree_common', x: 18, y: 8, sprite: 'tree', solid: true, interact: 'tree', dy: 2 },
    { type: 'sign', id: 'tree_sign', x: 20, y: 8, text: ['"Árvore comum. As frutas são de todos. Ninguém colhe antes da Festa da Colheita."'] },
    { type: 'npc', id: 'guard', x: 15, y: 2, look: 'guard', name: 'Guarda', facing: 'down', dialogue: 'farmer_line' },
  ],
};

const CITY_GRID = [
  '###############DD###############',
  '#gggggggggggggggggggggggggggggg#',
  '#gfggggggggggggggggggggggggggfg#',
  '#oooooooooooooooooooooooooooooo#',
  '#oooooooooooooooooooooooooooooo#',
  '#oooooooooooooooooooooooooooooo#',
  '#oooooooooooooooooooooooooooooo#',
  '#oooooooooooooooooooooooooooooo#',
  '#oooooooooooooooooooooooooooooo#',
  '#oooooooooooooooooooooooooooooo#',
  '#oooooooooooooooooooooooooooooo#',
  '#okkkkkkooooooooooooooooooooooo#',
  '#okkkkkkooooooooooooooooooooooo#',
  '#okkkkkkooooooooooooooooooooooo#',
  '#okkkkkkooooooooooooooooooooooo#',
  '#ofoooooooooooooooooooooooooofo#',
  '#oooooooooooooooooooooooooooooo#',
  '################################',
];

function cityProps(): EntityDef[] {
  const out: EntityDef[] = [];
  for (const w of CITY_WORKSHOPS) {
    if (w.sprite) out.push({ type: 'prop', id: `shop:${w.role}`, x: w.x, y: w.y, sprite: w.sprite, solid: true, bodyW: w.sprite === 'school' ? 60 : 44, bodyH: 26 });
    out.push({ type: 'sign', id: `shopsign:${w.role}`, x: w.x + (w.sprite ? 3 : 0), y: w.y + (w.sprite ? 1 : -2), text: [`${w.label.toUpperCase()} — ${CITY_WORKSHOPS.find((x) => x.role === w.role)!.name}`] });
  }
  return out;
}

export const cidade: RoomDef = {
  id: 'cidade',
  name: 'Cidade das Engrenagens',
  controller: 'cidade',
  bg: '#0b0b14',
  grid: CITY_GRID,
  spawns: { start: { x: 15, y: 2, face: 'down' } },
  entities: [
    { type: 'door', id: 'to_hall', x: 15, y: 0, w: 2, to: 'v_hall', spawn: 'south' },
    ...cityProps(),
    ...CITY_WORKSHOPS.map(
      (w): EntityDef => ({ type: 'npc', id: `work:${w.role}`, x: w.npcX, y: w.npcY, look: w.look, name: w.name, facing: 'down', dialogue: 'farmer_line' }),
    ),
  ],
};

export const vila_nova: RoomDef = {
  id: 'vila_nova',
  name: 'Vila Nova',
  controller: 'vila_nova',
  bg: '#1f4b1c',
  grid: [
    'tttttttttttttttttttttttttttttt',
    'tggggggggggggggggggggggggggggt',
    'tggggggggggggggggggggggggggggt',
    'tggggggggggggggggggggggggggggt',
    'tggggggggggggggggggggggggggggt',
    'tggggggggggggggggggggggggggggt',
    'tggggggggggggggggggggggggggggt',
    'tggggggggggggggggggggggggggggt',
    'gpppoooooooooooooooooooooopppg',
    'gpppoooooooooooooooooooooopppg',
    'tpppoooooooooooooooooooooopppt',
    'tgggoooooooooooooooooooooogggt',
    'tgggoooooooooooooooooooooogggt',
    'tgggoooooooooooooooooooooogggt',
    'tgggoooooooooooooooooooooogggt',
    'tggggggggggggggggggggggggggggt',
    'tggggggggggggggggggggggggggggt',
    'tttttttttttttttttttttttttttttt',
  ],
  spawns: {
    start: { x: 2, y: 9, face: 'right' },
    east: { x: 27, y: 9, face: 'left' },
  },
  entities: [
    { type: 'door', id: 'to_hall', x: 0, y: 8, h: 2, to: 'v_hall', spawn: 'east', open: true },
    { type: 'door', id: 'to_normas', x: 29, y: 8, h: 2, to: 'normas', spawn: 'start', open: true, requires: 'vila.done', lockedText: '(Uma corrente fecha a saída. "Abre quando a vila girar.")' },
    { type: 'prop', id: 'chain', x: 28, y: 8, sprite: 'gate', solid: true, unless: 'vila.done', bodyW: 16, bodyH: 16 },
    { type: 'prop', id: 'chain2', x: 28, y: 9, sprite: 'gate', solid: true, unless: 'vila.done', bodyW: 16, bodyH: 16 },
    { type: 'sign', id: 'vila_sign', x: 14, y: 11, text: ['"Vila Nova. Prefeita provisória: ninguém. Regra: a saída abre quando a vila girar."'] },
    { type: 'prop', id: 'vhouse:agric', x: 5, y: 5, sprite: 'house_a', solid: true, bodyW: 44, bodyH: 24 },
    { type: 'prop', id: 'vhouse:padeiro', x: 10, y: 5, sprite: 'house_b', solid: true, bodyW: 44, bodyH: 24 },
    { type: 'prop', id: 'vhouse:ferreira', x: 15, y: 5, sprite: 'house_a', solid: true, bodyW: 44, bodyH: 24 },
    { type: 'prop', id: 'vhouse:medica', x: 20, y: 5, sprite: 'house_b', solid: true, bodyW: 44, bodyH: 24 },
    { type: 'prop', id: 'vhouse:professor', x: 25, y: 5, sprite: 'house_a', solid: true, bodyW: 44, bodyH: 24 },
    ...SETTLERS.map((s, i): EntityDef => ({ type: 'npc', id: s.id, x: 8 + i * 3, y: 13, look: s.look, name: s.name, facing: 'up', dialogue: 'settler_no_gear' })),
  ],
};

export const normas: RoomDef = {
  id: 'normas',
  name: 'Corredor das Normas',
  controller: 'normas',
  bg: '#0b0b14',
  grid: [
    '##################################',
    '##################################',
    '##################################',
    '##################################',
    '##################################',
    '#CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC#',
    '#................................#',
    '#................................#',
    'D................................D',
    '#................................#',
    '#................................#',
    '#................................#',
    '##################################',
    '##################################',
    '##################################',
    '##################################',
    '##################################',
  ],
  spawns: {
    start: { x: 2, y: 8, face: 'right' },
    back: { x: 31, y: 8, face: 'left' },
  },
  entities: [
    { type: 'door', id: 'to_vila', x: 0, y: 8, to: 'vila_nova', spawn: 'east' },
    { type: 'door', id: 'to_conflito', x: 33, y: 8, to: 'conflito', spawn: 'start', requires: 'normas.done' },
    { type: 'npc', id: 'keeper', x: 28, y: 8, look: 'guard', name: 'Porteiro', facing: 'left', dialogue: 'keeper_before' },
    { type: 'npc', id: 'teach:w1', x: 4, y: 6, look: 'townB', name: WORDS[0].teacher, facing: 'down', dialogue: 'walker_line' },
    { type: 'npc', id: 'teach:w2', x: 11, y: 10, look: 'kid', name: WORDS[1].teacher, facing: 'up', dialogue: 'walker_line' },
    { type: 'npc', id: 'teach:w3', x: 23, y: 10, look: 'townC', name: WORDS[2].teacher, facing: 'up', dialogue: 'walker_line' },
    ...NORM_WALLS.map((n): EntityDef => ({ type: 'trigger', id: `wall:${n.id}`, x: n.x, y: n.y, w: n.w, h: n.h, event: `wall:${n.id}` })),
  ],
};

export const conflito: RoomDef = {
  id: 'conflito',
  name: 'Sala do Conflito',
  controller: 'conflito',
  bg: '#1f4b1c',
  grid: [
    'tttttttttttttttttttttttttttttttt',
    'tggggggggggggggwwoooooooooooooot',
    'tggggggggggggggbboooooooooooooot',
    'tggggggggggggggwwoooooooooooooot',
    'tggggggggggggggwwoooooooooooooot',
    'tggkkkkkkkkggggwwoooooooooooooot',
    'tggkkkkkkkkggggwwoooooooooooooot',
    'tggkkkkkkkkggggwwoooooooooooooot',
    'gggggggggggggggwwoooooooooooooog',
    'gggggggggggggggwwoooooooooooooog',
    'tggkkkkkkkkggggwwoooooooooooooot',
    'tggkkkkkkkkggggwwoooooooooooooot',
    'tggkkkkkkkkggggwwoooooooooooooot',
    'tggggggggggggggwwoooooooooooooot',
    'tggggggggggggggwwoooooooooooooot',
    'tggggggggggggggwwoooooooooooooot',
    'tggggggggggggggwwoooooooooooooot',
    'tttttttttttttttttttttttttttttttt',
  ],
  spawns: {
    start: { x: 2, y: 8, face: 'right' },
  },
  entities: [
    { type: 'door', id: 'to_normas', x: 0, y: 8, h: 2, to: 'normas', spawn: 'back', open: true },
    { type: 'door', id: 'to_anomia', x: 31, y: 8, h: 2, to: 'anomia', spawn: 'start', open: true, requires: 'conflito.done', lockedText: '(O portão da saída está trancado pelas duas guildas.)' },
    { type: 'prop', id: 'gate:8', x: 30, y: 8, sprite: 'gate', solid: true, unless: 'conflito.simmel', bodyW: 16, bodyH: 16 },
    { type: 'prop', id: 'gate:9', x: 30, y: 9, sprite: 'gate', solid: true, unless: 'conflito.simmel', bodyW: 16, bodyH: 16 },
    { type: 'npc', id: 'brig1', x: 6, y: 8, look: 'farmer', name: 'Lavrador', facing: 'right', dialogue: 'fight_choice', bubble: '!' },
    { type: 'npc', id: 'brig2', x: 9, y: 8, look: 'townA', name: 'Lavrador 2', facing: 'left', dialogue: 'fight_choice', bubble: '!' },
    { type: 'prop', id: 'plaque_rule', x: 7, y: 6, sprite: 'plaque_q', label: '"A colheita se divide por igual." (A placa está rachada.)' },
    { type: 'npc', id: 'lider_pad', x: 21, y: 6, look: 'baker', name: 'Chefe dos padeiros', facing: 'down', dialogue: 'guild_choice' },
    { type: 'npc', id: 'pad2', x: 19, y: 5, look: 'baker', name: 'Padeira', facing: 'down', dialogue: 'walker_line' },
    { type: 'npc', id: 'lider_fer', x: 21, y: 12, look: 'smith', name: 'Chefe das ferreiras', facing: 'up', dialogue: 'guild_choice' },
    { type: 'npc', id: 'fer2', x: 19, y: 13, look: 'smith', name: 'Ferreiro', facing: 'up', dialogue: 'walker_line' },
  ],
};

export const anomia: RoomDef = {
  id: 'anomia',
  name: 'A Anomia',
  controller: 'anomia',
  bg: '#0b0b14',
  grid: CITY_GRID,
  spawns: { start: { x: 15, y: 15, face: 'up' } },
  entities: [
    { type: 'door', id: 'to_town', x: 15, y: 0, w: 2, to: 'town', spawn: 'east', requires: 'villages.done', lockedText: '(A porta não abre enquanto a névoa durar.)' },
    ...cityProps(),
    ...CITY_NORMS.map((n): EntityDef => ({ type: 'prop', id: `norm:${n.id}`, x: n.x, y: n.y, sprite: 'plaque', interact: 'norm' })),
  ],
};
