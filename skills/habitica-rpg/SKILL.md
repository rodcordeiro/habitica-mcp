---
name: habitica-rpg
description: Use when managing daily execution items through Habitica via MCP tools. Prefer Habitica for daily commitment (habits, dailies, todos, rewards), never as a project backlog manager.
---

# Habitica RPG â€” execuÃ§Ã£o diÃ¡ria

Use as tools do Habitica MCP para **execuÃ§Ã£o diÃ¡ria**. NÃ£o trate o Habitica como backlog de projeto, roadmap ou issue tracker.

Linguagem de domÃ­nio: alinhar com `CONTEXT.md` do repositÃ³rio (`Item de execuÃ§Ã£o`, `Afazer`, `DiÃ¡ria`, `HÃ¡bito`, `Recompensa`, `Planejamento do dia`).

## SeguranÃ§a

- Nunca logar ou gravar credenciais Habitica, tokens, cookies ou headers `Authorization`.
- Escritas e pontuaÃ§Ãµes **sÃ³** com `confirm: true`.
- Sem `confirm` (ou `confirm: false`): apenas preview â€” nenhuma mutaÃ§Ã£o.
- RemoÃ§Ã£o (`habitica_delete_item`) Ã© **irreversÃ­vel**; nunca use remoÃ§Ã£o no lugar de concluir/pontuar.

## Fluxo recomendado

1. **Ler** estado atual (`habitica_list_items`).
2. **Preview** da mudanÃ§a (`habitica_preview_*` ou tool de escrita/update sem confirm).
3. **Confirmar** com o usuÃ¡rio quando houver risco (criaÃ§Ã£o, update, lote, conclusÃ£o, score, remoÃ§Ã£o).
4. **Executar** com `confirm: true`.

## Tools

### `habitica_list_items` (leitura)

- Quando: consultar hÃ¡bitos, diÃ¡rias, afazeres ou recompensas.
- Args: `tipo?` (`habit|daily|todo|reward`), `ativo?` (boolean).
- NÃ£o usar: inventar itens; filtrar projeto externo no Habitica.

### `habitica_preview_todo` / `habitica_create_todo`

- Quando: criar um afazer Ãºnico.
- Args: `titulo` (obrigatÃ³rio), `slug?` (kebab-case; se omitido, gerado do tÃ­tulo), `notas?`, `dificuldade?` (`trivial|easy|medium|hard`), `data_limite?`, `tags?`; create tambÃ©m `confirm?`.
- O `slug` preenche o **alias** da tarefa Habitica (`alias`); nÃ£o vai nas notas.
- Sem confirm: preview do payload. Com confirm: cria e devolve `Item de execuÃ§Ã£o`.

### `habitica_preview_habit` / `habitica_create_habit`

- Quando: **criar** um hÃ¡bito novo (nÃ£o para pontuar um existente â€” use `habitica_score_habit`).
- Args: `titulo`, `slug?`, `notas?`, `dificuldade?`, `up?` / `down?` (default ambos `true`; pelo menos um deve ser `true`); create tambÃ©m `confirm?`.
- Slug â†’ alias; marcadores legados `[slug:...]` nas notas sÃ£o removidos.

### `habitica_update_habit`

- Quando: editar tÃ­tulo/notas/dificuldade/botÃµes de um hÃ¡bito existente.
- Args: `id`, campos parciais (`titulo?`, `slug?`, `notas?`, `dificuldade?`, `up?`+`down?` juntos), `confirm?`.
- Valida tipo `habit` antes do PUT. Sem confirm: preview.

### `habitica_preview_daily` / `habitica_create_daily`

- Quando: **criar** uma diÃ¡ria nova (nÃ£o para concluir â€” use `habitica_score_daily`).
- Args: `titulo`, `slug?`, `notas?`, `dificuldade?`, `frequencia?` (`daily|weekly`, default `daily`), `every_x?` (inteiro â‰¥ 1, default 1); create tambÃ©m `confirm?`.
- Limite: recorrÃªncia mÃ­nima apenas (`frequency` + `everyX`); sem `days`/`startDate`/checklist neste corte.

### `habitica_update_daily`

- Quando: editar campos de uma diÃ¡ria existente.
- Args: `id`, campos parciais, `confirm?`.
- Valida tipo `daily` antes do PUT. Sem confirm: preview.

### `habitica_preview_day_plan` / `habitica_create_day_plan`

- Quando: materializar uma lista **jÃ¡ decidida** do dia (nÃ£o importar backlog inteiro).
- Args: `data?` (YYYY-MM-DD do dia), `items[]` com `titulo`, `slug?`, `notas?`, `origem?`, `prioridade?` (`baixa|media|alta`), `data?`; create tambÃ©m `confirm?`.
- Limite de itens por chamada; duplicidade tÃ­tulo+origem Ã© rejeitada/ignorada.
- Sempre marcar origem nas notas (`[origem:...]`); slug vai no **alias**.
- Prazo (`date`) = dia do plano: `data` do item â†’ `data` do plano â†’ data embutida na origem â†’ hoje local.

### `habitica_complete_todo`

- Quando: concluir um afazer existente.
- Args: `id`, `confirm?`.
- Valida que o item Ã© `todo`. Risco: altera XP/ouro/HP.

### `habitica_score_habit`

- Quando: pontuar hÃ¡bito `up` ou `down` (nÃ£o criar/editar).
- Args: `id`, `direction` (`up|down`), `confirm?`.
- Risco: vida, ouro, XP, streak.

### `habitica_score_daily`

- Quando: concluir (`up`) ou desfazer (`down`) diÃ¡ria (nÃ£o criar/editar).
- Args: `id`, `direction?` (default `up`), `confirm?`.
- Risco: streak, vida, ouro, XP.

### `habitica_delete_item`

- Quando: remover permanentemente um item errado/obsoleto (`habit|daily|todo`).
- Args: `id`, `tipo` (`habit|daily|todo`), `confirm?`.
- Valida que o tipo informado coincide com a API antes do DELETE.
- `reward` fora de escopo. Risco: remoÃ§Ã£o **irreversÃ­vel**.
- NÃ£o usar remoÃ§Ã£o como substituto de concluir/pontuar.

## Anti-padrÃµes

- Importar Ã©picos/issues/sprints inteiros para o Habitica.
- Criar, atualizar, pontuar ou remover sem confirmaÃ§Ã£o explÃ­cita.
- Usar Habitica como fonte de verdade de projeto.
- Expor tokens em respostas, commits ou exemplos.
- Apagar item em vez de concluir/pontuar.
