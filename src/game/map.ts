import { ROOMS } from "./content";
import type { Biome, Lock, MapCell, RoomId, Save } from "./types";

function has(save: Save, lock: Lock) {
  if (lock === "keycard") return save.keycard;
  if (lock === "power") return save.power;
  return save.token;
}

function goalRoom(save: Save): RoomId {
  if (save.token) return "gate";
  if (!save.boots) return "lab";
  if (!save.phase) return "vats";
  if (!save.power) return "hangar";
  if (!save.bossDead) return "choir";
  return "gate";
}

export function survey(save: Save, here: RoomId | null): MapCell[] {
  const visited = new Set(save.visited);
  const heard = new Set<string>();
  const locked = new Set<string>();
  const surveyed = new Set<Biome>(save.surveyed ?? []);
  const pockets = new Set(save.pockets ?? []);
  const goal = goalRoom(save);

  for (const id of visited) {
    const from = ROOMS[id];
    if (!from) continue;
    const dirs = ["left", "right", "down"] as const;
    for (const dir of dirs) {
      const link = from.links[dir];
      if (!link) continue;
      heard.add(link.room);
      const need = from.locks[dir];
      if (need && !has(save, need)) locked.add(link.room);
    }
    for (const lift of from.lifts) {
      if (!lift.to) continue;
      heard.add(lift.to.room);
      if (lift.need && !has(save, lift.need)) locked.add(lift.to.room);
    }
  }

  return Object.values(ROOMS).map((room) => {
    let state: MapCell["state"] = "dark";
    if (here === room.id) state = "here";
    else if (visited.has(room.id)) state = "walked";
    else if (heard.has(room.id) || surveyed.has(room.biome)) state = "heard";
    const doors = [
      ...Object.values(room.links)
        .map((link) => link?.room)
        .filter((id): id is RoomId => !!id),
      ...room.lifts.map((lift) => lift.to?.room).filter((id): id is RoomId => !!id),
    ];
    return {
      id: room.id,
      mx: room.mx ?? 0,
      my: room.my ?? 0,
      role: room.role ?? "route",
      biome: room.biome,
      name: state === "dark" ? "" : room.name,
      stamp: state === "dark" ? "" : (room.stamp ?? ""),
      state,
      locked: state === "heard" && locked.has(room.id),
      doors,
      notch: pockets.has(room.id),
      hint: state !== "dark" && room.id === goal && state !== "here",
    };
  });
}
