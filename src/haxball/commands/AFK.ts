import { ChatSounds, ChatStyle, Colors as HaxballColors, type CommandExecInfo, type Room, Teams } from "haxball-extended-room";

export const afkPlayers = new Map<number, { startTime: number, lastCheckTime: number }>();
export const afkPlayerIds = new Set<number>();
export const playerPositions = new Map<number, number>();

export class PlayerStatus {
  constructor(public readonly player: { id: number; name: string; team: number; admin: boolean }) {}

  isAFK(): boolean {
    return afkPlayers.has(this.player.id);
  }

  setAFK(room: Room): void {
    const now = Date.now();
    afkPlayers.set(this.player.id, {
        startTime: now,
        lastCheckTime: now
    });
    afkPlayerIds.add(this.player.id);

    const currentIndex = findPlayerIndex(room, this.player.id);
    if (currentIndex !== -1) {
        playerPositions.set(this.player.id, currentIndex);
    }

    this.switchToSpectators();
    this.notifyAFK(room);
    this.removeAdmin();
  }

  removeAFK(room: Room): void {
    afkPlayers.delete(this.player.id);
    afkPlayerIds.delete(this.player.id);
    playerPositions.delete(this.player.id);
    this.notifyNotAFK(room);
  }

  private switchToSpectators(): void {
    if (this.player.team !== Teams.Spectators) {
      this.player.team = Teams.Spectators;
    }
  }

  private notifyAFK(room: Room): void {
    room.send({
      message: `💤 ${this.player.name} agora está AFK.`,
      color: HaxballColors.CadetBlue,
      style: ChatStyle.Bold,
      sound: ChatSounds.Notification,
    });
  }

  private notifyNotAFK(room: Room): void {
    room.send({
      message: `💤 ${this.player.name} não está mais AFK.`,
      color: HaxballColors.LightGreen,
      style: ChatStyle.Bold,
      sound: ChatSounds.Notification,
    });
  }

  private removeAdmin(): void {
    this.player.admin = false;
  }

  getAFKTime(): string {
    const afkData = afkPlayers.get(this.player.id);
    if (!afkData) return "0 segundos";

    const afkDuration = Date.now() - afkData.startTime;
    return this.formatDuration(afkDuration);
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const timeParts: string[] = [];

    const addUnit = (value: number, singular: string, plural: string) => {
        if (value > 0) {
            timeParts.push(`${value} ${value === 1 ? singular : plural}`);
        }
    };

    addUnit(days, "dia", "dias");
    addUnit(hours, "hora", "horas");
    addUnit(minutes, "minuto", "minutos");

    if (seconds > 0 || timeParts.length === 0) {
        addUnit(seconds, "segundo", "segundos");
    }

    if (timeParts.length > 1) {
        const lastPart = timeParts.pop();
        return `${timeParts.join(", ")} e ${lastPart}`;
    }

    return timeParts.join(", ");
  }
}

export function AFKCommand(room: Room) {
  room.command({
    name: "afk",
    aliases: ["away", "ausente", "awayfromkeyboard"],
    desc: "Define ou remove o status AFK do jogador.",
    usage: "afk",
    roles: [],
    deleteMessage: true,
    func: async ($: CommandExecInfo) => {
      const player = $.player;
      if (!player) return;

      if ($.arguments.length > 0) {
        handleIncorrectUsage($, room);
        return;
      }

      const status = new PlayerStatus(player);

      if (status.isAFK()) {
        handleRemoveAFK(status, room);
        return;
      }

      handleSetAFK(status, room, player);
    },
  });

  room.command({
    name: "afks",
    desc: "Mostra os jogadores AFK da sala.",
    usage: "afks",
    roles: [],
    deleteMessage: true,
    func: async ($: CommandExecInfo) => {
      if ($.arguments.length > 0) {
        handleIncorrectUsage($, room);
        return;
      }

      updateAllAFKTimes();

      const afkList = getAFKList(room);

      if (afkList.length === 0) {
        $.player?.reply({
          message: "[PV] ❌ Não há jogadores AFK no momento.",
          color: HaxballColors.Red,
          style: ChatStyle.SmallItalic,
          sound: ChatSounds.Notification,
        });
        return;
      }

      const afkMessage = afkList
        .map((player) => `🆔 ID: ${player.id}, 👤 Nick: ${player.name}, ⏳ Tempo AFK: ${player.afkTime || "0 segundos"}`)
        .join("\n");

      $.player?.reply({
        message: `[PV] 🔹 Jogadores AFK:\n\n${afkMessage}`,
        color: HaxballColors.CadetBlue,
        style: ChatStyle.SmallItalic,
        sound: ChatSounds.Notification,
      });
    },
  });
}

function handleSetAFK(status: PlayerStatus, room: Room, _player: { id: number }): void {
  status.setAFK(room);
}

function handleRemoveAFK(status: PlayerStatus, room: Room): void {
  status.removeAFK(room);
}

function findPlayerIndex(room: Room, playerId: number): number {
  return room.players.order(room).findIndex((p) => p.id === playerId);
}

function handleIncorrectUsage($: CommandExecInfo, _room: Room): void {
  const correctCommand = $.message.split(" ")[0];
  $.player?.reply({
    message: `[PV] ❌ Utilize apenas ${correctCommand}`,
    color: HaxballColors.Red,
    style: ChatStyle.SmallBold,
    sound: ChatSounds.Notification,
  });
}

function updateAllAFKTimes(): void {
  const now = Date.now();
  afkPlayers.forEach((value, _key) => {
    value.lastCheckTime = now;
  });
}

function getAFKList(room: Room): { id: number; name: string; afkTime: string }[] {
  return Array.from(room.players.order(room))
    .filter((player) => afkPlayers.has(player.id))
    .map((player) => {
      const status = new PlayerStatus(player);
      return {
        id: player.id,
        name: player.name,
        afkTime: status.isAFK() ? status.getAFKTime() : "0 segundos"
      };
    });
}
