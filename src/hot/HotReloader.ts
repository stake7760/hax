import fs from "node:fs";
import path from "node:path";
import type { Room } from "haxball-extended-room";

const WATCH_DIRS = [
  path.resolve(__dirname, "../haxball"),
  path.resolve(__dirname, "../discord/cogs"),
  path.resolve(__dirname, "../clip"),
  path.resolve(__dirname, "../utils"),
];

const COGS_DIR = path.resolve(__dirname, "../discord/cogs").toLowerCase();

export class HotReloader {
  private static instances = new Set<HotReloader>();
  private static watchers: fs.FSWatcher[] = [];
  private static debounceTimer: NodeJS.Timeout | null = null;
  private room: Room | null = null;
  private reloadCogs: (() => Promise<void>) | null = null;

  setRoom(room: Room): void {
    this.room = room;
  }

  setReloadCogs(fn: () => Promise<void>): void {
    this.reloadCogs = fn;
  }

  start(): void {
    HotReloader.instances.add(this);
    if (HotReloader.watchers.length > 0) return;

    for (const dir of WATCH_DIRS) {
      if (!fs.existsSync(dir)) continue;
      const watcher = fs.watch(dir, { recursive: true }, () => {
        if (HotReloader.debounceTimer) clearTimeout(HotReloader.debounceTimer);
        HotReloader.debounceTimer = setTimeout(() => {
          let reloadCogs = true;
          for (const reloader of HotReloader.instances) {
            reloader.refresh(reloadCogs);
            reloadCogs = false;
          }
        }, 300);
      });
      HotReloader.watchers.push(watcher);
    }
    console.log("🔄 Hot Reload ativo — alterações em modules/commands/cogs/clip/utils serão aplicadas sem reiniciar.");
  }

  private refresh(reloadCogs: boolean): void {
    if (!this.room) return;
    try {
      const clearPrefixes = [
        path.resolve(__dirname, "../haxball").toLowerCase(),
        path.resolve(__dirname, "../clip").toLowerCase(),
        path.resolve(__dirname, "../utils").toLowerCase(),
        COGS_DIR,
      ];
      for (const key of Object.keys(require.cache)) {
        const lower = key.toLowerCase();
        if (clearPrefixes.some((p) => lower.startsWith(p))) {
          delete require.cache[key];
        }
      }

      for (const mod of this.room.modules) {
        this.room.removeModule(mod.name);
      }
      for (const cmd of this.room.commands) {
        this.room.removeCommand(cmd.name);
      }

      const handler = require("../haxball/handler") as typeof import("../haxball/handler");
      handler.SetRoomMessages(this.room);
      handler.HandleModules(this.room);
      handler.HandleCommands(this.room);

      if (reloadCogs && this.reloadCogs) {
        this.reloadCogs().catch((err: unknown) => console.error("❌ Erro ao recarregar cogs:", err));
      }

      console.log(`🔄 Hot Reload aplicado (${new Date().toLocaleTimeString()})`);
    } catch (err) {
      console.error("❌ Erro no Hot Reload:", err);
    }
  }

  stop(): void {
    HotReloader.instances.delete(this);
    if (HotReloader.instances.size > 0) return;

    for (const w of HotReloader.watchers) {
      w.close();
    }
    HotReloader.watchers = [];
    if (HotReloader.debounceTimer) clearTimeout(HotReloader.debounceTimer);
    HotReloader.debounceTimer = null;
  }
}
