import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";
import { chatEnabled, setChatEnabled, specEnabled, setSpecEnabled } from "../../haxball/commands/Chat";

export const data = new SlashCommandBuilder()
  .setName("chat")
  .setDescription("Ativa/desativa chat.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true))
  .addStringOption((o) => o.setName("tipo").setDescription("Tipo de chat.").setRequired(true).addChoices({ name: "Spectators", value: "spec" }, { name: "Red e Blue", value: "players" }))
  .addStringOption((o) => o.setName("ação").setDescription("Ativar/desativar.").setRequired(true).addChoices({ name: "Ativar", value: "on" }, { name: "Desativar", value: "off" }));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  const tipo = interaction.options.getString("tipo", true);
  const acao = interaction.options.getString("ação", true);

  if (tipo === "spec") {
    if (acao === "on") { if (specEnabled) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Já ativado.", user)], flags: MessageFlags.Ephemeral }); return; } setSpecEnabled(true); }
    else { if (!specEnabled) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Já desativado.", user)], flags: MessageFlags.Ephemeral }); return; } setSpecEnabled(false); }
    await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ Chat spec ${acao === "on" ? "ativado" : "desativado"}.`, user)] });
  } else {
    if (acao === "on") { if (chatEnabled) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Já ativado.", user)], flags: MessageFlags.Ephemeral }); return; } setChatEnabled(true); }
    else { if (!chatEnabled) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Já desativado.", user)], flags: MessageFlags.Ephemeral }); return; } setChatEnabled(false); }
    await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ Chat players ${acao === "on" ? "ativado" : "desativado"}.`, user)] });
  }
}
