# Pólis

Jogo 2D top-down (estilo *Zelda*) que ensina o capítulo de introdução à Sociologia do 2º ano do ensino médio (págs. 12–51 do livro). Cada conceito vira um item ou uma mecânica; o Caderno do jogo usa o vocabulário do livro.

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # lógica dos puzzles + validação do conteúdo
npm run build      # dist/index.html (arquivo único, 1,3 MB)
node tools/artifact.cjs   # dist/polis.html — fragmento para publicar como Artifact
npm run shots      # screenshots automáticos com Chromium headless (QA visual)
```

Controles: setas/WASD mover · **Z**/Enter interagir ou atacar · **X** liga o item da área (Lente, Engrenagem, Cristal) · **C** Caderno · **Esc** pausa. No celular aparecem joystick e botões.

## O que está jogável

| Área | Conceitos | Item / mecânica |
| --- | --- | --- |
| Ilha do Eremita (tutorial) | sociabilidade e razão, identidade construída na convivência, tendência a se associar/isolar | verbo **Cooperar**, jangada que fica para quem chega depois |
| Templo da Lente (4 salas + chefe + Prova) | imaginação sociológica, esfera particular × pública, desnaturalizar, redes sociais | **Lente de Mills**: fios entre problemas privados e questões públicas |
| Duas Aldeias (6 salas + Anomia + Prova) | fato social, consciência coletiva × individual, solidariedade mecânica × orgânica, conflito (Durkheim × Simmel) | **Engrenagem**: anel de dependências, muros-norma invisíveis |
| Castelo das Luzes (salão + 3 alas + Absolutista + Prova) | Iluminismo; Montesquieu; Comte e positivismo; Adam Smith; 1776, 1789, Inconfidência | **Chama da Razão**, **Três Chaves**, Torre dos Três Estados, Fábrica de Alfinetes |
| Templo do Espelho (salão + 4 instituições + Ágora) | indivíduo × sujeito; animal político (Aristóteles); família, escola, trabalho, Estado; alteridade | **Verbos da socialização** aprendidos em cada instituição e usados na Ágora |
| Torre das Escalas (base + 3 andares + chefe duplo + Prova) | microssociologia × macrossociologia; ação social, controle social, relações de produção, coesão social; turismo e globalização | **Cristal de Escala**: na RUA as pessoas falam, no MAPA os fluxos aparecem; o quadro só fecha com um fato de cada escala |
| Distritos (Mesa da Cidade) | SUS (Constituição de 1988), desigualdade e pandemia nos distritos de São Paulo | simulação: fichas dos distritos, onda de 6 semanas, ações do SUS, "e se não houvesse SUS", Relatório de causas |

Em obras: Praça final com O Senso Comum (ver `docs/DESIGN.md`).

## Estrutura

```
src/
  config.ts            constantes e paleta
  content/             TUDO que é texto e dado do jogo (salas, diálogos, conceitos, dados dos puzzles)
  logic/               lógica pura dos puzzles, sem Phaser, coberta por testes
  engine/              texturas procedurais, Player, Npc, estado/save, input, sons
  scenes/              Boot, Title, Room (sala genérica), UI (HUD, diálogo, Caderno, toque)
  puzzles/             controladores de sala: ligam a lógica aos objetos da cena
tests/                 vitest (lógica + validação de conteúdo)
tools/                 shots.cjs (QA visual headless), artifact.cjs, cenários de teste
docs/                  DESIGN.md, CONTENT.md, DECISIONS.md
```

## Modo de depuração

`?room=<id>&spawn=<nome>&items=lens,gear,crystal&flags=a,b&pages=imaginacao&name=Noa&look=hero&god=1&touch=1`

Entra direto numa sala com itens, flags e páginas do Caderno. `window.__polis` expõe `state`, `bus` e `game` para scripts; `bus.emit('debug:tp', x, y, 'up')` teleporta o jogador e `bus.emit('debug:skipDialogue', 0)` avança um diálogo (escolhendo a opção 0; uma lista como `[1, 0, 2]` escolhe opção a opção).
