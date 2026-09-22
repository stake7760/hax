import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room } from "haxball-extended-room";
import { mutesDb } from "../../database/Database";

const muteHierarchy: Record<string, number> = {
  "👨‍💼 administrador": 0,
  "⚽ jogador": 1,
  "💂 sub-capitão": 2,
  "👮‍♂️ capitão": 3,
};

function canMute(actor: CommandExecInfo["player"], target: CommandExecInfo["player"]): boolean {
  const actorRole = actor.settings.role;
  const targetRole = target.settings.role;
  if (!targetRole) return true;
  if (!actorRole) return false;
  return (muteHierarchy[actorRole] ?? -1) > (muteHierarchy[targetRole] ?? -1);
}

export function muteCommand(room: Room): void {
  room.command({
    name: "mute",
    aliases: ["mutar", "silenciar"],
    desc: "Muta um jogador por tempo determinado.",
    usage: "mutar #id tempo [motivo]",
    roles: ["👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if ($.arguments.length < 2) {
        $.player.reply({ message: "[PV] ⚠️ Use: mutar #id tempo [motivo]. Ex: !mutar #11 10s", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      const targetId = Number.parseInt($.arguments[0].toString().replace("#", ""), 10);
      const minutes = Number.parseInt($.arguments[1].toString());
      if (isNaN(targetId) || isNaN(minutes) || minutes <= 0) {
        $.player.reply({ message: "[PV] ⚠️ ID ou tempo inválido.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      const reason = $.arguments.slice(2).map((a) => a.toString()).join(" ");
      const target = room.players[targetId];
      if (!target) {
        $.player.reply({ message: "[PV] ⚠️ Jogador não encontrado.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      if (!canMute($.player, target)) {
        $.player.reply({ message: "[PV] ❌ Você não pode mutar este jogador.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      const expiresAt = Math.floor(Date.now() / 1000) + minutes * 60;
      mutesDb.insert(target.ip ?? "", target.auth ?? "", target.name ?? "", $.player.name ?? "", expiresAt, reason);
      room.send({
        message: `🔇 ${target.name} mutado por ${minutes}min por ${$.player.name}${reason ? ` (${reason})` : ""}.`,
        color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification,
      });
    },
  });

  room.command({
    name: "unmute",
    aliases: ["desmutar"],
    desc: "Remove mute de um jogador.",
    usage: "unmute <id>",
    roles: ["👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if ($.arguments.length < 1) {
        $.player.reply({ message: "[PV] ⚠️ Use: unmute <id>", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      const targetId = Number.parseInt($.arguments[0].toString().replace("#", ""), 10);
      const target = room.players[targetId];
      if (!target) {
        $.player.reply({ message: "[PV] ⚠️ Jogador não encontrado.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      if (!canMute($.player, target)) {
        $.player.reply({ message: "[PV] ❌ Você não pode desmutar este jogador.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      mutesDb.remove(target.auth ?? "", target.ip ?? "");
      room.send({ message: `🔊 ${target.name} desmutado por ${$.player.name}.`, color: Colors.LightGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    },
  });
}
