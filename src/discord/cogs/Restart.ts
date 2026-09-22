import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";

export const data = new SlashCommandBuilder()
  .setName("reiniciar")
  .setDescription("Reinicia a partida.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: undefined }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  room.stop();
  room.start();
  room.send({ message: `🔄 Partida reiniciada por ${interaction.user.username}.`, color: 0xFFA500 } as any);
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed("✅ Partida reiniciada.", user)] });
}
