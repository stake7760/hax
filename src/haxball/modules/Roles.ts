
import {
  ChatSounds,
  ChatStyle,
  Colors,
  type CommandExecInfo,
  Module,
  ModuleCommand,
  type Player,
  type Room,
} from "haxball-extended-room";

import { getWebhookUrl } from "../../config/env";
import { rolesDb, systemConfigDb } from "../../database/Database";
import { syncPlayerAccessRole } from "../roles/AccessRoles";
import {
  sanitizeDiscordContent,
  sendWebhookJson,
} from "../../utils/discordWebhook";

const ROLE_ADMINISTRADOR = "👨‍💼 administrador";
const ROLE_JOGADOR = "⚽ jogador";
const ROLE_SUBCAPITAO = "💂 sub-capitão";
const ROLE_CAPITAO = "👮‍♂️ capitão";

const PRINCIPAL_CAPTAIN_KEY = "principal_captain_auth";

@Module
export class RolesModule {
  constructor(private room: Room) {}

  private roleHierarchy: Record<string, number> = {
    [ROLE_ADMINISTRADOR]: 1,
    [ROLE_JOGADOR]: 2,
    [ROLE_SUBCAPITAO]: 3,
    [ROLE_CAPITAO]: 4,
  };

  private roleToDb(role: string): string {
    const map: Record<string, string> = {
      [ROLE_JOGADOR]: "jogador",
      [ROLE_CAPITAO]: "capitao",
      [ROLE_SUBCAPITAO]: "sub-capitao",
      [ROLE_ADMINISTRADOR]: "administrador",
    };

    return map[role] || "";
  }

  private dbToRole(role: string): string {
    const map: Record<string, string> = {
      jogador: ROLE_JOGADOR,
      capitao: ROLE_CAPITAO,
      "sub-capitao": ROLE_SUBCAPITAO,
      administrador: ROLE_ADMINISTRADOR,
    };

    return map[role] || "";
  }

  private getPrincipalCaptainAuth(): string | undefined {
    return systemConfigDb.get(PRINCIPAL_CAPTAIN_KEY);
  }

  private isPrincipalCaptain(player: Player): boolean {
    const principalAuth = this.getPrincipalCaptainAuth();

    if (!principalAuth || !player.auth) {
      return false;
    }

    return principalAuth === player.auth;
  }

  private isCaptain(player: Player): boolean {
    return player.settings.role === ROLE_CAPITAO;
  }

  private normalizeRole(input: string): string | undefined {
    const normalized = input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[-_]/g, "")
      .trim();

    const roles: Record<string, string> = {
      jogador: ROLE_JOGADOR,
      player: ROLE_JOGADOR,

      capitao: ROLE_CAPITAO,
      capita: ROLE_CAPITAO,
      captain: ROLE_CAPITAO,

      subcapitao: ROLE_SUBCAPITAO,
      sub: ROLE_SUBCAPITAO,
      subcaptain: ROLE_SUBCAPITAO,

      administrador: ROLE_ADMINISTRADOR,
      admin: ROLE_ADMINISTRADOR,
    };

