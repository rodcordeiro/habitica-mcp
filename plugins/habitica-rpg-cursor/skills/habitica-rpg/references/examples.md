# Habitica RPG — call examples

Sanitized examples only. Never paste real tokens or user IDs.

## List active todos

```json
{ "name": "habitica_list_items", "arguments": { "tipo": "todo", "ativo": true } }
```

## Create todo (preview then confirm)

```json
{
  "name": "habitica_preview_todo",
  "arguments": {
    "titulo": "[P0] Abrir RDMs dos apps mobile",
    "slug": "p0-abrir-rdms-mobile",
    "notas": "Hoje P0: abrir as RDMs dos aplicativos mobile.",
    "dificuldade": "hard",
    "data_limite": "2026-08-07"
  }
}
```

```json
{
  "name": "habitica_create_todo",
  "arguments": {
    "titulo": "[P0] Abrir RDMs dos apps mobile",
    "slug": "p0-abrir-rdms-mobile",
    "dificuldade": "hard",
    "data_limite": "2026-08-07",
    "confirm": true
  }
}
```

## Update todo

```json
{
  "name": "habitica_update_todo",
  "arguments": {
    "id": "<uuid>",
    "data_limite": "2026-08-08",
    "confirm": true
  }
}
```

## Day plan

```json
{
  "name": "habitica_create_day_plan",
  "arguments": {
    "data": "2026-08-07",
    "items": [
      {
        "titulo": "[P0] Publicar o que falta em prod",
        "origem": "planejamento-diario-2026-08-07",
        "prioridade": "alta"
      }
    ],
    "confirm": true
  }
}
```

## Score habit / daily

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

## Delete (last resort)

```json
{
  "name": "habitica_delete_item",
  "arguments": { "id": "<uuid>", "tipo": "todo", "confirm": true }
}
```
