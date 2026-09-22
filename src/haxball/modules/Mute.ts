import {
  ChatSounds,
  ChatStyle,
  Colors,
  type CommandExecInfo,
  Event,
  Module,
  ModuleCommand,
  type Player,
  type Room,
} from "haxball-extended-room";
import { mutesDb } from "../../database/Database";
import { getPublicChatBlock } from "../chat/ChatGuards";

const muteHierarchy: Record<string, number> = {
  "👨‍💼 administrador": 0,
  "⚽ jogador": 1,
  "💂 sub-capitão": 2,
  "👮‍♂️ capitão": 3,
};

type DurationParseResult =
  | { ok: true; seconds: number; consumedArgs: number; label: string }
  | { ok: false; message: string };

type GlobalMuteState = {
  mutedKeys: Set<string>;
  timers: Map<string, NodeJS.Timeout>;
  lastReminderAt: Map<string, number>;
};

const muteState: GlobalMuteState = ((globalThis as any).__vincereMuteState ??= {
  mutedKeys: new Set<string>(),
  timers: new Map<string, NodeJS.Timeout>(),
  lastReminderAt: new Map<string, number>(),
});

function canMute(actor: Player, target: Player): boolean {
  const actorRole = actor.settings.role;
  const targetRole = target.settings.role;
  if (!targetRole) return true;
  if (!actorRole) return false;
  return (muteHierarchy[actorRole] ?? -1) > (muteHierarchy[targetRole] ?? -1);
}

function parseDurationArgs(args: string[]): DurationParseResult {
  if (args.length === 0) {
    return { ok: false, message: "[PV] ⚠️ Informe o tempo. Ex: 10s, 1m10s, 30min 30seg ou 1h03m05s." };
  }

  if (/^\d+$/.test(args[0])) {
    return { ok: false, message: "[PV] ⚠️ Informe a unidade do tempo: s/seg, m/min ou h/hr. Ex: 10s, 1m10s ou 1h03m05s." };
  }

  let totalSeconds = 0;
  let consumedArgs = 0;

  for (const arg of args) {
    const seconds = parseDurationToken(arg);
    if (seconds === undefined) break;
    totalSeconds += seconds;
    consumedArgs += 1;
  }

  if (consumedArgs === 0 || totalSeconds <= 0) {
    return { ok: false, message: "[PV] ⚠️ Tempo inválido. Use: 10s, 1m10s, 30min 30seg ou 1h03m05s." };
  }

  return { ok: true, seconds: totalSeconds, consumedArgs, label: formatDuration(totalSeconds) };
}

function parseDurationToken(token: string): number | undefined {
  const normalized = token.trim().toLowerCase();
  if (!normalized) return undefined;

  const regex = /(\d+)(horas|hora|hrs|hr|h|minutos|minuto|mins|min|m|segundos|segundo|segs|seg|s)/g;
  let cursor = 0;
  let total = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalized)) !== null) {
    if (match.index !== cursor) return undefined;
    cursor = regex.lastIndex;

    const amount = Number.parseInt(match[1], 10);
    if (!Number.isFinite(amount)) return undefined;

    const unit = match[2];
    if (unit === "h" || unit.startsWith("hr") || unit.startsWith("hora")) total += amount * 3600;
    else if (unit === "m" || unit.startsWith("min")) total += amount * 60;
    else total += amount;
  }

  return cursor === normalized.length && total > 0 ? total : undefined;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h${minutes.toString().padStart(2, "0")}m${seconds.toString().padStart(2, "0")}s`;
  }

  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m${seconds.toString().padStart(2, "0")}s` : `${minutes}m`;
  }

  return `${seconds}s`;
}

@Module
export class MuteModule {
  constructor(private room: Room) {}

  @Event
  onPlayerJoin(player: Player): void {
    const activeMute = mutesDb.findActive(player.auth ?? "", player.ip ?? "");
    if (activeMute) {
      player.canUseCommands = false;
      muteState.mutedKeys.add(this.muteKey(player));
      this.scheduleAutoUnmute(player, Math.max(1, activeMute.expires_at - Math.floor(Date.now() / 1000)));
    }
  }

