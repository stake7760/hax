import { REST, Routes } from "discord.js";
import type { SlashCommandBuilder } from "discord.js";
import { getRoomList } from "../room/RoomManager";

export async function registerSlashCommands(
  discordToken: string,
  clientId: string,
  guildId: string,
  commands: { data: SlashCommandBuilder; execute: Function }[],
): Promise<void> {
  const roomChoices = getRoomList().map((r) => ({ name: r.name, value: r.name }));
  const patchChoices = (opts: any[]) => {
    for (const opt of opts) {
      if (opt.name === "sala" && opt.type === 3) {
        opt.choices = roomChoices;
      }
      if ((opt.type === 1 || opt.type === 2) && opt.options) {
        patchChoices(opt.options);
      }
    }
  };
  const body = commands.map((cmd) => {
    const json: any = cmd.data.toJSON();
    if (json.options) patchChoices(json.options);
    return json;
  });

  const rest = new REST({ version: "10" }).setToken(discordToken);
  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
    const registered = (await rest.get(Routes.applicationGuildCommands(clientId, guildId))) as { name: string }[];
    console.log("📋 Comandos registrados:");
    registered.forEach((c, i) => console.log(`${i + 1}: ${c.name}`));
  } catch (error) {
    console.error("❌ Erro ao registrar comandos:", error);
  }
}
