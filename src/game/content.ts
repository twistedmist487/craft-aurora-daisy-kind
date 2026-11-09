import { PLAYER_H, TILE, onFloor } from "./constants";
import type { EnemyDef, EnemyKind, Hatch, Link, RoomDef, RoomId } from "./types";
import { auditWings, installWings } from "./wings";
import { auditSecrets, installKiosks } from "./secrets";

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

function shaft(g: number[][], x: number, w: number, floor: number): Hatch {
  carve(g, x, floor, w, 2);
  return { x: x * TILE, y: floor * TILE, w: w * TILE, h: 2 * TILE };
}

function foe(
  kind: EnemyKind,
  col: number,
  floor: number,
  left: number,
  right: number,
  lift = 0,
): EnemyDef {
  const h = kind === "crawler" ? 22 : kind === "drone" ? 18 : kind === "boss" ? 64 : 32;
  const w = kind === "crawler" ? 32 : kind === "drone" ? 22 : kind === "boss" ? 74 : 22;
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
  };
}

const gateFloor = 14;
const midFloor = 14;
const stackFloor = 20;
const deepFloor = 16;

const gateSpawn = onFloor(6, gateFloor);
const yardSpawn = onFloor(3, midFloor);
const stacksFloorSpawn = onFloor(18, stackFloor);
const recordsSpawn = onFloor(3, midFloor);
const labSpawn = onFloor(14, midFloor);
const vatsSpawn = onFloor(6, midFloor);
const relSpawn = onFloor(4, midFloor);
const hangarSpawn = onFloor(12, deepFloor);
const choirSpawn = onFloor(5, deepFloor);

