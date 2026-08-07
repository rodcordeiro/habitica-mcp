# Runtime

- Transport: **stdio** (`StdioServerTransport`). stdout is JSON-RPC; do not use `console.log` for diagnostics.
- Start: `pnpm build` → `pnpm start` (`node dist/index.js`), or `pnpm dev` (`tsx src/index.ts`).
- Required env (from `.env.example`, never commit values): `HABITICA_USER_ID`, `HABITICA_API_TOKEN`, `HABITICA_X_CLIENT`.
- Validation: prefer `pnpm check`; focused alternatives `pnpm test`, `pnpm run typecheck`, `pnpm run lint`, `pnpm build`.
- Host smoke: `pnpm inspect` / `pnpm inspect:ui` (MCP Inspector against built server).
- Package manager: pnpm (`packageManager` in `package.json`).
