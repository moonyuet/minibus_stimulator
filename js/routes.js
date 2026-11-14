/* =========================================================================
   routes.js — Route data, road generation, scenery placement and speed cameras.
   Red Van Daredevil · classic scripts, shared global lexical scope
   ========================================================================= */
"use strict";

  /* -----------------------------------------------------------------------
     Routes
     ----------------------------------------------------------------------- */
  function makeSections(total, pattern) {
    const out = [];
    let used = 0;
    while (used < total) {
      for (const [len, curve] of pattern) {
        if (used >= total) break;
        const take = Math.min(len, total - used);
        out.push([take, curve]);
        used += take;
      }
    }
    return out;
  }

  const ROUTES = {
    mktm: {
      id: "mktm",
      bestKey: "redvan-best-mktm",
      legacyBestKey: "redvan-best-v1",
      originCn: "旺角", originEn: "MONG KOK",
      destCn: "屯門", destEn: "TUEN MUN",
      hudCode: 'MK <i>→</i> TM',
      distance: "33.9 KM", stagesLabel: "3 STAGES", destTag: "1 VERY BAD IDEA",
      shift: "夜更 01", difficulty: "ORIGINAL", difficultyPips: 2,
      summary: "獅子山隧道、荃灣、屯門公路，再沿海入屯門。經典長途夜更。",
      tags: ["HIGHWAY", "COAST", "ORIGINAL"],
      timer: 62,
      totalSegs: 1800,
      finishSeg: 1776,
      checkpoints: [
        { seg: 600, cn: "荃灣", en: "TSUEN WAN", line: "「未落車嘅，坐穩少少。」", bonus: 12, repair: 20, fare: 5000 },
        { seg: 1200, cn: "屯門公路", en: "TUEN MUN ROAD", line: "「前面落斜，捉實扶手。」", bonus: 12, repair: 20, fare: 5000 },
      ],
      stageNames: ["旺角 · MONG KOK", "荃灣 · TSUEN WAN", "屯門公路 · TUEN MUN ROAD", "屯門 · TUEN MUN"],
      zones: [[520, "city"], [760, "highway"], [1460, "coast"], [1800, "town"]],
      sections: [
        [70, 0.02], [55, 0.36], [45, -0.28], [65, 0.5], [50, -0.54], [40, 0.14],
        [60, 0.6], [55, -0.42], [70, 0.2], [50, -0.66], [70, 0.44], [50, 0.0],
        [60, 0.54], [45, -0.7], [65, 0.34], [55, -0.5], [60, 0.7], [50, -0.66],
        [70, 0.44], [55, -0.34], [65, 0.54], [50, -0.6], [65, 0.4], [60, -0.3],
        [55, 0.24], [65, 0.0], [50, 0.34], [55, -0.4], [70, 0.14], [60, 0.0],
        [65, 0.28],
      ],
      curveFactor: 0.00255,
      hillZones: { city: 1, highway: 1, coast: 1.35, town: 1 },
      gantries: [
        { seg: 42, cn: "屯門", en: "TUEN MUN", sub: "33 km" },
        { seg: 548, cn: "荃灣", en: "TSUEN WAN", sub: "EXIT 8" },
        { seg: 742, cn: "屯門公路", en: "TUEN MUN ROAD", sub: "↑" },
        { seg: 1168, cn: "汀九橋", en: "TING KAU BRIDGE", sub: "KEEP LEFT" },
        { seg: 1450, cn: "屯門市中心", en: "TUEN MUN CENTRAL", sub: "2 km" },
        { seg: 1748, cn: "終點", en: "TERMINUS", sub: "紅VAN總站" },
      ],
      traffic: {
        types: ["taxi", "taxi", "private", "private", "bus", "truck", "van", "greenvan", "bike"],
        initial: 13, spacing: 2350, maxAhead: 13,
        spawnInterval: [0.42, 0.97], spawnAhead: [28000, 49000], speedFactor: 1,
      },
      background: "bridge",
      cityFade: [500, 580, 1440, 1510],
      sky: ["#04050b", "#0b0b1d", "#24152f", "#482536", "#1a1520"],
      startToast: "<b>旺角開出</b> · 終點屯門，唔好遲到。",
      mission: "由旺角剷到屯門。沿途有<strong>兩個檢查站</strong>，夠鐘之前埋站。",
      quote: "「屯門公路，今晚唔塞車。」—— 一個明顯嘅謊言",
      strip: ["MK", "TSW", "TMR", "TM"],
      scoring: { finish: 8000, time: 420, condition: 130, rankS: 85000, rankA: 58000, rankB: 32000 },
      result: {
        winS: "你由旺角剷到屯門，全程貼住車邊過，冇人報警。傳說中嘅紅VAN司機。",
        winA: "順利埋站。乘客落車嗰陣，隻手仲震緊。",
        winB: "安全到達。以紅VAN嚟講，算係非常克制。",
        winC: "你到咗屯門。慢，但係到咗。乘客表示下次會搭巴士。",
        failTime: "時間到。乘客已經轉咗搭西鐵，仲話會投訴你。",
        failWreck: "架車散晒。拖車師傅望一望，話：『呢部我熟。』",
        failOther: "未到屯門。今晚嘅車費，當係買個教訓。",
      },
    },

    wcst: {
      id: "wcst",
      bestKey: "redvan-best-wcst",
      originCn: "灣仔", originEn: "WAN CHAI",
      destCn: "赤柱", destEn: "STANLEY",
      hudCode: 'WC <i>→</i> ST',
      distance: "18.6 KM", stagesLabel: "3 STAGES", destTag: "RICH CARS. NO MERCY.",
      shift: "夜更 02", difficulty: "HARD", difficultyPips: 5,
      summary: "灣仔入香港仔，再上淺水灣、落赤柱。富豪區跑車又多又寸。",
      tags: ["RICH CARS", "HILLS", "COAST"],
      timer: 56,
      totalSegs: 1600,
      finishSeg: 1580,
      checkpoints: [
        { seg: 720, cn: "香港仔", en: "ABERDEEN", line: "「避風塘啲海鮮，今晚唔等埋你。」", bonus: 10, repair: 18, fare: 6500 },
        { seg: 1180, cn: "淺水灣", en: "REPULSE BAY", line: "「呢度啲車，貴過你層樓。借借。」", bonus: 10, repair: 18, fare: 6500 },
      ],
      stageNames: ["灣仔 · WAN CHAI", "香港仔 · ABERDEEN", "淺水灣 · REPULSE BAY", "赤柱 · STANLEY"],
      zones: [[360, "city"], [720, "hills"], [1180, "coast"], [1600, "rich"]],
      sections: [
        [60, 0.04], [50, 0.3], [55, -0.22], [50, 0.36], [45, -0.28],
        [45, 0.5], [40, -0.85], [35, 0.95], [40, -0.8], [35, 0.9], [40, -0.85], [35, 0.7], [35, -0.55],
        [35, 0.45], [30, -0.6], [35, 0.5], [30, -0.45], [40, 0.55], [35, -0.5],
        [35, 0.35], [30, -0.45], [35, 0.55], [30, -0.4], [35, 0.4], [30, -0.35],
        [35, 0.5], [30, -0.45], [35, 0.4], [30, -0.3], [35, 0.25], [25, -0.2],
        [30, 0.2], [30, -0.3], [30, 0.35], [25, -0.2], [30, 0.15], [30, -0.2], [30, 0.1], [30, 0.0],
        [30, 0.25], [30, -0.25], [35, 0.3], [30, -0.2], [25, 0.2], [30, -0.1], [30, 0.0],
      ],
      curveFactor: 0.00315,
      hillZones: { city: 1, hills: 2.05, coast: 1.25, rich: 1.05 },
      gantries: [
        { seg: 40, cn: "灣仔", en: "WAN CHAI", sub: "HAPPY VALLEY" },
        { seg: 330, cn: "香港仔", en: "ABERDEEN", sub: "2 km" },
        { seg: 690, cn: "香港仔", en: "ABERDEEN", sub: "CHECKPOINT" },
        { seg: 1150, cn: "淺水灣", en: "REPULSE BAY", sub: "BEACH" },
        { seg: 1400, cn: "赤柱", en: "STANLEY", sub: "3 km" },
        { seg: 1545, cn: "終點", en: "TERMINUS", sub: "赤柱總站" },
      ],
      traffic: {
        types: [
          "sportRed", "sportSilver", "sportYellow", "sportRed", "sportSilver",
          "private", "private", "taxi", "greenvan", "bike",
        ],
        initial: 16, spacing: 1950, maxAhead: 17,
        spawnInterval: [0.26, 0.62], spawnAhead: [21000, 43000], speedFactor: 1.06,
        showroom: ["sportRed", "sportYellow", "sportSilver", "sportRed"],
      },
      background: "bay",
      cityFade: [250, 340, -1, -1],
      sky: ["#03060f", "#08101f", "#17243a", "#3b2b3d", "#10121a"],
      startToast: "<b>灣仔開出</b> · 赤柱，有錢人唔會讓你。",
      mission: "由灣仔入赤柱。富豪區啲<strong>跑車</strong>又快又寸，兩個檢查站，遲到即係輸。",
      quote: "「赤柱啲車，貴過你層樓。」—— 的士司機都咁講",
      strip: ["WC", "AB", "RB", "ST"],
      scoring: { finish: 10000, time: 460, condition: 150, rankS: 95000, rankA: 65000, rankB: 36000 },
      result: {
        winS: "你由灣仔剷到赤柱，沿路同法拉利鬥快，冇人敢報警。有錢人都要讓路。",
        winA: "順利埋站。幾部名車司機落窗望住你，表情非常複雜。",
        winB: "安全到達赤柱。以紅VAN嚟講，算係非常有家教。",
        winC: "你到咗赤柱。慢，但係到咗。有錢人表示唔會再搭。",
        failTime: "時間到。赤柱嘅富豪已經叫咗直升機走，你仲未到。",
        failWreck: "架車散晒。拖車公司話：呢區啲車，拖費另計。",
        failOther: "未到赤柱。今晚嘅車費，當係買個教訓。",
      },
    },

    mktp: {
      id: "mktp",
      bestKey: "redvan-best-mktp",
      originCn: "旺角", originEn: "MONG KOK",
      destCn: "大埔", destEn: "TAI PO",
      hudCode: 'MK <i>→</i> TP',
      distance: "23.5 KM", stagesLabel: "3 STAGES", destTag: "TUNNEL TO TAI PO",
      shift: "夜更 03", difficulty: "MEDIUM", difficultyPips: 3,
      summary: "獅子山隧道、沙田城門河，再直上大埔。隧道同新市鎮各一段。",
      tags: ["TUNNEL", "NEW TOWN", "HILLS"],
      timer: 48,
      totalSegs: 1260,
      finishSeg: 1240,
      checkpoints: [
        { seg: 480, cn: "獅子山隧道", en: "LION ROCK TUNNEL", line: "「隧道入面，唔好開窗。」", bonus: 11, repair: 18, fare: 6000 },
        { seg: 900, cn: "沙田", en: "SHA TIN", line: "「城門河啲人，今晚早瞓。」", bonus: 11, repair: 18, fare: 6000 },
      ],
      stageNames: ["旺角 · MONG KOK", "獅子山隧道 · LION ROCK TUNNEL", "沙田 · SHA TIN", "大埔 · TAI PO"],
      zones: [[330, "city"], [760, "hills"], [1260, "town"]],
      sections: makeSections(1260, [
        [60, 0.02], [45, 0.32], [40, -0.26], [55, 0.44], [50, -0.5],
        [60, 0.28], [35, -0.6], [45, 0.55], [40, -0.45], [55, 0.3],
        [45, -0.35], [50, 0.4], [40, -0.25], [55, 0.2],
      ]),
      curveFactor: 0.0026,
      hillZones: { city: 1, hills: 1.7, town: 1 },
      gantries: [
        { seg: 40, cn: "大埔", en: "TAI PO", sub: "23 km" },
        { seg: 300, cn: "獅子山隧道", en: "LION ROCK TUNNEL", sub: "LIGHTS ON" },
        { seg: 500, cn: "沙田", en: "SHA TIN", sub: "2 km" },
        { seg: 760, cn: "大埔", en: "TAI PO", sub: "5 km" },
        { seg: 1000, cn: "大埔市中心", en: "TAI PO CENTRAL", sub: "EXIT 3" },
        { seg: 1220, cn: "終點", en: "TERMINUS", sub: "大埔總站" },
      ],
      traffic: {
        types: ["taxi", "private", "bus", "truck", "van", "private", "taxi", "bike"],
        initial: 14, spacing: 2200, maxAhead: 14,
        spawnInterval: [0.36, 0.84], spawnAhead: [25000, 46000], speedFactor: 1.0,
      },
      background: "hills",
      cityFade: [0, 260, 900, 1080],
      sky: ["#04050b", "#0d0b1e", "#261a2f", "#3a2a35", "#17141c"],
      startToast: "<b>旺角開出</b> · 大埔，經獅子山隧道。",
      mission: "由旺角穿<strong>獅子山隧道</strong>入沙田，再直上大埔。兩個檢查站，隧道位要小心。",
      quote: "「獅子山隧道，今晚唔塞車。」—— 另一個明顯嘅謊言",
      strip: ["MK", "LRT", "ST", "TP"],
      scoring: { finish: 9000, time: 430, condition: 140, rankS: 78000, rankA: 52000, rankB: 30000 },
      result: {
        winS: "你由旺角穿過獅子山隧道，再剷到大埔，全程快過晒所有巴士線。",
        winA: "順利入大埔。乘客話：『隧道費都值。』",
        winB: "安全到達大埔。以紅VAN嚟講，算係非常準時。",
        winC: "你到大埔。慢，但係到咗。乘客表示下次會搭東鐵。",
        failTime: "時間到。大埔嘅乘客已經轉搭東鐵，仲話會投訴你。",
        failWreck: "架車散晒。拖車師傅話：『獅子山隧道拖車，另加隧道費。』",
        failOther: "未到大埔。今晚嘅車費，當係買個教訓。",
      },
    },

    mksk: {
      id: "mksk",
      bestKey: "redvan-best-mksk",
      originCn: "旺角", originEn: "MONG KOK",
      destCn: "西貢", destEn: "SAI KUNG",
      hudCode: 'MK <i>→</i> SK',
      distance: "21.4 KM", stagesLabel: "3 STAGES", destTag: "SEA. SEAFOOD. SPEED.",
      shift: "夜更 04", difficulty: "MEDIUM", difficultyPips: 4,
      summary: "彩虹、清水灣道、西貢海邊。彎多，海鮮檔收得早。",
      tags: ["HILLS", "COAST", "SEAFOOD"],
      timer: 46,
      totalSegs: 1140,
      finishSeg: 1120,
      checkpoints: [
        { seg: 430, cn: "彩虹", en: "CHOI HUNG", line: "「彩虹邨啲燈，今晚特別光。」", bonus: 10, repair: 18, fare: 5500 },
        { seg: 820, cn: "清水灣", en: "CLEAR WATER BAY", line: "「前面海邊，唔好望風景。」", bonus: 10, repair: 18, fare: 5500 },
      ],
      stageNames: ["旺角 · MONG KOK", "彩虹 · CHOI HUNG", "清水灣 · CLEAR WATER BAY", "西貢 · SAI KUNG"],
      zones: [[280, "city"], [700, "hills"], [950, "coast"], [1140, "town"]],
      sections: makeSections(1140, [
        [50, 0.02], [40, 0.4], [35, -0.55], [45, 0.65], [40, -0.7],
        [35, 0.55], [45, -0.6], [40, 0.7], [35, -0.5], [50, 0.4],
        [40, -0.35], [45, 0.55], [35, -0.45], [50, 0.25],
      ]),
      curveFactor: 0.0030,
      hillZones: { city: 1, hills: 1.8, coast: 1.25, town: 1 },
      gantries: [
        { seg: 40, cn: "西貢", en: "SAI KUNG", sub: "21 km" },
        { seg: 260, cn: "彩虹", en: "CHOI HUNG", sub: "2 km" },
        { seg: 560, cn: "清水灣", en: "CLEAR WATER BAY", sub: "BEACH" },
        { seg: 800, cn: "西貢", en: "SAI KUNG", sub: "4 km" },
        { seg: 1000, cn: "西貢市中心", en: "SAI KUNG TOWN", sub: "SEAFOOD" },
        { seg: 1100, cn: "終點", en: "TERMINUS", sub: "西貢總站" },
      ],
      traffic: {
        types: ["taxi", "private", "bus", "greenvan", "van", "private", "taxi", "bike"],
        initial: 14, spacing: 2150, maxAhead: 14,
        spawnInterval: [0.34, 0.8], spawnAhead: [24000, 45000], speedFactor: 1.02,
      },
      background: "bay",
      cityFade: [0, 240, -1, -1],
      sky: ["#03060f", "#08101f", "#17243a", "#3a2a35", "#10121a"],
      startToast: "<b>旺角開出</b> · 西貢，經清水灣道。",
      mission: "由旺角入<strong>西貢</strong>，經彩虹同清水灣。山路多彎，海邊要小心。",
      quote: "「西貢啲海鮮，今晚唔會等你。」—— 海鮮檔老闆",
      strip: ["MK", "CH", "CWB", "SK"],
      scoring: { finish: 9500, time: 450, condition: 140, rankS: 80000, rankA: 54000, rankB: 31000 },
      result: {
        winS: "你由旺角剷到西貢，沿途每個彎都一次過，海鮮檔老闆都呆咗。",
        winA: "順利到西貢。乘客落車即刻問：『有冇海鮮食？』",
        winB: "安全到達西貢。以紅VAN嚟講，算係非常克制。",
        winC: "你到西貢。慢，但係到咗。乘客表示下次會搭巴士。",
        failTime: "時間到。西貢嘅海鮮檔都收爐，你仲未到。",
        failWreck: "架車散晒。拖車師傅話：『清水灣道拖車，加錢。』",
        failOther: "未到西貢。今晚嘅車費，當係買個教訓。",
      },
    },

    mktk: {
      id: "mktk",
      bestKey: "redvan-best-mktk",
      originCn: "旺角", originEn: "MONG KOK",
      destCn: "觀塘", destEn: "KWUN TONG",
      hudCode: 'MK <i>→</i> KT',
      distance: "11.2 KM", stagesLabel: "3 STAGES", destTag: "SHORT RUN. NO MERCY.",
      shift: "夜更 05", difficulty: "SHORT", difficultyPips: 2,
      summary: "九龍城、九龍灣、觀塘。純市區短途，車多路窄，冇得唞。",
      tags: ["URBAN", "SHORT", "DENSE"],
      timer: 34,
      totalSegs: 720,
      finishSeg: 700,
      checkpoints: [
        { seg: 250, cn: "九龍城", en: "KOWLOON CITY", line: "「九龍城啲車，今晚特別多。」", bonus: 8, repair: 16, fare: 4500 },
        { seg: 480, cn: "九龍灣", en: "KOWLOON BAY", line: "「工廈啲人未收工，讓一讓。」", bonus: 8, repair: 16, fare: 4500 },
      ],
      stageNames: ["旺角 · MONG KOK", "九龍城 · KOWLOON CITY", "九龍灣 · KOWLOON BAY", "觀塘 · KWUN TONG"],
      zones: [[300, "city"], [720, "industrial"]],
      sections: makeSections(720, [
        [45, 0.02], [30, 0.22], [35, -0.2], [40, 0.28], [30, -0.25],
        [40, 0.18], [30, -0.22], [40, 0.25], [35, -0.18], [40, 0.12],
      ]),
      curveFactor: 0.0019,
      hillZones: { city: 1, industrial: 0.9 },
      gantries: [
        { seg: 30, cn: "觀塘", en: "KWUN TONG", sub: "11 km" },
        { seg: 140, cn: "九龍城", en: "KOWLOON CITY", sub: "2 km" },
        { seg: 340, cn: "九龍灣", en: "KOWLOON BAY", sub: "EXIT 5" },
        { seg: 520, cn: "觀塘", en: "KWUN TONG", sub: "3 km" },
        { seg: 660, cn: "觀塘市中心", en: "KWUN TONG CENTRAL", sub: "APM" },
        { seg: 690, cn: "終點", en: "TERMINUS", sub: "觀塘總站" },
      ],
      traffic: {
        types: ["taxi", "private", "bus", "truck", "van", "greenvan", "private", "taxi", "bike"],
        initial: 15, spacing: 1500, maxAhead: 16,
        spawnInterval: [0.24, 0.58], spawnAhead: [16000, 32000], speedFactor: 0.96,
      },
      background: "city",
      cityFade: [0, 1, 1, 1],
      sky: ["#04050b", "#0b0b1d", "#25172e", "#482536", "#1a1520"],
      startToast: "<b>旺角開出</b> · 觀塘，市區短途，冇得唞。",
      mission: "由旺角衝落<strong>觀塘</strong>，經九龍城、九龍灣。短途但車多，檢查站只加 8 秒。",
      quote: "「觀塘，今晚唔塞車。」—— 全香港最唔可信嘅一句",
      strip: ["MK", "KC", "KB", "KT"],
      scoring: { finish: 6500, time: 380, condition: 120, rankS: 65000, rankA: 42000, rankB: 24000 },
      result: {
        winS: "你由旺角剷到觀塘，市區車海都阻你唔到。今晚冇人敢話紅VAN慢。",
        winA: "順利到觀塘。乘客落車即刻話：『快過地鐵。』",
        winB: "安全到達觀塘。以市區嚟講，算係非常克制。",
        winC: "你到觀塘。慢，但係到咗。乘客表示下次會搭觀塘綫。",
        failTime: "時間到。觀塘嘅乘客已經行咗入地鐵站。",
        failWreck: "架車散晒。拖車師傅話：『觀塘拖車，塞車另計。』",
        failOther: "未到觀塘。今晚嘅車費，當係買個教訓。",
      },
    },

    twkt: {
      id: "twkt",
      bestKey: "redvan-best-twkt",
      originCn: "荃灣", originEn: "TSUEN WAN",
      destCn: "觀塘", destEn: "KWUN TONG",
      hudCode: 'TW <i>→</i> KT',
      distance: "17.0 KM", stagesLabel: "3 STAGES", destTag: "CROSS-KOWLOON SPRINT",
      shift: "夜更 06", difficulty: "MEDIUM", difficultyPips: 3,
      summary: "荃灣、葵涌貨櫃碼頭、九龍灣，再入觀塘。貨車多，氣流亂。",
      tags: ["INDUSTRIAL", "HIGHWAY", "CROSS-KOWLOON"],
      timer: 46,
      totalSegs: 980,
      finishSeg: 960,
      checkpoints: [
        { seg: 340, cn: "葵涌", en: "KWAI CHUNG", line: "「貨櫃碼頭啲車，今晚唔會讓你。」", bonus: 9, repair: 18, fare: 5200 },
        { seg: 680, cn: "九龍灣", en: "KOWLOON BAY", line: "「九龍灣啲工廈，仲有燈。」", bonus: 9, repair: 18, fare: 5200 },
      ],
      stageNames: ["荃灣 · TSUEN WAN", "葵涌 · KWAI CHUNG", "九龍灣 · KOWLOON BAY", "觀塘 · KWUN TONG"],
      zones: [[300, "town"], [600, "industrial"], [820, "highway"], [980, "industrial"]],
      sections: makeSections(980, [
        [55, 0.02], [45, 0.28], [40, -0.25], [50, 0.38], [45, -0.4],
        [55, 0.22], [40, -0.35], [50, 0.45], [45, -0.3], [55, 0.25],
        [45, -0.2], [50, 0.3], [40, -0.25], [50, 0.15],
      ]),
      curveFactor: 0.0021,
      hillZones: { town: 1, industrial: 0.9, highway: 1 },
      gantries: [
        { seg: 30, cn: "觀塘", en: "KWUN TONG", sub: "17 km" },
        { seg: 260, cn: "葵涌", en: "KWAI CHUNG", sub: "CONTAINERS" },
        { seg: 480, cn: "九龍灣", en: "KOWLOON BAY", sub: "EXIT 5" },
        { seg: 700, cn: "觀塘", en: "KWUN TONG", sub: "3 km" },
        { seg: 880, cn: "觀塘市中心", en: "KWUN TONG CENTRAL", sub: "APM" },
        { seg: 940, cn: "終點", en: "TERMINUS", sub: "觀塘總站" },
      ],
      traffic: {
        types: ["truck", "van", "private", "taxi", "bus", "truck", "private", "bike"],
        initial: 15, spacing: 1900, maxAhead: 15,
        spawnInterval: [0.3, 0.7], spawnAhead: [21000, 40000], speedFactor: 1.0,
      },
      background: "city",
      cityFade: [0, 1, 1, 1],
      sky: ["#04050b", "#0b0b1d", "#25172e", "#482536", "#1a1520"],
      startToast: "<b>荃灣開出</b> · 觀塘，經葵涌同九龍灣。",
      mission: "由荃灣跨過<strong>葵涌</strong>、九龍灣入觀塘。貨車多，唔好跟太貼。",
      quote: "「荃灣去觀塘，半個鐘搞掂。」—— 貨車司機嘅微笑",
      strip: ["TW", "KC", "KB", "KT"],
      scoring: { finish: 8000, time: 430, condition: 130, rankS: 72000, rankA: 48000, rankB: 27000 },
      result: {
        winS: "你由荃灣剷到觀塘，貨櫃碼頭啲燈都追你唔到。跨九龍傳說。",
        winA: "順利到觀塘。乘客話：『下次都係搭你。』",
        winB: "安全到達觀塘。以紅VAN嚟講，算係非常克制。",
        winC: "你到觀塘。慢，但係到咗。乘客表示下次會搭巴士。",
        failTime: "時間到。觀塘嘅乘客已經轉咗搭港鐵。",
        failWreck: "架車散晒。拖車師傅話：『葵涌拖車，按貨櫃計。』",
        failOther: "未到觀塘。今晚嘅車費，當係買個教訓。",
      },
    },

    skop: {
      id: "skop",
      bestKey: "redvan-best-skop",
      originCn: "筲箕灣", originEn: "SHAU KEI WAN",
      destCn: "石澳", destEn: "SHEK O",
      hudCode: 'SKW <i>→</i> SO',
      distance: "12.4 KM", stagesLabel: "3 STAGES", destTag: "BEACH RUN. VERY SHARP.",
      shift: "夜更 07", difficulty: "HARD", difficultyPips: 5,
      summary: "筲箕灣入大潭，再落石澳。彎多路窄，海邊終點。",
      tags: ["TWISTY", "COAST", "BEACH"],
      timer: 40,
      totalSegs: 820,
      finishSeg: 800,
      checkpoints: [
        { seg: 300, cn: "大潭", en: "TAI TAM", line: "「大潭水塘啲路，窄過你條命。」", bonus: 8, repair: 16, fare: 5500 },
        { seg: 580, cn: "石澳道", en: "SHEK O ROAD", line: "「前面落斜，海邊就到。」", bonus: 8, repair: 16, fare: 5500 },
      ],
      stageNames: ["筲箕灣 · SHAU KEI WAN", "大潭 · TAI TAM", "石澳道 · SHEK O ROAD", "石澳 · SHEK O"],
      zones: [[200, "city"], [500, "hills"], [700, "coast"], [820, "rich"]],
      sections: makeSections(820, [
        [45, 0.02], [30, 0.45], [28, -0.7], [32, 0.8], [30, -0.75],
        [28, 0.65], [32, -0.85], [30, 0.7], [28, -0.6], [35, 0.55],
        [30, -0.65], [32, 0.5], [28, -0.45], [35, 0.35],
      ]),
      curveFactor: 0.0035,
      hillZones: { city: 1, hills: 2.3, coast: 1.25, rich: 1 },
      gantries: [
        { seg: 30, cn: "石澳", en: "SHEK O", sub: "12 km" },
        { seg: 150, cn: "大潭", en: "TAI TAM", sub: "NARROW" },
        { seg: 380, cn: "大潭", en: "TAI TAM", sub: "CHECKPOINT" },
        { seg: 540, cn: "石澳道", en: "SHEK O ROAD", sub: "SLOW" },
        { seg: 680, cn: "石澳", en: "SHEK O", sub: "BEACH" },
        { seg: 780, cn: "終點", en: "TERMINUS", sub: "石澳總站" },
      ],
      traffic: {
        types: ["sportRed", "sportYellow", "private", "taxi", "greenvan", "private", "sportSilver", "bike"],
        initial: 13, spacing: 1800, maxAhead: 14,
        spawnInterval: [0.3, 0.7], spawnAhead: [18000, 34000], speedFactor: 1.06,
        showroom: ["sportYellow", "sportRed"],
      },
      background: "bay",
      cityFade: [0, 180, -1, -1],
      sky: ["#03060f", "#08101f", "#17243a", "#3a2a35", "#10121a"],
      startToast: "<b>筲箕灣開出</b> · 石澳，山路窄，跑車多。",
      mission: "由筲箕灣上<strong>大潭</strong>，再落石澳。彎多路窄，檢查站只加 8 秒。",
      quote: "「石澳道，慢慢揸。」—— 一個冇人聽過嘅建議",
      strip: ["SKW", "TT", "SOR", "SO"],
      scoring: { finish: 9000, time: 460, condition: 150, rankS: 82000, rankA: 55000, rankB: 32000 },
      result: {
        winS: "你由筲箕灣飛到石澳，山路每個彎都啱線。沙灘上嘅人以為你係救生員。",
        winA: "順利到石澳。乘客落車即刻除鞋落沙灘，隻手仲震緊。",
        winB: "安全到達石澳。以紅VAN嚟講，算係非常有家教。",
        winC: "你到石澳。慢，但係到咗。乘客表示下次會搭巴士。",
        failTime: "時間到。石澳嘅太陽都落埋山，你仲未到。",
        failWreck: "架車散晒。拖車師傅話：『石澳道拖車，要等潮退。』",
        failOther: "未到石澳。今晚嘅車費，當係買個教訓。",
      },
    },
  };

  let activeRoute = ROUTES.mktm;
  const route = { segs: [], totalZ: 0, totalSegs: 0, finishZ: 0, cameras: [], crossings: [] };

  function zoneForSegment(i, def = activeRoute) {
    for (const [end, zone] of def.zones) {
      if (i < end) return zone;
    }
    return def.zones[def.zones.length - 1][1];
  }

  function buildRoute(def) {
    activeRoute = def;
    const total = def.totalSegs;
    const rawCurves = [];
    for (const [len, curve] of def.sections) {
      for (let i = 0; i < len; i++) rawCurves.push(curve);
    }
    while (rawCurves.length < total) rawCurves.push(0);
    rawCurves.length = total;

    // smooth section joins
    let curves = rawCurves;
    for (let pass = 0; pass < 2; pass++) {
      const out = new Array(total);
      const radius = 6;
      for (let i = 0; i < total; i++) {
        let sum = 0;
        let count = 0;
        for (let k = -radius; k <= radius; k++) {
          const j = clamp(i + k, 0, total - 1);
          sum += curves[j];
          count++;
        }
        out[i] = sum / count;
      }
      curves = out;
    }

    route.totalSegs = total;
    route.finishZ = def.finishSeg * SEG_LEN;
    route.totalZ = total * SEG_LEN;
    route.segs.length = 0;
    SPRITES.gantry.length = 0;
    gantryCache.clear();
    let heading = 0;
    let cx = 0;
    for (let i = 0; i < total; i++) {
      const curve = curves[i];
      heading += curve * def.curveFactor;
      cx += Math.sin(heading) * SEG_LEN;
      const zone = zoneForSegment(i, def);
      const hillScale = def.hillZones[zone] || 1;
      const y =
        (300 * Math.sin(i * 0.0043 + 0.7) +
          145 * Math.sin(i * 0.011 + 2.1) +
          55 * Math.sin(i * 0.027 + 0.2)) * hillScale;
      route.segs.push({
        i,
        curve,
        x: cx,
        y,
        z: i * SEG_LEN,
        zone,
        sprites: [],
      });
    }

    populateScenery(def);
    placeCameras(def);
    placeCrossings(def);
  }

  function placeCameras(def) {
    route.cameras = [];
    const total = route.totalSegs;
    const count = total > 1300 ? 3 : 2;
    const fractions = count === 3 ? [0.26, 0.54, 0.8] : [0.33, 0.72];
    const checkpointSegs = def.checkpoints.map((cp) => cp.seg);
    fractions.forEach((f, idx) => {
      let seg = Math.round(total * f);
      while (checkpointSegs.some((cp) => Math.abs(cp - seg) < 28)) seg += 30;
      if (seg >= def.finishSeg - 30) seg = def.finishSeg - 40;
      if (seg < 40) seg = 40;
      const side = idx % 2 === 0 ? -1 : 1;
      const roadSeg = route.segs[seg];
      if (!roadSeg) return;
      addSprite(roadSeg, "camera", 0, side * 1.27, false, 1);
      route.cameras.push({
        seg,
        z: roadSeg.z,
        limit: 80,
        side,
        triggered: false,
      });
    });
  }

  function addSprite(seg, cat, variant, offset, flip = false, scale = 1) {
    const sprite = { cat, variant, offset, flip, scale };
    seg.sprites.push(sprite);
    return sprite;
  }

  function placeCrossings(def) {
    route.crossings = [];
    const urban = ["city", "town", "rich", "industrial"];
    const cameraSegs = route.cameras.map((cam) => cam.seg);
    const checkpointSegs = def.checkpoints.map((cp) => cp.seg);
    let last = -999;
    for (let i = 120; i < def.finishSeg - 60; i++) {
      if (route.crossings.length >= 4) break;
      if (i - last < 230) continue;
      if (!urban.includes(zoneForSegment(i, def))) continue;
      if (cameraSegs.some((seg) => Math.abs(seg - i) < 36)) continue;
      if (checkpointSegs.some((seg) => Math.abs(seg - i) < 44)) continue;
      const seg = route.segs[i];
      if (!seg) continue;
      seg.crossing = true;
      const left = addSprite(seg, "trafficLight", 0, -1.27, false, 1);
      const right = addSprite(seg, "trafficLight", 0, 1.27, true, 1);
      route.crossings.push({
        seg: i,
        z: seg.z,
        spawned: false,
        active: false,
        phase: 0,
        timer: 0,
        notified: false,
        lights: [left, right],
      });
      last = i;
    }
  }

  function populateScenery(def) {
    const gantryAt = new Map(def.gantries.map((g) => [g.seg, g]));
    for (const seg of route.segs) {
      const i = seg.i;
      const zone = seg.zone;
      const rnd = mulberry32(i * 31 + 7);

      const gantry = gantryAt.get(i);
      if (gantry) {
        addSprite(seg, "gantry", getGantrySprite(gantry.cn, gantry.en, gantry.sub), 0, false, 1);
      }

      if (i % 9 === 0) {
        addSprite(seg, "lamp", i % 18 === 0 ? 0 : 1, i % 18 === 0 ? -1.19 : 1.19, i % 18 !== 0);
      }

      if (zone === "city" || zone === "town") {
        if (i % 7 === 0) {
          const side = rnd() < 0.5 ? -1 : 1;
          addSprite(seg, "building", Math.floor(rnd() * 6), side * (1.55 + rnd() * 0.52), false);
        }
        if (i % 19 === 0) {
          const side = rnd() < 0.55 ? -1 : 1;
          addSprite(seg, "billboard", Math.floor(rnd() * 5), side * (1.64 + rnd() * 0.28), false);
        }
        if (i % 23 === 0) {
          addSprite(seg, "tree", Math.floor(rnd() * 3), (rnd() < 0.5 ? -1 : 1) * 1.28, false, 0.8);
        }
        if (i % 6 === 0) addSprite(seg, "marker", 0, i % 12 === 0 ? -1.12 : 1.12, false, 1);
      } else if (zone === "highway") {
        if (i % 5 === 0) addSprite(seg, "marker", 0, -1.13, false, 1);
        if (i % 5 === 2) addSprite(seg, "marker", 0, 1.13, false, 1);
        if (i % 13 === 0) addSprite(seg, "tree", Math.floor(rnd() * 3), -1.32 - rnd() * 0.2, false, 0.9);
        if (i % 31 === 0) addSprite(seg, "billboard", Math.floor(rnd() * 5), 1.5, false);
      } else if (zone === "industrial") {
        if (i % 4 === 0) addSprite(seg, "marker", 0, i % 8 === 0 ? -1.13 : 1.13, false, 1);
        if (i % 10 === 0) {
          const side = i % 20 === 0 ? -1 : 1;
          addSprite(seg, "warehouse", Math.floor(rnd() * 3), side * (1.72 + rnd() * 0.18), false, 0.9);
        }
        if (i % 7 === 0) {
          addSprite(seg, "container", Math.floor(rnd() * 2), (rnd() < 0.5 ? -1 : 1) * 1.34, false, 1);
        }
        if (i % 23 === 0) {
          const side = rnd() < 0.5 ? -1 : 1;
          addSprite(seg, "billboard", Math.floor(rnd() * 5), side * 1.7, false);
        }
        if (i % 81 === 0) addSprite(seg, "crane", 0, 2.7, rnd() < 0.5, 1);
      } else if (zone === "hills") {
        if (i % 4 === 0) addSprite(seg, "marker", 0, i % 8 === 0 ? -1.13 : 1.13, false, 1);
        if (i % 6 === 0) addSprite(seg, "tree", Math.floor(rnd() * 3), -1.34 - rnd() * 0.28, false, 1.05);
        if (i % 7 === 0) addSprite(seg, "tree", Math.floor(rnd() * 3), 1.34 + rnd() * 0.3, false, 1.05);
        if (i % 15 === 0) addSprite(seg, "chevron", 0, i % 30 === 0 ? -1.18 : 1.18, i % 30 !== 0, 1);
        if (i % 13 === 0) addSprite(seg, "lamp", i % 26 === 0 ? 0 : 1, i % 26 === 0 ? -1.19 : 1.19, i % 26 !== 0);
      } else if (zone === "coast") {
        if (i % 6 === 0) addSprite(seg, "marker", 0, -1.12, false, 1);
        if (i % 6 === 3) addSprite(seg, "marker", 0, 1.12, true, 1);
        if (def.id === "mktm") {
          if (i % 8 === 0) addSprite(seg, "tree", Math.floor(rnd() * 3), -1.38 - rnd() * 0.32, false, 1.15);
          if (i % 17 === 0) addSprite(seg, "tree", Math.floor(rnd() * 3), -1.95, false, 1.5);
          if (i % 71 === 0) addSprite(seg, "crane", 0, 2.9, rnd() < 0.5, 1);
          if (i % 47 === 0) addSprite(seg, "billboard", Math.floor(rnd() * 5), 1.55, false);
        } else {
          if (i % 11 === 0) addSprite(seg, "palm", Math.floor(rnd() * 2), -1.3, false, 1.05);
          if (i % 34 === 0) addSprite(seg, "mansion", Math.floor(rnd() * 3), -1.68 - rnd() * 0.15, false, 0.86);
          if (i % 61 === 0) addSprite(seg, "yacht", Math.floor(rnd() * 2), 2.25 + rnd() * 0.8, false, 1);
          if (i % 47 === 0) addSprite(seg, "billboardLux", Math.floor(rnd() * 5), -1.62, false);
        }
      } else if (zone === "rich") {
        if (i % 6 === 0) addSprite(seg, "marker", 0, -1.12, false, 1);
        if (i % 9 === 0) addSprite(seg, "palm", Math.floor(rnd() * 2), -1.3, false, 1.1);
        if (i % 13 === 0) addSprite(seg, "mansion", Math.floor(rnd() * 3), -1.58 - rnd() * 0.22, false, 0.92);
        if (i % 29 === 0) addSprite(seg, "yacht", Math.floor(rnd() * 2), 2.4 + rnd() * 0.9, false, 1);
        if (i % 37 === 0) addSprite(seg, "billboardLux", Math.floor(rnd() * 5), -1.64, false);
        if (i % 21 === 0) addSprite(seg, "billboard", Math.floor(rnd() * 5), -1.8, false);
        if (i % 7 === 0) addSprite(seg, "marker", 0, 1.12, true, 1);
      }
    }
  }

