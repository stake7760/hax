import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room } from "haxball-extended-room";

export function resetCommand(room: Room): void {
  room.command({
    name: "rr",
    aliases: ["reiniciar", "restart", "reset"],
    desc: "Reinicia a partida.",
    usage: "rr",
    roles: ["admin", "👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if ($.arguments.length > 0) {
        $.player.reply({ message: `[PV] ❌ Use apenas ${$.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
        return;
      }
      room.stop();
      room.start();
      room.send({ message: `🔄 Partida reiniciada por ${$.player.name}.`, color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    },
  });
}
