import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Bc4ByrNc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function loadImage(src) {
	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = () => resolve(null);
		img.src = src;
	});
}
async function frames(dir, names) {
	return (await Promise.all(names.map((name) => loadImage(`/game/${dir}/${name}.png`)))).filter((img) => !!img);
}
async function loadTileSet(biome) {
	const [floor, wall, hazard] = await Promise.all([
		loadImage(`/game/tiles/${biome}-floor.png`),
		loadImage(`/game/tiles/${biome}-wall.png`),
		loadImage(`/game/tiles/${biome}-hazard.png`)
	]);
	return {
		floor,
		wall,
		hazard
	};
}
var EMPTY_SET = {
	floor: null,
	wall: null,
	hazard: null
};
async function loadArt() {
	const biomes = [
		"surface",
		"archive",
		"bio",
		"hangar",
		"choir"
	];
	const [surface, archive, bio, hangar, choir, cell, terminal, idle, run, jump, soldier, crawler, drone, boss, shot, items, grate, glass, crack, ...sets] = await Promise.all([
		loadImage("/game/bg-surface.jpg"),
		loadImage("/game/bg-archive.jpg"),
		loadImage("/game/bg-bio.jpg"),
		loadImage("/game/bg-hangar.jpg"),
		loadImage("/game/bg-choir.jpg"),
		loadImage("/game/cell.png"),
		loadImage("/game/terminal.png"),
		frames("player-idle", [
			"idle-1",
			"idle-2",
			"idle-3",
			"idle-4"
		]),
		frames("player-run", [
			"run-1",
			"run-2",
			"run-3",
			"run-4"
		]),
		frames("player-jump", [
			"jump-1",
			"jump-2",
			"jump-3",
			"jump-4"
		]),
		frames("soldier", [
			"walk-1",
			"walk-2",
			"walk-3",
			"walk-4"
		]),
		frames("crawler", [
			"walk-1",
			"walk-2",
			"walk-3",
			"walk-4"
		]),
		frames("drone", [
			"hover-1",
			"hover-2",
			"hover-3",
			"hover-4"
		]),
		frames("boss", [
			"idle-1",
			"idle-2",
			"idle-3",
			"idle-4"
		]),
		frames("shot", [
			"projectile-1",
			"projectile-2",
			"projectile-3",
			"projectile-4"
		]),
		frames("items", [
			"frame-1",
			"frame-2",
			"frame-3",
			"frame-4"
		]),
		loadImage("/game/tiles/grate.png"),
		loadImage("/game/tiles/glass.png"),
		loadImage("/game/tiles/crack.png"),
		...biomes.map((biome) => loadTileSet(biome))
	]);
	const tiles = Object.fromEntries(biomes.map((biome, i) => [biome, sets[i]]));
	return {
		bg: {
			surface,
			archive,
			bio,
			hangar,
			choir
		},
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
		grate,
		glass,
		crack
	};
}
var EMPTY_ART = {
	bg: {
		surface: null,
		archive: null,
		bio: null,
		hangar: null,
		choir: null
	},
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
		choir: { ...EMPTY_SET }
	},
	grate: null,
	glass: null,
	crack: null
};
var AudioBus = class {
	ctx = null;
	muted = false;
	pad = null;
	unlock() {
		if (!this.ctx) this.ctx = new AudioContext();
		if (this.ctx.state === "suspended") this.ctx.resume();
		if (!this.pad) this.startPad();
	}
	toggle() {
		this.muted = !this.muted;
		if (this.pad) this.pad.gain.gain.value = this.muted ? 0 : .015;
		return this.muted;
	}
	startPad() {
		if (!this.ctx) return;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = "sine";
		osc.frequency.value = 55;
		gain.gain.value = this.muted ? 0 : .012;
		osc.connect(gain);
		gain.connect(this.ctx.destination);
		osc.start();
		this.pad = {
			osc,
			gain
		};
	}
	setBiome(biome) {
		if (!this.pad || !this.ctx) return;
		const freq = biome === "choir" ? 73 : biome === "bio" ? 49 : biome === "hangar" ? 62 : biome === "archive" ? 58 : 52;
		this.pad.osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, .4);
	}
	tone(freq, dur, type, vol, slide = 0) {
		if (!this.ctx || this.muted) return;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = type;
		osc.frequency.value = freq;
		if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, this.ctx.currentTime + dur);
		gain.gain.value = vol;
		gain.gain.exponentialRampToValueAtTime(1e-4, this.ctx.currentTime + dur);
		osc.connect(gain);
		gain.connect(this.ctx.destination);
		osc.start();
		osc.stop(this.ctx.currentTime + dur + .02);
	}
	jump() {
		this.tone(220, .12, "square", .04, 180);
	}
	shoot() {
		this.tone(520, .06, "square", .03, -300);
	}
	missile() {
		this.tone(180, .12, "sawtooth", .045, -80);
	}
	dash() {
		this.tone(160, .14, "sawtooth", .03, 240);
	}
	hurt() {
		this.tone(110, .16, "square", .05, -70);
	}
	pickup() {
		this.tone(440, .08, "square", .04, 0);
		this.tone(660, .12, "square", .03, 0);
	}
	file() {
		this.tone(330, .1, "triangle", .04, 0);
		this.tone(494, .16, "triangle", .03, 0);
	}
	boom() {
		this.tone(70, .28, "sawtooth", .05, -40);
	}
};
var GRAV_RISE = 1300;
var GRAV_FALL = 2800;
var JUMP_V = -468;
var ACCEL_G = 2400;
var ACCEL_A = 1500;
var FRICTION = 2600;
var COYOTE = .11;
var JUMP_BUFFER = .12;
var DASH_TIME = .16;
var DASH_CD = .78;
var SAVE_KEY = "site51-below-v1";
function onFloor(col, floorRow) {
	return {
		x: col * 24 + 4,
		y: floorRow * 24 - 28
	};
}
function grid$1(w, h) {
	const g = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => x === 0 || y === 0 || x === w - 1 || y === h - 1 ? 1 : 0));
	for (let x = 0; x < w; x++) g[h - 2][x] = 1;
	return g;
}
function carve$1(g, x, y, w, h) {
	for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j]?.[i] !== void 0) g[j][i] = 0;
}
function paint$1(g, x, y, w, h, t) {
	for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j]?.[i] !== void 0) g[j][i] = t;
}
function sideDoor$1(g, side, floor) {
	carve$1(g, side === "l" ? 0 : g[0].length - 1, floor - 4, 1, 4);
}
function foe$1(kind, col, floor, left, right, lift = 0, elite = false) {
	const h = kind === "crawler" ? 22 : kind === "drone" ? 18 : 32;
	const w = kind === "crawler" ? 32 : kind === "drone" ? 22 : 22;
	const y = floor * 24 - h - lift;
	return {
		kind,
		x: col * 24,
		y,
		w,
		h,
		left: left * 24,
		right: right * 24,
		baseY: y,
		...elite ? { elite: true } : {}
	};
}
var WINGS = [
	{
		id: "ridge",
		name: "Fence Cut",
		depth: "DEPTH 00",
		biome: "surface",
		role: "platform",
		mx: 0,
		my: 0,
		w: 48,
		h: 18,
		open: "r"
	},
	{
		id: "fence",
		name: "Wire Run",
		depth: "DEPTH 00",
		biome: "surface",
		role: "platform",
		mx: 1,
		my: 0,
		w: 44,
		h: 16,
		open: "lr"
	},
	{
		id: "bays",
		name: "Motor Bays",
		depth: "DEPTH 00",
		biome: "surface",
		role: "combat",
		mx: 4,
		my: 0,
		w: 44,
		h: 16,
		open: "lr"
	},
	{
		id: "dish",
		name: "Dish Yard",
		depth: "DEPTH 00",
		biome: "surface",
		role: "platform",
		mx: 5,
		my: 0,
		w: 46,
		h: 18,
		open: "l"
	},
	{
		id: "vent",
		name: "Exhaust Vent",
		depth: "DEPTH 01",
		biome: "archive",
		role: "platform",
		mx: 1,
		my: 1,
		w: 42,
		h: 16,
		open: "r"
	},
	{
		id: "duct",
		name: "Return Duct",
		depth: "DEPTH 01",
		biome: "archive",
		role: "platform",
		mx: 2,
		my: 1,
		w: 44,
		h: 16,
		open: "lr"
	},
	{
		id: "crypt",
		name: "Dead Files",
		depth: "DEPTH 01",
		biome: "archive",
		role: "combat",
		mx: 5,
		my: 1,
		w: 42,
		h: 16,
		open: "lr"
	},
	{
		id: "annex",
		name: "Annex Stack",
		depth: "DEPTH 01",
		biome: "archive",
		role: "platform",
		mx: 6,
		my: 1,
		w: 44,
		h: 18,
		open: "l"
	},
	{
		id: "gantry",
		name: "Servo Gantry",
		depth: "DEPTH 01",
		biome: "archive",
		role: "platform",
		mx: 2,
		my: 2,
		w: 48,
		h: 18,
		open: "r"
	},
	{
		id: "pit",
		name: "Test Pit",
		depth: "DEPTH 01",
		biome: "archive",
		role: "combat",
		mx: 4,
		my: 2,
		w: 42,
		h: 16,
		open: "lr"
	},
	{
		id: "mezz",
		name: "Mezzanine",
		depth: "DEPTH 01",
		biome: "archive",
		role: "platform",
		mx: 5,
		my: 2,
		w: 44,
		h: 16,
		open: "l"
	},
	{
		id: "tanks",
		name: "Tank Walk",
		depth: "DEPTH 02",
		biome: "bio",
		role: "platform",
		mx: 2,
		my: 3,
		w: 50,
		h: 18,
		open: "r"
	},
	{
		id: "pens",
		name: "Open Pens",
		depth: "DEPTH 02",
		biome: "bio",
		role: "combat",
		mx: 5,
		my: 3,
		w: 44,
		h: 16,
		open: "lr"
	},
	{
		id: "alpha",
		name: "Specimen Alpha",
		depth: "DEPTH 02",
		biome: "bio",
		role: "boss",
		mx: 6,
		my: 3,
		w: 48,
		h: 16,
		open: "lr"
	},
	{
		id: "serum",
		name: "Serum Stair",
		depth: "DEPTH 02",
		biome: "bio",
		role: "platform",
		mx: 7,
		my: 3,
		w: 42,
		h: 18,
		open: "l"
	},
	{
		id: "west",
		name: "Gantry West",
		depth: "DEPTH 03",
		biome: "hangar",
		role: "platform",
		mx: 2,
		my: 4,
		w: 46,
		h: 18,
		open: "r"
	},
	{
		id: "sentry",
		name: "Sentry Line",
		depth: "DEPTH 03",
		biome: "hangar",
		role: "combat",
		mx: 4,
		my: 4,
		w: 44,
		h: 16,
		open: "lr"
	},
	{
		id: "shadow",
		name: "Disc Shadow",
		depth: "DEPTH 03",
		biome: "hangar",
		role: "boss",
		mx: 5,
		my: 4,
		w: 50,
		h: 16,
		open: "l"
	},
	{
		id: "ante",
		name: "Well Mouth",
		depth: "DEPTH 04",
		biome: "choir",
		role: "platform",
		mx: 2,
		my: 5,
		w: 44,
		h: 16,
		open: "r"
	},
	{
		id: "chapel",
		name: "Side Chapel",
		depth: "DEPTH 04",
		biome: "choir",
		role: "combat",
		mx: 4,
		my: 5,
		w: 42,
		h: 16,
		open: "lr"
	},
	{
		id: "nave",
		name: "Glass Nave",
		depth: "DEPTH 04",
		biome: "choir",
		role: "platform",
		mx: 5,
		my: 5,
		w: 46,
		h: 18,
		open: "l"
	}
];
function stampFor(role) {
	if (role === "platform") return "placeholder · jumps";
	if (role === "combat") return "placeholder · contact";
	if (role === "boss") return "placeholder · warden";
	return "placeholder";
}
function dress(g, role, floor, w, tall) {
	if (role === "platform") {
		paint$1(g, 9, floor - 2, 2, 2, 1);
		paint$1(g, 14, floor - 2, 6, 1, 2);
		paint$1(g, 22, floor - 3, 5, 1, 2);
		if (w > 40) paint$1(g, 30, floor - 2, Math.min(6, w - 36), 1, 2);
		if (tall) paint$1(g, 20, floor - 5, 4, 1, 2);
		paint$1(g, Math.min(18, w - 12), floor, 3, 1, 3);
		return;
	}
	if (role === "combat") {
		paint$1(g, Math.floor(w / 2) - 4, floor - 2, 8, 1, 2);
		return;
	}
	if (role === "boss") {
		paint$1(g, 8, floor - 2, 5, 1, 2);
		paint$1(g, Math.floor(w / 2) - 3, floor - 3, 6, 1, 2);
		paint$1(g, w - 14, floor - 2, 5, 1, 2);
	}
}
function stock(spec, floor) {
	const w = spec.w;
	if (spec.role === "boss") {
		if (spec.biome === "bio") return [foe$1("soldier", Math.floor(w * .58), floor, 8, w - 8, 0, true), foe$1("crawler", Math.floor(w * .32), floor, 6, w - 8)];
		return [foe$1("soldier", Math.floor(w * .58), floor, 8, w - 8, 0, true), foe$1("drone", Math.floor(w * .34), floor, 6, w - 8, 76)];
	}
	if (spec.role !== "combat") return [];
	if (spec.biome === "bio") return [foe$1("crawler", 12, floor, 6, Math.floor(w * .55)), foe$1("crawler", Math.floor(w * .62), floor, Math.floor(w * .4), w - 7)];
	if (spec.biome === "hangar" || spec.biome === "choir") return [foe$1("soldier", 11, floor, 6, w - 8), foe$1("drone", Math.floor(w * .62), floor, 8, w - 8, 64)];
	return [foe$1("soldier", 10, floor, 6, Math.floor(w * .7)), foe$1("soldier", Math.floor(w * .62), floor, Math.floor(w * .35), w - 7)];
}
function safeMark(g, floor, w) {
	for (const c of [
		8,
		11,
		14,
		18,
		w - 10
	]) if (g[floor]?.[c] === 1) return c;
	return 8;
}
function buildWing(spec) {
	const floor = spec.h - 2;
	const g = grid$1(spec.w, spec.h);
	if (spec.open.includes("l")) sideDoor$1(g, "l", floor);
	if (spec.open.includes("r")) sideDoor$1(g, "r", floor);
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
		lifts: []
	};
}
function openSide(room, side) {
	sideDoor$1(room.tiles, side, room.tiles.length - 2);
}
function bridge(room, col, row, w) {
	paint$1(room.tiles, col, row, w, 1, 2);
}
function spawnNear(room, side) {
	const floor = room.tiles.length - 2;
	const w = room.tiles[0].length;
	const cols = [];
	if (side === "l") for (let c = 1; c < Math.min(w - 2, 18); c++) cols.push(c);
	else for (let c = w - 2; c >= Math.max(1, w - 18); c--) cols.push(c);
	for (const c of cols) if (room.tiles[floor]?.[c] === 1 && (room.tiles[floor - 1]?.[c] ?? 1) === 0) return onFloor(c, floor);
	return onFloor(side === "l" ? 3 : Math.max(2, w - 4), floor);
}
function join(rooms, leftId, rightId) {
	const left = rooms[leftId];
	const right = rooms[rightId];
	if (!left || !right) throw new Error(`missing join ${leftId}-${rightId}`);
	if (left.links.right || right.links.left) throw new Error(`busy ${leftId}-${rightId}`);
	left.links.right = {
		room: rightId,
		...spawnNear(right, "l")
	};
	right.links.left = {
		room: leftId,
		...spawnNear(left, "r")
	};
}
var SPINE$1 = {
	gate: {
		role: "route",
		mx: 2,
		my: 0,
		stamp: "core · cover",
		markCol: 12
	},
	yard: {
		role: "combat",
		mx: 3,
		my: 0,
		stamp: "core · surface",
		markCol: 18
	},
	stacks: {
		role: "lore",
		mx: 3,
		my: 1,
		stamp: "core · black book",
		markCol: 22
	},
	records: {
		role: "lore",
		mx: 4,
		my: 1,
		stamp: "live · files",
		markCol: 14
	},
	lab: {
		role: "route",
		mx: 3,
		my: 2,
		stamp: "core · servo",
		markCol: 12
	},
	vats: {
		role: "combat",
		mx: 3,
		my: 3,
		stamp: "core · blue book",
		markCol: 10
	},
	reliquary: {
		role: "lore",
		mx: 4,
		my: 3,
		stamp: "live · files",
		markCol: 12
	},
	hangar: {
		role: "route",
		mx: 3,
		my: 4,
		stamp: "core · cradle",
		markCol: 14
	},
	choir: {
		role: "boss",
		mx: 3,
		my: 5,
		stamp: "core · omega",
		markCol: 20
	}
};
function installWings(rooms) {
	for (const spec of WINGS) rooms[spec.id] = buildWing(spec);
	for (const [id, meta] of Object.entries(SPINE$1)) Object.assign(rooms[id], meta);
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
function feetOk(room, x, y) {
	if (y < 120) return true;
	const row = Math.round((y + 28) / 24);
	const col = Math.floor((x + 8) / 24);
	const floor = room.tiles[row]?.[col];
	const body = room.tiles[row - 1]?.[col] ?? 1;
	return (floor === 1 || floor === 2 || floor === 3) && body !== 1;
}
function auditWings(rooms) {
	const errors = [];
	const seen = /* @__PURE__ */ new Set();
	if (Object.keys(rooms).length < 30) errors.push(`rooms ${Object.keys(rooms).length}`);
	for (const room of Object.values(rooms)) {
		if (room.mx === void 0 || room.my === void 0 || !room.role) errors.push(`${room.id} unplaced`);
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
var SCRAPS = [
	"scrap-film",
	"scrap-lint",
	"scrap-vial",
	"scrap-shift"
];
var LOOTS = [
	"heal",
	"missile",
	"scrap"
];
function mulberry(seed) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function blocked(room) {
	const cols = /* @__PURE__ */ new Set();
	const mark = (x) => {
		const c = Math.floor(x / 24);
		for (let i = c - 3; i <= c + 3; i++) cols.add(i);
	};
	for (const spot of room.terminals) mark(spot.x);
	for (const spot of room.lifts) mark(spot.x);
	if (room.console) mark(room.console.x);
	if (room.elevator) mark(room.elevator.x);
	if (room.kiosk) mark(room.kiosk.x);
	if (room.shaft) mark(room.shaft.x);
	if (room.markCol != null) mark(room.markCol * 24);
	for (const item of room.items) mark(item.x);
	return cols;
}
function fits(room, col) {
	const tiles = room.tiles;
	const floor = tiles.length - 2;
	const w = tiles[0].length;
	if (col < 8 || col + 6 > w - 8) return false;
	const skip = blocked(room);
	for (let c = col; c < col + 6; c++) {
		if (skip.has(c)) return false;
		if (tiles[floor]?.[c] !== 1) return false;
		if ((tiles[floor - 1]?.[c] ?? 1) !== 0) return false;
		if ((tiles[floor - 2]?.[c] ?? 1) !== 0) return false;
		if ((tiles[floor - 3]?.[c] ?? 1) !== 0) return false;
	}
	return true;
}
function crackCandidates(rooms) {
	const out = [];
	for (const room of Object.values(rooms)) {
		if (room.biome === "choir" || room.id === "choir") continue;
		const w = room.tiles[0].length;
		const from = Math.floor(w * .28);
		const to = Math.floor(w * .72);
		for (let col = from; col <= to; col += 2) {
			if (!fits(room, col)) continue;
			out.push({
				id: `crack-${room.id}-${col}`,
				room: room.id,
				biome: room.biome,
				col
			});
			break;
		}
	}
	return out;
}
function activeCracks(seed, rooms) {
	const rng = mulberry(seed || 1);
	const all = crackCandidates(rooms);
	const picked = [];
	for (const biome of [
		"surface",
		"archive",
		"bio",
		"hangar"
	]) {
		const list = all.filter((c) => c.biome === biome);
		for (let i = list.length - 1; i > 0; i--) {
			const j = Math.floor(rng() * (i + 1));
			const swap = list[i];
			list[i] = list[j];
			list[j] = swap;
		}
		list.slice(0, 2).forEach((c, n) => {
			const loot = LOOTS[Math.floor(rng() * LOOTS.length)];
			picked.push({
				...c,
				loot,
				scrap: SCRAPS[(picked.length + n) % SCRAPS.length]
			});
		});
	}
	return picked;
}
function paintCloset(tiles, crack, open) {
	const floor = tiles.length - 2;
	const c = crack.col;
	for (let col = c; col < c + 6; col++) tiles[floor - 3][col] = 1;
	for (const row of [floor - 1, floor - 2]) for (let col = c; col < c + 6; col++) tiles[row][col] = open ? 0 : 5;
}
function installKiosks(rooms) {
	const y = (room) => (room.tiles.length - 2) * 24;
	rooms.gate.kiosk = {
		id: "k-surface",
		x: 672,
		y: y(rooms.gate)
	};
	rooms.records.kiosk = {
		id: "k-archive",
		x: 192,
		y: y(rooms.records)
	};
	rooms.reliquary.kiosk = {
		id: "k-bio",
		x: 720,
		y: y(rooms.reliquary)
	};
	rooms.hangar.kiosk = {
		id: "k-hangar",
		x: 576,
		y: y(rooms.hangar)
	};
}
function auditSecrets(rooms) {
	const counts = {
		surface: 0,
		archive: 0,
		bio: 0,
		hangar: 0
	};
	for (const c of crackCandidates(rooms)) counts[c.biome] = (counts[c.biome] ?? 0) + 1;
	return Object.entries(counts).filter(([, n]) => n < 2).map(([biome, n]) => `${biome} cracks ${n}`);
}
function seedFromSave(room, visited) {
	let h = 2166136261;
	const s = `${room}|${visited.join(",")}`;
	for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
	return h >>> 0 || 1;
}
function grid(w, h) {
	const g = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => x === 0 || y === 0 || x === w - 1 || y === h - 1 ? 1 : 0));
	for (let x = 0; x < w; x++) g[h - 2][x] = 1;
	return g;
}
function carve(g, x, y, w, h) {
	for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j]?.[i] !== void 0) g[j][i] = 0;
}
function paint(g, x, y, w, h, t) {
	for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j]?.[i] !== void 0) g[j][i] = t;
}
function sideDoor(g, side, floor) {
	carve(g, side === "l" ? 0 : g[0].length - 1, floor - 4, 1, 4);
}
function shaft(g, x, w, floor) {
	carve(g, x, floor, w, 2);
	return {
		x: x * 24,
		y: floor * 24,
		w: w * 24,
		h: 48
	};
}
function foe(kind, col, floor, left, right, lift = 0) {
	const h = kind === "crawler" ? 22 : kind === "drone" ? 18 : kind === "boss" ? 64 : 32;
	const w = kind === "crawler" ? 32 : kind === "drone" ? 22 : kind === "boss" ? 74 : 22;
	const y = floor * 24 - h - lift;
	return {
		kind,
		x: col * 24,
		y,
		w,
		h,
		left: left * 24,
		right: right * 24,
		baseY: y
	};
}
var gateFloor = 14;
var midFloor = 14;
var stackFloor = 20;
var deepFloor = 16;
var gateSpawn = onFloor(6, gateFloor);
var yardSpawn = onFloor(3, midFloor);
var stacksFloorSpawn = onFloor(18, stackFloor);
var recordsSpawn = onFloor(3, midFloor);
var labSpawn = onFloor(14, midFloor);
var vatsSpawn = onFloor(6, midFloor);
var relSpawn = onFloor(4, midFloor);
var hangarSpawn = onFloor(12, deepFloor);
onFloor(5, deepFloor);
var SPINE = {
	gate: (() => {
		const g = grid(40, 16);
		sideDoor(g, "r", gateFloor);
		paint(g, 18, 11, 5, 1, 2);
		return {
			id: "gate",
			name: "Perimeter Gate",
			depth: "DEPTH 00",
			biome: "surface",
			tiles: g,
			links: { right: {
				room: "yard",
				...yardSpawn
			} },
			locks: {},
			enemies: [],
			items: [],
			terminals: [{
				id: "t-gate",
				file: "perimeter",
				x: 384,
				y: gateFloor * 24
			}],
			lifts: [],
			elevator: {
				id: "exit",
				x: 72,
				y: gateFloor * 24,
				need: "token"
			},
			shaft: {
				id: "shaft-gate",
				x: 528,
				y: gateFloor * 24
			}
		};
	})(),
	yard: (() => {
		const g = grid(56, 16);
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
				left: {
					room: "gate",
					x: 792,
					y: gateSpawn.y
				},
				down: {
					room: "stacks",
					x: 960,
					y: 48
				}
			},
			locks: {},
			enemies: [foe("soldier", 12, midFloor, 6, 20), foe("soldier", 34, midFloor, 30, 42)],
			items: [],
			terminals: [{
				id: "t-yard",
				file: "silvertip",
				x: 240,
				y: midFloor * 24
			}],
			lifts: [],
			hole,
			shaft: {
				id: "shaft-yard",
				x: 336,
				y: midFloor * 24
			}
		};
	})(),
	stacks: (() => {
		const g = grid(48, 22);
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
				right: {
					room: "records",
					...recordsSpawn
				},
				down: {
					room: "lab",
					x: 192,
					y: 40
				}
			},
			locks: { right: "keycard" },
			enemies: [foe("drone", 30, stackFloor, 20, 40, 78)],
			items: [{
				id: "keycard-mezz",
				kind: "keycard",
				x: 672,
				y: 342
			}],
			terminals: [{
				id: "t-stacks",
				file: "index",
				x: 384,
				y: stackFloor * 24
			}, {
				id: "t-mezz",
				file: "roster",
				x: 768,
				y: 360
			}],
			lifts: [{
				id: "up-yard",
				x: 1008,
				y: stackFloor * 24,
				to: {
					room: "yard",
					x: 912,
					y: yardSpawn.y
				}
			}],
			hole,
			shaft: {
				id: "shaft-stacks",
				x: 864,
				y: stackFloor * 24
			}
		};
	})(),
	records: (() => {
		const g = grid(36, 16);
		sideDoor(g, "l", midFloor);
		return {
			id: "records",
			name: "Intake Cage",
			depth: "DEPTH 01",
			biome: "archive",
			tiles: g,
			links: { left: {
				room: "stacks",
				...stacksFloorSpawn
			} },
			locks: {},
			enemies: [foe("soldier", 24, midFloor, 16, 30)],
			items: [],
			terminals: [{
				id: "t-records",
				file: "intake",
				x: 432,
				y: midFloor * 24
			}],
			lifts: []
		};
	})(),
	lab: (() => {
		const g = grid(50, 16);
		paint(g, 18, 11, 8, 1, 1);
		paint(g, 30, midFloor, 3, 1, 3);
		const hole = shaft(g, 40, 8, midFloor);
		return {
			id: "lab",
			name: "Servo Lab",
			depth: "DEPTH 01",
			biome: "archive",
			tiles: g,
			links: { down: {
				room: "vats",
				x: 192,
				y: 36
			} },
			locks: {},
			enemies: [foe("drone", 22, midFloor, 14, 32, 64)],
			items: [{
				id: "boots-lab",
				kind: "boots",
				x: 504,
				y: 246
			}],
			terminals: [{
				id: "t-lab",
				file: "legerdemain",
				x: 192,
				y: midFloor * 24
			}],
			lifts: [{
				id: "up-stacks",
				x: 96,
				y: midFloor * 24,
				to: {
					room: "stacks",
					x: 480,
					y: stacksFloorSpawn.y
				}
			}],
			hole,
			shaft: {
				id: "shaft-lab",
				x: 624,
				y: midFloor * 24
			}
		};
	})(),
	vats: (() => {
		const g = grid(54, 16);
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
				right: {
					room: "reliquary",
					...relSpawn
				},
				down: {
					room: "hangar",
					x: 240,
					y: 40
				}
			},
			locks: {},
			enemies: [foe("crawler", 8, midFloor, 3, 14), foe("crawler", 22, midFloor, 18, 33)],
			items: [{
				id: "phase-vats",
				kind: "phase",
				x: 672,
				y: 198
			}],
			terminals: [{
				id: "t-vats",
				file: "menagerie",
				x: 144,
				y: midFloor * 24
			}],
			lifts: [{
				id: "up-lab",
				x: 96,
				y: midFloor * 24,
				to: {
					room: "lab",
					...labSpawn
				}
			}],
			hole,
			shaft: {
				id: "shaft-vats",
				x: 912,
				y: midFloor * 24
			}
		};
	})(),
	reliquary: (() => {
		const g = grid(40, 16);
		sideDoor(g, "l", midFloor);
		paint(g, 18, 11, 8, 1, 2);
		return {
			id: "reliquary",
			name: "Gold Annex",
			depth: "DEPTH 02",
			biome: "bio",
			tiles: g,
			links: { left: {
				room: "vats",
				x: 1224,
				y: vatsSpawn.y
			} },
			locks: {},
			enemies: [foe("drone", 26, midFloor, 16, 34, 70)],
			items: [],
			terminals: [{
				id: "t-rel",
				file: "capacitor",
				x: 336,
				y: midFloor * 24
			}],
			lifts: []
		};
	})(),
	hangar: (() => {
		const g = grid(58, 18);
		paint(g, 16, 13, 8, 1, 1);
		const hole = shaft(g, 46, 8, deepFloor);
		return {
			id: "hangar",
			name: "Cradle Bay",
			depth: "DEPTH 03",
			biome: "hangar",
			tiles: g,
			links: { down: {
				room: "choir",
				x: 192,
				y: 42
			} },
			locks: { down: "power" },
			enemies: [foe("drone", 28, deepFloor, 18, 40, 80), foe("soldier", 36, deepFloor, 30, 44)],
			items: [{
				id: "cell-hangar",
				kind: "cell",
				x: 456,
				y: 294
			}],
			terminals: [{
				id: "t-hangar",
				file: "forgetting",
				x: 192,
				y: deepFloor * 24
			}],
			lifts: [{
				id: "up-vats",
				x: 96,
				y: deepFloor * 24,
				to: {
					room: "vats",
					x: 192,
					y: vatsSpawn.y
				}
			}, {
				id: "up-gate",
				x: 240,
				y: deepFloor * 24,
				to: {
					room: "gate",
					...gateSpawn
				},
				need: "power"
			}],
			console: {
				id: "cradle",
				x: 960,
				y: deepFloor * 24
			},
			hatch: {
				x: hole.x / 24,
				y: deepFloor,
				w: 8,
				h: 2
			},
			hole,
			shaft: {
				id: "shaft-hangar",
				x: 432,
				y: deepFloor * 24
			}
		};
	})(),
	choir: (() => {
		const g = grid(56, 18);
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
			terminals: [{
				id: "t-choir",
				file: "minutes",
				x: 192,
				y: deepFloor * 24
			}],
			lifts: [{
				id: "up-hangar",
				x: 96,
				y: deepFloor * 24,
				to: {
					room: "hangar",
					...hangarSpawn
				}
			}],
			shaft: {
				id: "shaft-choir",
				x: 720,
				y: deepFloor * 24
			}
		};
	})()
};
installWings(SPINE);
installKiosks(SPINE);
var ROOMS = SPINE;
var START = gateSpawn;
Object.keys(ROOMS);
function objective(s) {
	if (s.token) return "Surface elevator at the gate. Any shaft panel still answers.";
	if (!s.boots) return "Servo lab, off the core. The locker already has your badge number.";
	if (!s.phase) return "Menagerie. The violet glass does not open for hands.";
	if (!s.power) return "Cradle bay. Seat the cell and the well answers the shaft.";
	if (!s.bossDead) return "Below the saucer. Do not finish the sentence in the glass.";
	return "Take the token from the well and call the shaft home.";
}
function validateRooms() {
	const errors = [];
	for (const room of Object.values(ROOMS)) {
		room.tiles.length;
		const w = room.tiles[0]?.length ?? 0;
		if (room.tiles.some((row) => row.length !== w)) errors.push(`${room.id} ragged`);
		const links = Object.entries(room.links);
		for (const [dir, link] of links) if (!ROOMS[link.room]) errors.push(`${room.id} ${dir} missing room`);
		if (room.hole) {
			if (!room.links.down) errors.push(`${room.id} hole without down link`);
		}
	}
	errors.push(...auditWings(ROOMS));
	errors.push(...auditSecrets(ROOMS));
	if (!gateSpawn.y || false) errors.push("spawn");
	return errors;
}
function has(save, lock) {
	if (lock === "keycard") return save.keycard;
	if (lock === "power") return save.power;
	return save.token;
}
function goalRoom(save) {
	if (save.token) return "gate";
	if (!save.boots) return "lab";
	if (!save.phase) return "vats";
	if (!save.power) return "hangar";
	if (!save.bossDead) return "choir";
	return "gate";
}
function survey(save, here) {
	const visited = new Set(save.visited);
	const heard = /* @__PURE__ */ new Set();
	const locked = /* @__PURE__ */ new Set();
	const surveyed = new Set(save.surveyed ?? []);
	const pockets = new Set(save.pockets ?? []);
	const goal = goalRoom(save);
	for (const id of visited) {
		const from = ROOMS[id];
		if (!from) continue;
		for (const dir of [
			"left",
			"right",
			"down"
		]) {
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
		let state = "dark";
		if (here === room.id) state = "here";
		else if (visited.has(room.id)) state = "walked";
		else if (heard.has(room.id) || surveyed.has(room.biome)) state = "heard";
		const doors = [...Object.values(room.links).map((link) => link?.room).filter((id) => !!id), ...room.lifts.map((lift) => lift.to?.room).filter((id) => !!id)];
		return {
			id: room.id,
			mx: room.mx ?? 0,
			my: room.my ?? 0,
			role: room.role ?? "route",
			biome: room.biome,
			name: state === "dark" ? "" : room.name,
			stamp: state === "dark" ? "" : room.stamp ?? "",
			state,
			locked: state === "heard" && locked.has(room.id),
			doors,
			notch: pockets.has(room.id),
			hint: state !== "dark" && room.id === goal && state !== "here"
		};
	});
}
var FILES = {
	perimeter: {
		title: "Perimeter is a movie set",
		dept: "DUTY LOG / GATE",
		body: `Tell the tourists the lights are runway tests. If they ask about the hole, there is no hole.

Night crew badge M-17 clocked in eleven minutes before the siren. The badge log shows the same clock-in yesterday, and tomorrow. Facilities does not get tomorrow yet.

Your pager, when you found it on the bench, already said DESCEND.`
	},
	silvertip: {
		title: "Silver-tip",
		dept: "MILITARY POLICE / YARD",
		body: `The motor pool was briefed on trespassers. Riot loads. Then someone swapped the cans for silver-tip and did not update the speech.

They were not told the targets dislike photographs, or that some of the targets still have employee numbers. Hold the yard. Do not look down the hatch. The hatch is a drainage feature.`
	},
	index: {
		title: "Index of transfers",
		dept: "ARCHIVE / STACKS",
		body: `Projects moved below on the same night in 1979, in 1996, and again last Tuesday: BLUEBOOK residue, LEGERDEMAIN, VEIL, SERAPH, CHOIR.

The dates are not a pattern the archivists are allowed to name. Upper stacks are keyed to a gait you do not have yet. Your badge number is already on a locker in the servo lab.

If a file cites you as present, do not correct it.`
	},
	roster: {
		title: "Redacted roster",
		dept: "ARCHIVE / MEZZANINE",
		body: `Maintenance roster, sublevel 1. Nineteen names. Eighteen black bars. The last line is a badge number, M-17, hired the year you remember and also the year your mother was born.

Margin note, different hand: "Do not issue the keycard until the calves take." The keycard was already in the tray.`
	},
	legerdemain: {
		title: "Project LEGERDEMAIN",
		dept: "SERVO LAB",
		body: `Mobility grafts, tested on facilities staff because they already go where the scientists will not. Ankles, then calves, then the part of the reflex that decides to jump a second time.

The boots in locker M-17 are scuffed on the inside. Someone has been breaking them in. The wear matches your stride. You have not put them on yet.

You have put them on before.`
	},
	intake: {
		title: "Seraph intake",
		dept: "RECORDS CAGE",
		body: `A chapel's worth of gold leaf arrived under a farming subsidy. The crate manifest says RELIQUARY. The engineering rider says CAPACITOR.

Senators will fund a voice if you call it faith. They will bury a voice if you call it a weapon. This office does both, and files the contradiction under weather.`
	},
	menagerie: {
		title: "Menagerie",
		dept: "BIO VAULT",
		body: `They are not wildlife. Labels still on the tanks: MOTH, DOVER, FLATWOOD, FRESNO. Failed attempts to give the chapel something with knees.

Three cylinders have been reclassified as EMPLOYEE. The violet glass between you and the lower shaft is Project VEIL. It does not open for hands. It opens for the moment you are briefly not entirely here.`
	},
	capacitor: {
		title: "The ark is a capacitor",
		dept: "ANNEX",
		body: `Wood would have been cheaper. Gold holds a charge and photographs well.

The ark does not speak. It stores a speaking. What the lower ring calls the Choir is the red pen on a document this base pretends is geology. Do not finish a sentence you hear in the glass.`
	},
	forgetting: {
		title: "The disc did not crash",
		dept: "CRADLE BAY",
		body: `It was built in this room. Then the builders forgot. Then a later crew found it, called it foreign, and requested a larger budget to reverse-engineer their own welds.

Forgetting is the deliverable. The shaft under the cradle is unpowered until a cell from this bay is seated. Below the disc, the document starts to show revisions.`
	},
	minutes: {
		title: "Minutes of the Choir",
		dept: "THE WELL",
		body: `The deepest project is not a weapon. It is an edit. Reality is a document with too many authors, and the Choir is what happens when the margin notes learn to fly.

Your pager's last message is timestamped tomorrow: YOU ALREADY WENT DOWN. BRING YOURSELF BACK.

If you are reading this, you are the copy that continued. The other one is badging in at the gate.`
	},
	"scrap-film": {
		title: "Contact sheet, fence",
		dept: "UNFILED / WALL",
		body: `Twelve frames of the wire. In frame nine a man in your vest is already on the inside of the fence, walking toward the gate you have not opened yet.

The camera time is eleven minutes ago. The siren on the film has not started.`
	},
	"scrap-lint": {
		title: "Lint from the return",
		dept: "UNFILED / DUCT",
		body: `Facilities pulled a filter and logged what would not burn: silver hair, a page of a roster, and a badge clip stamped M-17.

The clip is warmer than the duct. They put the filter back.`
	},
	"scrap-vial": {
		title: "Vial 19",
		dept: "UNFILED / MENAGERIE",
		body: `Label scraped off with a thumbnail. The glass remembers a hand. Contents listed, then crossed out: blood, then ink, then "whatever the page is bleeding."

Do not drink it. The last tech who did began speaking in tomorrow's tense.`
	},
	"scrap-shift": {
		title: "Shift change under the disc",
		dept: "UNFILED / CRADLE",
		body: `The crew that built the saucer clocked out through a door that is not on the plate. Their badges still ping from inside the hull.

One ping is yours. It started before you took the service lift.`
	}
};
function stop(id, name, line, col, floor, open, locked) {
	return {
		id,
		name,
		line,
		...onFloor(col, floor),
		open,
		locked
	};
}
/** Landings of the dead car. Return trips only, except Omega, which answers once the cradle is live. */
var SHAFT_STOPS = [
	stop("gate", "Surface", "Depth 00 · cover", 6, 14, () => true, ""),
	stop("stacks", "Black Book", "Depth 01 · logistics", 18, 20, (s) => s.visited.includes("stacks"), "Still a hole, not a landing."),
	stop("lab", "Servo", "Depth 01 · the locker", 14, 14, (s) => s.visited.includes("lab"), "The servo landing does not answer."),
	stop("vats", "Blue Book", "Depth 02 · menagerie", 6, 14, (s) => s.visited.includes("vats"), "Biosphere doors stay shut."),
	stop("hangar", "Cradle", "Depth 03 · the disc", 12, 16, (s) => s.visited.includes("hangar"), "Cradle bay has not checked in."),
	stop("choir", "Omega", "Depth 04 · the well", 5, 16, (s) => s.power, "The well waits on a live cradle.")
];
var PAL = {
	surface: {
		front: "#3c3934",
		top: "#8a8172",
		rivet: "#c8b89a",
		hazard: "#6a4a28"
	},
	archive: {
		front: "#3a414c",
		top: "#8d97a6",
		rivet: "#d5dde8",
		hazard: "#3f6a32"
	},
	bio: {
		front: "#243028",
		top: "#6d8068",
		rivet: "#c6d2b4",
		hazard: "#2f6a28"
	},
	hangar: {
		front: "#2c3440",
		top: "#7d8b9c",
		rivet: "#d0d7e0",
		hazard: "#8a5a20"
	},
	choir: {
		front: "#2a241c",
		top: "#7a7058",
		rivet: "#e6c98a",
		hazard: "#5a3c78"
	}
};
function blit(ctx, img, x, y, w, h, flip = false) {
	if (!img) return;
	ctx.imageSmoothingEnabled = false;
	ctx.save();
	if (flip) {
		ctx.translate(Math.round(x + w / 2), Math.round(y));
		ctx.scale(-1, 1);
		ctx.drawImage(img, Math.round(-w / 2), 0, w, h);
	} else ctx.drawImage(img, Math.round(x), Math.round(y), w, h);
	ctx.restore();
}
function frameAt(list, time, fps) {
	if (!list.length) return null;
	return list[Math.floor(time * fps) % list.length];
}
var ROLE_TITLE = {
	route: "TRANSIT",
	platform: "JUMP BAY",
	combat: "CONTACT",
	boss: "WARDEN",
	lore: "FILES"
};
function drawFloorMark(ctx, room) {
	if (!room.role || room.role === "route") return;
	const floor = room.tiles.length - 2;
	const x = (room.markCol ?? 10) * 24;
	const y = floor * 24;
	ctx.save();
	ctx.translate(x, y - 4);
	ctx.fillStyle = "rgba(7,8,12,0.72)";
	ctx.fillRect(0, -16, 78, 14);
	ctx.fillStyle = room.role === "combat" ? "#c4452d" : room.role === "boss" ? "#e6c98a" : room.role === "lore" ? "#d5dde8" : "#e3a23a";
	ctx.fillRect(0, -16, 3, 14);
	ctx.font = "9px 'IBM Plex Mono', monospace";
	ctx.fillText(ROLE_TITLE[room.role], 6, -6);
	ctx.restore();
}
function drawRoomTab(ctx, room) {
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
function drawTitle(ctx, art, time) {
	ctx.fillStyle = "#07080c";
	ctx.fillRect(0, 0, 480, 270);
	const img = art.bg.surface;
	if (!img) return;
	ctx.imageSmoothingEnabled = true;
	const w = 600;
	const h = w * (img.height / img.width);
	const x = -(time * 8 % 120);
	const y = 270 - h + 10;
	ctx.drawImage(img, x, y, w, h);
	const g = ctx.createLinearGradient(0, 0, 0, 270);
	g.addColorStop(0, "rgba(7,8,12,0.15)");
	g.addColorStop(.55, "rgba(7,8,12,0.05)");
	g.addColorStop(1, "rgba(7,8,12,0.72)");
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 480, 270);
}
function drawWorld(ctx, art, room, tiles, cam, player, enemies, bullets, items, spots, bits, time, powered, drops = []) {
	const roomW = tiles[0].length * 24;
	const roomH = tiles.length * 24;
	ctx.fillStyle = "#07080c";
	ctx.fillRect(0, 0, 480, 270);
	const img = art.bg[room.biome];
	ctx.imageSmoothingEnabled = true;
	if (img) {
		const imgW = Math.max(roomW * 1.08, 552);
		const imgH = imgW * (img.height / img.width);
		const baseX = (roomW - imgW) / 2 + cam.x * .22;
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
	for (let y = 0; y < tiles.length; y++) for (let x = 0; x < tiles[0].length; x++) {
		const t = tiles[y][x];
		if (!t) continue;
		const px = x * 24;
		const py = y * 24;
		if (px + 24 < cam.x - 20 || px > cam.x + 480 + 20 || py + 24 < cam.y - 20 || py > cam.y + 270 + 20) continue;
		if (t === 2) {
			if (art.grate) blit(ctx, art.grate, px, py, 24, 24);
			else {
				ctx.fillStyle = pal.top;
				ctx.fillRect(px, py, 24, 6);
				ctx.fillStyle = "#e3a23a";
				ctx.fillRect(px, py, 24, 2);
			}
			continue;
		}
		if (t === 4) {
			if (art.glass) {
				ctx.save();
				ctx.globalAlpha = .82;
				blit(ctx, art.glass, px, py, 24, 24);
				ctx.restore();
			} else {
				ctx.fillStyle = `rgba(168, 146, 255, ${.28 + Math.sin(time * 6 + y) * .08})`;
				ctx.fillRect(px + 4, py, 16, 24);
			}
			ctx.fillStyle = "rgba(230, 220, 255, 0.8)";
			const sy = (time * 40 + y * 10) % 24;
			ctx.fillRect(px + 6, py + sy, 12, 2);
			continue;
		}
		if (t === 5) {
			if (art.crack) blit(ctx, art.crack, px, py, 24, 24);
			else {
				ctx.fillStyle = "#4a4034";
				ctx.fillRect(px, py, 24, 24);
				ctx.strokeStyle = "#c8b89a";
				ctx.beginPath();
				ctx.moveTo(px + 4, py + 3);
				ctx.lineTo(px + 24 - 5, py + 24 - 4);
				ctx.moveTo(px + 24 - 6, py + 5);
				ctx.lineTo(px + 6, py + 24 - 5);
				ctx.stroke();
			}
			continue;
		}
		const set = art.tiles[room.biome];
		const above = tiles[y - 1]?.[x] ?? 0;
		const img = t === 3 ? set?.hazard : above === 0 || above === 2 || above === 4 ? set?.floor : set?.wall;
		if (img) blit(ctx, img, px, py, 24, 24);
		else {
			ctx.fillStyle = t === 3 ? pal.hazard : pal.front;
			ctx.fillRect(px, py, 24, 24);
			ctx.fillStyle = t === 3 ? room.biome === "choir" ? "#b9a0dc" : "#8dce6a" : pal.top;
			ctx.fillRect(px, py, 24, 5);
			ctx.fillStyle = "rgba(0,0,0,0.35)";
			ctx.fillRect(px, py + 24 - 3, 24, 3);
			ctx.fillStyle = pal.rivet;
			ctx.fillRect(px + 4, py + 9, 2, 2);
			ctx.fillRect(px + 24 - 6, py + 9, 2, 2);
		}
		if (y === floor && (tiles[y][x - 1] === 0 || tiles[y][x + 1] === 0) || room.hatch && !powered && x >= room.hatch.x && x < room.hatch.x + room.hatch.w && y === room.hatch.y) {
			ctx.fillStyle = "#e3a23a";
			ctx.fillRect(px + 3, py + 1, 5, 2);
			ctx.fillRect(px + 12, py + 1, 5, 2);
		}
	}
	drawFloorMark(ctx, room);
	for (const spot of spots) if (spot.kind === "terminal") blit(ctx, art.terminal, spot.x - 26, spot.y - 58, 52, 60, false);
	else if (spot.kind === "survey") {
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
		const set = e.kind === "soldier" ? art.soldier : e.kind === "crawler" ? art.crawler : e.kind === "boss" ? art.boss : art.drone;
		const fps = e.kind === "boss" ? 4 : 8;
		const img = frameAt(set, time + e.x * .01, fps) ?? set[0];
		const dw = e.kind === "boss" ? 140 : e.kind === "crawler" ? 72 : e.kind === "drone" ? 48 : 60;
		const dh = e.kind === "boss" ? 140 : e.kind === "crawler" ? 56 : e.kind === "drone" ? 48 : 60;
		const feet = e.y + e.h;
		ctx.globalAlpha = e.flash && e.flash > 0 && Math.floor(time * 30) % 2 === 0 ? .45 : 1;
		if (e.kind === "drone" || e.kind === "boss") blit(ctx, img, e.x + e.w / 2 - dw / 2, e.y + e.h / 2 - dh / 2, dw, dh, e.facing < 0);
		else blit(ctx, img, e.x + e.w / 2 - dw / 2, feet - dh + 14, dw, dh, e.facing < 0);
		ctx.globalAlpha = 1;
		if (e.beam) {
			ctx.fillStyle = "rgba(230, 210, 140, 0.35)";
			ctx.fillRect(0, e.y + e.h / 2 - 8, roomW, 16);
		}
	}
	const pImg = playerSprite(art, player, time);
	ctx.globalAlpha = player.flash && player.flash > 0 && Math.floor(time * 24) % 2 === 0 ? .35 : 1;
	blit(ctx, pImg, player.x + player.w / 2 - 30, player.y + player.h - 50, 60, 60, player.facing < 0);
	ctx.globalAlpha = 1;
	for (const bit of bits) {
		ctx.globalAlpha = Math.max(0, bit.life);
		ctx.fillStyle = bit.color;
		ctx.fillRect(bit.x, bit.y, 3, 3);
	}
	ctx.globalAlpha = 1;
	ctx.restore();
	const veil = ctx.createLinearGradient(0, 0, 0, 270);
	veil.addColorStop(0, "rgba(7,8,12,0.28)");
	veil.addColorStop(.2, "rgba(7,8,12,0)");
	veil.addColorStop(.78, "rgba(7,8,12,0)");
	veil.addColorStop(1, "rgba(7,8,12,0.35)");
	ctx.fillStyle = veil;
	ctx.fillRect(0, 0, 480, 270);
	drawRoomTab(ctx, room);
}
function playerSprite(art, player, time) {
	if (!player.grounded && art.jump.length) {
		let i = 3;
		if (player.vy < -220) i = 1;
		else if (player.vy < 40) i = 2;
		return art.jump[i] ?? art.jump[0];
	}
	if (Math.abs(player.vx) > 22 && art.run.length) return frameAt(art.run, time, 10);
	return frameAt(art.idle, time, 4) ?? art.idle[0] ?? null;
}
var EMPTY_TOUCH = {
	left: false,
	right: false,
	jump: false,
	down: false,
	shoot: false,
	dash: false,
	interact: false,
	missile: false
};
function freshSave() {
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
		checkpoint: {
			room: "gate",
			x: START.x,
			y: START.y
		}
	};
}
var Game = class {
	canvas;
	ctx;
	onUi;
	audio = new AudioBus();
	art = EMPTY_ART;
	keys = /* @__PURE__ */ new Set();
	edges = /* @__PURE__ */ new Set();
	touch = { ...EMPTY_TOUCH };
	prevTouch = { ...EMPTY_TOUCH };
	qa = null;
	prevQa = /* @__PURE__ */ new Set();
	raf = 0;
	last = 0;
	steps = 0;
	acc = 0;
	time = 0;
	save = freshSave();
	mode = "title";
	fileId = null;
	returnMode = "play";
	hasSave = false;
	tiles = [];
	roomId = "gate";
	cam = {
		x: 0,
		y: 0
	};
	snapCam = true;
	player = this.makePlayer(START.x, START.y);
	enemies = [];
	bullets = [];
	items = [];
	drops = [];
	bits = [];
	coyote = 0;
	buffer = 0;
	jumps = 1;
	drop = 0;
	dashT = 0;
	dashCd = 0;
	shootCd = 0;
	missileCd = 0;
	iframes = 0;
	dead = 0;
	hitstop = 0;
	shake = 0;
	hazardTick = 0;
	onOneWay = false;
	jumpHeld = false;
	phaseLeft = 0;
	toastText = "";
	toastT = 0;
	prompt = "";
	lastSnap = "";
	bossHp = 0;
	bossMax = 0;
	levelErrors = [];
	cracks = [];
	crackHits = /* @__PURE__ */ new Map();
	constructor(canvas, onUi) {
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
		loadArt().then((art) => {
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
	setTouch(partial) {
		this.touch = {
			...this.touch,
			...partial
		};
	}
	start(continued) {
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
	rideShaft(id) {
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
	openCodex(id) {
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
	makePlayer(x, y) {
		return {
			x,
			y,
			w: 16,
			h: 28,
			vx: 0,
			vy: 0,
			facing: 1,
			grounded: false,
			hp: 100,
			flash: 0
		};
	}
	installProbe() {
		window.__controlsTest = {
			getX: () => this.player.x,
			getY: () => this.player.y,
			getYaw: () => 0,
			getSpeed: () => Math.abs(this.player.vx),
			getVx: () => this.player.vx,
			getSteps: () => this.steps,
			getQa: () => this.qa ? [...this.qa] : null,
			setKeys: (codes) => {
				this.qa = new Set(codes);
			},
			setSteer: () => {}
		};
	}
	bind() {
		window.addEventListener("keydown", this.onKey);
		window.addEventListener("keyup", this.onUp);
		window.addEventListener("blur", this.onBlur);
	}
	onKey = (e) => {
		if ([
			"ArrowUp",
			"ArrowDown",
			"ArrowLeft",
			"ArrowRight",
			"Space"
		].includes(e.code)) e.preventDefault();
		this.keys.add(e.code);
		if (!e.repeat) this.edges.add(e.code);
	};
	onUp = (e) => {
		this.keys.delete(e.code);
	};
	onBlur = () => {
		this.keys.clear();
		this.edges.clear();
		this.touch = { ...EMPTY_TOUCH };
	};
	held(code) {
		if (this.qa) return this.qa.has(code);
		return this.keys.has(code);
	}
	actions() {
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
			pause: this.held("Escape")
		};
	}
	edge(codes, touchNow, touchPrev) {
		const qa = this.qa;
		if (qa) return codes.some((c) => qa.has(c) && !this.prevQa.has(c));
		if (touchNow && !touchPrev) return true;
		return codes.some((c) => this.edges.has(c));
	}
	frame = (now) => {
		try {
			this.frameInner(now);
		} catch (err) {
			window.__gameError = err instanceof Error ? err.stack ?? err.message : String(err);
			this.toastText = window.__gameError.slice(0, 180);
			this.toastT = 9;
			try {
				this.emit();
			} catch {}
		}
		this.raf = requestAnimationFrame(this.frame);
	};
	frameInner(now) {
		const dt = Math.min(.05, (now - this.last) / 1e3);
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
	resize() {
		const parent = this.canvas.parentElement;
		if (!parent) return;
		const rect = parent.getBoundingClientRect();
		if (rect.width < 20 || rect.height < 20) return;
		const aspect = 480 / 270;
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
	drawTitle() {
		const s = this.canvas.width / 480;
		this.ctx.setTransform(s, 0, 0, s, 0, 0);
		drawTitle(this.ctx, this.art, this.time);
	}
	draw() {
		const s = this.canvas.width / 480;
		this.ctx.setTransform(s, 0, 0, s, 0, 0);
		const room = ROOMS[this.roomId];
		const spots = [...room.terminals.map((t) => ({
			x: t.x,
			y: t.y,
			kind: "terminal"
		})), ...room.lifts.map((t) => ({
			x: t.x,
			y: t.y,
			kind: "lift",
			locked: !!t.need && !this.has(t.need)
		}))];
		if (room.console) spots.push({
			x: room.console.x,
			y: room.console.y,
			kind: "console"
		});
		if (room.elevator) spots.push({
			x: room.elevator.x,
			y: room.elevator.y,
			kind: "elevator",
			locked: !this.save.token
		});
		if (room.kiosk) spots.push({
			x: room.kiosk.x,
			y: room.kiosk.y,
			kind: "survey"
		});
		if (room.shaft) spots.push({
			x: room.shaft.x,
			y: room.shaft.y,
			kind: "shaft"
		});
		const sh = this.shake;
		this.ctx.save();
		this.ctx.translate((Math.random() - .5) * sh, (Math.random() - .5) * sh);
		drawWorld(this.ctx, this.art, room, this.tiles, this.cam, {
			...this.player,
			flash: this.iframes
		}, this.enemies.filter((e) => e.alive), this.bullets.map((b) => ({
			x: b.x,
			y: b.y,
			friendly: b.friendly,
			heavy: b.heavy
		})), this.items, spots, this.bits, this.time, this.save.power, this.drops.map((d) => ({
			kind: d.kind,
			x: d.x,
			y: d.y,
			life: d.life
		})));
		this.ctx.restore();
	}
	step(dt) {
		if (this.hitstop > 0) {
			this.hitstop -= dt;
			this.edges.clear();
			return;
		}
		const act = this.actions();
		this.steps += 1;
		const jumpEdge = this.edge([
			"KeyW",
			"ArrowUp",
			"Space"
		], this.touch.jump, this.prevTouch.jump);
		const shootEdge = this.edge([
			"KeyJ",
			"KeyK",
			"KeyX"
		], this.touch.shoot, this.prevTouch.shoot);
		const missileEdge = this.edge(["KeyM"], this.touch.missile, this.prevTouch.missile);
		const dashEdge = this.edge([
			"ShiftLeft",
			"ShiftRight",
			"KeyC"
		], this.touch.dash, this.prevTouch.dash);
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
			const cap = 190;
			if (p.vx > cap) p.vx = cap;
			if (p.vx < -190) p.vx = -190;
		}
		if (dashEdge && this.save.phase && this.dashCd <= 0) {
			this.dashT = DASH_TIME;
			this.phaseLeft = .22;
			this.dashCd = DASH_CD;
			p.vx = p.facing * 640;
			p.vy = Math.min(0, p.vy) * .25;
			this.audio.dash();
		}
		if (this.dashT > 0) {
			this.dashT -= dt;
			p.vx = p.facing * 640;
			if (this.dashT <= 0) p.vx = p.facing * 190;
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
			this.drop = .18;
			this.buffer = 0;
			p.grounded = false;
		} else if (wantJump && (this.coyote > 0 || this.save.boots && this.jumps > 0 && !p.grounded)) {
			if (this.coyote > 0) {
				this.jumps = (this.save.boots ? 2 : 1) - 1;
				this.coyote = 0;
			} else this.jumps -= 1;
			p.vy = JUMP_V;
			p.grounded = false;
			this.buffer = 0;
			this.audio.jump();
		}
		if (this.jumpHeld && !act.jump && p.vy < 0 && this.dashT <= 0) p.vy *= .55;
		this.jumpHeld = act.jump;
		let grav = p.vy < 0 ? GRAV_RISE : GRAV_FALL;
		if (Math.abs(p.vy) < 70) grav = 700;
		if (this.dashT > 0) grav *= .35;
		p.vy = Math.min(700, p.vy + grav * dt);
		this.drop = Math.max(0, this.drop - dt);
		this.moveX(dt, phasing);
		this.moveY(dt, phasing);
		this.unstick(phasing);
		this.hazards(dt);
		this.shootCd = Math.max(0, this.shootCd - dt);
		if ((shootEdge || act.shoot) && this.shootCd <= 0) {
			this.shootCd = .32;
			this.bullets.push({
				x: p.x + (p.facing > 0 ? p.w + 2 : -2),
				y: p.y + 12,
				vx: p.facing * 460,
				vy: 0,
				friendly: true,
				life: .62,
				dmg: 12,
				r: 4
			});
			this.audio.shoot();
		}
		this.missileCd = Math.max(0, this.missileCd - dt);
		if (missileEdge && this.missileCd <= 0) {
			if (this.save.missiles <= 0) this.toast("No missiles. They come off the dead.");
			else {
				this.save.missiles -= 1;
				this.missileCd = .42;
				this.bullets.push({
					x: p.x + (p.facing > 0 ? p.w + 2 : -8),
					y: p.y + 10,
					vx: p.facing * 360,
					vy: 0,
					friendly: true,
					life: .9,
					dmg: 36,
					r: 8,
					heavy: true
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
	roomH() {
		return this.tiles.length * 24;
	}
	roomW() {
		return (this.tiles[0]?.length ?? 0) * 24;
	}
	tileAt(px, py) {
		const x = Math.floor(px / 24);
		const y = Math.floor(py / 24);
		return this.tiles[y]?.[x] ?? 0;
	}
	forSolids(x, y, w, h, phasing, fn) {
		const x0 = Math.floor(x / 24);
		const y0 = Math.floor(y / 24);
		const x1 = Math.floor((x + w - .01) / 24);
		const y1 = Math.floor((y + h - .01) / 24);
		for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
			const t = this.tiles[ty]?.[tx] ?? 0;
			if (t === 0 || t === 2) continue;
			if (t === 4 && phasing) continue;
			fn(tx, ty, t);
		}
	}
	moveX(dt, phasing) {
		const p = this.player;
		p.x += p.vx * dt;
		this.forSolids(p.x, p.y, p.w, p.h, phasing, (tx, ty) => {
			const rx = tx * 24;
			const ry = ty * 24;
			if (Math.min(p.y + p.h, ry + 24) - Math.max(p.y, ry) < 6) return;
			if (p.vx > 0) {
				p.x = rx - p.w;
				p.vx = 0;
				this.dashT = 0;
			} else if (p.vx < 0) {
				p.x = rx + 24;
				p.vx = 0;
				this.dashT = 0;
			}
		});
	}
	moveY(dt, phasing) {
		const p = this.player;
		const prevBottom = p.y + p.h;
		p.y += p.vy * dt;
		let grounded = false;
		let one = false;
		this.forSolids(p.x, p.y, p.w, p.h, phasing, (tx, ty, t) => {
			const rx = tx * 24;
			const ry = ty * 24;
			if (Math.min(p.x + p.w, rx + 24) - Math.max(p.x, rx) < 4) return;
			if (p.vy > 0) {
				p.y = ry - p.h;
				p.vy = 0;
				grounded = true;
			} else if (p.vy < 0) {
				p.y = ry + 24;
				p.vy = 0;
			}
		});
		if (p.vy >= 0 && this.drop <= 0) {
			const x0 = Math.floor(p.x / 24);
			const x1 = Math.floor((p.x + p.w - .01) / 24);
			const y1 = Math.floor((p.y + p.h - .01) / 24);
			const y0 = Math.floor(prevBottom / 24);
			for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
				if ((this.tiles[ty]?.[tx] ?? 0) !== 2) continue;
				const top = ty * 24;
				if (Math.min(p.x + p.w, (tx + 1) * 24) - Math.max(p.x, tx * 24) < 4) continue;
				if (prevBottom <= top + 1 && p.y + p.h >= top) {
					p.y = top - p.h;
					p.vy = 0;
					grounded = true;
					one = true;
				}
			}
		}
		p.grounded = grounded;
		this.onOneWay = one;
	}
	unstick(phasing) {
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
	hazards(dt) {
		const p = this.player;
		let hot = false;
		const x0 = Math.floor(p.x / 24);
		const y0 = Math.floor(p.y / 24);
		const x1 = Math.floor((p.x + p.w - .01) / 24);
		const y1 = Math.floor((p.y + p.h - .01) / 24);
		for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.tiles[y]?.[x] === 3) hot = true;
		if (hot) {
			this.hazardTick -= dt;
			if (this.hazardTick <= 0) {
				this.hurt(10, p.x, false);
				this.hazardTick = .45;
			}
		} else this.hazardTick = 0;
	}
	hurt(dmg, fromX, knock = true) {
		if (this.iframes > 0 || this.dead > 0) return;
		this.player.hp = Math.max(0, this.player.hp - dmg);
		this.save.hp = this.player.hp;
		this.iframes = .7;
		this.shake = 6;
		this.hitstop = .045;
		if (knock) {
			this.player.vy = -160;
			this.player.vx = fromX < this.player.x ? 120 : -120;
		}
		this.audio.hurt();
		if (this.player.hp <= 0) {
			this.dead = .7;
			this.toast("Signal lost. Returning to last file.");
		}
	}
	kill() {
		this.player.hp = 0;
		this.dead = .45;
		this.toast("The shaft takes you. Last file still open.");
	}
	respawn() {
		const c = this.save.checkpoint;
		this.player.hp = 100;
		this.save.hp = 100;
		this.iframes = 1.1;
		this.dead = 0;
		this.enter(c.room, c.x, c.y);
	}
	updateEnemies(dt) {
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
				e.vx = Math.sign(p.x - e.x) * 46;
				e.x += e.vx * dt;
				e.x = Math.max(e.left, Math.min(e.right, e.x));
				e.y = e.baseY + Math.sin(this.time * 2 + e.x * .01) * 12;
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
			} else if (Math.abs(p.x - e.x) < 270 && Math.abs(p.y - e.y) < 56) {
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
						r: 4
					});
				}
			} else {
				if (!e.vx) e.vx = 60;
				if (e.x < e.left) e.vx = 60;
				if (e.x > e.right) e.vx = -60;
				e.x += e.vx * dt;
				e.facing = e.vx < 0 ? -1 : 1;
			}
			if (this.overlaps(p, e) && e.kind !== "boss") this.hurt(e.kind === "crawler" ? 16 : 12, e.x);
			if (e.kind === "boss" && this.overlaps(p, e)) this.hurt(18, e.x);
		}
		this.bossHp = bossHp;
		this.bossMax = bossMax;
	}
	updateBoss(e, dt) {
		const p = this.player;
		e.phaseT += dt;
		const t = e.phaseT % 4.8;
		if (t < .08) e.beamed = false;
		e.facing = p.x < e.x ? -1 : 1;
		if (t < 1.7) {
			e.vx = Math.sign(p.x - e.x) * 40;
			e.cd -= dt;
			if (e.cd <= 0) {
				e.cd = .16;
				this.bullets.push({
					x: p.x + (Math.random() - .5) * 80,
					y: Math.max(24, e.y - 20),
					vx: (Math.random() - .5) * 30,
					vy: 120,
					friendly: false,
					life: 3,
					dmg: 10,
					r: 5
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
	aimShot(x, y, speed, dmg) {
		const dx = this.player.x + 8 - x;
		const dy = this.player.y + 12 - y;
		const m = Math.hypot(dx, dy) || 1;
		this.bullets.push({
			x,
			y,
			vx: dx / m * speed,
			vy: dy / m * speed,
			friendly: false,
			life: 2.4,
			dmg,
			r: 4
		});
	}
	updateBullets(dt) {
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
			if (b.friendly) for (const e of this.enemies) {
				if (!e.alive) continue;
				if (this.hit(b.x, b.y, b.r, e)) {
					e.hp -= b.dmg;
					e.flash = .12;
					b.life = 0;
					this.hitstop = b.heavy ? .05 : .03;
					this.bits.push({
						x: b.x,
						y: b.y,
						vx: 40,
						vy: -40,
						life: .3,
						color: "#e3a23a"
					});
					if (e.hp <= 0) this.killEnemy(e);
				}
			}
			else if (this.hit(b.x, b.y, b.r, this.player)) {
				this.hurt(b.dmg, b.x);
				b.life = 0;
			}
		}
		this.bullets = this.bullets.filter((b) => b.life > 0).slice(-40);
	}
	killEnemy(e) {
		e.alive = false;
		this.audio.boom();
		this.shake = e.kind === "boss" ? 8 : 3;
		for (let i = 0; i < 10; i++) this.bits.push({
			x: e.x + e.w / 2,
			y: e.y + e.h / 2,
			vx: (Math.random() - .5) * 160,
			vy: (Math.random() - .7) * 160,
			life: .45,
			color: e.kind === "boss" ? "#e6c98a" : "#c4452d"
		});
		if (e.kind === "boss") {
			this.save.bossDead = true;
			if (!this.save.picked.includes("token-well")) this.items.push({
				id: "token-well",
				kind: "token",
				x: e.x + 20,
				y: e.y + 20
			});
			this.toast("The margin note stops moving.");
			this.persist();
		}
		this.spill(e);
	}
	spill(e) {
		(e.kind === "boss" ? [{
			id: "boss-heal",
			kind: "heal",
			amount: 45
		}, {
			id: "boss-msl",
			kind: "missile",
			amount: 8
		}] : e.elite ? [{
			kind: "heal",
			amount: 30
		}, {
			kind: "missile",
			amount: 4
		}] : Math.random() < .58 ? [{
			kind: "heal",
			amount: e.kind === "crawler" ? 22 : 16
		}] : [{
			kind: "missile",
			amount: Math.random() < .75 ? 2 : 5
		}]).forEach((pack, i) => {
			if (pack.id && this.save.picked.includes(pack.id)) return;
			this.drops.push({
				id: pack.id,
				kind: pack.kind,
				amount: pack.amount,
				x: e.x + e.w / 2 + (i === 0 ? -8 : 12),
				y: e.y + 8,
				vx: i === 0 ? -36 : 48,
				vy: -150,
				life: pack.id ? 9999 : 16
			});
		});
	}
	updateDrops(dt) {
		for (const d of this.drops) {
			d.life -= dt;
			d.vy += 980 * dt;
			d.x += d.vx * dt;
			d.y += d.vy * dt;
			d.vx *= .985;
			const col = Math.floor(d.x / 24);
			const row = Math.floor((d.y + 3) / 24);
			const t = this.tiles[row]?.[col] ?? 0;
			if ((t === 1 || t === 2 || t === 3) && d.vy > 0) {
				d.y = row * 24 - 2;
				d.vy = 0;
				d.vx *= .45;
			}
			if (d.x < 10) d.x = 10;
			if (d.x > this.roomW() - 10) d.x = this.roomW() - 10;
		}
		this.drops = this.drops.filter((d) => d.life > 0 && d.y < this.roomH() + 40);
	}
	takeDrops() {
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
	updateBits(dt) {
		for (const b of this.bits) {
			b.life -= dt;
			b.x += b.vx * dt;
			b.y += b.vy * dt;
			b.vy += 400 * dt;
		}
		this.bits = this.bits.filter((b) => b.life > 0).slice(-80);
	}
	overlaps(a, b) {
		return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
	}
	hit(x, y, r, b) {
		const cx = Math.max(b.x, Math.min(x, b.x + b.w));
		const cy = Math.max(b.y, Math.min(y, b.y + b.h));
		return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
	}
	transitions() {
		const room = ROOMS[this.roomId];
		const p = this.player;
		const floor = this.tiles.length - 2;
		const doorTop = (floor - 4) * 24;
		const doorBot = floor * 24;
		const mid = p.y + p.h / 2;
		const inDoor = mid > doorTop && mid < doorBot + 8;
		if (inDoor && p.x < 0 && room.links.left) this.tryLink("left");
		if (inDoor && p.x + p.w > this.roomW() && room.links.right) this.tryLink("right");
		if (room.hole && p.y + p.h > this.roomH() - 6) {
			const cx = p.x + p.w / 2;
			if (cx > room.hole.x && cx < room.hole.x + room.hole.w && room.links.down) this.tryLink("down");
		}
	}
	tryLink(dir) {
		const room = ROOMS[this.roomId];
		const lock = room.locks[dir];
		if (lock && !this.has(lock)) {
			if (dir === "right") this.player.x = this.roomW() - this.player.w - 6;
			if (dir === "left") this.player.x = 6;
			const msg = lock === "keycard" ? "Red keycard. Upper stacks." : lock === "power" ? "Cradle unpowered." : "Clearance missing.";
			this.toast(msg);
			return;
		}
		const link = room.links[dir];
		if (!link) return;
		this.enter(link.room, link.x, link.y);
	}
	has(lock) {
		if (lock === "keycard") return this.save.keycard;
		if (lock === "power") return this.save.power;
		return this.save.token;
	}
	interact() {
		const room = ROOMS[this.roomId];
		const spots = [...room.terminals.map((s) => ({
			...s,
			kind: "terminal"
		})), ...room.lifts.map((s) => ({
			...s,
			kind: "lift"
		}))];
		if (room.console) spots.push({
			...room.console,
			kind: "console"
		});
		if (room.elevator) spots.push({
			...room.elevator,
			kind: "elevator"
		});
		if (room.kiosk) spots.push({
			...room.kiosk,
			kind: "survey"
		});
		if (room.shaft) spots.push({
			...room.shaft,
			kind: "shaft"
		});
		let best = null;
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
			this.save.checkpoint = {
				room: this.roomId,
				x: this.player.x,
				y: this.player.y
			};
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
			this.save.checkpoint = {
				room: this.roomId,
				x: this.player.x,
				y: this.player.y
			};
			this.player.hp = 100;
			this.save.hp = 100;
			const named = zone === "surface" ? "Surface" : zone === "archive" ? "Archive" : zone === "bio" ? "Menagerie" : "Cradle";
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
	openHatch() {
		const hatch = ROOMS[this.roomId].hatch;
		if (!hatch) return;
		for (let y = hatch.y; y < hatch.y + hatch.h; y++) for (let x = hatch.x; x < hatch.x + hatch.w; x++) if (this.tiles[y]?.[x] !== void 0) this.tiles[y][x] = 0;
	}
	updatePrompt() {
		const room = ROOMS[this.roomId];
		const px = this.player.x + this.player.w / 2;
		const py = this.player.y + this.player.h;
		let prompt = "";
		const near = (s) => Math.hypot(s.x - px, s.y - py) < 56;
		for (const t of room.terminals) if (near(t)) prompt = "E / USE — read file";
		for (const l of room.lifts) if (near(l)) prompt = l.need === "power" ? "E / USE — surface lift" : "E / USE — service lift";
		if (room.console && near(room.console)) prompt = "E / USE — seat power cell";
		if (room.elevator && near(room.elevator)) prompt = "E / USE — surface elevator";
		if (room.kiosk && near(room.kiosk)) prompt = "E / USE — stamp this zone";
		if (room.shaft && near(room.shaft)) prompt = "E / USE — call the shaft";
		this.prompt = prompt;
	}
	followCam(dt) {
		const p = this.player;
		const look = p.facing * 36;
		let dx = p.x + p.w / 2 - 240 + look;
		let dy = p.y + p.h / 2 - 135 - 8;
		const maxX = Math.max(0, this.roomW() - 480);
		const maxY = Math.max(0, this.roomH() - 270);
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
	enter(room, x, y) {
		this.roomId = room;
		this.tiles = ROOMS[room].tiles.map((row) => row.slice());
		if (ROOMS[room].hatch && !this.save.power) {
			const hatch = ROOMS[room].hatch;
			for (let yy = hatch.y; yy < hatch.y + hatch.h; yy++) for (let xx = hatch.x; xx < hatch.x + hatch.w; xx++) if (this.tiles[yy]?.[xx] !== void 0) this.tiles[yy][xx] = 1;
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
	rebuild() {
		const room = ROOMS[this.roomId];
		this.enemies = room.enemies.filter((e) => !(e.kind === "boss" && this.save.bossDead)).map((e) => {
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
				cd: .6,
				flash: 0,
				phaseT: 0,
				beam: false,
				beamed: false,
				alive: true,
				elite: !!e.elite
			};
		});
		this.items = room.items.filter((i) => !this.save.picked.includes(i.id)).map((i) => ({ ...i }));
		if (this.roomId === "choir" && this.save.bossDead && !this.save.picked.includes("token-well")) this.items.push({
			id: "token-well",
			kind: "token",
			x: 1008,
			y: 364
		});
		this.bossHp = this.enemies.find((e) => e.kind === "boss")?.hp ?? 0;
		this.bossMax = this.bossHp;
	}
	bindCracks() {
		this.cracks = activeCracks(this.save.seed, ROOMS);
		this.crackHits.clear();
	}
	chipCrack(b) {
		const tx = Math.floor(b.x / 24);
		const ty = Math.floor(b.y / 24);
		const floor = this.tiles.length - 2;
		const crack = this.cracks.find((c) => c.room === this.roomId && tx >= c.col && tx < c.col + 6 && (ty === floor - 1 || ty === floor - 2));
		b.life = 0;
		if (!crack || this.save.opened.includes(crack.id)) return;
		const hits = (this.crackHits.get(crack.id) ?? 0) + (b.heavy ? 2 : 1);
		this.crackHits.set(crack.id, hits);
		this.bits.push({
			x: b.x,
			y: b.y,
			vx: 30,
			vy: -40,
			life: .25,
			color: "#c8b89a"
		});
		if (hits < 3) return;
		this.save.opened.push(crack.id);
		paintCloset(this.tiles, crack, true);
		this.seedPocket(crack);
		this.audio.boom();
		this.shake = 4;
		this.toast("False wall. Something was bricked in.");
		this.persist();
	}
	seedPockets() {
		for (const crack of this.cracks) if (crack.room === this.roomId && this.save.opened.includes(crack.id)) this.seedPocket(crack);
	}
	seedPocket(crack) {
		if (this.save.picked.includes(crack.id) || this.drops.some((d) => d.id === crack.id)) return;
		const x = (crack.col + 3) * 24;
		const y = (this.tiles.length - 2) * 24 - 14;
		if (crack.loot === "heal") this.drops.push({
			id: crack.id,
			kind: "heal",
			amount: 40,
			x,
			y,
			vx: 0,
			vy: 0,
			life: 9999
		});
		else if (crack.loot === "missile") this.drops.push({
			id: crack.id,
			kind: "missile",
			amount: 6,
			x,
			y,
			vx: 0,
			vy: 0,
			life: 9999
		});
		else this.drops.push({
			id: crack.id,
			kind: "scrap",
			amount: 0,
			file: crack.scrap,
			x,
			y,
			vx: 0,
			vy: 0,
			life: 9999
		});
	}
	notePocket() {
		const p = this.player;
		for (const crack of this.cracks) {
			if (crack.room !== this.roomId || !this.save.opened.includes(crack.id)) continue;
			const left = (crack.col + 1) * 24;
			const right = (crack.col + 5) * 24;
			if (p.x + p.w > left && p.x < right && !this.save.pockets.includes(this.roomId)) {
				this.save.pockets.push(this.roomId);
				this.persist();
			}
		}
	}
	seedBossDrops() {
		if (this.roomId !== "choir" || !this.save.bossDead) return;
		const y = 366;
		if (!this.save.picked.includes("boss-heal")) this.drops.push({
			id: "boss-heal",
			kind: "heal",
			amount: 45,
			x: 816,
			y,
			vx: 0,
			vy: 0,
			life: 9999
		});
		if (!this.save.picked.includes("boss-msl")) this.drops.push({
			id: "boss-msl",
			kind: "missile",
			amount: 8,
			x: 864,
			y,
			vx: 0,
			vy: 0,
			life: 9999
		});
	}
	collect() {
		const p = this.player;
		for (const item of this.items) if (Math.abs(item.x - (p.x + p.w / 2)) < 22 && Math.abs(item.y - (p.y + p.h / 2)) < 26) {
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
		this.items = this.items.filter((i) => !this.save.picked.includes(i.id));
	}
	toast(msg) {
		if (this.toastText === msg && this.toastT > .5) return;
		this.toastText = msg;
		this.toastT = 2.6;
	}
	persist() {
		this.save.hp = this.player.hp;
		this.save.x = this.player.x;
		this.save.y = this.player.y;
		this.save.room = this.roomId;
		try {
			localStorage.setItem(SAVE_KEY, JSON.stringify(this.save));
			this.hasSave = true;
		} catch {}
	}
	readSave() {
		try {
			const raw = localStorage.getItem(SAVE_KEY);
			if (!raw) return false;
			const data = JSON.parse(raw);
			if (data.version !== 1 || !ROOMS[data.room]) return false;
			this.save = {
				...freshSave(),
				...data,
				visited: data.visited ?? ["gate"]
			};
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
	snapshot() {
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
				locked: stop.locked
			}))
		};
	}
	emit() {
		this.collect();
		const snap = this.snapshot();
		const key = JSON.stringify(snap);
		if (key === this.lastSnap) return;
		this.lastSnap = key;
		this.onUi(snap);
	}
};
var GLYPH = {
	route: "T",
	platform: "J",
	combat: "X",
	boss: "W",
	lore: "F"
};
function SitePlate({ cells, big }) {
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
	const bridges = [];
	for (const a of visible) for (const b of visible) {
		if (!(a.doors.includes(b.id) || b.doors.includes(a.id))) continue;
		if (b.mx === a.mx + 1 && b.my === a.my) bridges.push({
			key: `${a.id}-${b.id}-h`,
			x: (a.mx - minX) * step + size,
			y: (a.my - minY) * step + size / 2 - 1,
			w: gap,
			h: 2,
			locked: a.locked || b.locked
		});
		if (b.my === a.my + 1 && b.mx === a.mx) bridges.push({
			key: `${a.id}-${b.id}-v`,
			x: (a.mx - minX) * step + size / 2 - 1,
			y: (a.my - minY) * step + size,
			w: 2,
			h: gap,
			locked: a.locked || b.locked
		});
	}
	const here = visible.find((cell) => cell.state === "here");
	const walked = visible.filter((cell) => cell.state === "walked" || cell.state === "here").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: big ? "plate big" : "plate",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "plate-grid",
			style: {
				width,
				height
			},
			role: "img",
			"aria-label": `${walked} panels walked${here ? `, now in ${here.name}` : ""}`,
			children: [bridges.map((bridge) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
				className: bridge.locked ? "bridge locked" : "bridge",
				style: {
					left: bridge.x,
					top: bridge.y,
					width: bridge.w,
					height: bridge.h
				}
			}, bridge.key)), visible.map((cell) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: `cell ${cell.state} ${cell.role} ${cell.biome}${cell.locked ? " locked" : ""}${cell.hint ? " hint" : ""}`,
				style: {
					left: (cell.mx - minX) * step,
					top: (cell.my - minY) * step,
					width: size,
					height: size
				},
				title: cell.name ? `${cell.name}. ${cell.stamp}` : void 0,
				children: [GLYPH[cell.role], cell.notch ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "notch" }) : null]
			}, cell.id))]
		}), big ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "plate-caption",
			children: [
				walked,
				" walked. Dashed rooms are doors you can see, or a zone a bench has stamped. Spine cells marked core are the shaft. A dot is a pocket you stepped into. The amber edge is the next job, once that room is on the plate.",
				here ? ` You are in ${here.name}.` : ""
			]
		}) : null]
	});
}
var INITIAL = {
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
	shaft: []
};
function GameApp() {
	const canvasRef = (0, import_react.useRef)(null);
	const gameRef = (0, import_react.useRef)(null);
	const [ui, setUi] = (0, import_react.useState)(INITIAL);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const game = new Game(canvas, setUi);
		gameRef.current = game;
		return () => game.destroy();
	}, []);
	const file = ui.fileId ? FILES[ui.fileId] : null;
	const showHud = ui.mode !== "title";
	const pips = Math.max(0, Math.round(ui.hp / ui.maxHp * 10));
	const press = (partial, down) => {
		const next = {};
		for (const key of Object.keys(partial)) next[key] = down;
		gameRef.current?.setTouch(next);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "shell",
		children: [
			showHud ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "hud",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "brand",
						children: "ROOK / M-17"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "sub",
						children: ui.roomName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hp",
						"aria-label": `Health ${ui.hp}`,
						children: Array.from({ length: 10 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: i < pips ? "pip on" : "pip" }, i))
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "depth",
					children: [ui.depth, ui.bossMax > 0 ? " · CHOIR" : ""]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "abilities",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: ui.missiles > 0 ? "tag on" : "tag",
							children: ["MSL ", ui.missiles]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: ui.boots ? "tag on" : "tag",
							children: "LEGS"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: ui.phase ? "tag on" : "tag",
							children: "VEIL"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: ui.keycard ? "tag on" : "tag",
							children: "CARD"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: ui.cell ? "tag on" : "tag",
							children: "CELL"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: ui.token ? "tag on" : "tag",
							children: "TOKEN"
						})
					]
				})] })]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "hud",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "brand",
					children: "BLACK SITE"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sub",
					children: "clearance for depth"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "stage",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
						ref: canvasRef,
						tabIndex: 0,
						"aria-label": "Site 51 descent"
					}),
					ui.toast && ui.mode === "play" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "toast",
						children: ui.toast
					}) : null,
					ui.mode === "play" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "plate-dock",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SitePlate, { cells: ui.map })
					}) : null,
					ui.mode === "title" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "kicker",
									children: "Area 51 · facilities night shift"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
									className: "title",
									children: [
										"SITE 51",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
										"BELOW"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "lede",
									children: "You are Rook, badge M-17. The siren is already on. The cover story gets thinner every floor down: soldiers, then cryptids, then a craft that was built here, then a chapel that edits the page you are standing on. Read what they filed. Bring yourself back."
								}),
								ui.fault ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "lede fault",
									children: ui.fault
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SitePlate, {
									cells: ui.map,
									big: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "row",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "btn",
										onClick: () => gameRef.current?.start(false),
										children: "Descend"
									}), ui.hasSave ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "btn ghost",
										onClick: () => gameRef.current?.start(true),
										children: "Continue"
									}) : null]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "keys",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "A D move" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "W / Space jump" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "J fire" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "M missile, once a body drops one" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Shift dash, once you are less here" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "E read, stamp a bench, or call the shaft" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Down + jump drops through grates" })
									]
								})
							]
						})
					}) : null,
					ui.mode === "shaft" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "kicker",
									children: "Vent core · car offline"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "title",
									children: "Shaft"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "lede",
									children: "The car is frozen in the well. Landings you have already opened will answer. Omega answers only after the cradle is live."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "codex",
									children: ui.shaft.map((stop) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										disabled: !stop.open,
										onClick: () => gameRef.current?.rideShaft(stop.id),
										children: [
											stop.name,
											" — ",
											stop.open ? stop.line : stop.locked
										]
									}, stop.id))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "row",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "btn ghost",
										onClick: () => gameRef.current?.closeShaft(),
										children: "Stay"
									})
								})
							]
						})
					}) : null,
					ui.mode === "pause" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "kicker",
									children: "Hold"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "title",
									children: "Paused"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "lede",
									children: ui.objective
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SitePlate, {
									cells: ui.map,
									big: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "codex",
									children: [ui.files.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "lede",
										children: "No files yet. Terminals remember you."
									}) : null, ui.files.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => gameRef.current?.openCodex(id),
										children: FILES[id]?.title ?? id
									}, id))]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "row",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: "btn",
											onClick: () => gameRef.current?.togglePause(),
											children: "Resume"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: "btn ghost",
											onClick: () => gameRef.current?.toggleMute(),
											children: ui.muted ? "Sound on" : "Mute"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: "btn ghost",
											onClick: () => gameRef.current?.abandon(),
											children: "Abandon shift"
										})
									]
								})
							]
						})
					}) : null,
					ui.mode === "file" && file ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "kicker",
									children: file.dept
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "title",
									children: file.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "file-body",
									children: file.body
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn",
									onClick: () => gameRef.current?.closeFile(),
									children: "Close file"
								})
							]
						})
					}) : null,
					ui.mode === "ending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "kicker",
									children: "Clearance accepted"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "title",
									children: "Same night"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "file-body",
									children: `The elevator opens on the desert you left. The motor-pool radio is calling a breach that started eleven minutes ago. Your watch says you were under for hours.

At the gate, someone in your vest badges in and does not look up.

The pager buzzes. Timestamped tomorrow.

BRING YOURSELF BACK.

Depth remains.`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn",
									onClick: () => gameRef.current?.abandon(),
									children: "Clock out"
								})
							]
						})
					}) : null
				]
			}),
			showHud ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "footer-bar",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: ui.prompt || ui.objective }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "btn ghost",
					onClick: () => gameRef.current?.togglePause(),
					children: "Pause"
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "touch",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pad",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onPointerDown: (e) => {
								e.preventDefault();
								press({ left: true }, true);
							},
							onPointerUp: () => press({ left: false }, false),
							onPointerLeave: () => press({ left: false }, false),
							children: "LEFT"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onPointerDown: (e) => {
								e.preventDefault();
								press({ right: true }, true);
							},
							onPointerUp: () => press({ right: false }, false),
							onPointerLeave: () => press({ right: false }, false),
							children: "RIGHT"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onPointerDown: (e) => {
								e.preventDefault();
								press({ down: true }, true);
							},
							onPointerUp: () => press({ down: false }, false),
							onPointerLeave: () => press({ down: false }, false),
							children: "DOWN"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onPointerDown: (e) => {
								e.preventDefault();
								press({ jump: true }, true);
							},
							onPointerUp: () => press({ jump: false }, false),
							onPointerLeave: () => press({ jump: false }, false),
							children: "JUMP"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "actions",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onPointerDown: (e) => {
								e.preventDefault();
								press({ dash: true }, true);
							},
							onPointerUp: () => press({ dash: false }, false),
							onPointerLeave: () => press({ dash: false }, false),
							children: "DASH"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onPointerDown: (e) => {
								e.preventDefault();
								press({ shoot: true }, true);
							},
							onPointerUp: () => press({ shoot: false }, false),
							onPointerLeave: () => press({ shoot: false }, false),
							children: "FIRE"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onPointerDown: (e) => {
								e.preventDefault();
								press({ missile: true }, true);
							},
							onPointerUp: () => press({ missile: false }, false),
							onPointerLeave: () => press({ missile: false }, false),
							children: "MSL"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onPointerDown: (e) => {
								e.preventDefault();
								press({ interact: true }, true);
							},
							onPointerUp: () => press({ interact: false }, false),
							onPointerLeave: () => press({ interact: false }, false),
							children: "USE"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onPointerDown: (e) => {
								e.preventDefault();
								gameRef.current?.togglePause();
							},
							children: "MENU"
						})
					]
				})]
			})
		]
	});
}
var SplitComponent = GameApp;
//#endregion
export { SplitComponent as component };
