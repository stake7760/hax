import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";
import { playerAutocomplete } from "../autocomplete";
import { EmbedFactory } from "../EmbedFactory";
import { formatDiscordPlayer } from "../../utils/discordWebhook";

export const data = new SlashCommandBuilder()
  .setName("radius")
  .setDescription("Altera o tamanho de um jogador.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true))
  .addNumberOption((o) => o.setName("player").setDescription("Jogador da sala.").setRequired(true).setAutocomplete(true))
  .addNumberOption((o) => o.setName("tamanho").setDescription("Novo raio (5-50)").setRequired(true).setMinValue(5).setMaxValue(50));

export const autocomplete = playerAutocomplete;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  const playerId = interaction.options.getNumber("player", true);
  const size = interaction.options.getNumber("tamanho", true);
  const target = room.players[playerId];
  if (!target) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Jogador não encontrado.", user)], flags: MessageFlags.Ephemeral }); return; }
  target.radius = size;
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`📏 Raio de ${formatDiscordPlayer(target.id, target.name)} alterado para \`${size}\`.`, user)] });
}
