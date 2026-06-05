import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";

export const data = new SlashCommandBuilder()
  .setName("kickrate")
  .setDescription("Define kick rate.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true))
  .addNumberOption((o) => o.setName("min").setDescription("Mínimo.").setRequired(true))
  .addNumberOption((o) => o.setName("rate").setDescription("Rate.").setRequired(true))
  .addNumberOption((o) => o.setName("burst").setDescription("Burst.").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  const min = interaction.options.getNumber("min", true);
  const rate = interaction.options.getNumber("rate", true);
  const burst = interaction.options.getNumber("burst", true);
  room.setKickRateLimit(min, rate, burst);
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`⚙️ Kick rate configurado: \`min=${min}\`, \`rate=${rate}\`, \`burst=${burst}\``, user)] });
}
