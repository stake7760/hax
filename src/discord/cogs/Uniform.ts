import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";

export const data = new SlashCommandBuilder()
  .setName("uniforme")
  .setDescription("Configura uniforme do time.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true))
  .addStringOption((o) => o.setName("time").setDescription("Time.").setRequired(true).addChoices({ name: "Red", value: "red" }, { name: "Blue", value: "blue" }, { name: "Ambos", value: "all" }))
  .addIntegerOption((o) => o.setName("ângulo").setDescription("Ângulo (0-180)").setRequired(true).setMinValue(0).setMaxValue(180))
  .addStringOption((o) => o.setName("texto").setDescription("Cor do texto (hex 6 chars)").setRequired(true).setMinLength(6).setMaxLength(6))
  .addStringOption((o) => o.setName("cor1").setDescription("Cor 1 (hex)").setRequired(true).setMinLength(6).setMaxLength(6))
  .addStringOption((o) => o.setName("cor2").setDescription("Cor 2 (hex)").setRequired(false).setMinLength(6).setMaxLength(6))
  .addStringOption((o) => o.setName("cor3").setDescription("Cor 3 (hex)").setRequired(false).setMinLength(6).setMaxLength(6));

function hexToNumber(hex: string): number {
  return Number.parseInt(hex, 16);
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  try {
    const teamStr = interaction.options.getString("time", true);
    const angle = interaction.options.getInteger("ângulo", true);
    const textColor = hexToNumber(interaction.options.getString("texto", true));
    const c1 = hexToNumber(interaction.options.getString("cor1", true));
    const colors = [c1];
    const c2 = interaction.options.getString("cor2");
    const c3 = interaction.options.getString("cor3");
    if (c2) colors.push(hexToNumber(c2));
    if (c3) colors.push(hexToNumber(c3));
    const team = teamStr === "red" ? 1 : teamStr === "blue" ? 2 : "all";
    room.setTeamColors(team, { angle, textColor, colors });
    room.send({ message: `🎨 Uniforme alterado por ${interaction.user.username}.`, color: 0xFFFFFF } as any);
    await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ Uniforme configurado.\nÂngulo: ${angle}°\nCores: ${colors.map((c) => `#${c.toString(16).padStart(6, "0").toUpperCase()}`).join(" → ")}`, user)] });
  } catch (err: any) {
    await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed(`❌ Erro: ${err.message}`, user)], flags: MessageFlags.Ephemeral });
  }
}
