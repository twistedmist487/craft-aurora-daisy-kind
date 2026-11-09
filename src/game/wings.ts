import { PLAYER_H, TILE, onFloor } from "./constants";
import type { Biome, EnemyDef, EnemyKind, RoomDef, RoomId, RoomRole } from "./types";

function grid(w: number, h: number): number[][] {
  const g = Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? 1 : 0)),
  );
  for (let x = 0; x < w; x++) g[h - 2][x] = 1;
  return g;
}

function carve(g: number[][], x: number, y: number, w: number, h: number) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      if (g[j]?.[i] !== undefined) g[j][i] = 0;
    }
  }
}

function paint(g: number[][], x: number, y: number, w: number, h: number, t: number) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      if (g[j]?.[i] !== undefined) g[j][i] = t;
    }
  }
}

function sideDoor(g: number[][], side: "l" | "r", floor: number) {
  const x = side === "l" ? 0 : g[0].length - 1;
  carve(g, x, floor - 4, 1, 4);
}

function foe(
  kind: EnemyKind,
  col: number,
  floor: number,
  left: number,
  right: number,
  lift = 0,
  elite = false,
): EnemyDef {
  const h = kind === "crawler" ? 22 : kind === "drone" ? 18 : 32;
  const w = kind === "crawler" ? 32 : kind === "drone" ? 22 : 22;
  const y = floor * TILE - h - lift;
  return {
    kind,
    x: col * TILE,
    y,
    w,
    h,
    left: left * TILE,
    right: right * TILE,
    baseY: y,
    ...(elite ? { elite: true } : {}),
  };
}

interface Spec {
  id: RoomId;
  name: string;
  depth: string;
  biome: Biome;
  role: RoomRole;
  mx: number;
  my: number;
  w: number;
  h: number;
  open: "l" | "r" | "lr";
}

const WINGS: Spec[] = [
  { id: "ridge", name: "Fence Cut", depth: "DEPTH 00", biome: "surface", role: "platform", mx: 0, my: 0, w: 48, h: 18, open: "r" },
  { id: "fence", name: "Wire Run", depth: "DEPTH 00", biome: "surface", role: "platform", mx: 1, my: 0, w: 44, h: 16, open: "lr" },
  { id: "bays", name: "Motor Bays", depth: "DEPTH 00", biome: "surface", role: "combat", mx: 4, my: 0, w: 44, h: 16, open: "lr" },
  { id: "dish", name: "Dish Yard", depth: "DEPTH 00", biome: "surface", role: "platform", mx: 5, my: 0, w: 46, h: 18, open: "l" },
  { id: "vent", name: "Exhaust Vent", depth: "DEPTH 01", biome: "archive", role: "platform", mx: 1, my: 1, w: 42, h: 16, open: "r" },
  { id: "duct", name: "Return Duct", depth: "DEPTH 01", biome: "archive", role: "platform", mx: 2, my: 1, w: 44, h: 16, open: "lr" },
  { id: "crypt", name: "Dead Files", depth: "DEPTH 01", biome: "archive", role: "combat", mx: 5, my: 1, w: 42, h: 16, open: "lr" },
  { id: "annex", name: "Annex Stack", depth: "DEPTH 01", biome: "archive", role: "platform", mx: 6, my: 1, w: 44, h: 18, open: "l" },
  { id: "gantry", name: "Servo Gantry", depth: "DEPTH 01", biome: "archive", role: "platform", mx: 2, my: 2, w: 48, h: 18, open: "r" },
  { id: "pit", name: "Test Pit", depth: "DEPTH 01", biome: "archive", role: "combat", mx: 4, my: 2, w: 42, h: 16, open: "lr" },
  { id: "mezz", name: "Mezzanine", depth: "DEPTH 01", biome: "archive", role: "platform", mx: 5, my: 2, w: 44, h: 16, open: "l" },
  { id: "tanks", name: "Tank Walk", depth: "DEPTH 02", biome: "bio", role: "platform", mx: 2, my: 3, w: 50, h: 18, open: "r" },
  { id: "pens", name: "Open Pens", depth: "DEPTH 02", biome: "bio", role: "combat", mx: 5, my: 3, w: 44, h: 16, open: "lr" },
  { id: "alpha", name: "Specimen Alpha", depth: "DEPTH 02", biome: "bio", role: "boss", mx: 6, my: 3, w: 48, h: 16, open: "lr" },
  { id: "serum", name: "Serum Stair", depth: "DEPTH 02", biome: "bio", role: "platform", mx: 7, my: 3, w: 42, h: 18, open: "l" },
  { id: "west", name: "Gantry West", depth: "DEPTH 03", biome: "hangar", role: "platform", mx: 2, my: 4, w: 46, h: 18, open: "r" },
  { id: "sentry", name: "Sentry Line", depth: "DEPTH 03", biome: "hangar", role: "combat", mx: 4, my: 4, w: 44, h: 16, open: "lr" },
  { id: "shadow", name: "Disc Shadow", depth: "DEPTH 03", biome: "hangar", role: "boss", mx: 5, my: 4, w: 50, h: 16, open: "l" },
  { id: "ante", name: "Well Mouth", depth: "DEPTH 04", biome: "choir", role: "platform", mx: 2, my: 5, w: 44, h: 16, open: "r" },
  { id: "chapel", name: "Side Chapel", depth: "DEPTH 04", biome: "choir", role: "combat", mx: 4, my: 5, w: 42, h: 16, open: "lr" },
  { id: "nave", name: "Glass Nave", depth: "DEPTH 04", biome: "choir", role: "platform", mx: 5, my: 5, w: 46, h: 18, open: "l" },
];

