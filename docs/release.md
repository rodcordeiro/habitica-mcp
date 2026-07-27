# Release e rollback — Habitica MCP

## Comandos padronizados

| Comando                 | Função                           |
| ----------------------- | -------------------------------- |
| `pnpm run typecheck`    | Tipagem                          |
| `pnpm run lint`         | ESLint                           |
| `pnpm run format:check` | Prettier                         |
| `pnpm run test`         | Vitest (offline; sem API real)   |
| `pnpm run build`        | Compila `dist/`                  |
| `pnpm check`            | typecheck + lint + format + test |
| `pnpm start`            | Sobe MCP a partir de `dist/`     |

## Configuração de exemplo

- `.env.example` — variáveis sem valores secretos.
- README e `docs/operations.md` — exemplos com placeholders.

## Consumo local do MCP

1. `pnpm install && pnpm run build`
2. Configurar MCP stdio apontando para `node dist/index.js` (ou `pnpm exec tsx src/index.ts`).
3. Injetar `HABITICA_*` no bloco `env` do cliente MCP (Cursor/Codex), nunca no git.

Plugins (Incremento 6): ver pastas `plugins/habitica-rpg-codex` e `plugins/habitica-rpg-cursor`.

## Checklist de release

1. `pnpm check` verde.
2. `pnpm run build` gera `dist/` sem erros.
3. Smoke opcional: `pnpm exec tsx scripts/smoke-list.ts` (usa `.env` local).
4. Revisar changelog/commits sem secrets.
5. Tag/versão: CI na `main` faz bump patch após validate+build.

## Rollback

1. Desativar o servidor MCP no cliente (remover entrada MCP / desinstalar plugin).
2. Revogar o API Token no Habitica (Settings → API) e gerar outro se necessário.
3. Remover variáveis locais comprometidas do `.env` e do ambiente do cliente.
