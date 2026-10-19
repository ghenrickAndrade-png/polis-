import { state } from './state';

/** Itens que o botão X liga/desliga (todos usam a mesma visão de "lente"). */
export const TOGGLE_ITEMS = ['lens', 'gear', 'crystal'] as const;
export type ToggleItem = (typeof TOGGLE_ITEMS)[number];

export const ITEM_NAMES: Record<ToggleItem, string> = { lens: 'Lente', gear: 'Engrenagem', crystal: 'Cristal' };

const VILLAGE_ROOMS = ['v_hall', 'aldeia', 'cidade', 'vila_nova', 'normas', 'conflito', 'anomia'];

/** Qual item o X controla nesta sala (o da área, se o jogador já o tem; senão, qualquer um que tenha). */
export function activeItem(room = state.room): ToggleItem | null {
  if (room.startsWith('scales_') && state.hasItem('crystal')) return 'crystal';
  if (VILLAGE_ROOMS.includes(room) && state.hasItem('gear')) return 'gear';
  for (const it of TOGGLE_ITEMS) if (state.hasItem(it)) return it;
  return null;
}
