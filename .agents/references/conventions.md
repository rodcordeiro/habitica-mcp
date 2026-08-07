# Conventions

- Prefer `pnpm` scripts from `package.json`; do not introduce another package manager.
- Keep MCP tool names `habitica_<verb>_<noun>`; Zod `inputSchema` + annotations for every tool.
- Mutating tools: preview path without confirm; write only with `confirm: true`.
- Keep skill source in `skills/habitica-rpg/`; sync plugin copies under `plugins/` when skill contracts change.
- Preserve ownership: API mapping/tests in `src/habitica/`; registration/transport in `src/index.ts`.
- Sanitize examples and logs before durable docs or Nero knowledge.
- Do not copy Nero guideline text into this repo — keep the `$nero` pointer only.
