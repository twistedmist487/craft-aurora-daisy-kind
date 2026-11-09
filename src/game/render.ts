import type { Art } from "./assets";
import { TILE, VIEW_H, VIEW_W } from "./constants";
import type { Biome, ItemKind, RoomDef, RoomRole } from "./types";

export interface SpriteBody {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: number;
  grounded: boolean;
  kind?: string;
  hp?: number;
  flash?: number;
  beam?: boolean;
}

export interface DrawItem {
  kind: ItemKind;
  x: number;
  y: number;
}

export interface DrawBullet {
  x: number;
  y: number;
  friendly: boolean;
  heavy?: boolean;
}

export interface DrawDrop {
  kind: "heal" | "missile" | "scrap";
  x: number;
  y: number;
  life: number;
}

export interface DrawBit {
  x: number;
  y: number;
  life: number;
  color: string;
}

export interface DrawSpot {
  x: number;
  y: number;
  kind: "terminal" | "lift" | "console" | "elevator" | "survey" | "shaft";
  locked?: boolean;
}

const PAL: Record<Biome, { front: string; top: string; rivet: string; hazard: string }> = {
  surface: { front: "#3c3934", top: "#8a8172", rivet: "#c8b89a", hazard: "#6a4a28" },
  archive: { front: "#3a414c", top: "#8d97a6", rivet: "#d5dde8", hazard: "#3f6a32" },
  bio: { front: "#243028", top: "#6d8068", rivet: "#c6d2b4", hazard: "#2f6a28" },
  hangar: { front: "#2c3440", top: "#7d8b9c", rivet: "#d0d7e0", hazard: "#8a5a20" },
  choir: { front: "#2a241c", top: "#7a7058", rivet: "#e6c98a", hazard: "#5a3c78" },
};

