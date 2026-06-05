import { ChatSounds, ChatStyle, Colors, Module, type Player, type Room } from "haxball-extended-room";
import { getWebhookUrl } from "../../config/env";
import { sendWebhookJson } from "../../utils/discordWebhook";

class RoleValidator {
    private static readonly validRoles = ["⚽ jogador", "👮‍♂️ capitão", "💂 sub-capitão"];

    static hasPermission(roleName: string | undefined): boolean {
        return roleName ? RoleValidator.validRoles.includes(roleName) : false;
    }
}

class KickRateResponseHandler {
    static sendPermissionDenied(player: Player): void {
        player.reply({
            message: "[PV] ❌ Você não tem permissão para alterar o kickrate.",
            color: Colors.Red,
            style: ChatStyle.Bold,
            sound: ChatSounds.Notification,
        });
    }
}

class KickRateManager {
    static resetKickRate(room: Room): void {
        room.setKickRateLimit(0, 0, 0);
    }
}

class KickRateWebhook {
    static send(room: Room, player: Player | undefined, min: number, rate: number, burst: number): void {
        const url = getWebhookUrl("MENSAGEM_WEBHOOK", (room.state as any).roomNumber);
        if (!url) return;

        const by = player ? `por \`${player.name}\`` : "pelo sistema";
        const text = `[${room.name}] [:warning: **SISTEMA**]: Kickrate alterado ${by}: min = ${min}, rate = ${rate}, burst = ${burst}`;

        sendWebhookJson(url, { content: text });
    }
}

@Module
export class KickRateModule {
    constructor(private room: Room) {
        this.room.onKickRateLimitSet = this.handleKickRateLimitSet.bind(this);
    }

    private async handleKickRateLimitSet(min: number, rate: number, burst: number, byPlayer?: Player): Promise<void> {
        if (!byPlayer) {
            KickRateWebhook.send(this.room, undefined, min, rate, burst);
            return;
        }

        KickRateWebhook.send(this.room, byPlayer, min, rate, burst);

        if (!RoleValidator.hasPermission(byPlayer.settings.role)) {
            KickRateManager.resetKickRate(this.room);
            KickRateResponseHandler.sendPermissionDenied(byPlayer);
            return;
        }
    }
}
