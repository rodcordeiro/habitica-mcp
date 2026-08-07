# habitica-mcp Agent Instructions

## Identity

- Domain: integracoes
- Stack: TypeScript MCP server for Habitica API with Vitest, ESLint and plugin/skill bundles
- Purpose: Expose Habitica daily execution items through MCP and agent skills.
- Primary entrypoints: src/index.ts, src/habitica/, src/config.ts, skills/, plugins/, docs/

## How to use this context

| Need                    | Read                                                                          |
| ----------------------- | ----------------------------------------------------------------------------- |
| Structure and ownership | `.agents/references/structure.md`                                             |
| Runtime and validation  | `.agents/references/runtime.md`                                               |
| Product/domain purpose  | `.agents/references/domain.md`                                                |
| Local conventions       | `.agents/references/conventions.md`                                           |
| Observed patterns       | `.agents/references/patterns.md`                                              |
| Known debt              | `.agents/references/tech-debt.md`                                             |
| Nero guideline          | `$nero -> references/guidelines/api-guidelines.md (integracoes inherits api)` |

## Quick rules

- Keep changes small, local, reversible and supported by checkout evidence.
- Do not record secrets, tokens, cookies, sensitive URLs, payloads or personal data in docs, tests or knowledge notes.
- Prefer the package manager and validation commands implied by this checkout.
- Do not change CI/CD, infrastructure, migrations or machine-affecting scripts without explicit scope.

## Conditional skills

- Use $nero and integracoes/api guideline. Use Domain Skill habitica-rpg when managing daily execution items.
