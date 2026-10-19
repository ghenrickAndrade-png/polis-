import type { Dialogue } from './types';

/** Diálogos dos Distritos (pág. 29: SUS, desigualdade e pandemia). */
export const DISTRICT_DIALOGUES: Record<string, Dialogue> = {
  // ---------------------------------------------------------------- Pólis
  sign_dist: [{ text: 'DISTRITOS — A Mesa da Cidade. "Quem morreu mais na pandemia? E por quê?"' }],
  clara_dist: [
    { who: 'Profª Clara', text: 'O último templo é a Mesa da Cidade, na praia, à esquerda do porto. É uma maquete de São Paulo.' },
    { who: 'Profª Clara', text: 'Lá a pergunta é dura: na pandemia, quem morreu mais, e por quê? Leia as fichas dos distritos antes de agir.' },
    { who: 'Profª Clara', text: 'E lembre: saúde é direito de todos e dever do Estado. É isso que o SUS faz valer.' },
    { set: 'town.clara11' },
  ],
  clara_dist_wait: [{ who: 'Profª Clara', text: 'A Mesa da Cidade fica na praia, à esquerda do porto. Leia os seis distritos, depois enfrente a onda.' }],
  clara_after_dist: [
    { who: 'Profª Clara', text: 'Você fechou o capítulo. Todas as páginas do Caderno têm as palavras do livro e as suas.' },
    { who: 'Profª Clara', text: 'Abra o Caderno (C) e leia o Resumão antes da prova. O que você fez vale mais que o que decorou.' },
    { set: 'town.clara12' },
  ],
  clara_dist_done: [{ who: 'Profª Clara', text: 'O Caderno está completo. Releia o Resumão (C) quando quiser: ele conta o que você fez, com as palavras do livro.' }],

  // ------------------------------------------------------------------ Mesa
  dist_intro: [
    { who: 'Agente de Saúde', text: 'Esta mesa é São Paulo em miniatura. Seis distritos: o centro e cinco da periferia que o livro cita.' },
    { who: 'Agente de Saúde', text: 'Uma onda de covid vai passar. Antes de agir, leia a ficha de cada distrito: renda, casa, transporte, trabalho, plano de saúde.' },
    { text: '(Vá até a placa de cada distrito e leia. Quando tiver lido os seis, volte ao painel.)' },
  ],
  dist_agent_read: [{ who: 'Agente de Saúde', text: 'Ainda faltam fichas. Leia todos os distritos: a diferença entre eles é a resposta.' }],
  dist_read_done: [
    { who: 'Agente de Saúde', text: 'Você leu os seis. Reparou? No centro, casa com 2 pessoas, home office, plano de saúde. Na periferia, o contrário.' },
    { who: 'Agente de Saúde', text: 'Agora a onda chega. São 6 semanas. Por semana, você tem 2 ações do SUS para colocar em algum distrito.' },
    { who: 'Agente de Saúde', text: 'Posto de testes: menos casos. Leitos: mais cuidado para quem não tem plano. Vacinação: vale a partir da semana seguinte.' },
    { text: '(Use a placa de um distrito para colocar uma ação. No painel, avance a semana. Os números ficam na tela.)' },
  ],
  dist_agent_wave: [{ who: 'Agente de Saúde', text: 'Olhe os números por 100 mil moradores. O SUS tem pouco: onde ele faz mais diferença?' }],
  dist_agent_finished: [{ who: 'Agente de Saúde', text: 'A onda passou. Vá ao painel e feche o relatório.' }],
  dist_no_actions: [{ text: '(As duas ações desta semana já foram usadas. Avance a semana no painel.)' }],
  dist_already: [{ text: '(Este distrito já tem essa ação.)' }],
  dist_wave_over: [{ text: '(A onda acabou. Não há mais o que colocar: agora é hora do relatório, no painel.)' }],
  dist_report_intro: [
    { who: 'Agente de Saúde', text: 'Relatório final. Primeiro, o que aconteceu. Depois, uma pergunta: e se não houvesse SUS?' },
  ],
  dist_report_prova: [
    { who: 'Agente de Saúde', text: 'Agora a parte que vale: por que a periferia morreu mais que o centro? Escolha três causas que aparecem nas fichas que você leu.' },
    { who: 'Agente de Saúde', text: 'Cuidado com o senso comum: ele explica pela pessoa ("se cuidou menos") o que os dados explicam pela condição de vida.' },
  ],
  dist_cause_wrong: [{ text: '(Isso não está em nenhuma ficha que você leu. O relatório não aceita o que não aparece nos dados.)' }],
  dist_report_pre: [{ who: 'Agente de Saúde', text: 'Vou dizer, com as palavras do livro, o que você acabou de fazer.' }],
  dist_report_post: [
    { who: 'Agente de Saúde', text: 'Está no Caderno. O SUS, criado pela Constituição de 1988, garante atendimento público e gratuito a toda a população.' },
    { who: 'Agente de Saúde', text: 'Na pandemia ele foi essencial: atendeu quem não tem plano, ofereceu leitos, testes e vacina. E mostrou que precisa de mais investimento.' },
  ],
  dist_agent_done: [{ who: 'Agente de Saúde', text: 'O relatório está no Caderno. Se quiser rodar a onda de novo, com outras escolhas, saia e volte: a mesa reinicia.' }],
};
