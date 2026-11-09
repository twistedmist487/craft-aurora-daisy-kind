import { useEffect, useRef, useState } from "react";
import { Game } from "@/game/engine";
import { FILES } from "@/game/story";
import type { MapCell, UiSnap } from "@/game/types";

const GLYPH: Record<MapCell["role"], string> = {
  route: "T",
  platform: "J",
  combat: "X",
  boss: "W",
  lore: "F",
};

function SitePlate({ cells, big }: { cells: MapCell[]; big?: boolean }) {
  const visible = cells.filter((cell) => cell.state !== "dark");
  if (!visible.length) return null;
  const minX = Math.min(...visible.map((cell) => cell.mx));
  const minY = Math.min(...visible.map((cell) => cell.my));
  const maxX = Math.max(...visible.map((cell) => cell.mx));
  const maxY = Math.max(...visible.map((cell) => cell.my));
  const size = big ? 26 : 14;
  const gap = big ? 8 : 4;
  const step = size + gap;
  const width = (maxX - minX) * step + size;
  const height = (maxY - minY) * step + size;
  const bridges: { key: string; x: number; y: number; w: number; h: number; locked: boolean }[] = [];
  for (const a of visible) {
    for (const b of visible) {
      const joined = a.doors.includes(b.id) || b.doors.includes(a.id);
      if (!joined) continue;
      if (b.mx === a.mx + 1 && b.my === a.my) {
        bridges.push({
          key: `${a.id}-${b.id}-h`,
          x: (a.mx - minX) * step + size,
          y: (a.my - minY) * step + size / 2 - 1,
          w: gap,
          h: 2,
          locked: a.locked || b.locked,
        });
      }
      if (b.my === a.my + 1 && b.mx === a.mx) {
        bridges.push({
          key: `${a.id}-${b.id}-v`,
          x: (a.mx - minX) * step + size / 2 - 1,
          y: (a.my - minY) * step + size,
          w: 2,
          h: gap,
          locked: a.locked || b.locked,
        });
      }
    }
  }
  const here = visible.find((cell) => cell.state === "here");
  const walked = visible.filter((cell) => cell.state === "walked" || cell.state === "here").length;
  return (
    <div className={big ? "plate big" : "plate"}>
      <div
        className="plate-grid"
        style={{ width, height }}
        role="img"
        aria-label={`${walked} panels walked${here ? `, now in ${here.name}` : ""}`}
      >
        {bridges.map((bridge) => (
          <i
            key={bridge.key}
            className={bridge.locked ? "bridge locked" : "bridge"}
            style={{ left: bridge.x, top: bridge.y, width: bridge.w, height: bridge.h }}
          />
        ))}
        {visible.map((cell) => (
          <span
            key={cell.id}
            className={`cell ${cell.state} ${cell.role} ${cell.biome}${cell.locked ? " locked" : ""}${cell.hint ? " hint" : ""}`}
            style={{ left: (cell.mx - minX) * step, top: (cell.my - minY) * step, width: size, height: size }}
            title={cell.name ? `${cell.name}. ${cell.stamp}` : undefined}
          >
            {GLYPH[cell.role]}
            {cell.notch ? <i className="notch" /> : null}
          </span>
        ))}
      </div>
      {big ? (
        <p className="plate-caption">
          {walked} walked. Dashed rooms are doors you can see, or a zone a bench has stamped. Spine cells marked core are the shaft. A dot is a pocket you stepped into. The amber edge is the next job, once that room is on the plate.
          {here ? ` You are in ${here.name}.` : ""}
        </p>
      ) : null}
    </div>
  );
}

