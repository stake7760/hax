import { request } from "undici";

type JsonPayload = Record<string, unknown>;

export function sanitizeDiscordContent(value: string): string {
  return value
    .replace(/\*\*\s*@everyone\s*\*\*/gi, "`@everyone`")
    .replace(/\*\*\s*@here\s*\*\*/gi, "`@here`")
    .replace(/(?<!`)@everyone(?!`)/gi, "`@everyone`")
    .replace(/(?<!`)@here(?!`)/gi, "`@here`")
    .replace(/([*_~`|])/g, "\\$1");
}

export function formatDiscordPlayer(id: number, name: string, badge = ""): string {
  return `\`[${id}]\` ${badge ? `${badge} ` : ""}**${sanitizeDiscordContent(name)}**`;
}

export function webhookJsonPayload(payload: JsonPayload): JsonPayload {
  return {
    ...payload,
    allowed_mentions: { parse: [] },
  };
}

export function sendWebhookJson(url: string, payload: JsonPayload): void {
  request(url, {
    method: "POST",
    body: JSON.stringify(webhookJsonPayload(payload)),
    headers: { "Content-Type": "application/json" },
  }).catch(() => {});
}