  @ModuleCommand({
    aliases: ["silenciar", "mutar"],
    desc: "Muta um jogador por tempo determinado.",
    usage: "mutar #id tempo [motivo]",
    roles: ["👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
  })
  public mute(execInfo: CommandExecInfo): void {
    const player = execInfo.player;
    const args = execInfo.arguments.map((arg) => arg.toString());

    if (args.length < 2) {
      player.reply({
        message: "[PV] ⚠️ Use: mutar #id tempo [motivo]. Ex: !mutar #11 10s ou !mutar #11 1m10s spam",
        color: Colors.Yellow,
        style: ChatStyle.Bold,
        sound: ChatSounds.Notification,
      });
      return;
    }

    const targetId = Number.parseInt(args[0].replace("#", ""), 10);
    if (Number.isNaN(targetId)) {
      player.reply({ message: "[PV] ⚠️ ID inválido.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }

    const duration = parseDurationArgs(args.slice(1));
    if (!duration.ok) {
      player.reply({ message: duration.message, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }

    const target = this.room.players[targetId];
    if (!target) {
      player.reply({ message: "[PV] ⚠️ Jogador não encontrado.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }

    if (!canMute(player, target)) {
      player.reply({ message: "[PV] ❌ Você não pode mutar este jogador.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }

    const reason = args.slice(1 + duration.consumedArgs).join(" ");
    const expiresAt = Math.floor(Date.now() / 1000) + duration.seconds;
    mutesDb.insert(target.ip ?? "", target.auth ?? "", target.name ?? "", player.name ?? "", expiresAt, reason);
    this.clearMuteState(target);
    target.canUseCommands = false;
    muteState.mutedKeys.add(this.muteKey(target));
    this.scheduleAutoUnmute(target, duration.seconds);

    target.reply({
      message: `[PV] 🔇 Você foi mutado por ${duration.label}${reason ? ` (${reason})` : ""}.`,
      color: Colors.Orange,
      style: ChatStyle.Bold,
      sound: ChatSounds.Notification,
    });
    this.room.send({
      message: `🔇 ${target.name} foi mutado por ${duration.label} por ${player.name}${reason ? ` (${reason})` : ""}.`,
      color: Colors.Orange,
      style: ChatStyle.Bold,
      sound: ChatSounds.Notification,
    });
  }

  @ModuleCommand({
    aliases: ["desmutar", "unmute", "dessilenciar"],
    desc: "Remove o mute de um jogador.",
    usage: "unmute <id>",
    roles: ["👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
  })
  public unmute(execInfo: CommandExecInfo): void {
    const player = execInfo.player;
    if (execInfo.arguments.length < 1) {
      player.reply({ message: "[PV] ⚠️ Use: unmute <id>", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }

    const targetId = Number.parseInt(execInfo.arguments[0].toString().replace("#", ""), 10);
    const target = this.room.players[targetId];
    if (!target) {
      player.reply({ message: "[PV] ⚠️ Jogador não encontrado.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }

    if (!canMute(player, target)) {
      player.reply({ message: "[PV] ❌ Você não pode desmutar este jogador.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }

    mutesDb.remove(target.auth ?? "", target.ip ?? "");
    this.clearMuteState(target);
    target.canUseCommands = true;
    target.reply({ message: `[PV] 🔊 Você foi desmutado por ${player.name}.`, color: Colors.LightGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    this.room.send({
      message: `🔊 ${target.name} foi desmutado por ${player.name}.`,
      color: Colors.LightGreen,
      style: ChatStyle.Bold,
      sound: ChatSounds.Notification,
    });
  }

  @Event
  onPlayerChat(player: Player, message: string): boolean | undefined {
    const block = getPublicChatBlock(this.room, player, message);
    if (!block.blocked) return;

    if (block.reason === "mute") {
      player.canUseCommands = false;
      const key = this.muteKey(player);
      const now = Date.now();
      const lastReminderAt = muteState.lastReminderAt.get(key) ?? 0;
      if (now - lastReminderAt < 2500) return false;
      muteState.lastReminderAt.set(key, now);

      const remaining = Math.max(0, block.mute.expires_at - Math.floor(Date.now() / 1000));
      const reason = block.mute.reason ? ` (${block.mute.reason})` : "";
      player.reply({
        message: `[PV] 🔇 Você está mutado${reason} por mais ${formatDuration(remaining)}.`,
        color: Colors.Red,
        style: ChatStyle.Bold,
        sound: ChatSounds.Notification,
      });
    } else if (block.reason === "chat-off") {
      player.reply({
        message: "[PV] 🔇 O chat público está desativado. Use PV ou chat do time.",
        color: Colors.Red,
        style: ChatStyle.Bold,
        sound: ChatSounds.Notification,
      });
    } else {
      player.reply({
        message: "[PV] 🔇 O chat de espectadores está desativado. Use PV ou chat do time.",
        color: Colors.Red,
        style: ChatStyle.Bold,
        sound: ChatSounds.Notification,
      });
    }

    return false;
  }

  private scheduleAutoUnmute(player: Player, seconds: number): void {
    const key = this.muteKey(player);
    const oldTimer = muteState.timers.get(key);
    if (oldTimer) clearTimeout(oldTimer);

    const timer = setTimeout(() => {
      const livePlayer = this.room.players[player.id] as Player | undefined;
      if (livePlayer) this.notifyAutoUnmute(livePlayer);
      else this.clearMuteState(player);
      mutesDb.cleanExpired();
    }, Math.max(1, seconds) * 1000);
    muteState.timers.set(key, timer);
  }

  private notifyAutoUnmute(player: Player): void {
    if (!muteState.mutedKeys.has(this.muteKey(player))) return;
    this.clearMuteState(player);
    player.canUseCommands = true;
    player.reply({
      message: "[PV] 🔊 Você foi liberado do mute. Se comporte, respira e segue o jogo.",
      color: Colors.LightGreen,
      style: ChatStyle.Bold,
      sound: ChatSounds.Notification,
    });
  }

  private clearMuteState(player: Player): void {
    const key = this.muteKey(player);
    muteState.mutedKeys.delete(key);
    muteState.lastReminderAt.delete(key);
    const timer = muteState.timers.get(key);
    if (timer) clearTimeout(timer);
    muteState.timers.delete(key);
  }

  private muteKey(player: Player): string {
    return player.auth || player.ip || player.id.toString();
  }
}
