import type { Dir } from '../config';

export interface DialogueLine {
  who?: string;
  text: string;
}
export interface DialogueChoice {
  choice: string;
  options: { label: string; next?: string; event?: string; set?: string }[];
}
export interface DialogueEvent {
  event: string;
}
export interface DialogueSet {
  set: string;
}
export interface DialogueGoto {
  goto: string;
}
export interface DialogueIf {
  if: string;
  then: string;
  else?: string;
}
export interface DialogueGive {
  give: string;
}
export type DialogueStep =
  | DialogueLine
  | DialogueChoice
  | DialogueEvent
  | DialogueSet
  | DialogueGoto
  | DialogueIf
  | DialogueGive;
export type Dialogue = DialogueStep[];

export interface DialogueRef {
  /** só usa este diálogo se a flag estiver ligada */
  if?: string;
  /** só usa se a flag estiver desligada */
  unless?: string;
  id: string;
}

export interface NpcDef {
  type: 'npc';
  id: string;
  x: number;
  y: number;
  look: string;
  name: string;
  dialogue: DialogueRef[] | string;
  facing?: Dir;
  /** caminho em tiles, percorrido em loop */
  patrol?: { x: number; y: number }[];
  speed?: number;
  /** sprite alternativo (ex.: 'crab') em vez de personagem */
  sprite?: string;
  anim?: string;
  /** texto que aparece sobre o NPC (bolha) */
  bubble?: string;
  /** só aparece se a flag estiver ligada / desligada */
  if?: string;
  unless?: string;
}

export interface DoorDef {
  type: 'door';
  id: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  to: string;
  spawn: string;
  /** flag necessária; sem ela a porta fica fechada (tile de porta fechada) */
  requires?: string;
  lockedText?: string;
  /** se verdadeiro, não desenha tile de porta (passagem aberta / borda do mapa) */
  open?: boolean;
}

export interface SignDef {
  type: 'sign';
  id: string;
  x: number;
  y: number;
  text: string[];
  sprite?: string;
}

export interface ItemDef {
  type: 'item';
  id: string;
  x: number;
  y: number;
  item: string;
  sprite: string;
  name: string;
  hint: string;
  /** página do Caderno destravada ao pegar */
  page?: string;
  did?: string;
}

export interface TriggerDef {
  type: 'trigger';
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  event: string;
  once?: boolean;
  if?: string;
  unless?: string;
}

export interface PropDef {
  type: 'prop';
  id: string;
  x: number;
  y: number;
  sprite: string;
  solid?: boolean;
  /** evento disparado ao interagir (controlador decide) */
  interact?: string;
  label?: string;
  if?: string;
  unless?: string;
  /** deslocamento em pixels */
  dx?: number;
  dy?: number;
  depthOffset?: number;
  /** corpo sólido customizado (prédios) */
  bodyW?: number;
  bodyH?: number;
  /** raio de interação em pixels (default 26) */
  radius?: number;
}

export type EntityDef = NpcDef | DoorDef | SignDef | ItemDef | TriggerDef | PropDef;

export interface RoomDef {
  id: string;
  name: string;
  grid: string[];
  entities: EntityDef[];
  spawns: Record<string, { x: number; y: number; face?: Dir }>;
  controller?: string;
  /** cor de fundo fora do mapa */
  bg?: string;
  /** tom de luz (overlay), 0–1 de escuridão */
  dark?: number;
  /** salva ao entrar (default true) */
  autosave?: boolean;
}

export interface ConceptPage {
  id: string;
  title: string;
  page: string;
  book: string;
  /** templo onde se aprende (para agrupar no Resumão) */
  area: string;
}