const SPINE: Record<string, RoomDef> = {
  gate: (() => {
    const w = 40;
    const h = 16;
    const g = grid(w, h);
    sideDoor(g, "r", gateFloor);
    paint(g, 18, 11, 5, 1, 2);
    return {
      id: "gate",
      name: "Perimeter Gate",
      depth: "DEPTH 00",
      biome: "surface",
      tiles: g,
      links: { right: { room: "yard", ...yardSpawn } },
      locks: {},
      enemies: [],
      items: [],
      terminals: [{ id: "t-gate", file: "perimeter", x: 16 * TILE, y: gateFloor * TILE }],
      lifts: [],
      elevator: { id: "exit", x: 3 * TILE, y: gateFloor * TILE, need: "token" },
      shaft: { id: "shaft-gate", x: 22 * TILE, y: gateFloor * TILE },
    } satisfies RoomDef;
  })(),
  yard: (() => {
    const w = 56;
    const h = 16;
    const g = grid(w, h);
    sideDoor(g, "l", midFloor);
    paint(g, 24, midFloor, 4, 1, 3);
    paint(g, 24, 11, 4, 1, 2);
    const hole = shaft(g, 46, 8, midFloor);
    return {
      id: "yard",
      name: "Motor Pool",
      depth: "DEPTH 00",
      biome: "surface",
      tiles: g,
      links: {
        left: { room: "gate", x: 33 * TILE, y: gateSpawn.y },
        down: { room: "stacks", x: 40 * TILE, y: 48 },
      },
      locks: {},
      enemies: [
        foe("soldier", 12, midFloor, 6, 20),
        foe("soldier", 34, midFloor, 30, 42),
      ],
      items: [],
      terminals: [{ id: "t-yard", file: "silvertip", x: 10 * TILE, y: midFloor * TILE }],
      lifts: [],
      hole,
      shaft: { id: "shaft-yard", x: 14 * TILE, y: midFloor * TILE },
    } satisfies RoomDef;
  })(),
  stacks: (() => {
    const w = 48;
    const h = 22;
    const g = grid(w, h);
    sideDoor(g, "r", stackFloor);
    paint(g, 22, 15, 14, 1, 1);
    const hole = shaft(g, 5, 8, stackFloor);
    return {
      id: "stacks",
      name: "Sublevel Stacks",
      depth: "DEPTH 01",
      biome: "archive",
      tiles: g,
      links: {
        right: { room: "records", ...recordsSpawn },
        down: { room: "lab", x: 8 * TILE, y: 40 },
      },
      locks: { right: "keycard" },
      enemies: [foe("drone", 30, stackFloor, 20, 40, 78)],
      items: [{ id: "keycard-mezz", kind: "keycard", x: 28 * TILE, y: 15 * TILE - 18 }],
      terminals: [
        { id: "t-stacks", file: "index", x: 16 * TILE, y: stackFloor * TILE },
        { id: "t-mezz", file: "roster", x: 32 * TILE, y: 15 * TILE },
      ],
      lifts: [{ id: "up-yard", x: 42 * TILE, y: stackFloor * TILE, to: { room: "yard", x: 38 * TILE, y: yardSpawn.y } }],
      hole,
      shaft: { id: "shaft-stacks", x: 36 * TILE, y: stackFloor * TILE },
    } satisfies RoomDef;
  })(),
  records: (() => {
    const w = 36;
    const h = 16;
    const g = grid(w, h);
    sideDoor(g, "l", midFloor);
    return {
      id: "records",
      name: "Intake Cage",
      depth: "DEPTH 01",
      biome: "archive",
      tiles: g,
      links: { left: { room: "stacks", ...stacksFloorSpawn } },
      locks: {},
      enemies: [foe("soldier", 24, midFloor, 16, 30)],
      items: [],
      terminals: [{ id: "t-records", file: "intake", x: 18 * TILE, y: midFloor * TILE }],
      lifts: [],
    } satisfies RoomDef;
  })(),
  lab: (() => {
    const w = 50;
    const h = 16;
    const g = grid(w, h);
    paint(g, 18, 11, 8, 1, 1);
    paint(g, 30, midFloor, 3, 1, 3);
    const hole = shaft(g, 40, 8, midFloor);
    return {
      id: "lab",
      name: "Servo Lab",
      depth: "DEPTH 01",
      biome: "archive",
      tiles: g,
      links: { down: { room: "vats", x: 8 * TILE, y: 36 } },
      locks: {},
      enemies: [foe("drone", 22, midFloor, 14, 32, 64)],
      items: [{ id: "boots-lab", kind: "boots", x: 21 * TILE, y: 11 * TILE - 18 }],
      terminals: [{ id: "t-lab", file: "legerdemain", x: 8 * TILE, y: midFloor * TILE }],
      lifts: [
        {
          id: "up-stacks",
          x: 4 * TILE,
          y: midFloor * TILE,
          to: { room: "stacks", x: 20 * TILE, y: stacksFloorSpawn.y },
        },
      ],
      hole,
      shaft: { id: "shaft-lab", x: 26 * TILE, y: midFloor * TILE },
    } satisfies RoomDef;
  })(),
  vats: (() => {
    const w = 54;
    const h = 16;
    const g = grid(w, h);
    paint(g, 16, midFloor, 3, 1, 3);
    paint(g, 24, 9, 10, 1, 1);
    paint(g, 36, 1, 1, 13, 4);
    sideDoor(g, "r", midFloor);
    paint(g, 39, 11, 13, 1, 2);
    const hole = shaft(g, 42, 8, midFloor);
    return {
      id: "vats",
      name: "Menagerie",
      depth: "DEPTH 02",
      biome: "bio",
      tiles: g,
      links: {
        right: { room: "reliquary", ...relSpawn },
        down: { room: "hangar", x: 10 * TILE, y: 40 },
      },
      locks: {},
      enemies: [foe("crawler", 8, midFloor, 3, 14), foe("crawler", 22, midFloor, 18, 33)],
      items: [{ id: "phase-vats", kind: "phase", x: 28 * TILE, y: 9 * TILE - 18 }],
      terminals: [{ id: "t-vats", file: "menagerie", x: 6 * TILE, y: midFloor * TILE }],
      lifts: [
        {
          id: "up-lab",
          x: 4 * TILE,
          y: midFloor * TILE,
          to: { room: "lab", ...labSpawn },
        },
      ],
      hole,
      shaft: { id: "shaft-vats", x: 38 * TILE, y: midFloor * TILE },
    } satisfies RoomDef;
  })(),
  reliquary: (() => {
    const w = 40;
    const h = 16;
    const g = grid(w, h);
    sideDoor(g, "l", midFloor);
    paint(g, 18, 11, 8, 1, 2);
    return {
      id: "reliquary",
      name: "Gold Annex",
      depth: "DEPTH 02",
      biome: "bio",
      tiles: g,
      links: { left: { room: "vats", x: 51 * TILE, y: vatsSpawn.y } },
      locks: {},
      enemies: [foe("drone", 26, midFloor, 16, 34, 70)],
      items: [],
      terminals: [{ id: "t-rel", file: "capacitor", x: 14 * TILE, y: midFloor * TILE }],
      lifts: [],
    } satisfies RoomDef;
  })(),
  hangar: (() => {
    const w = 58;
    const h = 18;
    const g = grid(w, h);
    paint(g, 16, 13, 8, 1, 1);
    const hole = shaft(g, 46, 8, deepFloor);
    return {
      id: "hangar",
      name: "Cradle Bay",
      depth: "DEPTH 03",
      biome: "hangar",
      tiles: g,
      links: {
        down: { room: "choir", x: 8 * TILE, y: 42 },
      },
      locks: { down: "power" },
      enemies: [
        foe("drone", 28, deepFloor, 18, 40, 80),
        foe("soldier", 36, deepFloor, 30, 44),
      ],
      items: [{ id: "cell-hangar", kind: "cell", x: 19 * TILE, y: 13 * TILE - 18 }],
      terminals: [{ id: "t-hangar", file: "forgetting", x: 8 * TILE, y: deepFloor * TILE }],
      lifts: [
        {
          id: "up-vats",
          x: 4 * TILE,
          y: deepFloor * TILE,
          to: { room: "vats", x: 8 * TILE, y: vatsSpawn.y },
        },
        {
          id: "up-gate",
          x: 10 * TILE,
          y: deepFloor * TILE,
          to: { room: "gate", ...gateSpawn },
          need: "power",
        },
      ],
      console: { id: "cradle", x: 40 * TILE, y: deepFloor * TILE },
      hatch: { x: hole.x / TILE, y: deepFloor, w: 8, h: 2 },
      hole,
      shaft: { id: "shaft-hangar", x: 18 * TILE, y: deepFloor * TILE },
    } satisfies RoomDef;
  })(),
  choir: (() => {
    const w = 56;
    const h = 18;
    const g = grid(w, h);
    paint(g, 14, deepFloor, 3, 1, 3);
    paint(g, 24, deepFloor, 3, 1, 3);
    paint(g, 34, deepFloor, 3, 1, 3);
    paint(g, 14, 13, 3, 1, 2);
    paint(g, 24, 13, 3, 1, 2);
    paint(g, 34, 12, 4, 1, 2);
    return {
      id: "choir",
      name: "The Well",
      depth: "DEPTH 04",
      biome: "choir",
      tiles: g,
      links: {},
      locks: {},
      enemies: [foe("boss", 42, deepFloor, 32, 50, 120)],
      items: [],
      terminals: [{ id: "t-choir", file: "minutes", x: 8 * TILE, y: deepFloor * TILE }],
      lifts: [
        {
          id: "up-hangar",
          x: 4 * TILE,
          y: deepFloor * TILE,
          to: { room: "hangar", ...hangarSpawn },
        },
      ],
      shaft: { id: "shaft-choir", x: 30 * TILE, y: deepFloor * TILE },
    } satisfies RoomDef;
  })(),
};

