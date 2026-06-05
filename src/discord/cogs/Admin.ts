import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, type SlashCommandNumberOption, type SlashCommandBooleanOption } from "discord.js";
import { getRoom } from "../../room/RoomManager";
import type { Player } from "haxball-extended-room";
import { playerAutocomplete } from "../autocomplete";
import { formatDiscordPlayer } from "../../utils/discordWebhook";

export const data = new SlashCommandBuilder()
  .setName("admin")
  .setDescription("Altera admin de um jogador.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true))
  .addNumberOption((o: SlashCommandNumberOption) => o.setName("player").setDescription("Jogador da sala.").setRequired(true).setAutocomplete(true))
  .addBooleanOption((o: SlashCommandBooleanOption) => o.setName("status").setDescription("Admin true/false.").setRequired(true));

export const autocomplete = playerAutocomplete;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  const playerId = interaction.options.getNumber("player", true);
  const status = interaction.options.getBoolean("status", true);
  const player: Player | undefined = room.players[playerId];
  if (!player) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Jogador não encontrado.", user)], flags: MessageFlags.Ephemeral }); return; }
  if (player.admin === status) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed(`❌ ${formatDiscordPlayer(player.id, player.name)} já ${status ? "é admin" : "é player"}.`, user)], flags: MessageFlags.Ephemeral }); return; }
  if (["👨‍💼 administrador", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"].includes(player.settings.role)) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed(`❌ ${formatDiscordPlayer(player.id, player.name)} é \`${player.settings.role}\`.`, user)], flags: MessageFlags.Ephemeral }); return; }
  player.admin = status;
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ Admin de ${formatDiscordPlayer(player.id, player.name)} alterado para \`${status}\`.`, user)] });
}
