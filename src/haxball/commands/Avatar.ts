import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room } from "haxball-extended-room";

export function avatarCommand(room: Room): void {
  room.command({
    name: "avatar",
    aliases: ["av", "avatarjogador"],
    desc: "Altera o avatar de um jogador.",
    usage: "avatar <id> <avatar>",
    roles: ["👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if ($.arguments.length < 2) {
        $.player.reply({ message: "[PV] ⚠️ Use: avatar <id> <avatar>", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      const targetId = Number.parseInt($.arguments[0].toString().replace("#", ""), 10);
      if (isNaN(targetId)) { $.player.reply({ message: "[PV] ⚠️ ID inválido.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
      const target = room.players[targetId];
      if (!target) { $.player.reply({ message: "[PV] ⚠️ Jogador não encontrado.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
      const avatar = $.arguments.slice(1).map((a) => a.toString()).join(" ");
      if (avatar.toLowerCase() === "clear") {
        target.clearAvatar();
        $.player.reply({ message: `[PV] ✅ Avatar de [${target.id}] ${target.name} foi limpo.`, color: Colors.LightGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      } else {
        target.setAvatar(avatar);
        $.player.reply({ message: `[PV] ✅ Avatar de [${target.id}] ${target.name} definido como ${avatar}.`, color: Colors.LightGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      }
    },
  });
}
