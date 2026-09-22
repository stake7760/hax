import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room, Teams } from "haxball-extended-room";

const protectedRoles = ["👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador", "👨‍💼 administrador"];

function kickPlayers(room: Room, ids: number[], reason: string): number {
  let count = 0;
  for (const id of ids) {
    const p = room.players[id];
    if (p && !protectedRoles.includes(p.settings.role)) { p.kick(reason); count++; }
  }
  return count;
}

function kickFactory(getIds: (room: Room) => number[], emoji: string) {
  return ($: CommandExecInfo, room: Room) => {
    if ($.arguments.length > 0) {
      $.player.reply({ message: `[PV] ❌ Use apenas ${$.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
      return;
    }
    const count = kickPlayers(room, getIds(room), `👢 ${$.message.split(" ")[0]}`);
    if (count > 0) room.send({ message: `👢 ${count} jogador(es) do ${emoji} kickados por ${$.player.name}.`, color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    else $.player.reply({ message: "[PV] ❌ Nenhum jogador.", color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
  };
}

export function kickCommands(room: Room): void {
  room.command({ name: "kickall", aliases: ["kickarall"], desc: "Kicka todos.", usage: "kickall", roles: ["👮‍♂️ capitão", "💂 sub-capitão"], deleteMessage: true, func: ($) => kickFactory((r) => Object.keys(r.players).map(Number), "🧰")($, room) });
  room.command({ name: "kickred", aliases: ["kickarred"], desc: "Kicka time red.", usage: "kickred", roles: ["👮‍♂️ capitão", "💂 sub-capitão"], deleteMessage: true, func: ($) => kickFactory((r) => Array.from(r.players.values()).filter((p) => p.team === Teams.Red).map((p) => p.id), "🔴")($, room) });
  room.command({ name: "kickblue", aliases: ["kickarblue"], desc: "Kicka time blue.", usage: "kickblue", roles: ["👮‍♂️ capitão", "💂 sub-capitão"], deleteMessage: true, func: ($) => kickFactory((r) => Array.from(r.players.values()).filter((p) => p.team === Teams.Blue).map((p) => p.id), "🔵")($, room) });
  room.command({ name: "kickspec", aliases: ["kickarspec"], desc: "Kicka specs.", usage: "kickspec", roles: ["👮‍♂️ capitão", "💂 sub-capitão"], deleteMessage: true, func: ($) => kickFactory((r) => Array.from(r.players.values()).filter((p) => p.team === Teams.Spectators).map((p) => p.id), "🟢")($, room) });
}
