/* =========================================================================
   lib.js — Pure helpers: math, formatting, seeded noise and canvas paths.
   Red Van Daredevil · classic scripts, shared global lexical scope
   ========================================================================= */
"use strict";

  /* -----------------------------------------------------------------------
     Math, formatting and deterministic noise helpers
     ----------------------------------------------------------------------- */
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const fmtMoney = (n) => "$" + Math.max(0, Math.floor(n)).toLocaleString("en-US");
  const fmtTime = (s) => {
    s = Math.max(0, Math.ceil(s));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  };
  const speedToKmh = (speed) => Math.round((speed / MAX_SPEED) * 135);

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(n, salt = 0) {
    const x = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
  function drawGlowText(g, text, x, y, size, color, glow = 18, font = "Microsoft JhengHei") {
    g.save();
    g.font = `700 ${size}px "${font}", sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.shadowColor = color;
    g.shadowBlur = glow;
    g.fillStyle = color;
    g.fillText(text, x, y);
    g.shadowBlur = glow * 0.4;
    g.fillText(text, x, y);
    g.restore();
  }

