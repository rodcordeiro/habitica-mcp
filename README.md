# Habitica MCP

Servidor MCP em TypeScript para gerenciar o Habitica como camada de **execução diária** — não como gerenciador de projeto.

Agentes consultam e (com confirmação explícita) alteram hábitos, diárias, afazeres e recompensas via API do Habitica. Planejamento de projeto, backlog e histórico permanecem em ferramentas externas (Obsidian, GitHub Issues, Azure Boards, Jira, etc.).

## Status

MVP amplo implementado (Sprints 1–12): tools MCP, docs operacionais, skill e plugins Codex/Cursor.

| Camada               | Escopo                                                   |
| -------------------- | -------------------------------------------------------- |
| MVP amplo            | Incrementos 1–6 — ver [docs/backlog.md](docs/backlog.md) |
| MVP mínimo validável | Incremento 1 (somente leitura) — concluído               |

## Stack

- Node.js + TypeScript
- `@modelcontextprotocol/sdk`
- Transporte **stdio**
- Gerenciador de pacotes **pnpm**
- Plugins: `plugins/habitica-rpg-codex` e `plugins/habitica-rpg-cursor`

## Fronteira do produto

- Habitica = compromisso pessoal e rotina do dia.
- MCP = ponte segura para agentes (leitura primeiro; escrita só com `confirm: true`).
- Não importar backlog completo de projeto para o Habitica.

Detalhes: [CONTEXT.md](CONTEXT.md).

## Segurança

- Credenciais apenas em variáveis de ambiente (fora do repositório). Use `.env` local (gitignored) a partir de `.env.example`.
- Nunca registrar tokens, cookies, `Authorization`, payloads sensíveis ou credenciais em notas, logs, exemplos ou testes.
- Variáveis: `HABITICA_USER_ID`, `HABITICA_API_TOKEN`, `HABITICA_X_CLIENT`.

## Quick start

```bash
pnpm install
cp .env.example .env   # preencha as três variáveis (sem commitar)
pnpm run build
pnpm start             # ou: pnpm dev
pnpm check             # typecheck + lint + format + test
```

Smoke: `pnpm exec tsx scripts/smoke-list.ts`

### Configuração MCP (stdio)

```json
{
  "mcpServers": {
    "habitica": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "<caminho-do-repo>",
      "env": {
        "HABITICA_USER_ID": "<seu-user-id>",
        "HABITICA_API_TOKEN": "<seu-api-token>",
        "HABITICA_X_CLIENT": "<user-id>-habitica-mcp"
      }
    }
  }
}
```

## Tools

| Tool                        | Função                   | Escrita         |
| --------------------------- | ------------------------ | --------------- |
| `habitica_list_items`       | Listar itens             | não             |
| `habitica_preview_todo`     | Preview de afazer        | não             |
| `habitica_create_todo`      | Criar afazer             | `confirm: true` |
| `habitica_preview_day_plan` | Preview do plano do dia  | não             |
| `habitica_create_day_plan`  | Criar lote do dia        | `confirm: true` |
| `habitica_complete_todo`    | Concluir afazer          | `confirm: true` |
| `habitica_score_habit`      | Pontuar hábito up/down   | `confirm: true` |
| `habitica_score_daily`      | Concluir/desfazer diária | `confirm: true` |

## Documentação

| Arquivo                                                      | Papel                              |
| ------------------------------------------------------------ | ---------------------------------- |
| [CONTEXT.md](CONTEXT.md)                                     | Glossário e limites de domínio     |
| [docs/backlog.md](docs/backlog.md)                           | Roadmap / status das sprints       |
| [docs/operations.md](docs/operations.md)                     | Instalação, exemplos, checklist    |
| [docs/release.md](docs/release.md)                           | Qualidade, consumo local, rollback |
| [skills/habitica-rpg/SKILL.md](skills/habitica-rpg/SKILL.md) | Skill (fonte)                      |
| [plugins/habitica-rpg-codex](plugins/habitica-rpg-codex)     | Plugin Codex                       |
| [plugins/habitica-rpg-cursor](plugins/habitica-rpg-cursor)   | Plugin Cursor                      |
