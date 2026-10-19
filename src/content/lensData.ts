import type { Issue, Trouble } from '../logic/LensGraph';
import type { PersonalEvent, PublicEvent } from '../logic/Timeline';
import type { NaturalRule } from '../logic/OriginReveal';
import type { Poster } from '../logic/PressureSquare';

/** Sala 1 — três problemas, um só nó. */
export const LENS1_ISSUES: Issue[] = [
  { id: 'fabrica', label: 'A Metalúrgica fechou' },
  { id: 'esforco', label: 'Falta de esforço', commonSense: true },
  { id: 'azar', label: 'Azar', commonSense: true },
];
export const LENS1_TROUBLES: Trouble[] = [
  {
    id: 'ze',
    who: 'Zé',
    text: 'perdeu o emprego',
    clue: 'Trinta anos na Metalúrgica. Trezentos demitidos no mesmo dia.',
    issue: 'fabrica',
    wrongLines: { esforco: 'Então foi culpa minha? Mas foram trezentos no mesmo dia. Trezentos preguiçosos?', azar: 'Azar? Trezentas pessoas tiveram o mesmo azar, na mesma manhã?' },
  },
  {
    id: 'maria',
    who: 'Maria',
    text: 'não paga o aluguel',
    clue: 'A lanchonete ficava na porta da Metalúrgica. Os fregueses eram os operários.',
    issue: 'fabrica',
    wrongLines: { azar: 'Azar? Meus clientes sumiram todos de uma vez. Isso não é sorte, é a fábrica.', esforco: 'Esforço? Eu abria às cinco da manhã. Não dá pra vender lanche sem freguês.' },
  },
  {
    id: 'bia',
    who: 'Bia',
    text: 'parou de estudar',
    clue: 'O pai dela era da Metalúrgica. Sem o salário dele, alguém tinha que trabalhar.',
    issue: 'fabrica',
    wrongLines: { esforco: 'Eu não desisti. A fábrica fechou e a conta chegou em casa.', azar: 'Azar seria se fosse só comigo. Na minha sala, outras quatro pararam no mesmo mês.' },
  },
];

/** Sala 2 — biografia sobre a história. */
export const LENS2_PERSONAL: PersonalEvent[] = [
  { id: 'p1', text: 'Mudei de cidade com a família', year: 2009, cause: 'h1' },
  { id: 'p2', text: 'Fui morar na casa da avó', year: 2015, cause: 'h2' },
  { id: 'p3', text: 'Tive aula pelo celular', year: 2020, cause: 'h3' },
  { id: 'p4', text: 'Meu pai passou a trabalhar por aplicativo', year: 2018, cause: 'h4' },
];
export const LENS2_HISTORY: PublicEvent[] = [
  { id: 'h1', text: 'Crise econômica: demissões em massa', year: 2008 },
  { id: 'h2', text: 'Enchente do córrego', year: 2015 },
  { id: 'h3', text: 'Pandemia: escolas fechadas', year: 2020 },
  { id: 'h4', text: 'Reforma trabalhista', year: 2017 },
];

/** Sala 3 — regras "naturais" com data e autor. */
export const LENS3_RULES: NaturalRule[] = [
  {
    id: 'r1',
    rule: 'Mulheres não entram na biblioteca.',
    origin: 'Regra escrita em 1887 pelo Conselho dos Donos de Terra. Antes disso, entravam. Em outras cidades, nunca deixaram de entrar.',
    guardBefore: 'Sempre foi assim. Biblioteca não é lugar de mulher. Não passa.',
    guardAfter: '1887? Então antes entrava... Se alguém criou, alguém pode desfazer. Passa.',
  },
  {
    id: 'r2',
    rule: 'Na fila do pão, quem veste roupa escura passa na frente.',
    origin: 'Decreto do prefeito de 1951, pedido pelos donos de loja, que usavam terno. Virou "costume" em vinte anos.',
    guardBefore: 'É a ordem natural das coisas. Roupa clara espera.',
    guardAfter: 'Um decreto de 1951? Decreto se revoga. Vai, passa.',
  },
  {
    id: 'r3',
    rule: 'Só quem tem sobrenome de fundador pode votar.',
    origin: 'Costume criado pelas seis famílias fundadoras em 1902, numa reunião da qual só elas participaram.',
    guardBefore: 'Fundador sabe mais. Sempre foi assim, desde o começo.',
    guardAfter: 'Seis famílias decidiram sozinhas? Então não é natural, é escolha. E escolha muda.',
  },
];

