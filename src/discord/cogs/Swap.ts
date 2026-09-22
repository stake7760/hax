import { EmbedFactory } from "../EmbedFactory";
import { type AutocompleteInteraction, type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";

const teamList = ["Red", "Blue", "Spectators"];
const teamMap: Record<string, 0 | 1 | 2> = { Red: 1, Blue: 2, Spectators: 0 };

export const data = new SlashCommandBuilder()
  .setName("trocar")
  .setDescription("Troca jogadores entre dois times.")
  .addStringOption((o) =>
    o.setName("sala").setDescription("Nome da sala.").setRequired(true),
  )
  .addStringOption((o) =>
    o.setName("time1").setDescription("Primeiro time.").setRequired(true).setAutocomplete(true),
  )
  .addStringOption((o) =>
    o.setName("time2").setDescription("Segundo time.").setRequired(true).setAutocomplete(true),
  );

export async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focused = interaction.options.getFocused(true);
  const time1 = interaction.options.getString("time1");

  if (focused.name === "time1") {
    await interaction.respond(teamList.map((t) => ({ name: t, value: t })));
  } else if (focused.name === "time2") {
    const filtered = time1 ? teamList.filter((t) => t !== time1) : teamList;
    await interaction.respond(filtered.map((t) => ({ name: t, value: t })));
  }
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const time1 = interaction.options.getString("time1", true);
  const time2 = interaction.options.getString("time2", true);

  if (time1 === time2) {
    await interaction.reply({ content: "❌ Os times precisam ser diferentes.", ephemeral: true });
    return;
  }

  const room = getRoom(sala);
  if (!room) {
    await interaction.reply({ content: "❌ Sala não encontrada.", ephemeral: true });
    return;
  }

  const teamEmoji: Record<string, string> = { Red: "🔴", Blue: "🔵", Spectators: "🟢" };
  const teamA = teamMap[time1];
  const teamB = teamMap[time2];

  for (const p of Array.from(room.players.values())) {
    if (p.team === teamA) p.team = teamB;
    else if (p.team === teamB) p.team = teamA;
  }

  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  room.send({ message: `🔄 Jogadores trocados entre ${teamEmoji[time1]} ${time1} e ${teamEmoji[time2]} ${time2} por ${interaction.user.username}.`, color: 0xFFA500 } as any);
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ Jogadores trocados entre ${teamEmoji[time1]} \`${time1}\` e ${teamEmoji[time2]} \`${time2}\`.`, user)] });
}