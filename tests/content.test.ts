import { describe, expect, it } from 'vitest';
import { ROOMS } from '../src/content/rooms';
import { DIALOGUES } from '../src/content/dialogues';
import { LOOKS } from '../src/content/looks';
import { LEGEND } from '../src/engine/tiles';
import { CONCEPTS } from '../src/content/concepts';
import type { DialogueStep } from '../src/content/types';

describe('salas', () => {
  for (const room of Object.values(ROOMS)) {
    it(`${room.id}: grid retangular e grande o bastante para a câmera`, () => {
      const w = room.grid[0].length;
      expect(room.grid.every((r) => r.length === w)).toBe(true);
      expect(w).toBeGreaterThanOrEqual(30);
      expect(room.grid.length).toBeGreaterThanOrEqual(17);
      for (const row of room.grid) for (const ch of row) expect(LEGEND[ch], `caractere desconhecido '${ch}' em ${room.id}`).toBeDefined();
    });
    it(`${room.id}: portas levam a salas e spawns existentes`, () => {
      for (const e of room.entities) {
        if (e.type !== 'door') continue;
        expect(ROOMS[e.to], `porta ${e.id} → ${e.to}`).toBeDefined();
        expect(ROOMS[e.to].spawns[e.spawn], `spawn ${e.spawn} em ${e.to}`).toBeDefined();
      }
      expect(Object.keys(room.spawns).length).toBeGreaterThan(0);
    });
    it(`${room.id}: NPCs com visual e diálogo existentes`, () => {
      for (const e of room.entities) {
        if (e.type !== 'npc') continue;
        if (!e.sprite) expect(LOOKS[e.look], `look ${e.look}`).toBeDefined();
        const refs = typeof e.dialogue === 'string' ? [e.dialogue] : e.dialogue.map((d) => d.id);
        for (const id of refs) expect(DIALOGUES[id], `diálogo ${id} (${room.id}/${e.id})`).toBeDefined();
      }
    });
    it(`${room.id}: entidades dentro do mapa`, () => {
      for (const e of room.entities) {
        expect(e.x).toBeGreaterThanOrEqual(0);
        expect(e.y).toBeGreaterThanOrEqual(0);
        expect(e.x).toBeLessThan(room.grid[0].length);
        expect(e.y).toBeLessThan(room.grid.length);
      }
    });
  }
});

describe('diálogos', () => {
  it('referências goto/next/if apontam para diálogos existentes', () => {
    for (const [id, steps] of Object.entries(DIALOGUES)) {
      for (const s of steps as DialogueStep[]) {
        if ('goto' in s) expect(DIALOGUES[s.goto], `${id} goto ${s.goto}`).toBeDefined();
        if ('if' in s) {
          expect(DIALOGUES[s.then], `${id} then ${s.then}`).toBeDefined();
          if (s.else) expect(DIALOGUES[s.else], `${id} else ${s.else}`).toBeDefined();
        }
        if ('choice' in s) for (const o of s.options) if (o.next) expect(DIALOGUES[o.next], `${id} next ${o.next}`).toBeDefined();
      }
    }
  });
  it('caixas de texto curtas (até ~190 caracteres)', () => {
    for (const [id, steps] of Object.entries(DIALOGUES)) {
      for (const s of steps as DialogueStep[]) {
        if ('text' in s) expect(s.text.length, `${id}: "${s.text.slice(0, 30)}..."`).toBeLessThanOrEqual(190);
      }
    }
  });
});

describe('conceitos', () => {
  it('ids únicos e com página do livro', () => {
    const ids = CONCEPTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of CONCEPTS) expect(c.page).toMatch(/pág|Para refletir|atividades/i);
  });
});
