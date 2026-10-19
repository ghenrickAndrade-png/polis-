import type { Role } from '../logic/GearChain';
import type { Norm } from '../logic/Norms';

/** Papéis da Cidade das Engrenagens, em anel: cada um entrega algo ao seguinte. */
export const ROLES: Role[] = [
  { id: 'agric', name: 'Agricultora', gives: 'farinha' },
  { id: 'padeiro', name: 'Padeiro', gives: 'pão' },
  { id: 'ferreira', name: 'Ferreira', gives: 'ferramentas' },
  { id: 'medica', name: 'Médica', gives: 'saúde' },
  { id: 'professor', name: 'Professor', gives: 'ensino' },
];

export interface Workshop {
  role: string;
  label: string;
  /** prédio (prop) — bottom-center em tiles */
  sprite?: string;
  x: number;
  y: number;
  /** onde o NPC trabalha */
  npcX: number;
  npcY: number;
  look: string;
  name: string;
  /** posição da engrenagem (px, relativo ao centro do prédio) */
  gearDy: number;
}

/** Layout da Cidade (também usado na Anomia e na Prova). */
export const CITY_WORKSHOPS: Workshop[] = [
  { role: 'agric', label: 'Horta', x: 4, y: 10, npcX: 4, npcY: 12, look: 'farmer', name: 'Dona Lurdes', gearDy: -6 },
  { role: 'padeiro', label: 'Padaria', sprite: 'house_a', x: 10, y: 7, npcX: 10, npcY: 8, look: 'baker', name: 'Seu Chico', gearDy: -44 },
  { role: 'ferreira', label: 'Ferraria', sprite: 'house_b', x: 18, y: 7, npcX: 18, npcY: 8, look: 'smith', name: 'Dona Bete', gearDy: -44 },
  { role: 'medica', label: 'Posto de saúde', sprite: 'house_b', x: 26, y: 7, npcX: 26, npcY: 8, look: 'doctor', name: 'Dra. Tânia', gearDy: -44 },
  { role: 'professor', label: 'Escola', sprite: 'school', x: 20, y: 15, npcX: 22, npcY: 16, look: 'teacher', name: 'Prof. Nando', gearDy: -48 },
];

export const CITY_NPC_LINES: Record<string, { working: string; stopped: string }> = {
  agric: { working: 'Planto o trigo. A farinha vai pro Chico. Sem ele, meu trigo apodrece no saco.', stopped: 'Sem padaria, ninguém compra meu trigo. Parei também.' },
  padeiro: { working: 'Faço o pão da cidade inteira. A Bete me conserta o forno, a Lurdes me manda a farinha.', stopped: 'Dia de folga! Vamos ver quanto tempo a cidade aguenta sem pão...' },
  ferreira: { working: 'Conserto o forno do Chico, as enxadas da Lurdes, a maca da Tânia. Todo mundo passa aqui.', stopped: 'Sem pão não tenho almoço, sem almoço não bato ferro. Parei.' },
  medica: { working: 'Cuido de quem adoece. Sem a Bete, minha maca cai; sem o Nando, ninguém lê a receita.', stopped: 'Posto fechado. Sem pão, os pacientes nem vêm.' },
  professor: { working: 'Ensino as crianças de todos. Elas vão ser agricultoras, padeiros, médicas... o anel continua.', stopped: 'Escola vazia. Sem pão na merenda, as crianças ficaram em casa.' },
};

/** Aldeia das Semelhanças: todos fazem o mesmo. */
export const FARMERS = [
  { id: 'f1', name: 'Tonho', x: 5, y: 7 },
  { id: 'f2', name: 'Zina', x: 12, y: 7 },
  { id: 'f3', name: 'Bento', x: 23, y: 7 },
  { id: 'f4', name: 'Lica', x: 5, y: 15 },
  { id: 'f5', name: 'Dito', x: 12, y: 15 },
  { id: 'f6', name: 'Nena', x: 23, y: 15 },
];

/** Corredor das Normas: muros invisíveis (tiles) com a regra que cada um encarna. */
export const NORM_WALLS: (Norm & { x: number; y: number; w: number; h: number })[] = [
  { id: 'n1', rule: 'Não se pisa no canteiro', x: 8, y: 5, w: 1, h: 5 },
  { id: 'n2', rule: 'A fila anda pela esquerda', x: 14, y: 7, w: 1, h: 5 },
  { id: 'n3', rule: 'Silêncio perto da biblioteca', x: 20, y: 5, w: 1, h: 5 },
  { id: 'n4', rule: 'Ninguém atravessa a praça da festa', x: 26, y: 7, w: 1, h: 5 },
];

/** Caminho que os NPCs fazem (eles desviam dos muros sem pensar). */
export const NORM_PATH = [
  { x: 2, y: 10 },
  { x: 7, y: 10 },
  { x: 9, y: 10 },
  { x: 10, y: 6 },
  { x: 13, y: 6 },
  { x: 15, y: 6 },
  { x: 16, y: 10 },
  { x: 19, y: 10 },
  { x: 21, y: 10 },
  { x: 22, y: 6 },
  { x: 25, y: 6 },
  { x: 27, y: 6 },
  { x: 27, y: 10 },
  { x: 22, y: 10 },
  { x: 21, y: 6 },
  { x: 19, y: 6 },
  { x: 16, y: 6 },
  { x: 15, y: 10 },
  { x: 13, y: 10 },
  { x: 10, y: 10 },
  { x: 9, y: 6 },
  { x: 7, y: 6 },
  { x: 2, y: 6 },
];

export const WORDS = [
  { id: 'w1', word: 'Taná', meaning: 'bom dia', teacher: 'Vó Iná' },
  { id: 'w2', word: 'Oré', meaning: 'com licença', teacher: 'Jaci' },
  { id: 'w3', word: 'Pitá', meaning: 'posso passar?', teacher: 'Dudu' },
];

export const SETTLERS = [
  { id: 'set:ana', name: 'Ana', look: 'townB' },
  { id: 'set:beto', name: 'Beto', look: 'townA' },
  { id: 'set:cida', name: 'Cida', look: 'townC' },
  { id: 'set:dede', name: 'Dedé', look: 'kid' },
  { id: 'set:edu', name: 'Edu', look: 'mayor' },
];

export const PROVA_SETTLERS = [
  { id: 'set:iara', name: 'Iara', look: 'townB' },
  { id: 'set:joca', name: 'Joca', look: 'townA' },
  { id: 'set:keli', name: 'Keli', look: 'townC' },
  { id: 'set:lalo', name: 'Lalo', look: 'kid' },
  { id: 'set:mara', name: 'Mara', look: 'farmer' },
];

/** Normas que a Anomia apaga (placas na Cidade). */
export const CITY_NORMS = [
  { id: 'cn1', rule: 'A fila do pão: um por vez', x: 7, y: 4 },
  { id: 'cn2', rule: 'A horta é de quem planta', x: 14, y: 12 },
  { id: 'cn3', rule: 'Ferramenta emprestada volta limpa', x: 24, y: 12 },
];
