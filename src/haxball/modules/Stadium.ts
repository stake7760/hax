import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, Module, ModuleCommand, type Room } from "haxball-extended-room";
import fs from "node:fs";
import path from "node:path";

export let currentStadiumName = "Classic";

function loadStadiumFile(fileName: string): object | string {
  const filePath = path.resolve(process.cwd(), "maps", fileName);
  const content = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(content) as object;
  } catch {
    return content;
  }
}

class StadiumCommand {
  constructor(private room: Room, private stadium: object | string, private name: string) {}

  execute(execInfo: CommandExecInfo): void {
    if (execInfo.arguments.length > 0) {
      execInfo.player.reply({ message: `[PV] ❌ Utilize apenas ${execInfo.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
      return;
    }
    if (this.room.isGameInProgress()) {
      execInfo.player.reply({ message: "[PV] ⛔ Não pode alterar mapa durante partida.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }
    this.room.setStadium(this.stadium as any);
    currentStadiumName = this.name;
    (this.room.state as any).currentStadiumName = this.name;
    this.room.customEvents.emit("realSoccerToggle", this.name === "Real Soccer Revolution");
    this.room.send({ message: `✅ Mapa alterado para ${this.name} por ${execInfo.player.name}.`, color: Colors.Orange, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
  }
}

@Module
export class StadiumModule {
  private commands: StadiumCommand[];

  constructor(private room: Room) {
    (this.room.state as any).currentStadiumName = currentStadiumName;
    this.commands = [
      new StadiumCommand(room, loadStadiumFile("Futsal X3 by Bazinga.json"), "Futsal X3"),
      new StadiumCommand(room, loadStadiumFile("Futsal X4 by Bazinga.json"), "Futsal X4"),
      new StadiumCommand(room, loadStadiumFile("LVK.json"), "X1 LVK"),
      new StadiumCommand(room, loadStadiumFile("Real Soccer Revolution.json"), "Real Soccer Revolution"),
      new StadiumCommand(room, loadStadiumFile("Pênaltis.json"), "Pênaltis"),
      new StadiumCommand(room, loadStadiumFile("Futsal x3 - FBF Brasil.json"), "Futsal X3 - FBF Brasil"),
      new StadiumCommand(room, loadStadiumFile("Futsal x4 - FBF Brasil.json"), "Futsal X4 - FBF Brasil"),
    ];
    this.room.onStadiumChange = (name) => {
      currentStadiumName = name;
      (this.room.state as any).currentStadiumName = name;
      this.room.customEvents.emit("realSoccerToggle", name === "Real Soccer Revolution");
    };
  }

  @ModuleCommand({ aliases: ["bazingax3", "x3bazinga", "futsalx3"], desc: "Carrega Futsal X3 by Bazinga.", usage: "x3", roles: ["admin", "👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"], deleteMessage: true })
  public x3(execInfo: CommandExecInfo) { this.commands[0].execute(execInfo); }

  @ModuleCommand({ aliases: ["bazingax4", "x4bazinga", "futsalx4"], desc: "Carrega Futsal X4 by Bazinga.", usage: "x4", roles: ["admin", "👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"], deleteMessage: true })
  public x4(execInfo: CommandExecInfo) { this.commands[1].execute(execInfo); }

  @ModuleCommand({ aliases: ["x1", "x1lvk"], desc: "Carrega LVK.", usage: "lvk", roles: ["admin", "👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"], deleteMessage: true })
  public lvk(execInfo: CommandExecInfo) { this.commands[2].execute(execInfo); }

  @ModuleCommand({ aliases: ["rsr", "realsoccer", "rs"], desc: "Carrega Real Soccer Revolution.", usage: "rs", roles: ["admin", "👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"], deleteMessage: true })
  public rs(execInfo: CommandExecInfo) { this.commands[3].execute(execInfo); }

  @ModuleCommand({ aliases: ["penalti", "penaltis", "penal"], desc: "Carrega Pênaltis.", usage: "penal", roles: ["admin", "👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"], deleteMessage: true })
  public penal(execInfo: CommandExecInfo) { this.commands[4].execute(execInfo); }

  @ModuleCommand({ aliases: ["fbfx3"], desc: "Carrega Futsal X3 - FBF Brasil.", usage: "x3fbf", roles: ["admin", "👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"], deleteMessage: true })
  public x3fbf(execInfo: CommandExecInfo) { this.commands[5].execute(execInfo); }

  @ModuleCommand({ aliases: ["fbfx4"], desc: "Carrega Futsal X4 - FBF Brasil.", usage: "x4fbf", roles: ["admin", "👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"], deleteMessage: true })
  public x4fbf(execInfo: CommandExecInfo) { this.commands[6].execute(execInfo); }
}
