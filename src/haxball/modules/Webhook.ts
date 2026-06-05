import { Event, Module, type Player, type Room } from "haxball-extended-room";
import type { Command, CommandExecInfo } from "haxball-extended-room";
import { getWebhookUrl } from "../../config/env";
import { getPublicChatBlock, isSpecialChatMessage } from "../chat/ChatGuards";
import { sanitizeDiscordContent, sendWebhookJson } from "../../utils/discordWebhook";

@Module
export class WebhookModule {
  constructor(private room: Room) {}

  private teamEmoji(p: Player): string {
    return p.team === 1 ? "🔴" : p.team === 2 ? "🔵" : "🟢";
  }

  private sendSystem(content: string): void {
    const url = getWebhookUrl("MENSAGEM_WEBHOOK", (this.room.state as any).roomNumber);
    if (!url) return;
    sendWebhookJson(url, { content: `[${this.room.name}] [:warning: **SISTEMA**]: ${content}` });
  }

  @Event
  onGameStart(byPlayer?: Player): void {
    this.sendSystem(`:arrow_forward: **INÍCIO** — Partida iniciada ${byPlayer ? `por \`${byPlayer.name}\`` : "pelo sistema"}`);
  }

  @Event
  onGameStop(byPlayer?: Player): void {
    this.sendSystem(`:stop_button: **FIM** — Partida finalizada ${byPlayer ? `por \`${byPlayer.name}\`` : "pelo sistema"}`);
  }

  @Event
  onStadiumChange(newStadium: string, byPlayer?: Player): void {
    this.sendSystem(`:stadium: **MAPA** — ${newStadium} ${byPlayer ? `por \`${byPlayer.name}\`` : "pelo sistema"}`);
  }

  @Event
  onPlayerRunCommand(player: Player, _command: Command, info: CommandExecInfo): void {
    this.sendSystem(`:speech_balloon: **COMANDO** — ${this.teamEmoji(player)} [${player.id}] **${sanitizeDiscordContent(player.name)}** usou \`${this.maskCommand(info.message)}\``);
  }

  @Event
  onPlayerChat(player: Player, message: string): void {
    const prefix = this.room.prefix || "!";
    if (message.startsWith(prefix)) return;
    if (isSpecialChatMessage(message)) return;
    if (getPublicChatBlock(this.room, player, message).blocked) return;
    this.sendMsg(`${this.teamEmoji(player)} [${player.id}] **${sanitizeDiscordContent(player.name)}**: \`${sanitizeDiscordContent(message)}\``);
  }

  @Event
  onPlayerJoin(player: Player): void {
    this.sendSystem(`:inbox_tray: **ENTRADA** — \`[${player.id}]\` **${sanitizeDiscordContent(player.name)}** entrou na sala.`);
  }

  @Event
  onPlayerLeave(player: Player): void {
    this.sendSystem(`:outbox_tray: **SAÍDA** — \`[${player.id}]\` **${sanitizeDiscordContent(player.name)}** saiu da sala.`);
  }

  @Event
  onPlayerTeamChange(changedPlayer: Player, byPlayer?: Player): void {
    const teamNames: Record<number, string> = { 0: "🟢 Spectators", 1: "🔴 Red", 2: "🔵 Blue" };
    const team = teamNames[changedPlayer.team] || `Time ${changedPlayer.team}`;
    const by = byPlayer ? ` por \`[${byPlayer.id}]\` **${sanitizeDiscordContent(byPlayer.name)}**` : "";
    this.sendSystem(`:arrows_counterclockwise: **TIME** — \`[${changedPlayer.id}]\` **${sanitizeDiscordContent(changedPlayer.name)}** movido para ${team}${by}`);
  }

  @Event
  onPlayerAdminChange(changedPlayer: Player, byPlayer?: Player): void {
    if (changedPlayer.settings?.role) return;
    const status = changedPlayer.admin ? "recebeu admin" : "perdeu admin";
    const by = byPlayer ? ` por \`[${byPlayer.id}]\` **${sanitizeDiscordContent(byPlayer.name)}**` : "";
    this.sendSystem(`:crown: **ADMIN** — \`[${changedPlayer.id}]\` **${sanitizeDiscordContent(changedPlayer.name)}** ${status}${by}`);
  }

  @Event
  onGamePause(byPlayer?: Player): void {
    this.sendSystem(`:pause_button: **PAUSA** — Partida pausada${byPlayer ? ` por \`[${byPlayer.id}]\` **${sanitizeDiscordContent(byPlayer.name)}**` : ""}`);
  }

  @Event
  onGameUnpause(byPlayer?: Player): void {
    this.sendSystem(`:arrow_forward: **DESPAUSAR** — Partida despausada${byPlayer ? ` por \`[${byPlayer.id}]\` **${sanitizeDiscordContent(byPlayer.name)}**` : ""}`);
  }

  @Event
  onPlayerKicked(_kickedPlayer: Player, _reason?: string, _byPlayer?: Player): void {}

  @Event
  onPlayerBanned(_bannedPlayer: Player, _reason?: string, _byPlayer?: Player): void {}

  private sendMsg(content: string): void {
    const url = getWebhookUrl("MENSAGEM_WEBHOOK", (this.room.state as any).roomNumber);
    if (!url) return;
    sendWebhookJson(url, { content: `[${this.room.name}] ${content}` });
  }

  private maskCommand(message: string): string {
    const [command] = message.trim().split(/\s+/);
    if (command?.toLowerCase() === `${this.room.prefix || "!"}cargo`) return `${command} [senha ocultada]`;
    const sensitiveCommands = ["fechar", "senha", "setapassword", "trancar", "lock", "close", "set", "password"];
    const commandName = command?.replace(this.room.prefix || "!", "").toLowerCase();
    if (commandName && sensitiveCommands.includes(commandName)) return `${command} [credencial ocultada]`;
    return message;
  }
}
