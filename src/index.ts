#!/usr/bin/env node
import { config as loadEnv } from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig, redactSecrets } from "./config.js";
import { HabiticaClient } from "./habitica/client.js";
import { buildDayPlanPreview } from "./habitica/day-plan.js";
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

server.registerTool(
  "habitica_create_todo",
  {
    description:
      "Cria um afazer no Habitica somente com confirm=true. Sem confirmação, retorna o mesmo preview de habitica_preview_todo.",
    inputSchema: {
      titulo: z.string().describe("Título do afazer (obrigatório)."),
      notas: z.string().optional().describe("Notas opcionais."),
      dificuldade: dificuldadeSchema
        .optional()
        .describe("trivial|easy|medium|hard. Default: easy."),
      data_limite: z.string().optional().describe("Data limite YYYY-MM-DD ou ISO."),
      tags: z.array(z.string()).optional().describe("Lista de tags (nomes)."),
      confirm: z
        .boolean()
        .optional()
        .describe("Deve ser true para executar a criação. Ausente/false → apenas preview."),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (args) => {
    try {
      const preview = buildTodoPreview(args);
      if (args.confirm !== true) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  ...preview,
                  message: "Nenhuma escrita executada. Passe confirm=true para criar.",
                },
                null,
                2,
              ),
            },
          ],
        };
      }
      const config = loadConfig();
      const client = new HabiticaClient(config);
      const item = await client.createTodo(preview.payload);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ mode: "created", item }, null, 2),
          },
        ],
      };
    } catch (err) {
      return toolError(err);
    }
  },
);

server.registerTool(
  "habitica_preview_day_plan",
  {
    description:
      "Recebe uma lista explícita de itens do dia e devolve preview de afazeres (sem escrita). Não importa backlog de projeto.",
    inputSchema: {
      items: z
        .array(
          z.object({
            titulo: z.string(),
            notas: z.string().optional(),
            origem: z.string().optional(),
            prioridade: z.enum(["baixa", "media", "alta"]).optional(),
          }),
        )
        .describe("Lista explícita de itens planejados para o dia."),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ items }) => {
    try {
      const preview = buildDayPlanPreview(items);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(preview, null, 2) }],
      };
    } catch (err) {
      return toolError(err);
    }
  },
);

server.registerTool(
  "habitica_create_day_plan",
  {
    description:
      "Cria um lote pequeno de afazeres do plano do dia somente com confirm=true. Resultado parcial por item.",
    inputSchema: {
      items: z
        .array(
          z.object({
            titulo: z.string(),
            notas: z.string().optional(),
            origem: z.string().optional(),
            prioridade: z.enum(["baixa", "media", "alta"]).optional(),
          }),
        )
        .describe("Lista explícita de itens planejados para o dia."),
      confirm: z.boolean().optional().describe("true para criar; caso contrário só preview."),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ items, confirm }) => {
    try {
      const preview = buildDayPlanPreview(items);
      if (confirm !== true) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  ...preview,
                  message: "Nenhuma escrita executada. Passe confirm=true para criar o lote.",
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const config = loadConfig();
      const client = new HabiticaClient(config);
      const existing = await client.listTasks("todo", true);
      const existingKeys = new Set(
        existing.map((item) => {
          const origemMatch = item.notas.match(/\[origem:([^\]]+)\]/);
          const origem = origemMatch?.[1] ?? "";
          return `${item.titulo.toLowerCase()}::${origem.toLowerCase()}`;
        }),
      );

      const created: unknown[] = [];
      const skipped: Array<{ titulo: string; reason: string }> = [];
      const errors: Array<{ titulo: string; error: string }> = [];

      for (const planItem of preview.items) {
        const key = `${planItem.titulo.toLowerCase()}::${planItem.origem.toLowerCase()}`;
        if (existingKeys.has(key)) {
          skipped.push({
            titulo: planItem.titulo,
            reason: "Já existe afazer ativo com mesmo título e origem.",
          });
          continue;
        }
        try {
          const item = await client.createTodo(planItem.payload);
          created.push(item);
          existingKeys.add(key);
        } catch (err) {
          errors.push({
            titulo: planItem.titulo,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                mode: "created",
                created,
                skipped,
                errors,
                rejected: preview.rejected,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (err) {
      return toolError(err);
    }
  },
);

server.registerTool(
  "habitica_complete_todo",
  {
    description:
      "Conclui um afazer (todo) específico somente com confirm=true. Valida tipo antes de pontuar.",
    inputSchema: {
      id: z.string().describe("ID do item de execução."),
      confirm: z.boolean().optional().describe("true para concluir."),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ id, confirm }) => {
    try {
      if (confirm !== true) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                mode: "preview",
                id,
                message:
                  "Nenhuma pontuação executada. Passe confirm=true para concluir o afazer. Risco: altera XP/ouro/HP.",
              }),
            },
          ],
        };
      }
      const config = loadConfig();
      const client = new HabiticaClient(config);
      const before = await client.getTask(id);
      if (before.tipo !== "todo") {
        throw new Error(`Item ${id} não é um todo (tipo=${before.tipo}).`);
      }
      const score = await client.scoreTask(id, "up");
      let after = before;
      try {
        after = await client.getTask(id);
      } catch {
        after = { ...before, ativo: false };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ mode: "completed", before, after, score }, null, 2),
          },
        ],
      };
    } catch (err) {
      return toolError(err);
    }
  },
);

server.registerTool(
  "habitica_score_habit",
  {
    description:
      "Pontua um hábito (up/down) somente com confirm=true. Pode afetar vida, ouro, XP e streak.",
    inputSchema: {
      id: z.string().describe("ID do hábito."),
      direction: z.enum(["up", "down"]).describe("Direção da pontuação."),
      confirm: z.boolean().optional().describe("true para pontuar."),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ id, direction, confirm }) => {
    try {
      if (confirm !== true) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                mode: "preview",
                id,
                direction,
                risk: "Pode alterar vida, ouro, experiência e streak.",
                message: "Nenhuma pontuação executada. Passe confirm=true.",
              }),
            },
          ],
        };
      }
      const config = loadConfig();
      const client = new HabiticaClient(config);
      const before = await client.getTask(id);
      if (before.tipo !== "habit") {
        throw new Error(`Item ${id} não é um habit (tipo=${before.tipo}).`);
      }
      const score = await client.scoreTask(id, direction);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ mode: "scored", before, direction, score }, null, 2),
          },
        ],
      };
    } catch (err) {
      return toolError(err);
    }
  },
);

server.registerTool(
  "habitica_score_daily",
  {
    description:
      "Conclui (up) ou desfaz (down) uma diária somente com confirm=true. Pode afetar streak/XP/ouro/HP.",
    inputSchema: {
      id: z.string().describe("ID da diária."),
      direction: z
        .enum(["up", "down"])
        .optional()
        .describe("up=concluir, down=desfazer. Default: up."),
      confirm: z.boolean().optional().describe("true para executar."),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ id, direction, confirm }) => {
    try {
      const dir = direction ?? "up";
      if (confirm !== true) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                mode: "preview",
                id,
                direction: dir,
                risk: "Pode alterar streak, vida, ouro e experiência.",
                message: "Nenhuma pontuação executada. Passe confirm=true.",
              }),
            },
          ],
        };
      }
      const config = loadConfig();
      const client = new HabiticaClient(config);
      const before = await client.getTask(id);
      if (before.tipo !== "daily") {
        throw new Error(`Item ${id} não é um daily (tipo=${before.tipo}).`);
      }
      const score = await client.scoreTask(id, dir);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ mode: "scored", before, direction: dir, score }, null, 2),
          },
        ],
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
