import { Module, type Player, type Room, Event, Colors, ChatStyle, ChatSounds } from "haxball-extended-room";
import { fetch } from "undici";
import { bansDb, rolesDb } from "../../database/Database";
import { WebhookClient } from "discord.js";
import { client } from "../../discord/Client";
import { getBotName, getBotURL } from "../../discord/EmbedFactory";
import { getWebhookUrl } from "../../config/env";
import { getPublicChatBlock, isSpecialChatMessage } from "../chat/ChatGuards";
import { syncPlayerAccessRole } from "../roles/AccessRoles";
import { sanitizeDiscordContent, sendWebhookJson } from "../../utils/discordWebhook";

const emojiMap: Record<string, { id: string; emojiName: string }> = {
  Nick: { id: "1508652143605846096", emojiName: "Nick" },
  Auth: { id: "1508652011770478673", emojiName: "Auth" },
  IP: { id: "1508652093848817794", emojiName: "IP" },
  CONN: { id: "1508652073820885124", emojiName: "CONN" },
  Provedora: { id: "1508652192855363655", emojiName: "Provedora" },
  "Organização": { id: "1508652159611441302", emojiName: "Organizacao" },
  "País": { id: "1508652175801319527", emojiName: "Pais" },
  Estado: { id: "1508652231761854655", emojiName: "Estado" },
  Cidade: { id: "1508652056888741998", emojiName: "Cidade" },
  Latitude: { id: "1508652110605058178", emojiName: "Latitude" },
  Longitude: { id: "1508652126891540711", emojiName: "Longitude" },
  Proxy: { id: "1508652213151727696", emojiName: "Proxy" },
};

const GEO_CACHE_TTL_MS = 15 * 60 * 1000;
const GEO_PROVIDER_ATTEMPTS = 2;
const GEO_FETCH_TIMEOUT_MS = 4500;
const GEO_LEAVE_WAIT_MS = 2500;
const geoCache = new Map<string, { expiresAt: number; data?: Record<string, any>; promise?: Promise<Record<string, any>> }>();
type GeoProvider = {
  name: string;
  url: (ip: string) => string;
  parse: (ip: string, result: Record<string, any>) => Record<string, any>;
};

const GEO_PROVIDERS: GeoProvider[] = [
  {
    name: "proxycheck",
    url: (ip) => {
      const key = process.env.PROXYCHECK_API_KEY;
      return `https://proxycheck.io/v2/${ip}?vpn=1&asn=1${key ? `&key=${encodeURIComponent(key)}` : ""}`;
    },
    parse: (ip, result) => {
      if (result.status && result.status !== "ok") {
        throw new Error(`status=${result.status}${result.message ? ` message=${result.message}` : ""}`);
      }
      return result[ip] || {};
    },
  },
  {
    name: "ipwho.is",
    url: (ip) => `https://ipwho.is/${ip}`,
    parse: (_ip, result) => {
      if (result.success === false) throw new Error(result.message || "lookup failed");
      const connection = result.connection || {};
      return {
        provider: connection.isp,
        organisation: connection.org,
        country: result.country,
        region: result.region,
        city: result.city,
        latitude: result.latitude,
        longitude: result.longitude,
        proxy: "no",
      };
    },
  },
  {
    name: "ip-api",
    url: (ip) => `http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon,isp,org,proxy,hosting,mobile`,
    parse: (_ip, result) => {
      if (result.status && result.status !== "success") throw new Error(result.message || "lookup failed");
      return {
        provider: result.isp,
        organisation: result.org,
        country: result.country,
        region: result.regionName,
        city: result.city,
        latitude: result.lat,
        longitude: result.lon,
        proxy: result.proxy || result.hosting ? "yes" : "no",
      };
    },
  },
  {
    name: "ipapi.co",
    url: (ip) => `https://ipapi.co/${ip}/json/`,
    parse: (_ip, result) => {
      if (result.error) throw new Error(result.reason || "lookup failed");
      return {
        provider: result.org,
        organisation: result.org,
        country: result.country_name,
        region: result.region,
        city: result.city,
        latitude: result.latitude,
        longitude: result.longitude,
        proxy: "no",
      };
    },
  },
  {
    name: "ipinfo",
    url: (ip) => `https://ipinfo.io/${ip}/json`,
    parse: (_ip, result) => {
      if (result.error) throw new Error(result.error?.message || "lookup failed");
      const [latitude, longitude] = typeof result.loc === "string" ? result.loc.split(",") : [];
      return {
        provider: result.org,
        organisation: result.org,
        country: result.country,
        region: result.region,
        city: result.city,
        latitude,
        longitude,
        proxy: "no",
      };
    },
  },
];

