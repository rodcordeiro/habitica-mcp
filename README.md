# Habitica MCP

Servidor MCP em TypeScript para gerenciar o Habitica como camada de **execução diária** — não como gerenciador de projeto.

Agentes consultam e (com confirmação explícita) alteram hábitos, diárias, afazeres e recompensas via API do Habitica. Planejamento de projeto, backlog e histórico permanecem em ferramentas externas (Obsidian, GitHub Issues, Azure Boards, Jira, etc.).

## Status

Documentação do roadmap pronta. **Implementação ainda não iniciada.**

| Camada | Escopo |
| --- | --- |
| MVP amplo | Incrementos 1–6 — ver [docs/backlog.md](docs/backlog.md) |
| MVP mínimo validável | Incremento 1 (somente leitura) |

## Stack prevista

- Node.js + TypeScript
- `@modelcontextprotocol/sdk`
- Transporte **stdio**
- Gerenciador de pacotes **pnpm**
- Distribuição: plugin Codex `habitica-rpg` (skill + MCP)

## Fronteira do produto

- Habitica = compromisso pessoal e rotina do dia.
- MCP = ponte segura para agentes (leitura primeiro; escrita só com `confirm: true`).
- Não importar backlog completo de projeto para o Habitica.

Detalhes de linguagem e anti-termos: [CONTEXT.md](CONTEXT.md).

## Segurança

- Credenciais apenas em variáveis de ambiente (fora do repositório).
- Nunca registrar tokens, cookies, `Authorization`, payloads sensíveis ou credenciais em notas, logs, exemplos ou testes.
- Variáveis previstas: `HABITICA_USER_ID`, `HABITICA_API_TOKEN`, `HABITICA_X_CLIENT`.

## Quick start (planejado — ainda não implementado)

```bash
pnpm install
# Definir HABITICA_USER_ID, HABITICA_API_TOKEN e HABITICA_X_CLIENT no ambiente
pnpm start
```

Exemplo de configuração MCP (stdio), a validar após o scaffold:

```json
{
  "mcpServers": {
    "habitica": {
      "command": "pnpm",
      "args": ["exec", "tsx", "src/index.ts"],
      "env": {
        "HABITICA_USER_ID": "<seu-user-id>",
        "HABITICA_API_TOKEN": "<seu-api-token>",
        "HABITICA_X_CLIENT": "<app-name-ou-email>"
      }
    }
  }
}
```

## Tools planejadas (não implementadas)

| Tool | Incremento | Função |
| --- | --- | --- |
| `habitica_list_items` | 1 | Listar itens de execução (leitura) |
| `habitica_preview_todo` | 2 | Preview de criação de afazer |
| `habitica_create_todo` | 2 | Criar afazer (`confirm: true`) |
| `habitica_preview_day_plan` | 3 | Preview do plano do dia |
| `habitica_create_day_plan` | 3 | Criar lote do plano do dia (`confirm: true`) |
| `habitica_complete_todo` | 4 | Concluir afazer (`confirm: true`) |
| Pontuar `habit` / `daily` | 4 | Progresso com confirmação e direção explícita |
| Skill `habitica-rpg` | 6 | Ensina quando/como usar cada tool |
| Plugin Codex `habitica-rpg` | 6 | Empacota skill + MCP |

Critérios de aceite e sprints: [docs/backlog.md](docs/backlog.md).

## Documentação

| Arquivo | Papel |
| --- | --- |
| [CONTEXT.md](CONTEXT.md) | Glossário e limites de domínio |
| [docs/backlog.md](docs/backlog.md) | Roadmap do MVP (incrementos e sprints) |

## Próximo passo

Implementar o Incremento 1 — Sprint 1: esqueleto MCP + tool `habitica_list_items`.