function stampFor(role: RoomRole) {
  if (role === "platform") return "placeholder · jumps";
  if (role === "combat") return "placeholder · contact";
  if (role === "boss") return "placeholder · warden";
  return "placeholder";
}

function dress(g: number[][], role: RoomRole, floor: number, w: number, tall: boolean) {
  if (role === "platform") {
    paint(g, 9, floor - 2, 2, 2, 1);
    paint(g, 14, floor - 2, 6, 1, 2);
    paint(g, 22, floor - 3, 5, 1, 2);
    if (w > 40) paint(g, 30, floor - 2, Math.min(6, w - 36), 1, 2);
    if (tall) paint(g, 20, floor - 5, 4, 1, 2);
    paint(g, Math.min(18, w - 12), floor, 3, 1, 3);
    return;
  }
  if (role === "combat") {
    paint(g, Math.floor(w / 2) - 4, floor - 2, 8, 1, 2);
    return;
  }
  if (role === "boss") {
    paint(g, 8, floor - 2, 5, 1, 2);
    paint(g, Math.floor(w / 2) - 3, floor - 3, 6, 1, 2);
    paint(g, w - 14, floor - 2, 5, 1, 2);
  }
}

function stock(spec: Spec, floor: number): EnemyDef[] {
  const w = spec.w;
  if (spec.role === "boss") {
    if (spec.biome === "bio") {
      return [
        foe("soldier", Math.floor(w * 0.58), floor, 8, w - 8, 0, true),
        foe("crawler", Math.floor(w * 0.32), floor, 6, w - 8),
      ];
    }
    return [
      foe("soldier", Math.floor(w * 0.58), floor, 8, w - 8, 0, true),
      foe("drone", Math.floor(w * 0.34), floor, 6, w - 8, 76),
    ];
  }
  if (spec.role !== "combat") return [];
  if (spec.biome === "bio") {
    return [
      foe("crawler", 12, floor, 6, Math.floor(w * 0.55)),
      foe("crawler", Math.floor(w * 0.62), floor, Math.floor(w * 0.4), w - 7),
    ];
  }
  if (spec.biome === "hangar" || spec.biome === "choir") {
    return [
      foe("soldier", 11, floor, 6, w - 8),
      foe("drone", Math.floor(w * 0.62), floor, 8, w - 8, 64),
    ];
  }
  return [
    foe("soldier", 10, floor, 6, Math.floor(w * 0.7)),
    foe("soldier", Math.floor(w * 0.62), floor, Math.floor(w * 0.35), w - 7),
  ];
}

function safeMark(g: number[][], floor: number, w: number) {
  for (const c of [8, 11, 14, 18, w - 10]) {
    if (g[floor]?.[c] === 1) return c;
  }
  return 8;
}

function buildWing(spec: Spec): RoomDef {
  const floor = spec.h - 2;
  const g = grid(spec.w, spec.h);
  if (spec.open.includes("l")) sideDoor(g, "l", floor);
  if (spec.open.includes("r")) sideDoor(g, "r", floor);
  dress(g, spec.role, floor, spec.w, spec.h >= 18);
  return {
    id: spec.id,
    name: spec.name,
    depth: spec.depth,
    biome: spec.biome,
    role: spec.role,
    mx: spec.mx,
    my: spec.my,
    stamp: stampFor(spec.role),
    markCol: safeMark(g, floor, spec.w),
    tiles: g,
    links: {},
    locks: {},
    enemies: stock(spec, floor),
    items: [],
    terminals: [],
    lifts: [],
  };
}

function openSide(room: RoomDef, side: "l" | "r") {
  sideDoor(room.tiles, side, room.tiles.length - 2);
}

function bridge(room: RoomDef, col: number, row: number, w: number) {
  paint(room.tiles, col, row, w, 1, 2);
}

function spawnNear(room: RoomDef, side: "l" | "r") {
  const floor = room.tiles.length - 2;
  const w = room.tiles[0].length;
  const cols: number[] = [];
  if (side === "l") {
    for (let c = 1; c < Math.min(w - 2, 18); c++) cols.push(c);
  } else {
    for (let c = w - 2; c >= Math.max(1, w - 18); c--) cols.push(c);
  }
  for (const c of cols) {
    if (room.tiles[floor]?.[c] === 1 && (room.tiles[floor - 1]?.[c] ?? 1) === 0) return onFloor(c, floor);
  }
  return onFloor(side === "l" ? 3 : Math.max(2, w - 4), floor);
}

