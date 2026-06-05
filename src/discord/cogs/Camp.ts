import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";
import { toggleCampMode } from "../../haxball/commands/Camp";

export const data = new SlashCommandBuilder()
  .setName("camp")
  .setDescription("Ativa/desativa modo campeonato.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: undefined }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  const campMode = toggleCampMode(room, `[DISCORD] ${interaction.user.username}`);
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ Modo campeonato \`${campMode ? "ativado" : "desativado"}\`.`, user)] });
}
