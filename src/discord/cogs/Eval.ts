import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";

const OWNER_ROLE = "1508631754825535589";

export const data = new SlashCommandBuilder()
  .setName("eval")
  .setDescription("Executa código na sala.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true))
  .addStringOption((o) => o.setName("código").setDescription("Código JS.").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(interaction.member as any)?.roles?.cache?.has(OWNER_ROLE)) {
    await interaction.reply({ content: "❌ Apenas pessoas autorizadas podem usar este comando.", flags: MessageFlags.Ephemeral });
    return;
  }
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  try {
    const code = interaction.options.getString("código", true);
    const result = eval(code);
    await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ Resultado: ${JSON.stringify(result)}`, user)] });
  } catch (err: any) {
    await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed(`❌ Erro: ${err.message}`, user)], flags: MessageFlags.Ephemeral });
  }
}
