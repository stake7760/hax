import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, Event, Module, ModuleCommand, type Player, type Room } from "haxball-extended-room";
import { getWebhookUrl } from "../../config/env";
import { sanitizeDiscordContent, sendWebhookJson } from "../../utils/discordWebhook";

@Module
export class TeamChatModule {
  constructor(private room: Room) {}

  @ModuleCommand({
    aliases: ["teamchat", "tc"],
    desc: "Envia mensagem para o chat do time.",
    usage: "t <mensagem>",
    roles: [],
    deleteMessage: true,
  })
  public t(execInfo: CommandExecInfo): void {
    const player = execInfo.player;
    const msg = execInfo.arguments.join(" ");
    if (!msg) { player.reply({ message: "[PV] ⚠️ Digite uma mensagem.", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
    this.sendToTeam(player, msg);
  }

  @Event
  onPlayerChat(player: Player, message: string): boolean | undefined {
    const prefixes = ["t ", "tc ", "teamchat "];
    const prefix = prefixes.find((p) => message.toLowerCase().startsWith(p));
    if (!prefix) return;
    const msg = message.slice(prefix.length).trim();
    if (!msg) return false;
    const teamColor = player.team === 1 ? Colors.PaleVioletRed : player.team === 2 ? Colors.RoyalBlue : Colors.LawnGreen;
    const teamIcon = player.team === 1 ? "🔴" : player.team === 2 ? "🔵" : "🟢";
    for (const tp of Array.from(this.room.players.getAll((p) => p.team === player.team))) {
      tp.reply({ message: `[${teamIcon}] ${player.name}: ${msg}`, color: teamColor, style: ChatStyle.Bold, sound: ChatSounds.Normal });
    }
    this.logTeamChat(player, msg);
    return false;
  }

  private sendToTeam(player: Player, msg: string): void {
    const teamColor = player.team === 1 ? Colors.PaleVioletRed : player.team === 2 ? Colors.RoyalBlue : Colors.LawnGreen;
    const teamIcon = player.team === 1 ? "🔴" : player.team === 2 ? "🔵" : "🟢";
    for (const tp of Array.from(this.room.players.getAll((p) => p.team === player.team))) {
      tp.reply({ message: `[${teamIcon}] ${player.name}: ${msg}`, color: teamColor, style: ChatStyle.Bold, sound: ChatSounds.Normal });
    }
    this.logTeamChat(player, msg);
  }

  private logTeamChat(player: Player, msg: string): void {
    const url = getWebhookUrl("MENSAGEM_WEBHOOK", (this.room.state as any).roomNumber);
    if (!url) return;
    const icon = player.team === 1 ? "🔴" : player.team === 2 ? "🔵" : "🟢";
    const safeMsg = sanitizeDiscordContent(msg);
    sendWebhookJson(url, { content: `[${this.room.name}] [${icon} TEAM CHAT] \`[${player.id}]\` **${sanitizeDiscordContent(player.name)}**: \`${safeMsg}\`` });
  }
}
