export interface Look {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  /** óculos / detalhe opcional (cor), usado pelos Sábios */
  glasses?: string;
}

export const LOOKS: Record<string, Look> = {
  gray: { skin: '#9a9a9a', hair: '#7a7a7a', shirt: '#8a8a8a', pants: '#6a6a6a' },
  hero: { skin: '#f1c27d', hair: '#3b2a1a', shirt: '#2ab7a9', pants: '#2f3f7a' },
  lia: { skin: '#c68642', hair: '#1a1a1a', shirt: '#e0a030', pants: '#5a3a6a' },
  clara: { skin: '#f1c27d', hair: '#a04a2a', shirt: '#8b5cf6', pants: '#2a2a3a', glasses: '#1a1a1a' },
  ze: { skin: '#8d5524', hair: '#1a1a1a', shirt: '#4a6a9a', pants: '#3a3a3a' },
  maria: { skin: '#f1c27d', hair: '#6a3a1a', shirt: '#d04545', pants: '#2a2a4a' },
  bia: { skin: '#c68642', hair: '#2a1a0a', shirt: '#f0e060', pants: '#3a5a8a' },
  guard: { skin: '#e0ac69', hair: '#2a2a2a', shirt: '#4a4a5a', pants: '#2a2a2a' },
  mayor: { skin: '#f1c27d', hair: '#cfcfcf', shirt: '#2a2a2a', pants: '#1a1a1a' },
  mills: { skin: '#f1c27d', hair: '#e8e8e8', shirt: '#6b5c3e', pants: '#3a3a3a', glasses: '#1a1a1a' },
  townA: { skin: '#8d5524', hair: '#1a1a1a', shirt: '#2a8a4a', pants: '#3a3a3a' },
  townB: { skin: '#f1c27d', hair: '#e0c050', shirt: '#d07030', pants: '#2a4a6a' },
  townC: { skin: '#c68642', hair: '#5a2a1a', shirt: '#7a3a8a', pants: '#2a2a2a' },
  kid: { skin: '#e0ac69', hair: '#2a1a0a', shirt: '#f08080', pants: '#2a4a6a' },
  farmer: { skin: '#c68642', hair: '#3a2a1a', shirt: '#9a7a3a', pants: '#4a3a2a' },
  baker: { skin: '#f1c27d', hair: '#6a3a1a', shirt: '#f4ecd8', pants: '#4a3a2a' },
  smith: { skin: '#8d5524', hair: '#1a1a1a', shirt: '#5a5a6a', pants: '#2a2a2a' },
  doctor: { skin: '#f1c27d', hair: '#1a1a1a', shirt: '#e8f0ff', pants: '#2a4a6a' },
  teacher: { skin: '#c68642', hair: '#6a3a1a', shirt: '#3a7a9a', pants: '#2a2a3a' },
  durkheim: { skin: '#f1c27d', hair: '#3a3a3a', shirt: '#2a2a2a', pants: '#1a1a1a', glasses: '#1a1a1a' },
  simmel: { skin: '#f1c27d', hair: '#8a8a8a', shirt: '#4a3a5a', pants: '#1a1a1a' },
  king: { skin: '#f1c27d', hair: '#e6c45a', shirt: '#6a1a8a', pants: '#2a1a3a' },
  dogma: { skin: '#9a9a9a', hair: '#3a3a3a', shirt: '#2a2a2a', pants: '#1a1a1a' },
  montesquieu: { skin: '#f1c27d', hair: '#e8e8e8', shirt: '#8a3a3a', pants: '#2a2a3a' },
  comte: { skin: '#f1c27d', hair: '#4a3a2a', shirt: '#2a3a6a', pants: '#1a1a1a', glasses: '#1a1a1a' },
  adam: { skin: '#f1c27d', hair: '#d8d8d8', shirt: '#3a5a3a', pants: '#2a2a2a' },
  worker: { skin: '#c68642', hair: '#2a1a0a', shirt: '#7a7a8a', pants: '#3a3a3a' },
};
