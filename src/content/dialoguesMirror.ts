import type { Dialogue } from './types';

/** Diálogos do Templo do Espelho. */
export const MIRROR_DIALOGUES: Record<string, Dialogue> = {
  // ---------------------------------------------------------------- Pólis
  sign_ne: [{ text: 'Para o norte, pela trilha: Templo do Espelho. "Quem entra, entra sozinho. Quem sai, sai com todos."' }],
  clara_mirror: [
    { who: 'Profª Clara', text: 'A trilha do norte, atrás da escola, leva ao Templo do Espelho.' },
    { who: 'Profª Clara', text: 'Lá dentro você vira um indivíduo: ninguém, sem nome, sem verbo. E vai precisar de quatro instituições pra virar sujeito.' },
    { who: 'Profª Clara', text: 'Família, escola, trabalho e Estado. Aristóteles te espera na Ágora.' },
    { set: 'town.clara7' },
  ],
  clara_mirror_wait: [{ who: 'Profª Clara', text: 'O Templo do Espelho fica na trilha do norte, atrás da escola. Quatro instituições, quatro verbos.' }],
  clara_after_mirror: [
    { who: 'Profª Clara', text: 'Você voltou do Espelho com os quatro verbos. E com uma regra nova na praça, pelo que vi.' },
    { who: 'Profª Clara', text: 'Indivíduo, sujeito, animal político, alteridade: está no Caderno.' },
    { set: 'town.clara8' },
  ],
  clara_mirror_done: [{ who: 'Profª Clara', text: 'Faltam a Torre das Escalas e os Distritos. Depois disso, o Caderno fecha o capítulo.' }],
  praca_18: [{ text: 'PRAÇA DE PÓLIS — fecha às 18h.' }],
  praca_22: [{ text: 'PRAÇA DE PÓLIS — aberta até as 22h. (Regra mudada por voto na Assembleia.)' }],

  // ----------------------------------------------------------------- Hall
  mirror_intro: [
    { text: '(Um espelho na entrada. Você olha e vê uma silhueta cinza, sem nome.)' },
    { text: '(Aqui você é só um indivíduo: um ser humano isolado. Nenhum verbo. Quatro portas: Família, Escola, Trabalho, Estado.)' },
    { text: '(Cada instituição ensina um verbo. Com os quatro, o chão do centro se abre para a Ágora.)' },
  ],
  hall_center_locked: [{ text: '(O chão do centro está fechado. Faltam verbos: só um sujeito desce à Ágora.)' }],
  hall_subject: [
    { text: '(Quatro verbos. A silhueta cinza ganhou cor, nome e jeito. Você virou sujeito: age de forma consciente e pode mudar a sociedade que te formou.)' },
    { text: '(O chão do centro se abriu. A Ágora espera.)' },
  ],

  // -------------------------------------------------------------- Família
  familia_intro: [
    { text: '(Uma casa. Uma mesa com três pessoas conversando. No fundo, uma fila para um balcão onde brilha uma chave.)' },
    { text: '(Você tenta entrar na fila: ninguém te deixa. Você não sabe esperar a vez.)' },
  ],
  table_choice: [
    { text: '(As três pessoas falam, uma de cada vez.)' },
    {
      choice: 'O que você faz?',
      options: [
        { label: 'Esperar a vez de falar', event: 'fam:wait' },
        { label: 'Falar por cima de todo mundo', event: 'fam:interrupt' },
      ],
    },
  ],
  table_interrupt: [{ text: '(Você fala por cima. Os três param, olham, e voltam a falar entre si. Ninguém te ouviu. A conversa recomeça do zero.)' }],
  table_done: [
    { who: 'Mãe', text: 'Você esperou cada um terminar. Agora é a sua vez. O que você quer?' },
    { text: '(Verbo aprendido: RESPEITAR A VEZ. A fila do balcão agora é só esperar.)' },
    { event: 'fam:learned' },
  ],
  queue_blocked: [{ who: 'Pessoa da fila', text: 'Ei! Tem fila. Entra atrás, como todo mundo.' }],
  queue_ok: [
    { text: '(Você entra atrás. A fila anda. Uma pessoa sai, outra, outra. Chegou a sua vez.)' },
    { event: 'fam:queue' },
  ],
  familia_key: [{ text: '(Chave da Família. "Com a família aprendi valores: respeito, responsabilidade, honestidade.")' }],

  // --------------------------------------------------------------- Escola
  escola_intro: [
    { text: '(Uma sala de aula. Três caixas fechadas, cada uma com uma placa. As placas são rabiscos: você não sabe ler.)' },
    { text: '(A professora está no quadro. Fale com ela, três vezes.)' },
  ],
  box_scribble: [{ text: '(Placa: ▓▒░▓▒. Rabiscos. Você ainda não lê.)' }],
  box_wrong: [{ text: '(A caixa abre: nada que sirva. A placa dizia o que tinha dentro.)' }],
  escola_key: [{ text: '(Chave da Escola. "Com a escola aprendi a conviver com opiniões diferentes e a ler o mundo.")' }],
  lesson_done: [
    { who: 'Professora', text: 'Pronto. As formas viraram sons, os sons viraram palavras. Olha as placas de novo.' },
    { text: '(Verbo aprendido: LER.)' },
    { event: 'esc:learned' },
  ],

  // ------------------------------------------------------------- Trabalho
  trabalho_intro: [
    { text: '(Uma oficina de ponte. Um abismo corta a sala; do outro lado, a chave. A ponte está sem tábuas.)' },
    { text: '(A mestra de obras tem uma pilha de tábuas. Leve uma de cada vez até a ponte.)' },
  ],
  mestra_line: [{ who: 'Mestra de obras', text: 'Tábua por tábua. Ninguém aprende a consertar olhando.' }],
  plank_take: [{ text: '(Você pega uma tábua. Leve até a beira do abismo.)' }],
  plank_place: [{ text: '(Tábua encaixada. A ponte cresceu.)' }],
  bridge_done: [
    { who: 'Mestra de obras', text: 'Três tábuas, uma ponte. Agora você sabe o que o trabalho ensina: fazer.' },
    { text: '(Verbo aprendido: CONSERTAR.)' },
    { event: 'trab:learned' },
  ],
  trabalho_key: [{ text: '(Chave do Trabalho. "Com o trabalho aprendi disciplina e a fazer parte de algo.")' }],

  // --------------------------------------------------------------- Estado
  estado_intro: [
    { text: '(Um cartório à esquerda; à direita, atrás de um portão, a Assembleia. Sem documento, o portão não abre.)' },
  ],
  cartorio: [
    { who: 'Escrivã', text: 'Documento? Preciso saber quem você é. Nome: {name}. Onde nasceu?' },
    {
      choice: 'Onde você nasceu?',
      options: [
        { label: 'Numa ilha, longe daqui', event: 'est:doc' },
        { label: 'Aqui mesmo, em Pólis', event: 'est:doc' },
      ],
    },
  ],
  cartorio_done: [
    { who: 'Escrivã', text: 'Registrado. Com isso você entra em prédio público, vota, usa o posto de saúde e paga imposto em tudo que compra.' },
    { text: '(Verbo aprendido: DOCUMENTO. O portão da Assembleia abriu.)' },
    { event: 'est:learned' },
  ],
  cartorio_again: [{ who: 'Escrivã', text: 'Já está registrado. A Assembleia é ali.' }],
  gate_locked: [{ who: 'Guarda', text: 'Prédio público. Só entra com documento.' }],
  assembleia: [
    { who: 'Presidente', text: 'Cidadão com documento! Chegou na hora: votamos a regra da praça.' },
    {
      choice: 'Em que você vota?',
      options: [
        { label: 'Praça aberta até as 22h', event: 'est:vote:p1' },
        { label: 'Manter: fecha às 18h', event: 'est:vote:p2' },
      ],
    },
  ],
  assembleia_done: [
    { who: 'Presidente', text: 'Aprovado. A regra mudou porque você votou. Um sujeito não só obedece: transforma.' },
    { text: '(Verbo aprendido: VOTO. Volte a Pólis depois e olhe a placa da praça.)' },
    { event: 'est:voted' },
  ],
  estado_key: [{ text: '(Chave do Estado. "Com o Estado tenho documento, serviços públicos, leis e impostos.")' }],

  // ---------------------------------------------------------------- Ágora
  agora_intro: [
    { text: '(A Ágora: uma praça aberta. À direita, um lago e uma ilha com uma cabana. Dizem que ali vive o Eremita Orgulhoso.)' },
    { text: '(Na beira do lago, uma barqueira e um espelho. Talvez ela veja um caminho que você não vê.)' },
  ],
  barqueira: [{ who: 'Barqueira', text: 'A ilha? Eu atravesso a pé. Tem pedra no raso, mas só quem cresceu aqui enxerga. Olha no espelho.' }],
  mirror_swap: [
    { text: '(Você olha no espelho. Por um instante, é a barqueira olhando de volta. Você sente o lago como ela sente.)' },
    { text: '(Pedras aparecem no raso. Alteridade: ver com os olhos do outro.)' },
  ],
  mirror_unswap: [{ text: '(Você volta a ser você. As pedras somem; o caminho da barqueira é dela.)' }],
  mirror_onwater: [{ text: '(Melhor não voltar a ser você em cima da água.)' }],
  eremita_first: [
    { who: 'Eremita', text: 'Saiu da pólis pra me ver? Perda de tempo. Eu não preciso de ninguém. Tenho meu barco, meu peixe, meu silêncio.' },
    { text: '(Um estalo. O barco dele parte ao meio na areia.)' },
    { who: 'Eremita', text: '...Barco quebrado. Tábua, nó e licença pra atracar na pólis, que é onde tem madeira. Eu não tenho nada disso.' },
    {
      choice: 'O que você faz?',
      options: [
        { label: 'Oferecer ajuda', event: 'ag:help' },
        { label: 'Deixar ele aí', event: 'ag:leave' },
      ],
    },
  ],
  eremita_help: [
    { who: 'Eremita', text: 'Ajuda? De um súdito de pólis? ...Tudo bem. Tábuas, o nó certo e a licença. Vai lá.' },
    { text: '(Na Ágora: Dona Cida tem tábuas, a Profª Lúcia tem o manual do nó, o Escrivão dá a licença. Cada um pede um verbo.)' },
  ],
  eremita_leave: [{ text: '(Você vira as costas. Ele fica, sem barco, sem ninguém. Nem deus nem bicho vive fora da pólis. Volte quando quiser.)' }],
  eremita_wait: [{ who: 'Eremita', text: 'Tábuas, nó, licença. Três coisas. Eu sozinho não consigo nenhuma.' }],
  eremita_fix: [
    { text: '(Tábuas, nó e licença. Você conserta o barco com ele: cada um segura uma ponta.)' },
    { who: 'Eremita', text: 'Família, escola, trabalho, Estado. Você trouxe a pólis inteira até aqui. Então eu volto pra ela.' },
    { event: 'ag:fixed' },
  ],
  helper_needs_verb: [{ text: '(Essa pessoa pede um verbo que você ainda não tem.)' }],
  helper_cida_wait: [
    { who: 'Dona Cida', text: 'Tenho tábuas. Mas espera: estou terminando de falar com a vizinha.' },
    { text: '(Você espera a vez. Ela termina, vira e sorri.)' },
    { who: 'Dona Cida', text: 'Leva as tábuas. E diz pro Eremita que a praça sente falta dele.' },
    { event: 'ag:got:respeitar' },
  ],
  helper_prof: [
    { who: 'Profª Lúcia', text: 'O manual do nó está aqui. Você sabe ler? Então lê.' },
    { text: '(Você lê: "Nó de marinheiro: duas voltas, passa por baixo, puxa." Aprendido.)' },
    { event: 'ag:got:ler' },
  ],
  helper_escr: [
    { who: 'Escrivão', text: 'Licença pra atracar na pólis? Só com documento. ...Tem. Carimbado.' },
    { event: 'ag:got:documento' },
  ],
  dispute_intro: [
    { who: 'Vizinho A', text: 'A água do poço é minha! Eu cavei!' },
    { who: 'Vizinho B', text: 'O poço está na praça! É de todos!' },
    { text: '(O Eremita, de volta, observa. Na pólis, isso se resolve pela fala.)' },
    {
      choice: 'O que você faz?',
      options: [
        { label: 'Argumentar: o que é justo para os dois?', event: 'ag:argue' },
        { label: 'Resolver na espada', event: 'ag:force' },
      ],
    },
  ],
  dispute_force: [{ text: '(Você saca a espada. A praça esvazia. Ninguém discute o justo com quem ameaça. A disputa continua, só que sem ninguém.)' }],
  dispute_argue: [
    { who: 'Você', text: 'Ele cavou; a praça é de todos. Então: ele cuida do poço, todos usam, e todos ajudam a cavar o próximo.' },
    { who: 'Vizinho A', text: '...Justo.' },
    { who: 'Vizinho B', text: 'Justo.' },
    { text: '(Pela fala e pela razão, a pólis decide o justo e o injusto. É isso que Aristóteles chamou de animal político.)' },
    { event: 'ag:argued' },
  ],
  aristoteles_intro: [
    { who: 'Aristóteles', text: 'Você entrou aqui como indivíduo e desce à praça como sujeito. Deixe-me dizer, com as palavras do livro, o que fez.' },
  ],
  aristoteles_post: [
    { who: 'Aristóteles', text: 'O ser humano só se realiza na pólis. Até o Eremita voltou. Está no Caderno, em "com as minhas palavras".' },
    { who: 'Aristóteles', text: 'A saída da Ágora leva a Pólis. Olhe a placa da praça quando chegar.' },
  ],
};
