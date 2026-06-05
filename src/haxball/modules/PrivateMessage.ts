import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, Event, Module, ModuleCommand, type Player, type Room } from "haxball-extended-room";
import { getWebhookUrl } from "../../config/env";
import { sanitizeDiscordContent, sendWebhookJson } from "../../utils/discordWebhook";

@Module
export class PrivateMessageModule {
  constructor(private room: Room) {}

  @ModuleCommand({
    aliases: ["pm", "mp", "mensagemprivada"],
    desc: "Envia mensagem privada para outro jogador.",
    usage: "pv <id> <mensagem>",
    roles: [],
    deleteMessage: true,
  })
  public pv(execInfo: CommandExecInfo): void {
    const player = execInfo.player;
    if (execInfo.arguments.length < 2) {
      player.reply({ message: "[PV] ⚠️ Use: pv <id> <mensagem>", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }
    const targetId = Number.parseInt(execInfo.arguments[0].toString().replace("#", ""), 10);
    if (isNaN(targetId)) { player.reply({ message: "[PV] ⚠️ ID inválido.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
    const target = this.room.players[targetId];
    if (!target) { player.reply({ message: "[PV] ⚠️ Jogador não encontrado.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
    if (target.id === player.id) { player.reply({ message: "[PV] ⚠️ Não pode enviar PV para si mesmo.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
    const msg = execInfo.arguments.slice(1).map((a) => a.toString()).join(" ");
    target.reply({ message: `📩 [PM < ${player.name}]: ${msg}`, color: Colors.LightPink, style: ChatStyle.Bold, sound: ChatSounds.Normal });
    player.reply({ message: `📩 [PV > ${target.name}]: ${msg}`, color: Colors.LightPink, style: ChatStyle.Bold, sound: ChatSounds.Normal });
    this.logPm(player, target, msg);
  }

  @Event
  onPlayerChat(player: Player, message: string): boolean | undefined {
    if (!message.startsWith("@@")) return;
    const parts = message.slice(2).trim().split(" ");
    const nick = parts[0];
    const msg = parts.slice(1).join(" ");
    if (!nick || !msg) return false;
    const target = this.room.players.getByName(nick).first() || this.room.players.getByName(nick.replace(/_/g, " ")).first();
    if (!target) { player.reply({ message: `[PV] ⚠️ Jogador ${nick} não encontrado.`, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return false; }
    if (target.id === player.id) { player.reply({ message: "[PV] ⚠️ Não pode enviar PV para si mesmo.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return false; }
    target.reply({ message: `📩 [PM < ${player.name}]: ${msg}`, color: Colors.LightPink, style: ChatStyle.Bold, sound: ChatSounds.Normal });
    player.reply({ message: `📩 [PV > ${target.name}]: ${msg}`, color: Colors.LightPink, style: ChatStyle.Bold, sound: ChatSounds.Normal });
    this.logPm(player, target, msg);
    return false;
  }

  private logPm(sender: Player, receiver: Player, message: string): void {
    const url = getWebhookUrl("MENSAGEM_WEBHOOK", (this.room.state as any).roomNumber);
    if (!url) return;
    sendWebhookJson(url, { content: `[${this.room.name}] [PM] \`[${sender.id}]\` **${sanitizeDiscordContent(sender.name)}** -> \`[${receiver.id}]\` **${sanitizeDiscordContent(receiver.name)}**: \`${sanitizeDiscordContent(message)}\`` });
  }
}
