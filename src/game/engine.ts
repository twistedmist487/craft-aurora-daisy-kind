import { loadArt, type Art, EMPTY_ART } from "./assets";
import { AudioBus } from "./audio";
import { ROOMS, START, objective, validateRooms } from "./content";
import { survey } from "./map";
import { activeCracks, paintCloset, seedFromSave, type Crack } from "./secrets";
import { FILES } from "./story";
import { SHAFT_STOPS } from "./shaft";
import {
  ACCEL_A,
  ACCEL_G,
  COYOTE,
  DASH_CD,
  DASH_TIME,
  DASH_V,
  FRICTION,
  GRAV_APEX,
  GRAV_FALL,
  GRAV_RISE,
  JUMP_BUFFER,
  JUMP_V,
  MAX_FALL,
  PLAYER_H,
  PLAYER_W,
  RUN,
  SAVE_KEY,
  TILE,
  VIEW_H,
  VIEW_W,
} from "./constants";
import { drawTitle, drawWorld, type DrawSpot, type SpriteBody } from "./render";
import type { ItemKind, Lock, RoomId, Save, Spot, UiSnap } from "./types";

interface Actor extends SpriteBody {
  kind: string;
  hp: number;
  max: number;
  left: number;
  right: number;
  baseY: number;
  cd: number;
  flash: number;
  phaseT: number;
  beam: boolean;
  beamed: boolean;
  alive: boolean;
  elite: boolean;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  friendly: boolean;
  life: number;
  dmg: number;
  r: number;
  heavy?: boolean;
}

interface Item {
  id: string;
  kind: ItemKind;
  x: number;
  y: number;
}

interface Drop {
  id?: string;
  kind: "heal" | "missile" | "scrap";
  amount: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  file?: string;
}

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface TouchState {
  left: boolean;
  right: boolean;
  jump: boolean;
  down: boolean;
  shoot: boolean;
  dash: boolean;
  interact: boolean;
  missile: boolean;
}

const EMPTY_TOUCH: TouchState = {
  left: false,
  right: false,
  jump: false,
  down: false,
  shoot: false,
  dash: false,
  interact: false,
  missile: false,
};