/** Sala 4 — praça digital. */
export const LENS4_POSTERS: Poster[] = [
  { id: 'teo', name: 'Teo', thought: 'Não gosto do que todo mundo gosta.', post: 'Amei o show!!!', pressure: 8, tolerance: 4, neighbors: ['carol', 'dudu'] },
  { id: 'carol', name: 'Carol', thought: 'Estou cansada. Queria só ficar em casa.', post: 'Vida que segue! 💪', pressure: 6, tolerance: 4, neighbors: ['teo', 'nina'] },
  { id: 'dudu', name: 'Dudu', thought: 'Meu corpo não é o da foto que postei.', post: 'Treino pago! Sem desculpa!', pressure: 9, tolerance: 4, neighbors: ['rafa'] },
  { id: 'nina', name: 'Nina', thought: 'Prefiro ler a sair.', post: 'Sextou!! Bora!', pressure: 5, tolerance: 4, neighbors: ['lu'] },
  { id: 'rafa', name: 'Rafa', thought: 'Hoje fui mal na prova, e tudo bem.', post: 'Hoje fui mal na prova, e tudo bem.', pressure: 2, tolerance: 4, neighbors: ['dudu'] },
  { id: 'lu', name: 'Lu', thought: 'Tenho medo de dizer o que penso.', post: 'Concordo com todo mundo!', pressure: 7, tolerance: 4, neighbors: ['carol'] },
];

/** Chefe — O Culpador: cinco casos novos, uma causa pública. */
export const BOSS_ISSUES: Issue[] = [
  { id: 'corrego', label: 'Córrego sem obra de canalização' },
  { id: 'preguica', label: 'Preguiça', commonSense: true },
  { id: 'azar', label: 'Azar', commonSense: true },
  { id: 'castigo', label: 'Castigo', commonSense: true },
  { id: 'familia', label: 'Família desestruturada', commonSense: true },
];
export const BOSS_TROUBLES: Trouble[] = [
  { id: 'rita', who: 'Dona Rita', text: 'a casa alagou', clue: 'Mora na beira do córrego. A obra de canalização está prometida há 12 anos.', issue: 'corrego', wrongLine: 'Preguiça? A água subiu dois metros em uma hora. Eu corri com as crianças no colo.' },
  { id: 'tiao', who: 'Seu Tião', text: 'perdeu a oficina', clue: 'A oficina ficava na rua do córrego. Perdeu as ferramentas na água.', issue: 'corrego', wrongLine: 'Azar? Foi a rua inteira. Azar não escolhe rua.' },
  { id: 'jo', who: 'Jô', text: 'a filha ficou sem escola', clue: 'A escola do bairro alagou e fechou por dois meses.', issue: 'corrego', wrongLine: 'Castigo de quê? Trezentas crianças sem aula não é castigo, é descaso.' },
  { id: 'marta', who: 'Dona Marta', text: 'o ônibus parou de passar', clue: 'A ponte sobre o córrego caiu. Agora anda 40 minutos a pé.', issue: 'corrego', wrongLine: 'Minha família? A ponte caiu. Ponte não cai por causa da minha família.' },
  { id: 'edu', who: 'Edu', text: 'perdeu as encomendas', clue: 'Entregador. Perdeu o estoque guardado na garagem, na rua baixa.', issue: 'corrego', wrongLine: 'Eu trabalho 10 horas por dia. A água não perguntou se eu me esforço.' },
];

/** Prova do Sábio — cinco pessoas novas, quatro questões diferentes (e um nó de senso comum). */
export const SAGE_ISSUES: Issue[] = [
  { id: 'corte', label: 'Corte no orçamento da educação' },
  { id: 'salario', label: 'Salário baixo, aluguel alto' },
  { id: 'app', label: 'Trabalho por aplicativo sem direitos' },
  { id: 'tarifa', label: 'Tarifa do ônibus dobrou' },
  { id: 'esforco', label: 'Falta de esforço', commonSense: true },
];
export const SAGE_TROUBLES: Trouble[] = [
  { id: 'mel', who: 'Mel', text: 'perdeu a bolsa de estudos', clue: 'A bolsa era paga pela prefeitura, que cortou a verba da educação.', issue: 'corte', wrongLine: 'Esforço? Eu tinha a melhor nota da turma. A verba acabou, não a minha vontade.' },
  { id: 'jonas', who: 'Jonas', text: 'a escola fechou', clue: 'A prefeitura fechou três escolas pequenas para economizar.', issue: 'corte', wrongLine: 'Isso não explica. Fecharam três escolas de uma vez.' },
  { id: 'ana', who: 'Dona Ana', text: 'trabalha 12 horas e não sobra nada', clue: 'O salário não acompanhou o aluguel, que subiu três vezes em dois anos.', issue: 'salario', wrongLine: 'Eu já trabalho 12 horas. Quantas mais o esforço pede?' },
  { id: 'kiko', who: 'Kiko', text: 'foi desligado do aplicativo', clue: 'O app desligou mil entregadores no mesmo dia, sem aviso e sem direitos.', issue: 'app', wrongLine: 'Mil pessoas no mesmo dia. Isso não é sobre mim.' },
  { id: 'zefa', who: 'Vó Zefa', text: 'não consegue pagar a passagem', clue: 'A tarifa dobrou este ano. A aposentadoria não.', issue: 'tarifa', wrongLine: 'A tarifa dobrou pra todo mundo. Não foi eu que fiz a conta errada.' },
];
