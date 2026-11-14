/* =========================================================================
   main.js — Main loop, UI bindings and application boot.
   Red Van Daredevil · classic scripts, shared global lexical scope
   ========================================================================= */
"use strict";

  /* -----------------------------------------------------------------------
     Main loop
     ----------------------------------------------------------------------- */
  let lastTime = performance.now();

  function loop(now) {
    const dt = Math.min(0.045, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    if (state.mode === "menu") updateMenu(dt);
    else if (state.mode === "playing") updateGame(dt);
    else if (state.mode === "checkpoint") {
      state.checkpointTimer -= dt;
      state.shake *= Math.pow(0.002, dt);
      updateParticles(dt);
      if (state.checkpointTimer <= 0) {
        dom.checkpointScreen.classList.add("is-hidden");
        state.mode = "playing";
        if (document.body.classList.contains("touch")) dom.touchControls.classList.add("show");
        if (state.pendingAlight > 0) {
          const n = state.pendingAlight;
          state.pendingAlight = 0;
          alightPassengers(n);
        } else {
          showToast("<b>繼續踩</b> · 仲有排先到" + activeRoute.destCn + "。", 1600);
        }
      }
    } else if (state.mode === "paused") {
      updateParticles(dt * 0.2);
    }

    render(now / 1000);
    requestAnimationFrame(loop);
  }

  /* -----------------------------------------------------------------------
     Buttons / boot
     ----------------------------------------------------------------------- */
  function bindUI() {
    document.getElementById("startBtn").addEventListener("click", () => {
      startGame();
    });
    document.getElementById("soundBtn").addEventListener("click", toggleSound);
    document.getElementById("resumeBtn").addEventListener("click", resumeGame);
    document.getElementById("pauseTouch").addEventListener("click", () => {
      if (state.mode === "playing") pauseGame();
    });
    document.getElementById("quitBtn").addEventListener("click", showMenu);
    document.getElementById("restartBtn").addEventListener("click", startGame);
    document.getElementById("menuBtn").addEventListener("click", showMenu);
    if (dom.routeCurrentBtn) dom.routeCurrentBtn.addEventListener("click", openRouteScreen);
    if (dom.closeRoutesBtn) dom.closeRoutesBtn.addEventListener("click", closeRouteScreen);
    if (dom.routeGrid) {
      dom.routeGrid.addEventListener("click", (e) => {
        const card = e.target.closest(".route-card");
        if (card) selectRoute(card.dataset.route);
      });
    }
    if (dom.routeScreen) {
      dom.routeScreen.addEventListener("click", (e) => {
        if (e.target === dom.routeScreen) closeRouteScreen();
      });
    }
    if (dom.garageBtn) dom.garageBtn.addEventListener("click", openGarage);
    if (dom.closeGarageBtn) dom.closeGarageBtn.addEventListener("click", closeGarage);
    if (dom.garageScreen) {
      dom.garageScreen.addEventListener("click", (e) => {
        if (e.target === dom.garageScreen) closeGarage();
      });
    }
    document.querySelectorAll(".garage-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        garageTab = tab.dataset.garageTab;
        renderGarage();
      });
    });
    if (dom.garageContent) {
      dom.garageContent.addEventListener("click", (e) => {
        const item = e.target.closest(".garage-item");
        if (!item) return;
        const action = item.dataset.action;
        const key = item.dataset.key;
        if (action === "part") buyPart(key);
        else if (action === "bus") selectBus(key);
        else if (action === "map") selectMap(key);
      });
    }
    window.addEventListener("pointerdown", () => {
      if (!AudioKit.ctx) AudioKit.init();
    }, { once: true });
  }

  function boot() {
    resize();
    buildSprites();
    buildBackground();
    buildRoute(activeRoute);
    spawnSpeedLines();
    bindUI();
    bindTouch();
    loadProfile();
    loadBest();
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
      document.body.classList.add("touch");
    }
    updateSoundButton(false);
    showMenu();
    requestAnimationFrame(loop);
  }

  boot();
