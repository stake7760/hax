import type { AutocompleteInteraction } from "discord.js";
import { getRoom } from "../room/RoomManager";

export async function playerAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const sala = interaction.options.getString("sala");
  const room = sala ? getRoom(sala) : undefined;
  if (!room) {
    await interaction.respond([]);
    return;
  }

  const focused = String(interaction.options.getFocused() ?? "").toLowerCase();
  const choices = Array.from(room.players.values())
    .map((player) => ({
      name: `[${player.id}] ${player.name}`.slice(0, 100),
      value: player.id,
      searchable: `${player.id} ${player.name}`.toLowerCase(),
    }))
    .filter((choice) => !focused || choice.searchable.includes(focused))
    .slice(0, 25)
    .map(({ name, value }) => ({ name, value }));

  await interaction.respond(choices);
}
