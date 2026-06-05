import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Disc, type Room, Teams } from "haxball-extended-room";

export function ballCommands(room: Room): void {
  room.command({
    name: "pararbola",
    aliases: ["stopball"],
    desc: "Para a bola, zerando sua velocidade.",
    usage: "pararbola",
    roles: ["👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if ($.arguments.length > 0) {
        $.player.reply({ message: `[PV] ❌ Utilize apenas ${$.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
        return;
      }

      if (!room.isGameInProgress()) {
        $.player.reply({ message: "[PV] ⛔ Não é possível parar a bola enquanto o jogo não está em andamento.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      const ball: Disc | undefined = room.ball;
      if (!ball) {
        $.player.reply({ message: "[PV] ⚠️ A bola não está no jogo!", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      ball.xspeed = 0;
      ball.yspeed = 0;
    },
  });

  room.command({
    name: "puxarbola",
    aliases: ["bringball", "pullball", "puxar"],
    desc: "Puxa a bola até o jogador que usou o comando.",
    usage: "puxarbola",
    roles: ["👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if ($.arguments.length > 0) {
        $.player.reply({ message: `[PV] ❌ Utilize apenas ${$.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
        return;
      }

      if (!room.isGameInProgress()) {
        $.player.reply({ message: "[PV] ⛔ Não é possível puxar a bola enquanto o jogo não está em andamento.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      const player = $.player;
      const ball: Disc | undefined = room.ball;

      if (player.team === Teams.Spectators) {
        $.player.reply({ message: "[PV] ⛔ Não é possível puxar a bola enquanto você é espectador.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      if (!ball) {
        $.player.reply({ message: "[PV] ⚠️ A bola não está no jogo!", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      if (player.x === null || player.y === null) {
        $.player.reply({ message: "[PV] ⚠️ Não foi possível encontrar sua posição.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      ball.xspeed = 0;
      ball.yspeed = 0;
      ball.x = player.x;
      ball.y = player.y;
    },
  });

  room.command({
    name: "tp",
    aliases: ["teleportar", "tpbola"],
    desc: "Teleporta o jogador até a posição da bola.",
    usage: "tp",
    roles: ["👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if ($.arguments.length > 0) {
        $.player.reply({ message: `[PV] ❌ Utilize apenas ${$.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
        return;
      }

      if (!room.isGameInProgress()) {
        $.player.reply({ message: "[PV] ⛔ Não é possível teleportar enquanto o jogo não está em andamento.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      const player = $.player;
      const ball: Disc | undefined = room.ball;

      if (player.team === Teams.Spectators) {
        $.player.reply({ message: "[PV] ⛔ Não é possível teleportar até a bola enquanto você é espectador.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      if (!ball) {
        $.player.reply({ message: "[PV] ⚠️ A bola não está no jogo!", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      if (ball.x !== null && ball.y !== null) {
        ball.xspeed = 0;
        ball.yspeed = 0;
        player.x = ball.x;
        player.y = ball.y;
      }
    },
  });
}
