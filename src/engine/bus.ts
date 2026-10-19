import Phaser from 'phaser';

/**
 * Barramento de eventos global (cenas, controladores de puzzle e UI).
 *
 * Eventos usados:
 *  - 'dialogue:start' (steps, done?)       → UI abre diálogo
 *  - 'dialogue:end'                        → UI fechou diálogo
 *  - 'dialogue:event' (name)               → passo {event} de um diálogo
 *  - 'toast' (text, kind?)                 → aviso curto no topo
 *  - 'journal:unlock' (pageId)             → Caderno ganhou página
 *  - 'flag' (name)                         → flag ligada
 *  - 'hp' (hp, max)                        → HUD
 *  - 'room:enter' (roomName)               → banner
 *  - 'journal:open' / 'journal:close'
 *  - 'pause:open' / 'pause:close'
 *  - 'player:died'
 *  - 'go' (roomId, spawn)                  → troca de sala
 */
export const bus = new Phaser.Events.EventEmitter();
