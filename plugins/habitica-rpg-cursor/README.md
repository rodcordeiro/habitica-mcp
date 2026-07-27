# Habitica RPG — plugin Cursor

Empacota a skill `habitica-rpg` e o MCP deste repositório.

## Pré-requisito

Na raiz do repo:

```bash
pnpm install
pnpm run build
```

## Instalação local

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.cursor\plugins\local" | Out-Null
# symlink (recomendado) — mantém ../../dist apontando para o build do repo
cmd /c mklink /J "$env:USERPROFILE\.cursor\plugins\local\habitica-rpg" "<caminho-do-repo>\plugins\habitica-rpg-cursor"
```

Reload do Cursor. Configure variáveis em **Plugins → Configure**:

- `HABITICA_USER_ID`
- `HABITICA_API_TOKEN`
- `HABITICA_X_CLIENT`

## Rollback

1. Remover o plugin de `~/.cursor/plugins/local` (ou desinstalar no UI).
2. Revogar o API token no Habitica se necessário.
