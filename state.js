/* =========================================================================
   state.js — Traffic metadata, mutable game state and camera state.
   Red Van Daredevil · classic scripts, shared global lexical scope
   ========================================================================= */
"use strict";

  /* -----------------------------------------------------------------------
     Traffic sprites metadata
     ----------------------------------------------------------------------- */
  const TRAFFIC_DEFS = {
    taxi: { imgKey: "taxi", worldW: 270, speedMin: 2100, speedMax: 3150, half: 0.15 },
    private: { imgKey: "private", worldW: 250, speedMin: 2400, speedMax: 3600, half: 0.14 },
    bus: { imgKey: "bus", worldW: 360, speedMin: 1500, speedMax: 2200, half: 0.2 },
    truck: { imgKey: "truck", worldW: 340, speedMin: 1700, speedMax: 2450, half: 0.19 },
    van: { imgKey: "van", worldW: 285, speedMin: 2100, speedMax: 3000, half: 0.16 },
    greenvan: { imgKey: "greenvan", worldW: 300, speedMin: 2000, speedMax: 2900, half: 0.165 },
    sportRed: { imgKey: "sportRed", worldW: 345, speedMin: 4100, speedMax: 5900, half: 0.175, premium: true, racer: true },
    sportYellow: { imgKey: "sportYellow", worldW: 345, speedMin: 4100, speedMax: 5900, half: 0.175, premium: true, racer: true },
    sportSilver: { imgKey: "sportSilver", worldW: 345, speedMin: 4000, speedMax: 5700, half: 0.175, premium: true, racer: true },
    bike: { imgKey: "bike", worldW: 175, speedMin: 520, speedMax: 1150, half: 0.085, bike: true },
    police: { imgKey: "police", worldW: 330, speedMin: 4600, speedMax: 6000, half: 0.17, police: true, racer: true },
  };

  /* -----------------------------------------------------------------------
     Game state
     ----------------------------------------------------------------------- */
  const state = {
    mode: "menu",
    playerZ: START_Z,
    playerX: -0.2,
    playerVX: 0,
    speed: 0,
    timeLeft: 62,
    crashCooldown: 0,
    barrierCooldown: 0,
    score: 0,
    best: 0,
    stage: 0,
    damage: 100,
    boost: 0.38,
    nearMisses: 0,
    combo: 1,
    comboTimer: 0,
    topSpeed: 0,
    shake: 0,
    redFlash: 0,
    offroadCooldown: 0,
    spawnTimer: 0,
    checkpointTimer: 0,
    traffic: [],
    particles: [],
    popups: [],
    speedLines: [],
    time: 0,
    toastTimer: 0,
    lastHud: 0,
    honkCooldown: 0,
    boostActive: false,
    failReason: "",
    warn80Armed: true,
    warn100Armed: true,
    fastScreamArmed: true,
    screamCooldown: 0,
    slowTimer: 0,
    moodCooldown: 0,
    stats: { speed: 1, grip: 1, brake: 1, boost: 1, earnings: 1 },
    earned: 0,
    pedestrians: [],
    pedestrianTimer: 1,
    alighting: [],
    pendingAlight: 0,
    heat: 0,
    policeChase: false,
    policeChaseTimer: 0,
    policeSpawnTimer: 0,
    policeFines: 0,
    policeFineTimer: 0,
    cameraFlash: 0,
  };

  const cam = { x: 0, y: 0, z: 0 };

