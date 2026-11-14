/* =========================================================================
   progression.js — Shop data, wallet/profile storage, route and garage UI logic.
   Red Van Daredevil · classic scripts, shared global lexical scope
   ========================================================================= */
"use strict";

  /* -----------------------------------------------------------------------
     Garage / progression
     ----------------------------------------------------------------------- */
  const SHOP_PARTS = {
    engine: {
      name: "引擎", en: "ENGINE", code: "ENG",
      desc: "加速同極速。每一級 +3.5% 動力。",
      costs: [18000, 45000, 90000, 160000],
    },
    tires: {
      name: "輪胎", en: "TYRES", code: "TYR",
      desc: "抓地力同過彎穩定性。每一級 +4% 抓地。",
      costs: [15000, 38000, 78000, 140000],
    },
    brakes: {
      name: "煞車", en: "BRAKES", code: "BRK",
      desc: "收車更快。每一級 +5% 制動力。",
      costs: [12000, 30000, 65000, 115000],
    },
    turbo: {
      name: "渦輪", en: "TURBO", code: "N2O",
      desc: "氮氣容量同回充。每一級 +6% 氮氣效率。",
      costs: [16000, 40000, 82000, 150000],
    },
  };

  const SHOP_BUSES = [
    {
      id: "classic", name: "紅VAN 原裝", en: "CLASSIC RED", price: 0,
      desc: "最原始嘅紅色公共小巴。平衡、可靠、唔會賠死你。",
      stats: { speed: 0, grip: 0, brake: 0, boost: 0, earnings: 0 },
    },
    {
      id: "gold", name: "金裝紅VAN", en: "GOLD EDITION", price: 120000,
      desc: "金色車身，車主話會旺財。極速同車費都高一截。",
      stats: { speed: 0.04, grip: 0.02, brake: 0, boost: 0, earnings: 0.12 },
    },
    {
      id: "neon", name: "夜光紅VAN", en: "NEON NIGHT", price: 180000,
      desc: "霓虹拉花、夜光底盤。過彎更穩，氮氣更爆。",
      stats: { speed: 0, grip: 0.06, brake: 0.04, boost: 0.1, earnings: 0.05 },
    },
  ];

  const SHOP_MAPS = [
    {
      id: "night", name: "標準夜更", en: "STANDARD NIGHT", price: 0,
      desc: "乾爽路面，正常車流。原汁原味嘅香港深夜。",
      earnings: 1, grip: 1, traffic: 1,
    },
    {
      id: "rain", name: "雨夜香港", en: "RAINY NIGHT", price: 55000,
      desc: "落雨路滑，抓地力下降，但車費 +25%。",
      earnings: 1.25, grip: 0.88, traffic: 1,
    },
    {
      id: "rush", name: "繁忙時間", en: "RUSH HOUR", price: 75000,
      desc: "路面多咗車，但車費 +15%。趕時間嘅最好藉口。",
      earnings: 1.15, grip: 1, traffic: 1.35,
    },
  ];

  function defaultProfile() {
    return {
      wallet: 0,
      parts: { engine: 0, tires: 0, brakes: 0, turbo: 0 },
      buses: ["classic"],
      bus: "classic",
      maps: ["night"],
      map: "night",
    };
  }
  let profile = defaultProfile();

  function loadProfile() {
    try {
      const raw = JSON.parse(localStorage.getItem("redvan-profile-v1") || "null");
      if (raw && typeof raw === "object") {
        const base = defaultProfile();
        profile = {
          ...base,
          ...raw,
          parts: { ...base.parts, ...(raw.parts || {}) },
          buses: Array.isArray(raw.buses) ? raw.buses : base.buses,
          maps: Array.isArray(raw.maps) ? raw.maps : base.maps,
        };
        profile.wallet = Math.max(0, Number(profile.wallet) || 0);
        profile.buses = Array.from(new Set(["classic", ...profile.buses]));
        profile.maps = Array.from(new Set(["night", ...profile.maps]));
        if (!SHOP_BUSES.some((b) => b.id === profile.bus)) profile.bus = "classic";
        if (!SHOP_MAPS.some((m) => m.id === profile.map)) profile.map = "night";
      }
    } catch (e) {
      profile = defaultProfile();
    }
    applyProfileStats();
    updateWalletUI();
  }

  function saveProfile() {
    try {
      localStorage.setItem("redvan-profile-v1", JSON.stringify(profile));
    } catch (e) { /* ignore */ }
  }

  function applyProfileStats() {
    const bus = SHOP_BUSES.find((b) => b.id === profile.bus) || SHOP_BUSES[0];
    const map = SHOP_MAPS.find((m) => m.id === profile.map) || SHOP_MAPS[0];
    const p = profile.parts;
    let speed = 1 + p.engine * 0.035 + bus.stats.speed;
    let grip = 1 + p.tires * 0.04 + bus.stats.grip;
    let brake = 1 + p.brakes * 0.05 + bus.stats.brake;
    let boost = 1 + p.turbo * 0.06 + bus.stats.boost;
    let earnings = 1 + bus.stats.earnings;
    grip *= map.grip;
    earnings *= map.earnings;
    state.stats = {
      speed,
      grip,
      brake,
      boost,
      earnings,
      map: map.id,
      traffic: map.traffic,
    };
  }

  function updateWalletUI() {
    const wallet = fmtMoney(profile.wallet);
    if (dom.walletChip) dom.walletChip.textContent = wallet;
    if (dom.garageWallet) dom.garageWallet.textContent = wallet;
  }

  /* -----------------------------------------------------------------------
     Storage
     ----------------------------------------------------------------------- */
  function loadBest() {
    try {
      let saved = localStorage.getItem(activeRoute.bestKey);
      if (!saved && activeRoute.legacyBestKey) {
        saved = localStorage.getItem(activeRoute.legacyBestKey);
      }
      state.best = parseInt(saved || "0", 10) || 0;
    } catch (e) {
      state.best = 0;
    }
    if (dom.startBest) dom.startBest.textContent = fmtMoney(state.best);
    if (dom.bestLine) dom.bestLine.textContent = "BEST " + fmtMoney(state.best);
  }
  function saveBest() {
    try {
      if (state.score > state.best) {
        state.best = Math.floor(state.score);
        localStorage.setItem(activeRoute.bestKey, String(state.best));
        return true;
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  function applyRouteToUI(def) {
    document.title = "紅VAN飛車 · " + def.originCn + " → " + def.destCn;
    if (dom.brandRoute) dom.brandRoute.innerHTML = def.hudCode;
    if (dom.destOriginCn) dom.destOriginCn.textContent = def.originCn;
    if (dom.destOriginEn) dom.destOriginEn.textContent = def.originEn;
    if (dom.destDestCn) dom.destDestCn.textContent = def.destCn;
    if (dom.destDestEn) dom.destDestEn.textContent = def.destEn;
    if (dom.destDistance) dom.destDistance.textContent = def.distance;
    if (dom.destStages) dom.destStages.textContent = def.stagesLabel;
    if (dom.destTag) dom.destTag.textContent = def.destTag;
    if (dom.destShift) dom.destShift.textContent = def.shift;
    if (dom.destBoard) {
      dom.destBoard.setAttribute("aria-label", "路線：" + def.originCn + "至" + def.destCn);
    }
    if (dom.missionOne) dom.missionOne.innerHTML = def.mission;
    if (dom.briefFoot) dom.briefFoot.textContent = def.quote;
    if (dom.routeStrip) {
      dom.routeStrip.innerHTML = def.strip
        .map((stop, i) => `<span>${stop}</span>${i < def.strip.length - 1 ? "<i></i>" : ""}`)
        .join("");
    }
    if (dom.stopDots) {
      const labels = [def.originCn, ...def.checkpoints.map((cp) => cp.cn), def.destCn];
      const pcts = [0, ...def.checkpoints.map((cp) => (cp.seg / def.finishSeg) * 100), 100];
      dom.stopDots.forEach((dot, i) => {
        if (!dot) return;
        dot.style.left = pcts[i].toFixed(2) + "%";
        if (dom.stopLabels[i]) dom.stopLabels[i].textContent = labels[i];
      });
    }
    const routeIds = Object.keys(ROUTES);
    const routeIndex = routeIds.indexOf(def.id) + 1;
    if (dom.routeCurrentNo) dom.routeCurrentNo.textContent = String(routeIndex).padStart(2, "0");
    if (dom.routeCount) dom.routeCount.textContent = String(routeIds.length);
    if (dom.routeCurrentName) dom.routeCurrentName.textContent = def.originCn + " → " + def.destCn;
    if (dom.routeCurrentMeta) {
      dom.routeCurrentMeta.textContent = def.difficulty + " · " + def.distance + " · " + def.stagesLabel;
    }
    if (dom.routeCurrentBtn) {
      dom.routeCurrentBtn.setAttribute("aria-label", "現在路線 " + def.originCn + " 到 " + def.destCn + "，開啟全部路線");
    }
    document.querySelectorAll(".route-card").forEach((card) => {
      const active = card.dataset.route === def.id;
      card.classList.toggle("is-active", active);
      card.setAttribute("aria-pressed", String(active));
    });
    if (dom.resultFoot) {
      dom.resultFoot.textContent = "HK RED VAN DAREDEVIL · " + def.originCn + " → " + def.destCn;
    }
  }

  function getStoredBest(def) {
    try {
      let saved = localStorage.getItem(def.bestKey);
      if (!saved && def.legacyBestKey) saved = localStorage.getItem(def.legacyBestKey);
      const stored = parseInt(saved || "0", 10) || 0;
      return def.id === activeRoute.id ? Math.max(stored, state.best) : stored;
    } catch (e) {
      return def.id === activeRoute.id ? state.best : 0;
    }
  }

  function renderRouteGrid() {
    if (!dom.routeGrid) return;
    const ids = Object.keys(ROUTES);
    const pips = (n) => "●".repeat(n) + "○".repeat(Math.max(0, 5 - n));
    dom.routeGrid.innerHTML = ids
      .map((id, index) => {
        const def = ROUTES[id];
        const best = getStoredBest(def);
        const active = def.id === activeRoute.id;
        return `
          <button class="route-card${active ? " is-active" : ""}" type="button" data-route="${def.id}" aria-pressed="${active}">
            <span class="route-card-no">${String(index + 1).padStart(2, "0")}</span>
            <span class="route-card-copy">
              <b>${def.originCn} → ${def.destCn}</b>
              <small>${def.originEn} → ${def.destEn} · ${def.distance}</small>
              <span class="route-card-desc">${def.summary}</span>
              <span class="route-card-tags">${def.tags.map((tag) => `<span>${tag}</span>`).join("")}</span>
            </span>
            <span class="route-card-right">
              <span class="route-card-diff">${pips(def.difficultyPips)} ${def.difficulty}</span>
              <span class="route-card-best">${best > 0 ? "BEST " + fmtMoney(best) : "NO FARE YET"}</span>
            </span>
          </button>`;
      })
      .join("");
  }

  function openRouteScreen() {
    if (state.mode !== "menu" || !dom.routeScreen) return;
    renderRouteGrid();
    dom.routeScreen.classList.remove("is-hidden");
    if (dom.routeCurrentBtn) dom.routeCurrentBtn.setAttribute("aria-expanded", "true");
    if (dom.closeRoutesBtn) dom.closeRoutesBtn.focus();
  }

  function closeRouteScreen() {
    if (!dom.routeScreen) return;
    dom.routeScreen.classList.add("is-hidden");
    if (dom.routeCurrentBtn) {
      dom.routeCurrentBtn.setAttribute("aria-expanded", "false");
      dom.routeCurrentBtn.focus();
    }
  }

  let garageTab = "parts";

  function setGarageNotice(text, tone = "") {
    if (!dom.garageNotice) return;
    dom.garageNotice.textContent = text;
    dom.garageNotice.classList.toggle("is-good", tone === "good");
    dom.garageNotice.classList.toggle("is-bad", tone === "bad");
  }

  function renderGarage() {
    if (!dom.garageContent) return;
    updateWalletUI();
    document.querySelectorAll(".garage-tab").forEach((tab) => {
      const active = tab.dataset.garageTab === garageTab;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    if (garageTab === "parts") {
      dom.garageContent.innerHTML = Object.entries(SHOP_PARTS)
        .map(([key, part]) => {
          const level = profile.parts[key] || 0;
          const maxed = level >= part.costs.length;
          const cost = maxed ? 0 : part.costs[level];
          const can = maxed || profile.wallet >= cost;
          return `
            <button class="garage-item${maxed ? " is-equipped" : can ? "" : " is-locked"}" type="button" data-action="part" data-key="${key}">
              <span class="gi-code">${part.code}</span>
              <span class="gi-copy">
                <b>${part.name} <small>${part.en}</small></b>
                <em>LV ${level} / ${part.costs.length} · ${"●".repeat(level)}${"○".repeat(part.costs.length - level)}</em>
                <span class="gi-desc">${part.desc}</span>
              </span>
              <span class="gi-right">
                <span class="gi-cost">${maxed ? "MAX" : fmtMoney(cost)}</span>
                <span class="gi-action">${maxed ? "已改滿" : "升級"}</span>
              </span>
            </button>`;
        })
        .join("");
    } else if (garageTab === "buses") {
      dom.garageContent.innerHTML = SHOP_BUSES.map((bus) => {
        const owned = profile.buses.includes(bus.id);
        const equipped = profile.bus === bus.id;
        const can = owned || profile.wallet >= bus.price;
        const bits = [];
        if (bus.stats.speed) bits.push(`+${Math.round(bus.stats.speed * 100)}% 極速`);
        if (bus.stats.grip) bits.push(`+${Math.round(bus.stats.grip * 100)}% 抓地`);
        if (bus.stats.brake) bits.push(`+${Math.round(bus.stats.brake * 100)}% 煞車`);
        if (bus.stats.boost) bits.push(`+${Math.round(bus.stats.boost * 100)}% 氮氣`);
        if (bus.stats.earnings) bits.push(`+${Math.round(bus.stats.earnings * 100)}% 車費`);
        return `
          <button class="garage-item${equipped ? " is-equipped" : can ? "" : " is-locked"}" type="button" data-action="bus" data-key="${bus.id}">
            <span class="gi-code">BUS</span>
            <span class="gi-copy">
              <b>${bus.name} <small>${bus.en}</small></b>
              <em>${equipped ? "使用中" : owned ? "已擁有" : "未購買"} · ${bits.join(" · ") || "原裝設定"}</em>
              <span class="gi-desc">${bus.desc}</span>
            </span>
            <span class="gi-right">
              <span class="gi-cost">${equipped ? "—" : owned ? "已購" : fmtMoney(bus.price)}</span>
              <span class="gi-action">${equipped ? "裝備中" : owned ? "揀用" : "買車"}</span>
            </span>
          </button>`;
      }).join("");
    } else {
      dom.garageContent.innerHTML = SHOP_MAPS.map((map) => {
        const owned = profile.maps.includes(map.id);
        const equipped = profile.map === map.id;
        const can = owned || profile.wallet >= map.price;
        const bits = [];
        if (map.earnings > 1) bits.push(`+${Math.round((map.earnings - 1) * 100)}% 車費`);
        if (map.grip < 1) bits.push(`${Math.round((map.grip - 1) * 100)}% 抓地`);
        if (map.traffic > 1) bits.push(`+${Math.round((map.traffic - 1) * 100)}% 車流`);
        return `
          <button class="garage-item${equipped ? " is-equipped" : can ? "" : " is-locked"}" type="button" data-action="map" data-key="${map.id}">
            <span class="gi-code">MAP</span>
            <span class="gi-copy">
              <b>${map.name} <small>${map.en}</small></b>
              <em>${equipped ? "使用中" : owned ? "已擁有" : "未購買"} · ${bits.join(" · ") || "標準設定"}</em>
              <span class="gi-desc">${map.desc}</span>
            </span>
            <span class="gi-right">
              <span class="gi-cost">${equipped ? "—" : owned ? "已購" : fmtMoney(map.price)}</span>
              <span class="gi-action">${equipped ? "使用中" : owned ? "揀用" : "買地圖"}</span>
            </span>
          </button>`;
      }).join("");
    }
  }

  function openGarage() {
    if (state.mode !== "menu" || !dom.garageScreen) return;
    renderGarage();
    setGarageNotice("買升級、換車、揀地圖。車房只收現金，唔收投訴。", "");
    dom.garageScreen.classList.remove("is-hidden");
    if (dom.closeGarageBtn) dom.closeGarageBtn.focus();
  }

  function closeGarage() {
    if (!dom.garageScreen) return;
    dom.garageScreen.classList.add("is-hidden");
    if (dom.garageBtn) dom.garageBtn.focus();
  }

  function buyPart(key) {
    const part = SHOP_PARTS[key];
    if (!part) return;
    const level = profile.parts[key] || 0;
    if (level >= part.costs.length) return;
    const cost = part.costs[level];
    if (profile.wallet < cost) {
      setGarageNotice("唔夠錢。跑多幾轉先。", "bad");
      return;
    }
    profile.wallet -= cost;
    profile.parts[key] = level + 1;
    applyProfileStats();
    saveProfile();
    updateWalletUI();
    setGarageNotice(`已升級 ${part.name} 到 LV ${level + 1}。`, "good");
    renderGarage();
  }

  function selectBus(id) {
    const bus = SHOP_BUSES.find((b) => b.id === id);
    if (!bus) return;
    const owned = profile.buses.includes(id);
    if (!owned) {
      if (profile.wallet < bus.price) {
        setGarageNotice("唔夠錢買呢部車。", "bad");
        return;
      }
      profile.wallet -= bus.price;
      profile.buses.push(id);
    }
    profile.bus = id;
    applyProfileStats();
    saveProfile();
    updateWalletUI();
    setGarageNotice(`${bus.name} 已入庫，兼且而家係你嘅戰車。`, "good");
    renderGarage();
  }

  function selectMap(id) {
    const map = SHOP_MAPS.find((m) => m.id === id);
    if (!map) return;
    const owned = profile.maps.includes(id);
    if (!owned) {
      if (profile.wallet < map.price) {
        setGarageNotice("唔夠錢買呢個地圖。", "bad");
        return;
      }
      profile.wallet -= map.price;
      profile.maps.push(id);
    }
    profile.map = id;
    applyProfileStats();
    saveProfile();
    updateWalletUI();
    setGarageNotice(`${map.name} 已設定。`, "good");
    renderGarage();
  }

  function selectRoute(id) {
    if (state.mode !== "menu") return;
    const def = ROUTES[id];
    if (!def) return;
    buildRoute(def);
    AudioKit.click();
    showMenu();
    if (dom.routeCurrentBtn) dom.routeCurrentBtn.focus();
  }

