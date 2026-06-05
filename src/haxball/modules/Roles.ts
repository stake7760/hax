import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, Event, Module, ModuleCommand, type Player, type Room } from "haxball-extended-room";
import { getWebhookUrl } from "../../config/env";
import { rolesDb } from "../../database/Database";
import { syncPlayerAccessRole } from "../roles/AccessRoles";
import { sanitizeDiscordContent, sendWebhookJson } from "../../utils/discordWebhook";

@Module
export class RolesModule {
  constructor(private room: Room) {}

  private roleHierarchy: Record<string, number> = {
    "👨‍💼 administrador": 1, "⚽ jogador": 2, "💂 sub-capitão": 3, "👮‍♂️ capitão": 4,
  };

  private passwordMap: Record<string, string> = {};

  private getPasswords(): Record<string, string> {
    return {
      [process.env.JOGADOR || ""]: "⚽ jogador",
      [process.env.CAP || ""]: "👮‍♂️ capitão",
      [process.env.SUBCAP || ""]: "💂 sub-capitão",
      [process.env.ADMIN || ""]: "👨‍💼 administrador",
    };
  }

  private roleToDb(role: string): string {
    const map: Record<string, string> = { "⚽ jogador": "jogador", "👮‍♂️ capitão": "capitao", "💂 sub-capitão": "sub-capitao", "👨‍💼 administrador": "administrador" };
    return map[role] || "";
  }

  @ModuleCommand({
    aliases: [],
    desc: "Define o cargo do jogador com base na senha.",
    usage: "<senha>",
    roles: [],
    deleteMessage: true,
  })
  public async cargo(execInfo: CommandExecInfo): Promise<void> {
    const player = execInfo.player;
    const input = execInfo.arguments[0]?.toString();
    if (!input) {
      player.reply({ message: "[PV] ⚠️ Você deve fornecer uma senha.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Normal });
      return;
    }

    const passwords = this.getPasswords();
    const targetRole = passwords[input];
    if (!targetRole) {
      player.reply({ message: "[PV] ⚠️ Senha inválida.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }

    const currentRole = player.settings.role;
    if (currentRole === targetRole) {
      player.reply({ message: `[PV] ❌ Você já é ${targetRole}.`, color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }

    if (currentRole && (this.roleHierarchy[currentRole] || 0) > (this.roleHierarchy[targetRole] || 0)) {
      player.reply({ message: `[PV] ❌ Não pode usar esta senha pois seu cargo (${currentRole}) é superior.`, color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }

    if (currentRole) {
      const oldDbRole = this.roleToDb(currentRole);
      if (oldDbRole) rolesDb.removeByAuth(player.auth ?? "");
    }

    syncPlayerAccessRole(player, targetRole);
    player.admin = true;
    const dbRole = this.roleToDb(targetRole);
    if (!dbRole) {
      player.reply({ message: "[PV] ❌ Cargo inválido.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }
    rolesDb.upsert(player.ip ?? "", player.auth ?? "", player.name ?? "", dbRole);
    this.notifyAdminWebhook(player, targetRole);

    this.room.send({
      message: `${player.name} utilizou a senha de ${targetRole.toUpperCase()}.`,
      color: Colors.YellowGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification,
    });
  }

  private notifyAdminWebhook(player: Player, role: string): void {
    const url = getWebhookUrl("ADMIN_WEBHOOK", (this.room.state as any).roomNumber);
    if (!url) return;
    const content = `[${this.room.name}] [:warning: **SISTEMA**]: :key: **CARGO** — \`[${player.id}]\` **${sanitizeDiscordContent(player.name)}** autenticou como ${role}.`;
    sendWebhookJson(url, { content });
  }

  @ModuleCommand({
    aliases: ["hackbanir"],
    desc: "Banir um jogador por ID.",
    usage: "hackban <ID>",
    roles: ["👮‍♂️ capitão"],
    deleteMessage: true,
  })
  public hackban(execInfo: CommandExecInfo): void {
    const { player, arguments: [targetId], room } = execInfo;
    if (!targetId) { player.reply({ message: "[PV] ⚠️ Informe o ID.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
    const id = Number.parseInt(targetId.toString().replace("#", ""), 10);
    if (isNaN(id)) { player.reply({ message: "[PV] ⚠️ ID inválido.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
    const target = room.players[id];
    if (!target) { player.reply({ message: `[PV] ⚠️ Jogador ${id} não encontrado.`, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
    if (["👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"].includes(target.settings.role)) {
      player.reply({ message: "[PV] ❌ Não pode banir este jogador.", color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
    target.ban("🔴 !hackban");
    const { bansDb } = require("../../database/Database");
    bansDb.insert(target.ip ?? "", target.auth ?? "", target.name ?? "", player.name ?? "", "hackban");
  }

  @ModuleCommand({
    aliases: ["hackclearbans", "hacklimparbans", "hackcb"],
    desc: "Limpar todos os bans do banco de dados.",
    usage: "hackclearbans",
    roles: ["👮‍♂️ capitão"],
    deleteMessage: true,
  })
  public hackclearbans(execInfo: CommandExecInfo): void {
    const { bansDb } = require("../../database/Database");
    const result = bansDb.clear();
    execInfo.room.unbanAll();
    execInfo.player.reply({ message: "[PV] ✅ Todos os bans foram limpos.", color: Colors.SeaGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
  }
}
