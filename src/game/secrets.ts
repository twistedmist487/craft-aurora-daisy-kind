import { TILE } from "./constants";
import type { Biome, RoomDef, RoomId } from "./types";

export type Loot = "heal" | "missile" | "scrap";

export interface Crack {
  id: string;
  room: RoomId;
  biome: Biome;
  col: number;
  loot: Loot;
  scrap: string;
}

const SCRAPS = ["scrap-film", "scrap-lint", "scrap-vial", "scrap-shift"];
const LOOTS: Loot[] = ["heal", "missile", "scrap"];

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function blocked(room: RoomDef) {
  const cols = new Set<number>();
  const mark = (x: number) => {
    const c = Math.floor(x / TILE);
    for (let i = c - 3; i <= c + 3; i++) cols.add(i);
  };
  for (const spot of room.terminals) mark(spot.x);
  for (const spot of room.lifts) mark(spot.x);
  if (room.console) mark(room.console.x);
  if (room.elevator) mark(room.elevator.x);
  if (room.kiosk) mark(room.kiosk.x);
  if (room.shaft) mark(room.shaft.x);
  if (room.markCol != null) mark(room.markCol * TILE);
  for (const item of room.items) mark(item.x);
  return cols;
}

function fits(room: RoomDef, col: number) {
  const tiles = room.tiles;
  const floor = tiles.length - 2;
  const w = tiles[0].length;
  if (col < 8 || col + 6 > w - 8) return false;
  const skip = blocked(room);
  for (let c = col; c < col + 6; c++) {
    if (skip.has(c)) return false;
    if (tiles[floor]?.[c] !== 1) return false;
    if ((tiles[floor - 1]?.[c] ?? 1) !== 0) return false;
    if ((tiles[floor - 2]?.[c] ?? 1) !== 0) return false;
    if ((tiles[floor - 3]?.[c] ?? 1) !== 0) return false;
  }
  return true;
}

export function crackCandidates(rooms: Record<string, RoomDef>): Omit<Crack, "loot" | "scrap">[] {
  const out: Omit<Crack, "loot" | "scrap">[] = [];
  for (const room of Object.values(rooms)) {
    if (room.biome === "choir" || room.id === "choir") continue;
    const w = room.tiles[0].length;
    const from = Math.floor(w * 0.28);
    const to = Math.floor(w * 0.72);
    for (let col = from; col <= to; col += 2) {
      if (!fits(room, col)) continue;
      out.push({ id: `crack-${room.id}-${col}`, room: room.id, biome: room.biome, col });
      break;
    }
  }
  return out;
}

export function activeCracks(seed: number, rooms: Record<string, RoomDef>): Crack[] {
  const rng = mulberry(seed || 1);
  const all = crackCandidates(rooms);
  const picked: Crack[] = [];
  for (const biome of ["surface", "archive", "bio", "hangar"] as Biome[]) {
    const list = all.filter((c) => c.biome === biome);
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const swap = list[i];
      list[i] = list[j];
      list[j] = swap;
    }
    list.slice(0, 2).forEach((c, n) => {
      const loot = LOOTS[Math.floor(rng() * LOOTS.length)];
      picked.push({ ...c, loot, scrap: SCRAPS[(picked.length + n) % SCRAPS.length] });
    });
  }
  return picked;
}

export function paintCloset(tiles: number[][], crack: Crack, open: boolean) {
  const floor = tiles.length - 2;
  const c = crack.col;
  for (let col = c; col < c + 6; col++) tiles[floor - 3][col] = 1;
  for (const row of [floor - 1, floor - 2]) {
    for (let col = c; col < c + 6; col++) tiles[row][col] = open ? 0 : 5;
  }
}

export function installKiosks(rooms: Record<string, RoomDef>) {
  const y = (room: RoomDef) => (room.tiles.length - 2) * TILE;
  rooms.gate.kiosk = { id: "k-surface", x: 28 * TILE, y: y(rooms.gate) };
  rooms.records.kiosk = { id: "k-archive", x: 8 * TILE, y: y(rooms.records) };
  rooms.reliquary.kiosk = { id: "k-bio", x: 30 * TILE, y: y(rooms.reliquary) };
  rooms.hangar.kiosk = { id: "k-hangar", x: 24 * TILE, y: y(rooms.hangar) };
}

export function auditSecrets(rooms: Record<string, RoomDef>): string[] {
  const counts: Record<string, number> = { surface: 0, archive: 0, bio: 0, hangar: 0 };
  for (const c of crackCandidates(rooms)) counts[c.biome] = (counts[c.biome] ?? 0) + 1;
  return Object.entries(counts)
    .filter(([, n]) => n < 2)
    .map(([biome, n]) => `${biome} cracks ${n}`);
}

export function seedFromSave(room: string, visited: string[]) {
  let h = 2166136261;
  const s = `${room}|${visited.join(",")}`;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) || 1;
}
