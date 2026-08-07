import type { HabiticaConfig } from "../config.js";
import { redactSecrets } from "../config.js";
import type { HabiticaTask, ItemExecucao, ItemTipo } from "../types.js";
import { mapTaskToItem, mapTasksToItems } from "./mapper.js";
import type { HabiticaTodoCreatePayload } from "./todo.js";

const BASE_URL = "https://habitica.com/api/v3";

export class HabiticaApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "HabiticaApiError";
  }
}

interface HabiticaEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class HabiticaClient {
  constructor(private readonly config: HabiticaConfig) {}

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-api-user": this.config.userId,
      "x-api-key": this.config.apiToken,
      "x-client": this.config.xClient,
    };
  }

  private async request<T>(
    path: string,
    init?: RequestInit,
    options?: { allowMissingData?: boolean },
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: {
          ...this.headers(),
          ...(init?.headers ?? {}),
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new HabiticaApiError(
        redactSecrets(`Falha de rede ao chamar Habitica: ${msg}`, this.config),
        undefined,
        "network",
      );
    }

    const text = await response.text();
    let body: HabiticaEnvelope<T> | undefined;
    try {
      body = text ? (JSON.parse(text) as HabiticaEnvelope<T>) : undefined;
    } catch {
      throw new HabiticaApiError(
        `Resposta inválida da API Habitica (HTTP ${response.status}).`,
        response.status,
        "invalid_response",
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new HabiticaApiError(
        "Autenticação Habitica falhou. Verifique USER_ID, API_TOKEN e X_CLIENT.",
        response.status,
        "auth",
      );
    }

    if (response.status === 429) {
      throw new HabiticaApiError(
        "Rate limit da API Habitica atingido. Aguarde e tente novamente.",
        response.status,
        "rate_limit",
      );
    }

    if (!response.ok || body?.success === false) {
      const apiMsg = body?.message ?? body?.error ?? `HTTP ${response.status}`;
      throw new HabiticaApiError(
        redactSecrets(`Erro Habitica: ${apiMsg}`, this.config),
        response.status,
        "api",
      );
    }

    if (body?.data === undefined) {
      if (options?.allowMissingData) {
        return { deleted: true } as T;
      }
      throw new HabiticaApiError(
        "Resposta Habitica sem campo data.",
        response.status,
        "invalid_response",
      );
    }

    return body.data;
  }

  /**
   * Lista tasks do usuário.
   * @param type filtro por tipo de domínio
   * @param ativo se definido, filtra por item.ativo (completed → inativo)
   */
  async listTasks(type?: ItemTipo, ativo?: boolean): Promise<ItemExecucao[]> {
    const apiType = type ? toApiTypeParam(type) : undefined;
    const qs = apiType ? `?type=${apiType}` : "";
    const data = await this.request<HabiticaTask[]>(`/tasks/user${qs}`);
    if (!Array.isArray(data)) {
      throw new HabiticaApiError(
        "Resposta Habitica: data não é uma lista.",
        undefined,
        "invalid_response",
      );
    }
    let items = mapTasksToItems(data);
    if (ativo !== undefined) {
      items = items.filter((item) => item.ativo === ativo);
    }
    return items;
  }

  async getTask(id: string): Promise<ItemExecucao> {
    const data = await this.request<HabiticaTask>(`/tasks/${encodeURIComponent(id)}`);
    return mapTaskToItem(data);
  }

  /** POST genérico /tasks/user (habit, daily, todo, …). */
  async createTask(payload: Record<string, unknown>): Promise<ItemExecucao> {
    const data = await this.request<HabiticaTask>("/tasks/user", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return mapTaskToItem(data);
  }

  async createTodo(payload: HabiticaTodoCreatePayload): Promise<ItemExecucao> {
    return this.createTask(payload as unknown as Record<string, unknown>);
  }

  async updateTask(id: string, payload: Record<string, unknown>): Promise<ItemExecucao> {
    const data = await this.request<HabiticaTask>(`/tasks/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return mapTaskToItem(data);
  }

  /**
   * DELETE /tasks/:id. Habitica pode omitir `data` em sucesso — retorna sentinel.
   */
  async deleteTask(id: string): Promise<{ deleted: true; id: string }> {
    await this.request<{ deleted: true }>(
      `/tasks/${encodeURIComponent(id)}`,
      { method: "DELETE" },
      { allowMissingData: true },
    );
    return { deleted: true, id };
  }

  async scoreTask(id: string, direction: "up" | "down"): Promise<unknown> {
    return this.request(`/tasks/${encodeURIComponent(id)}/score/${direction}`, {
      method: "POST",
      body: "{}",
    });
  }
}

/** Converte tipo do domínio para query `type` da API. */
export function toApiTypeParam(tipo: ItemTipo): string {
  switch (tipo) {
    case "habit":
      return "habits";
    case "daily":
      return "dailys";
    case "todo":
      return "todos";
    case "reward":
      return "rewards";
  }
}
