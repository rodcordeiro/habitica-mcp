---
name: habitica-rpg
description: Use when managing daily execution items through Habitica via MCP tools. Prefer Habitica for daily commitment (habits, dailies, todos, rewards), never as a project backlog manager.
---

# Habitica RPG — execução diária

Use as tools do Habitica MCP para **execução diária**. Não trate o Habitica como backlog de projeto, roadmap ou issue tracker.

Linguagem de domínio: alinhar com `CONTEXT.md` do repositório (`Item de execução`, `Afazer`, `Diária`, `Hábito`, `Recompensa`, `Planejamento do dia`).

## Segurança

- Nunca logar ou gravar credenciais Habitica, tokens, cookies ou headers `Authorization`.
- Escritas e pontuações **só** com `confirm: true`.
- Sem `confirm` (ou `confirm: false`): apenas preview — nenhuma mutação.

## Fluxo recomendado

1. **Ler** estado atual (`habitica_list_items`).
2. **Preview** da mudança (`habitica_preview_todo` / `habitica_preview_day_plan` ou tool de escrita sem confirm).
3. **Confirmar** com o usuário quando houver risco (criação em lote, conclusão, score).
4. **Executar** com `confirm: true`.

## Tools

### `habitica_list_items` (leitura)

- Quando: consultar hábitos, diárias, afazeres ou recompensas.
- Args: `tipo?` (`habit|daily|todo|reward`), `ativo?` (boolean).
- Não usar: inventar itens; filtrar projeto externo no Habitica.

### `habitica_preview_todo` / `habitica_create_todo`

- Quando: criar um afazer único.
- Args: `titulo` (obrigatório), `notas?`, `dificuldade?` (`trivial|easy|medium|hard`), `data_limite?`, `tags?`; create também `confirm?`.
- Sem confirm: preview do payload. Com confirm: cria e devolve `Item de execução`.

### `habitica_preview_day_plan` / `habitica_create_day_plan`

- Quando: materializar uma lista **já decidida** do dia (não importar backlog inteiro).
- Args: `items[]` com `titulo`, `notas?`, `origem?`, `prioridade?` (`baixa|media|alta`); create também `confirm?`.
- Limite de itens por chamada; duplicidade título+origem é rejeitada/ignorada.
- Sempre marcar origem nas notas (`[origem:...]`).

### `habitica_complete_todo`

- Quando: concluir um afazer existente.
- Args: `id`, `confirm?`.
- Valida que o item é `todo`. Risco: altera XP/ouro/HP.

### `habitica_score_habit`

- Quando: pontuar hábito `up` ou `down`.
- Args: `id`, `direction` (`up|down`), `confirm?`.
- Risco: vida, ouro, XP, streak.

### `habitica_score_daily`

- Quando: concluir (`up`) ou desfazer (`down`) diária.
- Args: `id`, `direction?` (default `up`), `confirm?`.
- Risco: streak, vida, ouro, XP.

## Anti-padrões

- Importar épicos/issues/sprints inteiros para o Habitica.
- Criar ou pontuar sem confirmação explícita.
- Usar Habitica como fonte de verdade de projeto.
- Expor tokens em respostas, commits ou exemplos.
