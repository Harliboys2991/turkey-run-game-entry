// Synthesised sound, WebAudio only — no audio files, no network. Everything is
// a short oscillator blip, so the game stays silent until the player interacts.

export class Sounds {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type = 'sine', gain = 0.12, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  jump() {
    this.tone(280, 0.16, 'sine', 0.1, 560);
  }

  coin() {
    this.tone(880, 0.09, 'sine', 0.1);
    setTimeout(() => this.tone(1320, 0.12, 'sine', 0.09), 70);
  }

  hit() {
    this.tone(160, 0.25, 'sawtooth', 0.14, 60);
  }

  gobble() {
    this.tone(220, 0.09, 'square', 0.07, 180);
    setTimeout(() => this.tone(200, 0.09, 'square', 0.07, 160), 110);
  }

  level() {
    this.tone(523, 0.1, 'sine', 0.09);
    setTimeout(() => this.tone(784, 0.14, 'sine', 0.09), 100);
  }

  win() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'sine', 0.1), i * 130));
  }

  lose() {
    [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'triangle', 0.1), i * 150));
  }
}
