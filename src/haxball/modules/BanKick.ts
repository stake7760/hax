import { Event, Module, type Player, type Room } from "haxball-extended-room";
import { getWebhookUrl } from "../../config/env";
import { rolesDb } from "../../database/Database";
import { sanitizeDiscordContent, sendWebhookJson } from "../../utils/discordWebhook";

type PlayerRef = {
  id: number;
  name: string;
  team?: number;
  auth?: string;
  ip?: string;
  settings?: Player["settings"];
};

const displayRoleRank: Record<string, number> = {
  "👮‍♂️ capitão": 4,
  "💂 sub-capitão": 3,
  "⚽ jogador": 2,
  "👨‍💼 administrador": 1,
};

const dbRoleToDisplay: Record<string, string> = {
  capitao: "👮‍♂️ capitão",
  "sub-capitao": "💂 sub-capitão",
  jogador: "⚽ jogador",
  administrador: "👨‍💼 administrador",
};

@Module
export class BanKickModule {
  private readonly roleCache = new Map<number, string>();

  constructor(private room: Room) {
    setInterval(() => {
      try {
        this.room.unbanAll();
      } catch {}
    }, 30 * 60 * 1000);
  }

  @Event
  onPlayerJoin(player: Player): void {
    this.cacheRole(player);
  }

  @Event
  onPlayerAdminChange(player: Player): void {
    this.cacheRole(player);
  }

  @Event
  onPlayerKicked(kickedPlayer: PlayerRef, reason?: string, byPlayer?: PlayerRef): void {
    const by = byPlayer ? `por \`${byPlayer.name}\`` : "pelo sistema";
    const why = reason ? ` (motivo: ${reason})` : "";

    this.logMessage(`Jogador ${this.playerTag(kickedPlayer)} **${sanitizeDiscordContent(kickedPlayer.name)}** foi kickado ${by}${why}`);

    const decision = this.punishmentDecision(byPlayer, kickedPlayer, "kickar");
    if (!decision.allowed) {
      this.kickBadActor(byPlayer, decision.reason);
    }
  }

  @Event
  onPlayerBanned(bannedPlayer: PlayerRef, reason?: string, byPlayer?: PlayerRef): void {
    const by = byPlayer ? `por \`${byPlayer.name}\`` : "pelo sistema";
    const why = reason ? ` (motivo: ${reason})` : "";

    this.logMessage(`Jogador ${this.playerTag(bannedPlayer)} **${sanitizeDiscordContent(bannedPlayer.name)}** foi banido ${by}${why}`);

    const decision = this.punishmentDecision(byPlayer, bannedPlayer, "banir");
    if (!decision.allowed) {
      try {
        this.room.unban(bannedPlayer.id);
      } catch {}
      this.kickBadActor(byPlayer, decision.reason);
    }
  }

  private cacheRole(player?: PlayerRef): void {
    if (!player) return;
    const role = this.readLiveRole(player);
    if (role) this.roleCache.set(player.id, role);
  }

  private punishmentDecision(
    actor: PlayerRef | undefined,
    target: PlayerRef,
    verb: "kickar" | "banir",
  ): { allowed: true } | { allowed: false; reason: string } {
    if (!actor || actor.id === target.id) return { allowed: true };

    const actorRank = this.roleRank(actor);
    const targetRank = this.roleRank(target);
    if (actorRank > targetRank) return { allowed: true };

    if (actorRank === targetRank && targetRank === 0) {
      return { allowed: false, reason: `❌ Você não tem permissão para ${verb} jogadores` };
    }

    if (actorRank === targetRank) {
      return { allowed: false, reason: `❌ Você não pode ${verb} outro ${this.cleanRoleName(target)}` };
    }

    return { allowed: false, reason: `❌ Você não tem permissão para ${verb} esse jogador` };
  }

  private roleRank(player: PlayerRef): number {
    const role = this.roleName(player);
    return role ? (displayRoleRank[role] ?? 0) : 0;
  }

  private roleName(player: PlayerRef): string | undefined {
    const cachedRole = this.roleCache.get(player.id);
    if (cachedRole) return cachedRole;

    const liveRole = this.readLiveRole(player);
    if (liveRole) {
      this.roleCache.set(player.id, liveRole);
      return liveRole;
    }

    const dbRole = this.readDbRole(player);
    if (dbRole) {
      this.roleCache.set(player.id, dbRole);
      return dbRole;
    }

    return undefined;
  }

  private readLiveRole(player: PlayerRef): string | undefined {
    const livePlayer = this.room.players[player.id] as Player | undefined;
    return livePlayer?.settings?.role || player.settings?.role;
  }

  private readDbRole(player: PlayerRef): string | undefined {
    const livePlayer = this.room.players[player.id] as Player | undefined;
    const auth = livePlayer?.auth || player.auth || "";
    const ip = livePlayer?.ip || player.ip || "";
    const dbRole = (auth ? rolesDb.findByAuth(auth) : undefined) || (ip ? rolesDb.findByIp(ip) : undefined);
    return dbRole ? dbRoleToDisplay[dbRole.role] : undefined;
  }

  private cleanRoleName(player: PlayerRef): string {
    return (this.roleName(player) || "jogador").replace(/^[^\w]+/, "").toLowerCase();
  }

  private kickBadActor(actor: PlayerRef | undefined, reason: string): void {
    if (!actor) return;
    const liveActor = this.room.players[actor.id] as Player | undefined;
    liveActor?.kick(reason);
  }

  private playerTag(player: PlayerRef): string {
    return `${this.teamEmoji(player)} \`[${player.id}]\``;
  }

  private teamEmoji(player: PlayerRef): string {
    return player.team === 1 ? "🔴" : player.team === 2 ? "🔵" : "🟢";
  }

  private logMessage(content: string): void {
    const url = getWebhookUrl("MENSAGEM_WEBHOOK", (this.room.state as any).roomNumber);
    if (!url) return;
    sendWebhookJson(url, { content: `[${this.room.name}] [:warning: **SISTEMA**]: ${content}` });
  }
}
