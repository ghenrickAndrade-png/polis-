import type { RoomScene } from '../scenes/RoomScene';

export interface Interactable {
  id: string;
  kind: 'npc' | 'sign' | 'item' | 'prop' | 'door';
  obj: { x: number; y: number };
  interact: () => void;
  enabled?: () => boolean;
  radius?: number;
}

/** Controlador de sala: liga a lógica pura (src/logic) aos objetos da cena. */
export interface RoomController {
  create(): void;
  update(time: number, delta: number): void;
  /** retorna true se tratou a interação (a cena não faz o padrão) */
  onInteract?(target: Interactable): boolean;
  /** eventos de diálogo e gatilhos */
  onEvent?(name: string): void;
  onLens?(on: boolean): void;
  onFlag?(flag: string): void;
  /** chamado quando o jogador ataca; o controlador verifica inimigos */
  onAttack?(rect: Phaser.Geom.Rectangle): void;
  destroy(): void;
}

export type ControllerFactory = (scene: RoomScene) => RoomController;

const registry = new Map<string, ControllerFactory>();

export function registerController(id: string, f: ControllerFactory): void {
  registry.set(id, f);
}

export function getController(id: string): ControllerFactory | undefined {
  return registry.get(id);
}
