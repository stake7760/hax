import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, Module, ModuleCommand, type Player, type Room, Event } from "haxball-extended-room";
import { getWebhookUrl } from "../../config/env";
import { sendWebhookJson } from "../../utils/discordWebhook";

@Module
export class PauseModule {
  constructor(private room: Room) {}

  @ModuleCommand({
    aliases: ["pausar", "pause"],
    desc: "Pausa a partida.",
    usage: "pausar",
    roles: ["👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
  })
  public pausar(execInfo: CommandExecInfo): void {
    if (!this.room.isGameInProgress()) { execInfo.player.reply({ message: "[PV] ❌ Não há partida em andamento.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
    if (this.room.paused) { execInfo.player.reply({ message: "[PV] ⚠️ A partida já está pausada.", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
    this.room.pause();
    this.room.send({ message: `⏸️ Partida pausada por ${execInfo.player.name}.`, color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    this.notify(`Partida pausada por \`${execInfo.player.name}\``);
  }

  @ModuleCommand({
    aliases: ["despausar", "unpause", "continuar", "resume"],
    desc: "Despausa a partida.",
    usage: "despausar",
    roles: ["👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
  })
  public despausar(execInfo: CommandExecInfo): void {
    if (!this.room.isGameInProgress()) { execInfo.player.reply({ message: "[PV] ❌ Não há partida em andamento.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
    if (!this.room.paused) { execInfo.player.reply({ message: "[PV] ⚠️ A partida não está pausada.", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
    this.room.unpause();
    this.room.send({ message: `▶️ Partida despausada por ${execInfo.player.name}.`, color: Colors.LightGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    this.notify(`Partida despausada por \`${execInfo.player.name}\``);
  }

  private notify(msg: string): void {
    const url = getWebhookUrl("MENSAGEM_WEBHOOK", (this.room.state as any).roomNumber);
    if (!url) return;
    sendWebhookJson(url, { content: `[${this.room.name}] ${msg}` });
  }
}
