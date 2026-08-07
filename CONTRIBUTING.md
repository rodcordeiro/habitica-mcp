# Contributing to habitica-mcp

Thanks for considering a contribution. This project is a TypeScript MCP server
that treats Habitica as a **daily execution** layer — not a project backlog.

Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before participating.

## Before you start

1. Read [CONTEXT.md](CONTEXT.md) (domain language and boundaries).
2. Read [docs/operations.md](docs/operations.md) (local setup and safety).
3. Never commit secrets (`HABITICA_*`, tokens, cookies, `.env`).

## Development setup

```bash
pnpm install
cp .env.example .env   # fill locally; do not commit
pnpm check             # typecheck + lint + format + test
pnpm build
```

Requirements: Node.js >= 20, pnpm 9.

## Contribution guidelines

- Keep changes small, local, and reversible.
- Prefer the existing patterns in `src/habitica/` and tool registration in `src/index.ts`.
- Mutating Habitica operations must stay behind `confirm: true` (preview by default).
- Do not log or document real credentials, tokens, or personal Habitica payloads.
- Update tests when changing contracts; do not depend on the live Habitica API in unit tests.
- Update `skills/habitica-rpg/SKILL.md` (and plugin copies) when adding or changing tools.
- Align naming with `CONTEXT.md` (`Item de execução`, `Afazer`, `Diária`, `Hábito`, …).

## Pull requests

1. Open an issue first for larger changes (new tools, API surface, CI/infra).
2. Branch from the active development branch (`develop` when present).
3. Run `pnpm check` and `pnpm build` before opening the PR.
4. Use the pull request template and describe risk/rollback for write-path changes.
5. Do not use `--no-verify` or force-push to protected branches.

## Reporting bugs and requesting features

Use the GitHub issue templates under **New issue**.

- Bugs: steps, expected vs actual, environment (Node/pnpm), and sanitized logs.
- Features: problem, proposed tool/contract, and why it fits daily-execution scope.

## Security issues

Do **not** open a public issue for vulnerabilities. Follow [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](LICENSE).
