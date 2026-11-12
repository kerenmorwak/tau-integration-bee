// Original synthesized cues for the projector; no external audio files.
// Browsers only allow sound after a click, so the host screen starts it from a button.
export class Sound {
  constructor() { this.on = false; this.ac = null; this.cur = []; this.vol = 0.35; this.rollStart = null; }

  async enable() {
    if (!this.ac) {
      this.ac = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ac.createGain(); this.master.gain.value = this.vol;
      const comp = this.ac.createDynamicsCompressor(); this.master.connect(comp); comp.connect(this.ac.destination);
      const len = this.ac.sampleRate; this.noiseBuf = this.ac.createBuffer(1, len, len);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    await this.ac.resume(); this.on = true;
  }
  disable() { this.stop(); this.on = false; this.ac && this.ac.suspend(); }
  setVolume(v) { this.vol = Math.max(0, Math.min(1, Number(v) || 0)); if (this.master) this.master.gain.setTargetAtTime(this.vol, this.now, .03); }

  // ---------- building blocks ----------
  get now() { return this.ac.currentTime; }
  track(node) { this.cur.push(node); return node; }
  stop(at = this.ac?.currentTime) {
    if (!this.ac) return;
    const t = at;
    this.cur.forEach(n => { try { if (n.gain) { n.gain.cancelScheduledValues(t); n.gain.setTargetAtTime(0, t, .03); } else n.stop(t + .12); } catch {} });
    this.cur = [];
    this.cdEnd = null; this.rollStart = null;
  }
  env(t, peak, a, d, dest = this.master, keep = false) {
    const g = this.ac.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    g.connect(dest); if (keep) this.track(g); return g;
  }
  osc(type, f, t, dur, dest, keep) { const o = this.ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.connect(dest); o.start(t); o.stop(t + dur + .05); if (keep) this.track(o); return o; }
  noise(t, dur, dest, keep) { const s = this.ac.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; s.connect(dest); s.start(t); s.stop(t + dur + .05); if (keep) this.track(s); return s; }

  tick(t, hi) {
    this.osc("triangle", hi ? 1760 : 1180, t, .05, this.env(t, hi ? .5 : .32, .002, .05, this.master, true), true);
    const f = this.ac.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 3000; f.connect(this.env(t, .18, .001, .03, this.master, true));
    this.noise(t, .04, f, true);
  }
  thump(t, peak = .9) {
    const g = this.env(t, peak, .005, .28, this.master, true);
    const o = this.osc("sine", 95, t, .32, g, true); o.frequency.exponentialRampToValueAtTime(42, t + .25);
  }
  chord(t, freqs, dur, peak, type = "sawtooth", cutoff = 2400) {
    const f = this.ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = cutoff; f.connect(this.env(t, peak, .01, dur, this.master, true));
    freqs.forEach((fr, i) => { this.osc(type, fr, t, dur + .1, f, true).detune.value = (i % 2 ? 7 : -7); });
  }

  // ---------- cues ----------
  /** quiet pad while people join */
  lobby() {
    if (!this.on) return; this.stop(); const t = this.now;
    const g = this.ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + 2); g.connect(this.master); this.track(g);
    const f = this.ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700; f.connect(g);
    const lfo = this.ac.createOscillator(); lfo.frequency.value = .15; const lg = this.ac.createGain(); lg.gain.value = 300; lfo.connect(lg); lg.connect(f.frequency); lfo.start(t); this.track(lfo);
    [110, 164.8, 220, 277.2].forEach((fr, i) => { const o = this.ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = fr; o.detune.value = i * 4 - 6; o.connect(f); o.start(t); this.track(o); });
  }
  /** silence while the question is read, so the host's voice is clear */
  reading() { if (this.on) this.stop(); }
  /** ticking clock + heartbeat + rising tension, ending exactly when the clock hits zero.
   *  At zero a drum roll takes over and keeps building until reveal() cuts it. */
  countdown(secondsLeft) {
    if (!this.on) return; this.stop(); const t = this.now, end = t + secondsLeft;
    this.cdEnd = end;
    const g = this.ac.createGain(); g.gain.setValueAtTime(.06, t); g.gain.linearRampToValueAtTime(.26, end); g.gain.setTargetAtTime(0, end, .05); g.connect(this.master); this.track(g);
    const f = this.ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(250, t); f.frequency.exponentialRampToValueAtTime(2200, end); f.connect(g);
    [55, 58.3, 110].forEach(fr => { const o = this.ac.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(fr, t); o.frequency.linearRampToValueAtTime(fr * 1.5, end); o.connect(f); o.start(t); o.stop(end + .3); this.track(o); });
    const whole = Math.floor(secondsLeft);
    for (let k = 0; k <= whole; k++) {
      const at = end - k; if (at < t) continue;
      this.tick(at, k <= 3);
      if (k <= 3 && k > 0 && at - .5 >= t) this.tick(at - .5, true);
      this.thump(at, k <= 3 ? .9 : .55);
    }
    this.rollFrom(end);
  }
  /** Starts at zero and stays audible until the actual reveal, even on a slow connection. */
  rollFrom(t, build = 2.5) {
    this.rollStart = t;
    const hold = 8;
    const g = this.ac.createGain(); g.gain.setValueAtTime(.03, t); g.gain.exponentialRampToValueAtTime(.55, t + build); g.connect(this.master); this.track(g);
    const f = this.ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.setValueAtTime(450, t); f.frequency.exponentialRampToValueAtTime(1700, t + build); f.Q.value = .8; f.connect(g);
    const noise = this.ac.createBufferSource(); noise.buffer = this.noiseBuf; noise.loop = true;
    noise.connect(f); noise.start(t); this.track(noise);
    for (let i = 0; i < hold * 12; i++) { const at = t + i / 12, k = Math.min(1, (at - t) / build); this.thump(at, .15 + .35 * k); }
    const rg = this.ac.createGain(); rg.gain.setValueAtTime(.0001, t); rg.gain.exponentialRampToValueAtTime(.12, t + build); rg.connect(this.master); this.track(rg);
    const o = this.ac.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(220, t + build); o.connect(rg); o.start(t); this.track(o);
  }
  /** answers are being checked: if the clock already ran out the roll is playing; if revealed early, start one now */
  roll() {
    if (!this.on) return;
    if (this.rollStart != null && this.now >= this.rollStart) return;
    this.stop(); this.rollFrom(this.now, .35);
  }
  crash(t, peak = .5, dur = 1.8) {
    const f = this.ac.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 4500; f.connect(this.env(t, peak, .003, dur, this.master, true));
    this.noise(t, dur, f, true);
  }
  hit(t, freqs, dur, peak) {
    this.chord(t, freqs, dur, peak, "sawtooth", 3800);
    const sg = this.env(t, .6, .005, dur * .7, this.master, true); this.osc("sine", 65.4, t, dur, sg, true);
    this.crash(t, .3, dur);
  }
  /** the answer: a big hit; if seats go dark, a heavy drop and a falling "you're out" phrase */
  reveal(eliminated) {
    if (!this.on) return;
    const t = this.now + (this.rollStart != null ? Math.max(0, .35 - (this.now - this.rollStart)) : 0);
    this.stop(t);
    this.hit(t, [261.6, 329.6, 392, 523.3, 659.3, 784], 2.2, .26);
    if (eliminated > 0) {
      const t2 = t + .45;
      const g = this.env(t2, .75, .01, 2.4, this.master, true);
      const o = this.osc("sine", 82, t2, 2.5, g, true); o.frequency.exponentialRampToValueAtTime(30, t2 + 2.2);
      const nf = this.ac.createBiquadFilter(); nf.type = "lowpass"; nf.frequency.value = 700; nf.connect(this.env(t2, .45, .005, 1.4, this.master, true));
      this.noise(t2, 1.5, nf, true);
      // falling three-note phrase, the last one long with a wobble
      [[392, .32], [370, .32], [349.2, .32], [329.6, 1.3]].forEach(([fr, d], i) => {
        const at = t2 + .3 + i * .36;
        const lf = this.ac.createBiquadFilter(); lf.type = "lowpass"; lf.frequency.value = 1400; lf.connect(this.env(at, .32, .02, d, this.master, true));
        const n = this.osc("sawtooth", fr, at, d, lf, true);
        if (i === 3) { const v = this.ac.createOscillator(); v.frequency.value = 6; const vg = this.ac.createGain(); vg.gain.value = 9; v.connect(vg); vg.connect(n.frequency); v.start(at); v.stop(at + d); this.track(v); n.frequency.linearRampToValueAtTime(fr * .94, at + d); }
      });
    } else {
      [523.3, 659.3, 784, 1046.5, 1318.5].forEach((fr, i) => this.osc("triangle", fr, t + .3 + i * .09, .4, this.env(t + .3 + i * .09, .28, .005, .4, this.master, true), true));
    }
  }
  /** winners: rising brass call, timpani build, and a long held final chord with a cymbal */
  fanfare() {
    if (!this.on) return; this.stop(); this.cdEnd = null; const t = this.now;
    [[392, 0], [392, .14], [392, .28], [523.3, .42]].forEach(([fr, at]) => this.chord(t + at, [fr, fr * 2], .2, .32, "square", 3200));
    this.chord(t + .62, [659.3, 1318.5], .3, .32, "square", 3200);
    this.chord(t + .95, [523.3, 1046.5], .35, .32, "square", 3200);
    for (let i = 0; i < 18; i++) this.thump(t + .9 + i * .07, .25 + i * .035);   // timpani roll into the chord
    const T = t + 2.2;
    this.hit(T, [130.8, 261.6, 329.6, 392, 523.3, 659.3, 784, 1046.5], 4.2, .24);
    this.crash(T, .38, 3.5);
    this.thump(T, .8); this.thump(T + .5, .6);
  }
}
