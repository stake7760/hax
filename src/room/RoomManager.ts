import HaxballJS from "haxball.js";
import { Room } from "haxball-extended-room";
import { getRoomConfig } from "../config/env";
import { initializeHaxballRoom } from "./RoomFactory";

const rooms = new Map<string, Room>();
const roomMetadata = new Map<string, { number: number; proxy?: string }>();

async function getHbInit(proxy?: string): Promise<any> {
  return HaxballJS(proxy ? { proxy } : {});
}

function generateRoomName(roomNumber: number, customName?: string): string {
  if (customName) return customName;
  const exp = roomNumber.toString().split("").map(d => ["⁰","¹","²","³","⁴","⁵","⁶","⁷","⁸","⁹"][parseInt(d)]).join("");
  return `Sala ${roomNumber}${exp}`;
}

function getProxyForRoom(roomNumber: number): string | undefined {
  if (roomNumber <= 2) return undefined;
  const proxyIndex = Math.floor((roomNumber - 3) / 2);
  return `http://127.0.0.1:${9050 + proxyIndex}`;
}

export async function startRoom(roomNumber: number, customName?: string): Promise<Room | null> {
  try {
    const config = await getRoomConfig(roomNumber);
    const name = config.name || generateRoomName(roomNumber, customName);
    const proxy = config.proxy || getProxyForRoom(roomNumber);
    const HBInit = await getHbInit(proxy);

    console.log(`🚀 Iniciando ${name}...`);

    const room = await initializeHaxballRoom(HBInit, {
      roomName: name,
      roomNumber,
      maxPlayers: 30,
      public: config.public,
      token: config.token,
      geo: {
        code: process.env.GEO_CODE || "BR",
        lat: parseFloat(process.env.GEO_LAT || "-23.5167"),
        lon: parseFloat(process.env.GEO_LON || "-46.6463"),
      },
      proxy,
    });

    rooms.set(name, room);
    roomMetadata.set(name, { number: roomNumber, proxy });

    console.log(`✅ Sala ${roomNumber} iniciada: ${name}${proxy ? ` (proxy ${proxy})` : ""}`);
    return room;
  } catch (error) {
    console.error(`❌ Erro ao iniciar sala ${roomNumber}:`, error);
    return null;
  }
}

export async function startAllRooms(): Promise<void> {
  const { getActiveRoomCount } = await import("../config/env");
  const count = getActiveRoomCount();
  for (let i = 1; i <= count; i++) {
    await startRoom(i);
  }
}

export function getRoom(name: string): Room | undefined {
  return rooms.get(name);
}

export function getRoomNames(): string[] {
  return Array.from(rooms.keys());
}

export function getRoomList(): { name: string; number: number; proxy?: string }[] {
  return Array.from(roomMetadata.entries()).map(([name, meta]) => ({
    name,
    number: meta.number,
    proxy: meta.proxy,
  }));
}

export function getAllRooms(): Room[] {
  return Array.from(rooms.values());
}

export function stopRoom(name: string): boolean {
  return rooms.delete(name);
}

export function stopAllRooms(): void {
  rooms.clear();
  roomMetadata.clear();
}
