import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { mutesDb } from "../../database/Database";
import { getRoom } from "../../room/RoomManager";
import { playerAutocomplete } from "../autocomplete";
import { EmbedFactory } from "../EmbedFactory";
import { formatDiscordPlayer } from "../../utils/discordWebhook";

export const data = new SlashCommandBuilder()
  .setName("mutar")
  .setDescription("Muta um jogador por tempo.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true))
  .addNumberOption((o) => o.setName("player").setDescription("Jogador da sala.").setRequired(true).setAutocomplete(true))
  .addNumberOption((o) => o.setName("minutos").setDescription("Duração em minutos.").setRequired(true).setMinValue(1).setMaxValue(1440))
  .addStringOption((o) => o.setName("motivo").setDescription("Motivo.").setRequired(false));

export const autocomplete = playerAutocomplete;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  const playerId = interaction.options.getNumber("player", true);
  const minutes = interaction.options.getNumber("minutos", true);
  const reason = interaction.options.getString("motivo") || "";
  const target = room.players[playerId];
  if (!target) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Jogador não encontrado.", user)], flags: MessageFlags.Ephemeral }); return; }
  const expiresAt = Math.floor(Date.now() / 1000) + minutes * 60;
  mutesDb.insert(target.ip ?? "", target.auth ?? "", target.name ?? "", interaction.user.username, expiresAt, reason ?? "");
  target.reply({ message: `🔇 Você foi mutado por ${minutes}min${reason ? ` (\`${reason}\`)` : ""}.`, color: 0xFFA500 } as any);
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`🔇 ${formatDiscordPlayer(target.id, target.name)} mutado por \`${minutes}min\`.${reason ? ` Motivo: \`${reason}\`` : ""}`, user)] });
}
