import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, Colors, type EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";
import { formatDiscordPlayer } from "../../utils/discordWebhook";

export const data = new SlashCommandBuilder()
  .setName("players")
  .setDescription("Lista jogadores da sala.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  const players = Array.from(room.players.values());
  if (players.length === 0) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Sala vazia.", user)], flags: MessageFlags.Ephemeral }); return; }
  const red = players.filter((p) => p.team === 1).map((p) => formatDiscordPlayer(p.id, p.name, p.admin ? "👑" : "")).join("\n") || "ㅤ";
  const blue = players.filter((p) => p.team === 2).map((p) => formatDiscordPlayer(p.id, p.name, p.admin ? "👑" : "")).join("\n") || "ㅤ";
  const spec = players.filter((p) => p.team === 0).map((p) => formatDiscordPlayer(p.id, p.name, p.admin ? "👑" : "")).join("\n") || "ㅤ";
  const embed = EmbedFactory.createCustomEmbed(`🎮 Jogadores (${players.length})`, user, Colors.Blue);
  embed.addFields(
    { name: `🔴 RED`, value: red, inline: true },
    { name: `🟢 SPEC`, value: spec, inline: true },
    { name: `🔵 BLUE`, value: blue, inline: true },
  );
  await interaction.reply({ embeds: [embed] });
}
