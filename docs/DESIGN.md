# Pólis — desenho do jogo

## Pilares
1. **Mecânica antes de texto.** O jogador só lê a definição depois de usar a mecânica que a encarna.
2. **Não é quiz.** Entender se demonstra por ação no mundo: ligar, separar, organizar, trocar de item.
3. **Escolhas com consequência.** Toda opção é uma postura possível e muda o mundo de forma visível; o jogo mostra a consequência, não um "errado".
4. **Chefe = erro comum.** O Culpador ("o problema é só dele"), A Anomia (sem normas, sem cadeia).
5. **Vocabulário do livro.** O Caderno usa só a Bíblia de conteúdo (`src/content/concepts.ts`).

## Loop
Overworld (Pólis) → templo → salas em sequência, cada uma com um puzzle da mesma mecânica em situação nova → chefe → Prova do Sábio (tarefa de construção) → narração nas palavras do livro, salva no Caderno como "com as minhas palavras" → volta a Pólis.

## Cenas
- `Boot` (texturas procedurais) → `Title` → `Room` (genérica, reiniciada a cada sala) + `UI` (sempre ativa: HUD, diálogo, Caderno, toque, pausa).
- Uma sala = `RoomDef` em `src/content/rooms/*`: grid ASCII (legenda em `engine/tiles.ts`), entidades (NPC, porta, placa, item, gatilho, prop), spawns e o id de um controlador em `src/puzzles/*`.
- Controlador = classe que recebe a cena e trata `onInteract`, `onEvent` (diálogos e gatilhos), `onLens` (item ligado), `onAttack`, `update`.

## Mapa matéria → jogo
| Área | Págs. | Conceitos | Mecânica | Chefe |
| --- | --- | --- | --- | --- |
| Ilha do Eremita | 19, 33 | sociabilidade e razão; identidade na convivência; associar/isolar | Cooperar; jangada que fica | — |
| Templo da Lente | 12, 16, 33, Para refletir | imaginação sociológica; esferas; desnaturalizar; redes | Lente de Mills (fios); linha do tempo; modo Origem; praça digital | O Culpador |
| Duas Aldeias | 31, 50 | fato social; consciência coletiva/individual; solidariedade; conflito | Engrenagem (anel); luz coletiva; muros-norma; língua do grupo | A Anomia |
| Templo do Espelho | 23, 27, 33, 34 | indivíduo × sujeito; animal político; instituições; alteridade | Verbos da socialização (Família, Escola, Trabalho, Estado); Ágora | Prova do Espelho |
| Torre das Escalas | 28, 34 | micro × macro; ação social, controle social, relações de produção, coesão social; turismo/globalização | Cristal de Escala (RUA = pessoas falam; MAPA = fluxos aparecem); quadro de análise com as duas colunas | O Míope e o Gigante Cego; Prova de classificação |
| Distritos | 29 | SUS, desigualdade e pandemia; saúde como direito | Mesa da Cidade: fichas dos 6 distritos, onda de 6 semanas, 2 ações do SUS por semana (testes, leitos, vacina), contrafactual "sem SUS" | Relatório (3 causas que estão nos dados, não no senso comum) |
| Castelo das Luzes | 46, 50, 51, atividades | Iluminismo; Montesquieu; Comte; Smith | Chama da Razão (Dogma apaga); Três Chaves (decretos arbitrários); Torre dos Três Estados; Fábrica de Alfinetes e pedágios | O Absolutista |
| Praça final (em obras) | todas | transferência | todos os itens | O Senso Comum |
