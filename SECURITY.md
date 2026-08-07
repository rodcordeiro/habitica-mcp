# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| `0.1.x` | Yes       |
| `< 0.1` | No        |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security reports.

Preferred options:

1. **GitHub Security Advisories** for this repository (Private vulnerability reporting), when enabled.
2. Email the maintainer: **rodrigomendoncca@gmail.com** with subject `[habitica-mcp security]`.

Include:

- Description of the issue and impact
- Steps to reproduce or proof of concept (without real Habitica tokens)
- Affected version / commit when known

You should receive an acknowledgement within a few business days. We will
coordinate a fix and disclosure timeline.

## Project security expectations

- Habitica credentials (`HABITICA_USER_ID`, `HABITICA_API_TOKEN`, `HABITICA_X_CLIENT`) must live only in environment variables or host secret stores — never in the repository, issues, PRs, tests, or examples.
- MCP write/score/delete tools require explicit `confirm: true`.
- Error paths must not echo secrets (see `redactSecrets` in `src/config.ts`).
- Treat reported credential leaks as urgent: rotate the Habitica API token and revoke compromised values.
