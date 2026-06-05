import { initializeDatabase } from "./database/Database";
import { startAllRooms } from "./room/RoomManager";
import { initializeDiscordBot } from "./discord/Client";

async function main() {
  console.log("🚀 Iniciando sistema de salas...");

  try {
    initializeDatabase();
    console.log("✅ Banco de dados SQLite inicializado.");

    await startAllRooms();

    await initializeDiscordBot();
    console.log("✅ Discord bot inicializado.");

    console.log("🎯 Sistema pronto!");
  } catch (error) {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  }
}

main();
