import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room, Teams } from "haxball-extended-room";

const teamMap: Record<string, Teams> = {
  red: Teams.Red,
  blue: Teams.Blue,
  spec: Teams.Spectators,
};

export function swapCommand(room: Room): void {
  room.command({
    name: "swap",
    aliases: ["trocar", "inverter"],
    desc: "Inverte jogadores entre dois times (red, blue, spec).",
    usage: "[time1] [time2]",
    roles: ["admin", "👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      const t1 = $.arguments[0]?.toString().toLowerCase();
      const t2 = $.arguments[1]?.toString().toLowerCase();

      let teamA: Teams;
      let teamB: Teams;

      if (!t1 && !t2) {
        teamA = Teams.Red;
        teamB = Teams.Blue;
      } else if (t1 && t2 && teamMap[t1] !== undefined && teamMap[t2] !== undefined && t1 !== t2) {
        teamA = teamMap[t1];
        teamB = teamMap[t2];
      } else {
        $.player.reply({ message: `[PV] ❌ Use: !swap [red|blue|spec] [red|blue|spec]`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
        return;
      }

      for (const p of Array.from(room.players.values())) {
        if (p.team === teamA) p.team = teamB;
        else if (p.team === teamB) p.team = teamA;
      }

      const nameA = ["spectator", "red", "blue"][teamA];
      const nameB = ["spectator", "red", "blue"][teamB];
      room.send({ message: `🔄 Jogadores trocados entre ${nameA} e ${nameB} por ${$.player.name}.`, color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    },
  });
}
