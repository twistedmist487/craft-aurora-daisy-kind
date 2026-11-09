import { onFloor } from "./constants";
import type { RoomId, Save } from "./types";

export interface ShaftStop {
  id: RoomId;
  name: string;
  line: string;
  x: number;
  y: number;
  open: (save: Save) => boolean;
  locked: string;
}

function stop(
  id: RoomId,
  name: string,
  line: string,
  col: number,
  floor: number,
  open: (save: Save) => boolean,
  locked: string,
): ShaftStop {
  return { id, name, line, ...onFloor(col, floor), open, locked };
}

/** Landings of the dead car. Return trips only, except Omega, which answers once the cradle is live. */
export const SHAFT_STOPS: ShaftStop[] = [
  stop("gate", "Surface", "Depth 00 · cover", 6, 14, () => true, ""),
  stop("stacks", "Black Book", "Depth 01 · logistics", 18, 20, (s) => s.visited.includes("stacks"), "Still a hole, not a landing."),
  stop("lab", "Servo", "Depth 01 · the locker", 14, 14, (s) => s.visited.includes("lab"), "The servo landing does not answer."),
  stop("vats", "Blue Book", "Depth 02 · menagerie", 6, 14, (s) => s.visited.includes("vats"), "Biosphere doors stay shut."),
  stop("hangar", "Cradle", "Depth 03 · the disc", 12, 16, (s) => s.visited.includes("hangar"), "Cradle bay has not checked in."),
  stop("choir", "Omega", "Depth 04 · the well", 5, 16, (s) => s.power, "The well waits on a live cradle."),
];
