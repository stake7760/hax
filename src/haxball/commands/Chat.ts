import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room } from "haxball-extended-room";

export let chatEnabled = true;
export let specEnabled = true;

export function setChatEnabled(v: boolean): void { chatEnabled = v; }
export function setSpecEnabled(v: boolean): void { specEnabled = v; }

export function chatCommand(room: Room): void {
  room.command({
    name: "chatoff",
    desc: "Desativa o chat de jogadores.",
    usage: "chatoff",
    roles: ["👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if (chatEnabled === false) { $.player.reply({ message: "[PV] ⚠️ Chat já está desativado.", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
      chatEnabled = false;
      room.send({ message: `🔇 Chat desativado por ${$.player.name}.`, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    },
  });

  room.command({
    name: "chaton",
    desc: "Ativa o chat de jogadores.",
    usage: "chaton",
    roles: ["👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if (chatEnabled === true) { $.player.reply({ message: "[PV] ⚠️ Chat já está ativado.", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
      chatEnabled = true;
      room.send({ message: `🔊 Chat ativado por ${$.player.name}.`, color: Colors.LightGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    },
  });

  room.command({
    name: "specon",
    desc: "Ativa o chat de espectadores.",
    usage: "specon",
    roles: ["👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if (specEnabled === true) { $.player.reply({ message: "[PV] ⚠️ Chat de spec já está ativado.", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
      specEnabled = true;
      room.send({ message: `🔊 Chat de espectadores ativado por ${$.player.name}.`, color: Colors.LightGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    },
  });

  room.command({
    name: "specoff",
    desc: "Desativa o chat de espectadores.",
    usage: "specoff",
    roles: ["👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if (specEnabled === false) { $.player.reply({ message: "[PV] ⚠️ Chat de spec já está desativado.", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
      specEnabled = false;
      room.send({ message: `🔇 Chat de espectadores desativado por ${$.player.name}.`, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    },
  });
}
