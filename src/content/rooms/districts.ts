import type { EntityDef, RoomDef } from '../types';
import { DISTRICTS } from '../districtsData';

/** Casinhas apertadas na periferia; prédios espaçados no centro. */
function houses(): EntityDef[] {
  const out: EntityDef[] = [];
  const shacks: [number, number][] = [
    // Brasilândia
    [3, 4], [5, 3], [8, 4], [4, 6], [8, 6],
    // Sapopemba
    [31, 4], [34, 3], [37, 4], [32, 6], [36, 6],
    // Capão Redondo
    [3, 15], [6, 14], [8, 15], [4, 17], [8, 17],
    // Jardim Ângela
    [14, 17], [17, 16], [20, 17], [14, 19], [20, 19],
    // Grajaú
    [28, 17], [31, 16], [34, 17], [36, 16], [29, 19], [35, 19],
  ];
  shacks.forEach(([x, y], i) => out.push({ type: 'prop', id: `shack${i}`, x, y, sprite: 'shack', solid: true, bodyW: 20, bodyH: 10 }));
  out.push({ type: 'prop', id: 'bld1', x: 17, y: 5, sprite: 'tower_bld', solid: true, bodyW: 28, bodyH: 14 });
  out.push({ type: 'prop', id: 'bld2', x: 22, y: 5, sprite: 'tower_bld', solid: true, bodyW: 28, bodyH: 14 });
  out.push({ type: 'prop', id: 'cart1', x: 9, y: 8, sprite: 'cart', dy: -2 });
  out.push({ type: 'prop', id: 'cart2', x: 36, y: 9, sprite: 'cart', dy: -2 });
  out.push({ type: 'prop', id: 'cart3', x: 30, y: 21, sprite: 'cart', dy: -2 });
  return out;
}

export const distritos: RoomDef = {
  id: 'distritos',
  name: 'Distritos — A Mesa da Cidade',
  controller: 'distritos',
  bg: '#0b0b14',
  grid: [
    '########################################',
    '#...........w.............w............#',
    '#.kkkkkkkkk.w...ooooooooo.w...kkkkkkkkk#',
    '#.kkkkkkkkk.w...ooooooooo.w...kkkkkkkkk#',
    '#.kkkkkkkkk.w...ooooooooo.w...kkkkkkkkk#',
    '#.kkkkkkkkk.b...ooooooooo.b...kkkkkkkkk#',
    '#.kkkkkkkkk.w...ooooooooo.w...kkkkkkkkk#',
    '#.kkkkkkkkk.w...ooooooooo.w...kkkkkkkkk#',
    '#.kkkkkkkkk.w...ooooooooo.w...kkkkkkkkk#',
    '#.kkkkkkkkk.w...ooooooooo.w...kkkkkkkkk#',
    '#...........w.............w...kkkkkkkkk#',
    '#...........b.............b............#',
    '#...........w.............w............#',
    '#.kkkkkkkkk.w.............w............#',
    '#.kkkkkkkkk.w.............w............#',
    '#.kkkkkkkkk.w.............wkkkkkkkkkkk.#',
    '#.kkkkkkkkk.wkkkkkkkkk....wkkkkkkkkkkk.#',
    '#.kkkkkkkkk.wkkkkkkkkk....wkkkkkkkkkkk.#',
    '#.kkkkkkkkk.bkkkkkkkkk....bkkkkkkkkkkk.#',
    '#.kkkkkkkkk.wkkkkkkkkk....wkkkkkkkkkkk.#',
    '#.kkkkkkkkk.wkkkkkkkkk....wkkkkkkkkkkk.#',
    '#...........wkkkkkkkkk....wkkkkkkkkkkk.#',
    '#...........wkkkkkkkkk....wkkkkkkkkkkk.#',
    '#...........w.............w............#',
    '#...........w.............w............#',
    '###################DD###################',
  ],
  spawns: { start: { x: 19, y: 23, face: 'up' } },
  entities: [
    { type: 'door', id: 'to_town', x: 19, y: 25, w: 2, to: 'town', spawn: 'dist' },
    { type: 'prop', id: 'painel', x: 19, y: 12, sprite: 'bench', dx: 8, interact: 'painel', radius: 30 },
    { type: 'npc', id: 'agente', x: 22, y: 12, look: 'doctor', name: 'Agente de Saúde', facing: 'left', dialogue: 'dist_agent_read' },
    { type: 'sign', id: 'dist_plaque', x: 16, y: 12, sprite: 'plaque', text: ['"A pandemia atingiu mais os mais pobres." Números por 100 mil moradores, para comparar distritos de tamanhos diferentes.'] },
    ...DISTRICTS.map((d): EntityDef => ({ type: 'prop', id: `dist:${d.id}`, x: d.x, y: d.y, sprite: 'plaque_q', interact: 'dist', radius: 30 })),
    ...houses(),
  ],
};
