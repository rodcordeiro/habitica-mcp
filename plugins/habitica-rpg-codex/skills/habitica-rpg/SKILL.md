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
- Remoção (`habitica_delete_item`) é **irreversível**; nunca use remoção no lugar de concluir/pontuar.

## Fluxo recomendado

1. **Ler** estado atual (`habitica_list_items`).
2. **Preview** da mudança (`habitica_preview_*` ou tool de escrita/update sem confirm).
3. **Confirmar** com o usuário quando houver risco (criação, update, lote, conclusão, score, remoção).
4. **Executar** com `confirm: true`.

## Tools

### `habitica_list_items` (leitura)

- Quando: consultar hábitos, diárias, afazeres ou recompensas.
- Args: `tipo?` (`habit|daily|todo|reward`), `ativo?` (boolean).
- Não usar: inventar itens; filtrar projeto externo no Habitica.

### `habitica_preview_todo` / `habitica_create_todo`

- Quando: criar um afazer único.
- Args: `titulo` (obrigatório), `slug?` (kebab-case; se omitido, gerado do título), `notas?`, `dificuldade?` (`trivial|easy|medium|hard`), `data_limite?`, `tags?`; create também `confirm?`.
- O `slug` preenche o **alias** da tarefa Habitica (`alias`); não vai nas notas.
- Sem confirm: preview do payload. Com confirm: cria e devolve `Item de execução`.

### `habitica_update_todo`

- Quando: editar título/notas/dificuldade/prazo/tags/alias de um afazer existente.
- Args: `id`, campos parciais (`titulo?`, `slug?`, `notas?`, `dificuldade?`, `data_limite?`, `tags?`), `confirm?`.
- Valida tipo `todo` antes do PUT. Sem confirm: preview.
- Não usar update no lugar de `habitica_complete_todo`.

### `habitica_preview_habit` / `habitica_create_habit`

- Quando: **criar** um hábito novo (não para pontuar um existente — use `habitica_score_habit`).
- Args: `titulo`, `slug?`, `notas?`, `dificuldade?`, `up?` / `down?` (default ambos `true`; pelo menos um deve ser `true`); create também `confirm?`.
- Slug → alias; marcadores legados `[slug:...]` nas notas são removidos.

### `habitica_update_habit`

- Quando: editar título/notas/dificuldade/botões de um hábito existente.
- Args: `id`, campos parciais (`titulo?`, `slug?`, `notas?`, `dificuldade?`, `up?`+`down?` juntos), `confirm?`.
- Valida tipo `habit` antes do PUT. Sem confirm: preview.

### `habitica_preview_daily` / `habitica_create_daily`

- Quando: **criar** uma diária nova (não para concluir — use `habitica_score_daily`).
- Args: `titulo`, `slug?`, `notas?`, `dificuldade?`, `frequencia?` (`daily|weekly`, default `daily`), `every_x?` (inteiro ≥ 1, default 1); create também `confirm?`.
- Limite: recorrência mínima apenas (`frequency` + `everyX`); sem `days`/`startDate`/checklist neste corte.

### `habitica_update_daily`

- Quando: editar campos de uma diária existente.
- Args: `id`, campos parciais, `confirm?`.
- Valida tipo `daily` antes do PUT. Sem confirm: preview.

### `habitica_preview_day_plan` / `habitica_create_day_plan`

- Quando: materializar uma lista **já decidida** do dia (não importar backlog inteiro).
- Args: `data?` (YYYY-MM-DD do dia), `items[]` com `titulo`, `slug?`, `notas?`, `origem?`, `prioridade?` (`baixa|media|alta`), `data?`; create também `confirm?`.
- Limite de itens por chamada; duplicidade título+origem é rejeitada/ignorada.
- Sempre marcar origem nas notas (`[origem:...]`); slug vai no **alias**.
- Prazo (`date`) = dia do plano: `data` do item → `data` do plano → data embutida na origem → hoje local.

### `habitica_complete_todo`

- Quando: concluir um afazer existente.
- Args: `id`, `confirm?`.
- Valida que o item é `todo`. Risco: altera XP/ouro/HP.

### `habitica_score_habit`

- Quando: pontuar hábito `up` ou `down` (não criar/editar).
- Args: `id`, `direction` (`up|down`), `confirm?`.
- Risco: vida, ouro, XP, streak.

### `habitica_score_daily`

- Quando: concluir (`up`) ou desfazer (`down`) diária (não criar/editar).
- Args: `id`, `direction?` (default `up`), `confirm?`.
- Risco: streak, vida, ouro, XP.

### `habitica_delete_item`

- Quando: remover permanentemente um item errado/obsoleto (`habit|daily|todo`).
- Args: `id`, `tipo` (`habit|daily|todo`), `confirm?`.
- Valida que o tipo informado coincide com a API antes do DELETE.
- `reward` fora de escopo. Risco: remoção **irreversível**.
- Não usar remoção como substituto de concluir/pontuar.

## Anti-padrões

- Importar épicos/issues/sprints inteiros para o Habitica.
- Criar, atualizar, pontuar ou remover sem confirmação explícita.
- Usar Habitica como fonte de verdade de projeto.
- Expor tokens em respostas, commits ou exemplos.
- Apagar item em vez de concluir/pontuar.
