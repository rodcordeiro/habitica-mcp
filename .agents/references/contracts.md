# Contracts

Tools registered in `src/index.ts` (annotations include `readOnlyHint` / `destructiveHint` / `idempotentHint` / `openWorldHint` where set):

| Tool                                                                         | Mode                                                     |
| ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| `habitica_list_items`                                                        | read                                                     |
| `habitica_preview_todo` / `habitica_create_todo` / `habitica_update_todo`    | preview / write (`confirm`)                              |
| `habitica_preview_day_plan` / `habitica_create_day_plan`                     | preview / write (`confirm`)                              |
| `habitica_complete_todo`                                                     | write (`confirm`)                                        |
| `habitica_score_habit` / `habitica_score_daily`                              | write (`confirm`)                                        |
| `habitica_preview_habit` / `habitica_create_habit` / `habitica_update_habit` | preview / write (`confirm`)                              |
| `habitica_preview_daily` / `habitica_create_daily` / `habitica_update_daily` | preview / write (`confirm`)                              |
| `habitica_delete_item`                                                       | destructive write (`confirm`); `habit\|daily\|todo` only |

Write gate: without `confirm: true`, mutations return preview only (no API write).

Stable conventions:

- Slug → Habitica task `alias` (not notes); strip legacy `[slug:...]` from notes.
- Day-plan `date` / deadline = plan day (item date → plan date → date in origin → local today).
- Inputs via Zod schemas; errors return JSON `{ error }` with redacted secrets.
- No MCP resources/prompts in this server.
