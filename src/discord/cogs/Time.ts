import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";
import { playerAutocomplete } from "../autocomplete";
import { EmbedFactory } from "../EmbedFactory";
import { formatDiscordPlayer } from "../../utils/discordWebhook";

export const data = new SlashCommandBuilder()
  .setName("time")
  .setDescription("Move um jogador de time.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true))
  .addNumberOption((o) => o.setName("player").setDescription("Jogador da sala.").setRequired(true).setAutocomplete(true))
  .addStringOption((o) => o.setName("lado").setDescription("Novo time.").setRequired(true).addChoices({ name: "Red", value: "red" }, { name: "Blue", value: "blue" }, { name: "Spectators", value: "spectators" }));

export const autocomplete = playerAutocomplete;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  const playerId = interaction.options.getNumber("player", true);
  const lado = interaction.options.getString("lado", true);
  const team = lado === "red" ? 1 : lado === "blue" ? 2 : 0;
  const emoji = lado === "red" ? "🔴" : lado === "blue" ? "🔵" : "🟢";
  const player = room.players[playerId];
  if (!player) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Jogador não encontrado.", user)], flags: MessageFlags.Ephemeral }); return; }
  if (player.team === team) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed(`❌ ${formatDiscordPlayer(player.id, player.name)} já está no time ${emoji}.`, user)], flags: MessageFlags.Ephemeral }); return; }
  player.team = team;
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ ${formatDiscordPlayer(player.id, player.name)} movido para ${emoji}.`, user)] });
}
