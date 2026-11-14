/* =========================================================================
   abstract.js — Browser and canvas shell: DOM refs, viewport sizing, drawing surface and canvas factory.
   Red Van Daredevil · classic scripts, shared global lexical scope
   ========================================================================= */
"use strict";

  /* -----------------------------------------------------------------------
     Canvas / DOM
     ----------------------------------------------------------------------- */
  const canvas = document.getElementById("world");
  const ctx = canvas.getContext("2d", { alpha: false });
  let W = 1280;
  let H = 720;
  let DPR = 1;

  const dom = {
    hud: document.getElementById("hud"),
    timer: document.getElementById("timer"),
    brandRoute: document.getElementById("brandRoute"),
    score: document.getElementById("score"),
    bestLine: document.getElementById("bestLine"),
    progressFill: document.getElementById("progressFill"),
    vanMarker: document.getElementById("vanMarker"),
    stopDots: [0, 1, 2, 3].map((i) => document.getElementById("stopDot" + i)),
    stopLabels: [0, 1, 2, 3].map((i) => document.getElementById("stopLabel" + i)),
    combo: document.getElementById("combo"),
    comboMult: document.getElementById("comboMult"),
    damageFill: document.getElementById("damageFill"),
    damageText: document.getElementById("damageText"),
    boostFill: document.getElementById("boostFill"),
    boostText: document.getElementById("boostText"),
    heatFill: document.getElementById("heatFill"),
    heatText: document.getElementById("heatText"),
    policeAlert: document.getElementById("policeAlert"),
    policeFine: document.getElementById("policeFine"),
    stageName: document.getElementById("stageName"),
    nearMissLine: document.getElementById("nearMissLine"),
    speed: document.getElementById("speed"),
    speedArc: document.getElementById("speedArc"),
    needleDot: document.getElementById("needleDot"),
    gear: document.getElementById("gear"),
    toast: document.getElementById("toast"),
    boostFlash: document.getElementById("boostFlash"),
    startScreen: document.getElementById("startScreen"),
    checkpointScreen: document.getElementById("checkpointScreen"),
    pauseScreen: document.getElementById("pauseScreen"),
    resultScreen: document.getElementById("resultScreen"),
    resultFoot: document.getElementById("resultFoot"),
    resultEarned: document.getElementById("resultEarned"),
    startBest: document.getElementById("startBest"),
    walletChip: document.getElementById("walletChip"),
    garageBtn: document.getElementById("garageBtn"),
    garageScreen: document.getElementById("garageScreen"),
    garageContent: document.getElementById("garageContent"),
    garageWallet: document.getElementById("garageWallet"),
    closeGarageBtn: document.getElementById("closeGarageBtn"),
    garageNotice: document.getElementById("garageNotice"),
    routeCurrentBtn: document.getElementById("routeCurrentBtn"),
    routeCurrentNo: document.getElementById("routeCurrentNo"),
    routeCurrentName: document.getElementById("routeCurrentName"),
    routeCurrentMeta: document.getElementById("routeCurrentMeta"),
    routeCount: document.getElementById("routeCount"),
    routeScreen: document.getElementById("routeScreen"),
    routeGrid: document.getElementById("routeGrid"),
    closeRoutesBtn: document.getElementById("closeRoutesBtn"),
    destBoard: document.getElementById("destBoard"),
    destOriginCn: document.getElementById("destOriginCn"),
    destOriginEn: document.getElementById("destOriginEn"),
    destDestCn: document.getElementById("destDestCn"),
    destDestEn: document.getElementById("destDestEn"),
    destDistance: document.getElementById("destDistance"),
    destStages: document.getElementById("destStages"),
    destTag: document.getElementById("destTag"),
    destShift: document.getElementById("destShift"),
    missionOne: document.getElementById("missionOne"),
    briefFoot: document.getElementById("briefFoot"),
    routeStrip: document.getElementById("routeStrip"),
    touchControls: document.getElementById("touchControls"),
    soundBtn: document.getElementById("soundBtn"),
    soundIcon: document.getElementById("soundIcon"),
    cpChinese: document.getElementById("cpChinese"),
    cpEnglish: document.getElementById("cpEnglish"),
    cpTime: document.getElementById("cpTime"),
    cpRepair: document.getElementById("cpRepair"),
    cpScore: document.getElementById("cpScore"),
    cpLine: document.getElementById("cpLine"),
    resultKicker: document.getElementById("resultKicker"),
    resultTitle: document.getElementById("resultTitle"),
    resultLine: document.getElementById("resultLine"),
    rank: document.getElementById("rank"),
    resultScore: document.getElementById("resultScore"),
    resultNear: document.getElementById("resultNear"),
    resultSpeed: document.getElementById("resultSpeed"),
    resultTime: document.getElementById("resultTime"),
    newBest: document.getElementById("newBest"),
  };

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(320, window.innerWidth);
    H = Math.max(320, window.innerHeight);
    drawDist = W < 900 ? 155 : W < 1180 ? 180 : DRAW_DIST;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (typeof buildTicks === "function") buildTicks();
  }
  window.addEventListener("resize", resize, { passive: true });

  /* -----------------------------------------------------------------------
     Sprite factory
     ----------------------------------------------------------------------- */
  function makeCanvas(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    draw(g, w, h);
    return c;
  }
