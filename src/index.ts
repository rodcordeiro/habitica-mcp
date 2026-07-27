#!/usr/bin/env node
import { config as loadEnv } from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig, redactSecrets } from "./config.js";
import { HabiticaClient } from "./habitica/client.js";
import type { ItemTipo } from "./types.js";

loadEnv();

const server = new McpServer({
  name: "habitica-mcp",
  description: "MCP server for Habitica daily execution items",
  version: "0.1.0",
  icons: [{ src: "https://habitica.com/static/presskit/Logo/Android.png" }],
});

const tipoSchema = z.enum(["habit", "daily", "todo", "reward"]);

server.registerTool(
  "habitica_list_items",
  {
    description:
      "Lista itens de execução do Habitica (habits, dailies, todos, rewards) normalizados. Não expõe credenciais.",
    inputSchema: {
      tipo: tipoSchema.optional().describe("Filtra por tipo de item. Omitir para listar todos."),
      ativo: z
        .boolean()
        .optional()
        .describe("Filtra por ativo (true) ou inativo/concluído (false). Omitir para ambos."),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({ tipo, ativo }) => {
    try {
      const config = loadConfig();
      const client = new HabiticaClient(config);
      const items = await client.listTasks(tipo as ItemTipo | undefined, ativo);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ items, count: items.length }, null, 2),
          },
        ],
      };
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const message = redactSecrets(raw);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  },
);

async function main(): Promise<void> {
  // Valida config na subida para falhar cedo (sem imprimir segredos).
  loadConfig();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  const raw = err instanceof Error ? err.message : String(err);
  console.error(redactSecrets(raw));
  process.exit(1);
});
