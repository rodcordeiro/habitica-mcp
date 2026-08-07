# Tech Debt

Gaps vs `$nero` MCP guideline / product backlog (document only — no restructure in this playbook):

- No MCP `resources` or `prompts` capabilities (tools-only server).
- README tools table may lag `src/index.ts` (Increment 8 tools present in code/skill).
- Habitica `reward` create/update/delete still out of MCP scope.
- Daily recurrence is minimal (`daily|weekly` + `everyX`); richer schedules deferred.
- Increment 7 (Cloudflare Workers remote MCP) parked — do not resume without explicit scope.
- Integration writes depend on external Habitica credentials; keep examples sanitized.

Revisit after each substantial review; keep debt actionable and tied to checkout evidence.