installWings(SPINE);
installKiosks(SPINE);
export const ROOMS = SPINE as Record<RoomId, RoomDef>;

export const START = gateSpawn;

export const ROOM_LIST = Object.keys(ROOMS) as RoomId[];

export function objective(s: {
  boots: boolean;
  phase: boolean;
  power: boolean;
  bossDead: boolean;
  token: boolean;
}): string {
  if (s.token) return "Surface elevator at the gate. Any shaft panel still answers.";
  if (!s.boots) return "Servo lab, off the core. The locker already has your badge number.";
  if (!s.phase) return "Menagerie. The violet glass does not open for hands.";
  if (!s.power) return "Cradle bay. Seat the cell and the well answers the shaft.";
  if (!s.bossDead) return "Below the saucer. Do not finish the sentence in the glass.";
  return "Take the token from the well and call the shaft home.";
}

export function validateRooms(): string[] {
  const errors: string[] = [];
  for (const room of Object.values(ROOMS)) {
    const h = room.tiles.length;
    const w = room.tiles[0]?.length ?? 0;
    if (room.tiles.some((row) => row.length !== w)) errors.push(`${room.id} ragged`);
    const links = Object.entries(room.links) as Array<[string, Link]>;
    for (const [dir, link] of links) {
      if (!ROOMS[link.room]) errors.push(`${room.id} ${dir} missing room`);
    }
    if (room.hole) {
      const down = room.links.down;
      if (!down) errors.push(`${room.id} hole without down link`);
    }
  }
  errors.push(...auditWings(ROOMS));
  errors.push(...auditSecrets(ROOMS));
  if (!gateSpawn.y || PLAYER_H < 1) errors.push("spawn");
  return errors;
}
