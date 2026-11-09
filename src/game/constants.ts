export const TILE = 24;
export const VIEW_W = 480;
export const VIEW_H = 270;
export const PLAYER_W = 16;
export const PLAYER_H = 28;

export const GRAV_RISE = 1300;
export const GRAV_FALL = 2800;
export const GRAV_APEX = 700;
export const JUMP_V = -468;
export const MAX_FALL = 700;
export const RUN = 190;
export const ACCEL_G = 2400;
export const ACCEL_A = 1500;
export const FRICTION = 2600;
export const COYOTE = 0.11;
export const JUMP_BUFFER = 0.12;
export const DASH_V = 640;
export const DASH_TIME = 0.16;
export const DASH_CD = 0.78;

export const SAVE_KEY = "site51-below-v1";

export function onFloor(col: number, floorRow: number) {
  return { x: col * TILE + 4, y: floorRow * TILE - PLAYER_H };
}
