# Security

- Credentials only via env (`HABITICA_*`); never in repo, skill examples, tests, or knowledge notes.
- `loadConfig` fails early listing missing keys without echoing values; `redactSecrets` masks tokens/user ids in error paths.
- Tool handlers wrap failures with `toolError` → redacted message.
- Treat every write/score/delete as open-world (Habitica API) and require explicit `confirm: true`.
- `habitica_delete_item` is irreversible; do not use delete as substitute for complete/score.
- README host config may show env placeholders only — never real IDs/tokens.
