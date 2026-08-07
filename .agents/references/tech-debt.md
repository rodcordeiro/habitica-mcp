# Tech Debt

- Integration writes depend on external Habitica API credentials; keep examples sanitized and avoid real IDs/tokens.
- Habitica `reward` create/update/delete still out of MCP scope (Increment 8 excluded rewards).
- Afazer (`todo`) ainda sem tool de update/edição — só create, day-plan, complete e delete.
- Daily recurrence is minimal (`daily|weekly` + `everyX`); richer schedules (daysOfMonth, startDate, checklist) deferred.
- Increment 7 (Cloudflare Workers remote MCP) parked by request — do not resume without explicit scope.
- Revisit this file after each substantial review; keep debt actionable and tied to checkout evidence.
