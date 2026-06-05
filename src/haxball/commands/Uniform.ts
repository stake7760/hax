import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room, Teams } from "haxball-extended-room";

const uniforms: Record<string, { angle: number; textColor: number; colors: number[] }> = {
  "3f1": { angle: 40, textColor: 0xFFFFFF, colors: [0x00D5FF, 0x0BBBD7] },
  ar1: { angle: 60, textColor: 0x9E1001, colors: [0xFFB8B8, 0xFFD4D1, 0xFFE3E0] },
  atm1: { angle: 0, textColor: 0xFED400, colors: [0x121212, 0x010001] },
  aw1: { angle: 60, textColor: 0xFFFEFE, colors: [0x010001, 0x014076, 0x010001] },
  aw2: { angle: 90, textColor: 0x000000, colors: [0xFFA200, 0xFF8800, 0xFF6600] },
  bam1: { angle: 60, textColor: 0xF3B204, colors: [0x802F0C] },
  black: { angle: 60, textColor: 0xFFFFFF, colors: [0x000000] },
  br1: { angle: 60, textColor: 0x00FF29, colors: [0xFFFF3B] },
  br2: { angle: 90, textColor: 0xFFFF3B, colors: [0x4A66F2] },
  fcb1: { angle: 180, textColor: 0xFFD60B, colors: [0x751507, 0x0A2D61] },
  fnc1: { angle: 60, textColor: 0xFFFFFF, colors: [0xFE5800] },
  fsk1: { angle: 63, textColor: 0xB726FF, colors: [0x0F0F0F, 0x260B3D, 0x32104D] },
  fsk2: { angle: 60, textColor: 0xB726FF, colors: [0xFFFFFF] },
  kabumm1: { angle: 120, textColor: 0xD6C20D, colors: [0x000000, 0x241E02, 0x000000] },
  lev1: { angle: 33, textColor: 0x00FFB3, colors: [0x000000, 0x000000, 0x00544F] },
  lev2: { angle: 60, textColor: 0x00FFB3, colors: [0x0006A6] },
  ostg1: { angle: 180, textColor: 0x0A0F40, colors: [0xADFF1F] },
  px1: { angle: 60, textColor: 0x000000, colors: [0x000000] },
  rx1: { angle: 60, textColor: 0xF6F2F2, colors: [0x32EAFF, 0x2CD0E3, 0x13C3D6] },
  rsa1: { angle: 60, textColor: 0x33F1A6, colors: [0x000000] },
  sx1: { angle: 60, textColor: 0x000000, colors: [0xFF0000, 0xDB0000, 0xCC0000] },
  tff1: { angle: 60, textColor: 0x023305, colors: [0x08C215, 0xFFFCFC, 0xFFFCFC] },
  tmv1: { angle: 60, textColor: 0xFF24A7, colors: [0xFFFFFF, 0xFFE0FF, 0xFDC1FF] },
  tmv2: { angle: 30, textColor: 0xFF91D7, colors: [0x000000, 0x000000, 0x212121] },
  tq1: { angle: 60, textColor: 0x050505, colors: [0xF5C011] },
  tsunami1: { angle: 60, textColor: 0x93962F, colors: [0x105A74, 0x1F5072, 0x105A74] },
  v1: { angle: 0, textColor: 0x000000, colors: [0xFFFFFF, 0xFCF63D, 0xFFFFFF] },
  v2: { angle: 0, textColor: 0xFFF700, colors: [0x000000] },
  v3: { angle: 60, textColor: 0xFFFF00, colors: [0x000000, 0x000000, 0x292900] },
  v4: { angle: 50, textColor: 0xF7FF00, colors: [0x666118, 0x5C5716, 0x524E13] },
  wb1: { angle: 90, textColor: 0x000000, colors: [0x00C907, 0x00C979, 0x00C9A8] },
  white: { angle: 60, textColor: 0x000000, colors: [0xFFFFFF] },
  wr1: { angle: 0, textColor: 0xB300FF, colors: [0x090254, 0x0C026B] },
};

export function uniformCommand(room: Room): void {
  room.command({
    name: "uniforme",
    aliases: ["uni", "uniform"],
    desc: "Aplica um uniforme pre-definido.",
    usage: "uniforme <nome>",
    roles: ["admin", "👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      const name = $.arguments[0]?.toString().toLowerCase();
      if (!name || !uniforms[name]) {
        $.player.reply({ message: `[PV] ⚠️ Uniformes: ${Object.keys(uniforms).join(", ")}`, color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      applyUniform(room, $, name);
    },
  });

  for (const name of Object.keys(uniforms)) {
    room.command({
      name,
      aliases: [],
      desc: "",
      usage: name,
      roles: ["admin", "👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
      deleteMessage: true,
      func: ($: CommandExecInfo) => applyUniform(room, $, name),
    });
  }
}

function applyUniform(room: Room, execInfo: CommandExecInfo, name: string): void {
  const team = execInfo.player.team;
  if (team !== Teams.Red && team !== Teams.Blue) {
    execInfo.player.reply({
      message: "[PV] ⚠️ Você precisa estar no Red ou Blue para aplicar uniforme.",
      color: Colors.Yellow,
      style: ChatStyle.Bold,
      sound: ChatSounds.Notification,
    });
    return;
  }

  room.setTeamColors(team, uniforms[name]);
  const teamName = team === Teams.Red ? "red" : "blue";
  room.send({
    message: `🎨 Uniforme ${name} aplicado no time ${teamName} por ${execInfo.player.name}.`,
    color: Colors.White,
    style: ChatStyle.SmallBold,
    sound: ChatSounds.Notification,
  });
}