@Module
export class CoreModule {
  private entryWebhook?: WebhookClient;
  private exitWebhook?: WebhookClient;

  constructor(private room: Room) {
    const roomNum = (room.state as any).roomNumber as number | undefined;
    const entryUrl = getWebhookUrl("ENTRADA_WEBHOOK", roomNum);
    const exitUrl = getWebhookUrl("SAIDA_WEBHOOK", roomNum);
    if (entryUrl) this.entryWebhook = new WebhookClient({ url: entryUrl });
    if (exitUrl) this.exitWebhook = new WebhookClient({ url: exitUrl });

    for (const player of this.room.players.values()) {
      if (player.settings.role) {
        syncPlayerAccessRole(player, player.settings.role);
      }
    }
  }

  private emojiField(name: string): string {
    const data = emojiMap[name];
    if (data) {
      return `<:${data.emojiName}:${data.id}> ${name}`;
    }
    return name;
  }

  private teamEmoji(player: Player): string {
    return player.team === 1 ? "🔴" : player.team === 2 ? "🔵" : "🟢";
  }

  private sendRoleChatWebhook(player: Player, message: string): void {
    const url = getWebhookUrl("MENSAGEM_WEBHOOK", (this.room.state as any).roomNumber);
    if (!url) return;
    const role = player.settings.role?.toUpperCase();
    if (!role) return;
    const content = `[${this.room.name}] [${role}] [${this.teamEmoji(player)}] \`[${player.id}]\` **${sanitizeDiscordContent(player.name)}**: \`${sanitizeDiscordContent(message)}\``;
    sendWebhookJson(url, { content });
  }

