import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room } from "haxball-extended-room";
import { getWebhookUrl } from "../../config/env";
import { sendWebhookJson } from "../../utils/discordWebhook";

export function passwordCommand(room: Room): void {
  room.command({
    name: "fechar",
    aliases: ["setapassword", "trancar", "lock", "close", "set", "password", "senha"],
    desc: "Define a senha para trancar a sala.",
    usage: "fechar <senha>",
    roles: ["👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      const senha = $.arguments.map((arg) => arg.toString()).join(" ") || process.env.SENHA_PADRAO || "vincere7";
      const senhaUsada = senha === process.env.SENHA_PADRAO ? "a senha padrão" : "a senha fornecida";

      room.setPassword(senha);
      room.send({ message: `🔒 A sala foi trancada com ${senhaUsada} por ${$.player.name}.`, color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      $.player.reply({ message: `[PV] 🔒 A sala foi trancada com ${senhaUsada}: ${senha}.`, color: Colors.Lightcoral, style: ChatStyle.Small, sound: ChatSounds.Notification });

      const url = getWebhookUrl("SENHA_WEBHOOK", (room.state as any).roomNumber);
      if (url) sendWebhookJson(url, { content: `[${room.name}] Sala fechada por \`${$.player.name}\`. Senha: **${senha}**` });
    },
  });

  room.command({
    name: "abrir",
    aliases: ["desbloquear", "unlock", "open"],
    desc: "Abre a sala (remove senha).",
    usage: "abrir",
    roles: ["👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if ($.arguments.length > 0) {
        const correctCommand = $.message.split(" ")[0];
        $.player.reply({ message: `[PV] ❌ Utilize apenas ${correctCommand}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
        return;
      }

      room.clearPassword();
      room.send({ message: `🔓 A senha da sala foi removida por ${$.player.name}.`, color: Colors.LightSeaGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      const url = getWebhookUrl("SENHA_WEBHOOK", (room.state as any).roomNumber);
      if (url) sendWebhookJson(url, { content: `[${room.name}] Sala aberta por \`${$.player.name}\`.` });
    },
  });
}
