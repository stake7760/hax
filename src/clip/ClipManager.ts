import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room } from "haxball-extended-room";
import { clipQueue } from "./Queue";

const DEFAULT_GIF_DURATION_SECONDS = 5;
const MAX_GIF_DURATION_SECONDS = 10;

export function clipCommand(room: Room): void {
  let gifsThisGame = 0;
  const previousOnGameStart = (room as any).onGameStart;
  (room as any).onGameStart = (...args: unknown[]) => {
    gifsThisGame = 0;
    if (typeof previousOnGameStart === "function") previousOnGameStart(...args);
  };

  room.command({
    name: "gif",
    aliases: ["clip", "gravar", "replay"],
    desc: "Gera um GIF dos últimos N segundos.",
    usage: "gif [duração] [comentário]",
    roles: ["👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: async ($: CommandExecInfo) => {
      const args = $.arguments.map((a) => a.toString());
      const firstArg = args[0]?.toLowerCase();
      const rawDuration = firstArg?.endsWith("s") ? firstArg.slice(0, -1) : firstArg;
      const hasDurationArg = rawDuration ? /^\d+$/.test(rawDuration) : false;
      const requestedDuration = hasDurationArg ? Number.parseInt(rawDuration, 10) : DEFAULT_GIF_DURATION_SECONDS;

      if (!room.isGameInProgress() || !room.scores) {
        $.player.reply({ message: "[PV] ❌ Não há partida em andamento para gerar GIF.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      const gameTime = room.scores.time;
      if (gameTime < 1) {
        $.player.reply({ message: "[PV] ⚠️ A partida ainda não tem 1s de gravação para gerar GIF.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      if (requestedDuration < 1 || requestedDuration > MAX_GIF_DURATION_SECONDS) {
        $.player.reply({ message: `[PV] ⚠️ Duração inválida (1-${MAX_GIF_DURATION_SECONDS} segundos).`, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      const duration = Math.min(requestedDuration, Math.floor(gameTime));

      if (gifsThisGame >= 4) {
        $.player.reply({ message: "[PV] ❌ Limite de 4 GIFs por partida atingido.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      const comment = args.slice(hasDurationArg ? 1 : 0).join(" ");
      gifsThisGame++;

      room.send({
        message: `🎥 GIF ${gifsThisGame}/4 de ${duration}s solicitado por ${$.player.name}${comment ? ` (${comment})` : ""}. Processando após a partida...`,
        color: Colors.Cyan,
        style: ChatStyle.Bold,
        sound: ChatSounds.Notification,
      });

      await clipQueue.add(room.name, $.player.name, duration, comment, gameTime);
    },
  });
}
