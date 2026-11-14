/* =========================================================================
   gameplay.js — Input, run flow, particles, traffic, collisions, scoring and police/heat simulation.
   Red Van Daredevil · classic scripts, shared global lexical scope
   ========================================================================= */
"use strict";

  /* -----------------------------------------------------------------------
     Input
     ----------------------------------------------------------------------- */
  const input = { left: false, right: false, gas: false, brake: false, boost: false };

  function setBoostActive(v) {
    if (state.boostActive !== v) {
      state.boostActive = v;
      dom.boostFlash.classList.toggle("on", v);
    }
  }

  function startFromMenu() {
    if (state.mode !== "menu") return;
    startGame();
  }

  function handleKeyDown(e) {
    const code = e.code;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(code)) e.preventDefault();

    if (code === "KeyM") {
      const muted = AudioKit.init() || AudioKit.toggle();
      updateSoundButton(muted);
      return;
    }

    if (code === "Escape" && state.mode === "menu" && dom.garageScreen && !dom.garageScreen.classList.contains("is-hidden")) {
      closeGarage();
      return;
    }
    if (code === "Escape" && state.mode === "menu" && dom.routeScreen && !dom.routeScreen.classList.contains("is-hidden")) {
      closeRouteScreen();
      return;
    }
    if (code === "KeyP" || code === "Escape") {
      if (state.mode === "playing") pauseGame();
      else if (state.mode === "paused") resumeGame();
      return;
    }

    if (code === "KeyR") {
      if (state.mode === "finished" || state.mode === "failed") startGame();
      return;
    }

    if (state.mode === "menu" && /^Digit[1-7]$/.test(code)) {
      const ids = Object.keys(ROUTES);
      const routeId = ids[Number(code.slice(5)) - 1];
      if (routeId) selectRoute(routeId);
      return;
    }
    const routesOpen = dom.routeScreen && !dom.routeScreen.classList.contains("is-hidden");
    const garageOpen = dom.garageScreen && !dom.garageScreen.classList.contains("is-hidden");
    if ((code === "Enter" || code === "Space") && state.mode === "menu" && !routesOpen && !garageOpen) {
      startGame();
      return;
    }
    if ((code === "Enter" || code === "Space") && (state.mode === "finished" || state.mode === "failed")) {
      startGame();
      return;
    }
    if (code === "Enter" && state.mode === "paused") {
      resumeGame();
      return;
    }

    if (state.mode !== "playing") return;

    if (code === "ArrowLeft" || code === "KeyA") input.left = true;
    if (code === "ArrowRight" || code === "KeyD") input.right = true;
    if (code === "ArrowUp" || code === "KeyW") input.gas = true;
    if (code === "ArrowDown" || code === "KeyS") input.brake = true;
    if (code === "Space" || code === "ShiftLeft" || code === "ShiftRight") {
      if (!input.boost) input.boost = true;
    }
    if (code === "KeyH") horn();
  }

  function handleKeyUp(e) {
    const code = e.code;
    if (code === "ArrowLeft" || code === "KeyA") input.left = false;
    if (code === "ArrowRight" || code === "KeyD") input.right = false;
    if (code === "ArrowUp" || code === "KeyW") input.gas = false;
    if (code === "ArrowDown" || code === "KeyS") input.brake = false;
    if (code === "Space" || code === "ShiftLeft" || code === "ShiftRight") input.boost = false;
  }

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", () => {
    input.left = input.right = input.gas = input.brake = input.boost = false;
    if (state.mode === "playing") pauseGame();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.mode === "playing") pauseGame();
  });

  function bindHold(el, key) {
    if (!el) return;
    const down = (e) => {
      e.preventDefault();
      input[key] = true;
      el.classList.add("active");
      if (el.setPointerCapture) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    };
    const up = (e) => {
      input[key] = false;
      el.classList.remove("active");
    };
    el.addEventListener("pointerdown", down, { passive: false });
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", up);
    el.addEventListener("lostpointercapture", up);
  }

  function bindTouch() {
    bindHold(document.getElementById("touchLeft"), "left");
    bindHold(document.getElementById("touchRight"), "right");
    bindHold(document.getElementById("touchGas"), "gas");
    bindHold(document.getElementById("touchBrake"), "brake");
    bindHold(document.getElementById("touchBoost"), "boost");
  }

  function updateSoundButton(muted) {
    if (!dom.soundBtn) return;
    dom.soundBtn.setAttribute("aria-pressed", String(!muted));
    dom.soundBtn.innerHTML = `<span id="soundIcon">${muted ? "○" : "◉"}</span> 聲音 ${muted ? "OFF" : "ON"}`;
  }

  function toggleSound() {
    AudioKit.init();
    if (AudioKit.ctx && AudioKit.ctx.state === "suspended") AudioKit.ctx.resume();
    const muted = AudioKit.toggle();
    updateSoundButton(muted);
    if (!muted) AudioKit.click();
  }

  /* -----------------------------------------------------------------------
     Game flow
     ----------------------------------------------------------------------- */
  function resetGame() {
    state.playerZ = START_Z;
    state.playerX = -0.2;
    state.playerVX = 0;
    state.speed = 1500;
    state.timeLeft = activeRoute.timer;
    state.crashCooldown = 0;
    state.barrierCooldown = 0;
    state.score = 0;
    state.stage = 0;
    state.damage = 100;
    state.boost = 0.38;
    state.nearMisses = 0;
    state.combo = 1;
    state.comboTimer = 0;
    state.topSpeed = 0;
    state.shake = 0;
    state.redFlash = 0;
    state.offroadCooldown = 0;
    state.spawnTimer = 0.4;
    state.checkpointTimer = 0;
    state.traffic = [];
    state.particles = [];
    state.popups = [];
    state.time = 0;
    state.honkCooldown = 0;
    state.failReason = "";
    state.earned = 0;
    state.boostActive = false;
    state.warn80Armed = true;
    state.warn100Armed = true;
    state.fastScreamArmed = true;
    state.screamCooldown = 0;
    state.slowTimer = 0;
    state.moodCooldown = 0;
    state.pedestrians = [];
    state.pedestrianTimer = 1;
    state.alighting = [];
    state.pendingAlight = 0;
    if (route.cameras) route.cameras.forEach((cam) => { cam.triggered = false; });
    if (route.crossings) {
      route.crossings.forEach((crossing) => {
        crossing.spawned = false;
        crossing.active = false;
        crossing.phase = 0;
        crossing.timer = 0;
        crossing.notified = false;
        crossing.lights.forEach((light) => { light.variant = 0; });
      });
    }
    state.heat = 0;
    state.policeChase = false;
    state.policeChaseTimer = 0;
    state.policeSpawnTimer = 0;
    state.policeFines = 0;
    state.policeFineTimer = 0;
    state.cameraFlash = 0;
    setBoostActive(false);
    input.left = input.right = input.gas = input.brake = input.boost = false;

    const road = sampleRoad(state.playerZ);
    cam.x = road.x + state.playerX * ROAD_HALF;
    cam.y = road.y + CAM_HEIGHT;
    cam.z = state.playerZ - CAM_BACK;

    spawnInitialTraffic();
    updateHUD(true);
    dom.combo.classList.add("is-hidden");
    dom.timer.classList.remove("danger");
    dom.stageName.textContent = activeRoute.stageNames[0];
  }

  function spawnInitialTraffic() {
    const cfg = activeRoute.traffic;
    const trafficMul = state.stats.traffic || 1;
    const count = Math.round(cfg.initial * trafficMul);
    state.traffic.length = 0;
    const showroom = cfg.showroom || [];
    for (let i = 0; i < count; i++) {
      const z = START_Z + 6500 + i * cfg.spacing + Math.random() * 850;
      const forced = i < showroom.length ? showroom[i] : null;
      spawnTraffic(z, undefined, forced);
    }
  }

  function spawnTraffic(z, forcedLane, forcedType) {
    const pool = activeRoute.traffic.types;
    const type = forcedType || pool[Math.floor(Math.random() * pool.length)];
    const def = TRAFFIC_DEFS[type];
    let lane = forcedLane != null ? forcedLane : LANES[Math.floor(Math.random() * LANES.length)];
    let guard = 0;
    while (guard++ < 8) {
      let conflict = false;
      for (const c of state.traffic) {
        if (Math.abs(c.z - z) < 1000 && Math.abs(c.lane - lane) < 0.32) {
          conflict = true;
          break;
        }
      }
      if (!conflict) break;
      lane = LANES[Math.floor(Math.random() * LANES.length)];
    }
    const speed = lerp(def.speedMin, def.speedMax, Math.random()) * activeRoute.traffic.speedFactor;
    state.traffic.push({
      z,
      lane,
      baseLane: lane,
      targetLane: lane,
      laneTimer: 2.5 + Math.random() * 4,
      speed,
      type,
      def,
      passed: false,
      hit: false,
      hitCooldown: 0,
      sway: Math.random() * TAU,
      honk: 0,
      nearFlag: false,
    });
  }

  function startGame() {
    if (state.mode === "playing") return;
    AudioKit.init();
    if (AudioKit.ctx && AudioKit.ctx.state === "suspended") AudioKit.ctx.resume();
    AudioKit.stopVoice();
    AudioKit.stopSiren();
    AudioKit.click();
    AudioKit.startRev();
    state.mode = "playing";
    hideAllOverlays();
    dom.startScreen.classList.add("is-hidden");
    dom.hud.classList.remove("is-hidden");
    dom.touchControls.classList.add("show");
    resetGame();
    showToast(activeRoute.startToast, 2400);
    requestAnimationFrame(() => {
      AudioKit.update(0.15, false, true);
    });
  }

  function showMenu() {
    state.mode = "menu";
    AudioKit.stopVoice();
    AudioKit.stopSiren();
    state.policeChase = false;
    state.policeFines = 0;
    state.policeFineTimer = 0;
    state.heat = 0;
    AudioKit.update(0, false, false);
    hideAllOverlays();
    dom.startScreen.classList.remove("is-hidden");
    dom.hud.classList.add("is-hidden");
    dom.touchControls.classList.remove("show");
    setBoostActive(false);
    dom.boostFlash.classList.remove("on");
    dom.combo.classList.add("is-hidden");
    state.playerZ = START_Z + 500;
    state.playerX = -0.18;
    state.playerVX = 0;
    state.speed = 2300;
    state.traffic = [];
    state.particles = [];
    state.popups = [];
    for (let i = 0; i < 8; i++) spawnTraffic(state.playerZ + 9000 + i * 4300);
    applyRouteToUI(activeRoute);
    const road = sampleRoad(state.playerZ);
    cam.x = road.x + state.playerX * ROAD_HALF;
    cam.y = road.y + CAM_HEIGHT;
    cam.z = state.playerZ - CAM_BACK;
    loadBest();
    updateWalletUI();
  }

  function hideAllOverlays() {
    dom.checkpointScreen.classList.add("is-hidden");
    dom.pauseScreen.classList.add("is-hidden");
    dom.resultScreen.classList.add("is-hidden");
    if (dom.routeScreen) dom.routeScreen.classList.add("is-hidden");
    if (dom.garageScreen) dom.garageScreen.classList.add("is-hidden");
    if (dom.routeCurrentBtn) dom.routeCurrentBtn.setAttribute("aria-expanded", "false");
  }

  function pauseGame() {
    if (state.mode !== "playing") return;
    state.mode = "paused";
    AudioKit.stopVoice();
    AudioKit.stopSiren();
    dom.pauseScreen.classList.remove("is-hidden");
    dom.touchControls.classList.remove("show");
    setBoostActive(false);
    input.boost = false;
    AudioKit.update(0, false, false);
  }

  function resumeGame() {
    if (state.mode !== "paused") return;
    state.mode = "playing";
    dom.pauseScreen.classList.add("is-hidden");
    if (state.policeChase) AudioKit.startSiren();
    if (document.body.classList.contains("touch")) dom.touchControls.classList.add("show");
  }

  function reachCheckpoint(cp) {
    state.mode = "checkpoint";
    AudioKit.stopVoice();
    if (state.policeChase) endPoliceChase(false);
    state.timeLeft += cp.bonus;
    state.damage = Math.min(100, state.damage + cp.repair);
    state.score += cp.fare;
    state.boost = Math.min(1, state.boost + 0.6);
    state.checkpointTimer = 3.4;
    state.combo = 1;
    state.comboTimer = 0;
    state.pendingAlight = 2 + Math.floor(Math.random() * 3);
    state.alighting = [];
    state.speed = Math.min(state.speed, 6200);
    dom.cpChinese.textContent = cp.cn;
    dom.cpEnglish.textContent = cp.en;
    dom.cpTime.textContent = "+" + cp.bonus + "s";
    dom.cpRepair.textContent = "+" + cp.repair + "%";
    dom.cpScore.textContent = fmtMoney(state.score);
    dom.cpLine.textContent = cp.line;
    dom.checkpointScreen.classList.remove("is-hidden");
    dom.touchControls.classList.remove("show");
    setBoostActive(false);
    input.boost = false;
    AudioKit.update(0, false, false);
    AudioKit.checkpoint();
    spawnBurst(W / 2, H * 0.44, 28, "#ffc857");
  }

  function finishRun(success, reason) {
    if (state.mode === "finished" || state.mode === "failed") return;
    state.mode = success ? "finished" : "failed";
    state.failReason = reason || "";
    AudioKit.stopVoice();
    AudioKit.stopSiren();
    state.policeChase = false;
    state.policeFines = 0;
    state.policeFineTimer = 0;
    state.speed = 0;
    state.boostActive = false;
    setBoostActive(false);
    input.gas = input.brake = input.boost = false;
    dom.touchControls.classList.remove("show");
    AudioKit.update(0, false, false);

    let timeBonus = 0;
    const sc = activeRoute.scoring;
    if (success) {
      timeBonus = Math.max(0, Math.floor(state.timeLeft)) * sc.time;
      const condition = Math.floor(state.damage) * sc.condition;
      state.score += timeBonus + condition;
      state.score += sc.finish;
      AudioKit.finish();
    } else {
      AudioKit.fail();
    }

    const multiplier = state.stats.earnings || 1;
    state.earned = Math.floor(state.score * (success ? 0.7 : 0.18) * multiplier);
    profile.wallet += state.earned;
    saveProfile();
    updateWalletUI();
    if (dom.resultEarned) {
      dom.resultEarned.textContent =
        "車費入賬 +" + fmtMoney(state.earned) +
        (multiplier > 1.001 ? " · 車房加成 ×" + multiplier.toFixed(2) : "");
    }

    const newBest = success ? saveBest() : false;
    dom.hud.classList.add("is-hidden");
    dom.combo.classList.add("is-hidden");
    dom.checkpointScreen.classList.add("is-hidden");
    dom.pauseScreen.classList.add("is-hidden");
    dom.resultScreen.classList.remove("is-hidden");
    dom.resultScore.textContent = fmtMoney(state.score);
    dom.resultNear.textContent = String(state.nearMisses);
    dom.resultSpeed.textContent = Math.round(state.topSpeed) + " km/h";
    dom.resultTime.textContent = success ? fmtTime(state.timeLeft) : "0:00";
    dom.newBest.classList.toggle("is-hidden", !newBest);

    const routeName = activeRoute.originCn + " → " + activeRoute.destCn;
    let rank = "C";
    let title = "埋站。";
    let line = activeRoute.result.winS;
    let kicker = "ROUTE COMPLETE · " + routeName;

    if (!success) {
      rank = "D";
      kicker = "SHIFT OVER · " + routeName;
      if (reason === "time") {
        title = "夠鐘。";
        line = activeRoute.result.failTime;
      } else if (reason === "wreck") {
        title = "炒散咗。";
        line = activeRoute.result.failWreck;
      } else {
        title = "收工。";
        line = activeRoute.result.failOther;
      }
    } else {
      if (state.score >= sc.rankS && state.damage > 46) {
        rank = "S";
        line = activeRoute.result.winS;
      } else if (state.score >= sc.rankA) {
        rank = "A";
        line = activeRoute.result.winA;
      } else if (state.score >= sc.rankB) {
        rank = "B";
        line = activeRoute.result.winB;
      } else {
        rank = "C";
        line = activeRoute.result.winC;
      }
    }

    dom.rank.textContent = rank;
    dom.rank.style.color = rank === "S" ? "#ffd166" : rank === "A" ? "#72f6ff" : rank === "D" ? "#ff3b50" : "#f5efdf";
    dom.resultTitle.textContent = title;
    dom.resultLine.textContent = line;
    dom.resultKicker.textContent = kicker;
    dom.resultFoot.textContent = "HK RED VAN DAREDEVIL · " + routeName;
  }

  /* -----------------------------------------------------------------------
     Toast / popups / particles
     ----------------------------------------------------------------------- */
  function showToast(html, ms = 1600) {
    if (!dom.toast) return;
    dom.toast.innerHTML = html;
    dom.toast.classList.add("show");
    clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => {
      dom.toast.classList.remove("show");
    }, ms);
  }

  function spawnBurst(x, y, count, color, type = "spark") {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const sp = 40 + Math.random() * 280;
      state.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40,
        life: 0.35 + Math.random() * 0.6,
        max: 0.95,
        size: 1.5 + Math.random() * 3.6,
        color,
        type,
        drag: 0.94,
      });
    }
  }

  function spawnPop(x, y, text, color = "#ffd166") {
    state.popups.push({ x, y, text, color, life: 1.1, max: 1.1 });
  }

  function spawnSpeedLines() {
    state.speedLines = [];
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * TAU;
      state.speedLines.push({
        a,
        r: 0.12 + Math.random() * 0.6,
        len: 0.03 + Math.random() * 0.14,
        w: 0.4 + Math.random() * 1.4,
      });
    }
  }

  /* -----------------------------------------------------------------------
     Gameplay update
     ----------------------------------------------------------------------- */
  function updateSpeedWarnings() {
    const kmh = speedToKmh(state.speed);
    if (kmh < 98) state.warn100Armed = true;
    if (kmh < 78) state.warn80Armed = true;
    if (kmh >= 100 && state.warn100Armed) {
      state.warn100Armed = false;
      state.warn80Armed = false;
      AudioKit.speedWarning(4);
    } else if (kmh >= 80 && state.warn80Armed) {
      state.warn80Armed = false;
      AudioKit.speedWarning(2);
    }
  }

  function addHeat(amount) {
    state.heat = clamp(state.heat + amount, 0, 100);
    if (!state.policeChase && state.heat >= 100) startPoliceChase();
  }

  function startPoliceChase() {
    if (state.policeChase) return;
    state.policeChase = true;
    state.policeChaseTimer = 0;
    state.policeSpawnTimer = 1.5;
    state.policeFines = 0;
    state.policeFineTimer = 0;
    state.heat = 100;
    AudioKit.startSiren();
    showToast("<b>通緝！</b> 警車追緊你，超速 120 會扣錢！", 2400);
    spawnPoliceCar(11500);
    spawnPoliceCar(16000);
  }

  function endPoliceChase(evaded) {
    if (!state.policeChase) return;
    state.policeChase = false;
    state.policeChaseTimer = 0;
    AudioKit.stopSiren();
    for (let i = state.traffic.length - 1; i >= 0; i--) {
      if (state.traffic[i].def.police) state.traffic.splice(i, 1);
    }
    if (evaded) {
      state.heat = 28;
      const fineLine = state.policeFines > 0 ? ` · 罰款 ${fmtMoney(state.policeFines)}` : "";
      showToast("<b>甩咗警車</b> · 市民表示欽佩。" + fineLine, 1900);
    } else {
      state.heat = 0;
    }
    state.policeFines = 0;
    state.policeFineTimer = 0;
  }

  function spawnPoliceCar(offset = 14000) {
    let existing = 0;
    for (const c of state.traffic) {
      if (c.def.police && c.z > state.playerZ) existing++;
    }
    if (existing >= 3) return;
    const z = state.playerZ + offset + Math.random() * 7000;
    spawnTraffic(z, LANES[Math.floor(Math.random() * LANES.length)], "police");
    const car = state.traffic[state.traffic.length - 1];
    if (car && car.def.police) {
      car.speed = 5000 + Math.random() * 800;
      car.laneTimer = 1.5;
    }
  }

  function policeCarVisible() {
    for (const car of state.traffic) {
      if (!car.def.police) continue;
      const dz = car.z - cam.z;
      if (dz < 120 || dz > drawDist * SEG_LEN + 3000) continue;
      const road = sampleRoad(car.z);
      const p = project(road.x + car.lane * ROAD_HALF, road.y, car.z);
      if (!p) continue;
      if (p.x > -W * 0.15 && p.x < W * 1.15 && p.y > -H * 0.15 && p.y < H * 1.05) {
        return true;
      }
    }
    return false;
  }

  function updatePoliceAndHeat(dt) {
    if (!state.policeChase) {
      const kmh = speedToKmh(state.speed);
      if (kmh > 108) state.heat += (kmh - 108) * 0.22 * dt;
      else if (kmh < 75) state.heat -= dt * 1.9;
      state.heat = clamp(state.heat, 0, 100);
      if (state.heat >= 100) startPoliceChase();
    } else {
      state.policeChaseTimer += dt;
      state.policeSpawnTimer -= dt;
      state.heat = Math.min(100, state.heat + dt * 1.5);
      const kmh = speedToKmh(state.speed);
      if (kmh >= 120 && policeCarVisible()) {
        state.policeFineTimer -= dt;
        if (state.policeFineTimer <= 0) {
          state.policeFineTimer = 1;
          const amount = 250;
          const fromWallet = Math.min(amount, profile.wallet);
          profile.wallet -= fromWallet;
          const fromFare = Math.min(amount - fromWallet, state.score);
          state.score = Math.max(0, state.score - fromFare);
          const paid = fromWallet + fromFare;
          if (paid > 0) {
            state.policeFines += paid;
            saveProfile();
            updateWalletUI();
            AudioKit.fine();
            spawnPop(W * 0.82, H * 0.24, `超速罰款 -${fmtMoney(paid)}`, "#ff8a5c");
          }
        }
      } else {
        state.policeFineTimer = 0;
      }
      if (state.policeSpawnTimer <= 0) {
        spawnPoliceCar(13000);
        state.policeSpawnTimer = 5.5 + Math.random() * 2.5;
      }
      if (state.policeChaseTimer > 23) endPoliceChase(true);
    }
  }

  function updateCameras(prevZ) {
    if (!route.cameras) return;
    for (const cam of route.cameras) {
      if (cam.triggered) continue;
      if (prevZ < cam.z && state.playerZ >= cam.z) {
        cam.triggered = true;
        if (speedToKmh(state.speed) > cam.limit + 3) {
          state.cameraFlash = 1;
          state.shake = Math.max(state.shake, 9);
          addHeat(24);
          state.score = Math.max(0, state.score - 800);
          const fine = Math.min(800, profile.wallet);
          profile.wallet -= fine;
          saveProfile();
          updateWalletUI();
          AudioKit.camera();
          showToast("<b>影快相！</b> 罰款 $800 · 通緝 +24%", 1800);
        }
      }
    }
  }

  function passengerReaction(type) {
    if (type === "fast") {
      AudioKit.scream(1);
      AudioKit.speak("嘩！慢啲啦！", 1.18, 1.04);
      showToast("<b>乘客：</b>嘩！慢啲啦！", 1500);
    } else if (type === "mad") {
      AudioKit.angry();
      AudioKit.speak("喂！開快啲啦！", 0.9, 1.02);
      showToast("<b>乘客：</b>喂！開快啲啦！", 1500);
    } else if (type === "laugh") {
      AudioKit.laugh();
      AudioKit.speak("哈哈，龜速呀？", 1.12, 0.96);
      showToast("<b>乘客：</b>哈哈，龜速呀？", 1600);
    }
  }

  function updatePassengerMood(dt) {
    state.screamCooldown = Math.max(0, state.screamCooldown - dt);
    state.moodCooldown = Math.max(0, state.moodCooldown - dt);
    const kmh = speedToKmh(state.speed);

    if (kmh < 105) state.fastScreamArmed = true;
    if (kmh >= 118 && state.fastScreamArmed && state.screamCooldown <= 0) {
      state.fastScreamArmed = false;
      state.screamCooldown = 12;
      passengerReaction("fast");
    }

    if (kmh < 24) state.slowTimer += dt;
    else state.slowTimer = Math.max(0, state.slowTimer - dt * 2.4);

    if (state.slowTimer > 4.5 && state.moodCooldown <= 0) {
      state.slowTimer = 0;
      state.moodCooldown = 14;
      passengerReaction(Math.random() < 0.5 ? "mad" : "laugh");
    }
  }

  function updateGame(dt) {
    state.time += dt;
    state.honkCooldown = Math.max(0, state.honkCooldown - dt);
    state.crashCooldown = Math.max(0, state.crashCooldown - dt);
    state.barrierCooldown = Math.max(0, state.barrierCooldown - dt);
    state.comboTimer = Math.max(0, state.comboTimer - dt);
    if (state.comboTimer <= 0 && state.combo > 1) {
      state.combo = 1;
      dom.combo.classList.add("is-hidden");
    }

    updateTraffic(dt, false);
    updateTrafficSpawns(dt);
    updatePedestrians(dt);
    updateAlighting(dt);

    const stats = state.stats;
    const maxSpeed = MAX_SPEED * stats.speed;
    const boostSpeed = BOOST_SPEED * (1 + (stats.speed - 1) * 0.45 + (stats.boost - 1) * 0.3);
    const speedRatio = clamp(state.speed / maxSpeed, 0, 1.25);
    const canBoost = input.boost && state.boost > 0.015 && state.speed > 500;
    setBoostActive(canBoost);

    if (canBoost) {
      state.boost = Math.max(0, state.boost - (dt * 0.28) / stats.boost);
      state.speed += 2600 * dt;
      state.timeLeft += dt * 0.02;
    }

    // throttle / brake
    if (input.gas) {
      const ceiling = canBoost ? boostSpeed : maxSpeed;
      state.speed += (1600 + 900 * (1 - speedRatio)) * stats.speed * dt;
      state.speed = Math.min(state.speed, ceiling);
    } else if (input.brake) {
      state.speed -= 4200 * stats.brake * dt;
    } else {
      state.speed -= 620 * dt;
    }

    if (!canBoost && state.speed > maxSpeed) {
      state.speed -= 1700 * dt;
    }
    state.speed = clamp(state.speed, 0, boostSpeed);

    // steering
    const steerInput = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const steerPower = (0.96 + speedRatio * 0.52) * stats.grip;
    const targetVX = steerInput * steerPower;
    state.playerVX += (targetVX - state.playerVX) * Math.min(1, dt * 8.5);

    const road = sampleRoad(state.playerZ);
    const centrifugal = -road.curve * Math.pow(clamp(state.speed / maxSpeed, 0, 1.2), 1.7) * 0.55 / stats.grip;
    state.playerX += (state.playerVX + centrifugal) * dt;

    const offroad = Math.abs(state.playerX) > 0.93;
    if (offroad) {
      state.speed = Math.min(state.speed, 2900);
      state.damage = Math.max(0, state.damage - dt * 4.2);
      state.shake = Math.max(state.shake, 2.2);
      state.offroadCooldown -= dt;
      if (Math.random() < dt * 30) {
        state.particles.push({
          x: W / 2 + (state.playerX > 0 ? 90 : -90),
          y: H - 80,
          vx: (Math.random() - 0.5) * 160 - state.playerX * 40,
          vy: -40 - Math.random() * 120,
          life: 0.5,
          max: 0.5,
          size: 6 + Math.random() * 16,
          color: "rgba(190,176,145,.22)",
          type: "dust",
          drag: 0.96,
        });
      }
      if (state.offroadCooldown <= 0) {
        state.offroadCooldown = 4.5;
        showToast("行人路唔係賽道。<b>返回路面</b>", 1400);
      }
      if (state.playerX > 1.13 || state.playerX < -1.13) {
        state.playerX = clamp(state.playerX, -1.13, 1.13);
        state.playerVX *= -0.28;
        state.speed *= 0.9;
        if (state.barrierCooldown <= 0) {
          state.barrierCooldown = 0.75;
          state.damage = Math.max(0, state.damage - 6);
          state.speed *= 0.78;
          state.shake = 12;
          spawnBurst(W / 2, H - 120, 12, "#ffb257");
          spawnPop(W / 2, H * 0.64, "撞欄！ -6%", "#ffb257");
        }
      }
    }
    state.playerX = clamp(state.playerX, -1.14, 1.14);
    updateSpeedWarnings();
    updatePassengerMood(dt);

    // move — the meter runs on distance, near misses and nerve
    const prevZ = state.playerZ;
    state.playerZ += state.speed * dt;
    state.score += state.speed * dt * 0.05;
    updateCameras(prevZ);
    updatePoliceAndHeat(dt);
    state.topSpeed = Math.max(state.topSpeed, speedToKmh(state.speed));
    state.timeLeft -= dt;

    // camera
    const newRoad = sampleRoad(state.playerZ);
    const targetX = newRoad.x + state.playerX * ROAD_HALF * 0.88;
    const targetY = newRoad.y + CAM_HEIGHT;
    const follow = Math.min(1, dt * 9);
    cam.x += (targetX - cam.x) * follow;
    cam.y += (targetY - cam.y) * Math.min(1, dt * 7);
    cam.z = state.playerZ - CAM_BACK;

    // particles / popups
    updateParticles(dt);

    state.shake *= Math.pow(0.0025, dt);
    state.redFlash *= Math.pow(0.0009, dt);
    state.cameraFlash *= Math.pow(0.0002, dt);

    // checkpoints
    const nextCheckpoint = activeRoute.checkpoints[state.stage];
    if (nextCheckpoint && state.playerZ >= nextCheckpoint.seg * SEG_LEN) {
      state.stage += 1;
      reachCheckpoint(nextCheckpoint);
    } else if (!nextCheckpoint && state.playerZ >= route.finishZ) {
      state.stage = activeRoute.stageNames.length - 1;
      finishRun(true);
      return;
    }

    if (state.damage <= 0) {
      finishRun(false, "wreck");
      return;
    }
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      finishRun(false, "time");
      return;
    }

    updateHUD();
    AudioKit.update(clamp(state.speed / MAX_SPEED, 0, 1.2), canBoost, true);
  }

  function updateMenu(dt) {
    state.time += dt;
    state.speed = 2350;
    state.playerZ += state.speed * dt;
    if (state.playerZ > route.totalZ - 8000) state.playerZ = START_Z + 3000;
    state.playerX = Math.sin(state.time * 0.24) * 0.22;
    state.playerVX = Math.cos(state.time * 0.24) * 0.06;

    const road = sampleRoad(state.playerZ);
    cam.x += (road.x + state.playerX * ROAD_HALF * 0.88 - cam.x) * Math.min(1, dt * 8);
    cam.y += (road.y + CAM_HEIGHT - cam.y) * Math.min(1, dt * 6);
    cam.z = state.playerZ - CAM_BACK;
    updateTraffic(dt, true);
    if (state.traffic.length < 8 && Math.random() < dt * 0.4) {
      spawnTraffic(state.playerZ + 38000 + Math.random() * 20000);
    }
    updateParticles(dt);
    state.shake *= Math.pow(0.002, dt);
    AudioKit.update(0.3, false, false);
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + (p.type === "dust" ? -20 : 110) * dt;
    }
    for (let i = state.popups.length - 1; i >= 0; i--) {
      const p = state.popups[i];
      p.life -= dt;
      p.y -= 55 * dt;
      if (p.life <= 0) state.popups.splice(i, 1);
    }
    // exhaust / boost particles
    if (state.mode === "playing" && state.speed > 100) {
      const rate = state.boostActive ? 55 : state.speed < 2500 ? 22 : 8;
      if (Math.random() < dt * rate) {
        const left = Math.random() < 0.5;
        state.particles.push({
          x: W / 2 + (left ? -58 : 58) + (Math.random() - 0.5) * 20,
          y: H - 52,
          vx: (Math.random() - 0.5) * 30,
          vy: 20 + Math.random() * 40,
          life: 0.3 + Math.random() * 0.35,
          max: 0.65,
          size: state.boostActive ? 8 + Math.random() * 15 : 3 + Math.random() * 6,
          color: state.boostActive ? (Math.random() < 0.5 ? "#ff6a3d" : "#ffd166") : "rgba(160,160,170,.18)",
          type: state.boostActive ? "flame" : "smoke",
          drag: 0.9,
        });
      }
    }
  }

  function updateTraffic(dt, ambient) {
    for (let i = state.traffic.length - 1; i >= 0; i--) {
      const c = state.traffic[i];
      c.z += c.speed * dt;
      c.sway += dt;
      c.hitCooldown = Math.max(0, c.hitCooldown - dt);
      if (c.def.bike) {
        c.lane = c.baseLane + Math.sin(c.sway * 2.4) * 0.045;
      }
      if (c.def.racer) {
        c.laneTimer -= dt;
        if (c.laneTimer <= 0 && c.z > state.playerZ + 4500) {
          const options = LANES.filter((l) => Math.abs(l - c.lane) > 0.35);
          c.targetLane = options[Math.floor(Math.random() * options.length)];
          c.laneTimer = 3 + Math.random() * 3.6;
        }
        c.lane += (c.targetLane - c.lane) * Math.min(1, dt * 0.8);
      } else if (c.honk > 0) {
        c.honk = Math.max(0, c.honk - dt);
        c.lane += Math.sign(c.baseLane - c.lane) * dt * 0.22;
      }
      if (c.z < cam.z - 1200 || c.z > state.playerZ + 70000 || c.z > route.totalZ + 10000) {
        state.traffic.splice(i, 1);
        continue;
      }
      if (ambient) continue;

      const dz = c.z - state.playerZ;
      const dx = state.playerX - c.lane;
      const collideDist = 155;
      const lateral = c.def.half + 0.105;
      if (
        dz > -95 && dz < collideDist && Math.abs(dx) < lateral &&
        c.hitCooldown <= 0 && state.crashCooldown <= 0 && state.speed > 300
      ) {
        crashInto(c, dx);
      } else if (!c.passed && !c.hit && dz < -60 && state.speed > 2400) {
        c.passed = true;
        if (Math.abs(dx) < 0.42 && Math.abs(dx) > lateral - 0.035) {
          nearMiss(c, dx);
        }
      }
    }
  }

  function spawnPedestrianGroup() {
    if (!route.crossings || !route.crossings.length) return false;
    const candidates = route.crossings
      .filter((crossing) => !crossing.spawned &&
        crossing.z > state.playerZ + 7000 &&
        crossing.z < state.playerZ + 34000)
      .sort((a, b) => a.z - b.z);
    if (!candidates.length) return false;
    const crossing = candidates[0];
    crossing.spawned = true;
    crossing.active = true;
    crossing.phase = 0;
    crossing.timer = 0;
    crossing.notified = false;
    crossing.lights.forEach((light) => { light.variant = 0; });

    const count = 1 + Math.floor(Math.random() * 3);
    const groupSide = Math.random() < 0.5 ? -1 : 1;
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? groupSide : -groupSide;
      state.pedestrians.push({
        z: crossing.z + (i - (count - 1) / 2) * 65 + Math.random() * 20,
        x: side * (1.15 + Math.random() * 0.07),
        dir: -side,
        speed: 0.38 + Math.random() * 0.16,
        phase: Math.random() * TAU,
        style: Math.floor(Math.random() * 3),
        waiting: true,
        crossing,
        hit: false,
      });
    }
    return true;
  }

  function updateCrossings(dt) {
    if (!route.crossings) return;
    for (const crossing of route.crossings) {
      const dz = crossing.z - state.playerZ;
      if (dz < -2200) crossing.active = false;
      if (dz > -1200 && dz < 50000) crossing.active = true;
      if (!crossing.active) continue;
      crossing.timer += dt;
      const limit = crossing.phase === 0 ? 3.0 : crossing.phase === 1 ? 1.0 : crossing.phase === 2 ? 6.0 : 2.0;
      if (crossing.timer >= limit) {
        crossing.timer = 0;
        crossing.phase = (crossing.phase + 1) % 4;
        if (crossing.phase === 2 && dz > -800 && dz < 28000 && !crossing.notified) {
          crossing.notified = true;
          showToast("<b>行人綠燈</b> · 有街坊過馬路，收油。", 1500);
        }
      }
      const variant = crossing.phase === 0 ? 0 : crossing.phase === 1 ? 1 : crossing.phase === 2 ? 2 : 3;
      crossing.lights.forEach((light) => { light.variant = variant; });
    }
  }

  function updatePedestrians(dt) {
    state.pedestrianTimer -= dt;
    if (state.pedestrianTimer <= 0) {
      const spawned = spawnPedestrianGroup();
      state.pedestrianTimer = spawned ? 7.5 + Math.random() * 6 : 2;
    }
    updateCrossings(dt);

    for (let i = state.pedestrians.length - 1; i >= 0; i--) {
      const p = state.pedestrians[i];
      if (p.waiting && p.crossing && p.crossing.phase === 2) {
        p.waiting = false;
      }
      if (p.waiting) {
        p.phase += dt * 2;
      } else {
        p.x += p.dir * p.speed * dt;
        p.phase += dt * (6 + p.speed * 12);
      }
      const dz = p.z - state.playerZ;
      if (
        dz > -300 && dz < 300 && !p.hit && state.crashCooldown <= 0 &&
        Math.abs(p.x - state.playerX) < 0.13
      ) {
        p.hit = true;
        state.crashCooldown = 0.9;
        state.damage = Math.max(0, state.damage - 10);
        state.speed *= 0.55;
        state.timeLeft = Math.max(0, state.timeLeft - 1.2);
        state.shake = Math.max(state.shake, 14);
        state.redFlash = 0.65;
        addHeat(16);
        state.combo = 1;
        state.comboTimer = 0;
        dom.combo.classList.add("is-hidden");
        state.screamCooldown = Math.max(state.screamCooldown, 4);
        AudioKit.scream(2);
        AudioKit.speak("小心呀！", 1.22, 1.08);
        showToast("<b>撞到街坊！</b> 車況 -10% · 時間 -1.2s", 1600);
        spawnBurst(W / 2 + (p.x > state.playerX ? 80 : -80), H - 150, 18, "#ffd166");
        state.pedestrians.splice(i, 1);
        continue;
      }
      if (dz < -600 || Math.abs(p.x) > 1.35 || dz > 60000) {
        state.pedestrians.splice(i, 1);
      }
    }
  }

  function alightPassengers(count) {
    const n = Math.max(1, Math.min(4, count));
    for (let i = 0; i < n; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      state.alighting.push({
        t: -i * 0.18,
        dur: 1.8,
        startX: W / 2 + side * W * 0.095,
        targetX: W / 2 + side * (W * 0.28 + (i % 2) * W * 0.035),
        y: H - H * 0.04,
        style: Math.floor(Math.random() * 3),
      });
    }
    AudioKit.doorHiss();
    setTimeout(() => {
      if (state.mode === "playing") AudioKit.speak("唔該，有落！", 1.02, 1.04);
    }, 180);
    showToast(`<b>${n} 位乘客落車</b> · 繼續踩！`, 1900);
  }

  function updateAlighting(dt) {
    for (let i = state.alighting.length - 1; i >= 0; i--) {
      const a = state.alighting[i];
      a.t += dt;
      if (a.t > a.dur) state.alighting.splice(i, 1);
    }
  }

  function updateTrafficSpawns(dt) {
    const cfg = activeRoute.traffic;
    const trafficMul = state.stats.traffic || 1;
    const maxAhead = Math.round(cfg.maxAhead * trafficMul);
    state.spawnTimer -= dt;
    let ahead = 0;
    for (const c of state.traffic) if (c.z > state.playerZ) ahead++;
    if (state.spawnTimer <= 0 && ahead < maxAhead) {
      const interval =
        (cfg.spawnInterval[0] + Math.random() * (cfg.spawnInterval[1] - cfg.spawnInterval[0])) / trafficMul;
      state.spawnTimer = interval;
      const z = state.playerZ + cfg.spawnAhead[0] + Math.random() * (cfg.spawnAhead[1] - cfg.spawnAhead[0]);
      if (z < route.finishZ + 5000) spawnTraffic(z);
    }
  }

  function crashInto(car, dx) {
    const premium = !!car.def.premium;
    const police = !!car.def.police;
    const damage = (16 + Math.random() * 5) * (police ? 1.7 : premium ? 1.38 : 1);
    const timeLoss = police ? 4.6 : premium ? 3.4 : 2.6;
    car.hitCooldown = 3;
    car.hit = true;
    car.passed = true;
    car.z = state.playerZ + 330;
    state.crashCooldown = 1.35;
    state.speed = Math.min(state.speed, car.speed * 0.42);
    state.damage = Math.max(0, state.damage - damage);
    state.timeLeft = Math.max(0, state.timeLeft - timeLoss);
    addHeat(10);
    state.combo = 1;
    state.comboTimer = 0;
    state.shake = 18;
    state.redFlash = 1;
    dom.combo.classList.add("is-hidden");
    spawnBurst(W / 2 + (dx > 0 ? 150 : -150), H - 170, 34, "#ff7a45");
    spawnBurst(W / 2, H - 190, 18, "#ffd166");
    spawnPop(W / 2, H * 0.58, (premium ? "炒名車！ -" : "炒車！ -") + Math.round(damage) + "%", "#ff4055");
    showToast(
      police
        ? "<b>撞警車！</b> 今次真係大件事 · 時間 -4.6s"
        : premium
          ? "<b>炒咗名車！</b> 賠到破產 · 時間 -3.4s"
          : "<b>炒車！</b> 車況 -17% · 時間 -2.6s",
      1600
    );
    AudioKit.crash();
    state.screamCooldown = Math.max(state.screamCooldown, 4);
    AudioKit.scream(2);
    AudioKit.speak("哎呀！", 1.32, 1.1);
    if (state.damage <= 0) {
      setTimeout(() => { if (state.mode === "playing") finishRun(false, "wreck"); }, 260);
    }
  }

  function nearMiss(car, dx) {
    const premium = !!car.def.premium;
    const police = !!car.def.police;
    const bike = !!car.def.bike;
    state.combo = Math.min(9, state.combo + 1);
    state.comboTimer = 2.8;
    const points = Math.round(340 * state.combo * (premium ? 1.45 : police ? 1.7 : bike ? 1.2 : 1));
    state.score += points;
    state.boost = Math.min(1, state.boost + 0.155 * state.stats.boost);
    state.timeLeft += 0.22;
    state.nearMisses++;
    state.shake = Math.max(state.shake, 4);
    if (police) state.heat = Math.max(0, state.heat - 14);
    dom.combo.classList.remove("is-hidden");
    dom.comboMult.textContent = "×" + state.combo;
    spawnPop(
      W / 2 + (dx < 0 ? -W * 0.19 : W * 0.19),
      H * 0.6,
      "+" + points + (police ? "  甩警" : bike ? "  單車擦身" : premium ? "  名車擦身" : "  擦身而過"),
      police ? "#7db9ff" : premium ? "#72f6ff" : "#ffd166"
    );
    spawnBurst(W / 2 + (dx < 0 ? 170 : -170), H - 150, 8, police ? "#7db9ff" : premium ? "#72f6ff" : "#ffd166");
    if (bike) AudioKit.bikeBell();
    AudioKit.near();
    if (police) showToast("<b>甩開警車</b> · 你嘅車牌應該冇人見到。", 1200);
    if (state.combo === 3 || state.combo === 5 || state.combo === 7 || state.combo === 9) {
      showToast(`<b>×${state.combo} 連擊</b> · 癲佬，繼續踩！`, 1250);
    }
  }

  function horn() {
    if (state.mode !== "playing" || state.honkCooldown > 0) return;
    state.honkCooldown = 1.1;
    AudioKit.horn();
    state.shake = Math.max(state.shake, 1.5);
    showToast("咇咇！<b>前面借借</b>", 700);
    for (const c of state.traffic) {
      if (c.z > state.playerZ && c.z < state.playerZ + 11000 && Math.abs(c.lane - state.playerX) < 0.5) {
        c.honk = 0.9;
        if (c.def.racer) c.targetLane = c.lane + (c.lane >= 0 ? 0.12 : -0.12);
        else c.baseLane = c.lane + (c.lane >= 0 ? 0.12 : -0.12);
      }
    }
    for (const p of state.pedestrians) {
      if (p.z > state.playerZ && p.z < state.playerZ + 10000) {
        p.speed *= 2.4;
        p.dir = p.x >= 0 ? 1 : -1;
      }
    }
  }

