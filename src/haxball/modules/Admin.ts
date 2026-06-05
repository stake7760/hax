import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, Module, ModuleCommand, type Player, type Room, Event } from "haxball-extended-room";

@Module
export class AdminModule {
  constructor(private room: Room) {}

  private hasAdmin(): boolean {
    return Array.from(this.room.players.values()).some((p) => p.admin);
  }

  @ModuleCommand({
    aliases: ["administrador", "admin"],
    desc: "Vira o administrador da sala se não tiver nenhum.",
    usage: "adm",
    roles: [],
    deleteMessage: true,
  })
  public adm(execInfo: CommandExecInfo): void {
    const player = execInfo.player;
    if (execInfo.arguments.length > 0) {
      player.reply({ message: `[PV] ❌ Utilize apenas ${execInfo.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }
    if (player.admin) {
      player.reply({ message: "[PV] ⚠️ Você já é administrador.", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }
    if (!this.hasAdmin() || ["👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"].includes(player.settings.role)) {
      player.admin = true;
      player.reply({ message: "[PV] ✅ Você virou administrador.", color: Colors.LightGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }
    player.reply({ message: "[PV] ⚠️ Já existe um administrador.", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification });
  }

  @Event
  onPlayerJoin(): void {
    setTimeout(() => {
      if (this.room.players.size > 0 && !this.hasAdmin()) {
        this.room.send({
          message: "⚠️ Não há nenhum administrador presente. Use !adm para virar administrador.",
          color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Normal,
        });
      }
    }, 1000);
  }

  @Event
  onPlayerLeave(): void {
    setTimeout(() => {
      if (this.room.players.size > 0 && !this.hasAdmin()) {
        this.room.send({
          message: "⚠️ Não há nenhum administrador presente. Use !adm para virar administrador.",
          color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Normal,
        });
      }
    }, 200);
  }

  @Event
  onPlayerAdminChange(changedPlayer: Player, byPlayer?: Player): void {
    if (!byPlayer || changedPlayer.id === byPlayer.id) return;
    const hierarchy: Record<string, number> = { "👨‍💼 administrador": 1, "👮‍♂️ capitão": 4, "💂 sub-capitão": 3, "⚽ jogador": 2 };
    const actorRole = byPlayer.settings.role || "admin";
    const targetRole = changedPlayer.settings.role || "admin";
    if ((hierarchy[actorRole] || 0) <= (hierarchy[targetRole] || 0) && actorRole !== "admin") {
      changedPlayer.admin = !changedPlayer.admin;
      byPlayer.admin = false;
    }
  }
}