function blit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  flip = false,
) {
  if (!img) return;
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  if (flip) {
    ctx.translate(Math.round(x + w / 2), Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(img, Math.round(-w / 2), 0, w, h);
  } else {
    ctx.drawImage(img, Math.round(x), Math.round(y), w, h);
  }
  ctx.restore();
}

function frameAt(list: HTMLImageElement[], time: number, fps: number) {
  if (!list.length) return null;
  const i = Math.floor(time * fps) % list.length;
  return list[i];
}

const ROLE_TITLE: Record<RoomRole, string> = {
  route: "TRANSIT",
  platform: "JUMP BAY",
  combat: "CONTACT",
  boss: "WARDEN",
  lore: "FILES",
};

function drawFloorMark(ctx: CanvasRenderingContext2D, room: RoomDef) {
  if (!room.role || room.role === "route") return;
  const floor = room.tiles.length - 2;
  const col = room.markCol ?? 10;
  const x = col * TILE;
  const y = floor * TILE;
  ctx.save();
  ctx.translate(x, y - 4);
  ctx.fillStyle = "rgba(7,8,12,0.72)";
  ctx.fillRect(0, -16, 78, 14);
  ctx.fillStyle =
    room.role === "combat" ? "#c4452d" : room.role === "boss" ? "#e6c98a" : room.role === "lore" ? "#d5dde8" : "#e3a23a";
  ctx.fillRect(0, -16, 3, 14);
  ctx.font = "9px 'IBM Plex Mono', monospace";
  ctx.fillText(ROLE_TITLE[room.role], 6, -6);
  ctx.restore();
}

function drawRoomTab(ctx: CanvasRenderingContext2D, room: RoomDef) {
  if (!room.role) return;
  const title = ROLE_TITLE[room.role];
  const sub = room.stamp ?? "";
  ctx.font = "11px 'IBM Plex Mono', monospace";
  const tw = Math.max(ctx.measureText(title).width, ctx.measureText(sub).width);
  ctx.fillStyle = "rgba(7,8,12,0.82)";
  ctx.fillRect(8, 8, tw + 18, 30);
  ctx.fillStyle = room.role === "combat" ? "#c4452d" : room.role === "boss" ? "#e6c98a" : "#e3a23a";
  ctx.fillRect(8, 8, 3, 30);
  ctx.fillText(title, 16, 20);
  ctx.font = "9px 'IBM Plex Mono', monospace";
  ctx.fillStyle = "#8a8478";
  ctx.fillText(sub, 16, 32);
}

export function drawTitle(ctx: CanvasRenderingContext2D, art: Art, time: number) {
  ctx.fillStyle = "#07080c";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const img = art.bg.surface;
  if (!img) return;
  ctx.imageSmoothingEnabled = true;
  const w = VIEW_W * 1.25;
  const h = w * (img.height / img.width);
  const x = -((time * 8) % (w - VIEW_W));
  const y = VIEW_H - h + 10;
  ctx.drawImage(img, x, y, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, "rgba(7,8,12,0.15)");
  g.addColorStop(0.55, "rgba(7,8,12,0.05)");
  g.addColorStop(1, "rgba(7,8,12,0.72)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  art: Art,
  room: RoomDef,
  tiles: number[][],
  cam: { x: number; y: number },
  player: SpriteBody,
  enemies: SpriteBody[],
  bullets: DrawBullet[],
  items: DrawItem[],
  spots: DrawSpot[],
  bits: DrawBit[],
  time: number,
  powered: boolean,
  drops: DrawDrop[] = [],
) {
  const roomW = tiles[0].length * TILE;
  const roomH = tiles.length * TILE;
  ctx.fillStyle = "#07080c";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const img = art.bg[room.biome];
  ctx.imageSmoothingEnabled = true;
  if (img) {
    const imgW = Math.max(roomW * 1.08, VIEW_W * 1.15);
    const imgH = imgW * (img.height / img.width);
    const baseX = (roomW - imgW) / 2 + cam.x * 0.22;
    const baseY = roomH - imgH + 18;
    ctx.save();
    ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
    ctx.drawImage(img, baseX, baseY, imgW, imgH);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
  const pal = PAL[room.biome];
  const floor = tiles.length - 2;

  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[0].length; x++) {
      const t = tiles[y][x];
      if (!t) continue;
      const px = x * TILE;
      const py = y * TILE;
      if (px + TILE < cam.x - 20 || px > cam.x + VIEW_W + 20 || py + TILE < cam.y - 20 || py > cam.y + VIEW_H + 20) {
        continue;
      }
      if (t === 2) {
        if (art.grate) blit(ctx, art.grate, px, py, TILE, TILE);
        else {
          ctx.fillStyle = pal.top;
          ctx.fillRect(px, py, TILE, 6);
          ctx.fillStyle = "#e3a23a";
          ctx.fillRect(px, py, TILE, 2);
        }
        continue;
      }
      if (t === 4) {
        if (art.glass) {
          ctx.save();
          ctx.globalAlpha = 0.82;
          blit(ctx, art.glass, px, py, TILE, TILE);
          ctx.restore();
        } else {
          const a = 0.28 + Math.sin(time * 6 + y) * 0.08;
          ctx.fillStyle = `rgba(168, 146, 255, ${a})`;
          ctx.fillRect(px + 4, py, TILE - 8, TILE);
        }
        ctx.fillStyle = "rgba(230, 220, 255, 0.8)";
        const sy = (time * 40 + y * 10) % TILE;
        ctx.fillRect(px + 6, py + sy, TILE - 12, 2);
        continue;
      }
      if (t === 5) {
        if (art.crack) blit(ctx, art.crack, px, py, TILE, TILE);
        else {
          ctx.fillStyle = "#4a4034";
          ctx.fillRect(px, py, TILE, TILE);
          ctx.strokeStyle = "#c8b89a";
          ctx.beginPath();
          ctx.moveTo(px + 4, py + 3);
          ctx.lineTo(px + TILE - 5, py + TILE - 4);
          ctx.moveTo(px + TILE - 6, py + 5);
          ctx.lineTo(px + 6, py + TILE - 5);
          ctx.stroke();
        }
        continue;
      }
      const set = art.tiles[room.biome];
      const above = tiles[y - 1]?.[x] ?? 0;
      const cap = above === 0 || above === 2 || above === 4;
      const img = t === 3 ? set?.hazard : cap ? set?.floor : set?.wall;
      if (img) {
        blit(ctx, img, px, py, TILE, TILE);
      } else {
        ctx.fillStyle = t === 3 ? pal.hazard : pal.front;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = t === 3 ? (room.biome === "choir" ? "#b9a0dc" : "#8dce6a") : pal.top;
        ctx.fillRect(px, py, TILE, 5);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(px, py + TILE - 3, TILE, 3);
        ctx.fillStyle = pal.rivet;
        ctx.fillRect(px + 4, py + 9, 2, 2);
        ctx.fillRect(px + TILE - 6, py + 9, 2, 2);
      }
      const lip = y === floor && (tiles[y][x - 1] === 0 || tiles[y][x + 1] === 0);
      if (lip || (room.hatch && !powered && x >= room.hatch.x && x < room.hatch.x + room.hatch.w && y === room.hatch.y)) {
        ctx.fillStyle = "#e3a23a";
        ctx.fillRect(px + 3, py + 1, 5, 2);
        ctx.fillRect(px + 12, py + 1, 5, 2);
      }
    }
  }

  drawFloorMark(ctx, room);

  for (const spot of spots) {
    if (spot.kind === "terminal") {
      blit(ctx, art.terminal, spot.x - 26, spot.y - 58, 52, 60, false);
    } else if (spot.kind === "survey") {
      ctx.fillStyle = "#1c2430";
      ctx.fillRect(spot.x - 18, spot.y - 22, 36, 22);
      ctx.strokeStyle = "#e3a23a";
      ctx.strokeRect(spot.x - 18, spot.y - 22, 36, 22);
      ctx.fillStyle = "#8a8478";
      for (let i = 0; i < 3; i++) ctx.fillRect(spot.x - 12 + i * 8, spot.y - 14, 5, 5);
    } else if (spot.kind === "shaft") {
      ctx.fillStyle = "#14181f";
      ctx.fillRect(spot.x - 11, spot.y - 48, 22, 48);
      ctx.strokeStyle = "#e3a23a";
      ctx.strokeRect(spot.x - 11, spot.y - 48, 22, 48);
      ctx.fillStyle = "#e3a23a";
      ctx.fillRect(spot.x - 1, spot.y - 42, 2, 30);
      ctx.fillStyle = "#8a8478";
      ctx.fillRect(spot.x - 8, spot.y - 8, 6, 3);
      ctx.fillRect(spot.x + 2, spot.y - 8, 6, 3);
    } else if (spot.kind === "console" || spot.kind === "elevator" || spot.kind === "lift") {
      ctx.fillStyle = spot.locked ? "#3a2a28" : "#2a3140";
      ctx.fillRect(spot.x - 16, spot.y - 8, 32, 8);
      ctx.fillStyle = spot.locked ? "#c4452d" : "#e3a23a";
      ctx.fillRect(spot.x - 14, spot.y - 14, 28, 6);
    }
  }

  for (const d of drops) {
    if (d.life < 3 && Math.floor(time * 8) % 2 === 0) continue;
    const bob = Math.sin(time * 4 + d.x) * 2;
    if (d.kind === "heal") {
      ctx.fillStyle = "#c4452d";
      ctx.fillRect(d.x - 1, d.y - 8 + bob, 3, 14);
      ctx.fillRect(d.x - 6, d.y - 3 + bob, 13, 3);
    } else if (d.kind === "scrap") {
      ctx.fillStyle = "#e6e1d6";
      ctx.fillRect(d.x - 7, d.y - 10 + bob, 14, 16);
      ctx.fillStyle = "#8a8478";
      ctx.fillRect(d.x - 4, d.y - 6 + bob, 8, 1);
      ctx.fillRect(d.x - 4, d.y - 3 + bob, 8, 1);
    } else {
      ctx.fillStyle = "#e3a23a";
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - 8 + bob);
      ctx.lineTo(d.x + 6, d.y + 4 + bob);
      ctx.lineTo(d.x - 6, d.y + 4 + bob);
      ctx.fill();
    }
  }

  for (const item of items) {
    const bob = Math.sin(time * 3 + item.x) * 3;
    if (item.kind === "cell") blit(ctx, art.cell, item.x - 16, item.y - 28 + bob, 32, 32);
    else {
      const idx = item.kind === "keycard" ? 0 : item.kind === "boots" ? 1 : item.kind === "phase" ? 2 : 3;
      blit(ctx, art.items[idx], item.x - 16, item.y - 30 + bob, 32, 32);
    }
  }

  for (const b of bullets) {
    if (b.heavy) {
      ctx.fillStyle = "#e6c98a";
      ctx.fillRect(b.x - 7, b.y - 3, 16, 6);
      ctx.fillStyle = "#c4452d";
      ctx.fillRect(b.x - 2, b.y - 1, 6, 3);
      continue;
    }
    const img = frameAt(art.shot, time, 12);
    ctx.save();
    if (!b.friendly) ctx.filter = "hue-rotate(150deg) saturate(1.4)";
    blit(ctx, img, b.x - 14, b.y - 8, 28, 16, false);
    ctx.restore();
  }

  for (const e of enemies) {
    const set =
      e.kind === "soldier" ? art.soldier : e.kind === "crawler" ? art.crawler : e.kind === "boss" ? art.boss : art.drone;
    const fps = e.kind === "boss" ? 4 : 8;
    const img = frameAt(set, time + e.x * 0.01, fps) ?? set[0];
    const dw = e.kind === "boss" ? 140 : e.kind === "crawler" ? 72 : e.kind === "drone" ? 48 : 60;
    const dh = e.kind === "boss" ? 140 : e.kind === "crawler" ? 56 : e.kind === "drone" ? 48 : 60;
    const feet = e.y + e.h;
    ctx.globalAlpha = e.flash && e.flash > 0 && Math.floor(time * 30) % 2 === 0 ? 0.45 : 1;
    if (e.kind === "drone" || e.kind === "boss") {
      blit(ctx, img, e.x + e.w / 2 - dw / 2, e.y + e.h / 2 - dh / 2, dw, dh, e.facing < 0);
    } else {
      blit(ctx, img, e.x + e.w / 2 - dw / 2, feet - dh + 14, dw, dh, e.facing < 0);
    }
    ctx.globalAlpha = 1;
    if (e.beam) {
      ctx.fillStyle = "rgba(230, 210, 140, 0.35)";
      ctx.fillRect(0, e.y + e.h / 2 - 8, roomW, 16);
    }
  }

  const pImg = playerSprite(art, player, time);
  const blink = player.flash && player.flash > 0 && Math.floor(time * 24) % 2 === 0;
  ctx.globalAlpha = blink ? 0.35 : 1;
  blit(ctx, pImg, player.x + player.w / 2 - 30, player.y + player.h - 50, 60, 60, player.facing < 0);
  ctx.globalAlpha = 1;

  for (const bit of bits) {
    ctx.globalAlpha = Math.max(0, bit.life);
    ctx.fillStyle = bit.color;
    ctx.fillRect(bit.x, bit.y, 3, 3);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  const veil = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  veil.addColorStop(0, "rgba(7,8,12,0.28)");
  veil.addColorStop(0.2, "rgba(7,8,12,0)");
  veil.addColorStop(0.78, "rgba(7,8,12,0)");
  veil.addColorStop(1, "rgba(7,8,12,0.35)");
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawRoomTab(ctx, room);
}

function playerSprite(art: Art, player: SpriteBody, time: number) {
  if (!player.grounded && art.jump.length) {
    let i = 3;
    if (player.vy < -220) i = 1;
    else if (player.vy < 40) i = 2;
    return art.jump[i] ?? art.jump[0];
  }
  if (Math.abs(player.vx) > 22 && art.run.length) return frameAt(art.run, time, 10);
  return frameAt(art.idle, time, 4) ?? art.idle[0] ?? null;
}
