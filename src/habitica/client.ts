import type { HabiticaConfig } from "../config.js";
import { redactSecrets } from "../config.js";
import type { HabiticaTask, ItemTipo } from "../types.js";
import { mapTasksToItems } from "./mapper.js";
import type { ItemExecucao } from "../types.js";

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

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
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
      throw new HabiticaApiError(
        "Resposta Habitica sem campo data.",
        response.status,
        "invalid_response",
      );
    }

    return body.data;
  }

  /**
   * Lista tasks do usuário. `type` opcional: habits | dailys | todos | rewards
   * (nomes da API Habitica).
   */
  async listTasks(type?: ItemTipo): Promise<ItemExecucao[]> {
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
    return mapTasksToItems(data);
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
