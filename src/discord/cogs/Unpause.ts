import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";

export const data = new SlashCommandBuilder()
  .setName("despausar")
  .setDescription("Despausa a partida.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  if (!room.isGameInProgress()) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Não há partida.", user)], flags: MessageFlags.Ephemeral }); return; }
  if (!room.paused) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Não está pausada.", user)], flags: MessageFlags.Ephemeral }); return; }
  room.unpause();
  room.send({ message: `▶️ Partida despausada por ${interaction.user.username}.`, color: 0x90EE90 } as any);
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed("✅ Partida despausada.", user)] });
}
