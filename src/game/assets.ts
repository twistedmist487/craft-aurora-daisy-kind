import type { Biome } from "./types";

export interface TileSet {
  floor: HTMLImageElement | null;
  wall: HTMLImageElement | null;
  hazard: HTMLImageElement | null;
}

export interface Art {
  bg: Record<Biome, HTMLImageElement | null>;
  tiles: Record<Biome, TileSet>;
  grate: HTMLImageElement | null;
  glass: HTMLImageElement | null;
  crack: HTMLImageElement | null;
  idle: HTMLImageElement[];
  run: HTMLImageElement[];
  jump: HTMLImageElement[];
  soldier: HTMLImageElement[];
  crawler: HTMLImageElement[];
  drone: HTMLImageElement[];
  boss: HTMLImageElement[];
  shot: HTMLImageElement[];
  items: HTMLImageElement[];
  cell: HTMLImageElement | null;
  terminal: HTMLImageElement | null;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function frames(dir: string, names: string[]) {
  const loaded = await Promise.all(names.map((name) => loadImage(`/game/${dir}/${name}.png`)));
  return loaded.filter((img): img is HTMLImageElement => !!img);
}

async function loadTileSet(biome: Biome): Promise<TileSet> {
  const [floor, wall, hazard] = await Promise.all([
    loadImage(`/game/tiles/${biome}-floor.png`),
    loadImage(`/game/tiles/${biome}-wall.png`),
    loadImage(`/game/tiles/${biome}-hazard.png`),
  ]);
  return { floor, wall, hazard };
}

const EMPTY_SET: TileSet = { floor: null, wall: null, hazard: null };

export async function loadArt(): Promise<Art> {
  const biomes: Biome[] = ["surface", "archive", "bio", "hangar", "choir"];
  const [surface, archive, bio, hangar, choir, cell, terminal, idle, run, jump, soldier, crawler, drone, boss, shot, items, grate, glass, crack, ...sets] =
    await Promise.all([
      loadImage("/game/bg-surface.jpg"),
      loadImage("/game/bg-archive.jpg"),
      loadImage("/game/bg-bio.jpg"),
      loadImage("/game/bg-hangar.jpg"),
      loadImage("/game/bg-choir.jpg"),
      loadImage("/game/cell.png"),
      loadImage("/game/terminal.png"),
      frames("player-idle", ["idle-1", "idle-2", "idle-3", "idle-4"]),
      frames("player-run", ["run-1", "run-2", "run-3", "run-4"]),
      frames("player-jump", ["jump-1", "jump-2", "jump-3", "jump-4"]),
      frames("soldier", ["walk-1", "walk-2", "walk-3", "walk-4"]),
      frames("crawler", ["walk-1", "walk-2", "walk-3", "walk-4"]),
      frames("drone", ["hover-1", "hover-2", "hover-3", "hover-4"]),
      frames("boss", ["idle-1", "idle-2", "idle-3", "idle-4"]),
      frames("shot", ["projectile-1", "projectile-2", "projectile-3", "projectile-4"]),
      frames("items", ["frame-1", "frame-2", "frame-3", "frame-4"]),
      loadImage("/game/tiles/grate.png"),
      loadImage("/game/tiles/glass.png"),
      loadImage("/game/tiles/crack.png"),
      ...biomes.map((biome) => loadTileSet(biome)),
    ]);
  const tiles = Object.fromEntries(biomes.map((biome, i) => [biome, sets[i] as TileSet])) as Record<Biome, TileSet>;
  return {
    bg: { surface, archive, bio, hangar, choir },
    idle,
    run,
    jump,
    soldier,
    crawler,
    drone,
    boss,
    shot,
    items,
    cell,
    terminal,
    tiles,
    grate: grate as HTMLImageElement | null,
    glass: glass as HTMLImageElement | null,
    crack: crack as HTMLImageElement | null,
  };
}

export const EMPTY_ART: Art = {
  bg: { surface: null, archive: null, bio: null, hangar: null, choir: null },
  idle: [],
  run: [],
  jump: [],
  soldier: [],
  crawler: [],
  drone: [],
  boss: [],
  shot: [],
  items: [],
  cell: null,
  terminal: null,
  tiles: {
    surface: { ...EMPTY_SET },
    archive: { ...EMPTY_SET },
    bio: { ...EMPTY_SET },
    hangar: { ...EMPTY_SET },
    choir: { ...EMPTY_SET },
  },
  grate: null,
  glass: null,
  crack: null,
};
