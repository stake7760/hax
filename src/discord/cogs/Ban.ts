import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";
import { bansDb } from "../../database/Database";
import { playerAutocomplete } from "../autocomplete";
import { formatDiscordPlayer } from "../../utils/discordWebhook";

export const data = new SlashCommandBuilder()
  .setName("banir")
  .setDescription("Bane um jogador da sala.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true))
  .addNumberOption((o) => o.setName("player").setDescription("Jogador da sala.").setRequired(true).setAutocomplete(true))
  .addStringOption((o) => o.setName("motivo").setDescription("Motivo do ban.").setRequired(false));

export const autocomplete = playerAutocomplete;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  const playerId = interaction.options.getNumber("player", true);
  const reason = interaction.options.getString("motivo") || "Banido pelo Discord";
  const player = room.players[playerId];
  if (!player) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Jogador não encontrado.", user)], flags: MessageFlags.Ephemeral }); return; }
  player.ban(reason);
  bansDb.insert(player.ip ?? "", player.auth ?? "", player.name ?? "", interaction.user.username, reason ?? "");
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`🚫 ${formatDiscordPlayer(player.id, player.name)} foi banido. Motivo: \`${reason}\``, user)] });
}
