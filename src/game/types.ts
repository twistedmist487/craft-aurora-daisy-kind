export type RoomRole = "route" | "platform" | "combat" | "boss" | "lore";

export type RoomId =
  | "gate"
  | "yard"
  | "stacks"
  | "records"
  | "lab"
  | "vats"
  | "reliquary"
  | "hangar"
  | "choir"
  | "ridge"
  | "fence"
  | "bays"
  | "dish"
  | "vent"
  | "duct"
  | "crypt"
  | "annex"
  | "gantry"
  | "pit"
  | "mezz"
  | "tanks"
  | "pens"
  | "alpha"
  | "serum"
  | "west"
  | "sentry"
  | "shadow"
  | "ante"
  | "chapel"
  | "nave";

export type Biome = "surface" | "archive" | "bio" | "hangar" | "choir";

export type ItemKind = "keycard" | "boots" | "phase" | "token" | "cell";

export type EnemyKind = "soldier" | "drone" | "crawler" | "boss";

export type Lock = "keycard" | "power" | "token";

export interface Link {
  room: RoomId;
  x: number;
  y: number;
}

export interface EnemyDef {
  kind: EnemyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  left: number;
  right: number;
  baseY: number;
  elite?: boolean;
}

export interface ItemDef {
  id: string;
  kind: ItemKind;
  x: number;
  y: number;
}

export interface Spot {
  id: string;
  x: number;
  y: number;
  file?: string;
  to?: Link;
  need?: Lock;
}

export interface Hatch {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RoomDef {
  id: RoomId;
  name: string;
  depth: string;
  biome: Biome;
  role?: RoomRole;
  mx?: number;
  my?: number;
  stamp?: string;
  markCol?: number;
  tiles: number[][];
  links: Partial<Record<"left" | "right" | "down", Link>>;
  locks: Partial<Record<"left" | "right" | "down", Lock>>;
  enemies: EnemyDef[];
  items: ItemDef[];
  terminals: Spot[];
  lifts: Spot[];
  console?: Spot;
  elevator?: Spot;
  hatch?: Hatch;
  hole?: Hatch;
  kiosk?: Spot;
  shaft?: Spot;
}

export interface FileDoc {
  title: string;
  dept: string;
  body: string;
}

export interface Save {
  version: 1;
  room: RoomId;
  x: number;
  y: number;
  hp: number;
  missiles: number;
  boots: boolean;
  phase: boolean;
  keycard: boolean;
  cell: boolean;
  power: boolean;
  token: boolean;
  bossDead: boolean;
  files: string[];
  picked: string[];
  visited: RoomId[];
  surveyed: Biome[];
  opened: string[];
  pockets: string[];
  seed: number;
  checkpoint: { room: RoomId; x: number; y: number };
}

export interface MapCell {
  id: RoomId;
  mx: number;
  my: number;
  role: RoomRole;
  biome: Biome;
  name: string;
  stamp: string;
  state: "here" | "walked" | "heard" | "dark";
  locked: boolean;
  doors: RoomId[];
  notch: boolean;
  hint: boolean;
}

export type Mode = "title" | "play" | "pause" | "file" | "ending" | "shaft";

export interface ShaftChoice {
  id: RoomId;
  name: string;
  line: string;
  open: boolean;
  locked: string;
}

export interface UiSnap {
  mode: Mode;
  roomName: string;
  depth: string;
  hp: number;
  maxHp: number;
  missiles: number;
  boots: boolean;
  phase: boolean;
  keycard: boolean;
  cell: boolean;
  power: boolean;
  token: boolean;
  files: string[];
  objective: string;
  toast: string;
  prompt: string;
  bossHp: number;
  bossMax: number;
  hasSave: boolean;
  muted: boolean;
  fileId: string | null;
  visited: RoomId[];
  fault: string;
  map: MapCell[];
  shaft: ShaftChoice[];
}
