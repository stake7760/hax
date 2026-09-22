import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room, Teams } from "haxball-extended-room";
import { bansDb } from "../../database/Database";

const protectedRoles = ["👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador", "👨‍💼 administrador"];

function getTeamPlayers(room: Room, team: Teams): number[] {
  return Array.from(room.players.values()).filter((p) => p.team === team).map((p) => p.id);
}

function banPlayers(room: Room, ids: number[], reason: string): number {
  let count = 0;
  for (const id of ids) {
    const p = room.players[id];
    if (p && !protectedRoles.includes(p.settings.role)) {
      p.ban(reason);
      bansDb.insert(p.ip ?? "", p.auth ?? "", p.name ?? "", "sistema", reason);
      count++;
    }
  }
  return count;
}

function banCmdFactory(getIds: (room: Room) => number[], teamName: string, teamEmoji: string) {
  return ($: CommandExecInfo, room: Room) => {
    if ($.arguments.length > 0) {
      $.player.reply({ message: `[PV] ❌ Use apenas ${$.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
      return;
    }
    const count = banPlayers(room, getIds(room), `🧰 ${$.message.split(" ")[0]}`);
    if (count > 0) {
      room.send({ message: `🚨 ${count} jogador(es) do ${teamEmoji} banido(s) por ${$.player.name}.`, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    } else {
      $.player.reply({ message: "[PV] ❌ Nenhum jogador para banir.", color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    }
  };
}

export function banCommands(room: Room): void {
  room.command({
    name: "banall", aliases: ["banirall"], desc: "Bane todos.", usage: "banall", roles: ["👮‍♂️ capitão", "💂 sub-capitão"], deleteMessage: true,
    func: ($) => banCmdFactory((r) => Object.keys(r.players).map(Number), "all", "🧰")($, room),
  });
  room.command({
    name: "banred", aliases: ["banirred"], desc: "Bane time vermelho.", usage: "banred", roles: ["👮‍♂️ capitão", "💂 sub-capitão"], deleteMessage: true,
    func: ($) => banCmdFactory((r) => getTeamPlayers(r, Teams.Red), "red", "🔴")($, room),
  });
  room.command({
    name: "banblue", aliases: ["banirblue"], desc: "Bane time azul.", usage: "banblue", roles: ["👮‍♂️ capitão", "💂 sub-capitão"], deleteMessage: true,
    func: ($) => banCmdFactory((r) => getTeamPlayers(r, Teams.Blue), "blue", "🔵")($, room),
  });
  room.command({
    name: "banspec", aliases: ["banirspec"], desc: "Bane espectadores.", usage: "banspec", roles: ["👮‍♂️ capitão", "💂 sub-capitão"], deleteMessage: true,
    func: ($) => banCmdFactory((r) => getTeamPlayers(r, Teams.Spectators), "spec", "🟢")($, room),
  });
  room.command({
    name: "clearbans", aliases: ["cbans", "limparbans", "clear", "cb"], desc: "Limpa todos os bans.", usage: "clearbans", roles: ["admin", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador", "👨‍💼 administrador"], deleteMessage: true,
    func: ($) => { room.unbanAll(); bansDb.clear(); room.send({ message: `✅ Bans limpos por ${$.player.name}.`, color: Colors.Green, style: ChatStyle.Bold, sound: ChatSounds.Notification }); },
  });
}
