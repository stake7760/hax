import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room, Teams } from "haxball-extended-room";
import { getBotName, getBotURL } from "../../discord/EmbedFactory";
import { getWebhookUrl } from "../../config/env";
import { sanitizeDiscordContent, sendWebhookJson } from "../../utils/discordWebhook";

export function toggleCampMode(room: Room, actorName: string): boolean {
  room.state.campMode = !room.state.campMode;
  if (room.state.campMode) {
    room.send({ message: `✅ Modo campeonato ativado por ${actorName}. Use !firmo para confirmar.`, color: Colors.LightGreen, style: ChatStyle.SmallItalic, sound: ChatSounds.Notification });
    for (const p of Array.from(room.players.values())) { p.team = Teams.Spectators; room.state[p.id] = { confirmed: false }; }
    room.lockTeams();
  } else {
    room.send({ message: `✅ Modo campeonato desativado por ${actorName}.`, color: Colors.IndianRed, style: ChatStyle.SmallItalic, sound: ChatSounds.Notification });
    for (const p of Array.from(room.players.values())) { if (room.state[p.id]) room.state[p.id].confirmed = false; }
  }
  return room.state.campMode;
}

export function campCommands(room: Room): void {
  room.command({
    name: "camp",
    aliases: ["campeonato", "ofi"],
    desc: "Ativa/desativa modo campeonato.",
    usage: "camp",
    roles: ["👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if ($.arguments.length > 0) {
        $.player.reply({ message: `[PV] ❌ Use apenas ${$.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
        return;
      }
      toggleCampMode(room, $.player.name);
    },
  });

  room.command({
    name: "firmo",
    aliases: ["confirmar", "confirmo"],
    desc: "Confirma participação no campeonato.",
    usage: "firmo",
    roles: [],
    deleteMessage: true,
    func: async ($: CommandExecInfo) => {
      if ($.arguments.length > 0) {
        $.player.reply({ message: `[PV] ❌ Use apenas ${$.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
        return;
      }
      if (!room.state.campMode) {
        $.player.reply({ message: "[PV] ❌ Modo campeonato não está ativo.", color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      if (room.state[$.player.id]?.confirmed) {
        $.player.reply({ message: "[PV] ❌ Você já confirmou.", color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      room.state[$.player.id] = room.state[$.player.id] || {};
      room.state[$.player.id].confirmed = true;
      room.send({ message: `✅ ${$.player.name} confirmou.`, color: Colors.LightGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      const url = getWebhookUrl("CONFIRMACAO_WEBHOOK", (room.state as any).roomNumber);
      if (url) {
        const teamEmoji = $.player.team === 1 ? "🔴" : $.player.team === 2 ? "🔵" : "🟢";
        sendWebhookJson(url, {
          embeds: [{
            title: room.name,
            description: `${teamEmoji} \`[${$.player.id}]\` **${sanitizeDiscordContent($.player.name)}** confirmou na sala com sucesso.`,
            color: 0x79E879,
            fields: [
              { name: "<:Nick:1508652143605846096> `Nick`", value: `\`\`\`fix\n${$.player.name}\`\`\``, inline: true },
              { name: "<:Auth:1508652011770478673> Auth", value: `\`\`\`fix\n${$.player.auth ?? ""}\`\`\``, inline: true },
              { name: "<:IP:1508652093848817794> IP", value: `\`\`\`fix\n${$.player.ip ?? ""}\`\`\``, inline: true },
              { name: "<:CONN:1508652073820885124> CONN", value: `\`\`\`fix\n${$.player.conn ?? ""}\`\`\``, inline: true },
            ],
            footer: { text: `${new Date().getFullYear()} © ${getBotName()} - Todos os direitos reservados`, icon_url: getBotURL() },
          }],
        });
      }
    },
  });

  room.onPlayerTeamChange = (changedPlayer, byPlayer) => {
    if (room.state.campMode && byPlayer && (!room.state[changedPlayer.id] || !room.state[changedPlayer.id].confirmed)) {
      changedPlayer.team = Teams.Spectators;
      room.send({ message: `❌ ${changedPlayer.name} precisa usar !firmo primeiro.`, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    }
  };
}
