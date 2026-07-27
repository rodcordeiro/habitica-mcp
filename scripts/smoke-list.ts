/**
 * Smoke test manual da Sprint 1: lista itens sem imprimir credenciais.
 * Uso: pnpm exec tsx scripts/smoke-list.ts
 */
import { config as loadEnv } from "dotenv";
import { loadConfig, redactSecrets } from "../src/config.js";
import { HabiticaClient } from "../src/habitica/client.js";
import type { ItemTipo } from "../src/types.js";

loadEnv();

const tipos: Array<ItemTipo | undefined> = [
  undefined,
  "habit",
  "daily",
  "todo",
  "reward",
];

async function run(): Promise<void> {
  const config = loadConfig();
  const client = new HabiticaClient(config);

  for (const tipo of tipos) {
    const label = tipo ?? "all";
    try {
      const items = await client.listTasks(tipo);
      console.log(`[ok] tipo=${label} count=${items.length}`);
      if (items[0]) {
        console.log(
          `  sample: id=${items[0].id.slice(0, 8)}… tipo=${items[0].tipo} titulo_len=${items[0].titulo.length}`,
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[fail] tipo=${label}: ${redactSecrets(msg, config)}`);
      process.exitCode = 1;
    }
  }
}

run();
