# Habitica RPG — plugin Codex

Empacota a skill `habitica-rpg` e o MCP deste repositório.

## Pré-requisito

```bash
# na raiz do repo habitica-mcp
pnpm install
pnpm run build
```

## Credenciais

Defina no ambiente do Codex (sem commitar):

- `HABITICA_USER_ID`
- `HABITICA_API_TOKEN`
- `HABITICA_X_CLIENT`

O `.mcp.json` referencia `${HABITICA_*}` e aponta para `../../dist/index.js` (build na raiz do monorepo).

## Validação

```powershell
python $env:USERPROFILE\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py <caminho-deste-plugin>
```

## Rollback

1. Desinstalar o plugin no Codex.
2. Revogar o API token no Habitica se necessário.
