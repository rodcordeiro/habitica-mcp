#!/usr/bin/env node
import { config as loadEnv } from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig, redactSecrets } from "./config.js";
import { HabiticaClient } from "./habitica/client.js";
import { buildDailyPreview, buildDailyUpdatePreview } from "./habitica/daily.js";
import { buildDayPlanPreview } from "./habitica/day-plan.js";
import { buildDeletePreview } from "./habitica/delete.js";
import { buildHabitPreview, buildHabitUpdatePreview } from "./habitica/habit.js";
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
      slug: z
        .string()
        .optional()
        .describe(
          "Slug kebab-case → alias Habitica. Se omitido, é gerado automaticamente a partir do título.",
        ),
      notas: z.string().optional().describe("Notas opcionais (sem marcador de slug)."),
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
      "Cria um afazer no Habitica somente com confirm=true. Sem confirmação, retorna o mesmo preview de habitica_preview_todo. O slug (informado ou gerado) preenche o alias da tarefa.",
    inputSchema: {
      titulo: z.string().describe("Título do afazer (obrigatório)."),
      slug: z
        .string()
        .optional()
        .describe(
          "Slug kebab-case → alias Habitica. Se omitido, é gerado automaticamente a partir do título.",
        ),
      notas: z.string().optional().describe("Notas opcionais (sem marcador de slug)."),
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
            text: JSON.stringify({ mode: "created", item, slug: preview.item.slug }, null, 2),
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
      "Recebe uma lista explícita de itens do dia e devolve preview de afazeres (sem escrita). Cada item recebe prazo no dia do plano e slug no alias. Não importa backlog de projeto.",
    inputSchema: {
      data: z
        .string()
        .optional()
        .describe("Dia do planejamento YYYY-MM-DD. Default: data na origem ou hoje local."),
      items: z
        .array(
          z.object({
            titulo: z.string(),
            slug: z.string().optional(),
            notas: z.string().optional(),
            origem: z.string().optional(),
            prioridade: z.enum(["baixa", "media", "alta"]).optional(),
            data: z
              .string()
              .optional()
              .describe("Prazo do item YYYY-MM-DD (sobrescreve data do plano)."),
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
  async ({ items, data }) => {
    try {
      const preview = buildDayPlanPreview(items, { data });
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
      "Cria um lote pequeno de afazeres do plano do dia somente com confirm=true. Prazo = dia do plano; slug = alias. Resultado parcial por item.",
    inputSchema: {
      data: z
        .string()
        .optional()
        .describe("Dia do planejamento YYYY-MM-DD. Default: data na origem ou hoje local."),
      items: z
        .array(
          z.object({
            titulo: z.string(),
            slug: z.string().optional(),
            notas: z.string().optional(),
            origem: z.string().optional(),
            prioridade: z.enum(["baixa", "media", "alta"]).optional(),
            data: z
              .string()
              .optional()
              .describe("Prazo do item YYYY-MM-DD (sobrescreve data do plano)."),
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
  async ({ items, data, confirm }) => {
    try {
      const preview = buildDayPlanPreview(items, { data });
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

const habitFields = {
  titulo: z.string().describe("Título do hábito (obrigatório na criação)."),
  slug: z
    .string()
    .optional()
    .describe("Slug kebab-case → alias Habitica. Se omitido na criação, gerado do título."),
  notas: z.string().optional().describe("Notas opcionais (sem marcador de slug)."),
  dificuldade: dificuldadeSchema.optional().describe("trivial|easy|medium|hard. Default: easy."),
  up: z.boolean().optional().describe("Botão positivo. Default: true."),
  down: z.boolean().optional().describe("Botão negativo. Default: true."),
};

server.registerTool(
  "habitica_preview_habit",
  {
    description:
      "Monta o preview do payload para criar um hábito no Habitica, sem chamar a API de escrita.",
    inputSchema: habitFields,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (args) => {
    try {
      const preview = buildHabitPreview(args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(preview, null, 2) }],
      };
    } catch (err) {
      return toolError(err);
    }
  },
);

server.registerTool(
  "habitica_create_habit",
  {
    description:
      "Cria um hábito no Habitica somente com confirm=true. Sem confirmação, retorna preview. Slug → alias; up/down default true (pelo menos um).",
    inputSchema: {
      ...habitFields,
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
      const preview = buildHabitPreview(args);
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
      const item = await client.createTask(preview.payload as unknown as Record<string, unknown>);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ mode: "created", item, slug: preview.item.slug }, null, 2),
          },
        ],
      };
    } catch (err) {
      return toolError(err);
    }
  },
);

server.registerTool(
  "habitica_update_habit",
  {
    description:
      "Atualiza um hábito existente somente com confirm=true. Sem confirm, devolve preview do PUT. Valida tipo habit antes de escrever.",
    inputSchema: {
      id: z.string().describe("ID do hábito."),
      titulo: z.string().optional().describe("Novo título."),
      slug: z.string().optional().describe("Novo alias (kebab-case)."),
      notas: z.string().optional().describe("Novas notas (sem marcador de slug)."),
      dificuldade: dificuldadeSchema.optional(),
      up: z.boolean().optional().describe("Botão positivo (informe junto com down)."),
      down: z.boolean().optional().describe("Botão negativo (informe junto com up)."),
      confirm: z.boolean().optional().describe("true para executar o update."),
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
      const preview = buildHabitUpdatePreview(args);
      if (args.confirm !== true) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  ...preview,
                  message: "Nenhuma escrita executada. Passe confirm=true para atualizar.",
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
      const before = await client.getTask(args.id);
      if (before.tipo !== "habit") {
        throw new Error(`Item ${args.id} não é um habit (tipo=${before.tipo}).`);
      }
      const item = await client.updateTask(
        args.id,
        preview.payload as unknown as Record<string, unknown>,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ mode: "updated", before, item }, null, 2),
          },
        ],
      };
    } catch (err) {
      return toolError(err);
    }
  },
);

const dailyFields = {
  titulo: z.string().describe("Título da diária (obrigatório na criação)."),
  slug: z
    .string()
    .optional()
    .describe("Slug kebab-case → alias Habitica. Se omitido na criação, gerado do título."),
  notas: z.string().optional().describe("Notas opcionais (sem marcador de slug)."),
  dificuldade: dificuldadeSchema.optional().describe("trivial|easy|medium|hard. Default: easy."),
  frequencia: z
    .enum(["daily", "weekly"])
    .optional()
    .describe("Recorrência mínima. Default: daily. Sem days/startDate neste corte."),
  every_x: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Intervalo da frequência (everyX). Default: 1."),
};

server.registerTool(
  "habitica_preview_daily",
  {
    description:
      "Monta o preview do payload para criar uma diária no Habitica (recorrência mínima: frequency + everyX), sem escrita.",
    inputSchema: dailyFields,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (args) => {
    try {
      const preview = buildDailyPreview(args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(preview, null, 2) }],
      };
    } catch (err) {
      return toolError(err);
    }
  },
);

server.registerTool(
  "habitica_create_daily",
  {
    description:
      "Cria uma diária no Habitica somente com confirm=true. Recorrência mínima (daily|weekly + every_x). Slug → alias.",
    inputSchema: {
      ...dailyFields,
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
      const preview = buildDailyPreview(args);
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
      const item = await client.createTask(preview.payload as unknown as Record<string, unknown>);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ mode: "created", item, slug: preview.item.slug }, null, 2),
          },
        ],
      };
    } catch (err) {
      return toolError(err);
    }
  },
);

