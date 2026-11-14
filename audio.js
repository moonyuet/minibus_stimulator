/* =========================================================================
   audio.js — Procedural Web Audio engine, sirens, warnings and passenger voices.
   Red Van Daredevil · classic scripts, shared global lexical scope
   ========================================================================= */
"use strict";

  /* -----------------------------------------------------------------------
     Audio
     ----------------------------------------------------------------------- */
  const AudioKit = {
    ctx: null,
    master: null,
    engineGain: null,
    engineOscs: [],
    engineFilter: null,
    windGain: null,
    rattleGain: null,
    whineGain: null,
    whineOsc: null,
    turboGain: null,
    sirenGain: null,
    sirenOscs: [],
    sirenLfo: null,
    sirenActive: false,
    muted: false,
    noiseBuf: null,
    started: false,

    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.58;
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 14;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.24;
      this.master.connect(compressor);
      compressor.connect(this.ctx.destination);

      // noise buffer for wind / crashes
      const len = this.ctx.sampleRate * 2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.2 + white * 0.25;
      }
      this.buildEngine();
      this.applyMute();
    },

    buildEngine() {
      const c = this.ctx;
      this.engineGain = c.createGain();
      this.engineGain.gain.value = 0;
      this.engineFilter = c.createBiquadFilter();
      this.engineFilter.type = "lowpass";
      this.engineFilter.frequency.value = 420;
      this.engineFilter.Q.value = 3;
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.master);

      for (const [type, freq, detune] of [["sawtooth", 48, -5], ["square", 49.5, 7]]) {
        const osc = c.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = detune;
        const g = c.createGain();
        g.gain.value = type === "sawtooth" ? 0.5 : 0.22;
        osc.connect(g);
        g.connect(this.engineFilter);
        osc.start();
        this.engineOscs.push(osc);
      }

      // wind / tyre noise
      const src = c.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const bp = c.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 900;
      bp.Q.value = 0.7;
      this.windGain = c.createGain();
      this.windGain.gain.value = 0;
      src.connect(bp);
      bp.connect(this.windGain);
      this.windGain.connect(this.master);
      src.start();

      // Diesel combustion rattle (amplitude-modulated band-passed noise).
      const rattleSrc = c.createBufferSource();
      rattleSrc.buffer = this.noiseBuf;
      rattleSrc.loop = true;
      const rattleFilter = c.createBiquadFilter();
      rattleFilter.type = "bandpass";
      rattleFilter.frequency.value = 165;
      rattleFilter.Q.value = 1.2;
      this.rattleGain = c.createGain();
      this.rattleGain.gain.value = 0;
      rattleSrc.connect(rattleFilter);
      rattleFilter.connect(this.rattleGain);
      this.rattleGain.connect(this.master);
      const rattleLfo = c.createOscillator();
      rattleLfo.type = "sine";
      rattleLfo.frequency.value = 14;
      const rattleLfoGain = c.createGain();
      rattleLfoGain.gain.value = 0.008;
      rattleLfo.connect(rattleLfoGain);
      rattleLfoGain.connect(this.rattleGain.gain);
      rattleLfo.start();
      rattleSrc.start();

      // Gearbox whine.
      this.whineOsc = c.createOscillator();
      this.whineOsc.type = "sine";
      this.whineOsc.frequency.value = 320;
      this.whineGain = c.createGain();
      this.whineGain.gain.value = 0;
      this.whineOsc.connect(this.whineGain);
      this.whineGain.connect(this.master);
      this.whineOsc.start();

      // Turbo / intake hiss.
      const turboSrc = c.createBufferSource();
      turboSrc.buffer = this.noiseBuf;
      turboSrc.loop = true;
      const turboFilter = c.createBiquadFilter();
      turboFilter.type = "highpass";
      turboFilter.frequency.value = 2600;
      this.turboGain = c.createGain();
      this.turboGain.gain.value = 0;
      turboSrc.connect(turboFilter);
      turboFilter.connect(this.turboGain);
      this.turboGain.connect(this.master);
      turboSrc.start();
    },

    update(ratio, boosting, active) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const rpm = 0.16 + ratio * 0.84;
      for (let i = 0; i < this.engineOscs.length; i++) {
        this.engineOscs[i].frequency.setTargetAtTime(
          (i === 0 ? 44 : 46) + rpm * (i === 0 ? 122 : 126),
          t,
          0.06
        );
      }
      this.engineFilter.frequency.setTargetAtTime(360 + ratio * 980 + (boosting ? 500 : 0), t, 0.08);
      this.engineGain.gain.setTargetAtTime(active ? 0.035 + ratio * 0.045 : 0.012, t, 0.1);
      this.windGain.gain.setTargetAtTime(active ? ratio * 0.055 + (boosting ? 0.03 : 0) : 0.006, t, 0.15);
      if (this.rattleGain) {
        this.rattleGain.gain.setTargetAtTime(active ? 0.009 + ratio * 0.02 : 0.002, t, 0.1);
      }
      if (this.whineOsc && this.whineGain) {
        this.whineOsc.frequency.setTargetAtTime(280 + ratio * 880, t, 0.08);
        this.whineGain.gain.setTargetAtTime(active ? 0.0025 + ratio * 0.008 : 0, t, 0.1);
      }
      if (this.turboGain) {
        this.turboGain.gain.setTargetAtTime(boosting ? 0.022 : 0.001, t, 0.1);
      }
    },

    applyMute() {
      if (!this.master) return;
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.58, this.ctx.currentTime, 0.04);
    },

    toggle() {
      this.muted = !this.muted;
      this.applyMute();
      if (this.muted) {
        this.stopVoice();
        this.stopSiren();
      } else if (state.policeChase) {
        this.startSiren();
      }
      return this.muted;
    },

    beep(freq, dur, type = "square", vol = 0.08, slide = 0) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    },

    noise(dur, freq, vol, type = "bandpass", q = 1) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = type;
      f.frequency.setValueAtTime(freq, t);
      f.Q.value = q;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.04);
    },

    click() { this.init(); this.beep(320, 0.05, "square", 0.035, 130); },

    speedWarning(count) {
      if (!this.ctx || this.muted) return;
      const fast = count >= 4;
      const freq = fast ? 2580 : 2360;
      const spacing = fast ? 0.098 : 0.165;
      const dur = fast ? 0.055 : 0.068;
      const vol = fast ? 0.038 : 0.034;
      const start = this.ctx.currentTime + 0.01;

      for (let i = 0; i < count; i++) {
        const t = start + i * spacing;

        // Two slightly detuned squares into a nasal band-pass: the cheap
        // dashboard piezo buzzer, not a musical beep.
        const buzz = this.ctx.createBiquadFilter();
        buzz.type = "bandpass";
        buzz.frequency.setValueAtTime(freq * 1.06, t);
        buzz.Q.value = 1.25;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(vol, t + 0.004);
        gain.gain.setValueAtTime(vol, t + dur * 0.58);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        buzz.connect(gain);
        gain.connect(this.master);

        for (const detune of [1, 1.012]) {
          const osc = this.ctx.createOscillator();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq * detune, t);
          osc.frequency.exponentialRampToValueAtTime(freq * detune * 0.965, t + dur);
          osc.connect(buzz);
          osc.start(t);
          osc.stop(t + dur + 0.025);
        }

        // A tiny relay click at the leading edge gives the beep its mechanical bite.
        if (this.noiseBuf) {
          const click = this.ctx.createBufferSource();
          click.buffer = this.noiseBuf;
          const hp = this.ctx.createBiquadFilter();
          hp.type = "highpass";
          hp.frequency.value = 3600;
          const cg = this.ctx.createGain();
          cg.gain.setValueAtTime(0.009, t);
          cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
          click.connect(hp);
          hp.connect(cg);
          cg.connect(this.master);
          click.start(t);
          click.stop(t + 0.014);
        }
      }
    },

    startSiren() {
      if (!this.ctx || this.muted || this.sirenActive) return;
      const t = this.ctx.currentTime;
      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.setValueAtTime(0.0001, t);
      this.sirenGain.gain.exponentialRampToValueAtTime(0.018, t + 0.15);
      this.sirenGain.connect(this.master);
      this.sirenOscs = [];
      for (const [type, freq, detune] of [["sawtooth", 660, -4], ["square", 670, 8]]) {
        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = detune;
        osc.connect(this.sirenGain);
        osc.start(t);
        this.sirenOscs.push(osc);
      }
      this.sirenLfo = this.ctx.createOscillator();
      this.sirenLfo.type = "sine";
      this.sirenLfo.frequency.value = 1.65;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 145;
      this.sirenLfo.connect(lfoGain);
      for (const osc of this.sirenOscs) lfoGain.connect(osc.frequency);
      this.sirenLfo.start(t);
      this.sirenActive = true;
    },

    stopSiren() {
      if (!this.ctx || !this.sirenActive) return;
      const t = this.ctx.currentTime;
      try {
        this.sirenGain.gain.cancelScheduledValues(t);
        this.sirenGain.gain.setTargetAtTime(0.0001, t, 0.04);
        for (const osc of this.sirenOscs) osc.stop(t + 0.22);
        if (this.sirenLfo) this.sirenLfo.stop(t + 0.22);
      } catch (e) { /* ignore */ }
      this.sirenOscs = [];
      this.sirenLfo = null;
      this.sirenGain = null;
      this.sirenActive = false;
    },

    camera() {
      this.noise(0.1, 3500, 0.16, "highpass", 0.8);
      this.beep(1480, 0.07, "square", 0.05, -220);
    },

    bikeBell() {
      if (!this.ctx || this.muted) return;
      this.beep(2240, 0.08, "sine", 0.045, 180);
      setTimeout(() => this.beep(2380, 0.1, "sine", 0.04, -120), 130);
    },

    fine() {
      if (!this.ctx || this.muted) return;
      this.beep(560, 0.07, "square", 0.04, -60);
      setTimeout(() => this.beep(390, 0.1, "square", 0.035, -40), 80);
    },

    scream(intensity = 1) {
      if (!this.ctx || this.muted) return;
      const t0 = this.ctx.currentTime + 0.012;
      const voices = intensity > 1 ? 3 : 1;
      this.noise(0.42, 1600, 0.022, "bandpass", 1.5);
      for (let v = 0; v < voices; v++) {
        const base = 440 + v * 82 + Math.random() * 45;
        const t = t0 + v * 0.075;
        const dur = 0.62 + Math.random() * 0.22;
        const osc = this.ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(base * 1.35, t);
        osc.frequency.exponentialRampToValueAtTime(base * 0.72, t + dur);

        const lfo = this.ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 6.5 + Math.random() * 2;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 14 + Math.random() * 8;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        const f1 = this.ctx.createBiquadFilter();
        f1.type = "bandpass";
        f1.frequency.value = 860;
        f1.Q.value = 2.1;
        const f2 = this.ctx.createBiquadFilter();
        f2.type = "bandpass";
        f2.frequency.value = 1900;
        f2.Q.value = 2.6;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.026, t + 0.025);
        gain.gain.setValueAtTime(0.023, t + dur * 0.68);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        osc.connect(f1);
        f1.connect(gain);
        osc.connect(f2);
        f2.connect(gain);
        gain.connect(this.master);
        osc.start(t);
        lfo.start(t);
        osc.stop(t + dur + 0.03);
        lfo.stop(t + dur + 0.03);
      }
    },

    laugh() {
      if (!this.ctx || this.muted) return;
      const t0 = this.ctx.currentTime + 0.01;
      this.noise(0.38, 900, 0.012, "bandpass", 1.2);
      for (let i = 0; i < 4; i++) {
        const t = t0 + i * 0.16;
        const base = 190 + Math.random() * 32 - i * 6;
        const dur = 0.115;
        const osc = this.ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(base, t);
        osc.frequency.exponentialRampToValueAtTime(base * 1.16, t + 0.035);
        osc.frequency.exponentialRampToValueAtTime(base * 0.82, t + dur);
        const f1 = this.ctx.createBiquadFilter();
        f1.type = "bandpass";
        f1.frequency.value = 760;
        f1.Q.value = 2.2;
        const f2 = this.ctx.createBiquadFilter();
        f2.type = "bandpass";
        f2.frequency.value = 1380;
        f2.Q.value = 2.4;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.038, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(f1);
        f1.connect(gain);
        osc.connect(f2);
        f2.connect(gain);
        gain.connect(this.master);
        osc.start(t);
        osc.stop(t + dur + 0.02);
      }
    },

    angry() {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + 0.008;
      const dur = 0.3;
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(205, t);
      osc.frequency.exponentialRampToValueAtTime(250, t + 0.055);
      osc.frequency.exponentialRampToValueAtTime(135, t + dur);
      const f1 = this.ctx.createBiquadFilter();
      f1.type = "bandpass";
      f1.frequency.value = 720;
      f1.Q.value = 2.2;
      const f2 = this.ctx.createBiquadFilter();
      f2.type = "bandpass";
      f2.frequency.value = 1220;
      f2.Q.value = 2.4;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(f1);
      f1.connect(gain);
      osc.connect(f2);
      f2.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.03);
      this.noise(0.18, 650, 0.02, "bandpass", 1.3);
    },

    doorHiss() {
      if (!this.ctx || this.muted) return;
      this.noise(0.42, 2400, 0.075, "highpass", 0.8);
      this.beep(92, 0.12, "sine", 0.045, -25);
    },

    speak(text, pitch = 1.08, rate = 1.02) {
      if (this.muted || !("speechSynthesis" in window)) return false;
      try {
        const synth = window.speechSynthesis;
        synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "zh-HK";
        utter.pitch = pitch;
        utter.rate = rate;
        utter.volume = 0.88;
        const voices = synth.getVoices();
        const voice =
          voices.find((v) => /yue|zh[-_]HK|cantonese/i.test(v.lang + " " + v.name)) ||
          voices.find((v) => /zh/i.test(v.lang));
        if (voice) utter.voice = voice;
        synth.speak(utter);
        return true;
      } catch (e) {
        return false;
      }
    },

    stopVoice() {
      try {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      } catch (e) { /* ignore */ }
    },

    near() {
      this.noise(0.24, 2200, 0.12, "bandpass", 2.2);
      this.beep(880, 0.09, "sine", 0.045, 420);
    },
    crash() {
      this.noise(0.52, 170, 0.38, "lowpass", 0.8);
      this.beep(72, 0.4, "sawtooth", 0.16, -35);
    },
    horn() {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      for (const [f, v] of [[410, 0.08], [512, 0.065]]) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "square";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(v, t + 0.012);
        g.gain.setValueAtTime(v, t + 0.17);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o.connect(g);
        g.connect(this.master);
        o.start(t);
        o.stop(t + 0.3);
      }
    },
    checkpoint() {
      [523, 659, 784, 1046].forEach((f, i) => {
        setTimeout(() => this.beep(f, 0.22, "triangle", 0.07), i * 95);
      });
    },
    finish() {
      [392, 523, 659, 784, 1046, 1318].forEach((f, i) => {
        setTimeout(() => this.beep(f, 0.32, "triangle", 0.075), i * 110);
      });
    },
    fail() {
      [240, 190, 150].forEach((f, i) => {
        setTimeout(() => this.beep(f, 0.36, "sawtooth", 0.07, -20), i * 150);
      });
    },
    startRev() {
      this.beep(70, 0.5, "sawtooth", 0.1, 95);
      this.noise(0.42, 240, 0.16, "lowpass", 0.9);
    },
  };

