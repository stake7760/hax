import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";
import { bansDb } from "../../database/Database";

export const data = new SlashCommandBuilder()
  .setName("limparbans")
  .setDescription("Limpa todos os bans.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: undefined }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  room.unbanAll();
  bansDb.clear();
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed("✅ Todos os bans foram limpos.", user)] });
}
