import {
  Client,
  GatewayIntentBits,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import path from "node:path";
import fs from "node:fs";
import { BOT_TOKEN, CLIENT_ID, GUILD_ID } from "../config/env";
import { updateBotInfo } from "./EmbedFactory";
import { registerSlashCommands } from "./register";
import { getRoomList } from "../room/RoomManager";

type Command = {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let commands: Command[] = [];

function roomChoice(interaction: ChatInputCommandInteraction): string | null {
  const sala = interaction.options.getString("sala");
  if (!sala) return null;
  return sala;
}

export function getRoomChoice(interaction: ChatInputCommandInteraction): string | null {
  return roomChoice(interaction);
}

async function loadCommands(): Promise<Command[]> {
  const cogsDir = path.join(__dirname, "cogs");
  if (!fs.existsSync(cogsDir)) {
    fs.mkdirSync(cogsDir, { recursive: true });
    return [];
  }

  const loaded: Command[] = [];
  const files = fs.readdirSync(cogsDir).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

  for (const file of files) {
    try {
      const mod = await import(path.join(cogsDir, file));
      if (mod.data && mod.execute) {
        loaded.push({ data: mod.data, execute: mod.execute, autocomplete: mod.autocomplete });
        console.log(`✅ Cog carregado: ${mod.data.name}`);
      }
    } catch (err) {
      console.error(`❌ Erro ao carregar cog ${file}:`, err);
    }
  }
  return loaded;
}

export async function initializeDiscordBot(): Promise<void> {
  const token = BOT_TOKEN();
  const clientId = CLIENT_ID();
  const guildId = GUILD_ID();

  client.once("clientReady", async () => {
    updateBotInfo(client.user!.username, client.user!.displayAvatarURL({ size: 256 }));
    console.log(`🤖 Logado como ${client.user!.tag}!`);

    commands = await loadCommands();
    console.log(`📦 ${commands.length} comandos carregados`);

    client.on("interactionCreate", async (interaction) => {
      if (interaction.isAutocomplete()) {
        const cmd = commands.find((c) => c.data.name === interaction.commandName);
        if (cmd?.autocomplete) {
          try { await cmd.autocomplete(interaction); } catch {}
        }
        return;
      }

      if (!interaction.isChatInputCommand()) return;

      try {
        const cmd = commands.find((c) => c.data.name === interaction.commandName);
        if (!cmd) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: "❌ Comando não encontrado.", ephemeral: true });
          }
          return;
        }
        await cmd.execute(interaction);
      } catch (error: any) {
        if (error?.code === 10062) return;
        console.error("❌ Erro no comando:", error);
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: "❌ Erro interno.", ephemeral: true });
          }
        } catch {}
      }
    });

    await registerSlashCommands(token, clientId, guildId, commands);
  });

  await client.login(token);
}

export async function reloadDiscordCommands(): Promise<void> {
  const cogsDir = path.join(__dirname, "cogs");
  if (!fs.existsSync(cogsDir)) return;

  const lowerCogsDir = cogsDir.toLowerCase();
  for (const key of Object.keys(require.cache)) {
    if (key.toLowerCase().startsWith(lowerCogsDir)) {
      delete require.cache[key];
    }
  }

  const loaded: Command[] = [];
  const files = fs.readdirSync(cogsDir).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
  for (const file of files) {
    try {
      const mod = await import(path.join(cogsDir, file));
      if (mod.data && mod.execute) {
        loaded.push({ data: mod.data, execute: mod.execute, autocomplete: mod.autocomplete });
        console.log(`✅ Cog recarregado: ${mod.data.name}`);
      }
    } catch (err) {
      console.error(`❌ Erro ao recarregar cog ${file}:`, err);
    }
  }
  commands = loaded;
}

export { client };
