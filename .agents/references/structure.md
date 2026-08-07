# Structure

Checkout layout (factual):

| Path                                                          | Ownership                                                       |
| ------------------------------------------------------------- | --------------------------------------------------------------- |
| `src/index.ts`                                                | MCP entry: `McpServer`, tool registration, stdio bootstrap      |
| `src/config.ts`                                               | Env load + secret redaction                                     |
| `src/types.ts`                                                | Shared domain types                                             |
| `src/habitica/`                                               | Habitica API client, mappers, preview/build helpers, unit tests |
| `skills/habitica-rpg/`                                        | Source Domain Skill for agents                                  |
| `plugins/habitica-rpg-codex/`, `plugins/habitica-rpg-cursor/` | Host-specific skill bundles                                     |
| `docs/`                                                       | Backlog, operations, release                                    |
| `scripts/`                                                    | Smoke / inspect helpers                                         |
| `CONTEXT.md`                                                  | Product glossary and boundaries                                 |

No MCP `resources` or `prompts` capability registered in checkout (tools only).
