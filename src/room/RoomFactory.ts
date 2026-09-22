import type { Room } from "haxball-extended-room";
import { HandleModules, HandleCommands, SetRoomMessages } from "../haxball/handler";
import { HotReloader } from "../hot/HotReloader";

interface RoomOptions {
  roomName: string;
  roomNumber: number;
  maxPlayers: number;
  public: boolean;
  token: string;
  geo?: { code: string; lat: number; lon: number };
  proxy?: string;
}

export async function initializeHaxballRoom(
  HBInit: any,
  options: RoomOptions,
): Promise<Room> {
  const { Room } = await import("haxball-extended-room");

  const config: any = {
    roomName: options.roomName,
    maxPlayers: options.maxPlayers,
    public: options.public,
    token: options.token,
    noPlayer: true,
  };

  if (options.geo) config.geo = options.geo;

  const room = new Room(config as any, HBInit);

  room.onRoomLink = (link: string) =>
    console.log(`🔗 Link da sala ${options.roomName}: ${link}`);

  room.state = { roomNumber: options.roomNumber };
  room.lockTeams();
  SetRoomMessages(room);
  HandleModules(room);
  HandleCommands(room);

  const { reloadDiscordCommands } = await import("../discord/Client");

  const reloader = new HotReloader();
  reloader.setRoom(room);
  reloader.setReloadCogs(reloadDiscordCommands);
  reloader.start();

  return room;
}
