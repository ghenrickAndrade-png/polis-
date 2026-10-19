# Decisões

- Phaser 3.90 + TypeScript + Vite 8, build em arquivo único (`vite-plugin-singlefile`) para publicar como Artifact e rodar offline.
- Mapas em ASCII dentro de `src/content/rooms/*` em vez de Tiled: legíveis no código, validados por teste, sem editor externo.
- Arte 100% procedural (padrões de pixels e Graphics → texturas) para não depender de download de assets; `assets/` não existe. Trocar por sprites reais = substituir `engine/textures.ts`.
- `zod` não entrou: a validação do conteúdo é feita por testes (`tests/content.test.ts`) em vez de em tempo de execução.
- Playwright não instala no ambiente (download bloqueado); QA visual com `@sparticuz/chromium` + `puppeteer-core` (`tools/shots.cjs`), com cenários em JSON e um `window.__polis` de depuração.
- Dentro do app o diálogo de impressão não abre: o Resumão oferece "Copiar texto" e só mostra "Imprimir" fora de iframe.
- A Prova dos Sábios das Duas Aldeias acontece na própria sala da Anomia, depois que a névoa dissipa, para não criar uma oitava sala.
- Texto das falas de "errado" nunca diz "errado": mostra a consequência (fio esgarça, nada se move, portão continua fechado).
- Som desligado por padrão (bleeps WebAudio); ligar na pausa ou no título.