function freshSave(): Save {
  return {
    version: 1,
    room: "gate",
    x: START.x,
    y: START.y,
    hp: 100,
    missiles: 0,
    boots: false,
    phase: false,
    keycard: false,
    cell: false,
    power: false,
    token: false,
    bossDead: false,
    files: [],
    picked: [],
    visited: ["gate"],
    surveyed: [],
    opened: [],
    pockets: [],
    seed: Math.floor(Math.random() * 1e9) || 1,
    checkpoint: { room: "gate", x: START.x, y: START.y },
  };
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onUi: (snap: UiSnap) => void;
  private audio = new AudioBus();
  private art: Art = EMPTY_ART;
  private keys = new Set<string>();
  private edges = new Set<string>();
  private touch: TouchState = { ...EMPTY_TOUCH };
  private prevTouch: TouchState = { ...EMPTY_TOUCH };
  qa: Set<string> | null = null;
  private prevQa = new Set<string>();
  private raf = 0;
  private last = 0;
  private steps = 0;
  private acc = 0;
  private time = 0;
  private save: Save = freshSave();
  private mode: UiSnap["mode"] = "title";
  private fileId: string | null = null;
  private returnMode: UiSnap["mode"] = "play";
  private hasSave = false;
  private tiles: number[][] = [];
  private roomId: RoomId = "gate";
  private cam = { x: 0, y: 0 };
  private snapCam = true;
  private player = this.makePlayer(START.x, START.y);
  private enemies: Actor[] = [];
  private bullets: Bullet[] = [];
  private items: Item[] = [];
  private drops: Drop[] = [];
  private bits: Bit[] = [];
  private coyote = 0;
  private buffer = 0;
  private jumps = 1;
  private drop = 0;
  private dashT = 0;
  private dashCd = 0;
  private shootCd = 0;
  private missileCd = 0;
  private iframes = 0;
  private dead = 0;
  private hitstop = 0;
  private shake = 0;
  private hazardTick = 0;
  private onOneWay = false;
  private jumpHeld = false;
  private phaseLeft = 0;
  private toastText = "";
  private toastT = 0;
  private prompt = "";
  private lastSnap = "";
  private bossHp = 0;
  private bossMax = 0;
  private levelErrors: string[] = [];
  private cracks: Crack[] = [];
  private crackHits = new Map<string, number>();

  constructor(canvas: HTMLCanvasElement, onUi: (snap: UiSnap) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    this.ctx = ctx;
    this.onUi = onUi;
    window.__game = this;
    this.levelErrors = validateRooms();
    this.hasSave = this.readSave();
    this.bindCracks();
    this.bind();
    void loadArt().then((art) => {
      this.art = art;
    });
    this.installProbe();
    this.emit();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("keyup", this.onUp);
    window.removeEventListener("blur", this.onBlur);
    if (window.__controlsTest) delete window.__controlsTest;
  }

  setTouch(partial: Partial<TouchState>) {
    this.touch = { ...this.touch, ...partial };
  }

  start(continued: boolean) {
    try {
      this.audio.unlock();
      if (!continued || !this.hasSave) this.save = freshSave();
      this.bindCracks();
      this.mode = "play";
      this.fileId = null;
      this.enter(this.save.room, this.save.x, this.save.y);
      this.player.hp = this.save.hp;
      this.toast(continued ? "Badge accepted." : "Pager: DESCEND.");
      this.emit();
      this.canvas.focus();
    } catch (err) {
      window.__gameError = err instanceof Error ? err.stack ?? err.message : String(err);
      this.toastText = window.__gameError.slice(0, 180);
      this.mode = "play";
      this.emit();
    }
  }

  closeFile() {
    if (this.mode !== "file") return;
    this.mode = this.returnMode === "pause" ? "pause" : "play";
    this.fileId = null;
    this.emit();
  }

  closeShaft() {
    if (this.mode !== "shaft") return;
    this.mode = "play";
    this.emit();
  }

  rideShaft(id: RoomId) {
    if (this.mode !== "shaft") return;
    const stop = SHAFT_STOPS.find((s) => s.id === id);
    if (!stop || !stop.open(this.save)) return;
    if (stop.id === this.roomId) {
      this.mode = "play";
      this.toast("Already on this landing.");
      this.emit();
      return;
    }
    this.mode = "play";
    this.audio.file();
    this.enter(stop.id, stop.x, stop.y);
    this.toast(`${stop.name} answers.`);
  }

  togglePause() {
    if (this.mode === "play") this.mode = "pause";
    else if (this.mode === "pause") this.mode = "play";
    this.audio.unlock();
    this.emit();
  }

  toggleMute() {
    this.audio.unlock();
    this.audio.toggle();
    this.emit();
  }

  openCodex(id: string) {
    this.returnMode = this.mode === "pause" ? "pause" : "play";
    this.fileId = id;
    this.mode = "file";
    this.emit();
  }

  abandon() {
    localStorage.removeItem(SAVE_KEY);
    this.save = freshSave();
    this.bindCracks();
    this.hasSave = false;
    this.mode = "title";
    this.fileId = null;
    this.emit();
  }

  private makePlayer(x: number, y: number): SpriteBody & { hp: number; flash: number } {
    return {
      x,
      y,
      w: PLAYER_W,
      h: PLAYER_H,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      hp: 100,
      flash: 0,
    };
  }

  private installProbe() {
    window.__controlsTest = {
      getX: () => this.player.x,
      getY: () => this.player.y,
      getYaw: () => 0,
      getSpeed: () => Math.abs(this.player.vx),
      getVx: () => this.player.vx,
      getSteps: () => this.steps,
      getQa: () => (this.qa ? [...this.qa] : null),
      setKeys: (codes: string[]) => {
        this.qa = new Set(codes);
      },
      setSteer: () => {},
    };
  }

  private bind() {
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("keyup", this.onUp);
    window.addEventListener("blur", this.onBlur);
  }

  private onKey = (e: KeyboardEvent) => {
    const block = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"];
    if (block.includes(e.code)) e.preventDefault();
    this.keys.add(e.code);
    if (!e.repeat) this.edges.add(e.code);
  };

  private onUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onBlur = () => {
    this.keys.clear();
    this.edges.clear();
    this.touch = { ...EMPTY_TOUCH };
  };

  private held(code: string) {
    if (this.qa) return this.qa.has(code);
    return this.keys.has(code);
  }

  private actions() {
    const t = this.qa ? EMPTY_TOUCH : this.touch;
    return {
      left: this.held("KeyA") || this.held("ArrowLeft") || t.left,
      right: this.held("KeyD") || this.held("ArrowRight") || t.right,
      jump: this.held("KeyW") || this.held("ArrowUp") || this.held("Space") || t.jump,
      down: this.held("KeyS") || this.held("ArrowDown") || t.down,
      shoot: this.held("KeyJ") || this.held("KeyK") || this.held("KeyX") || t.shoot,
      missile: this.held("KeyM") || t.missile,
      dash: this.held("ShiftLeft") || this.held("ShiftRight") || this.held("KeyC") || t.dash,
      interact: this.held("KeyE") || t.interact,
      pause: this.held("Escape"),
    };
  }

  private edge(codes: string[], touchNow: boolean, touchPrev: boolean) {
    const qa = this.qa;
    if (qa) return codes.some((c) => qa.has(c) && !this.prevQa.has(c));
    if (touchNow && !touchPrev) return true;
    return codes.some((c) => this.edges.has(c));
  }

  private frame = (now: number) => {
    try {
      this.frameInner(now);
    } catch (err) {
      window.__gameError = err instanceof Error ? err.stack ?? err.message : String(err);
      this.toastText = window.__gameError.slice(0, 180);
      this.toastT = 9;
      try {
        this.emit();
      } catch {
        /* ignore */
      }
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private frameInner(now: number) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.resize();
    if (this.mode === "title") {
      this.time += dt;
      this.drawTitle();
      this.emit();
      return;
    }
    if (this.mode === "play") {
      this.acc += dt;
      let n = 0;
      while (this.acc >= 1 / 60 && n < 5) {
        this.step(1 / 60);
        this.acc -= 1 / 60;
        n++;
      }
    }
    if (this.mode === "shaft" && this.edges.has("Escape")) {
      this.edges.clear();
      this.closeShaft();
    }
    this.time += dt;
    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT <= 0) {
        this.toastText = "";
        this.emit();
      }
    }
    this.draw();
    this.emit();
  }

  private resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    const aspect = VIEW_W / VIEW_H;
    let cssW = rect.width;
    let cssH = rect.height;
    if (cssW / cssH > aspect) cssW = cssH * aspect;
    else cssH = cssW / aspect;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const bw = Math.max(2, Math.round(cssW * dpr));
    const bh = Math.max(2, Math.round(cssH * dpr));
    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
    }
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
  }

  private drawTitle() {
    const s = this.canvas.width / VIEW_W;
    this.ctx.setTransform(s, 0, 0, s, 0, 0);
    drawTitle(this.ctx, this.art, this.time);
  }

  private draw() {
    const s = this.canvas.width / VIEW_W;
    this.ctx.setTransform(s, 0, 0, s, 0, 0);
    const room = ROOMS[this.roomId];
    const spots: DrawSpot[] = [
      ...room.terminals.map((t) => ({ x: t.x, y: t.y, kind: "terminal" as const })),
      ...room.lifts.map((t) => ({
        x: t.x,
        y: t.y,
        kind: "lift" as const,
        locked: !!t.need && !this.has(t.need),
      })),
    ];
    if (room.console) spots.push({ x: room.console.x, y: room.console.y, kind: "console" });
    if (room.elevator) {
      spots.push({
        x: room.elevator.x,
        y: room.elevator.y,
        kind: "elevator",
        locked: !this.save.token,
      });
    }
    if (room.kiosk) spots.push({ x: room.kiosk.x, y: room.kiosk.y, kind: "survey" });
    if (room.shaft) spots.push({ x: room.shaft.x, y: room.shaft.y, kind: "shaft" });
    const sh = this.shake;
    this.ctx.save();
    this.ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    drawWorld(
      this.ctx,
      this.art,
      room,
      this.tiles,
      this.cam,
      { ...this.player, flash: this.iframes },
      this.enemies.filter((e) => e.alive),
      this.bullets.map((b) => ({ x: b.x, y: b.y, friendly: b.friendly, heavy: b.heavy })),
      this.items,
      spots,
      this.bits,
      this.time,
      this.save.power,
      this.drops.map((d) => ({ kind: d.kind, x: d.x, y: d.y, life: d.life })),
    );
    this.ctx.restore();
  }

  private step(dt: number) {
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      this.edges.clear();
      return;
    }
    const act = this.actions();
    this.steps += 1;
    const jumpEdge = this.edge(["KeyW", "ArrowUp", "Space"], this.touch.jump, this.prevTouch.jump);
    const shootEdge = this.edge(["KeyJ", "KeyK", "KeyX"], this.touch.shoot, this.prevTouch.shoot);
    const missileEdge = this.edge(["KeyM"], this.touch.missile, this.prevTouch.missile);
    const dashEdge = this.edge(["ShiftLeft", "ShiftRight", "KeyC"], this.touch.dash, this.prevTouch.dash);
    const useEdge = this.edge(["KeyE"], this.touch.interact, this.prevTouch.interact);
    const pauseEdge = this.edges.has("Escape");
    this.prevTouch = { ...this.touch };
    if (this.qa) this.prevQa = new Set(this.qa);
    this.edges.clear();
    if (pauseEdge) {
      this.mode = "pause";
      this.persist();
      return;
    }
    if (this.dead > 0) {
      this.dead -= dt;
      if (this.dead <= 0) this.respawn();
      return;
    }

    const p = this.player;
    if (jumpEdge) this.buffer = JUMP_BUFFER;
    else this.buffer = Math.max(0, this.buffer - dt);

    let dir = 0;
    if (act.left) dir -= 1;
    if (act.right) dir += 1;
    if (dir !== 0) p.facing = dir;
    const accel = p.grounded ? ACCEL_G : ACCEL_A;
    if (this.dashT <= 0) {
      if (dir !== 0) p.vx += dir * accel * dt;
      else if (p.grounded) {
        const f = FRICTION * dt;
        if (Math.abs(p.vx) <= f) p.vx = 0;
        else p.vx -= Math.sign(p.vx) * f;
      }
      const cap = RUN;
      if (p.vx > cap) p.vx = cap;
      if (p.vx < -cap) p.vx = -cap;
    }

    if (dashEdge && this.save.phase && this.dashCd <= 0) {
      this.dashT = DASH_TIME;
      this.phaseLeft = 0.22;
      this.dashCd = DASH_CD;
      p.vx = p.facing * DASH_V;
      p.vy = Math.min(0, p.vy) * 0.25;
      this.audio.dash();
    }
    if (this.dashT > 0) {
      this.dashT -= dt;
      p.vx = p.facing * DASH_V;
      if (this.dashT <= 0) p.vx = p.facing * RUN;
    }
    this.phaseLeft = Math.max(0, this.phaseLeft - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    const phasing = this.phaseLeft > 0;

    if (p.grounded) {
      this.coyote = COYOTE;
      this.jumps = this.save.boots ? 2 : 1;
    } else this.coyote = Math.max(0, this.coyote - dt);

    const wantJump = this.buffer > 0;
    if (wantJump && p.grounded && act.down && this.onOneWay) {
      this.drop = 0.18;
      this.buffer = 0;
      p.grounded = false;
    } else if (wantJump && (this.coyote > 0 || (this.save.boots && this.jumps > 0 && !p.grounded))) {
      if (this.coyote > 0) {
        this.jumps = (this.save.boots ? 2 : 1) - 1;
        this.coyote = 0;
      } else this.jumps -= 1;
      p.vy = JUMP_V;
      p.grounded = false;
      this.buffer = 0;
      this.audio.jump();
    }
    if (this.jumpHeld && !act.jump && p.vy < 0 && this.dashT <= 0) p.vy *= 0.55;
    this.jumpHeld = act.jump;

    let grav = p.vy < 0 ? GRAV_RISE : GRAV_FALL;
    if (Math.abs(p.vy) < 70) grav = GRAV_APEX;
    if (this.dashT > 0) grav *= 0.35;
    p.vy = Math.min(MAX_FALL, p.vy + grav * dt);
    this.drop = Math.max(0, this.drop - dt);

    this.moveX(dt, phasing);
    this.moveY(dt, phasing);
    this.unstick(phasing);
    this.hazards(dt);
    this.shootCd = Math.max(0, this.shootCd - dt);
    if ((shootEdge || act.shoot) && this.shootCd <= 0) {
      this.shootCd = 0.32;
      this.bullets.push({
        x: p.x + (p.facing > 0 ? p.w + 2 : -2),
        y: p.y + 12,
        vx: p.facing * 460,
        vy: 0,
        friendly: true,
        life: 0.62,
        dmg: 12,
        r: 4,
      });
      this.audio.shoot();
    }
    this.missileCd = Math.max(0, this.missileCd - dt);
    if (missileEdge && this.missileCd <= 0) {
      if (this.save.missiles <= 0) this.toast("No missiles. They come off the dead.");
      else {
        this.save.missiles -= 1;
        this.missileCd = 0.42;
        this.bullets.push({
          x: p.x + (p.facing > 0 ? p.w + 2 : -8),
          y: p.y + 10,
          vx: p.facing * 360,
          vy: 0,
          friendly: true,
          life: 0.9,
          dmg: 36,
          r: 8,
          heavy: true,
        });
        this.audio.missile();
        this.persist();
      }
    }
    this.iframes = Math.max(0, this.iframes - dt);
    this.shake = Math.max(0, this.shake - dt * 18);

    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updateBits(dt);
    this.updateDrops(dt);
    this.takeDrops();
    this.notePocket();
    this.transitions();
    if (useEdge) this.interact();
    this.updatePrompt();
    this.followCam(dt);

    if (p.y > this.roomH() + 80) this.kill();
  }

  private roomH() {
    return this.tiles.length * TILE;
  }
  private roomW() {
    return (this.tiles[0]?.length ?? 0) * TILE;
  }

  private tileAt(px: number, py: number) {
    const x = Math.floor(px / TILE);
    const y = Math.floor(py / TILE);
    return this.tiles[y]?.[x] ?? 0;
  }

  private forSolids(
    x: number,
    y: number,
    w: number,
    h: number,
    phasing: boolean,
    fn: (tx: number, ty: number, t: number) => void,
  ) {
    const x0 = Math.floor(x / TILE);
    const y0 = Math.floor(y / TILE);
    const x1 = Math.floor((x + w - 0.01) / TILE);
    const y1 = Math.floor((y + h - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = this.tiles[ty]?.[tx] ?? 0;
        if (t === 0 || t === 2) continue;
        if (t === 4 && phasing) continue;
        fn(tx, ty, t);
      }
    }
  }

  private moveX(dt: number, phasing: boolean) {
    const p = this.player;
    p.x += p.vx * dt;
    this.forSolids(p.x, p.y, p.w, p.h, phasing, (tx, ty) => {
      const rx = tx * TILE;
      const ry = ty * TILE;
      const overlapY = Math.min(p.y + p.h, ry + TILE) - Math.max(p.y, ry);
      if (overlapY < 6) return;
      if (p.vx > 0) {
        p.x = rx - p.w;
        p.vx = 0;
        this.dashT = 0;
      } else if (p.vx < 0) {
        p.x = rx + TILE;
        p.vx = 0;
        this.dashT = 0;
      }
    });
  }

  private moveY(dt: number, phasing: boolean) {
    const p = this.player;
    const prevBottom = p.y + p.h;
    p.y += p.vy * dt;
    let grounded = false;
    let one = false;
    this.forSolids(p.x, p.y, p.w, p.h, phasing, (tx, ty, t) => {
      const rx = tx * TILE;
      const ry = ty * TILE;
      const overlapX = Math.min(p.x + p.w, rx + TILE) - Math.max(p.x, rx);
      if (overlapX < 4) return;
      if (p.vy > 0) {
        p.y = ry - p.h;
        p.vy = 0;
        grounded = true;
      } else if (p.vy < 0) {
        p.y = ry + TILE;
        p.vy = 0;
      }
      void t;
    });
    if (p.vy >= 0 && this.drop <= 0) {
      const x0 = Math.floor(p.x / TILE);
      const x1 = Math.floor((p.x + p.w - 0.01) / TILE);
      const y1 = Math.floor((p.y + p.h - 0.01) / TILE);
      const y0 = Math.floor(prevBottom / TILE);
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          if ((this.tiles[ty]?.[tx] ?? 0) !== 2) continue;
          const top = ty * TILE;
          const overlapX = Math.min(p.x + p.w, (tx + 1) * TILE) - Math.max(p.x, tx * TILE);
          if (overlapX < 4) continue;
          if (prevBottom <= top + 1 && p.y + p.h >= top) {
            p.y = top - p.h;
            p.vy = 0;
            grounded = true;
            one = true;
          }
        }
      }
    }
    p.grounded = grounded;
    this.onOneWay = one;
  }

  private unstick(phasing: boolean) {
    const p = this.player;
    for (let i = 0; i < 6; i++) {
      let hit = false;
      this.forSolids(p.x, p.y, p.w, p.h, phasing, () => {
        hit = true;
      });
      if (!hit) break;
      p.y -= 2;
    }
  }

  private hazards(dt: number) {
    const p = this.player;
    let hot = false;
    const x0 = Math.floor(p.x / TILE);
    const y0 = Math.floor(p.y / TILE);
    const x1 = Math.floor((p.x + p.w - 0.01) / TILE);
    const y1 = Math.floor((p.y + p.h - 0.01) / TILE);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) if (this.tiles[y]?.[x] === 3) hot = true;
    }
    if (hot) {
      this.hazardTick -= dt;
      if (this.hazardTick <= 0) {
        this.hurt(10, p.x, false);
        this.hazardTick = 0.45;
      }
    } else this.hazardTick = 0;
  }

  private hurt(dmg: number, fromX: number, knock = true) {
    if (this.iframes > 0 || this.dead > 0) return;
    this.player.hp = Math.max(0, this.player.hp - dmg);
    this.save.hp = this.player.hp;
    this.iframes = 0.7;
    this.shake = 6;
    this.hitstop = 0.045;
    if (knock) {
      this.player.vy = -160;
      this.player.vx = fromX < this.player.x ? 120 : -120;
    }
    this.audio.hurt();
    if (this.player.hp <= 0) {
      this.dead = 0.7;
      this.toast("Signal lost. Returning to last file.");
    }
  }

  private kill() {
    this.player.hp = 0;
    this.dead = 0.45;
    this.toast("The shaft takes you. Last file still open.");
  }

  private respawn() {
    const c = this.save.checkpoint;
    this.player.hp = 100;
    this.save.hp = 100;
    this.iframes = 1.1;
    this.dead = 0;
    this.enter(c.room, c.x, c.y);
  }

  private updateEnemies(dt: number) {
    const p = this.player;
    let bossHp = 0;
    let bossMax = 0;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.flash = Math.max(0, e.flash - dt);
      if (e.kind === "boss") {
        bossHp = e.hp;
        bossMax = e.max;
        this.updateBoss(e, dt);
      } else if (e.kind === "drone") {
        const speed = 46;
        e.vx = Math.sign(p.x - e.x) * speed;
        e.x += e.vx * dt;
        e.x = Math.max(e.left, Math.min(e.right, e.x));
        e.y = e.baseY + Math.sin(this.time * 2 + e.x * 0.01) * 12;
        e.facing = p.x < e.x ? -1 : 1;
        e.cd -= dt;
        if (e.cd <= 0 && Math.abs(p.x - e.x) < 320) {
          e.cd = 1.8;
          this.aimShot(e.x + e.w / 2, e.y + e.h / 2, 150, 9);
        }
      } else if (e.kind === "crawler") {
        const aggro = Math.abs(p.x - e.x) < 230 && Math.abs(p.y - e.y) < 48;
        const speed = aggro ? 200 : 50;
        if (aggro) e.vx = p.x < e.x ? -speed : speed;
        else if (e.x < e.left || e.x + e.w > e.right) e.vx = -e.vx || speed;
        if (!e.vx) e.vx = speed;
        e.x += e.vx * dt;
        if (e.x < e.left) {
          e.x = e.left;
          e.vx = Math.abs(speed);
        }
        if (e.x > e.right) {
          e.x = e.right;
          e.vx = -Math.abs(speed);
        }
        e.facing = e.vx < 0 ? -1 : 1;
      } else {
        const aggro = Math.abs(p.x - e.x) < 270 && Math.abs(p.y - e.y) < 56;
        if (aggro) {
          e.facing = p.x < e.x ? -1 : 1;
          e.cd -= dt;
          if (e.cd <= 0) {
            e.cd = 1.65;
            this.bullets.push({
              x: e.x + (e.facing > 0 ? e.w : 0),
              y: e.y + 12,
              vx: e.facing * 170,
              vy: 0,
              friendly: false,
              life: 2.2,
              dmg: 10,
              r: 4,
            });
          }
        } else {
          if (!e.vx) e.vx = 60;
          if (e.x < e.left) e.vx = 60;
          if (e.x > e.right) e.vx = -60;
          e.x += e.vx * dt;
          e.facing = e.vx < 0 ? -1 : 1;
        }
      }
      if (this.overlaps(p, e) && e.kind !== "boss") this.hurt(e.kind === "crawler" ? 16 : 12, e.x);
      if (e.kind === "boss" && this.overlaps(p, e)) this.hurt(18, e.x);
    }
    this.bossHp = bossHp;
    this.bossMax = bossMax;
  }

  private updateBoss(e: Actor, dt: number) {
    const p = this.player;
    e.phaseT += dt;
    const cyc = 4.8;
    const t = e.phaseT % cyc;
    if (t < 0.08) e.beamed = false;
    e.facing = p.x < e.x ? -1 : 1;
    if (t < 1.7) {
      e.vx = Math.sign(p.x - e.x) * 40;
      e.cd -= dt;
      if (e.cd <= 0) {
        e.cd = 0.16;
        this.bullets.push({
          x: p.x + (Math.random() - 0.5) * 80,
          y: Math.max(24, e.y - 20),
          vx: (Math.random() - 0.5) * 30,
          vy: 120,
          friendly: false,
          life: 3,
          dmg: 10,
          r: 5,
        });
      }
      e.beam = false;
    } else if (t < 2.9) {
      e.vx = 0;
      e.beam = t > 2.25;
      if (e.beam && !e.beamed) {
        e.beamed = true;
        if (Math.abs(p.y + p.h / 2 - (e.y + e.h / 2)) < 28) this.hurt(16, e.x, false);
      }
    } else {
      e.beam = false;
      e.vx = Math.sign(p.x - e.x) * 150;
    }
    e.x += e.vx * dt;
    e.x = Math.max(e.left, Math.min(e.right, e.x));
    e.y = e.baseY + Math.sin(this.time * 1.4) * 14;
  }

  private aimShot(x: number, y: number, speed: number, dmg: number) {
    const dx = this.player.x + 8 - x;
    const dy = this.player.y + 12 - y;
    const m = Math.hypot(dx, dy) || 1;
    this.bullets.push({
      x,
      y,
      vx: (dx / m) * speed,
      vy: (dy / m) * speed,
      friendly: false,
      life: 2.4,
      dmg,
      r: 4,
    });
  }

  private updateBullets(dt: number) {
    for (const b of this.bullets) {
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const t = this.tileAt(b.x, b.y);
      if (t === 5 && b.friendly) {
        this.chipCrack(b);
        continue;
      }
      if (t === 1 || t === 3 || t === 4 || t === 5) b.life = 0;
      if (b.friendly) {
        for (const e of this.enemies) {
          if (!e.alive) continue;
          if (this.hit(b.x, b.y, b.r, e)) {
            e.hp -= b.dmg;
            e.flash = 0.12;
            b.life = 0;
            this.hitstop = b.heavy ? 0.05 : 0.03;
            this.bits.push({ x: b.x, y: b.y, vx: 40, vy: -40, life: 0.3, color: "#e3a23a" });
            if (e.hp <= 0) this.killEnemy(e);
          }
        }
      } else if (this.hit(b.x, b.y, b.r, this.player)) {
        this.hurt(b.dmg, b.x);
        b.life = 0;
      }
    }
    this.bullets = this.bullets.filter((b) => b.life > 0).slice(-40);
  }

  private killEnemy(e: Actor) {
    e.alive = false;
    this.audio.boom();
    this.shake = e.kind === "boss" ? 8 : 3;
    for (let i = 0; i < 10; i++) {
      this.bits.push({
        x: e.x + e.w / 2,
        y: e.y + e.h / 2,
        vx: (Math.random() - 0.5) * 160,
        vy: (Math.random() - 0.7) * 160,
        life: 0.45,
        color: e.kind === "boss" ? "#e6c98a" : "#c4452d",
      });
    }
    if (e.kind === "boss") {
      this.save.bossDead = true;
      if (!this.save.picked.includes("token-well")) {
        this.items.push({ id: "token-well", kind: "token", x: e.x + 20, y: e.y + 20 });
      }
      this.toast("The margin note stops moving.");
      this.persist();
    }
    this.spill(e);
  }

  private spill(e: Actor) {
    const packs: { id?: string; kind: "heal" | "missile"; amount: number }[] =
      e.kind === "boss"
        ? [
            { id: "boss-heal", kind: "heal", amount: 45 },
            { id: "boss-msl", kind: "missile", amount: 8 },
          ]
        : e.elite
          ? [
              { kind: "heal", amount: 30 },
              { kind: "missile", amount: 4 },
            ]
          : Math.random() < 0.58
            ? [{ kind: "heal", amount: e.kind === "crawler" ? 22 : 16 }]
            : [{ kind: "missile", amount: Math.random() < 0.75 ? 2 : 5 }];
    packs.forEach((pack, i) => {
      if (pack.id && this.save.picked.includes(pack.id)) return;
      this.drops.push({
        id: pack.id,
        kind: pack.kind,
        amount: pack.amount,
        x: e.x + e.w / 2 + (i === 0 ? -8 : 12),
        y: e.y + 8,
        vx: i === 0 ? -36 : 48,
        vy: -150,
        life: pack.id ? 9999 : 16,
      });
    });
  }

  private updateDrops(dt: number) {
    for (const d of this.drops) {
      d.life -= dt;
      d.vy += 980 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vx *= 0.985;
      const col = Math.floor(d.x / TILE);
      const row = Math.floor((d.y + 3) / TILE);
      const t = this.tiles[row]?.[col] ?? 0;
      if ((t === 1 || t === 2 || t === 3) && d.vy > 0) {
        d.y = row * TILE - 2;
        d.vy = 0;
        d.vx *= 0.45;
      }
      if (d.x < 10) d.x = 10;
      if (d.x > this.roomW() - 10) d.x = this.roomW() - 10;
    }
    this.drops = this.drops.filter((d) => d.life > 0 && d.y < this.roomH() + 40);
  }

  private takeDrops() {
    const p = this.player;
    const px = p.x + p.w / 2;
    const py = p.y + p.h / 2;
    let changed = false;
    for (const d of this.drops) {
      if (Math.hypot(d.x - px, d.y - py) > 18) continue;
      if (d.kind === "heal") {
        if (p.hp >= 100) continue;
        const gain = Math.min(d.amount, 100 - p.hp);
        p.hp += gain;
        this.save.hp = p.hp;
        this.toast(`Tissue +${gain}`);
      } else if (d.kind === "scrap") {
        if (d.file && !this.save.files.includes(d.file)) this.save.files.push(d.file);
        this.toast(FILES[d.file ?? ""]?.title ?? "Loose page.");
      } else {
        if (this.save.missiles >= 40) continue;
        const gain = Math.min(d.amount, 40 - this.save.missiles);
        this.save.missiles += gain;
        this.toast(`Missiles +${gain}`);
      }
      if (d.id && !this.save.picked.includes(d.id)) this.save.picked.push(d.id);
      d.life = 0;
      changed = true;
      this.audio.pickup();
    }
    if (changed) {
      this.drops = this.drops.filter((d) => d.life > 0);
      this.persist();
    }
  }

  private updateBits(dt: number) {
    for (const b of this.bits) {
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy += 400 * dt;
    }
    this.bits = this.bits.filter((b) => b.life > 0).slice(-80);
  }

  private overlaps(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  private hit(x: number, y: number, r: number, b: { x: number; y: number; w: number; h: number }) {
    const cx = Math.max(b.x, Math.min(x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(y, b.y + b.h));
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  }

  private transitions() {
    const room = ROOMS[this.roomId];
    const p = this.player;
    const floor = this.tiles.length - 2;
    const doorTop = (floor - 4) * TILE;
    const doorBot = floor * TILE;
    const mid = p.y + p.h / 2;
    const inDoor = mid > doorTop && mid < doorBot + 8;
    if (inDoor && p.x < 0 && room.links.left) this.tryLink("left");
    if (inDoor && p.x + p.w > this.roomW() && room.links.right) this.tryLink("right");
    if (room.hole && p.y + p.h > this.roomH() - 6) {
      const cx = p.x + p.w / 2;
      if (cx > room.hole.x && cx < room.hole.x + room.hole.w && room.links.down) this.tryLink("down");
    }
  }

  private tryLink(dir: "left" | "right" | "down") {
    const room = ROOMS[this.roomId];
    const lock = room.locks[dir];
    if (lock && !this.has(lock)) {
      if (dir === "right") this.player.x = this.roomW() - this.player.w - 6;
      if (dir === "left") this.player.x = 6;
      const msg =
        lock === "keycard" ? "Red keycard. Upper stacks." : lock === "power" ? "Cradle unpowered." : "Clearance missing.";
      this.toast(msg);
      return;
    }
    const link = room.links[dir];
    if (!link) return;
    this.enter(link.room, link.x, link.y);
  }

  private has(lock: Lock) {
    if (lock === "keycard") return this.save.keycard;
    if (lock === "power") return this.save.power;
    return this.save.token;
  }

  private interact() {
    const room = ROOMS[this.roomId];
    const spots: Array<Spot & { kind: string }> = [
      ...room.terminals.map((s) => ({ ...s, kind: "terminal" })),
      ...room.lifts.map((s) => ({ ...s, kind: "lift" })),
    ];
    if (room.console) spots.push({ ...room.console, kind: "console" });
    if (room.elevator) spots.push({ ...room.elevator, kind: "elevator" });
    if (room.kiosk) spots.push({ ...room.kiosk, kind: "survey" });
    if (room.shaft) spots.push({ ...room.shaft, kind: "shaft" });
    let best: (typeof spots)[number] | null = null;
    let bestD = 56;
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h;
    for (const s of spots) {
      const d = Math.hypot(s.x - px, s.y - py);
      if (d < bestD) {
        best = s;
        bestD = d;
      }
    }
    if (!best) return;
    if (best.kind === "terminal" && best.file) {
      if (!this.save.files.includes(best.file)) this.save.files.push(best.file);
      this.save.checkpoint = { room: this.roomId, x: this.player.x, y: this.player.y };
      this.player.hp = 100;
      this.save.hp = 100;
      this.returnMode = "play";
      this.fileId = best.file;
      this.mode = "file";
      this.audio.file();
      this.toast("Filed. You are restored.");
      this.persist();
      return;
    }
    if (best.kind === "lift" && best.to) {
      if (best.need && !this.has(best.need)) {
        this.toast(best.need === "power" ? "Surface lift is dark." : "Clearance missing.");
        return;
      }
      this.audio.file();
      this.enter(best.to.room, best.to.x, best.to.y);
      return;
    }
    if (best.kind === "console") {
      if (!this.save.cell) {
        this.toast("The cradle wants its cell back.");
        return;
      }
      this.save.cell = false;
      this.save.power = true;
      this.openHatch();
      this.audio.pickup();
      this.toast("Shaft live. Omega answers the panel.");
      this.persist();
      return;
    }
    if (best.kind === "elevator") {
      if (!this.save.token) {
        this.toast("Elevator wants a depth token.");
        return;
      }
      this.mode = "ending";
      this.persist();
      return;
    }
    if (best.kind === "survey") {
      const zone = ROOMS[this.roomId].biome;
      if (zone === "choir") return;
      if (!this.save.surveyed.includes(zone)) this.save.surveyed.push(zone);
      this.save.checkpoint = { room: this.roomId, x: this.player.x, y: this.player.y };
      this.player.hp = 100;
      this.save.hp = 100;
      const named =
        zone === "surface" ? "Surface" : zone === "archive" ? "Archive" : zone === "bio" ? "Menagerie" : "Cradle";
      this.toast(`${named} plate stamped. Outlines only.`);
      this.audio.file();
      this.persist();
      return;
    }
    if (best.kind === "shaft") {
      this.mode = "shaft";
      this.audio.file();
      this.emit();
    }
  }

  private openHatch() {
    const hatch = ROOMS[this.roomId].hatch;
    if (!hatch) return;
    for (let y = hatch.y; y < hatch.y + hatch.h; y++) {
      for (let x = hatch.x; x < hatch.x + hatch.w; x++) {
        if (this.tiles[y]?.[x] !== undefined) this.tiles[y][x] = 0;
      }
    }
  }

  private updatePrompt() {
    const room = ROOMS[this.roomId];
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h;
    let prompt = "";
    const near = (s: Spot) => Math.hypot(s.x - px, s.y - py) < 56;
    for (const t of room.terminals) if (near(t)) prompt = "E / USE — read file";
    for (const l of room.lifts) if (near(l)) prompt = l.need === "power" ? "E / USE — surface lift" : "E / USE — service lift";
    if (room.console && near(room.console)) prompt = "E / USE — seat power cell";
    if (room.elevator && near(room.elevator)) prompt = "E / USE — surface elevator";
    if (room.kiosk && near(room.kiosk)) prompt = "E / USE — stamp this zone";
    if (room.shaft && near(room.shaft)) prompt = "E / USE — call the shaft";
    this.prompt = prompt;
  }

  private followCam(dt: number) {
    const p = this.player;
    const look = p.facing * 36;
    let dx = p.x + p.w / 2 - VIEW_W / 2 + look;
    let dy = p.y + p.h / 2 - VIEW_H / 2 - 8;
    const maxX = Math.max(0, this.roomW() - VIEW_W);
    const maxY = Math.max(0, this.roomH() - VIEW_H);
    dx = Math.max(0, Math.min(maxX, dx));
    dy = Math.max(0, Math.min(maxY, dy));
    if (this.snapCam) {
      this.cam.x = dx;
      this.cam.y = dy;
      this.snapCam = false;
    } else {
      const k = 1 - Math.exp(-7 * dt);
      this.cam.x += (dx - this.cam.x) * k;
      this.cam.y += (dy - this.cam.y) * k;
    }
  }

  private enter(room: RoomId, x: number, y: number) {
    this.roomId = room;
    this.tiles = ROOMS[room].tiles.map((row) => row.slice());
    if (ROOMS[room].hatch && !this.save.power) {
      const hatch = ROOMS[room].hatch!;
      for (let yy = hatch.y; yy < hatch.y + hatch.h; yy++) {
        for (let xx = hatch.x; xx < hatch.x + hatch.w; xx++) {
          if (this.tiles[yy]?.[xx] !== undefined) this.tiles[yy][xx] = 1;
        }
      }
    }
    this.crackHits.clear();
    for (const crack of this.cracks) {
      if (crack.room !== room) continue;
      paintCloset(this.tiles, crack, this.save.opened.includes(crack.id));
    }
    this.player.x = x;
    this.player.y = y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.grounded = false;
    this.bullets = [];
    this.bits = [];
    this.drops = [];
    this.rebuild();
    this.seedBossDrops();
    this.seedPockets();
    this.unstick(false);
    if (!this.save.visited.includes(room)) this.save.visited.push(room);
    this.save.room = room;
    this.save.x = x;
    this.save.y = y;
    this.snapCam = true;
    this.audio.setBiome(ROOMS[room].biome);
    this.persist();
    this.toast(ROOMS[room].name);
  }

  private rebuild() {
    const room = ROOMS[this.roomId];
    this.enemies = room.enemies
      .filter((e) => !(e.kind === "boss" && this.save.bossDead))
      .map((e) => {
        const base = e.kind === "boss" ? 210 : e.kind === "crawler" ? 48 : e.kind === "soldier" ? 36 : 24;
        const hp = e.elite ? base * 3 : base;
        return {
          ...e,
          vx: e.kind === "soldier" || e.kind === "crawler" ? 60 : 0,
          vy: 0,
          facing: 1,
          grounded: true,
          hp,
          max: hp,
          cd: 0.6,
          flash: 0,
          phaseT: 0,
          beam: false,
          beamed: false,
          alive: true,
          elite: !!e.elite,
        };
      });
    this.items = room.items
      .filter((i) => !this.save.picked.includes(i.id))
      .map((i) => ({ ...i }));
    if (this.roomId === "choir" && this.save.bossDead && !this.save.picked.includes("token-well")) {
      this.items.push({ id: "token-well", kind: "token", x: 42 * TILE, y: 16 * TILE - 20 });
    }
    this.bossHp = this.enemies.find((e) => e.kind === "boss")?.hp ?? 0;
    this.bossMax = this.bossHp;
  }

  private bindCracks() {
    this.cracks = activeCracks(this.save.seed, ROOMS);
    this.crackHits.clear();
  }

  private chipCrack(b: Bullet) {
    const tx = Math.floor(b.x / TILE);
    const ty = Math.floor(b.y / TILE);
    const floor = this.tiles.length - 2;
    const crack = this.cracks.find(
      (c) => c.room === this.roomId && tx >= c.col && tx < c.col + 6 && (ty === floor - 1 || ty === floor - 2),
    );
    b.life = 0;
    if (!crack || this.save.opened.includes(crack.id)) return;
    const hits = (this.crackHits.get(crack.id) ?? 0) + (b.heavy ? 2 : 1);
    this.crackHits.set(crack.id, hits);
    this.bits.push({ x: b.x, y: b.y, vx: 30, vy: -40, life: 0.25, color: "#c8b89a" });
    if (hits < 3) return;
    this.save.opened.push(crack.id);
    paintCloset(this.tiles, crack, true);
    this.seedPocket(crack);
    this.audio.boom();
    this.shake = 4;
    this.toast("False wall. Something was bricked in.");
    this.persist();
  }

  private seedPockets() {
    for (const crack of this.cracks) {
      if (crack.room === this.roomId && this.save.opened.includes(crack.id)) this.seedPocket(crack);
    }
  }

  private seedPocket(crack: Crack) {
    if (this.save.picked.includes(crack.id) || this.drops.some((d) => d.id === crack.id)) return;
    const x = (crack.col + 3) * TILE;
    const y = (this.tiles.length - 2) * TILE - 14;
    if (crack.loot === "heal") this.drops.push({ id: crack.id, kind: "heal", amount: 40, x, y, vx: 0, vy: 0, life: 9999 });
    else if (crack.loot === "missile")
      this.drops.push({ id: crack.id, kind: "missile", amount: 6, x, y, vx: 0, vy: 0, life: 9999 });
    else this.drops.push({ id: crack.id, kind: "scrap", amount: 0, file: crack.scrap, x, y, vx: 0, vy: 0, life: 9999 });
  }

  private notePocket() {
    const p = this.player;
    for (const crack of this.cracks) {
      if (crack.room !== this.roomId || !this.save.opened.includes(crack.id)) continue;
      const left = (crack.col + 1) * TILE;
      const right = (crack.col + 5) * TILE;
      if (p.x + p.w > left && p.x < right && !this.save.pockets.includes(this.roomId)) {
        this.save.pockets.push(this.roomId);
        this.persist();
      }
    }
  }

  private seedBossDrops() {
    if (this.roomId !== "choir" || !this.save.bossDead) return;
    const y = 16 * TILE - 18;
    if (!this.save.picked.includes("boss-heal")) {
      this.drops.push({ id: "boss-heal", kind: "heal", amount: 45, x: 34 * TILE, y, vx: 0, vy: 0, life: 9999 });
    }
    if (!this.save.picked.includes("boss-msl")) {
      this.drops.push({ id: "boss-msl", kind: "missile", amount: 8, x: 36 * TILE, y, vx: 0, vy: 0, life: 9999 });
    }
  }

  private collect() {
    const p = this.player;
    for (const item of this.items) {
      if (Math.abs(item.x - (p.x + p.w / 2)) < 22 && Math.abs(item.y - (p.y + p.h / 2)) < 26) {
        this.save.picked.push(item.id);
        if (item.kind === "boots") {
          this.save.boots = true;
          this.toast("Servo calves. The floor is a suggestion.");
        } else if (item.kind === "phase") {
          this.save.phase = true;
          this.toast("VEIL shunt. Dash through violet glass. Shift or C.");
        } else if (item.kind === "keycard") {
          this.save.keycard = true;
          this.toast("Red keycard. Intake cage will open.");
        } else if (item.kind === "cell") {
          this.save.cell = true;
          this.toast("Cradle cell. Heavy for its size.");
        } else if (item.kind === "token") {
          this.save.token = true;
          this.toast("Depth token. The surface elevator will take it.");
        }
        this.audio.pickup();
        this.persist();
      }
    }
    this.items = this.items.filter((i) => !this.save.picked.includes(i.id));
  }

  private toast(msg: string) {
    if (this.toastText === msg && this.toastT > 0.5) return;
    this.toastText = msg;
    this.toastT = 2.6;
  }

  private persist() {
    this.save.hp = this.player.hp;
    this.save.x = this.player.x;
    this.save.y = this.player.y;
    this.save.room = this.roomId;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.save));
      this.hasSave = true;
    } catch {
      /* ignore quota */
    }
  }

  private readSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw) as Save;
      if (data.version !== 1 || !ROOMS[data.room]) return false;
      this.save = { ...freshSave(), ...data, visited: data.visited ?? ["gate"] };
      if (typeof data.seed !== "number" || data.seed <= 0) this.save.seed = seedFromSave(this.save.room, this.save.visited);
      this.save.surveyed = data.surveyed ?? [];
      this.save.opened = data.opened ?? [];
      this.save.pockets = data.pockets ?? [];
      this.save.missiles = data.missiles ?? 0;
      return true;
    } catch {
      return false;
    }
  }

  private snapshot(): UiSnap {
    const room = ROOMS[this.roomId];
    return {
      mode: this.mode,
      roomName: this.mode === "title" ? "Perimeter" : room.name,
      depth: this.mode === "title" ? "UNCLEARED" : room.depth,
      hp: this.player.hp,
      maxHp: 100,
      missiles: this.save.missiles,
      boots: this.save.boots,
      phase: this.save.phase,
      keycard: this.save.keycard,
      cell: this.save.cell,
      power: this.save.power,
      token: this.save.token,
      files: this.save.files,
      objective: this.levelErrors.length ? this.levelErrors[0] : objective(this.save),
      toast: this.toastText,
      prompt: this.mode === "play" ? this.prompt : "",
      bossHp: this.bossHp,
      bossMax: this.bossMax,
      hasSave: this.hasSave,
      muted: this.audio.muted,
      fileId: this.fileId,
      visited: this.save.visited,
      fault: this.levelErrors[0] ?? "",
      map: survey(this.save, this.mode === "title" || this.mode === "ending" ? null : this.roomId),
      shaft: SHAFT_STOPS.map((stop) => ({
        id: stop.id,
        name: stop.name,
        line: stop.line,
        open: stop.open(this.save),
        locked: stop.locked,
      })),
    };
  }

  private emit() {
    this.collect();
    const snap = this.snapshot();
    const key = JSON.stringify(snap);
    if (key === this.lastSnap) return;
    this.lastSnap = key;
    this.onUi(snap);
  }
}

declare global {
  interface Window {
    __gameError?: string;
    __game?: unknown;
    __controlsTest?: {
      getX: () => number;
      getY: () => number;
      getYaw: () => number;
      getSpeed: () => number;
      getVx?: () => number;
      getSteps?: () => number;
      getQa?: () => string[] | null;
      setKeys: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
  }
}
