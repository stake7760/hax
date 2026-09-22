import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";
import { playerAutocomplete } from "../autocomplete";
import { EmbedFactory } from "../EmbedFactory";
import { formatDiscordPlayer } from "../../utils/discordWebhook";

export const data = new SlashCommandBuilder()
  .setName("mensagem")
  .setDescription("Envia mensagens para a sala.")
  .addSubcommand(new SlashCommandSubcommandBuilder()
    .setName("geral")
    .setDescription("Envia mensagem para toda a sala.")
    .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true))
    .addStringOption((o) => o.setName("mensagem").setDescription("Texto da mensagem.").setRequired(true)))
  .addSubcommand(new SlashCommandSubcommandBuilder()
    .setName("time")
    .setDescription("Envia mensagem para um time específico.")
    .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true))
    .addStringOption((o) => o.setName("time").setDescription("Time alvo.").setRequired(true).addChoices({ name: "Red", value: "red" }, { name: "Blue", value: "blue" }, { name: "Spectators", value: "spec" }))
    .addStringOption((o) => o.setName("mensagem").setDescription("Texto.").setRequired(true)))
  .addSubcommand(new SlashCommandSubcommandBuilder()
    .setName("privada")
    .setDescription("Envia PV para um jogador.")
    .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true))
    .addNumberOption((o) => o.setName("player").setDescription("Jogador da sala.").setRequired(true).setAutocomplete(true))
    .addStringOption((o) => o.setName("mensagem").setDescription("Texto.").setRequired(true)));

export const autocomplete = playerAutocomplete;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  const msg = interaction.options.getString("mensagem", true);

  if (sub === "geral") {
    room.send({ message: `📢 [DISCORD] ${msg}`, color: 0xFFFFFF } as any);
    await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ Mensagem enviada: ${msg}`, user)] });
  } else if (sub === "time") {
    const teamStr = interaction.options.getString("time", true);
    const team = teamStr === "red" ? 1 : teamStr === "blue" ? 2 : 0;
    const icon = teamStr === "red" ? "🔴" : teamStr === "blue" ? "🔵" : "🟢";
    let sent = 0;
    for (const p of Array.from(room.players.values())) {
      if (p.team === team) { p.reply({ message: `[${icon} DISCORD]: ${msg}`, color: 0xFFFFFF } as any); sent++; }
    }
    await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ Mensagem enviada para ${sent} jogadores do time ${icon}.`, user)] });
  } else if (sub === "privada") {
    const playerId = interaction.options.getNumber("player", true);
    const target = room.players[playerId];
    if (!target) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Jogador não encontrado.", user)], flags: MessageFlags.Ephemeral }); return; }
    target.reply({ message: `📩 [DISCORD PV]: ${msg}`, color: 0xFFB6C1 } as any);
    await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ PV enviado para ${formatDiscordPlayer(target.id, target.name)}.`, user)] });
  }
}
