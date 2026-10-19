import type { RoomDef } from '../types';
import { island } from './island';
import { town } from './town';
import { lens_hall, lens1, lens2, lens3, lens4, lens_boss, lens_sage } from './lens';
import { aldeia, anomia, cidade, conflito, normas, v_hall, vila_nova } from './villages';
import { castle_boss, castle_comte, castle_hall, castle_montesquieu, castle_sage, castle_smith } from './castle';
import { mirror_agora, mirror_escola, mirror_estado, mirror_familia, mirror_hall, mirror_trabalho } from './mirror';
import { scales_boss, scales_f1, scales_f2, scales_f3, scales_hall } from './scales';
import { distritos } from './districts';

export const ROOMS: Record<string, RoomDef> = Object.fromEntries(
  [
    island, town, lens_hall, lens1, lens2, lens3, lens4, lens_boss, lens_sage,
    v_hall, aldeia, cidade, vila_nova, normas, conflito, anomia,
    castle_hall, castle_montesquieu, castle_comte, castle_smith, castle_boss, castle_sage,
    mirror_hall, mirror_familia, mirror_escola, mirror_trabalho, mirror_estado, mirror_agora,
    scales_hall, scales_f1, scales_f2, scales_f3, scales_boss, distritos,
  ].map((r) => [r.id, r]),
);
