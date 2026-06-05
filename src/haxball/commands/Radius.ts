import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room } from "haxball-extended-room";

export function radiusCommand(room: Room): void {
  room.command({
    name: "radius",
    aliases: ["raio", "tamanho", "size"],
    desc: "Altera o tamanho do jogador.",
    usage: "radius <id> <tamanho>",
    roles: ["👮‍♂️ capitão", "💂 sub-capitão"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if ($.arguments.length < 2) {
        $.player.reply({ message: "[PV] ⚠️ Use: radius <id> <tamanho>", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      const targetId = Number.parseInt($.arguments[0].toString().replace("#", ""), 10);
      const size = parseFloat($.arguments[1].toString());
      if (isNaN(targetId) || isNaN(size) || size < 5 || size > 50) {
        $.player.reply({ message: "[PV] ⚠️ Valores inválidos (5-50).", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      const target = room.players[targetId];
      if (!target) { $.player.reply({ message: "[PV] ⚠️ Jogador não encontrado.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
      target.radius = size;
      room.send({ message: `📏 Raio de ${target.name} alterado para ${size} por ${$.player.name}.`, color: Colors.Cyan, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    },
  });
}
