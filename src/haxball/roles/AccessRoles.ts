import { Role, type Player } from "haxball-extended-room";

export const ROLE_ADMINISTRADOR = "👨‍💼 administrador";
export const ROLE_JOGADOR = "⚽ jogador";
export const ROLE_SUB_CAPITAO = "💂 sub-capitão";
export const ROLE_CAPITAO = "👮‍♂️ capitão";

const ACCESS_ROLES = [
  ROLE_ADMINISTRADOR,
  ROLE_JOGADOR,
  ROLE_SUB_CAPITAO,
  ROLE_CAPITAO,
];

const ROLE_POSITIONS: Record<string, number> = {
  [ROLE_ADMINISTRADOR]: 1,
  [ROLE_JOGADOR]: 2,
  [ROLE_SUB_CAPITAO]: 3,
  [ROLE_CAPITAO]: 4,
};

export function syncPlayerAccessRole(player: Player, roleName: string): void {
  for (const role of ACCESS_ROLES) {
    player.removeRole(role);
  }
  player.settings.role = roleName;
  player.addRole(new Role(roleName).setPosition(ROLE_POSITIONS[roleName] ?? 0));
}

export function hasSystemRole(roleName: string | undefined): boolean {
  return !!roleName && ACCESS_ROLES.includes(roleName);
}
