import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, Module, ModuleCommand, type Player, type Room } from "haxball-extended-room";

@Module
export class LeaveModule {
  constructor(private room: Room) {}

  @ModuleCommand({
    aliases: ["leave", "sair", "bb", "tchau"],
    desc: "Remove você da sala.",
    usage: "bb",
    roles: [],
    deleteMessage: true,
  })
  public bb(execInfo: CommandExecInfo): void {
    execInfo.player.kick("👋 Até mais!");
  }
}
