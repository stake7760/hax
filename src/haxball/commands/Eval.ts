import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room } from "haxball-extended-room";

export function evalCommand(room: Room): void {
  room.command({
    name: "eval",
    desc: "Executa código JavaScript.",
    usage: "eval <código>",
    roles: ["👮‍♂️ capitão"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      try {
        const code = $.arguments.map((a) => a.toString()).join(" ");
        const result = eval(code);
        $.player.reply({ message: `[PV] ✅ Resultado: ${JSON.stringify(result)}`, color: Colors.LightGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      } catch (err: any) {
        $.player.reply({ message: `[PV] ❌ Erro: ${err.message}`, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      }
    },
  });
}