server.registerTool(
  "habitica_update_daily",
  {
    description:
      "Atualiza uma diária existente somente com confirm=true. Sem confirm, devolve preview do PUT. Valida tipo daily antes de escrever.",
    inputSchema: {
      id: z.string().describe("ID da diária."),
      titulo: z.string().optional().describe("Novo título."),
      slug: z.string().optional().describe("Novo alias (kebab-case)."),
      notas: z.string().optional().describe("Novas notas (sem marcador de slug)."),
      dificuldade: dificuldadeSchema.optional(),
      frequencia: z.enum(["daily", "weekly"]).optional(),
      every_x: z.number().int().min(1).optional(),
      confirm: z.boolean().optional().describe("true para executar o update."),
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
      const preview = buildDailyUpdatePreview(args);
      if (args.confirm !== true) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  ...preview,
                  message: "Nenhuma escrita executada. Passe confirm=true para atualizar.",
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
      const before = await client.getTask(args.id);
      if (before.tipo !== "daily") {
        throw new Error(`Item ${args.id} não é um daily (tipo=${before.tipo}).`);
      }
      const item = await client.updateTask(
        args.id,
        preview.payload as unknown as Record<string, unknown>,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ mode: "updated", before, item }, null, 2),
          },
        ],
      };
    } catch (err) {
      return toolError(err);
    }
  },
);

server.registerTool(
  "habitica_delete_item",
  {
    description:
      "Remove permanentemente um habit|daily|todo somente com confirm=true. Valida tipo antes do DELETE. Reward fora de escopo. Irreversível.",
    inputSchema: {
      id: z.string().describe("ID do item de execução."),
      tipo: z
        .enum(["habit", "daily", "todo"])
        .describe("Tipo esperado (deve coincidir com a API)."),
      confirm: z.boolean().optional().describe("true para excluir permanentemente."),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ id, tipo, confirm }) => {
    try {
      const config = loadConfig();
      const client = new HabiticaClient(config);
      const fetched = await client.getTask(id);
      const preview = buildDeletePreview(id, tipo, fetched);
      if (confirm !== true) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify(preview, null, 2) }],
        };
      }
      const result = await client.deleteTask(id);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                mode: "deleted",
                ...result,
                before: preview.item,
                risk: preview.risk,
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
