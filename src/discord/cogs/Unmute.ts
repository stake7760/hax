import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { mutesDb } from "../../database/Database";
import { getRoom } from "../../room/RoomManager";
import { playerAutocomplete } from "../autocomplete";
import { EmbedFactory } from "../EmbedFactory";
import { formatDiscordPlayer } from "../../utils/discordWebhook";

export const data = new SlashCommandBuilder()
  .setName("desmutar")
  .setDescription("Remove o mute de um jogador.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true))
  .addNumberOption((o) => o.setName("player").setDescription("Jogador da sala.").setRequired(true).setAutocomplete(true));

export const autocomplete = playerAutocomplete;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  const playerId = interaction.options.getNumber("player", true);
  const player = room.players[playerId];
  if (!player) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Jogador não encontrado.", user)], flags: MessageFlags.Ephemeral }); return; }
  mutesDb.remove(player.auth ?? "", player.ip ?? "");
  player.reply({ message: "🔊 Você foi desmutado.", color: 0x00FF00 } as any);
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`🔊 ${formatDiscordPlayer(player.id, player.name)} desmutado.`, user)] });
}
