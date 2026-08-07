# habitica-mcp Agent Instructions

## Identity

- Domain: mcp (TypeScript MCP server; Habitica API client)
- Stack: Node 20+, pnpm, `@modelcontextprotocol/sdk`, Zod, Vitest, ESLint
- Purpose: Expose Habitica daily execution items (habits, dailies, todos, rewards) via MCP tools and agent skills — not as a project backlog.
- Primary entrypoints: `src/index.ts` (stdio server), `src/config.ts`, `src/habitica/`, `skills/habitica-rpg/`, `plugins/`

## How to use this context

| Need                             | Read                                                |
| -------------------------------- | --------------------------------------------------- |
| Structure and ownership          | `.agents/references/structure.md`                   |
| Runtime / transport / validation | `.agents/references/runtime.md`                     |
| Tool contracts                   | `.agents/references/contracts.md`                   |
| Security / secrets               | `.agents/references/security.md`                    |
| Product / domain purpose         | `.agents/references/domain.md`                      |
| Local conventions                | `.agents/references/conventions.md`                 |
| Observed patterns                | `.agents/references/patterns.md`                    |
| Known debt                       | `.agents/references/tech-debt.md`                   |
| Nero guideline                   | `$nero` → `references/guidelines/mcp-guidelines.md` |

## Quick rules

- Keep changes small, local, reversible and supported by checkout evidence.
- Prefer `pnpm check` (typecheck + lint + format + test); use focused `pnpm test` / `pnpm build` when enough.
- Writes and scores require `confirm: true`; without confirm, return preview only.
- Do not record secrets, tokens, cookies, sensitive URLs, payloads or personal data in docs, tests or knowledge notes.
- Do not change CI/CD, infrastructure or machine-affecting scripts without explicit scope.

## Conditional skills

- Always: `$nero` + MCP guideline above.
- When managing daily execution items via Habitica MCP tools: Domain Skill `habitica-rpg` (`skills/habitica-rpg/SKILL.md`; Cursor/Codex plugins under `plugins/`).
