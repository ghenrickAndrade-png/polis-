import type { Dialogue } from './types';

/** Diálogos das Duas Aldeias (Durkheim e Simmel). */
export const VILLAGE_DIALOGUES: Record<string, Dialogue> = {
  // ---------------------------------------------------------------- Pólis
  sign_east_open: [{ text: 'Para o leste: Duas Aldeias. Uma onde todos fazem o mesmo; outra onde cada um faz uma coisa.' }],
  clara_villages: [
    { who: 'Profª Clara', text: 'A estrada do leste abriu. Lá tem duas aldeias que parecem opostas.' },
    { who: 'Profª Clara', text: 'Numa, todo mundo planta. Na outra, cada um faz uma coisa e depende dos outros.' },
    { who: 'Profª Clara', text: 'Durkheim passou a vida comparando as duas. Vai ver com os próprios olhos.' },
    { set: 'town.clara3' },
  ],
  clara_villages_wait: [{ who: 'Profª Clara', text: 'As Duas Aldeias ficam pela estrada do leste. Use a Engrenagem (X) para ver quem depende de quem.' }],
  clara_after_villages: [
    { who: 'Profª Clara', text: 'Você voltou da névoa. Então viu o que acontece quando as normas apagam.' },
    { who: 'Profª Clara', text: 'Semelhança e interdependência. Fato social. Conflito que separa e conflito que une.' },
    { who: 'Profª Clara', text: 'Está tudo no Caderno. Repassa antes da prova; o Resumão imprime.' },
    { set: 'town.clara4' },
  ],
  clara_villages_done: [{ who: 'Profª Clara', text: 'O Caderno tem oito páginas prontas. E a estrada do oeste leva a um castelo que vale a visita.' }],

  // ---------------------------------------------------------------- Hall
  hall_sign: [
    { text: 'ENCRUZILHADA DAS DUAS ALDEIAS' },
    { text: 'Norte: Aldeia das Semelhanças. Sul: Cidade das Engrenagens. Leste: Vila Nova (só depois de visitar as duas).' },
  ],
  gear_pickup_hint: [{ text: 'Aperte X para ligar a Engrenagem. Ela mostra quem depende de quem, e o que ninguém vê mas todos obedecem.' }],
  hall_locked_east: [{ text: '(O caminho do leste está fechado por uma corrente. Uma placa: "Primeiro veja as duas aldeias.")' }],

  // ---------------------------------------------------------------- Aldeia
  aldeia_intro: [
    { text: '(Seis roças iguais. Seis pessoas iguais, fazendo a mesma coisa, no mesmo ritmo.)' },
    { text: '(Uma luz forte cobre a aldeia inteira. Ela não vem de ninguém em particular.)' },
  ],
  farmer_line: [
    { who: 'Lavrador', text: 'Planto. Como todo mundo. Amanhã, igual. Depois de amanhã, igual.' },
    { who: 'Lavrador', text: 'Aqui ninguém precisa de ninguém em especial. Mas todo mundo olha todo mundo.' },
  ],
  farmer_line_gear: [
    { who: 'Lavrador', text: 'Planto. Como todo mundo.' },
    { text: '(Com a Engrenagem ligada: nenhuma engrenagem entre eles. Ninguém depende de ninguém em particular. Todos fazem o mesmo.)' },
  ],
  tonho_leave: [
    { who: 'Tonho', text: 'Planto. Como todo mundo.' },
    {
      choice: 'O que você faz?',
      options: [
        { label: 'Sugerir que ele vá tentar a vida na cidade', event: 'aldeia:leave' },
        { label: 'Deixar quieto', event: 'aldeia:nothing' },
      ],
    },
  ],
  tonho_leaving: [
    { who: 'Tonho', text: 'Cidade? Pode ser. Aqui, se eu for, ninguém sente falta: a roça é igual à do vizinho.' },
    { event: 'aldeia:tonho_goes' },
  ],
  tonho_gone_result: [
    { text: '(Tonho foi embora. As outras cinco roças seguem iguais. Nada parou. A luz continua forte.)' },
    { text: '(A união aqui vem da semelhança: um a menos não quebra nada, porque ninguém dependia dele em particular.)' },
  ],
  tree_sign: [{ text: '"Árvore comum. As frutas são de todos. Ninguém colhe antes da Festa da Colheita."' }],
  tree_choice: [
    { text: '(A árvore está carregada. A festa é só daqui a um mês.)' },
    {
      choice: 'O que você faz?',
      options: [
        { label: 'Colher uma fruta agora', event: 'aldeia:pick' },
        { label: 'Esperar a festa', event: 'aldeia:wait' },
      ],
    },
  ],
  tree_wait: [{ text: '(Você espera. A aldeia continua olhando para você, como olha para todos.)' }],
  tree_picked: [
    { text: '(Seis cabeças viram ao mesmo tempo. Ninguém grita. Ninguém precisa.)' },
    { who: 'Guarda', text: 'Aqui ninguém colhe antes da festa. Todo mundo viu. Você fica fora da roça até o sol se pôr.' },
    { event: 'aldeia:pushed' },
  ],
  aldeia_done: [
    { text: '(A aldeia reage como um corpo só: a mesma crença em todas as cabeças, e quase nenhum espaço para a sua.)' },
    { text: '(Consciência coletiva forte, consciência individual pequena. União pela semelhança.)' },
  ],

  // ---------------------------------------------------------------- Cidade
  cidade_intro: [
    { text: '(Horta, padaria, ferraria, posto, escola. Cinco funções, cinco pessoas diferentes.)' },
    { text: '(A luz coletiva aqui é fraca. Cada pessoa tem uma luzinha própria.)' },
    { text: '(Ligue a Engrenagem com X para ver quem depende de quem.)' },
  ],
  baker_choice: [
    { who: 'Seu Chico', text: 'Faço o pão da cidade inteira. A Bete me conserta o forno, a Lurdes me manda a farinha.' },
    {
      choice: 'O que você faz?',
      options: [
        { label: 'Sugerir que ele tire o dia de folga', event: 'cidade:stop' },
        { label: 'Deixar ele trabalhar', event: 'cidade:nothing' },
      ],
    },
  ],
  baker_stopped_choice: [
    { who: 'Seu Chico', text: 'Dia de folga! Vamos ver quanto tempo a cidade aguenta sem pão...' },
    {
      choice: 'O que você faz?',
      options: [
        { label: 'Pedir que ele volte ao forno', event: 'cidade:resume' },
        { label: 'Deixar ele de folga', event: 'cidade:nothing' },
      ],
    },
  ],
  cidade_stopped: [
    { text: '(O forno apagou. Em dez minutos, a horta parou de colher, a ferraria esfriou, o posto fechou, a escola esvaziou.)' },
    { text: '(Uma engrenagem parada trava o anel inteiro. Aqui cada um depende de todos.)' },
  ],
  cidade_resumed: [{ text: '(O forno acendeu. As engrenagens voltaram a girar, uma puxando a outra.)' }],
  cidade_done: [
    { text: '(Grande divisão do trabalho: cada um numa função, dependendo dos outros como os órgãos de um corpo.)' },
    { text: '(Consciência coletiva mais fraca, individual com mais espaço. União pela interdependência.)' },
  ],

  // ---------------------------------------------------------------- Vila Nova
  vila_intro: [
    { text: '(Cinco casas vazias, cinco colonos esperando. Eles querem uma cidade, não uma aldeia.)' },
    { text: '(Fale com cada colono e combine o que ele vai fazer. A Engrenagem mostra se o anel fechou.)' },
  ],
  vila_sign: [{ text: '"Vila Nova. Prefeita provisória: ninguém. Regra: a saída abre quando a vila girar."' }],
  vila_mechanical: [
    { text: '(Todos plantando. A luz coletiva ficou forte; ninguém depende de ninguém. É uma aldeia, não uma cidade.)' },
    { text: '(A saída não abre: os colonos pediram uma cidade que gire.)' },
  ],
  vila_organic: [
    { text: '(Cinco funções diferentes. As engrenagens encaixaram e o anel girou.)' },
    { text: '(Cada luz individual acendeu. A luz coletiva ficou fraca, mas a vila funciona junta: interdependência.)' },
  ],

  // ---------------------------------------------------------------- Normas
  normas_intro: [
    { text: '(Um corredor comum. As pessoas andam em zigue-zague, desviando de coisas que não estão lá.)' },
    { text: '(Ou estão?)' },
  ],
  norm_bump_first: [
    { text: '(Algo te empurra de volta. Você não vê nada. Mas as pessoas desviam exatamente daqui.)' },
    { text: '(Existia antes de você chegar. Empurra quem desobedece. Vale para todo mundo. Ligue a Engrenagem.)' },
  ],
  norm_reveal: [
    { text: '(Com a Engrenagem: os muros aparecem. São regras. Ninguém as escreveu aqui, mas todos as seguem.)' },
    { text: '(Exterioridade, coercitividade, generalidade: um fato social. Analise-o como coisa, não como opinião.)' },
  ],
  walker_line: [{ who: 'Passante', text: 'Por aqui não passa. Nem sei quem disse. Sempre foi assim. Dá a volta.' }],
  keeper_before: [
    { who: 'Porteiro', text: 'Taná?' },
    { text: '(Ele espera uma saudação que você não conhece. A língua daqui também é um fato social: veio antes de você.)' },
    { text: '(Aprenda com quem vive aqui. Três pessoas no corredor podem ensinar.)' },
  ],
  keeper_partial: [
    { who: 'Porteiro', text: 'Taná?' },
    { text: '(Você sabe parte da saudação. Falta aprender com o resto do grupo.)' },
  ],
  keeper_after: [
    { who: 'Porteiro', text: 'Taná?' },
    { who: 'Você', text: 'Taná! Oré... pitá?' },
    { who: 'Porteiro', text: 'Pitá, pitá. Aprendeu com a gente, não com um livro. Pode passar.' },
    { event: 'normas:open' },
  ],
  normas_done: [{ text: '(A língua se impôs a você, como se impõe a todos. E só caiu quando você aprendeu com o grupo.)' }],

  // ---------------------------------------------------------------- Conflito
  conflito_intro: [
    { text: '(À esquerda, uma roça e dois lavradores aos gritos. À direita, uma praça e duas guildas em silêncio hostil.)' },
    { text: '(Dois conflitos. Duas maneiras de ver o conflito.)' },
  ],
  fight_choice: [
    { who: 'Lavrador', text: 'A colheita se divide por igual! Sempre foi assim!' },
    { who: 'Lavrador 2', text: 'Eu plantei mais! Quero mais!' },
    { text: '(A luz coletiva pisca. A placa da regra está rachada. Pela beira da roça, uma névoa fina começa a entrar.)' },
    {
      choice: 'O que você faz?',
      options: [
        { label: 'Separar os dois e reacender a regra', event: 'conflito:separate' },
        { label: 'Deixar brigar', event: 'conflito:letfight' },
      ],
    },
  ],
  fight_separated: [
    { text: '(Você afasta os dois e aponta a placa. A regra volta a valer. A luz para de piscar; a névoa recua.)' },
    { text: '(Para Durkheim, o conflito é sinal de normas enfraquecidas: ameaça a coesão. Reacender a norma é a resposta.)' },
  ],
  fight_let: [
    { text: '(Eles continuam. A luz coletiva pisca mais rápido. A névoa entra pela roça e cobre o canteiro.)' },
    { text: '(Para Durkheim é isso: normas fracas, conflito, coesão em risco. A névoa vai te seguir.)' },
  ],
  guild_choice: [
    { who: 'Chefe dos padeiros', text: 'A praça é nossa de manhã. Os ferreiros fazem barulho e espantam os fregueses.' },
    { who: 'Chefe das ferreiras', text: 'A praça é nossa. O forno deles esquenta a forja e estraga o têmpera.' },
    { text: '(As duas guildas se evitam há meses. O portão da saída está trancado pelos dois lados.)' },
    {
      choice: 'O que você propõe?',
      options: [
        { label: 'Trazer a disputa para a praça, com regras e todo mundo olhando', event: 'conflito:plaza' },
        { label: 'Mandar cada guilda para o seu canto', event: 'conflito:corner' },
      ],
    },
  ],
  guild_corner: [
    { text: '(Cada guilda vai para o seu canto. Ninguém grita, ninguém resolve. O portão continua trancado.)' },
    { text: '(A tensão não sumiu; só ficou escondida. Fale de novo com os chefes se quiser tentar outra coisa.)' },
  ],
  guild_plaza: [
    { text: '(Você junta as duas guildas no meio da praça. Dez minutos de gritaria. Todo mundo ouve todo mundo.)' },
    { who: 'Chefe dos padeiros', text: 'Então fica assim: fornos de manhã, forja à tarde. E a praça é dos dois.' },
    { who: 'Chefe das ferreiras', text: 'Feito. E domingo a gente faz pão e ferramenta juntos, pra feira.' },
    { text: '(As duas guildas constroem uma ponte nova sobre o canal, no meio do caminho. O portão abre.)' },
    { text: '(Para Simmel, o conflito é uma forma normal de interação: resolve tensões, une os grupos e gera mudança.)' },
    { event: 'conflito:plaza_done' },
  ],
  conflito_done: [{ text: '(Dois conflitos: um que corrói a coesão quando a norma falha, outro que une quando é levado à praça.)' }],

  // ---------------------------------------------------------------- Anomia
  anomia_intro: [
    { text: '(A Cidade das Engrenagens, coberta de névoa. As engrenagens pararam. As placas das regras apagaram.)' },
    { text: '(As pessoas vagam fora de seus postos. Nada as segura. É a Anomia: sem normas, sem cadeia.)' },
    { text: '(Traga cada um de volta ao seu posto e reacenda as três placas. A espada afasta a névoa viva, mas não a dissipa.)' },
  ],
  lost_choice: [
    { who: 'Morador', text: 'Trabalhar pra quê? Ninguém mais faz a parte dele. Eu também não.' },
    {
      choice: 'O que você diz?',
      options: [
        { label: 'Lembrar quem depende do trabalho dele', event: 'anomia:back' },
        { label: 'Deixar vagar', event: 'anomia:leave' },
      ],
    },
  ],
  lost_leave: [{ text: '(Ele continua vagando. A névoa não muda.)' }],
  norm_dark: [{ text: '(Placa apagada. Dá para reacender: aperte A de novo para lembrar a regra em voz alta.)' }],
  anomia_cleared: [
    { text: '(A última engrenagem encaixou. A névoa se dissipa. As placas brilham.)' },
    { text: '(Normas de volta, cadeia de volta: a coesão voltou. A Anomia se desfez sem um só golpe de espada.)' },
  ],
  sages_intro: [
    { who: 'Durkheim', text: 'Você refez a cadeia e as normas. É o que eu diria: sem elas, a sociedade se desfaz.' },
    { who: 'Simmel', text: 'E eu diria que o conflito na praça foi o que uniu as guildas. Nós dois temos razão, cada um de um jeito.' },
    { who: 'Durkheim', text: 'A prova: cinco colonos novos chegaram. Monte com eles uma vila que gire sozinha.' },
  ],
  sages_done_pre: [{ who: 'Durkheim', text: 'Deixe-me dizer, com as palavras do livro, o que você construiu.' }],
  sages_done_post: [
    { who: 'Simmel', text: 'E lembre: a próxima disputa entre eles não é o fim. Levada à praça, pode ser um começo.' },
    { who: 'Durkheim', text: 'Está no Caderno, em "com as minhas palavras". A porta do norte leva a Pólis.' },
  ],
  settler_no_gear: [{ text: '(Ligue a Engrenagem com X para combinar as funções.)' }],
};
