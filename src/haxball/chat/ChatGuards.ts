import type { Player, Room } from "haxball-extended-room";
import { mutesDb } from "../../database/Database";
import { chatEnabled, specEnabled } from "../commands/Chat";

export type ChatBlock =
  | { blocked: false }
  | { blocked: true; reason: "mute"; mute: { reason: string; expires_at: number } }
  | { blocked: true; reason: "chat-off" | "spec-off" };

const teamChatPrefixes = ["t ", "tc ", "teamchat "];

export function isCommandMessage(room: Room, message: string): boolean {
  return message.startsWith(room.prefix || "!");
}

export function isPrivateChatMessage(message: string): boolean {
  return message.startsWith("@@");
}

export function isTeamChatMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return teamChatPrefixes.some((prefix) => normalized.startsWith(prefix));
}

export function isSpecialChatMessage(message: string): boolean {
  return isPrivateChatMessage(message) || isTeamChatMessage(message);
}

export function getPublicChatBlock(room: Room, player: Player, message: string): ChatBlock {
  const activeMute = mutesDb.findActive(player.auth ?? "", player.ip ?? "");
  if (activeMute) {
    return {
      blocked: true,
      reason: "mute",
      mute: { reason: activeMute.reason, expires_at: activeMute.expires_at },
    };
  }

  if (isCommandMessage(room, message) || isSpecialChatMessage(message)) return { blocked: false };

  if (!chatEnabled) return { blocked: true, reason: "chat-off" };
  if (!specEnabled && player.team === 0) return { blocked: true, reason: "spec-off" };

  return { blocked: false };
}
