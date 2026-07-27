#!/usr/bin/env node
import { config as loadEnv } from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig, redactSecrets } from "./config.js";
import { HabiticaClient } from "./habitica/client.js";
import { buildTodoPreview } from "./habitica/todo.js";
import type { ItemTipo } from "./types.js";

loadEnv();

const server = new McpServer({
  name: "habitica-mcp",
  description: "MCP server for Habitica daily execution items",
  version: "0.1.0",
  icons: [{ src: "https://habitica.com/static/presskit/Logo/Android.png" }],
});

const tipoSchema = z.enum(["habit", "daily", "todo", "reward"]);
const dificuldadeSchema = z.enum(["trivial", "easy", "medium", "hard"]);

function toolError(err: unknown) {
  const raw = err instanceof Error ? err.message : String(err);
  const message = redactSecrets(raw);
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
    isError: true as const,
  };
}

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
      return toolError(err);
    }
  },
);

server.registerTool(
  "habitica_preview_todo",
  {
    description:
      "Monta o preview do payload para criar um afazer (todo) no Habitica, sem chamar a API de escrita.",
    inputSchema: {
      titulo: z.string().describe("Título do afazer (obrigatório)."),
      notas: z.string().optional().describe("Notas opcionais."),
      dificuldade: dificuldadeSchema
        .optional()
        .describe("trivial|easy|medium|hard. Default: easy."),
      data_limite: z.string().optional().describe("Data limite YYYY-MM-DD ou ISO."),
      tags: z.array(z.string()).optional().describe("Lista de tags (nomes)."),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (args) => {
    try {
      const preview = buildTodoPreview(args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(preview, null, 2) }],
      };
    } catch (err) {
      return toolError(err);
    }
  },
);

async function main(): Promise<void> {
  loadConfig();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  const raw = err instanceof Error ? err.message : String(err);
  console.error(redactSecrets(raw));
  process.exit(1);
});
