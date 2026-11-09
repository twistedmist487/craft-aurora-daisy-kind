export class AudioBus {
  private ctx: AudioContext | null = null;
  muted = false;
  private pad: { osc: OscillatorNode; gain: GainNode } | null = null;

  unlock() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") void this.ctx.resume();
    if (!this.pad) this.startPad();
  }

  toggle() {
    this.muted = !this.muted;
    if (this.pad) this.pad.gain.gain.value = this.muted ? 0 : 0.015;
    return this.muted;
  }

  private startPad() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 55;
    gain.gain.value = this.muted ? 0 : 0.012;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    this.pad = { osc, gain };
  }

  setBiome(biome: string) {
    if (!this.pad || !this.ctx) return;
    const freq = biome === "choir" ? 73 : biome === "bio" ? 49 : biome === "hangar" ? 62 : biome === "archive" ? 58 : 52;
    this.pad.osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.4);
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0) {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, this.ctx.currentTime + dur);
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + dur + 0.02);
  }

  jump() {
    this.tone(220, 0.12, "square", 0.04, 180);
  }
  shoot() {
    this.tone(520, 0.06, "square", 0.03, -300);
  }
  missile() {
    this.tone(180, 0.12, "sawtooth", 0.045, -80);
  }
  dash() {
    this.tone(160, 0.14, "sawtooth", 0.03, 240);
  }
  hurt() {
    this.tone(110, 0.16, "square", 0.05, -70);
  }
  pickup() {
    this.tone(440, 0.08, "square", 0.04, 0);
    this.tone(660, 0.12, "square", 0.03, 0);
  }
  file() {
    this.tone(330, 0.1, "triangle", 0.04, 0);
    this.tone(494, 0.16, "triangle", 0.03, 0);
  }
  boom() {
    this.tone(70, 0.28, "sawtooth", 0.05, -40);
  }
}
