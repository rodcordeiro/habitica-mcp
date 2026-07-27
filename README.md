# Habitica MCP

Servidor MCP em TypeScript para gerenciar o Habitica como camada de **execução diária** — não como gerenciador de projeto.

Agentes consultam e (com confirmação explícita) alteram hábitos, diárias, afazeres e recompensas via API do Habitica. Planejamento de projeto, backlog e histórico permanecem em ferramentas externas (Obsidian, GitHub Issues, Azure Boards, Jira, etc.).

## Status

MVP mínimo validável (Incremento 1) em andamento: leitura implementada.

| Camada               | Escopo                                                   |
| -------------------- | -------------------------------------------------------- |
| MVP amplo            | Incrementos 1–6 — ver [docs/backlog.md](docs/backlog.md) |
| MVP mínimo validável | Incremento 1 (somente leitura)                           |

## Stack

- Node.js + TypeScript
- `@modelcontextprotocol/sdk`
- Transporte **stdio**
- Gerenciador de pacotes **pnpm**
- Distribuição prevista: plugins `habitica-rpg` para Codex e Cursor (skill + MCP)

## Fronteira do produto

- Habitica = compromisso pessoal e rotina do dia.
- MCP = ponte segura para agentes (leitura primeiro; escrita só com `confirm: true`).
- Não importar backlog completo de projeto para o Habitica.

Detalhes de linguagem e anti-termos: [CONTEXT.md](CONTEXT.md).

## Segurança

- Credenciais apenas em variáveis de ambiente (fora do repositório). Use `.env` local (gitignored) a partir de `.env.example`.
- Nunca registrar tokens, cookies, `Authorization`, payloads sensíveis ou credenciais em notas, logs, exemplos ou testes.
- Variáveis: `HABITICA_USER_ID`, `HABITICA_API_TOKEN`, `HABITICA_X_CLIENT`.

## Quick start (somente leitura)

```bash
pnpm install
cp .env.example .env   # preencha as três variáveis (sem commitar)
pnpm run build
pnpm start             # ou: pnpm dev
```

Smoke test sem subir o MCP:

```bash
pnpm exec tsx scripts/smoke-list.ts
```

Qualidade local:

```bash
pnpm check   # typecheck + lint + format:check + test
```

### Configuração MCP (stdio)

```json
{
  "mcpServers": {
    "habitica": {
      "command": "pnpm",
      "args": ["exec", "tsx", "src/index.ts"],
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

Substitua os placeholders; não cole tokens reais em issues, commits ou docs.

## Tool disponível: `habitica_list_items`

Lista itens de execução normalizados (`id`, `tipo`, `titulo`, `notas`, `dificuldade`, `ativo`).

| Argumento | Tipo                                                | Descrição                                      |
| --------- | --------------------------------------------------- | ---------------------------------------------- |
| `tipo`    | `habit` \| `daily` \| `todo` \| `reward` (opcional) | Filtra por tipo                                |
| `ativo`   | `boolean` (opcional)                                | `true` = ativos; `false` = concluídos/inativos |

Exemplo de resposta (dados fictícios):

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "tipo": "todo",
      "titulo": "Revisar backlog do dia",
      "notas": "",
      "dificuldade": "easy",
      "ativo": true
    }
  ],
  "count": 1
}
```

Erros comuns (sem expor segredos): config ausente, autenticação inválida, rede, rate limit, resposta inválida.

## Tools planejadas

| Tool                         | Incremento | Função                         | Status       |
| ---------------------------- | ---------- | ------------------------------ | ------------ |
| `habitica_list_items`        | 1          | Listar itens de execução       | Implementada |
| `habitica_preview_todo`      | 2          | Preview de criação de afazer   | Planejada    |
| `habitica_create_todo`       | 2          | Criar afazer (`confirm: true`) | Planejada    |
| `habitica_preview_day_plan`  | 3          | Preview do plano do dia        | Planejada    |
| `habitica_create_day_plan`   | 3          | Criar lote do plano do dia     | Planejada    |
| `habitica_complete_todo`     | 4          | Concluir afazer                | Planejada    |
| Pontuar `habit` / `daily`    | 4          | Progresso com confirmação      | Planejada    |
| Skill + plugins Codex/Cursor | 6          | Empacotar skill + MCP          | Planejada    |

Critérios de aceite: [docs/backlog.md](docs/backlog.md).

## Documentação

| Arquivo                            | Papel                          |
| ---------------------------------- | ------------------------------ |
| [CONTEXT.md](CONTEXT.md)           | Glossário e limites de domínio |
| [docs/backlog.md](docs/backlog.md) | Roadmap do MVP                 |
| [.env.example](.env.example)       | Variáveis sem segredos         |

## Próximo passo

Incremento 2 — preview e criação segura de afazeres.
