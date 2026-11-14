/* =========================================================================
   assets.js — Procedural sprite and backdrop art. No external images.
   Red Van Daredevil · classic scripts, shared global lexical scope
   ========================================================================= */
"use strict";

  const SPRITES = {
    building: [],
    billboard: [],
    tree: [],
    lamp: [],
    marker: [],
    gantry: [],
    crane: [],
    mansion: [],
    palm: [],
    yacht: [],
    billboardLux: [],
    chevron: [],
    warehouse: [],
    container: [],
    pedestrian: [],
    pedestrianSide: [],
    camera: [],
    trafficLight: [],
  };
  const gantryCache = new Map();

  function buildSprites() {
    /* ---- city buildings with neon signs ---- */
    const signWords = ["茶餐廳", "麻雀館", "藥行", "夜總會", "金鋪", "賓館", "找換", "涼茶"];
    const neonColors = ["#ff3f57", "#65f5ff", "#ffcf62", "#ff6bdb", "#82ff9a"];
    for (let v = 0; v < 6; v++) {
      const rnd = mulberry32(440 + v * 97);
      const cw = 320;
      const ch = 620;
      const neon = neonColors[v % neonColors.length];
      const word = signWords[v % signWords.length];
      const canvas = makeCanvas(cw, ch, (g) => {
        const bw = 205 + rnd() * 65;
        const bx = (cw - bw) / 2 + (rnd() < 0.5 ? -15 : 15);
        const top = 45 + rnd() * 55;
        g.fillStyle = "rgba(0,0,0,.55)";
        g.fillRect(bx + 10, top + 12, bw, ch - top - 12);

        const grad = g.createLinearGradient(bx, top, bx + bw, ch);
        grad.addColorStop(0, v % 2 ? "#1a1a27" : "#151824");
        grad.addColorStop(0.55, "#0e1019");
        grad.addColorStop(1, "#080a10");
        g.fillStyle = grad;
        g.fillRect(bx, top, bw, ch - top);

        g.fillStyle = "rgba(255,255,255,.06)";
        g.fillRect(bx, top, 3, ch - top);
        g.fillStyle = "rgba(255,255,255,.025)";
        for (let y = top + 18; y < ch - 60; y += 22) g.fillRect(bx + 8, y, bw - 16, 1);

        const cols = 5;
        const rows = 14;
        const gx = bx + 18;
        const gy = top + 38;
        const gw = (bw - 36) / cols;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const lit = rnd() < 0.3;
            if (!lit) {
              g.fillStyle = "rgba(30,38,52,.55)";
              g.fillRect(gx + c * gw + 5, gy + r * 30, gw - 11, 15);
              continue;
            }
            const warm = rnd() < 0.67;
            const col = warm ? "rgba(255,200,112," : "rgba(116,238,255,";
            const a = 0.3 + rnd() * 0.6;
            g.fillStyle = col + a + ")";
            g.shadowColor = warm ? "#ffc46a" : "#6feaff";
            g.shadowBlur = 5;
            g.fillRect(gx + c * gw + 5, gy + r * 30, gw - 11, 15);
            g.shadowBlur = 0;
          }
        }

        // rooftop clutter
        g.fillStyle = "#0a0c12";
        g.fillRect(bx + 18, top - 20, 22, 20);
        g.fillRect(bx + bw - 50, top - 32, 16, 32);
        g.fillRect(bx + bw * 0.48, top - 12, 34, 12);
        g.strokeStyle = "rgba(255,255,255,.14)";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(bx + bw * 0.7, top);
        g.lineTo(bx + bw * 0.7, top - 45);
        g.stroke();
        g.fillStyle = "#ff2f4b";
        g.shadowColor = "#ff2f4b";
        g.shadowBlur = 9;
        g.beginPath();
        g.arc(bx + bw * 0.7, top - 46, 2.5, 0, TAU);
        g.fill();
        g.shadowBlur = 0;

        // vertical neon sign
        const sx = v % 2 === 0 ? bx - 38 : bx + bw + 6;
        const sy = top + 54 + rnd() * 30;
        const sw = 34;
        const sh = 225;
        g.fillStyle = "rgba(4,6,10,.92)";
        g.fillRect(sx, sy, sw, sh);
        g.strokeStyle = neon;
        g.lineWidth = 2;
        g.shadowColor = neon;
        g.shadowBlur = 12;
        g.strokeRect(sx + 2, sy + 2, sw - 4, sh - 4);
        g.shadowBlur = 0;
        for (let i = 0; i < word.length; i++) {
          drawGlowText(g, word[i], sx + sw / 2, sy + 30 + i * 45, 27, neon, 16);
        }
        g.fillStyle = neon;
        g.globalAlpha = 0.4;
        g.fillRect(sx - 10, sy + 30, 8, sh - 60);
        g.globalAlpha = 1;

        // shopfront glow at street level
        const sf = g.createLinearGradient(0, ch - 92, 0, ch);
        sf.addColorStop(0, "rgba(255,206,120,0)");
        sf.addColorStop(0.55, "rgba(255,206,120,.16)");
        sf.addColorStop(1, "rgba(255,180,92,.36)");
        g.fillStyle = sf;
        g.fillRect(bx, ch - 95, bw, 95);
        g.fillStyle = "rgba(255,214,140,.7)";
        g.fillRect(bx + 14, ch - 62, bw - 28, 3);
        g.fillStyle = "rgba(255,244,215,.82)";
        for (let i = 0; i < 4; i++) g.fillRect(bx + 20 + i * (bw - 40) / 3, ch - 57, 2, 50);

        // ground shadow
        g.fillStyle = "rgba(0,0,0,.4)";
        g.beginPath();
        g.ellipse(bx + bw / 2, ch - 2, bw * 0.7, 12, 0, 0, TAU);
        g.fill();
      });
      SPRITES.building.push({ img: canvas, worldW: 720 + v * 45 });
    }

    /* ---- billboards ---- */
    const billboardTexts = [
      ["屯門", "紅VAN 直達"],
      ["快過地鐵", "唔好話俾人知"],
      ["今晚唔塞車", "（難以置信）"],
      ["安全第一", "但係快少少"],
      ["旺角 24H", "上車即走"],
    ];
    for (let v = 0; v < billboardTexts.length; v++) {
      const neon = v % 2 ? "#70f4ff" : "#ffbf58";
      const c = makeCanvas(500, 300, (g) => {
        g.fillStyle = "rgba(3,5,9,.9)";
        g.fillRect(20, 20, 460, 220);
        g.strokeStyle = "rgba(255,255,255,.2)";
        g.lineWidth = 4;
        g.strokeRect(20, 20, 460, 220);
        g.strokeStyle = neon;
        g.lineWidth = 2;
        g.shadowColor = neon;
        g.shadowBlur = 18;
        g.strokeRect(32, 32, 436, 196);
        g.shadowBlur = 0;
        drawGlowText(g, billboardTexts[v][0], 250, 112, 62, neon, 24);
        g.font = '400 21px "Microsoft JhengHei", sans-serif';
        g.fillStyle = "rgba(255,255,255,.68)";
        g.textAlign = "center";
        g.fillText(billboardTexts[v][1], 250, 170);
        g.fillStyle = "#11131b";
        g.fillRect(148, 240, 22, 60);
        g.fillRect(330, 240, 22, 60);
        g.strokeStyle = "rgba(255,255,255,.12)";
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(250, 20);
        g.lineTo(250, 4);
        g.stroke();
        g.fillStyle = "#ff304c";
        g.shadowColor = "#ff304c";
        g.shadowBlur = 10;
        g.beginPath();
        g.arc(250, 4, 3, 0, TAU);
        g.fill();
      });
      SPRITES.billboard.push({ img: c, worldW: 1040 });
    }

    /* ---- trees ---- */
    for (let v = 0; v < 3; v++) {
      const rnd = mulberry32(900 + v * 43);
      const c = makeCanvas(300, 420, (g) => {
        g.fillStyle = "rgba(0,0,0,.35)";
        g.beginPath();
        g.ellipse(150, 414, 110, 12, 0, 0, TAU);
        g.fill();
        g.strokeStyle = "#0b0c10";
        g.lineWidth = 16;
        g.beginPath();
        g.moveTo(150, 415);
        g.quadraticCurveTo(148, 300, 132, 220);
        g.stroke();
        g.strokeStyle = "#111419";
        g.lineWidth = 6;
        g.beginPath();
        g.moveTo(142, 300);
        g.lineTo(95, 220);
        g.moveTo(145, 280);
        g.lineTo(205, 195);
        g.stroke();
        const blobs = [
          [150, 160, 100], [95, 205, 68], [205, 200, 76], [120, 110, 62], [195, 120, 58],
        ];
        for (const [x, y, r] of blobs) {
          const grad = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r);
          grad.addColorStop(0, v === 1 ? "#2a4a3b" : "#203b30");
          grad.addColorStop(0.72, v === 1 ? "#152c24" : "#11241c");
          grad.addColorStop(0.96, "rgba(6,14,11,.72)");
          grad.addColorStop(1, "rgba(5,10,9,0)");
          g.fillStyle = grad;
          g.beginPath();
          g.arc(x, y, r, 0, TAU);
          g.fill();
          g.strokeStyle = "rgba(122,204,158,.14)";
          g.lineWidth = 2;
          g.beginPath();
          g.arc(x, y, r - 2, Math.PI * 1.06, Math.PI * 1.88);
          g.stroke();
        }
        g.fillStyle = "rgba(118,246,255,.2)";
        g.beginPath();
        g.arc(126, 116, 31, 0, TAU);
        g.fill();
        for (let i = 0; i < 28; i++) {
          const lx = 54 + rnd() * 200;
          const ly = 64 + rnd() * 185;
          g.fillStyle = `rgba(150,255,190,${0.07 + rnd() * 0.2})`;
          g.beginPath();
          g.ellipse(lx, ly, 2 + rnd() * 3.6, 1.2 + rnd() * 2, rnd() * TAU, 0, TAU);
          g.fill();
        }
      });
      SPRITES.tree.push({ img: c, worldW: 330 });
    }

    /* ---- street lamps ---- */
    for (let v = 0; v < 2; v++) {
      const c = makeCanvas(180, 520, (g) => {
        const flip = v === 1;
        g.save();
        if (flip) {
          g.translate(180, 0);
          g.scale(-1, 1);
        }
        g.strokeStyle = "#11141b";
        g.lineWidth = 12;
        g.beginPath();
        g.moveTo(38, 520);
        g.lineTo(38, 120);
        g.quadraticCurveTo(40, 72, 92, 66);
        g.lineTo(150, 66);
        g.stroke();
        g.fillStyle = "#171c24";
        g.fillRect(24, 480, 28, 40);
        g.fillStyle = "#ffcf7b";
        g.shadowColor = "#ffb54e";
        g.shadowBlur = 34;
        g.fillRect(131, 58, 34, 14);
        g.shadowBlur = 0;
        const gr = g.createRadialGradient(148, 64, 2, 148, 64, 84);
        gr.addColorStop(0, "rgba(255,196,100,.38)");
        gr.addColorStop(0.4, "rgba(255,170,70,.12)");
        gr.addColorStop(1, "rgba(255,150,40,0)");
        g.fillStyle = gr;
        g.beginPath();
        g.moveTo(148, 64);
        g.lineTo(24, 330);
        g.lineTo(180, 330);
        g.closePath();
        g.fill();
        g.restore();
      });
      SPRITES.lamp.push({ img: c, worldW: 230 });
    }

    /* ---- reflective roadside posts ---- */
    const marker = makeCanvas(80, 160, (g) => {
      g.fillStyle = "rgba(0,0,0,.4)";
      g.beginPath();
      g.ellipse(40, 154, 28, 6, 0, 0, TAU);
      g.fill();
      g.fillStyle = "#d8d4c8";
      g.fillRect(32, 24, 16, 132);
      g.fillStyle = "#ff3b4f";
      g.shadowColor = "#ff3b4f";
      g.shadowBlur = 12;
      g.fillRect(32, 28, 16, 22);
      g.fillRect(32, 72, 16, 22);
      g.shadowBlur = 0;
      g.fillStyle = "rgba(255,255,255,.6)";
      g.fillRect(36, 32, 3, 12);
    });
    SPRITES.marker.push({ img: marker, worldW: 95 });

    /* ---- port cranes ---- */
    const crane = makeCanvas(620, 540, (g) => {
      g.fillStyle = "rgba(0,0,0,.4)";
      g.fillRect(20, 520, 590, 20);
      g.strokeStyle = "#151922";
      g.lineWidth = 16;
      g.beginPath();
      g.moveTo(150, 535);
      g.lineTo(150, 170);
      g.lineTo(455, 80);
      g.moveTo(250, 535);
      g.lineTo(250, 215);
      g.moveTo(150, 170);
      g.lineTo(455, 170);
      g.lineTo(455, 400);
      g.stroke();
      g.strokeStyle = "#1d232d";
      g.lineWidth = 5;
      for (let i = 0; i < 9; i++) {
        g.beginPath();
        g.moveTo(150 + i * 38, 535);
        g.lineTo(150 + i * 38, 250);
        g.stroke();
      }
      g.strokeStyle = "rgba(120,140,160,.35)";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(455, 80);
      g.lineTo(455, 420);
      g.stroke();
      g.fillStyle = "#ff334f";
      g.shadowColor = "#ff334f";
      g.shadowBlur = 10;
      for (const [x, y] of [[150, 160], [455, 70], [455, 300], [250, 208]]) {
        g.beginPath();
        g.arc(x, y, 3, 0, TAU);
        g.fill();
      }
      g.shadowBlur = 0;
      g.fillStyle = "rgba(255,210,120,.18)";
      g.fillRect(200, 430, 200, 12);
    });
    SPRITES.crane.push({ img: crane, worldW: 1500 });

    /* ---- south-side mansions, palms, yachts and private-school gloss ---- */
    for (let v = 0; v < 3; v++) {
      SPRITES.mansion.push({ img: makeMansion(v), worldW: 900 + v * 40 });
    }
    for (let v = 0; v < 2; v++) {
      SPRITES.palm.push({ img: makePalm(v), worldW: 390 });
      SPRITES.yacht.push({ img: makeYacht(v), worldW: 1380 });
    }
    for (let v = 0; v < 5; v++) {
      SPRITES.billboardLux.push({ img: makeLuxBillboard(v), worldW: 1020 });
    }
    SPRITES.chevron.push({ img: makeChevron(), worldW: 260 });
    for (let v = 0; v < 3; v++) {
      SPRITES.warehouse.push({ img: makeWarehouse(v), worldW: 1150 + v * 50 });
    }
    for (let v = 0; v < 2; v++) {
      SPRITES.container.push({ img: makeContainers(v), worldW: 420 });
    }
    for (let v = 0; v < 6; v++) {
      SPRITES.pedestrian.push({ img: makePedestrian(v), worldW: 95 });
      SPRITES.pedestrianSide.push({ img: makePedestrianSide(v), worldW: 95 });
    }
    SPRITES.camera.push({ img: makeSpeedCamera(), worldW: 235 });
    for (let phase = 0; phase < 4; phase++) {
      SPRITES.trafficLight.push({ img: makeTrafficLight(phase), worldW: 225 });
    }

    /* ---- player's red minibus ---- */
    const classicVan = makePlayerVan();
    SPRITES.player = { img: classicVan };
    SPRITES.playerBuses = {
      classic: classicVan,
      gold: makePlayerVariant(classicVan, "gold"),
      neon: makePlayerVariant(classicVan, "neon"),
    };
    SPRITES.traffic = {
      taxi: makeTaxi(),
      private: makePrivateCar(),
      bus: makeBus(),
      truck: makeTruck(),
      van: makeVan(),
      greenvan: makeGreenMinibus(),
      sportRed: makeSupercar("red"),
      sportYellow: makeSupercar("yellow"),
      sportSilver: makeSupercar("silver"),
      bike: makeBicycle(),
      police: makePoliceCar(),
    };
  }

  function makeBicycle() {
    return makeCanvas(190, 280, (g) => {
      g.fillStyle = "rgba(0,0,0,.42)";
      g.beginPath();
      g.ellipse(95, 270, 58, 8, 0, 0, TAU);
      g.fill();
      // rear wheel
      g.strokeStyle = "#08090c";
      g.lineWidth = 9;
      g.beginPath();
      g.arc(95, 232, 34, 0, TAU);
      g.stroke();
      g.strokeStyle = "rgba(210,220,225,.35)";
      g.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        g.beginPath();
        g.moveTo(95, 232);
        g.lineTo(95 + Math.cos(a) * 30, 232 + Math.sin(a) * 30);
        g.stroke();
      }
      // frame
      g.strokeStyle = "#a8b4bb";
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(95, 230);
      g.lineTo(95, 180);
      g.lineTo(122, 168);
      g.moveTo(95, 180);
      g.lineTo(70, 170);
      g.stroke();
      // rider legs
      g.strokeStyle = "#25262c";
      g.lineWidth = 11;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(95, 178);
      g.lineTo(76, 216);
      g.lineTo(92, 232);
      g.moveTo(95, 178);
      g.lineTo(116, 212);
      g.lineTo(103, 232);
      g.stroke();
      // rider torso
      const jacket = g.createLinearGradient(0, 110, 0, 180);
      jacket.addColorStop(0, "#ffd15c");
      jacket.addColorStop(1, "#c07823");
      g.fillStyle = jacket;
      roundRect(g, 70, 108, 50, 78, 13);
      g.fill();
      // arms
      g.strokeStyle = jacket;
      g.lineWidth = 10;
      g.beginPath();
      g.moveTo(73, 120); g.lineTo(52, 162);
      g.moveTo(117, 120); g.lineTo(138, 162);
      g.stroke();
      // head + helmet
      g.fillStyle = "#d6a27f";
      g.beginPath();
      g.arc(95, 88, 19, 0, TAU);
      g.fill();
      g.fillStyle = "#e8e4da";
      g.beginPath();
      g.arc(95, 82, 21, Math.PI, TAU);
      g.fill();
      g.fillStyle = "#25262c";
      g.fillRect(80, 86, 30, 4);
      // rear light
      g.fillStyle = "#ff1e36";
      g.shadowColor = "#ff1e36";
      g.shadowBlur = 18;
      g.beginPath();
      g.arc(95, 156, 5, 0, TAU);
      g.fill();
      g.shadowBlur = 0;
      // "慢" plate
      g.fillStyle = "#f0e9d8";
      roundRect(g, 78, 188, 34, 14, 2);
      g.fill();
      g.fillStyle = "#171513";
      g.font = '700 9px "Microsoft JhengHei", sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("單車", 95, 195);
    });
  }

  function makePoliceCar() {
    return makeCanvas(350, 220, (g) => {
      g.fillStyle = "rgba(0,0,0,.48)";
      g.beginPath();
      g.ellipse(175, 207, 155, 12, 0, 0, TAU);
      g.fill();
      // body
      const body = g.createLinearGradient(0, 94, 0, 196);
      body.addColorStop(0, "#f2f4f3");
      body.addColorStop(0.55, "#dfe4e5");
      body.addColorStop(1, "#6d7b87");
      g.fillStyle = body;
      roundRect(g, 20, 94, 310, 98, 14);
      g.fill();
      g.strokeStyle = "rgba(6,12,18,.55)";
      g.lineWidth = 3;
      g.stroke();
      // blue side band
      g.fillStyle = "#1b5f9f";
      roundRect(g, 20, 150, 310, 23, 3);
      g.fill();
      g.fillStyle = "#d7e7f3";
      g.font = '800 13px "Cascadia Mono", monospace';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("POLICE · 警", 175, 162);
      // rear window
      g.fillStyle = "#0b1118";
      roundRect(g, 86, 103, 178, 38, 8);
      g.fill();
      g.fillStyle = "rgba(140,220,255,.12)";
      g.beginPath();
      g.moveTo(96, 140);
      g.lineTo(132, 104);
      g.lineTo(154, 104);
      g.lineTo(118, 140);
      g.closePath();
      g.fill();
      // light bar
      g.fillStyle = "#161a20";
      roundRect(g, 112, 76, 126, 18, 5);
      g.fill();
      const t = performance.now() / 240;
      const leftOn = Math.sin(t) > 0;
      g.fillStyle = leftOn ? "#246dff" : "#421d31";
      g.shadowColor = "#246dff";
      g.shadowBlur = leftOn ? 22 : 0;
      roundRect(g, 118, 79, 50, 11, 3);
      g.fill();
      g.fillStyle = !leftOn ? "#ff243d" : "#4a1a22";
      g.shadowColor = "#ff243d";
      g.shadowBlur = !leftOn ? 22 : 0;
      roundRect(g, 182, 79, 50, 11, 3);
      g.fill();
      g.shadowBlur = 0;
      // lights / bumper / plate
      addTailLights(g, 350, 174);
      g.fillStyle = "#10161d";
      roundRect(g, 36, 190, 278, 16, 4);
      g.fill();
      g.fillStyle = "#e8e4d8";
      roundRect(g, 154, 192, 42, 12, 2);
      g.fill();
      g.fillStyle = "#121212";
      g.font = '700 8px "Cascadia Mono", monospace';
      g.fillText("HK PF", 175, 198);
      // wheels
      g.fillStyle = "#050709";
      roundRect(g, 18, 174, 66, 38, 10);
      g.fill();
      roundRect(g, 266, 174, 66, 38, 10);
      g.fill();
    });
  }

  function getGantrySprite(cn, en, sub) {
    const key = cn + "|" + en + "|" + sub;
    if (gantryCache.has(key)) return gantryCache.get(key);
    const isTerminus = cn === "終點";
    const c = makeCanvas(1100, 380, (g) => {
      g.fillStyle = "rgba(0,0,0,.4)";
      g.fillRect(70, 100, 34, 280);
      g.fillRect(996, 100, 34, 280);
      g.fillStyle = "#15181e";
      g.fillRect(58, 92, 58, 288);
      g.fillRect(984, 92, 58, 288);
      g.fillStyle = "#242b33";
      g.fillRect(44, 74, 1012, 34);
      g.fillStyle = "rgba(255,255,255,.08)";
      g.fillRect(44, 74, 1012, 4);

      const board = g.createLinearGradient(0, 116, 0, 294);
      board.addColorStop(0, isTerminus ? "#1a3c2c" : "#123c2d");
      board.addColorStop(1, isTerminus ? "#0a1c14" : "#072018");
      g.fillStyle = board;
      roundRect(g, 170, 116, 760, 178, 6);
      g.fill();
      g.strokeStyle = "rgba(210,255,225,.8)";
      g.lineWidth = 4;
      g.stroke();
      g.strokeStyle = "rgba(210,255,225,.22)";
      g.lineWidth = 1;
      roundRect(g, 184, 130, 732, 150, 3);
      g.stroke();

      drawGlowText(g, cn, 550, 186, 64, "#f2fff5", 12);
      g.font = '600 24px "Cascadia Mono", monospace';
      g.fillStyle = "rgba(230,255,238,.82)";
      g.textAlign = "center";
      g.fillText(en, 550, 237);
      g.font = '700 25px "Cascadia Mono", monospace';
      g.fillStyle = "#ffd166";
      g.fillText(sub, 550, 272);

      g.fillStyle = "#ffd166";
      g.shadowColor = "#ffd166";
      g.shadowBlur = 12;
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        g.arc(194 + i * 28, 104, 4, 0, TAU);
        g.fill();
      }
      g.shadowBlur = 0;
    });
    const idx = SPRITES.gantry.length;
    SPRITES.gantry.push({ img: c, worldW: 3400 });
    gantryCache.set(key, idx);
    return idx;
  }

  /* ---- player minibus: rear view ---- */
  function makePlayerVan() {
    return makeCanvas(680, 500, (g) => {
      // ground shadow
      g.fillStyle = "rgba(0,0,0,.55)";
      g.beginPath();
      g.ellipse(340, 474, 290, 25, 0, 0, TAU);
      g.fill();

      // wheels
      g.fillStyle = "#08090c";
      roundRect(g, 74, 378, 104, 96, 20);
      g.fill();
      roundRect(g, 502, 378, 104, 96, 20);
      g.fill();
      g.fillStyle = "#24262e";
      roundRect(g, 94, 398, 64, 56, 12);
      g.fill();
      roundRect(g, 522, 398, 64, 56, 12);
      g.fill();

      // body
      const bodyGrad = g.createLinearGradient(0, 130, 0, 440);
      bodyGrad.addColorStop(0, "#ff5a54");
      bodyGrad.addColorStop(0.28, "#f42f42");
      bodyGrad.addColorStop(0.75, "#c51631");
      bodyGrad.addColorStop(1, "#831025");
      g.fillStyle = bodyGrad;
      g.beginPath();
      g.moveTo(48, 212);
      g.quadraticCurveTo(44, 150, 104, 142);
      g.lineTo(576, 142);
      g.quadraticCurveTo(636, 150, 632, 212);
      g.lineTo(620, 424);
      g.quadraticCurveTo(616, 446, 588, 446);
      g.lineTo(92, 446);
      g.quadraticCurveTo(64, 446, 60, 424);
      g.closePath();
      g.fill();

      // cream roof band
      const roof = g.createLinearGradient(0, 132, 0, 184);
      roof.addColorStop(0, "#fff3cf");
      roof.addColorStop(0.55, "#ecd6a4");
      roof.addColorStop(1, "#b59a68");
      g.fillStyle = roof;
      g.beginPath();
      g.moveTo(60, 182);
      g.quadraticCurveTo(62, 140, 120, 136);
      g.lineTo(560, 136);
      g.quadraticCurveTo(618, 140, 620, 182);
      g.closePath();
      g.fill();
      g.fillStyle = "rgba(0,0,0,.22)";
      g.fillRect(60, 180, 560, 5);

      // rear window
      const glass = g.createLinearGradient(80, 190, 600, 325);
      glass.addColorStop(0, "#17252e");
      glass.addColorStop(0.35, "#0c1721");
      glass.addColorStop(0.6, "#21333c");
      glass.addColorStop(1, "#081017");
      g.fillStyle = glass;
      roundRect(g, 76, 190, 528, 150, 16);
      g.fill();
      g.strokeStyle = "#2b3038";
      g.lineWidth = 7;
      g.stroke();

      // passengers silhouettes / interior
      g.fillStyle = "rgba(11,16,21,.9)";
      for (let i = 0; i < 3; i++) {
        const x = 155 + i * 180;
        g.beginPath();
        g.arc(x, 279, 21, 0, TAU);
        g.fill();
        roundRect(g, x - 32, 298, 64, 44, 13);
        g.fill();
      }
      g.fillStyle = "rgba(255,202,118,.18)";
      g.fillRect(96, 198, 10, 132);

      // window reflections
      g.save();
      g.globalAlpha = 0.18;
      g.fillStyle = "#bff8ff";
      g.beginPath();
      g.moveTo(96, 330);
      g.lineTo(220, 194);
      g.lineTo(266, 194);
      g.lineTo(142, 330);
      g.closePath();
      g.fill();
      g.fillStyle = "#ffb4be";
      g.beginPath();
      g.moveTo(320, 330);
      g.lineTo(444, 194);
      g.lineTo(466, 194);
      g.lineTo(342, 330);
      g.closePath();
      g.fill();
      g.restore();

      // roof destination box
      g.fillStyle = "#111317";
      roundRect(g, 218, 32, 244, 84, 10);
      g.fill();
      g.strokeStyle = "#3d4149";
      g.lineWidth = 3;
      g.stroke();
      g.fillStyle = "#08090a";
      roundRect(g, 229, 43, 222, 62, 5);
      g.fill();
      drawGlowText(g, "屯門", 313, 74, 37, "#ffd166", 18);
      g.font = '700 11px "Cascadia Mono", monospace';
      g.fillStyle = "#ffdf8a";
      g.textAlign = "center";
      g.shadowColor = "#ffcf62";
      g.shadowBlur = 8;
      g.fillText("TUEN MUN  ·  $16", 340, 95);
      g.shadowBlur = 0;

      // roof vents
      g.fillStyle = "#2b2e35";
      roundRect(g, 488, 56, 74, 38, 5);
      g.fill();
      g.fillStyle = "rgba(255,255,255,.13)";
      for (let i = 0; i < 4; i++) g.fillRect(496, 63 + i * 7, 58, 2);

      // body details / seams
      g.strokeStyle = "rgba(50,4,12,.5)";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(340, 350);
      g.lineTo(340, 440);
      g.stroke();
      g.strokeStyle = "rgba(255,150,148,.22)";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(74, 357);
      g.lineTo(318, 357);
      g.moveTo(362, 357);
      g.lineTo(606, 357);
      g.stroke();

      // rear doors
      g.strokeStyle = "rgba(77,6,18,.72)";
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(110, 355);
      g.lineTo(110, 432);
      g.moveTo(570, 355);
      g.lineTo(570, 432);
      g.stroke();
      g.fillStyle = "#b8b3a6";
      g.fillRect(292, 374, 38, 7);
      g.fillRect(350, 374, 38, 7);

      // taillights
      const lightL = g.createLinearGradient(52, 300, 96, 300);
      lightL.addColorStop(0, "#ff263d");
      lightL.addColorStop(1, "#ff775f");
      g.fillStyle = "#1b0c10";
      roundRect(g, 52, 308, 82, 62, 9);
      g.fill();
      g.fillStyle = lightL;
      g.shadowColor = "#ff283f";
      g.shadowBlur = 26;
      roundRect(g, 58, 314, 66, 26, 5);
      g.fill();
      g.shadowBlur = 0;
      g.fillStyle = "#ffb35c";
      roundRect(g, 58, 346, 32, 17, 4);
      g.fill();

      g.fillStyle = "#1b0c10";
      roundRect(g, 546, 308, 82, 62, 9);
      g.fill();
      g.fillStyle = lightL;
      g.shadowColor = "#ff283f";
      g.shadowBlur = 26;
      roundRect(g, 556, 314, 66, 26, 5);
      g.fill();
      g.shadowBlur = 0;
      g.fillStyle = "#ffb35c";
      roundRect(g, 590, 346, 32, 17, 4);
      g.fill();

      // centre brake light
      g.fillStyle = "#ff3b50";
      g.shadowColor = "#ff3b50";
      g.shadowBlur = 20;
      roundRect(g, 300, 318, 80, 13, 5);
      g.fill();
      g.shadowBlur = 0;

      // bumper
      const bumper = g.createLinearGradient(0, 408, 0, 462);
      bumper.addColorStop(0, "#3b3d44");
      bumper.addColorStop(0.25, "#1b1d22");
      bumper.addColorStop(1, "#0a0b0e");
      g.fillStyle = bumper;
      roundRect(g, 60, 408, 560, 44, 8);
      g.fill();
      g.fillStyle = "#0a0b0d";
      g.fillRect(44, 424, 28, 24);
      g.fillRect(608, 424, 28, 24);

      // plate
      g.fillStyle = "#e9e5d8";
      roundRect(g, 279, 421, 122, 24, 3);
      g.fill();
      g.fillStyle = "#151515";
      g.font = '700 18px "Cascadia Mono", monospace';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("TM 777", 340, 434);

      // red van decal
      g.fillStyle = "rgba(255,244,220,.88)";
      g.font = '800 28px "Microsoft JhengHei", sans-serif';
      g.textAlign = "center";
      g.fillText("紅VAN", 340, 392);
      g.font = '700 10px "Cascadia Mono", monospace';
      g.fillStyle = "rgba(255,244,220,.52)";
      g.fillText("16 SEATS · PUBLIC LIGHT BUS", 340, 408);

      // exhaust
      g.fillStyle = "#16171b";
      roundRect(g, 120, 442, 36, 16, 5);
      g.fill();
      roundRect(g, 524, 442, 36, 16, 5);
      g.fill();
    });
  }

  function makePlayerVariant(base, theme) {
    const c = document.createElement("canvas");
    c.width = base.width;
    c.height = base.height;
    const g = c.getContext("2d");
    g.drawImage(base, 0, 0);
    const gold = theme === "gold";
    const tint = g.createLinearGradient(0, 0, 0, c.height);
    tint.addColorStop(0, "rgba(255,255,255,0)");
    tint.addColorStop(0.35, gold ? "rgba(255,207,92,.1)" : "rgba(87,246,255,.1)");
    tint.addColorStop(0.66, gold ? "rgba(255,193,58,.34)" : "rgba(255,62,220,.2)");
    tint.addColorStop(1, gold ? "rgba(255,170,30,.4)" : "rgba(86,239,255,.36)");
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = tint;
    g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = "source-over";

    if (gold) {
      g.strokeStyle = "rgba(255,220,130,.62)";
      g.lineWidth = 4;
      roundRect(g, 76, 190, 528, 150, 16);
      g.stroke();
      g.fillStyle = "rgba(255,216,112,.52)";
      g.fillRect(74, 358, 532, 5);
      g.fillRect(94, 404, 490, 3);
      drawGlowText(g, "GOLD", 340, 315, 23, "#ffe28a", 12);
    } else {
      g.strokeStyle = "rgba(114,246,255,.58)";
      g.lineWidth = 4;
      roundRect(g, 76, 190, 528, 150, 16);
      g.stroke();
      g.fillStyle = "rgba(255,62,220,.45)";
      g.fillRect(74, 358, 532, 4);
      g.fillStyle = "rgba(114,246,255,.5)";
      g.fillRect(94, 404, 490, 3);
      drawGlowText(g, "NEON", 340, 315, 23, "#9dfbff", 14);
    }
    return c;
  }

  /* ---- traffic sprites ---- */
  function trafficBase(g, w, h, bodyTop, bodyColor, opts = {}) {
    const grd = g.createLinearGradient(0, bodyTop, 0, h - 24);
    grd.addColorStop(0, bodyColor[0]);
    grd.addColorStop(0.7, bodyColor[1]);
    grd.addColorStop(1, bodyColor[2]);
    g.fillStyle = grd;
    roundRect(g, 16, bodyTop, w - 32, h - bodyTop - 24, 16);
    g.fill();
    g.strokeStyle = "rgba(0,0,0,.35)";
    g.lineWidth = 3;
    g.stroke();
    if (opts.window !== false) {
      g.fillStyle = "#0b1116";
      roundRect(g, 34, bodyTop + 18, w - 68, opts.windowH || 54, 10);
      g.fill();
      g.fillStyle = "rgba(150,220,235,.12)";
      g.beginPath();
      g.moveTo(46, bodyTop + 20);
      g.lineTo(100, bodyTop + 20);
      g.lineTo(66, bodyTop + 18 + (opts.windowH || 54));
      g.lineTo(40, bodyTop + 18 + (opts.windowH || 54));
      g.closePath();
      g.fill();
    }
    // bumper
    g.fillStyle = "#15171c";
    roundRect(g, 22, h - 40, w - 44, 26, 7);
    g.fill();
    // wheels
    g.fillStyle = "#07080b";
    g.fillRect(26, h - 36, 48, 30);
    g.fillRect(w - 74, h - 36, 48, 30);
    // plate
    g.fillStyle = "#e8e4d7";
    roundRect(g, w / 2 - 34, h - 37, 68, 18, 2);
    g.fill();
    g.fillStyle = "#161616";
    g.font = '700 12px "Cascadia Mono", monospace';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(opts.plate || "HK 0000", w / 2, h - 27.5);
  }

  function addTailLights(g, w, y, color = "#ff223d") {
    for (const x of [30, w - 62]) {
      g.fillStyle = "#1a0b0e";
      roundRect(g, x, y, 32, 21, 4);
      g.fill();
      g.fillStyle = color;
      g.shadowColor = color;
      g.shadowBlur = 18;
      roundRect(g, x + 3, y + 3, 26, 11, 3);
      g.fill();
      g.shadowBlur = 0;
    }
  }

  function makeTaxi() {
    return makeCanvas(300, 210, (g) => {
      g.fillStyle = "rgba(0,0,0,.45)";
      g.beginPath();
      g.ellipse(150, 197, 128, 12, 0, 0, TAU);
      g.fill();
      trafficBase(g, 300, 210, 74, ["#f0524f", "#c92438", "#8f1428"], { windowH: 58, plate: "HK 8812" });
      // taxi roof sign
      g.fillStyle = "#f1eadb";
      roundRect(g, 104, 42, 92, 30, 6);
      g.fill();
      g.fillStyle = "#b51e2f";
      g.font = '800 17px "Microsoft JhengHei", sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("的士", 150, 58);
      g.fillStyle = "rgba(255,255,255,.22)";
      g.fillRect(40, 92, 220, 3);
      g.fillStyle = "#ffb85c";
      roundRect(g, 44, 170, 30, 13, 3);
      g.fill();
      roundRect(g, 226, 170, 30, 13, 3);
      g.fill();
      addTailLights(g, 300, 142);
    });
  }

  function makePrivateCar() {
    return makeCanvas(286, 200, (g) => {
      g.fillStyle = "rgba(0,0,0,.45)";
      g.beginPath();
      g.ellipse(143, 187, 122, 12, 0, 0, TAU);
      g.fill();
      trafficBase(g, 286, 200, 82, ["#637483", "#33404f", "#141c27"], { windowH: 48, plate: "HK 4440" });
      g.fillStyle = "rgba(255,255,255,.12)";
      g.fillRect(30, 92, 226, 2);
      g.fillStyle = "rgba(120,240,255,.22)";
      g.fillRect(36, 96, 8, 40);
      addTailLights(g, 286, 137);
    });
  }

  function makeBus() {
    return makeCanvas(380, 430, (g) => {
      g.fillStyle = "rgba(0,0,0,.48)";
      g.beginPath();
      g.ellipse(190, 416, 160, 15, 0, 0, TAU);
      g.fill();
      // lower red body
      const grd = g.createLinearGradient(0, 60, 0, 390);
      grd.addColorStop(0, "#e9dcc3");
      grd.addColorStop(0.32, "#e5d3b5");
      grd.addColorStop(0.34, "#c62037");
      grd.addColorStop(1, "#7d1022");
      g.fillStyle = grd;
      roundRect(g, 22, 46, 336, 350, 13);
      g.fill();
      g.strokeStyle = "rgba(0,0,0,.42)";
      g.lineWidth = 4;
      g.stroke();
      // upper windows
      g.fillStyle = "#0a1117";
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 4; i++) {
          roundRect(g, 40 + i * 76, 78 + row * 88, 62, 58, 5);
          g.fill();
        }
      }
      g.fillStyle = "rgba(150,230,245,.1)";
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 4; i++) {
          g.beginPath();
          g.moveTo(40 + i * 76, 78 + row * 88);
          g.lineTo(62 + i * 76, 78 + row * 88);
          g.lineTo(46 + i * 76, 136 + row * 88);
          g.closePath();
          g.fill();
        }
      }
      // route display
      g.fillStyle = "#101216";
      roundRect(g, 252, 54, 88, 31, 3);
      g.fill();
      g.font = '700 17px "Cascadia Mono", monospace';
      g.fillStyle = "#ffbe52";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("61X", 296, 70);
      // lower panel
      g.fillStyle = "rgba(255,245,220,.85)";
      g.font = '700 17px "Microsoft JhengHei", sans-serif';
      g.fillText("屯門", 190, 282);
      g.font = '600 10px "Cascadia Mono", monospace';
      g.fillStyle = "rgba(255,245,220,.5)";
      g.fillText("KOWLOON MOTOR BUS", 190, 300);
      // lights
      addTailLights(g, 380, 336);
      // wheels
      g.fillStyle = "#060709";
      g.fillRect(26, 372, 64, 48);
      g.fillRect(290, 372, 64, 48);
      g.fillStyle = "#1a1d22";
      roundRect(g, 38, 382, 40, 30, 7);
      g.fill();
      roundRect(g, 302, 382, 40, 30, 7);
      g.fill();
    });
  }

  function makeTruck() {
    return makeCanvas(390, 270, (g) => {
      g.fillStyle = "rgba(0,0,0,.45)";
      g.beginPath();
      g.ellipse(195, 256, 168, 13, 0, 0, TAU);
      g.fill();
      g.fillStyle = "#0d1015";
      g.fillRect(22, 228, 346, 30);
      g.fillStyle = "#262b31";
      roundRect(g, 26, 26, 338, 210, 8);
      g.fill();
      g.strokeStyle = "#454c56";
      g.lineWidth = 3;
      g.stroke();
      // container ribs
      g.strokeStyle = "rgba(255,255,255,.08)";
      g.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        g.beginPath();
        g.moveTo(44 + i * 26, 40);
        g.lineTo(44 + i * 26, 220);
        g.stroke();
      }
      g.fillStyle = "rgba(120,240,255,.12)";
      g.fillRect(30, 36, 330, 6);
      // livery
      g.fillStyle = "#c82539";
      g.fillRect(24, 170, 342, 26);
      g.fillStyle = "#f0e8d4";
      g.font = '800 28px "Microsoft JhengHei", sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("香港物流", 195, 70);
      g.font = '600 11px "Cascadia Mono", monospace';
      g.fillStyle = "rgba(255,255,255,.35)";
      g.fillText("HONG KONG LOGISTICS · 24H", 195, 96);
      addTailLights(g, 390, 208);
      g.fillStyle = "#07080b";
      g.fillRect(34, 246, 58, 24);
      g.fillRect(298, 246, 58, 24);
    });
  }

  function makeGreenMinibus() {
    return makeCanvas(320, 260, (g) => {
      g.fillStyle = "rgba(0,0,0,.45)";
      g.beginPath();
      g.ellipse(160, 246, 136, 12, 0, 0, TAU);
      g.fill();
      trafficBase(g, 320, 260, 66, ["#3fb66d", "#1d7f4b", "#0d4d30"], { windowH: 62, plate: "HK 4488" });
      // cream roof band
      g.fillStyle = "#eadfbf";
      roundRect(g, 22, 62, 276, 24, 8);
      g.fill();
      // route display
      g.fillStyle = "#101216";
      roundRect(g, 92, 34, 136, 35, 4);
      g.fill();
      g.font = '800 21px "Cascadia Mono", monospace';
      g.fillStyle = "#ffd166";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.shadowColor = "#ffd166";
      g.shadowBlur = 8;
      g.fillText("44  屯門", 160, 52);
      g.shadowBlur = 0;
      g.fillStyle = "rgba(255,255,255,.12)";
      g.fillRect(32, 98, 256, 2);
      g.fillStyle = "#e9dfc3";
      g.font = '700 10px "Cascadia Mono", monospace';
      g.fillStyle = "rgba(255,245,220,.55)";
      g.fillText("GREEN MINIBUS · 16 SEATS", 160, 126);
      addTailLights(g, 320, 204);
    });
  }

  function makeVan() {
    return makeCanvas(310, 240, (g) => {
      g.fillStyle = "rgba(0,0,0,.45)";
      g.beginPath();
      g.ellipse(155, 226, 130, 12, 0, 0, TAU);
      g.fill();
      trafficBase(g, 310, 240, 58, ["#e8e6dd", "#b9c3c9", "#65727b"], { windowH: 66, plate: "HK 3310" });
      g.fillStyle = "#1b7f98";
      g.fillRect(20, 166, 270, 24);
      g.fillStyle = "#0e2b34";
      g.font = '800 19px "Microsoft JhengHei", sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("送貨中", 155, 178);
      addTailLights(g, 310, 183);
    });
  }

  /* ---- south-side scenery ---- */
  function makeMansion(v) {
    const palettes = [
      ["#eee8d8", "#beb39b", "#fff4cf"],
      ["#dfe5df", "#9eaaa5", "#d8f4ff"],
      ["#e5d7c5", "#b09a7c", "#ffe6b4"],
    ];
    const [wall, shade, light] = palettes[v];
    const rnd = mulberry32(700 + v * 53);
    return makeCanvas(360, 540, (g) => {
      g.fillStyle = "rgba(0,0,0,.42)";
      g.beginPath();
      g.ellipse(180, 528, 148, 13, 0, 0, TAU);
      g.fill();
      const bx = 50;
      const bw = 260;
      const top = 120;
      const body = g.createLinearGradient(bx, top, bx + bw, 510);
      body.addColorStop(0, wall);
      body.addColorStop(0.7, shade);
      body.addColorStop(1, "#514b42");
      g.fillStyle = body;
      g.fillRect(bx, top, bw, 390);
      g.fillStyle = "rgba(255,255,255,.35)";
      g.fillRect(bx, top, 5, 390);
      // floor slabs and balconies
      for (let f = 0; f < 3; f++) {
        const fy = top + 48 + f * 112;
        g.fillStyle = "rgba(255,255,255,.2)";
        g.fillRect(bx - 7, fy + 66, bw + 14, 7);
        g.strokeStyle = "rgba(255,255,255,.34)";
        g.lineWidth = 2;
        for (let r = 0; r < 7; r++) {
          g.beginPath();
          g.moveTo(bx + 12 + r * 40, fy + 66);
          g.lineTo(bx + 12 + r * 40, fy + 34);
          g.stroke();
        }
        g.fillStyle = "rgba(8,10,14,.62)";
        g.fillRect(bx + 18, fy + 3, bw - 36, 66);
        for (let w = 0; w < 4; w++) {
          const lit = rnd() < 0.62;
          g.fillStyle = lit ? (rnd() < 0.7 ? light : "#9defff") : "rgba(24,30,38,.8)";
          if (lit) {
            g.shadowColor = g.fillStyle;
            g.shadowBlur = 12;
          }
          g.fillRect(bx + 28 + w * 53, fy + 11, 38, 48);
          g.shadowBlur = 0;
        }
      }
      // gate and warm driveway
      g.fillStyle = "#2a2925";
      g.fillRect(bx - 24, 456, bw + 48, 54);
      g.fillStyle = "#6d5a3d";
      g.fillRect(bx - 10, 462, 58, 48);
      g.fillRect(bx + 212, 462, 58, 48);
      g.strokeStyle = "rgba(255,214,140,.55)";
      g.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        g.beginPath();
        g.moveTo(bx - 4 + i * 9, 468);
        g.lineTo(bx - 4 + i * 9, 506);
        g.moveTo(bx + 218 + i * 9, 468);
        g.lineTo(bx + 218 + i * 9, 506);
        g.stroke();
      }
      g.fillStyle = "#ffd166";
      g.shadowColor = "#ffd166";
      g.shadowBlur = 16;
      for (const gx of [bx + 36, bx + 248]) {
        g.beginPath();
        g.arc(gx, 462, 4, 0, TAU);
        g.fill();
      }
      g.shadowBlur = 0;
      // roof details
      g.fillStyle = "#2c3034";
      g.fillRect(bx + 30, top - 18, 52, 18);
      g.fillRect(bx + 172, top - 28, 30, 28);
      g.fillStyle = "rgba(255,255,255,.12)";
      g.fillRect(bx + 58, top + 3, 142, 3);
      // address plaque
      g.fillStyle = "#151719";
      roundRect(g, bx + 100, 482, 56, 17, 2);
      g.fill();
      g.fillStyle = "#ffd166";
      g.font = '700 11px "Cascadia Mono", monospace';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("No. 8", bx + 128, 491);
    });
  }

  function makePalm(v) {
    const rnd = mulberry32(960 + v * 41);
    return makeCanvas(340, 560, (g) => {
      g.fillStyle = "rgba(0,0,0,.36)";
      g.beginPath();
      g.ellipse(170, 548, 118, 11, 0, 0, TAU);
      g.fill();
      g.strokeStyle = "#302a22";
      g.lineWidth = 18;
      g.beginPath();
      g.moveTo(172, 548);
      g.quadraticCurveTo(153, 390, 187, 242);
      g.stroke();
      g.strokeStyle = "rgba(228,200,154,.18)";
      g.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const t = i / 12;
        const x = 172 + Math.sin(t * 2.4) * 20;
        const y = 540 - t * 290;
        g.beginPath();
        g.moveTo(x - 9, y);
        g.lineTo(x + 9, y - 3);
        g.stroke();
      }
      const baseX = 187;
      const baseY = 238;
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI * 0.92 + i * (Math.PI * 0.94 / 8) + (v ? 0.08 : 0);
        const len = 112 + rnd() * 62;
        const ex = baseX + Math.cos(a) * len;
        const ey = baseY + Math.sin(a) * len * 0.62 + 42;
        g.strokeStyle = i % 2 ? "#1d4a3d" : "#173b31";
        g.lineWidth = 13;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(baseX, baseY);
        g.quadraticCurveTo(baseX + Math.cos(a) * len * 0.55, baseY - 48, ex, ey);
        g.stroke();
        g.strokeStyle = "rgba(126,236,183,.18)";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(baseX, baseY);
        g.quadraticCurveTo(baseX + Math.cos(a) * len * 0.55, baseY - 52, ex, ey - 3);
        g.stroke();
        // leaflets
        for (let k = 0; k < 5; k++) {
          const t = 0.3 + k * 0.14;
          const lx = baseX + (ex - baseX) * t;
          const ly = baseY + (ey - baseY) * t - Math.sin(t * Math.PI) * 18;
          g.strokeStyle = "rgba(71,130,92,.5)";
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(lx, ly);
          g.lineTo(lx + Math.cos(a + 1.1) * 18, ly + Math.sin(a + 1.1) * 13);
          g.moveTo(lx, ly);
          g.lineTo(lx + Math.cos(a - 1.1) * 16, ly + Math.sin(a - 1.1) * 12);
          g.stroke();
        }
      }
      g.fillStyle = "#1c3c30";
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.arc(baseX - 14 + i * 10, baseY + 12 + (i % 2) * 5, 6, 0, TAU);
        g.fill();
      }
      const up = g.createRadialGradient(180, 520, 2, 180, 520, 90);
      up.addColorStop(0, "rgba(255,210,130,.15)");
      up.addColorStop(1, "rgba(255,190,90,0)");
      g.fillStyle = up;
      g.fillRect(70, 420, 220, 140);
    });
  }

  function makeYacht(v) {
    return makeCanvas(520, 270, (g) => {
      g.fillStyle = "rgba(0,0,0,.24)";
      g.beginPath();
      g.ellipse(260, 236, 228, 15, 0, 0, TAU);
      g.fill();
      // hull
      const hull = g.createLinearGradient(0, 160, 0, 230);
      hull.addColorStop(0, "#f5f0df");
      hull.addColorStop(0.55, "#cfd3d2");
      hull.addColorStop(1, "#5f6a70");
      g.fillStyle = hull;
      g.beginPath();
      g.moveTo(28, 170);
      g.lineTo(438, 170);
      g.quadraticCurveTo(486, 178, 498, 204);
      g.lineTo(440, 226);
      g.lineTo(78, 226);
      g.quadraticCurveTo(38, 216, 28, 170);
      g.closePath();
      g.fill();
      g.strokeStyle = "rgba(12,20,26,.7)";
      g.lineWidth = 3;
      g.stroke();
      g.fillStyle = "#c99d45";
      g.fillRect(42, 190, 410, 5);
      // cabin
      g.fillStyle = "#e8e6db";
      roundRect(g, 118, 116, 230, 58, 10);
      g.fill();
      g.fillStyle = "#1b2b36";
      roundRect(g, 136, 126, 194, 36, 5);
      g.fill();
      g.fillStyle = "rgba(255,220,150,.35)";
      g.fillRect(142, 132, 180, 4);
      g.fillStyle = "rgba(150,240,255,.14)";
      g.beginPath();
      g.moveTo(136, 160);
      g.lineTo(166, 126);
      g.lineTo(188, 126);
      g.lineTo(158, 160);
      g.closePath();
      g.fill();
      // upper deck / mast
      g.fillStyle = "#d8d4c5";
      roundRect(g, 190, 92, 92, 28, 7);
      g.fill();
      g.strokeStyle = "#c6c2b5";
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(236, 92);
      g.lineTo(236, 38);
      g.stroke();
      g.fillStyle = "#ffd166";
      g.shadowColor = "#ffd166";
      g.shadowBlur = 12;
      for (const [lx, ly, lr] of [[236, 36, 3], [80, 180, 2.5], [460, 185, 2.5]]) {
        g.beginPath();
        g.arc(lx, ly, lr, 0, TAU);
        g.fill();
      }
      g.shadowBlur = 0;
      // name
      g.fillStyle = "#1a2228";
      g.font = '700 12px "Cascadia Mono", monospace';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(v ? "LADY STANLEY" : "SEA VIP", 254, 208);
      // reflection
      g.globalAlpha = 0.18;
      g.fillStyle = "#ffcf72";
      g.fillRect(122, 240, 228, 2);
      g.fillStyle = "#8ce9ff";
      g.fillRect(152, 250, 160, 1);
      g.globalAlpha = 1;
    });
  }

  function makeLuxBillboard(v) {
    const defs = [
      ["淺水灣", "富豪海灣 · $180,000/呎", "#ffd166"],
      ["遊艇會", "泊岸請早", "#72f6ff"],
      ["赤柱廣場", "SUNDAY MARKET", "#ff9d7a"],
      ["香港仔", "避風塘海鮮 · 24H", "#8affc1"],
      ["STANLEY", "THE RICH SIDE", "#f2e7c9"],
    ];
    const [cn, en, neon] = defs[v];
    return makeCanvas(520, 300, (g) => {
      g.fillStyle = "rgba(3,5,9,.94)";
      g.fillRect(22, 20, 476, 222);
      g.strokeStyle = "rgba(255,255,255,.2)";
      g.lineWidth = 4;
      g.strokeRect(22, 20, 476, 222);
      g.strokeStyle = neon;
      g.lineWidth = 2;
      g.shadowColor = neon;
      g.shadowBlur = 20;
      g.strokeRect(34, 32, 452, 198);
      g.shadowBlur = 0;
      drawGlowText(g, cn, 260, 108, 55, neon, 24);
      g.font = '500 19px "Cascadia Mono", "Microsoft JhengHei", monospace';
      g.fillStyle = "rgba(255,255,255,.68)";
      g.textAlign = "center";
      g.fillText(en, 260, 164);
      g.fillStyle = "rgba(255,255,255,.3)";
      g.fillRect(86, 195, 348, 1);
      g.fillStyle = neon;
      g.font = '700 11px "Cascadia Mono", monospace';
      g.fillText("PRIVATE · MEMBERS ONLY", 260, 217);
      g.fillStyle = "#11131b";
      g.fillRect(160, 242, 20, 56);
      g.fillRect(340, 242, 20, 56);
      g.fillStyle = "#ffd166";
      g.shadowColor = "#ffd166";
      g.shadowBlur = 12;
      g.beginPath();
      g.arc(260, 19, 3, 0, TAU);
      g.fill();
      g.shadowBlur = 0;
    });
  }

  function makeChevron() {
    return makeCanvas(220, 190, (g) => {
      g.fillStyle = "rgba(0,0,0,.4)";
      g.fillRect(88, 150, 12, 38);
      g.fillRect(120, 150, 12, 38);
      g.fillStyle = "#111318";
      g.fillRect(78, 144, 64, 8);
      g.fillStyle = "#ffd166";
      g.shadowColor = "#ffd166";
      g.shadowBlur = 12;
      roundRect(g, 24, 18, 172, 128, 5);
      g.fill();
      g.shadowBlur = 0;
      g.fillStyle = "#151516";
      for (let i = 0; i < 3; i++) {
        const x = 48 + i * 46;
        g.beginPath();
        g.moveTo(x + 26, 36);
        g.lineTo(x, 82);
        g.lineTo(x + 26, 128);
        g.lineTo(x + 44, 128);
        g.lineTo(x + 18, 82);
        g.lineTo(x + 44, 36);
        g.closePath();
        g.fill();
      }
      g.fillStyle = "#111";
      g.fillRect(36, 136, 148, 4);
    });
  }

  function makeWarehouse(v) {
    const tints = [
      ["#b9b3a2", "#56544e", "#ffd27a"],
      ["#9da9ac", "#434e52", "#9defff"],
      ["#b6a48f", "#584c40", "#ffb45e"],
    ];
    const [wall, dark, lamp] = tints[v];
    const rnd = mulberry32(310 + v * 71);
    return makeCanvas(480, 330, (g) => {
      g.fillStyle = "rgba(0,0,0,.45)";
      g.beginPath();
      g.ellipse(240, 320, 226, 12, 0, 0, TAU);
      g.fill();
      const body = g.createLinearGradient(0, 90, 0, 310);
      body.addColorStop(0, wall);
      body.addColorStop(0.5, "#77746c");
      body.addColorStop(1, "#25282a");
      g.fillStyle = body;
      g.fillRect(20, 92, 440, 218);
      // corrugated roof/wall ribs
      g.strokeStyle = "rgba(255,255,255,.11)";
      g.lineWidth = 2;
      for (let x = 34; x < 450; x += 18) {
        g.beginPath();
        g.moveTo(x, 98);
        g.lineTo(x, 304);
        g.stroke();
      }
      g.fillStyle = dark;
      g.fillRect(12, 80, 456, 18);
      g.fillStyle = "rgba(255,255,255,.12)";
      g.fillRect(20, 83, 440, 3);
      // roller doors
      for (let d = 0; d < 2; d++) {
        const dx = 46 + d * 216;
        g.fillStyle = "#2a2d2e";
        g.fillRect(dx, 180, 150, 116);
        g.fillStyle = "rgba(255,255,255,.08)";
        for (let y = 186; y < 292; y += 9) g.fillRect(dx + 4, y, 142, 2);
        g.fillStyle = lamp;
        g.shadowColor = lamp;
        g.shadowBlur = 18;
        g.fillRect(dx + 52, 166, 46, 7);
        g.shadowBlur = 0;
        const sp = g.createLinearGradient(dx, 300, dx, 180);
        sp.addColorStop(0, "rgba(255,190,100,.22)");
        sp.addColorStop(1, "rgba(255,190,100,0)");
        g.fillStyle = sp;
        g.fillRect(dx + 8, 184, 134, 116);
      }
      // office windows upper left
      for (let i = 0; i < 4; i++) {
        g.fillStyle = rnd() < 0.6 ? "#ffd28a" : "#1c252c";
        g.shadowColor = "#ffd28a";
        g.shadowBlur = rnd() < 0.6 ? 8 : 0;
        g.fillRect(48 + i * 34, 124, 24, 28);
        g.shadowBlur = 0;
      }
      // sign
      g.fillStyle = "#14181b";
      roundRect(g, 318, 116, 112, 42, 4);
      g.fill();
      drawGlowText(g, v === 1 ? "凍倉" : "物流", 374, 137, 22, lamp, 10);
      g.font = '700 8px "Cascadia Mono", monospace';
      g.fillStyle = "rgba(255,255,255,.45)";
      g.textAlign = "center";
      g.fillText("24H LOGISTICS", 374, 151);
      // fence / bollards
      g.strokeStyle = "rgba(160,178,180,.26)";
      g.lineWidth = 2;
      for (let x = 26; x < 458; x += 22) {
        g.beginPath();
        g.moveTo(x, 306);
        g.lineTo(x, 282);
        g.stroke();
      }
      g.beginPath();
      g.moveTo(24, 284);
      g.lineTo(456, 284);
      g.stroke();
    });
  }

  function makeContainers(v) {
    const palette = v
      ? ["#b74232", "#2f6f91", "#c58b34", "#3e7b58"]
      : ["#2f6f91", "#b74232", "#d19b38", "#3d6b4c"];
    return makeCanvas(260, 250, (g) => {
      g.fillStyle = "rgba(0,0,0,.42)";
      g.beginPath();
      g.ellipse(130, 242, 118, 9, 0, 0, TAU);
      g.fill();
      const rows = [
        [42, 36, 176, 56, palette[0]],
        [32, 96, 190, 56, palette[1]],
        [52, 156, 154, 56, palette[2]],
      ];
      for (const [x, y, w, h, col] of rows) {
        const grad = g.createLinearGradient(0, y, 0, y + h);
        grad.addColorStop(0, col);
        grad.addColorStop(0.7, "#1c2529");
        g.fillStyle = grad;
        g.fillRect(x, y, w, h);
        g.strokeStyle = "rgba(0,0,0,.45)";
        g.lineWidth = 2;
        g.strokeRect(x, y, w, h);
        g.strokeStyle = "rgba(255,255,255,.12)";
        for (let rx = x + 8; rx < x + w - 4; rx += 12) {
          g.beginPath();
          g.moveTo(rx, y + 5);
          g.lineTo(rx, y + h - 5);
          g.stroke();
        }
        g.fillStyle = "rgba(255,255,255,.32)";
        g.font = '700 8px "Cascadia Mono", monospace';
        g.textAlign = "right";
        g.fillText("HK", x + w - 6, y + 12);
      }
      g.fillStyle = "#ffd166";
      g.shadowColor = "#ffd166";
      g.shadowBlur = 10;
      g.beginPath();
      g.arc(224, 212, 3, 0, TAU);
      g.fill();
      g.shadowBlur = 0;
    });
  }

  function makePedestrian(v) {
    const outfits = ["#ffd15c", "#ff5b64", "#5cbcff", "#f0eadb", "#6be28f", "#ff8ad8"];
    const frame = v % 2;
    const jacket = outfits[Math.floor(v / 2)];
    return makeCanvas(100, 200, (g) => {
      g.fillStyle = "rgba(0,0,0,.32)";
      g.beginPath();
      g.ellipse(50, 194, 26, 5, 0, 0, TAU);
      g.fill();
      // legs
      g.strokeStyle = "#25262c";
      g.lineWidth = 11;
      g.lineCap = "round";
      g.beginPath();
      if (frame === 0) {
        g.moveTo(43, 145); g.lineTo(34, 190);
        g.moveTo(57, 145); g.lineTo(66, 190);
      } else {
        g.moveTo(43, 145); g.lineTo(50, 190);
        g.moveTo(57, 145); g.lineTo(64, 186);
      }
      g.stroke();
      // shoes
      g.strokeStyle = "#0b0c10";
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(34, 190); g.lineTo(28, 192);
      g.moveTo(66, 190); g.lineTo(72, 192);
      g.stroke();
      // torso
      const body = g.createLinearGradient(0, 70, 0, 150);
      body.addColorStop(0, jacket);
      body.addColorStop(1, "#2a2c33");
      g.fillStyle = body;
      roundRect(g, 30, 72, 40, 78, 12);
      g.fill();
      // arms
      g.strokeStyle = jacket;
      g.lineWidth = 9;
      g.lineCap = "round";
      g.beginPath();
      if (frame === 0) {
        g.moveTo(30, 86); g.lineTo(16, 126);
        g.moveTo(70, 86); g.lineTo(84, 120);
      } else {
        g.moveTo(30, 86); g.lineTo(20, 112);
        g.moveTo(70, 86); g.lineTo(78, 132);
      }
      g.stroke();
      // head
      g.fillStyle = "#d6a27f";
      g.beginPath();
      g.arc(50, 52, 19, 0, TAU);
      g.fill();
      g.fillStyle = "#1a1718";
      g.beginPath();
      g.arc(50, 47, 19, Math.PI, TAU);
      g.fill();
      g.fillStyle = "#15161a";
      g.fillRect(42, 55, 3, 3);
      g.fillRect(56, 55, 3, 3);
      // bag
      if (v % 3 === 1) {
        g.fillStyle = "#1b2028";
        roundRect(g, 67, 95, 18, 30, 4);
        g.fill();
      }
      // reflective strip
      g.fillStyle = "rgba(255,255,255,.5)";
      g.fillRect(34, 120, 32, 3);
    });
  }

  function makePedestrianSide(v) {
    const outfits = ["#ffd15c", "#ff5b64", "#5cbcff", "#f0eadb", "#6be28f", "#ff8ad8"];
    const frame = v % 2;
    const jacket = outfits[Math.floor(v / 2)];
    return makeCanvas(120, 200, (g) => {
      g.fillStyle = "rgba(0,0,0,.32)";
      g.beginPath();
      g.ellipse(60, 194, 30, 5, 0, 0, TAU);
      g.fill();
      // legs in profile
      g.strokeStyle = "#25262c";
      g.lineWidth = 11;
      g.lineCap = "round";
      g.beginPath();
      if (frame === 0) {
        g.moveTo(58, 145); g.lineTo(38, 188);
        g.moveTo(60, 145); g.lineTo(82, 188);
      } else {
        g.moveTo(58, 145); g.lineTo(55, 190);
        g.moveTo(60, 145); g.lineTo(70, 178);
      }
      g.stroke();
      g.strokeStyle = "#0b0c10";
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(38, 188); g.lineTo(30, 191);
      g.moveTo(82, 188); g.lineTo(90, 191);
      g.stroke();
      // torso in profile
      const body = g.createLinearGradient(0, 70, 0, 150);
      body.addColorStop(0, jacket);
      body.addColorStop(1, "#2a2c33");
      g.fillStyle = body;
      roundRect(g, 44, 70, 36, 80, 12);
      g.fill();
      // swinging arm
      g.strokeStyle = jacket;
      g.lineWidth = 9;
      g.beginPath();
      if (frame === 0) {
        g.moveTo(68, 88); g.lineTo(90, 120);
      } else {
        g.moveTo(68, 88); g.lineTo(52, 120);
      }
      g.stroke();
      // head profile
      g.fillStyle = "#d6a27f";
      g.beginPath();
      g.arc(65, 52, 19, 0, TAU);
      g.fill();
      g.beginPath();
      g.moveTo(80, 50); g.lineTo(91, 58); g.lineTo(80, 64);
      g.fill();
      g.fillStyle = "#1a1718";
      g.beginPath();
      g.arc(64, 46, 19, Math.PI, TAU);
      g.fill();
      g.fillStyle = "#15161a";
      g.fillRect(73, 54, 4, 4);
      // bag
      if (v % 3 === 1) {
        g.fillStyle = "#1b2028";
        roundRect(g, 28, 92, 22, 32, 4);
        g.fill();
      }
      // reflective strip
      g.fillStyle = "rgba(255,255,255,.55)";
      g.fillRect(46, 120, 32, 3);
    });
  }

  function makeTrafficLight(phase) {
    return makeCanvas(180, 380, (g) => {
      g.fillStyle = "rgba(0,0,0,.4)";
      g.beginPath();
      g.ellipse(90, 372, 46, 7, 0, 0, TAU);
      g.fill();
      g.fillStyle = "#292d32";
      g.fillRect(82, 126, 16, 246);
      g.fillStyle = "#4e555b";
      g.fillRect(84, 126, 4, 246);
      // car signal housing
      g.fillStyle = "#11151a";
      roundRect(g, 42, 26, 96, 190, 13);
      g.fill();
      g.strokeStyle = "#525b62";
      g.lineWidth = 3;
      g.stroke();
      const lamps = [
        { y: 72, color: "#ff304d", on: phase >= 2 },
        { y: 121, color: "#ffc247", on: phase === 1 },
        { y: 170, color: "#45e07a", on: phase === 0 },
      ];
      for (const lamp of lamps) {
        g.fillStyle = lamp.on ? lamp.color : "rgba(255,255,255,.07)";
        g.shadowColor = lamp.color;
        g.shadowBlur = lamp.on ? 24 : 0;
        g.beginPath();
        g.arc(90, lamp.y, 23, 0, TAU);
        g.fill();
        g.shadowBlur = 0;
        g.strokeStyle = "rgba(255,255,255,.12)";
        g.lineWidth = 2;
        g.stroke();
      }
      // pedestrian signal
      g.fillStyle = "#0d1116";
      roundRect(g, 52, 240, 76, 92, 8);
      g.fill();
      g.strokeStyle = "#5b646a";
      g.lineWidth = 2;
      g.stroke();
      const walk = phase === 2;
      g.strokeStyle = walk ? "#65ff9a" : "#ff3b52";
      g.fillStyle = walk ? "#65ff9a" : "#ff3b52";
      g.shadowColor = walk ? "#65ff9a" : "#ff3b52";
      g.shadowBlur = 16;
      g.lineWidth = 4;
      g.beginPath();
      g.arc(90, 267, 7, 0, TAU);
      g.fill();
      g.beginPath();
      if (walk) {
        g.moveTo(90, 275); g.lineTo(86, 293); g.lineTo(74, 310);
        g.moveTo(86, 293); g.lineTo(100, 309);
        g.moveTo(89, 283); g.lineTo(75, 292);
        g.moveTo(89, 283); g.lineTo(104, 294);
      } else {
        g.moveTo(90, 275); g.lineTo(90, 300);
        g.moveTo(90, 282); g.lineTo(80, 296);
        g.moveTo(90, 282); g.lineTo(100, 296);
        g.moveTo(90, 300); g.lineTo(82, 318);
        g.moveTo(90, 300); g.lineTo(98, 318);
      }
      g.stroke();
      g.shadowBlur = 0;
      // sign
      g.fillStyle = "#e9e5d8";
      roundRect(g, 55, 344, 70, 20, 3);
      g.fill();
      g.fillStyle = "#171513";
      g.font = '700 13px "Microsoft JhengHei", sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("行人", 90, 355);
    });
  }

  function makeSpeedCamera() {
    return makeCanvas(220, 380, (g) => {
      g.fillStyle = "rgba(0,0,0,.4)";
      g.beginPath();
      g.ellipse(110, 372, 62, 8, 0, 0, TAU);
      g.fill();
      // pole
      g.fillStyle = "#2a2e33";
      g.fillRect(98, 130, 20, 242);
      g.fillStyle = "#4b5157";
      g.fillRect(100, 130, 5, 242);
      // camera housing
      g.fillStyle = "#747b7e";
      roundRect(g, 48, 58, 126, 82, 8);
      g.fill();
      g.fillStyle = "#1a1d20";
      roundRect(g, 58, 68, 106, 62, 5);
      g.fill();
      // lens
      const lens = g.createRadialGradient(96, 99, 2, 96, 99, 20);
      lens.addColorStop(0, "#dffbff");
      lens.addColorStop(0.4, "#5a9fbd");
      lens.addColorStop(1, "#08131c");
      g.fillStyle = lens;
      g.beginPath();
      g.arc(96, 99, 18, 0, TAU);
      g.fill();
      g.strokeStyle = "#a9b7bd";
      g.lineWidth = 2;
      g.stroke();
      // radar flash
      g.fillStyle = "#ff2f4b";
      g.shadowColor = "#ff2f4b";
      g.shadowBlur = 18;
      roundRect(g, 144, 78, 14, 10, 2);
      g.fill();
      g.shadowBlur = 0;
      // solar panel
      g.fillStyle = "#18252d";
      roundRect(g, 60, 26, 100, 20, 3);
      g.fill();
      g.strokeStyle = "rgba(120,220,255,.35)";
      g.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        g.beginPath();
        g.moveTo(60 + i * 20, 27);
        g.lineTo(60 + i * 20, 45);
        g.stroke();
      }
      // 80 sign
      g.fillStyle = "#f2f0e7";
      g.beginPath();
      g.arc(110, 178, 25, 0, TAU);
      g.fill();
      g.strokeStyle = "#d12e43";
      g.lineWidth = 5;
      g.stroke();
      g.fillStyle = "#151719";
      g.font = '800 20px "Cascadia Mono", monospace';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("80", 110, 178);
    });
  }

  function makeSupercar(color) {
    const palette = {
      red: ["#ff3546", "#c00d27", "#ff8a77", "RICH 1"],
      yellow: ["#ffd24d", "#c48c0e", "#fff1a0", "VIP 8"],
      silver: ["#eef1f3", "#89939f", "#ffffff", "STANLEY"],
    }[color];
    const [main, dark, shine, plate] = palette;
    return makeCanvas(380, 220, (g) => {
      g.fillStyle = "rgba(0,0,0,.5)";
      g.beginPath();
      g.ellipse(190, 205, 168, 12, 0, 0, TAU);
      g.fill();
      // wide rear tyres
      g.fillStyle = "#060709";
      roundRect(g, 20, 150, 78, 56, 13);
      g.fill();
      roundRect(g, 282, 150, 78, 56, 13);
      g.fill();
      g.fillStyle = "#1c2026";
      roundRect(g, 34, 164, 48, 30, 8);
      g.fill();
      roundRect(g, 298, 164, 48, 30, 8);
      g.fill();

      // rear wing
      g.fillStyle = "#17191d";
      roundRect(g, 34, 68, 312, 13, 4);
      g.fill();
      g.fillRect(82, 78, 10, 40);
      g.fillRect(288, 78, 10, 40);
      g.fillStyle = "rgba(255,255,255,.16)";
      g.fillRect(44, 70, 292, 2);

      // wide low body
      const body = g.createLinearGradient(0, 92, 0, 188);
      body.addColorStop(0, shine);
      body.addColorStop(0.25, main);
      body.addColorStop(0.8, dark);
      body.addColorStop(1, "#25070d");
      g.fillStyle = body;
      g.beginPath();
      g.moveTo(16, 126);
      g.quadraticCurveTo(12, 108, 46, 104);
      g.lineTo(154, 96);
      g.lineTo(190, 88);
      g.lineTo(226, 96);
      g.lineTo(334, 104);
      g.quadraticCurveTo(368, 108, 364, 128);
      g.lineTo(356, 176);
      g.quadraticCurveTo(350, 188, 330, 188);
      g.lineTo(50, 188);
      g.quadraticCurveTo(28, 188, 22, 174);
      g.closePath();
      g.fill();
      g.strokeStyle = "rgba(0,0,0,.4)";
      g.lineWidth = 3;
      g.stroke();

      // rear glass
      const glass = g.createLinearGradient(0, 100, 0, 148);
      glass.addColorStop(0, "#26333c");
      glass.addColorStop(1, "#070d12");
      g.fillStyle = glass;
      roundRect(g, 94, 102, 192, 45, 8);
      g.fill();
      g.fillStyle = "rgba(150,250,255,.16)";
      g.beginPath();
      g.moveTo(104, 146);
      g.lineTo(150, 104);
      g.lineTo(176, 104);
      g.lineTo(130, 146);
      g.closePath();
      g.fill();

      // full-width tail light
      g.fillStyle = "#30060d";
      roundRect(g, 28, 146, 324, 25, 5);
      g.fill();
      g.fillStyle = "#ff1838";
      g.shadowColor = "#ff1838";
      g.shadowBlur = 26;
      roundRect(g, 34, 151, 312, 12, 4);
      g.fill();
      g.shadowBlur = 0;
      g.fillStyle = "#ffd166";
      roundRect(g, 38, 154, 34, 5, 2);
      g.fill();
      roundRect(g, 308, 154, 34, 5, 2);
      g.fill();

      // diffuser + quad exhausts
      g.fillStyle = "#0c0e12";
      roundRect(g, 34, 176, 312, 15, 3);
      g.fill();
      for (let i = 0; i < 4; i++) {
        g.fillStyle = "#b8c1c8";
        g.beginPath();
        g.arc(108 + i * 54, 184, 6, 0, TAU);
        g.fill();
        g.fillStyle = "#15171c";
        g.beginPath();
        g.arc(108 + i * 54, 184, 3.4, 0, TAU);
        g.fill();
      }

      // plate and badge
      g.fillStyle = "#f0eadb";
      roundRect(g, 154, 174, 72, 17, 2);
      g.fill();
      g.fillStyle = "#1a1714";
      g.font = '700 10px "Cascadia Mono", monospace';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(plate, 190, 182.5);
      g.fillStyle = "#ffd166";
      g.shadowColor = "#ffd166";
      g.shadowBlur = 8;
      g.beginPath();
      g.arc(190, 122, 3, 0, TAU);
      g.fill();
      g.shadowBlur = 0;

      // body highlights
      g.strokeStyle = "rgba(255,255,255,.25)";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(38, 113);
      g.quadraticCurveTo(150, 100, 190, 96);
      g.stroke();
      g.fillStyle = "rgba(255,255,255,.2)";
      g.fillRect(48, 130, 5, 34);
      g.fillRect(328, 130, 5, 34);
    });
  }

  /* -----------------------------------------------------------------------
     Background art
     ----------------------------------------------------------------------- */
  let BG = {};

  function buildBackground() {
    /* stars / moon are immediate; these are cached layers */
    BG.cloud = makeCanvas(640, 120, (g) => {
      const cg = g.createLinearGradient(0, 0, 640, 0);
      cg.addColorStop(0, "rgba(70,60,95,0)");
      cg.addColorStop(0.5, "rgba(91,72,103,.5)");
      cg.addColorStop(1, "rgba(70,60,95,0)");
      g.fillStyle = cg;
      g.beginPath();
      g.ellipse(320, 60, 260, 16, 0, 0, TAU);
      g.fill();
    });

    BG.mountains = makeCanvas(2600, 460, (g) => {
      const rnd = mulberry32(72);
      const ridge = (baseY, amp, color, step) => {
        g.beginPath();
        g.moveTo(0, 460);
        g.lineTo(0, baseY);
        for (let x = 0; x <= 2600; x += step) {
          const y = baseY - Math.abs(Math.sin(x * 0.0027 + rnd() * 0.4)) * amp - rnd() * 34;
          g.lineTo(x, y);
        }
        g.lineTo(2600, 460);
        g.closePath();
        g.fillStyle = color;
        g.fill();
      };
      ridge(310, 160, "#111426", 90);
      ridge(370, 120, "#0a0d17", 70);
      // tiny hill lights
      const rnd2 = mulberry32(310);
      for (let i = 0; i < 50; i++) {
        g.fillStyle = `rgba(255,200,120,${0.06 + rnd2() * 0.2})`;
        g.fillRect(180 + rnd2() * 2260, 300 + rnd2() * 80, 2, 2);
      }
    });

    BG.city = makeCanvas(3400, 700, (g) => {
      const rnd = mulberry32(9001);
      const base = 700;
      let x = 0;
      const buildings = [];
      while (x < 3400) {
        const bw = 60 + rnd() * 110;
        const bh = 120 + Math.pow(rnd(), 1.7) * 430;
        buildings.push({ x, w: bw, h: bh });
        x += bw + 6 + rnd() * 16;
      }
      for (const b of buildings) {
        const grad = g.createLinearGradient(0, base - b.h, 0, base);
        grad.addColorStop(0, "#111423");
        grad.addColorStop(1, "#070910");
        g.fillStyle = grad;
        g.fillRect(b.x, base - b.h, b.w, b.h);
        g.fillStyle = "rgba(255,255,255,.035)";
        g.fillRect(b.x, base - b.h, 2, b.h);
        // windows
        for (let wy = base - b.h + 15; wy < base - 18; wy += 13) {
          for (let wx = b.x + 7; wx < b.x + b.w - 5; wx += 11) {
            if (rnd() < 0.2) {
              const warm = rnd() < 0.6;
              g.fillStyle = warm
                ? `rgba(255,200,120,${0.12 + rnd() * 0.4})`
                : `rgba(120,230,255,${0.1 + rnd() * 0.35})`;
              g.fillRect(wx, wy, 2, 3);
            }
          }
        }
        // rooftop antenna
        if (rnd() < 0.35) {
          g.strokeStyle = "rgba(255,255,255,.12)";
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(b.x + b.w * 0.5, base - b.h);
          g.lineTo(b.x + b.w * 0.5, base - b.h - 40);
          g.stroke();
          g.fillStyle = "#ff334f";
          g.shadowColor = "#ff334f";
          g.shadowBlur = 6;
          g.fillRect(b.x + b.w * 0.5 - 1, base - b.h - 42, 3, 3);
          g.shadowBlur = 0;
        }
      }
      // neon accents
      const colors = ["#ff3552", "#65f4ff", "#ffcb64", "#ff6bdc"];
      for (let i = 0; i < 30; i++) {
        const bx = 80 + rnd() * 3240;
        const by = 190 + rnd() * 420;
        const col = colors[Math.floor(rnd() * colors.length)];
        const hh = 35 + rnd() * 120;
        g.fillStyle = col;
        g.shadowColor = col;
        g.shadowBlur = 14;
        g.globalAlpha = 0.65;
        g.fillRect(bx, by, 3, hh);
        g.globalAlpha = 1;
        g.shadowBlur = 0;
      }
      // base glow
      const glow = g.createLinearGradient(0, 520, 0, 700);
      glow.addColorStop(0, "rgba(255,120,86,0)");
      glow.addColorStop(1, "rgba(255,120,86,.13)");
      g.fillStyle = glow;
      g.fillRect(0, 520, 3400, 180);
    });

    BG.bridge = makeCanvas(1900, 480, (g) => {
      // strung bridge silhouette
      g.strokeStyle = "#0e131d";
      g.lineWidth = 7;
      g.beginPath();
      g.moveTo(40, 380);
      g.quadraticCurveTo(950, 345, 1860, 380);
      g.stroke();
      g.fillStyle = "#0b0f18";
      g.fillRect(0, 378, 1900, 12);
      // towers
      for (const tx of [520, 1320]) {
        g.strokeStyle = "#131a27";
        g.lineWidth = 9;
        g.beginPath();
        g.moveTo(tx - 26, 400);
        g.lineTo(tx - 13, 80);
        g.moveTo(tx + 26, 400);
        g.lineTo(tx + 13, 80);
        g.stroke();
        g.strokeStyle = "rgba(130,180,220,.22)";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(tx - 13, 80);
        g.lineTo(tx + 13, 80);
        g.stroke();
        // cables
        for (let i = 0; i < 7; i++) {
          g.strokeStyle = "rgba(140,180,215,.14)";
          g.lineWidth = 1.2;
          g.beginPath();
          g.moveTo(tx - 10, 95 + i * 12);
          g.lineTo(tx - 190 + i * 25, 380);
          g.moveTo(tx + 10, 95 + i * 12);
          g.lineTo(tx + 190 - i * 25, 380);
          g.stroke();
        }
        g.fillStyle = "#ff334f";
        g.shadowColor = "#ff334f";
        g.shadowBlur = 8;
        g.beginPath();
        g.arc(tx, 78, 3, 0, TAU);
        g.fill();
        g.shadowBlur = 0;
      }
      // deck lights
      for (let x = 80; x < 1860; x += 55) {
        g.fillStyle = "rgba(255,210,130,.5)";
        g.shadowColor = "#ffd182";
        g.shadowBlur = 8;
        g.fillRect(x, 369, 3, 3);
        g.shadowBlur = 0;
      }
      // water haze
      const haze = g.createLinearGradient(0, 390, 0, 480);
      haze.addColorStop(0, "rgba(20,40,55,.15)");
      haze.addColorStop(1, "rgba(5,8,15,.8)");
      g.fillStyle = haze;
      g.fillRect(0, 390, 1900, 90);
    });

    BG.bay = makeCanvas(3000, 460, (g) => {
      const rnd = mulberry32(481);
      // low island silhouettes
      for (let layer = 0; layer < 2; layer++) {
        const base = 350 + layer * 38;
        g.fillStyle = layer === 0 ? "#0c1420" : "#070d15";
        g.beginPath();
        g.moveTo(0, 460);
        g.lineTo(0, base);
        for (let x = 0; x <= 3000; x += 80) {
          const y = base - Math.abs(Math.sin(x * 0.0032 + layer * 2.1)) * (34 + layer * 16) - rnd() * 18;
          g.lineTo(x, y);
        }
        g.lineTo(3000, 460);
        g.closePath();
        g.fill();
      }
      // far-shore lights
      for (let i = 0; i < 120; i++) {
        const x = 40 + rnd() * 2920;
        const y = 318 + rnd() * 48;
        const warm = rnd() < 0.72;
        g.fillStyle = warm
          ? `rgba(255,208,130,${0.08 + rnd() * 0.4})`
          : `rgba(130,240,255,${0.06 + rnd() * 0.28})`;
        g.fillRect(x, y, 2, 2);
      }
      // tiny anchored boats
      for (let i = 0; i < 9; i++) {
        const x = 180 + rnd() * 2640;
        const y = 352 + rnd() * 28;
        g.strokeStyle = "rgba(220,235,235,.36)";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x, y - 13);
        g.stroke();
        g.fillStyle = "rgba(255,220,150,.55)";
        g.fillRect(x - 1, y - 16, 2, 2);
      }
      const haze = g.createLinearGradient(0, 300, 0, 460);
      haze.addColorStop(0, "rgba(16,28,42,.06)");
      haze.addColorStop(1, "rgba(4,7,12,.78)");
      g.fillStyle = haze;
      g.fillRect(0, 300, 3000, 160);
    });
  }

