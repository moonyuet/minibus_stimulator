/* =========================================================================
   hud.js — HUD DOM updates and speedometer tick construction.
   Red Van Daredevil · classic scripts, shared global lexical scope
   ========================================================================= */
"use strict";

  /* -----------------------------------------------------------------------
     HUD
     ----------------------------------------------------------------------- */
  function buildTicks() {
    const g = document.getElementById("speedTicks");
    if (!g) return;
    g.innerHTML = "";
    for (let i = 0; i <= 8; i++) {
      const ang = (Math.PI * (i / 8)) + Math.PI;
      const x1 = 110 + Math.cos(ang) * 74;
      const y1 = 116 + Math.sin(ang) * 74;
      const x2 = 110 + Math.cos(ang) * (i % 2 === 0 ? 62 : 67);
      const y2 = 116 + Math.sin(ang) * (i % 2 === 0 ? 62 : 67);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1.toFixed(1));
      line.setAttribute("y1", y1.toFixed(1));
      line.setAttribute("x2", x2.toFixed(1));
      line.setAttribute("y2", y2.toFixed(1));
      g.appendChild(line);
    }
  }

  const hudCache = {
    timer: "",
    danger: null,
    best: "",
    damagePct: -1,
    damageBand: -1,
    police: null,
    fine: "",
    near: -1,
    stage: "",
    gear: "",
  };

  const DAMAGE_COLORS = [
    "linear-gradient(90deg,#ff2f4b,#ff7a5f)",
    "linear-gradient(90deg,#ffb44a,#ffd166)",
    "linear-gradient(90deg,#16b98b,#7effc0)",
  ];

  function updateHUD(force = false) {
    const now = performance.now();
    if (!force && now - state.lastHud < 40) return;
    state.lastHud = now;

    const progress = clamp((state.playerZ - START_Z) / (route.finishZ - START_Z), 0, 1);
    const progressPct = (progress * 100).toFixed(2) + "%";
    dom.progressFill.style.width = progressPct;
    dom.vanMarker.style.left = progressPct;
    dom.score.textContent = fmtMoney(state.score);

    const timerText = fmtTime(state.timeLeft);
    if (timerText !== hudCache.timer) {
      hudCache.timer = timerText;
      dom.timer.textContent = timerText;
    }
    const danger = state.timeLeft <= 10.5;
    if (danger !== hudCache.danger) {
      hudCache.danger = danger;
      dom.timer.classList.toggle("danger", danger);
    }

    const bestText = "BEST " + fmtMoney(state.best);
    if (bestText !== hudCache.best) {
      hudCache.best = bestText;
      dom.bestLine.textContent = bestText;
    }

    const damagePct = Math.round(state.damage);
    if (damagePct !== hudCache.damagePct) {
      hudCache.damagePct = damagePct;
      dom.damageText.textContent = damagePct + "%";
    }
    dom.damageFill.style.transform = `scaleX(${clamp(state.damage / 100, 0, 1)})`;
    const damageBand = state.damage > 60 ? 2 : state.damage > 30 ? 1 : 0;
    if (damageBand !== hudCache.damageBand) {
      hudCache.damageBand = damageBand;
      dom.damageFill.style.background = DAMAGE_COLORS[damageBand];
    }

    dom.boostText.textContent = Math.round(state.boost * 100) + "%";
    dom.boostFill.style.transform = `scaleX(${clamp(state.boost, 0, 1)})`;
    dom.heatText.textContent = Math.round(state.heat) + "%";
    dom.heatFill.style.transform = `scaleX(${clamp(state.heat / 100, 0, 1)})`;

    if (state.policeChase !== hudCache.police) {
      hudCache.police = state.policeChase;
      dom.policeAlert.classList.toggle("is-hidden", !state.policeChase);
    }
    const fineText = state.policeFines > 0 ? "罰款 -" + fmtMoney(state.policeFines) : "";
    if (fineText !== hudCache.fine) {
      hudCache.fine = fineText;
      dom.policeFine.textContent = fineText;
    }

    if (state.nearMisses !== hudCache.near) {
      hudCache.near = state.nearMisses;
      dom.nearMissLine.textContent = "NEAR MISS " + state.nearMisses;
    }

    const stageText = activeRoute.stageNames[clamp(state.stage, 0, activeRoute.stageNames.length - 1)];
    if (stageText !== hudCache.stage) {
      hudCache.stage = stageText;
      dom.stageName.textContent = stageText;
    }

    const kmh = speedToKmh(state.speed);
    dom.speed.textContent = kmh;
    const pct = clamp(kmh / 160, 0, 1);
    dom.speedArc.style.strokeDashoffset = String(100 - pct * 100);
    const ang = Math.PI * (1 + pct);
    dom.needleDot.setAttribute("cx", (110 + Math.cos(ang) * 82).toFixed(1));
    dom.needleDot.setAttribute("cy", (116 + Math.sin(ang) * 82).toFixed(1));

    const gearText = state.speed > 220 ? "D" : "N";
    if (gearText !== hudCache.gear) {
      hudCache.gear = gearText;
      dom.gear.textContent = gearText;
    }
  }

