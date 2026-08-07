# Habitica RPG — plugin Codex

Empacota a skill `habitica-rpg` e o MCP deste repositório para o Codex.

## Pré-requisito

Na raiz do repo `habitica-mcp`:

```bash
pnpm install
pnpm run build
```

## Marketplace (repo)

Entrada em `.agents/plugins/marketplace.json` (`habitica-mcp` marketplace):

- plugin name: `habitica-rpg`
- source: `./plugins/habitica-rpg-codex`

Após editar o plugin em desenvolvimento, atualize o cachebuster e reinstale:

```powershell
python $env:USERPROFILE\.cursor\skills\.system\plugin-creator\scripts\update_plugin_cachebuster.py `
  <repo>\plugins\habitica-rpg-codex
codex plugin add habitica-rpg@habitica-mcp
```

Use um **novo thread** no Codex para carregar skill/tools atualizados.

## Credenciais

Defina no ambiente do Codex (sem commitar):

- `HABITICA_USER_ID`
- `HABITICA_API_TOKEN`
- `HABITICA_X_CLIENT`

O `.mcp.json` usa `${HABITICA_*}` e aponta para `../../dist/index.js` (build na raiz).

## Validação

```powershell
python $env:USERPROFILE\.cursor\skills\.system\plugin-creator\scripts\validate_plugin.py `
  <repo>\plugins\habitica-rpg-codex
```

## Rollback

1. Desinstalar o plugin no Codex.
2. Revogar o API token no Habitica se necessário.
