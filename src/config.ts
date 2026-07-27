export interface HabiticaConfig {
  userId: string;
  apiToken: string;
  xClient: string;
}

const REQUIRED = ["HABITICA_USER_ID", "HABITICA_API_TOKEN", "HABITICA_X_CLIENT"] as const;

/**
 * Carrega credenciais do ambiente. Falha cedo sem ecoar valores secretos.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): HabiticaConfig {
  const missing = REQUIRED.filter((key) => !env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Configuração Habitica incompleta. Defina: ${missing.join(", ")}.`);
  }

  return {
    userId: env.HABITICA_USER_ID!.trim(),
    apiToken: env.HABITICA_API_TOKEN!.trim(),
    xClient: env.HABITICA_X_CLIENT!.trim(),
  };
}

/** Substitui possíveis segredos em mensagens de erro por máscara. */
export function redactSecrets(message: string, config?: HabiticaConfig): string {
  let out = message;
  if (config) {
    for (const secret of [config.apiToken, config.userId, config.xClient]) {
      if (secret.length > 0) {
        out = out.split(secret).join("[REDACTED]");
      }
    }
  }
  out = out.replace(/x-api-key["\s:=]+[^\s"',}]+/gi, "x-api-key=[REDACTED]");
  out = out.replace(/x-api-user["\s:=]+[^\s"',}]+/gi, "x-api-user=[REDACTED]");
  out = out.replace(/HABITICA_API_TOKEN["\s:=]+[^\s"',}]+/gi, "HABITICA_API_TOKEN=[REDACTED]");
  return out;
}