    return roles[normalized];
  }

  private isRemovalCommand(input: string): boolean {
    const normalized = input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    return [
      "remover",
      "remove",
      "retirar",
      "retira",
      "none",
      "nenhum",
      "semcargo",
      "sem",
    ].includes(normalized);
  }

  private replyError(player: Player, message: string): void {
    player.reply({
      message: `[PV] ❌ ${message}`,
      color: Colors.Red,
      style: ChatStyle.Bold,
      sound: ChatSounds.Notification,
    });
  }

  private replySuccess(player: Player, message: string): void {
    player.reply({
      message: `[PV] ✅ ${message}`,
      color: Colors.SeaGreen,
      style: ChatStyle.Bold,
      sound: ChatSounds.Notification,
    });
  }

  @ModuleCommand({
    aliases: [],
    desc: "Define o cargo do jogador com a senha CAP.",
    usage: "<senha>",
    roles: [],
    deleteMessage: true,
  })
  public async cargo(execInfo: CommandExecInfo): Promise<void> {
    const player = execInfo.player;
    const input = execInfo.arguments[0]?.toString();

    if (!input) {
      this.replyError(player, "Você deve fornecer uma senha.");
      return;
    }

    const captainPassword = process.env.CAP;

    if (!captainPassword || input !== captainPassword) {
      this.replyError(player, "Senha inválida.");
      return;
    }

    const currentRole = player.settings.role;

    if (currentRole === ROLE_CAPITAO) {
      player.reply({
        message: "[PV] ⚠️ Você já é capitão.",
        color: Colors.Orange,
        style: ChatStyle.Bold,
        sound: ChatSounds.Notification,
      });

      return;
    }

    const principalAuth = this.getPrincipalCaptainAuth();

    if (principalAuth && principalAuth !== player.auth) {
      this.replyError(player, "Não foi possível autenticar com esta senha.");
      return;
    }

    if (!player.auth) {
      this.replyError(player, "Não foi possível identificar sua conta.");
      return;
    }

    if (currentRole) {
      rolesDb.removeByAuth(player.auth);
    }

    syncPlayerAccessRole(player, ROLE_CAPITAO);
    player.admin = true;

    rolesDb.upsert(
      player.ip ?? "",
      player.auth,
      player.name ?? "",
      "capitao",
    );

    if (!principalAuth) {
      systemConfigDb.set(PRINCIPAL_CAPTAIN_KEY, player.auth);
    }

    this.notifyAdminWebhook(player, ROLE_CAPITAO);

    this.room.send({
      message: `${player.name} utilizou a senha de CAPITÃO.`,
      color: Colors.YellowGreen,
      style: ChatStyle.Bold,
      sound: ChatSounds.Notification,
    });
  }

  @ModuleCommand({
    aliases: ["setcargo"],
    desc: "Atribui ou remove o cargo de um jogador.",
    usage: "<ID> <cargo>",
    roles: [ROLE_CAPITAO],
    deleteMessage: true,
  })
  public setar(execInfo: CommandExecInfo): void {
    const { player, arguments: args, room } = execInfo;

    if (!this.isCaptain(player)) {
      this.replyError(player, "Você não tem permissão para usar este comando.");
      return;
    }

    const targetIdInput = args[0]?.toString();
    const roleInput = args.slice(1).join(" ").trim();

    if (!targetIdInput || !roleInput) {
      this.replyError(
        player,
        "Uso correto: !set <ID> <cargo ou remover>.",
      );
      return;
    }

    const targetId = Number.parseInt(
      targetIdInput.replace("#", ""),
      10,
    );

    if (Number.isNaN(targetId)) {
      this.replyError(player, "ID inválido.");
      return;
    }

    const target = room.players[targetId];

    if (!target) {
      this.replyError(player, `Jogador ${targetId} não encontrado.`);
      return;
    }

    const targetIsPrincipal = this.isPrincipalCaptain(target);

    if (targetIsPrincipal) {
      this.replyError(player, "Você não pode alterar este jogador.");
      return;
    }

    const targetCurrentRole = target.settings.role;
    const targetIsCaptain = targetCurrentRole === ROLE_CAPITAO;
    const principal = this.isPrincipalCaptain(player);

    const isRemoval = this.isRemovalCommand(roleInput);
    const newRole = isRemoval ? undefined : this.normalizeRole(roleInput);

    if (!isRemoval && !newRole) {
      this.replyError(
        player,
        "Cargo inválido. Use jogador, capitão, subcapitão, administrador ou remover.",
      );
      return;
    }

    if (targetIsCaptain && !principal) {
      this.replyError(
        player,
        "Você não pode alterar outro capitão.",
      );
      return;
    }

    if (isRemoval && !targetCurrentRole) {
      this.replyError(player, "Este jogador não possui um cargo.");
      return;
    }

    if (
      isRemoval &&
      targetCurrentRole === ROLE_CAPITAO &&
      !principal
    ) {
      this.replyError(
        player,
        "Você não pode remover outro capitão.",
      );
      return;
    }

    if (!target.auth) {
      this.replyError(
        player,
        "Não foi possível identificar o jogador.",
      );
      return;
    }

    rolesDb.removeByAuth(target.auth);

    if (isRemoval) {
      target.settings.role = undefined;

      target.removeRole(ROLE_ADMINISTRADOR);
      target.removeRole(ROLE_JOGADOR);
      target.removeRole(ROLE_SUBCAPITAO);
      target.removeRole(ROLE_CAPITAO);

      target.admin = false;

      this.replySuccess(
        player,
        `O cargo de ${target.name} foi removido.`,
      );

      return;
    }

    if (!newRole) {
      this.replyError(player, "Cargo inválido.");
      return;
    }

    syncPlayerAccessRole(target, newRole);

    target.admin = true;

    rolesDb.upsert(
      target.ip ?? "",
      target.auth,
      target.name ?? "",
      this.roleToDb(newRole),
    );

    this.replySuccess(
      player,
      `O cargo de ${target.name} foi alterado para ${newRole}.`,
    );

    this.notifyAdminWebhook(target, newRole);
  }

  @ModuleCommand({
    aliases: ["hackbanir"],
    desc: "Banir um jogador por ID.",
    usage: "hackban <ID>",
    roles: [ROLE_CAPITAO],
    deleteMessage: true,
  })
  public hackban(execInfo: CommandExecInfo): void {
    const { player, arguments: [targetId], room } = execInfo;

    if (!targetId) {
      this.replyError(player, "Informe o ID.");
      return;
    }

    const id = Number.parseInt(
      targetId.toString().replace("#", ""),
      10,
    );

    if (Number.isNaN(id)) {
      this.replyError(player, "ID inválido.");
      return;
    }

    const target = room.players[id];

    if (!target) {
      this.replyError(player, `Jogador ${id} não encontrado.`);
      return;
    }

    if (
      [
        ROLE_ADMINISTRADOR,
        ROLE_CAPITAO,
        ROLE_SUBCAPITAO,
        ROLE_JOGADOR,
      ].includes(target.settings.role)
    ) {
      player.reply({
        message: "[PV] ❌ Não pode banir este jogador.",
        color: Colors.Orange,
        style: ChatStyle.Bold,
        sound: ChatSounds.Notification,
      });

      return;
    }

    target.ban("🔴 !hackban");

    const { bansDb } = require("../../database/Database");

    bansDb.insert(
      target.ip ?? "",
      target.auth ?? "",
      target.name ?? "",
      player.name ?? "",
      "hackban",
    );
  }

  @ModuleCommand({
    aliases: ["hackclearbans", "hacklimparbans", "hackcb"],
    desc: "Limpar todos os bans do banco de dados.",
    usage: "hackclearbans",
    roles: [ROLE_CAPITAO],
    deleteMessage: true,
  })
  public hackclearbans(execInfo: CommandExecInfo): void {
    const { bansDb } = require("../../database/Database");

    bansDb.clear();
    execInfo.room.unbanAll();

    this.replySuccess(
      execInfo.player,
      "Todos os bans foram limpos.",
    );
  }

  private notifyAdminWebhook(player: Player, role: string): void {
    const url = getWebhookUrl(
      "ADMIN_WEBHOOK",
      (this.room.state as any).roomNumber,
    );

    if (!url) return;

    const content =
      `[${this.room.name}] [:warning: **SISTEMA**]: :key: ` +
      `**CARGO** — \`[${player.id}]\` **${sanitizeDiscordContent(player.name)}** ` +
      `autenticou como ${role}.`;

    sendWebhookJson(url, { content });
  }
}