function join(rooms: Record<string, RoomDef>, leftId: RoomId, rightId: RoomId) {
  const left = rooms[leftId];
  const right = rooms[rightId];
  if (!left || !right) throw new Error(`missing join ${leftId}-${rightId}`);
  if (left.links.right || right.links.left) throw new Error(`busy ${leftId}-${rightId}`);
  left.links.right = { room: rightId, ...spawnNear(right, "l") };
  right.links.left = { room: leftId, ...spawnNear(left, "r") };
}

const SPINE: Record<string, { role: RoomRole; mx: number; my: number; stamp: string; markCol: number }> = {
  gate: { role: "route", mx: 2, my: 0, stamp: "core · cover", markCol: 12 },
  yard: { role: "combat", mx: 3, my: 0, stamp: "core · surface", markCol: 18 },
  stacks: { role: "lore", mx: 3, my: 1, stamp: "core · black book", markCol: 22 },
  records: { role: "lore", mx: 4, my: 1, stamp: "live · files", markCol: 14 },
  lab: { role: "route", mx: 3, my: 2, stamp: "core · servo", markCol: 12 },
  vats: { role: "combat", mx: 3, my: 3, stamp: "core · blue book", markCol: 10 },
  reliquary: { role: "lore", mx: 4, my: 3, stamp: "live · files", markCol: 12 },
  hangar: { role: "route", mx: 3, my: 4, stamp: "core · cradle", markCol: 14 },
  choir: { role: "boss", mx: 3, my: 5, stamp: "core · omega", markCol: 20 },
};

export function installWings(rooms: Record<string, RoomDef>) {
  for (const spec of WINGS) rooms[spec.id] = buildWing(spec);
  for (const [id, meta] of Object.entries(SPINE)) Object.assign(rooms[id], meta);

  openSide(rooms.gate, "l");
  openSide(rooms.yard, "r");
  bridge(rooms.yard, 38, 11, 17);
  openSide(rooms.stacks, "l");
  bridge(rooms.stacks, 1, 17, 16);
  openSide(rooms.records, "r");
  openSide(rooms.lab, "l");
  openSide(rooms.lab, "r");
  bridge(rooms.lab, 34, 11, 16);
  openSide(rooms.vats, "l");
  openSide(rooms.reliquary, "r");
  openSide(rooms.hangar, "l");
  openSide(rooms.hangar, "r");
  bridge(rooms.hangar, 40, 13, 18);
  openSide(rooms.choir, "l");
  openSide(rooms.choir, "r");

  join(rooms, "ridge", "fence");
  join(rooms, "fence", "gate");
  join(rooms, "yard", "bays");
  join(rooms, "bays", "dish");
  join(rooms, "vent", "duct");
  join(rooms, "duct", "stacks");
  join(rooms, "records", "crypt");
  join(rooms, "crypt", "annex");
  join(rooms, "gantry", "lab");
  join(rooms, "lab", "pit");
  join(rooms, "pit", "mezz");
  join(rooms, "tanks", "vats");
  join(rooms, "reliquary", "pens");
  join(rooms, "pens", "alpha");
  join(rooms, "alpha", "serum");
  join(rooms, "west", "hangar");
  join(rooms, "hangar", "sentry");
  join(rooms, "sentry", "shadow");
  join(rooms, "ante", "choir");
  join(rooms, "choir", "chapel");
  join(rooms, "chapel", "nave");
}

function feetOk(room: RoomDef, x: number, y: number) {
  if (y < 120) return true;
  const row = Math.round((y + PLAYER_H) / TILE);
  const col = Math.floor((x + 8) / TILE);
  const floor = room.tiles[row]?.[col];
  const body = room.tiles[row - 1]?.[col] ?? 1;
  return (floor === 1 || floor === 2 || floor === 3) && body !== 1;
}

export function auditWings(rooms: Record<string, RoomDef>): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  if (Object.keys(rooms).length < 30) errors.push(`rooms ${Object.keys(rooms).length}`);
  for (const room of Object.values(rooms)) {
    if (room.mx === undefined || room.my === undefined || !room.role) errors.push(`${room.id} unplaced`);
    const key = `${room.mx},${room.my}`;
    if (seen.has(key)) errors.push(`stack ${key}`);
    seen.add(key);
    for (const [dir, link] of Object.entries(room.links)) {
      if (!link) continue;
      const dest = rooms[link.room];
      if (!dest) {
        errors.push(`${room.id} ${dir} missing`);
        continue;
      }
      if (!feetOk(dest, link.x, link.y)) errors.push(`${room.id} ${dir} lands badly in ${dest.id}`);
    }
  }
  return errors;
}
