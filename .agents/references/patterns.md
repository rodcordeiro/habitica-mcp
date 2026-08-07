# Patterns

- Preview builders in `src/habitica/*` (e.g. `buildTodoPreview`) keep write tools thin: validate → optional API call → JSON content.
- Shared `toolError` + `redactSecrets` for every tool catch path.
- Client (`HabiticaClient`) owns HTTP; mappers normalize API shapes to domain items.
- Prefer focused validation from `runtime.md` over unrelated full-suite runs when the change is narrow.
- Promote reusable learnings to Nero only when evidence shows reuse beyond this repository.
