# Operação local — Habitica MCP

Guia para instalar, configurar e validar o MCP sem expor credenciais.

## Instalação

```bash
pnpm install
cp .env.example .env
# Preencha HABITICA_USER_ID, HABITICA_API_TOKEN e HABITICA_X_CLIENT
pnpm run build
pnpm start
# desenvolvimento: pnpm dev
```

`x-client` recomendado: `<user-id>-habitica-mcp`.

## Segurança

- Credenciais só em variáveis de ambiente / `.env` (gitignored).
- Nunca registrar tokens, cookies, `Authorization`, payloads sensíveis ou credenciais em notas, logs, exemplos, issues ou testes.
- Em falhas, o servidor mascara segredos conhecidos (`[REDACTED]`).
- Escritas exigem `confirm: true`. Sem confirmação, a tool só devolve preview.

## Exemplos de chamada (dados fictícios)

### Leitura

```json
{
  "name": "habitica_list_items",
  "arguments": { "tipo": "todo", "ativo": true }
}
```

### Preview de afazer

```json
{
  "name": "habitica_preview_todo",
  "arguments": {
    "titulo": "Revisar notas do dia",
    "dificuldade": "easy",
    "notas": "origem:exemplo"
  }
}
```

### Criação confirmada

```json
{
  "name": "habitica_create_todo",
  "arguments": {
    "titulo": "Revisar notas do dia",
    "dificuldade": "easy",
    "confirm": true
  }
}
```

### Plano do dia (preview)

```json
{
  "name": "habitica_preview_day_plan",
  "arguments": {
    "items": [
      { "titulo": "Item A", "origem": "obsidian", "prioridade": "alta" },
      { "titulo": "Item B", "origem": "github", "prioridade": "media" }
    ]
  }
}
```

### Concluir afazer / pontuar

```json
{ "name": "habitica_complete_todo", "arguments": { "id": "<uuid>", "confirm": true } }
```

```json
{
  "name": "habitica_score_habit",
  "arguments": { "id": "<uuid>", "direction": "up", "confirm": true }
}
```

```json
{
  "name": "habitica_score_daily",
  "arguments": { "id": "<uuid>", "direction": "up", "confirm": true }
}
```

### Hábito / diária (preview e criação)

```json
{
  "name": "habitica_preview_habit",
  "arguments": { "titulo": "Beber água", "up": true, "down": false }
}
```

```json
{
  "name": "habitica_create_habit",
  "arguments": { "titulo": "Beber água", "confirm": true }
}
```

```json
{
  "name": "habitica_preview_daily",
  "arguments": { "titulo": "Meditar", "frequencia": "daily", "every_x": 1 }
}
```

```json
{
  "name": "habitica_create_daily",
  "arguments": { "titulo": "Meditar", "confirm": true }
}
```

### Update / delete

```json
{
  "name": "habitica_update_habit",
  "arguments": { "id": "<uuid>", "titulo": "Beber mais água", "confirm": true }
}
```

```json
{
  "name": "habitica_update_todo",
  "arguments": {
    "id": "<uuid>",
    "titulo": "Revisar notas do dia",
    "data_limite": "2026-08-10",
    "confirm": true
  }
}
```

```json
{
  "name": "habitica_update_daily",
  "arguments": { "id": "<uuid>", "frequencia": "weekly", "every_x": 1, "confirm": true }
}
```

```json
{
  "name": "habitica_delete_item",
  "arguments": { "id": "<uuid>", "tipo": "todo", "confirm": true }
}
```

## Validação com MCP Inspector

Requer `pnpm build` e `.env` preenchido. O wrapper carrega credenciais do `.env` sem imprimi-las.

```bash
# UI (browser)
pnpm run inspect:ui

# CLI — listar tools
pnpm run inspect -- --method tools/list

# CLI — leitura real
pnpm run inspect -- --method tools/call --tool-name habitica_list_items --tool-arg tipo=todo

# CLI — preview (sem escrita)
pnpm run inspect -- --method tools/call --tool-name habitica_preview_todo --tool-arg titulo=Validacao-Inspector
pnpm run inspect -- --method tools/call --tool-name habitica_create_todo --tool-arg titulo=Validacao-Inspector --tool-arg confirm=false
```

Args aninhados (ex.: `items` em day plan) são frágeis no CLI do Inspector no Windows; use a UI para esses casos.

## Checklist de validação manual

1. Sem `.env` / variáveis: servidor falha cedo sem imprimir segredos.
2. `habitica_list_items` retorna itens reais com variáveis válidas.
3. `habitica_preview_todo` / `habitica_preview_habit` / `habitica_preview_daily` não chamam API de escrita.
4. Tools de create/update sem `confirm` não mutam; com `confirm: true` mutam.
5. `habitica_preview_day_plan` / `habitica_create_day_plan` respeitam limite, origem, alias e prazo do dia.
6. `habitica_complete_todo` rejeita id que não é `todo`.
7. Score de habit/daily exige `confirm` e mostra mensagem de risco no preview.
8. `habitica_update_habit` / `habitica_update_daily` / `habitica_update_todo` validam tipo antes do PUT.
9. `habitica_delete_item` exige `tipo` coincidente, mensagem de risco e `confirm: true`; `reward` rejeitado.

## Limites conhecidos

- Rate limit da API Habitica (HTTP 429): aguardar e retry manual.
- `ativo=false` filtra `completed` no lado do cliente; a API pode omitir todos concluídos antigos em listagens padrão.
- Tags no preview usam nomes; a API pode exigir IDs de tags existentes para aplicação real.
- Duplicidade do plano do dia é heurística (título + marcador `[origem:...]` em notas).
- Slug vira `alias` Habitica (único entre todas as tasks); conflito de alias retorna erro da API.
- Diárias: recorrência mínima apenas (`frequency` daily|weekly + `everyX`); sem `days`/`startDate`/checklist neste corte.
- Remoção é irreversível; não cobre `reward`.
- Pontuação altera estatísticas do personagem (XP, ouro, HP, streak).
- Este MCP não gerencia backlog de projeto — só execução diária.