const INITIAL: UiSnap = {
  mode: "title",
  roomName: "Perimeter",
  depth: "UNCLEARED",
  hp: 100,
  maxHp: 100,
  missiles: 0,
  boots: false,
  phase: false,
  keycard: false,
  cell: false,
  power: false,
  token: false,
  files: [],
  objective: "Servo lab. The locker already has your badge number.",
  toast: "",
  prompt: "",
  bossHp: 0,
  bossMax: 0,
  hasSave: false,
  muted: false,
  fileId: null,
  visited: [],
  fault: "",
  map: [],
  shaft: [],
};

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [ui, setUi] = useState<UiSnap>(INITIAL);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new Game(canvas, setUi);
    gameRef.current = game;
    return () => game.destroy();
  }, []);

  const file = ui.fileId ? FILES[ui.fileId] : null;
  const showHud = ui.mode !== "title";
  const pips = Math.max(0, Math.round((ui.hp / ui.maxHp) * 10));

  const press = (partial: Parameters<Game["setTouch"]>[0], down: boolean) => {
    const next: Parameters<Game["setTouch"]>[0] = {};
    for (const key of Object.keys(partial) as Array<keyof typeof partial>) next[key] = down;
    gameRef.current?.setTouch(next);
  };

  return (
    <div className="shell">
      {showHud ? (
        <header className="hud">
          <div>
            <div className="brand">ROOK / M-17</div>
            <div className="sub">{ui.roomName}</div>
            <div className="hp" aria-label={`Health ${ui.hp}`}>
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className={i < pips ? "pip on" : "pip"} />
              ))}
            </div>
          </div>
          <div>
            <div className="depth">
              {ui.depth}
              {ui.bossMax > 0 ? " · CHOIR" : ""}
            </div>
            <div className="abilities">
              <span className={ui.missiles > 0 ? "tag on" : "tag"}>MSL {ui.missiles}</span>
              <span className={ui.boots ? "tag on" : "tag"}>LEGS</span>
              <span className={ui.phase ? "tag on" : "tag"}>VEIL</span>
              <span className={ui.keycard ? "tag on" : "tag"}>CARD</span>
              <span className={ui.cell ? "tag on" : "tag"}>CELL</span>
              <span className={ui.token ? "tag on" : "tag"}>TOKEN</span>
            </div>
          </div>
        </header>
      ) : (
        <header className="hud">
          <div className="brand">BLACK SITE</div>
          <div className="sub">clearance for depth</div>
        </header>
      )}

      <div className="stage">
        <canvas ref={canvasRef} tabIndex={0} aria-label="Site 51 descent" />
        {ui.toast && ui.mode === "play" ? <div className="toast">{ui.toast}</div> : null}
        {ui.mode === "play" ? (
          <div className="plate-dock">
            <SitePlate cells={ui.map} />
          </div>
        ) : null}
        {ui.mode === "title" ? (
          <div className="overlay">
            <div className="panel">
              <div className="kicker">Area 51 · facilities night shift</div>
              <h1 className="title">
                SITE 51
                <br />
                BELOW
              </h1>
              <p className="lede">
                You are Rook, badge M-17. The siren is already on. The cover story gets thinner every floor down:
                soldiers, then cryptids, then a craft that was built here, then a chapel that edits the page you are
                standing on. Read what they filed. Bring yourself back.
              </p>
              {ui.fault ? <p className="lede fault">{ui.fault}</p> : null}
              <SitePlate cells={ui.map} big />
              <div className="row">
                <button className="btn" onClick={() => gameRef.current?.start(false)}>
                  Descend
                </button>
                {ui.hasSave ? (
                  <button className="btn ghost" onClick={() => gameRef.current?.start(true)}>
                    Continue
                  </button>
                ) : null}
              </div>
              <div className="keys">
                <span>A D move</span>
                <span>W / Space jump</span>
                <span>J fire</span>
                <span>M missile, once a body drops one</span>
                <span>Shift dash, once you are less here</span>
                <span>E read, stamp a bench, or call the shaft</span>
                <span>Down + jump drops through grates</span>
              </div>
            </div>
          </div>
        ) : null}
        {ui.mode === "shaft" ? (
          <div className="overlay">
            <div className="panel">
              <div className="kicker">Vent core · car offline</div>
              <h2 className="title">Shaft</h2>
              <p className="lede">
                The car is frozen in the well. Landings you have already opened will answer. Omega answers only after
                the cradle is live.
              </p>
              <div className="codex">
                {ui.shaft.map((stop) => (
                  <button key={stop.id} disabled={!stop.open} onClick={() => gameRef.current?.rideShaft(stop.id)}>
                    {stop.name} — {stop.open ? stop.line : stop.locked}
                  </button>
                ))}
              </div>
              <div className="row">
                <button className="btn ghost" onClick={() => gameRef.current?.closeShaft()}>
                  Stay
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {ui.mode === "pause" ? (
          <div className="overlay">
            <div className="panel">
              <div className="kicker">Hold</div>
              <h2 className="title">Paused</h2>
              <p className="lede">{ui.objective}</p>
              <SitePlate cells={ui.map} big />
              <div className="codex">
                {ui.files.length === 0 ? <p className="lede">No files yet. Terminals remember you.</p> : null}
                {ui.files.map((id) => (
                  <button key={id} onClick={() => gameRef.current?.openCodex(id)}>
                    {FILES[id]?.title ?? id}
                  </button>
                ))}
              </div>
              <div className="row">
                <button className="btn" onClick={() => gameRef.current?.togglePause()}>
                  Resume
                </button>
                <button className="btn ghost" onClick={() => gameRef.current?.toggleMute()}>
                  {ui.muted ? "Sound on" : "Mute"}
                </button>
                <button className="btn ghost" onClick={() => gameRef.current?.abandon()}>
                  Abandon shift
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {ui.mode === "file" && file ? (
          <div className="overlay">
            <div className="panel">
              <div className="kicker">{file.dept}</div>
              <h2 className="title">{file.title}</h2>
              <p className="file-body">{file.body}</p>
              <button className="btn" onClick={() => gameRef.current?.closeFile()}>
                Close file
              </button>
            </div>
          </div>
        ) : null}
        {ui.mode === "ending" ? (
          <div className="overlay">
            <div className="panel">
              <div className="kicker">Clearance accepted</div>
              <h2 className="title">Same night</h2>
              <p className="file-body">
                {`The elevator opens on the desert you left. The motor-pool radio is calling a breach that started eleven minutes ago. Your watch says you were under for hours.

At the gate, someone in your vest badges in and does not look up.

The pager buzzes. Timestamped tomorrow.

BRING YOURSELF BACK.

Depth remains.`}
              </p>
              <button className="btn" onClick={() => gameRef.current?.abandon()}>
                Clock out
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {showHud ? (
        <div className="footer-bar">
          <div>
            <strong>{ui.prompt || ui.objective}</strong>
          </div>
          <button className="btn ghost" onClick={() => gameRef.current?.togglePause()}>
            Pause
          </button>
        </div>
      ) : null}

      <div className="touch">
        <div className="pad">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              press({ left: true }, true);
            }}
            onPointerUp={() => press({ left: false }, false)}
            onPointerLeave={() => press({ left: false }, false)}
          >
            LEFT
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              press({ right: true }, true);
            }}
            onPointerUp={() => press({ right: false }, false)}
            onPointerLeave={() => press({ right: false }, false)}
          >
            RIGHT
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              press({ down: true }, true);
            }}
            onPointerUp={() => press({ down: false }, false)}
            onPointerLeave={() => press({ down: false }, false)}
          >
            DOWN
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              press({ jump: true }, true);
            }}
            onPointerUp={() => press({ jump: false }, false)}
            onPointerLeave={() => press({ jump: false }, false)}
          >
            JUMP
          </button>
        </div>
        <div className="actions">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              press({ dash: true }, true);
            }}
            onPointerUp={() => press({ dash: false }, false)}
            onPointerLeave={() => press({ dash: false }, false)}
          >
            DASH
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              press({ shoot: true }, true);
            }}
            onPointerUp={() => press({ shoot: false }, false)}
            onPointerLeave={() => press({ shoot: false }, false)}
          >
            FIRE
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              press({ missile: true }, true);
            }}
            onPointerUp={() => press({ missile: false }, false)}
            onPointerLeave={() => press({ missile: false }, false)}
          >
            MSL
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              press({ interact: true }, true);
            }}
            onPointerUp={() => press({ interact: false }, false)}
            onPointerLeave={() => press({ interact: false }, false)}
          >
            USE
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              gameRef.current?.togglePause();
            }}
          >
            MENU
          </button>
        </div>
      </div>
    </div>
  );
}
