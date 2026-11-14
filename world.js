/* =========================================================================
   world.js — Road sampling, projection and the complete pseudo-3D renderer.
   Red Van Daredevil · classic scripts, shared global lexical scope
   ========================================================================= */
"use strict";

  const backdropCache = {
    key: "",
    sky: null,
    glow: null,
    haze: null,
    ground: null,
    waterA: null,
    waterB: null,
    boost: null,
  };

  function ensureBackdropCache() {
    const key = `${activeRoute.id}:${W}:${H}`;
    if (backdropCache.key === key) return;
    backdropCache.key = key;

    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.68);
    sky.addColorStop(0, activeRoute.sky[0]);
    sky.addColorStop(0.38, activeRoute.sky[1]);
    sky.addColorStop(0.68, activeRoute.sky[2]);
    sky.addColorStop(0.88, activeRoute.sky[3]);
    sky.addColorStop(1, activeRoute.sky[4]);
    backdropCache.sky = sky;

    const glow = ctx.createRadialGradient(W * 0.58, H * 0.52, 0, W * 0.58, H * 0.52, W * 0.7);
    glow.addColorStop(0, "rgba(255,112,82,.20)");
    glow.addColorStop(0.3, "rgba(174,54,95,.11)");
    glow.addColorStop(0.7, "rgba(56,22,70,.04)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    backdropCache.glow = glow;

    const haze = ctx.createLinearGradient(0, H * 0.42, 0, H * 0.62);
    haze.addColorStop(0, "rgba(8,9,17,0)");
    haze.addColorStop(0.7, "rgba(14,12,21,.52)");
    haze.addColorStop(1, "rgba(8,9,15,.93)");
    backdropCache.haze = haze;

    const ground = ctx.createLinearGradient(0, H * 0.475, 0, H);
    ground.addColorStop(0, "#0c1018");
    ground.addColorStop(0.45, "#090c11");
    ground.addColorStop(1, "#05070a");
    backdropCache.ground = ground;

    const waterA = ctx.createLinearGradient(0, H * 0.4, 0, H);
    waterA.addColorStop(0, "rgba(9,25,34,.7)");
    waterA.addColorStop(1, "#091720");
    backdropCache.waterA = waterA;

    const waterB = ctx.createLinearGradient(0, H * 0.4, 0, H);
    waterB.addColorStop(0, "rgba(9,25,34,.7)");
    waterB.addColorStop(1, "#08141d");
    backdropCache.waterB = waterB;

    const boost = ctx.createLinearGradient(0, H, 0, H * 0.4);
    boost.addColorStop(0, "rgba(255,64,52,.2)");
    boost.addColorStop(1, "rgba(255,64,52,0)");
    backdropCache.boost = boost;
  }

  /* -----------------------------------------------------------------------
     Road sampling / projection
     ----------------------------------------------------------------------- */
  function sampleRoad(z) {
    const f = clamp(z / SEG_LEN, 0, route.totalSegs - 1.001);
    const i = Math.floor(f);
    const t = f - i;
    const a = route.segs[i];
    const b = route.segs[Math.min(i + 1, route.totalSegs - 1)];
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      curve: lerp(a.curve, b.curve, t),
      zone: a.zone,
      i,
    };
  }

  function project(wx, wy, wz) {
    const dz = wz - cam.z;
    if (dz < 1) return null;
    const scale = CAM_DEPTH / dz;
    return {
      x: W * 0.5 + scale * (wx - cam.x) * W * 0.5,
      y: H * 0.5 - scale * (wy - cam.y) * H * 0.5,
      w: scale * ROAD_HALF * W * 0.5,
      scale,
      dz,
    };
  }


  /* -----------------------------------------------------------------------
     Rendering
     ----------------------------------------------------------------------- */
  function drawBackground(time) {
    ensureBackdropCache();
    const seg = state.playerZ / SEG_LEN;
    const fade = activeRoute.cityFade;
    let cityAlpha;
    if (activeRoute.background === "city") {
      cityAlpha = 1;
    } else if (activeRoute.background === "bay") {
      cityAlpha = seg < fade[0] ? 1 : seg < fade[1] ? 1 - smoothstep(fade[0], fade[1], seg) : 0;
    } else {
      if (seg < fade[0]) cityAlpha = 1;
      else if (seg < fade[1]) cityAlpha = 1 - smoothstep(fade[0], fade[1], seg);
      else if (seg < fade[2]) cityAlpha = 0;
      else if (seg < fade[3]) cityAlpha = smoothstep(fade[2], fade[3], seg);
      else cityAlpha = 1;
    }
    const bridgeAlpha = activeRoute.background === "bridge" ? 1 - cityAlpha : 0;
    const bayAlpha = activeRoute.background === "bay" ? 1 - cityAlpha : 0;

    // sky
    ctx.fillStyle = backdropCache.sky;
    ctx.fillRect(0, 0, W, H);

    // horizon city glow
    ctx.fillStyle = backdropCache.glow;
    ctx.fillRect(0, H * 0.18, W, H * 0.6);

    // stars
    for (let i = 0; i < 84; i++) {
      const sx = (hash(i, 3) * W + cam.x * 0.0015 + W) % W;
      const sy = hash(i, 7) * H * 0.4;
      const tw = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(time * 1.3 + i));
      ctx.fillStyle = `rgba(225,240,255,${0.12 + hash(i, 9) * 0.5 * tw})`;
      const s = hash(i, 11) < 0.08 ? 2 : 1;
      ctx.fillRect(sx, sy, s, s);
    }

    // moon
    const mx = W * 0.8 - cam.x * 0.003;
    const my = H * 0.16;
    const moonGlow = ctx.createRadialGradient(mx, my, 2, mx, my, 95);
    moonGlow.addColorStop(0, "rgba(255,235,190,.30)");
    moonGlow.addColorStop(0.25, "rgba(255,220,160,.10)");
    moonGlow.addColorStop(1, "rgba(255,200,120,0)");
    ctx.fillStyle = moonGlow;
    ctx.fillRect(mx - 100, my - 100, 200, 200);
    ctx.fillStyle = "#f4e6bd";
    ctx.beginPath();
    ctx.arc(mx, my, 17, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(210,190,150,.25)";
    ctx.beginPath();
    ctx.arc(mx - 5, my - 4, 4, 0, TAU);
    ctx.arc(mx + 6, my + 4, 3, 0, TAU);
    ctx.fill();

    // thin clouds
    ctx.save();
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 5; i++) {
      const cx = ((time * (4 + i) + i * 380) % (W + 600)) - 300;
      const cy = H * (0.12 + i * 0.06);
      ctx.drawImage(BG.cloud, cx - 320, cy - 60, 640, 120);
    }
    ctx.restore();

    // mountains
    const mountainY = H * 0.53;
    const mScale = (H * 0.5) / 460;
    const mw = Math.max(W * 1.25, 2600);
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.drawImage(BG.mountains, -((cam.x * 0.01) % 40) - 20, mountainY - 460 * mScale, mw, 460 * mScale);
    ctx.restore();

    // bay islands / bridge / city skyline
    const shift = -cam.x * 0.012;
    if (bayAlpha > 0.01) {
      const bw = Math.max(W * 1.25, 2700);
      const bh = bw * 460 / 3000;
      ctx.save();
      ctx.globalAlpha = bayAlpha * 0.86;
      ctx.drawImage(BG.bay, -((cam.x * 0.012) % 120) - 30, H * 0.535 - bh, bw, bh);
      ctx.restore();
    }
    if (bridgeAlpha > 0.01) {
      const bw = Math.max(W * 1.12, 1500);
      const by = H * 0.53;
      ctx.save();
      ctx.globalAlpha = bridgeAlpha * 0.66;
      ctx.drawImage(BG.bridge, W * 0.5 - bw / 2 + shift * 0.4, by - 480 * (bw / 1900) * 0.7, bw, 480 * (bw / 1900));
      ctx.restore();
    }
    if (cityAlpha > 0.01) {
      const cw = Math.max(W * 1.35, 2600);
      const ch = cw * 700 / 3400;
      const cy = H * 0.545 - ch;
      ctx.save();
      ctx.globalAlpha = cityAlpha * 0.95;
      ctx.drawImage(BG.city, -((cam.x * 0.02 + 200) % 420) - 40, cy, cw, ch);
      ctx.restore();
    }

    // horizon haze
    ctx.fillStyle = backdropCache.haze;
    ctx.fillRect(0, H * 0.42, W, H * 0.22);
  }

  function drawRoad() {
    ensureBackdropCache();
    const base = Math.floor(cam.z / SEG_LEN);
    const start = Math.max(0, base);
    const maxSeg = Math.min(route.totalSegs - 1, start + drawDist);

    // ground plane beneath the horizon — keeps the world from floating in the sky
    ctx.fillStyle = backdropCache.ground;
    ctx.fillRect(0, H * 0.475, W, H * 0.525);

    for (let i = maxSeg; i >= start; i--) {
      const seg = route.segs[i];
      const next = route.segs[Math.min(i + 1, route.totalSegs - 1)];
      const p1 = project(seg.x, seg.y, seg.z);
      const p2 = project(next.x, next.y, next.z);
      if (!p1 || !p2) continue;
      if (p1.dz < 90 && p2.dz < 90) continue;
      if (p1.y < -H * 0.3 || p2.y < -H * 0.4) continue;
      if (p1.y > H + 500 && p2.y > H + 500) continue;
      if (Math.abs(p2.y - p1.y) > H * 1.4) continue;

      const city = seg.zone === "city" || seg.zone === "town";
      const hills = seg.zone === "hills";
      const rich = seg.zone === "rich";
      const industrial = seg.zone === "industrial";
      const alt = i % 2 === 0;
      const n = (i - base) / drawDist;
      const fog = clamp(Math.pow(Math.max(0, n), 1.55) * 0.92 + 0.05, 0, 0.97);

      // shoulders
      ctx.fillStyle = city
        ? (alt ? "#101218" : "#0d0f14")
        : hills
          ? (alt ? "#0a1110" : "#080d0c")
          : rich
            ? (alt ? "#0b1214" : "#080f12")
            : industrial
              ? (alt ? "#101114" : "#0c0e11")
              : (alt ? "#0a1112" : "#090e10");
      ctx.beginPath();
      ctx.moveTo(p1.x - p1.w * 1.3, p1.y);
      ctx.lineTo(p2.x - p2.w * 1.3, p2.y);
      ctx.lineTo(p2.x + p2.w * 1.3, p2.y);
      ctx.lineTo(p1.x + p1.w * 1.3, p1.y);
      ctx.closePath();
      ctx.fill();

      // coastal water on the right
      if (seg.zone === "coast" || seg.zone === "rich") {
        ctx.fillStyle = alt ? backdropCache.waterA : backdropCache.waterB;
        ctx.beginPath();
        ctx.moveTo(p1.x + p1.w * 1.08, p1.y);
        ctx.lineTo(p2.x + p2.w * 1.08, p2.y);
        ctx.lineTo(W + 500, p2.y);
        ctx.lineTo(W + 500, p1.y);
        ctx.closePath();
        ctx.fill();
        // water glints
        if (i % 3 === 0) {
          const gl = lerp(p1.x + p1.w * 1.15, W + 200, hash(i, 4) * 0.55);
          ctx.fillStyle = alt ? "rgba(255,196,100,.18)" : "rgba(112,246,255,.1)";
          ctx.fillRect(gl, lerp(p1.y, p2.y, hash(i, 8)), Math.max(1, p1.w * 0.08), Math.max(1, p1.w * 0.012));
        }
      }

      // road
      const roadCol = city
        ? (alt ? "#191a21" : "#16171d")
        : rich
          ? (alt ? "#191a20" : "#16181d")
          : industrial
            ? (alt ? "#1a1a1e" : "#17171b")
            : (alt ? "#181a20" : "#15171c");
      ctx.fillStyle = roadCol;
      ctx.beginPath();
      ctx.moveTo(p1.x - p1.w, p1.y);
      ctx.lineTo(p2.x - p2.w, p2.y);
      ctx.lineTo(p2.x + p2.w, p2.y);
      ctx.lineTo(p1.x + p1.w, p1.y);
      ctx.closePath();
      ctx.fill();

      // subtle sheen
      ctx.fillStyle = "rgba(124,150,170,.022)";
      ctx.beginPath();
      ctx.moveTo(p1.x - p1.w * 0.62, p1.y);
      ctx.lineTo(p2.x - p2.w * 0.62, p2.y);
      ctx.lineTo(p2.x + p2.w * 0.08, p2.y);
      ctx.lineTo(p1.x + p1.w * 0.08, p1.y);
      ctx.closePath();
      ctx.fill();

      // edge lines
      ctx.fillStyle = "rgba(232,226,205,.58)";
      for (const s of [-1, 1]) {
        const edge = 0.915;
        ctx.beginPath();
        ctx.moveTo(p1.x + s * p1.w * (edge - 0.008), p1.y);
        ctx.lineTo(p2.x + s * p2.w * (edge - 0.008), p2.y);
        ctx.lineTo(p2.x + s * p2.w * (edge + 0.008), p2.y);
        ctx.lineTo(p1.x + s * p1.w * (edge + 0.008), p1.y);
        ctx.closePath();
        ctx.fill();
      }

      // lane dashes
      if (Math.floor(i / 4) % 2 === 0) {
        ctx.fillStyle = "rgba(229,224,207,.52)";
        for (const off of [-1 / 3, 1 / 3]) {
          const dashW = 0.011;
          ctx.beginPath();
          ctx.moveTo(p1.x + p1.w * (off - dashW), p1.y);
          ctx.lineTo(p2.x + p2.w * (off - dashW), p2.y);
          ctx.lineTo(p2.x + p2.w * (off + dashW), p2.y);
          ctx.lineTo(p1.x + p1.w * (off + dashW), p1.y);
          ctx.closePath();
          ctx.fill();
        }
      }

      // red-white curb
      ctx.fillStyle = i % 8 < 4 ? "rgba(201,50,67,.72)" : "rgba(228,219,195,.68)";
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(p1.x + s * p1.w * 1.0, p1.y);
        ctx.lineTo(p2.x + s * p2.w * 1.0, p2.y);
        ctx.lineTo(p2.x + s * p2.w * 1.045, p2.y);
        ctx.lineTo(p1.x + s * p1.w * 1.045, p1.y);
        ctx.closePath();
        ctx.fill();
      }

      // fog
      if (fog > 0.015) {
        ctx.fillStyle = `rgba(9,10,18,${fog})`;
        ctx.beginPath();
        ctx.moveTo(p1.x - p1.w * 1.3, p1.y);
        ctx.lineTo(p2.x - p2.w * 1.3, p2.y);
        ctx.lineTo(p2.x + p2.w * 1.3, p2.y);
        ctx.lineTo(p1.x + p1.w * 1.3, p1.y);
        ctx.closePath();
        ctx.fill();
      }

      // streetlight pools on road
      if ((city || rich || industrial || seg.zone === "highway") && i % 9 === 0) {
        const alpha = (1 - n) * 0.09;
        if (alpha > 0.005) {
          const lg = ctx.createRadialGradient(p1.x, p1.y, 0, p1.x, p1.y, p1.w * 0.9);
          lg.addColorStop(0, `rgba(255,198,112,${alpha})`);
          lg.addColorStop(1, "rgba(255,180,80,0)");
          ctx.fillStyle = lg;
          ctx.beginPath();
          ctx.moveTo(p1.x - p1.w, p1.y);
          ctx.lineTo(p2.x - p2.w, p2.y);
          ctx.lineTo(p2.x + p2.w, p2.y);
          ctx.lineTo(p1.x + p1.w, p1.y);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }

  const spriteRenderList = [];

  function collectSprites() {
    const base = Math.max(0, Math.floor(cam.z / SEG_LEN));
    const max = Math.min(route.totalSegs - 1, base + drawDist);
    const list = spriteRenderList;
    list.length = 0;
    for (let i = base; i <= max; i++) {
      const seg = route.segs[i];
      for (const s of seg.sprites) {
        list.push({ kind: "scene", z: seg.z + 1, seg, s });
      }
    }
    for (const c of state.traffic) {
      if (c.z > cam.z + 200 && c.z < cam.z + drawDist * SEG_LEN + 3000) {
        list.push({ kind: "traffic", z: c.z, c });
      }
    }
    for (const p of state.pedestrians) {
      if (p.z > cam.z + 200 && p.z < cam.z + drawDist * SEG_LEN + 3000) {
        list.push({ kind: "pedestrian", z: p.z, p });
      }
    }
    list.sort((a, b) => b.z - a.z);
    return list;
  }

  function drawSprites() {
    const list = collectSprites();
    for (const item of list) {
      if (item.kind === "scene") drawSceneSprite(item.seg, item.s);
      else if (item.kind === "pedestrian") drawPedestrian(item.p);
      else drawTraffic(item.c);
    }
  }

  function drawPedestrian(ped) {
    const road = sampleRoad(ped.z);
    const wx = road.x + ped.x * ROAD_HALF;
    const p = project(wx, road.y, ped.z);
    if (!p) return;
    const width = p.scale * 95 * W * 0.5;
    if (width < 1.5 || width > W * 1.2) return;
    const sprite = SPRITES.pedestrianSide[(ped.style * 2 + Math.floor(ped.phase)) % 6];
    if (!sprite) return;
    const height = width * (sprite.img.height / sprite.img.width);
    if (p.y > H + height + 80) return;
    if (p.x + width < -40 || p.x - width > W + 40) return;
    const fog = clamp(Math.pow(p.dz / (drawDist * SEG_LEN), 1.2), 0, 0.9);
    ctx.save();
    ctx.globalAlpha = clamp(1 - fog, 0.1, 1);
    ctx.fillStyle = "rgba(0,0,0,.42)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, width * 0.42, width * 0.1, 0, 0, TAU);
    ctx.fill();
    ctx.translate(p.x, p.y);
    if (ped.dir < 0) ctx.scale(-1, 1);
    ctx.drawImage(sprite.img, -width / 2, -height, width, height);
    ctx.restore();
  }

  function drawSceneSprite(seg, s) {
    const cache = SPRITES[s.cat];
    if (!cache || !cache[s.variant]) return;
    const sprite = cache[s.variant];
    const wx = seg.x + s.offset * ROAD_HALF;
    const p = project(wx, seg.y, seg.z);
    if (!p) return;
    const width = p.w * 2 * (sprite.worldW / (ROAD_HALF * 2)) * s.scale;
    const height = width * (sprite.img.height / sprite.img.width);
    if (width < 2 || width > W * 4.5) return;
    if (s.cat === "gantry" && width > W * 0.9) return;
    if (p.y < H * 0.3 || p.y > H + height + 150) return;
    if (p.x + width / 2 < -80 || p.x - width / 2 > W + 80) return;
    const fog = clamp(Math.pow(Math.abs(p.dz) / (drawDist * SEG_LEN), 1.25), 0, 0.95);
    ctx.save();
    ctx.globalAlpha = clamp(1 - fog, 0.06, 1);
    if (s.flip) {
      ctx.translate(p.x, p.y);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite.img, -width / 2, -height, width, height);
    } else {
      ctx.drawImage(sprite.img, p.x - width / 2, p.y - height, width, height);
    }
    ctx.restore();
  }

  function drawTraffic(car) {
    const sprite = SPRITES.traffic[car.def.imgKey];
    if (!sprite) return;
    const road = sampleRoad(car.z);
    const wx = road.x + car.lane * ROAD_HALF;
    const p = project(wx, road.y, car.z);
    if (!p) return;
    const width = p.scale * car.def.worldW * W * 0.5;
    if (width < 2 || width > W * 2.4) return;
    const height = width * (sprite.height / sprite.width);
    if (p.y > H + height + 80) return;
    if (p.x + width < -40 || p.x - width > W + 40) return;
    const fog = clamp(Math.pow(p.dz / (drawDist * SEG_LEN), 1.2), 0, 0.9);
    ctx.save();
    ctx.globalAlpha = clamp(1 - fog, 0.1, 1);
    // shadow
    ctx.fillStyle = "rgba(0,0,0,.4)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, width * 0.42, width * 0.045, 0, 0, TAU);
    ctx.fill();
    if (car.hitCooldown > 1.8) {
      ctx.globalAlpha *= 0.75;
    }
    ctx.drawImage(sprite, p.x - width / 2, p.y - height, width, height);
    if (car.def.police) {
      const blue = Math.sin(performance.now() / 130) > 0;
      ctx.globalCompositeOperation = "lighter";
      for (const [side, color] of [[-1, blue ? "#3d7cff" : "#ff263d"], [1, blue ? "#ff263d" : "#3d7cff"]]) {
        const lx = p.x + side * width * 0.13;
        const ly = p.y - height * 0.82;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(lx, ly, Math.max(2, width * 0.035), 0, TAU);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function drawPlayer(time) {
    const sprite = (SPRITES.playerBuses && SPRITES.playerBuses[profile.bus]) || SPRITES.player.img;
    const carW = Math.min(W * 0.21, H * 0.42, 360);
    const carH = carW * (sprite.height / sprite.width);
    const speedRatio = clamp(state.speed / MAX_SPEED, 0, 1.2);
    const bounce = Math.sin(time * 19) * (0.8 + speedRatio * 2.3) + Math.sin(time * 7.3) * 1.1;
    const offroadShake = Math.abs(state.playerX) > 0.93 ? (Math.random() - 0.5) * 5 : 0;
    const x = W / 2 + clamp(state.playerVX, -1.6, 1.6) * 7 + offroadShake + state.playerX * W * 0.008;
    const y = H - H * 0.035 + bounce;
    const lean = clamp(state.playerVX * 0.018 + sampleRoad(state.playerZ).curve * 0.008, -0.055, 0.055);

    // wet-road-ish reflection
    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.translate(x, y + 5);
    ctx.scale(1, -0.35);
    ctx.drawImage(sprite, -carW / 2, -carH, carW, carH);
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);
    ctx.scale(1 + Math.sin(time * 9) * 0.002, 1 + bounce * 0.0016);
    ctx.drawImage(sprite, -carW / 2, -carH, carW, carH);
    ctx.restore();

    if (state.boostActive) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;
        const fx = x + side * carW * 0.19;
        const fy = y - carH * 0.08;
        const flame = 18 + Math.random() * 38;
        const gr = ctx.createLinearGradient(fx, fy, fx, fy + flame + 30);
        gr.addColorStop(0, "rgba(255,240,190,.95)");
        gr.addColorStop(0.35, "rgba(255,145,60,.8)");
        gr.addColorStop(1, "rgba(255,40,50,0)");
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.moveTo(fx - 7, fy);
        ctx.quadraticCurveTo(fx - 2, fy + flame, fx, fy + flame + 30);
        ctx.quadraticCurveTo(fx + 4, fy + flame, fx + 7, fy);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // special-bus underglow
    if (profile.bus !== "classic") {
      const glowColor = profile.bus === "gold" ? "255,196,74" : "96,246,255";
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const ug = ctx.createRadialGradient(x, y - 4, 4, x, y - 4, carW * 0.58);
      ug.addColorStop(0, `rgba(${glowColor},.22)`);
      ug.addColorStop(0.55, `rgba(${glowColor},.08)`);
      ug.addColorStop(1, `rgba(${glowColor},0)`);
      ctx.fillStyle = ug;
      ctx.fillRect(x - carW * 0.65, y - carH * 0.18, carW * 1.3, carH * 0.25);
      ctx.restore();
    }

    // tail-light bloom
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const tailPower = input.brake ? 0.34 : 0.2;
    for (const side of [-1, 1]) {
      const lx = x + side * carW * 0.355;
      const ly = y - carH * 0.32;
      const tg = ctx.createRadialGradient(lx, ly, 0, lx, ly, carW * 0.23);
      tg.addColorStop(0, `rgba(255,40,58,${tailPower})`);
      tg.addColorStop(0.45, `rgba(255,32,48,${tailPower * 0.35})`);
      tg.addColorStop(1, "rgba(255,0,20,0)");
      ctx.fillStyle = tg;
      ctx.fillRect(lx - carW * 0.25, ly - carW * 0.25, carW * 0.5, carW * 0.5);
    }
    const glow = ctx.createRadialGradient(x, y - carH * 0.58, 0, x, y - carH * 0.58, carW * 0.55);
    glow.addColorStop(0, "rgba(255,40,60,.055)");
    glow.addColorStop(1, "rgba(255,0,30,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - carW * 0.6, y - carH, carW * 1.2, carH);
    ctx.restore();
  }

  function drawAlighting() {
    if (!state.alighting.length) return;
    for (const a of state.alighting) {
      if (a.t < 0) continue;
      const k = clamp(a.t / a.dur, 0, 1);
      const ease = k * k * (3 - 2 * k);
      const x = lerp(a.startX, a.targetX, ease);
      const bob = Math.abs(Math.sin(a.t * 10)) * 3;
      const w = Math.min(56, W * 0.046);
      const h = w * 2;
      const sprite = SPRITES.pedestrian[(a.style * 2 + Math.floor(a.t * 8)) % 6];
      if (!sprite) continue;
      ctx.save();
      ctx.globalAlpha = k > 0.82 ? clamp((1 - k) / 0.18, 0, 1) : 1;
      ctx.fillStyle = "rgba(0,0,0,.32)";
      ctx.beginPath();
      ctx.ellipse(x, a.y, w * 0.32, w * 0.08, 0, 0, TAU);
      ctx.fill();
      ctx.drawImage(sprite.img, x - w / 2, a.y - h - bob, w, h);
      ctx.restore();
    }
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of state.particles) {
      const a = clamp(p.life / p.max, 0, 1);
      if (p.type === "smoke" || p.type === "dust") {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = a * (p.type === "dust" ? 0.5 : 0.35);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.6 - a * 0.5), 0, TAU);
        ctx.fill();
        ctx.globalCompositeOperation = "lighter";
        continue;
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 9;
      const size = p.size * (0.3 + a);
      if (p.type === "flame") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      }
    }
    ctx.restore();

    // floating score text
    for (const p of state.popups) {
      const a = clamp(p.life / p.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = Math.min(1, a * 1.5);
      ctx.font = '800 19px "Cascadia Mono", "Microsoft JhengHei", monospace';
      ctx.textAlign = "center";
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 16;
      ctx.fillText(p.text, p.x, p.y);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(7,8,13,.8)";
      ctx.fillText(p.text, p.x, p.y + 1);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }
  }

  function drawRain(time) {
    if (!state.stats || state.stats.map !== "rain") return;
    ctx.save();
    ctx.fillStyle = "rgba(84,130,170,.045)";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(175,220,255,.22)";
    ctx.lineWidth = 1;
    const count = W < 900 ? 48 : 92;
    for (let i = 0; i < count; i++) {
      const x = (hash(i, 21) * (W + 240) + time * (110 + hash(i, 3) * 160)) % (W + 240) - 120;
      const y = (hash(i, 8) * (H + 80) + time * (680 + hash(i, 4) * 360)) % (H + 80) - 40;
      const len = 9 + hash(i, 5) * 24;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - len * 0.34, y + len);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSpeedLines() {
    const ratio = clamp((state.speed - 4300) / (BOOST_SPEED - 4300), 0, 1);
    if (ratio <= 0.01) return;
    const cx = W * 0.5;
    const cy = H * 0.47;
    const maxR = Math.hypot(W, H) * 0.62;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = state.boostActive ? "rgba(255,190,120,.34)" : "rgba(180,235,255,.19)";
    for (const s of state.speedLines) {
      s.r += ratio * 0.024;
      if (s.r > 1.05) {
        s.r = 0.08 + Math.random() * 0.2;
        s.a = Math.random() * TAU;
        s.len = 0.03 + Math.random() * 0.13;
      }
      const r1 = s.r * maxR;
      const r2 = (s.r + s.len * ratio) * maxR;
      const x1 = cx + Math.cos(s.a) * r1;
      const y1 = cy + Math.sin(s.a) * r1;
      const x2 = cx + Math.cos(s.a) * r2;
      const y2 = cy + Math.sin(s.a) * r2;
      ctx.lineWidth = s.w * (0.65 + ratio * 1.1);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCrossingDecals() {
    if (!route.crossings || !route.crossings.length) return;
    // Horizontal ladder-style bars across the road. Pedestrians walk left/right
    // across these bars, which keeps the crossing readable from the chase camera.
    const bars = 7;
    const spacing = 82;
    const depth = 38;
    for (const crossing of route.crossings) {
      const dz = crossing.z - cam.z;
      if (dz < 300 || dz > drawDist * SEG_LEN) continue;
      const start = crossing.z - (bars * spacing) / 2;
      ctx.save();
      ctx.fillStyle = "rgba(236,241,228,.62)";
      for (let i = 0; i < bars; i++) {
        const nearZ = start + i * spacing;
        const farZ = nearZ + depth;
        if (nearZ - cam.z < 30) continue;
        const near = sampleRoad(nearZ);
        const far = sampleRoad(farZ);
        const a = project(near.x - ROAD_HALF * 0.84, near.y + 2, nearZ);
        const b = project(near.x + ROAD_HALF * 0.84, near.y + 2, nearZ);
        const c = project(far.x + ROAD_HALF * 0.84, far.y + 2, farZ);
        const d = project(far.x - ROAD_HALF * 0.84, far.y + 2, farZ);
        if (!a || !b || !c || !d) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function render(time) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    if (state.shake > 0.15) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }
    drawBackground(time);
    drawRoad();
    drawCrossingDecals();
    drawSprites();
    drawAlighting();
    drawPlayer(time);
    drawParticles();
    drawRain(time);
    drawSpeedLines();
    ctx.restore();

    if (state.redFlash > 0.01) {
      ctx.fillStyle = `rgba(255,30,48,${state.redFlash * 0.16})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (state.cameraFlash > 0.01) {
      ctx.fillStyle = `rgba(255,255,255,${state.cameraFlash * 0.55})`;
      ctx.fillRect(0, 0, W, H);
    }

    // boost edge glow on canvas
    if (state.boostActive) {
      ctx.fillStyle = backdropCache.boost;
      ctx.fillRect(0, H * 0.4, W, H * 0.6);
    }

    // cinematic letterbox top/bottom, subtle
    const bar = Math.max(5, H * 0.014);
    ctx.fillStyle = "rgba(2,3,6,.72)";
    ctx.fillRect(0, 0, W, bar);
    ctx.fillRect(0, H - bar, W, bar);
  }

