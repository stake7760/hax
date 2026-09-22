import { ChatSounds, ChatStyle, Colors, type Room } from "haxball-extended-room";
import { CoreModule } from "./modules/Core";
import { AdminModule } from "./modules/Admin";
import { RolesModule } from "./modules/Roles";
import { WebhookModule } from "./modules/Webhook";
import { GoalsModule } from "./modules/Goals";
import { PrivateMessageModule } from "./modules/PrivateMessage";
import { TeamChatModule } from "./modules/TeamChat";
import { StadiumModule } from "./modules/Stadium";
import { KickRateModule } from "./modules/KickRate";
import { BanKickModule } from "./modules/BanKick";
import { RealSoccerModule } from "./modules/RealSoccer";
import { HelpModule } from "./modules/Help";
import { LeaveModule } from "./modules/Leave";
import { MuteModule } from "./modules/Mute";

import { AFKCommand } from "./commands/AFK";
import { avatarCommand } from "./commands/Avatar";
import { banCommands } from "./commands/Ban";
import { ballCommands } from "./commands/Ball";
import { campCommands } from "./commands/Camp";
import { chatCommand } from "./commands/Chat";
import { evalCommand } from "./commands/Eval";
import { kickCommands } from "./commands/Kick";
import { radiusCommand } from "./commands/Radius";
import { resetCommand } from "./commands/Reset";
import { passwordCommand } from "./commands/Password";
import { specCommand } from "./commands/Spec";
import { swapCommand } from "./commands/Swap";
import { uniformCommand } from "./commands/Uniform";
import { clipCommand } from "../clip/ClipManager";

export function SetRoomMessages(room: Room): void {
  room.noPermissionMessage = {
    message: "🚫 Você não tem permissão para usar este comando!",
    color: Colors.Red,
    style: ChatStyle.Bold,
    sound: ChatSounds.Notification,
  };
  room.commandCooldownMessage = {
    message: "⏳ Não digite comandos tão rápido!",
    color: Colors.Red,
    style: ChatStyle.Bold,
    sound: ChatSounds.Notification,
  };
}

export function HandleModules(room: Room): void {
  room.module(CoreModule);
  room.module(AdminModule);
  room.module(RolesModule);
  room.module(WebhookModule);
  room.module(GoalsModule);
  room.module(PrivateMessageModule);
  room.module(TeamChatModule);
  room.module(StadiumModule);
  room.module(KickRateModule);
  room.module(BanKickModule);
  room.module(RealSoccerModule);
  room.module(HelpModule);
  room.module(LeaveModule);
  room.module(MuteModule);
}

export function HandleCommands(room: Room): void {
  AFKCommand(room);
  avatarCommand(room);
  banCommands(room);
  ballCommands(room);
  campCommands(room);
  chatCommand(room);
  evalCommand(room);
  kickCommands(room);
  radiusCommand(room);
  resetCommand(room);
  passwordCommand(room);
  specCommand(room);
  swapCommand(room);
  uniformCommand(room);
  clipCommand(room);
}