  @Event
  async onPlayerJoin(player: Player): Promise<void> {
    const duplicate = Array.from(this.room.players.values()).find(
      (p) => (p.ip === player.ip || p.conn === player.conn || p.auth === player.auth) && p.id !== player.id,
    );
    if (duplicate) {
      player.kick(`⚠️ Você já está na sala [${duplicate.name}]`);
      return;
    }

    if (!player.auth || player.auth.trim() === "") {
      player.kick("❌ Auth inválida");
      return;
    }

    const ban = bansDb.find(player.auth, player.ip);
    if (ban) {
      player.ban("❌ Você está na lista negra da sala");
      return;
    }

    const roleData = rolesDb.findByAuth(player.auth) || rolesDb.findByIp(player.ip);
    if (roleData) {
      const roleName = roleData.role;
      const roleMap: Record<string, string> = {
        jogador: "⚽ jogador",
        capitao: "👮‍♂️ capitão",
        "sub-capitao": "💂 sub-capitão",
        administrador: "👨‍💼 administrador",
      };
      const displayName = roleMap[roleName];
      if (displayName) {
        syncPlayerAccessRole(player, displayName);
        player.admin = true;
        this.room.send({
          message: `O ${displayName.toUpperCase()} ${player.name} entrou na sala.`,
          color: 0x66E7FF,
          style: ChatStyle.Bold,
          sound: ChatSounds.Notification,
        });
      }
    }

    const geoPromise = fetchGeoData(player.ip);
    player.settings.geoDataPromise = geoPromise;
    const geo = await geoPromise;

    if (geo.proxy === "yes") {
      player.reply({
        message: `[PV] 🛜 Detectado o uso de VPN ou Proxy!`,
        color: Colors.DodgerBlue,
        style: ChatStyle.Bold,
        sound: ChatSounds.Notification,
      });
    }

    player.reply({
      message: `[PV] 👋🏼 Eai, ${player.name}! Seja bem-vindo(a) à ${this.room.name}!`,
      color: Colors.Red,
      style: ChatStyle.Bold,
      sound: ChatSounds.Notification,
    });

    player.reply({
      message: `[PV] 📜 Para ver a lista de comandos disponíveis, use "!help".`,
      color: Colors.Orange,
      style: ChatStyle.Bold,
      sound: ChatSounds.None,
    });

    player.settings.geoData = geo;

    const provedora = geo.provider || geo.isp || "—";
    const organizacao = geo.organisation || geo.organization || geo.org || "—";

    if (this.entryWebhook) {
      try {
        await this.entryWebhook.send({
          embeds: [{
            color: 0x00FF00,
            title: this.room.name,
            description: `\`${player.name}\` entrou na sala!`,
            fields: [
              { name: this.emojiField("Nick"), value: `\`\`\`fix\n${player.name}\`\`\``, inline: true },
              { name: this.emojiField("Auth"), value: `\`\`\`fix\n${player.auth}\`\`\``, inline: true },
              { name: this.emojiField("IP"), value: `\`\`\`fix\n${player.ip}\`\`\``, inline: true },
              { name: this.emojiField("CONN"), value: `\`\`\`fix\n${player.conn}\`\`\``, inline: true },
              { name: this.emojiField("Provedora"), value: `\`\`\`fix\n${provedora}\`\`\``, inline: true },
              { name: this.emojiField("Organização"), value: `\`\`\`fix\n${organizacao}\`\`\``, inline: true },
              { name: this.emojiField("País"), value: `\`\`\`fix\n${geo.country || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Estado"), value: `\`\`\`fix\n${geo.region || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Cidade"), value: `\`\`\`fix\n${geo.city || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Latitude"), value: `\`\`\`fix\n${geo.latitude || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Longitude"), value: `\`\`\`fix\n${geo.longitude || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Proxy"), value: geo.proxy === "yes" ? "```yaml\nSim```" : "```fix\nNão```", inline: true },
            ],
            footer: { text: `${new Date().getFullYear()} © ${getBotName()} - Todos os direitos reservados`, icon_url: getBotURL() },
          }],
        });
      } catch {}
    }
  }

  @Event
  async onPlayerLeave(player: Player): Promise<void> {
    if (this.exitWebhook) {
      try {
        const geo = await this.getPlayerGeoData(player);
        const provedora = geo.provider || geo.isp || "—";
        const organizacao = geo.organisation || geo.organization || geo.org || "—";

        await this.exitWebhook.send({
          embeds: [{
            color: 0xFF0000,
            title: this.room.name,
            description: `\`${player.name}\` saiu da sala!`,
            fields: [
              { name: this.emojiField("Nick"), value: `\`\`\`fix\n${player.name}\`\`\``, inline: true },
              { name: this.emojiField("Auth"), value: `\`\`\`fix\n${player.auth}\`\`\``, inline: true },
              { name: this.emojiField("IP"), value: `\`\`\`fix\n${player.ip}\`\`\``, inline: true },
              { name: this.emojiField("CONN"), value: `\`\`\`fix\n${player.conn}\`\`\``, inline: true },
              { name: this.emojiField("Provedora"), value: `\`\`\`fix\n${provedora}\`\`\``, inline: true },
              { name: this.emojiField("Organização"), value: `\`\`\`fix\n${organizacao}\`\`\``, inline: true },
              { name: this.emojiField("País"), value: `\`\`\`fix\n${geo.country || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Estado"), value: `\`\`\`fix\n${geo.region || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Cidade"), value: `\`\`\`fix\n${geo.city || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Latitude"), value: `\`\`\`fix\n${geo.latitude || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Longitude"), value: `\`\`\`fix\n${geo.longitude || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Proxy"), value: geo.proxy === "yes" ? "```yaml\nSim```" : "```fix\nNão```", inline: true },
            ],
            footer: { text: `${new Date().getFullYear()} © ${getBotName()} - Todos os direitos reservados`, icon_url: getBotURL() },
          }],
        });
      } catch {}
    }
  }

  private async getPlayerGeoData(player: Player): Promise<Record<string, any>> {
    if (player.settings.geoData) return player.settings.geoData as Record<string, any>;
    if (player.settings.geoDataPromise) {
      const geo = await withTimeout(player.settings.geoDataPromise as Promise<Record<string, any>>, GEO_LEAVE_WAIT_MS, {});
      player.settings.geoData = geo;
      return geo;
    }
    const geo = await fetchGeoData(player.ip);
    player.settings.geoData = geo;
    return geo;
  }

  @Event
  onPlayerChat(player: Player, message: string): boolean | undefined {
    if (message.startsWith("!")) {
      const cmdName = message.slice(1).trim().split(/ +/)[0].toLowerCase();
      const commands = (this.room as any)._commands;
      if (commands && !commands.get(cmdName)) {
        player.reply({ message: `[PV] ❌ Comando desconhecido: ${message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return false;
      }
      return;
    }
    if (isSpecialChatMessage(message)) return;
    if (getPublicChatBlock(this.room, player, message).blocked) return;
    if (player.settings.role) {
      const colors: Record<string, number> = {
        "⚽ jogador": Colors.MistyRose,
        "👮‍♂️ capitão": Colors.YellowGreen,
        "💂 sub-capitão": Colors.Yellow,
        "👨‍💼 administrador": 0x66E7FF,
      };
      const color = colors[player.settings.role] || Colors.White;
      this.room.send({
        message: `[${player.settings.role.toUpperCase()}] ${player.name}: ${message}`,
        color,
        style: ChatStyle.Bold,
        sound: ChatSounds.Normal,
      });
      this.sendRoleChatWebhook(player, message);
      return false;
    }
  }
}

async function fetchGeoData(ip?: string): Promise<Record<string, any>> {
  if (!ip) return {};

  const now = Date.now();
  const cached = geoCache.get(ip);
  if (cached && cached.expiresAt > now) {
    if (cached.data) return cached.data;
    if (cached.promise) return cached.promise;
  }

  const promise = fetchGeoDataWithRetry(ip)
    .then((data) => {
      geoCache.set(ip, { expiresAt: Date.now() + GEO_CACHE_TTL_MS, data });
      return data;
    })
    .catch((err) => {
      geoCache.delete(ip);
      console.warn(`⚠️ Geo lookup falhou em todos os provedores para ${ip}:`, err instanceof Error ? err.message : err);
      return {};
    });

  geoCache.set(ip, { expiresAt: now + GEO_CACHE_TTL_MS, promise });
  return promise;
}

async function fetchGeoDataWithRetry(ip: string): Promise<Record<string, any>> {
  let lastError: unknown;
  for (const provider of GEO_PROVIDERS) {
    for (let attempt = 1; attempt <= GEO_PROVIDER_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(provider.url(ip), {
          signal: AbortSignal.timeout(GEO_FETCH_TIMEOUT_MS),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

        const result = (await response.json()) as Record<string, any>;
        const geo = normalizeGeoData(provider.parse(ip, result));
        if (!hasUsefulGeoData(geo)) throw new Error("sem dados úteis");
        if (provider.name !== "proxycheck") {
          console.warn(`⚠️ Geo lookup usando fallback ${provider.name} para ${ip}.`);
        }
        return geo;
      } catch (err) {
        lastError = err;
        if (attempt < GEO_PROVIDER_ATTEMPTS) await sleep(attempt * 500);
      }
    }
  }

  throw lastError;
}

function normalizeGeoData(geo: Record<string, any>): Record<string, any> {
  return {
    ...geo,
    provider: valueOrUndefined(geo.provider || geo.isp),
    isp: valueOrUndefined(geo.isp || geo.provider),
    organisation: valueOrUndefined(geo.organisation || geo.organization || geo.org),
    organization: valueOrUndefined(geo.organization || geo.organisation || geo.org),
    org: valueOrUndefined(geo.org || geo.organisation || geo.organization),
    country: valueOrUndefined(geo.country),
    region: valueOrUndefined(geo.region),
    city: valueOrUndefined(geo.city),
    latitude: valueOrUndefined(geo.latitude),
    longitude: valueOrUndefined(geo.longitude),
    proxy: geo.proxy === "yes" || geo.proxy === true ? "yes" : "no",
  };
}

function hasUsefulGeoData(geo: Record<string, any>): boolean {
  return Boolean(geo.provider || geo.organisation || geo.country || geo.region || geo.city || geo.latitude || geo.longitude);
}

function valueOrUndefined(value: unknown): unknown {
  if (value === null || value === undefined || value === "") return undefined;
  return value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}
