---
name: habitica-rpg
description: >-
  Manages Habitica daily execution items (habits, dailies, todos) through MCP tools
  with preview-first and confirm-gated writes. Use when the user asks to list, create,
  update, complete, score, plan the day, or delete Habitica items; when working with
  Habitica MCP, habitica-rpg, afazeres, diárias, hábitos, or planejamento do dia.
  Prefer Habitica for daily commitment only — never as a project backlog manager.
---

# Habitica RPG — execução diária

Bridge for **daily commitment** via Habitica MCP. Not a project backlog, roadmap, or issue tracker.

Domain language: `CONTEXT.md` (`Item de execução`, `Afazer`, `Diária`, `Hábito`, `Recompensa`, `Planejamento do dia`).

## Safety (non-negotiable)

- Never log or store Habitica credentials, tokens, cookies, or `Authorization` headers.
- Mutations **only** with `confirm: true`. Missing/`false` → preview only.
- `habitica_delete_item` is **irreversible** — never substitute for complete/score.
- `reward` CRUD is out of scope (list/score only if present).

## Workflow

```
1. habitica_list_items
2. preview_* or write tool without confirm
3. confirm with user when risky (batch, score, delete)
4. same tool with confirm: true
```

## Decision guide

| Intent                       | Tool                                                     |
| ---------------------------- | -------------------------------------------------------- |
| Inspect state                | `habitica_list_items`                                    |
| New one-off afazer           | `habitica_preview_todo` → `habitica_create_todo`         |
| Edit afazer fields           | `habitica_update_todo`                                   |
| Finish afazer                | `habitica_complete_todo`                                 |
| New habit                    | `habitica_preview_habit` → `habitica_create_habit`       |
| Edit habit                   | `habitica_update_habit`                                  |
| Score habit +/-              | `habitica_score_habit`                                   |
| New daily                    | `habitica_preview_daily` → `habitica_create_daily`       |
| Edit daily                   | `habitica_update_daily`                                  |
| Check/uncheck daily          | `habitica_score_daily`                                   |
| Materialize decided day list | `habitica_preview_day_plan` → `habitica_create_day_plan` |
| Remove wrong/obsolete item   | `habitica_delete_item` (`habit\|daily\|todo`)            |

## Shared contracts

- **Slug → alias**: kebab-case `slug` maps to Habitica `alias`. Do **not** put `[slug:...]` in notes (legacy markers are stripped).
- **Difficulty**: `trivial|easy|medium|hard`.
- **Day plan due date**: item `data` → plan `data` → `YYYY-MM-DD` in `origem` → today (local).
- **Day plan notes**: keep `[origem:...]`; never import full project backlogs.
- **Updates**: partial fields; validate type before PUT. Do not use update instead of complete/score.
- **Delete**: require `id` + expected `tipo`; abort on type mismatch.

## Tools (compact)

Args marked `confirm?` mutate only when `confirm: true`.

| Tool                                            | Key args                                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `habitica_list_items`                           | `tipo?` `habit\|daily\|todo\|reward`, `ativo?`                                                          |
| `habitica_preview_todo` / `create_todo`         | `titulo`, `slug?`, `notas?`, `dificuldade?`, `data_limite?`, `tags?`, `confirm?`                        |
| `habitica_update_todo`                          | `id`, partial fields above, `confirm?`                                                                  |
| `habitica_preview_habit` / `create_habit`       | `titulo`, `slug?`, `notas?`, `dificuldade?`, `up?`/`down?` (default both true; ≥1 true), `confirm?`     |
| `habitica_update_habit`                         | `id`, partials; if changing buttons send `up`+`down` together, `confirm?`                               |
| `habitica_preview_daily` / `create_daily`       | `titulo`, `slug?`, `notas?`, `dificuldade?`, `frequencia?` `daily\|weekly`, `every_x?` (≥1), `confirm?` |
| `habitica_update_daily`                         | `id`, partials, `confirm?`                                                                              |
| `habitica_preview_day_plan` / `create_day_plan` | `data?`, `items[]` (`titulo`, `slug?`, `notas?`, `origem?`, `prioridade?`, `data?`), `confirm?`         |
| `habitica_complete_todo`                        | `id`, `confirm?` — risk XP/gold/HP                                                                      |
| `habitica_score_habit`                          | `id`, `direction` `up\|down`, `confirm?`                                                                |
| `habitica_score_daily`                          | `id`, `direction?` (default `up`), `confirm?`                                                           |
| `habitica_delete_item`                          | `id`, `tipo` `habit\|daily\|todo`, `confirm?`                                                           |

Daily recurrence is **minimal** (`frequency` + `everyX` only). No `days`/`startDate`/checklist in this cut.

Full examples: [references/examples.md](references/examples.md).

## Anti-patterns

- Import epics/issues/sprints into Habitica.
- Mutate without explicit confirmation.
- Treat Habitica as source of truth for project work.
- Expose tokens in replies, commits, or examples.
- Delete instead of complete/score.
- Create habit/daily when the user only asked to score an existing one.

## Related

- Repo domain: `CONTEXT.md`
- Ops checklist: `docs/operations.md`
- Knowledge: use `$nero` / `nero-knowledge-base` for project decisions; this skill stays operational (Domain Skill, outside Nero canon).
