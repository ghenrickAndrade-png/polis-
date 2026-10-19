import type { Dialogue } from './types';
import { VILLAGE_DIALOGUES } from './dialoguesVillages';
import { CASTLE_DIALOGUES } from './dialoguesCastle';
import { MIRROR_DIALOGUES } from './dialoguesMirror';
import { SCALES_DIALOGUES } from './dialoguesScales';
import { DISTRICT_DIALOGUES } from './dialoguesDistricts';

/** Todos os diálogos do jogo. Caixas curtas (até 3 linhas). */
export const DIALOGUES: Record<string, Dialogue> = {
  ...VILLAGE_DIALOGUES,
  ...CASTLE_DIALOGUES,
  ...MIRROR_DIALOGUES,
  ...SCALES_DIALOGUES,
  ...DISTRICT_DIALOGUES,
  // ------------------------------------------------------------ Ilha
  island_intro: [
    { text: '(Você acorda na areia. Não lembra como chegou aqui.)' },
    { text: '(Sozinho. Só o som do mar e um caranguejo andando em círculos.)' },
    { text: '(Talvez tenha mais alguém nesta ilha.)' },
  ],
  crab: [
    { text: '(O caranguejo faz o mesmo caminho desde que você chegou.)' },
    { text: '(Ele não planeja, não aprende, não combina nada com os outros caranguejos. É instinto.)' },
  ],
  island_sign: [
    { text: '"Ilha do Eremita. Quem chegar: a madeira seca fica no meio da ilha."' },
    { text: '(Alguém escreveu isto antes de você. Você não precisou descobrir sozinho.)' },
  ],
  log_alone: [{ text: '(Um tronco atravessado no único caminho. Pesado demais para uma pessoa só.)' }],
  log_far: [{ who: 'Lia', text: 'Espera eu chegar! Sozinho você não levanta isso.' }],
  lia_meet: [
    { who: 'Lia', text: 'Ei! Mais alguém! Achei que eu era a única aqui.' },
    { who: 'Lia', text: 'Eu sou a Lia. E você, como se chama?' },
    {
      choice: 'Como você se chama?',
      options: [
        { label: 'Noa', event: 'name:Noa' },
        { label: 'Davi', event: 'name:Davi' },
        { label: 'Luna', event: 'name:Luna' },
        { label: 'Caio', event: 'name:Caio' },
      ],
    },
    { who: 'Lia', text: '{name}. Prazer.' },
    { who: 'Lia', text: 'Tem um tronco bloqueando o caminho pro meio da ilha. Eu tentei, mas sozinha não dá.' },
    { who: 'Lia', text: 'Vamos juntos? Eu te acompanho.' },
    { event: 'lia:join' },
  ],
  lia_follow: [{ who: 'Lia', text: 'O tronco fica ali pra cima, entre as árvores. Vamos.' }],
  lia_after_log: [{ who: 'Lia', text: 'Viu? A dois foi fácil. Vamos ver o que tem no meio da ilha.' }],
  lia_after_raft: [{ who: 'Lia', text: 'A jangada está pronta. Quando quiser, a gente vai. Mas ela só navega com dois.' }],
  lia_cooperate: [
    { who: 'Lia', text: 'Vai, no três. Um... dois... três!' },
    { event: 'island:lift' },
  ],
  woodpile_alone: [{ text: '(Madeira seca, boa para uma jangada. Amarrar as toras exige quatro mãos.)' }],
  woodpile_build: [
    { who: 'Lia', text: 'Madeira seca! Dá pra fazer uma jangada.' },
    { who: 'Lia', text: 'Você segura, eu amarro. Depois trocamos.' },
    { event: 'island:build' },
  ],
  newcomers: [
    { who: 'Náufrago', text: 'Uma jangada! Pronta! Vocês que fizeram?' },
    { who: 'Náufraga', text: 'Então a gente não precisa começar do zero. Obrigada.' },
    { event: 'island:legacy' },
  ],
  newcomers_after: [{ who: 'Náufrago', text: 'Quem chega depois aproveita o que ficou. É assim desde sempre, né?' }],
  raft_choice: [
    { text: '(A jangada balança na água. Pólis fica do outro lado do mar.)' },
    {
      choice: 'O que você faz?',
      options: [
        { label: 'Ir para Pólis com a Lia', event: 'island:go' },
        { label: 'Ficar mais um tempo na ilha, sozinho', event: 'island:stay' },
      ],
    },
  ],
  raft_stay: [
    { who: 'Lia', text: 'Às vezes dá vontade de ficar só, eu entendo.' },
    { who: 'Lia', text: 'Mas a jangada só navega com dois. Quando quiser ir, me chama.' },
  ],
  raft_go: [
    { who: 'Lia', text: 'Então vamos. Pólis é grande, dizem que tem uma escola e uma praça.' },
    { event: 'island:depart' },
  ],

  // ------------------------------------------------------------ Pólis
  lia_town: [
    { who: 'Lia', text: 'Chegamos! Vai lá falar com a Professora Clara, na frente da escola.' },
    { who: 'Lia', text: 'Eu fico aqui olhando o mar um pouco.' },
  ],
  clara_first: [
    { who: 'Profª Clara', text: 'Você chegou pela jangada? Então já sabe a primeira coisa: ninguém chega sozinho.' },
    { who: 'Profª Clara', text: 'Eu sou a Clara. Dou aula de Sociologia aqui em Pólis.' },
    { who: 'Profª Clara', text: 'A cidade está estranha. Todo mundo acha que seus problemas são só seus.' },
    { who: 'Profª Clara', text: 'No Templo da Lente, ao norte, existe um jeito de ver além disso. Vai lá e volta pra me contar.' },
    { set: 'town.clara1' },
  ],
  clara_wait: [
    { who: 'Profª Clara', text: 'O Templo da Lente fica ao norte da praça, pela estrada de terra.' },
    { who: 'Profª Clara', text: 'Lá dentro, aperte X para usar a Lente. E abra o Caderno com C sempre que quiser.' },
  ],
  clara_after_lens: [
    { who: 'Profª Clara', text: 'Você voltou com outra cara. Viu os fios?' },
    { who: 'Profª Clara', text: 'Isso que você fez tem nome: imaginação sociológica. Está no seu Caderno.' },
    { who: 'Profª Clara', text: 'Agora olha de novo pra praça. Zé, Maria, Bia... os problemas deles mudaram de tamanho.' },
    { who: 'Profª Clara', text: 'Quando quiser, a estrada do leste leva às Duas Aldeias. Fale comigo antes de ir.' },
    { set: 'town.clara2' },
  ],
  clara_done: [
    { who: 'Profª Clara', text: 'Repassa o Caderno antes da prova. Ele guarda o que você fez e o que o livro diz.' },
    { who: 'Profª Clara', text: 'E se quiser imprimir, o Resumão está no menu de pausa.' },
  ],
  ze_town: [
    { who: 'Zé', text: 'Trinta anos na Metalúrgica. Aí ela fechou e eu fiquei sem nada.' },
    { who: 'Zé', text: 'Deve ser culpa minha. Devia ter estudado mais.' },
  ],
  ze_town_after: [
    { who: 'Zé', text: 'Então não era só comigo. Eram trezentos. Trezentos "culpados"?' },
    { who: 'Zé', text: 'O problema é maior que eu. E se é maior que eu, se resolve junto.' },
  ],
  maria_town: [
    { who: 'Maria', text: 'Minha lanchonete era na porta da Metalúrgica. Sem operário, sem freguês.' },
    { who: 'Maria', text: 'Estou devendo três meses de aluguel. Vergonha.' },
  ],
  maria_town_after: [
    { who: 'Maria', text: 'Vergonha de quê, no fim? A fábrica fechou e levou meus clientes junto.' },
    { who: 'Maria', text: 'Isso é assunto pra cidade inteira, não pra eu chorar escondida.' },
  ],
  bia_town: [
    { who: 'Bia', text: 'Parei de estudar pra ajudar em casa. Meu pai era da Metalúrgica.' },
    { who: 'Bia', text: 'Minhas amigas dizem que eu desisti. Talvez tenham razão.' },
  ],
  bia_town_after: [
    { who: 'Bia', text: 'Desistir é quando a escolha é sua. A minha não foi muito escolha.' },
    { who: 'Bia', text: 'A professora disse que isso tem nome: esfera pública entrando na minha vida.' },
  ],
  sign_temple: [{ text: 'TEMPLO DA LENTE — "Quem vê o que está na frente vê só metade."' }],
  sign_west: [{ text: 'Para o oeste: Templo do Espelho. (Em obras. Abre na próxima versão.)' }],
  sign_east: [{ text: 'Para o leste: Duas Aldeias. (Em obras. Abre na próxima versão.)' }],
  sign_school: [{ text: 'ESCOLA DE PÓLIS — Sociologia com a Profª Clara. "Desnaturalizar é ver que podia ser diferente."' }],
  townA: [{ who: 'Morador', text: 'Dizem que o Prefeito vive no templo agora. Só fala em esforço.' }],
  townB: [{ who: 'Moradora', text: 'Todo mundo com problema, e cada um acha que é azar seu. Engraçado, né?' }],

  // ------------------------------------------------------- Templo da Lente
  hall_plaque: [{ text: '"O que parece um problema só seu costuma ser vivido por milhares. Olhe com a Lente."' }],
  lens_pickup_hint: [{ text: 'Aperte X para ligar a Lente. Com ela ligada, fale com as pessoas e toque os pilares.' }],
  lens1_intro: [
    { text: '(Três pessoas de Pólis. Cada uma com um problema que chama de seu.)' },
    { text: '(Três pilares. Em cada um, uma explicação possível.)' },
    { text: '(Ligue a Lente com X. Fale com uma pessoa para pegar o fio dela e leve-o até um pilar.)' },
  ],
  lens1_ze: [{ who: 'Zé', text: 'Perdi o emprego. Trinta anos de casa. Deve ter sido falta de esforço.' }],
  lens1_maria: [{ who: 'Maria', text: 'Não consigo pagar o aluguel da lanchonete. Que azar o meu.' }],
  lens1_bia: [{ who: 'Bia', text: 'Parei de estudar pra trabalhar. Todo mundo diz que eu desisti.' }],
  lens1_done: [
    { text: '(Três fios, um só nó. Três "culpas" diferentes, uma causa em comum.)' },
    { text: '(O que parecia três problemas privados era uma questão pública: a fábrica que fechou.)' },
  ],
  lens2_intro: [
    { text: '(Um abismo. Do lado de cá, quatro momentos da sua vida. Perto da beira, quatro acontecimentos da história.)' },
    { text: '(Pegue um momento no pedestal e encaixe no acontecimento que o explica. A ponte cresce a cada encaixe.)' },
  ],
  lens2_done: [{ text: '(Sua vida sobre a história. Biografia e sociedade, lado a lado: a ponte atravessa.)' }],
  lens3_intro: [
    { text: '(Três portões. Três guardas. Três regras que "sempre foram assim".)' },
    { text: '(Com a Lente ligada, toque a placa de cada regra para ver de onde ela veio.)' },
  ],
  lens3_done: [{ text: '(Nenhuma das três regras era natural. Todas tinham data e autor. O que foi criado pode ser mudado.)' }],
  lens4_intro: [
    { text: '(Uma praça com um mural de posts. Seis pessoas, seis telas.)' },
    { text: '(Com a Lente, dá para ver o que cada uma pensa de verdade e o que ela posta.)' },
  ],
  lens4_done: [
    { text: '(Quando um disse o que pensava, o outro se sentiu menos sozinho para dizer também.)' },
    { text: '(A pressão do grupo caiu. Liberdade de se expressar e expectativa da sociedade: a tensão é essa.)' },
  ],
  boss_intro: [
    { who: 'Prefeito', text: 'Ah, o turista da Lente. Veio defender os preguiçosos?' },
    { who: 'Prefeito', text: 'Cada um tem o que merece. Quem se esforça, vence. Quem chora, perde.' },
    { who: 'Prefeito', text: 'Olha só a fila de reclamação que eu tenho hoje. Cinco casos. Cinco fracassos pessoais!' },
    { text: '(Ligue a Lente. Ligue cada caso ao que realmente o causou. Quando o fio segurar, o Prefeito perde o equilíbrio: aí é hora de atacar.)' },
  ],
  boss_defeat: [
    { who: 'Prefeito', text: 'Cinco casas na mesma enchente... e eu dizendo que era preguiça.' },
    { who: 'Prefeito', text: 'Se a causa é pública, a solução também é. Isso vai custar caro pra prefeitura.' },
    { text: '(O Culpador caiu. A porta do fundo se abriu.)' },
  ],
  sage_intro: [
    { who: 'Mills', text: 'Você chegou com a Lente na mão e o Prefeito no chão. Bom.' },
    { who: 'Mills', text: 'Agora a prova: cinco pessoas que você nunca viu, três questões públicas diferentes.' },
    { who: 'Mills', text: 'Nem todo problema vai para o mesmo nó. Ligue cada um à causa certa.' },
  ],
  citizen_no_lens: [{ text: '(Ligue a Lente com X para pegar o fio desta pessoa.)' }],
  guard_no_lens: [{ who: 'Guarda', text: 'Não passa. Sempre foi assim.' }],
  poster_no_lens: [{ text: '(Ligue a Lente com X para ver o que a pessoa pensa de verdade.)' }],
  sage_done_pre: [{ who: 'Mills', text: 'Deixa eu dizer com as palavras do livro o que você acabou de fazer.' }],
  sage_done_post: [
    { who: 'Mills', text: 'Está no seu Caderno, na página da imaginação sociológica, como "com as minhas palavras".' },
    { who: 'Mills', text: 'Volta pra Pólis. A professora quer ouvir.' },
  ],
};
