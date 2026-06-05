import dotenv from "dotenv";
import path from "node:path";
import readline from "node:readline";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const promptedTokens: Record<number, string> = {};

const PLACEHOLDER_PATTERNS = [/^token_sala_\d+$/i, /^seu_token/, /^sua_/, /^url_/];

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((p) => p.test(value));
}

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function promptForToken(roomNumber: number): Promise<string> {
  return question(`🎫 Token da Sala ${roomNumber} (cole aqui): `);
}

async function getOrPromptToken(roomNumber: number): Promise<string> {
  const envToken = process.env[`ROOM${roomNumber}_TOKEN`];
  if (envToken && !isPlaceholder(envToken)) return envToken;
  if (promptedTokens[roomNumber]) return promptedTokens[roomNumber];
  promptedTokens[roomNumber] = await promptForToken(roomNumber);
  return promptedTokens[roomNumber];
}

async function promptRoomVisibility(roomNumber: number): Promise<boolean> {
  const envPublic = process.env[`ROOM${roomNumber}_PUBLIC`];
  if (envPublic !== undefined) return envPublic === "true";

  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║   🌐 Sala ${roomNumber} — Visibilidade      ║`);
  console.log(`╠══════════════════════════════════════╣`);
  console.log(`║  1. 🌍 Pública (padrão)              ║`);
  console.log(`║  2. 🔒 Privada                       ║`);
  console.log(`╚══════════════════════════════════════╝`);
  const answer = await question(`Escolha [1]: `);
  return answer.trim() !== "2";
}

export function getEnv(key: string, required = true): string {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(`❌ Variável de ambiente ${key} não configurada!`);
  }
  return value ?? "";
}

export async function getRoomConfig(roomNumber: number): Promise<{
  token: string;
  name: string;
  proxy?: string;
  public: boolean;
}> {
  const token = await getOrPromptToken(roomNumber);
  const name = getEnv(`ROOM${roomNumber}_NAME`, false) || `Arena ${roomNumber}`;
  const proxy = getEnv(`ROOM${roomNumber}_PROXY`, false) || undefined;
  const isPublic = await promptRoomVisibility(roomNumber);
  return { token, name, proxy, public: isPublic };
}

export function getActiveRoomCount(): number {
  let count = 0;
  for (let i = 1; i <= 10; i++) {
    const token = process.env[`ROOM${i}_TOKEN`];
    const name = process.env[`ROOM${i}_NAME`];
    if (token && !isPlaceholder(token)) count++;
    else if (name) count++;
  }
  return count || 1;
}

export function getWebhookUrl(baseKey: string, roomNumber?: number): string {
  if (roomNumber && roomNumber > 1) {
    const numberedKey = baseKey.replace("_WEBHOOK", `${roomNumber}_WEBHOOK`);
    const specific = process.env[numberedKey];
    if (specific) return specific;
  }
  return process.env[baseKey] ?? "";
}

export const BOT_TOKEN = () => getEnv("TOKEN_BOT");
export const CLIENT_ID = () => getEnv("CLIENT_ID");
export const GUILD_ID = () => getEnv("GUILD_ID");
export const TEAM_NAME = () => getEnv("TEAM_NAME");
export const SENHA_PADRAO = () => getEnv("SENHA_PADRAO");