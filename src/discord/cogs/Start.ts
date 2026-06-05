import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, Colors } from "discord.js";
import { getRoom } from "../../room/RoomManager";

export const data = new SlashCommandBuilder()
  .setName("iniciar")
  .setDescription("Inicia a partida.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  if (room.isGameInProgress()) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Já existe partida em andamento.", user)], flags: MessageFlags.Ephemeral }); return; }
  room.start();
  room.send({ message: `▶️ Partida iniciada por ${interaction.user.username}.`, color: Colors.White } as any);
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed("✅ Partida iniciada.", user)] });
}
