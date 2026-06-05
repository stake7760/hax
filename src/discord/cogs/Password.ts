import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";
import { getWebhookUrl } from "../../config/env";
import { sendWebhookJson } from "../../utils/discordWebhook";

export const data = new SlashCommandBuilder()
  .setName("senha")
  .setDescription("Gerencia senha da sala.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true))
  .addStringOption((o) => o.setName("ação").setDescription("Abrir ou fechar.").setRequired(true).addChoices({ name: "Fechar", value: "fechar" }, { name: "Abrir", value: "abrir" }))
  .addStringOption((o) => o.setName("senha").setDescription("Senha (se fechar)").setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: undefined }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  const acao = interaction.options.getString("ação", true);
  if (acao === "fechar") {
    const senha = interaction.options.getString("senha") || process.env.SENHA_PADRAO || "vincere7";
    room.setPassword(senha);
    room.send({ message: `🔒 Sala fechada por ${interaction.user.username}.`, color: 0xFF0000 } as any);
    const url = getWebhookUrl("SENHA_WEBHOOK", (room.state as any).roomNumber);
    if (url) sendWebhookJson(url, { content: `[${room.name}] Sala fechada por \`${interaction.user.username}\`. Senha: **${senha}**` });
    await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`🔒 Sala fechada. Senha: \`${senha}\``, user)] });
  } else {
    room.clearPassword();
    room.send({ message: `🔓 Sala aberta por ${interaction.user.username}.`, color: 0x90EE90 } as any);
    const url = getWebhookUrl("SENHA_WEBHOOK", (room.state as any).roomNumber);
    if (url) sendWebhookJson(url, { content: `[${room.name}] Sala aberta por \`${interaction.user.username}\`.` });
    await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed("🔓 Sala aberta.", user)] });
  }
}
