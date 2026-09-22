import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room } from "haxball-extended-room";
import { specEnabled, setSpecEnabled } from "./Chat";

export function specCommand(room: Room): void {
  room.command({
    name: "specon",
    desc: "Ativa chat de espectadores.",
    usage: "specon",
    roles: ["👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if (specEnabled) { $.player.reply({ message: "[PV] ⚠️ Já está ativado.", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
      setSpecEnabled(true);
      room.send({ message: `🔊 Chat de espectadores ativado por ${$.player.name}.`, color: Colors.LightGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    },
  });

  room.command({
    name: "specoff",
    desc: "Desativa chat de espectadores.",
    usage: "specoff",
    roles: ["👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if (!specEnabled) { $.player.reply({ message: "[PV] ⚠️ Já está desativado.", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
      setSpecEnabled(false);
      room.send({ message: `🔇 Chat de espectadores desativado por ${$.player.name}.`, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    },
  });
}
