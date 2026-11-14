# 紅VAN飛車 · Red Van Daredevil

[![Release](https://img.shields.io/github/v/release/moonyuet/minibus_stimulator)](https://github.com/moonyuet/minibus_stimulator/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A playable, dependency-free browser game about the least sensible ways to cross Hong Kong by red public light bus, at night, with a countdown running. Seven routes are available, from the original **Mong Kok → Tsuen Mun** run to the twisty **Shau Kei Wan → Shek O** beach route. Fares pay for garage upgrades, special buses and map conditions; passengers scream, complain and get off at checkpoints; pedestrians and cyclists share the road, zebra crossings are controlled by traffic lights; speed cameras and a full wanted meter eventually bring the police down on you.

No frameworks, no build step, no external images or audio. The road, Hong Kong skyline, minibus, traffic, neon signs, engine sound and tyre noise are all generated in the browser with Canvas and the Web Audio API.

## Play / run locally

No build step, no npm install and no package manager are required. You only need a modern browser (Chrome, Edge, Safari or Firefox). Python 3 is optional and is used only to serve the files over a local HTTP server.

### Quick start

1. Download the latest packaged release from the [Releases page](https://github.com/moonyuet/minibus_stimulator/releases), or clone the repository:

   ```powershell
   git clone https://github.com/moonyuet/minibus_stimulator.git
   cd minibus_stimulator
   ```

   The release ZIP is named `minibus_stimulator-vX.Y.Z.zip` and already contains the game files and server helpers.

2. Start the local server with one of the options below.

3. Open <http://localhost:8080> in your browser.

4. Stop the server with `Ctrl+C`.

### Windows PowerShell

```powershell
cd path\to\minibus_stimulator
py -m http.server 8080
```

If `py` is not available, use:

```powershell
python -m http.server 8080
```

You can also use the included helper, which finds `py` or `python` for you:

```powershell
.\serve.ps1
# different port:
.\serve.ps1 -Port 8081
```

If PowerShell blocks local scripts, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\serve.ps1
```

### macOS / Linux shell

```bash
cd path/to/minibus_stimulator
python3 -m http.server 8080
```

Or use the included helper:

```bash
chmod +x serve.sh
./serve.sh
# different port:
./serve.sh 8081
```

Some systems expose Python as `python` rather than `python3`; both are handled by `serve.sh`.

### If Python is missing

- **Windows PowerShell:** `winget install -e --id Python.Python.3.12`, then reopen PowerShell.
- **macOS:** `brew install python`, or download Python from <https://www.python.org/downloads/>.
- **Ubuntu / Debian:** `sudo apt update && sudo apt install python3`
- **Fedora:** `sudo dnf install python3`

There is nothing else to install: no `pip install`, no `npm install` and no bundler.

### Troubleshooting

- **`python` opens the Microsoft Store:** use `py -m http.server 8080` instead.
- **Port 8080 is already in use:** use 8081 (`py -m http.server 8081` or `./serve.sh 8081`).
- **Opening `index.html` directly:** this generally works, but a local server is recommended so browser file-access rules do not interfere with storage or audio.

### Start the game

Click the current-route card to open the **Route Garage** (or press `1`–`7` on the start screen), pick a route, then click **開車 / START ENGINE** once to enable audio. The **車房 GARAGE** button opens upgrades, buses and map conditions.

## Routes

| # | Route | Distance | Difficulty | Character |
| --- | --- | --- | --- | --- |
| 01 | 旺角 → 屯門 | 33.9 km | Original | Highway + Tuen Mun Road coast |
| 02 | 灣仔 → 赤柱 | 18.6 km | Hard | Hills, Repulse Bay, supercars |
| 03 | 旺角 → 大埔 | 23.5 km | Medium | Lion Rock Tunnel + Sha Tin |
| 04 | 旺角 → 西貢 | 21.4 km | Medium | Choi Hung, Clear Water Bay, coast |
| 05 | 旺角 → 觀塘 | 11.2 km | Short | Dense urban sprint via Kowloon City |
| 06 | 荃灣 → 觀塘 | 17.0 km | Medium | Kwai Chung container port + Kowloon Bay |
| 07 | 筲箕灣 → 石澳 | 12.4 km | Hard | Tight Tai Tam hills and Shek O beach |

Every route has two checkpoints, its own timer, traffic mix, scoring balance, gantries and best-fare record. The original run starts at 62 seconds; the shorter and harder runs start with less time and give smaller checkpoint bonuses. Checkpoints always repair the van and pay a route-dependent fare.

The southern routes are the money routes: **Wan Chai → Stanley** and **Shau Kei Wan → Shek O** include fast lane-changing supercars that pay a premium on a near miss and cost much more if you hit them.

## Garage & money

Completed runs pay **70% of the fare** into the persistent wallet; failed runs still pay 18%. Bus and map bonuses multiply the deposit.

- **Parts:** engine (power/top speed), tyres (grip), brakes and turbo. Four levels each; prices rise per level.
- **Buses:** the classic red van, a gold edition with more speed and fare, and a neon edition with more grip, brakes and nitrous.
- **Maps:** standard night, rainy night (less grip, +25% fare) and rush hour (+35% traffic, +15% fare). They are bought once, then equipped.
- Everything is stored in `localStorage` under `redvan-profile-v1`.

## Passengers & street life

- **Speed reactions:** passengers scream when you go very fast and complain or laugh when you crawl along.
- **Crash reactions:** a crash triggers a scream and a shout from the back.
- **Pedestrians:** people wait at the curb on horizontal ladder-style zebra bars, then walk left-to-right across traffic when the pedestrian signal turns green. Honk with `H` to make them run.
- **Traffic lights:** each urban crossing has signal heads on both sides with green/amber/red car lights and a red/green walking-person signal. The horizontal white bars span the road width; the pedestrian green phase is announced in-game. Hitting a pedestrian still costs condition and time.
- **Bicycles:** slow cyclists wobble along the road. Squeeze past for a bell and a bonus; clipping one is a normal collision.
- **Speed cameras:** roadside 80 km/h cameras flash when you cross above the limit. The photo costs $800 and pushes up your wanted meter.
- **Police chase:** sustained speed, crashes and camera flashes fill the **通緝 / WANTED** meter. At 100% the sirens start, police cars join the road and a flashing chase banner appears. Survive 23 seconds or reach a checkpoint to lose them.
- **Police speeding fines:** while a police car is **visible on screen** and you hold 120 km/h or more, the fine is **$250 per second**. The fine comes out of the wallet first, then the current fare, and the running total appears in the chase banner.
- **Alighting:** after each checkpoint, a few passengers step out of the bus and walk to the side, with a door hiss and “唔該，有落！”.
- Passenger voices use `speechSynthesis` when a Chinese voice is available, with synthesized scream/laugh/angry fallbacks. `M` mutes all of it.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Select route (menu) | `1`–`7` | route garage button |
| Steer | `A` / `D` or `←` / `→` | ◀ ▶ |
| Accelerate | `W` / `↑` | GAS |
| Brake | `S` / `↓` | BRAKE |
| Nitrous | `Space` / `Shift` | N₂O |
| Horn | `H` | — |
| Pause | `P` / `Esc` | — |
| Mute | `M` | — |
| Restart result | `R` or `Enter` | buttons |

## How to get paid

- **Near miss** traffic to build a multiplier and refill nitrous. The closer the pass, the more it is worth. Supercars pay a premium.
- **Checkpoints** add time, repair the van and add a fare bonus (route-dependent).
- **Crashes** cost condition, time and your combo. Five bad ones and the night is over. Supercars are especially expensive.
- **Boost** burns nitrous for a higher top speed and a much worse survival probability.
- **Speed warning:** reaching 80 km/h gives a two-beep “bit bit” from a nasal dashboard-style buzzer; reaching 100 km/h gives four quicker “bit bit bit bit” bursts. Slow down below the threshold and the warning re-arms.
- **Time bonus and condition bonus** are paid at the terminus.
- **Wallet deposit:** 70% of the final fare (18% on a failed run), multiplied by the equipped bus/map bonuses.
- **Wanted meter:** builds above 108 km/h, after crashes, pedestrian hits and camera flashes. Below 75 km/h it cools down. A full meter starts a police chase.
- **Police speeding fines:** during a chase, every second at or above 120 km/h with a police car in view deducts $250 from the wallet, then from the current fare if the wallet is empty. If the police drop out of view, the fines stop until you see them again.
- **Speed cameras:** crossing an 80 km/h camera above the limit costs $800, 800 fare points and +24% wanted. Cameras reset on each run.
- **Rank S** needs a fast, clean, high-combo run. Rank D means the passengers are filing complaints.

## Notes

- All seven routes are defined in the `ROUTES` object in `js/routes.js`: road sections, zone boundaries, checkpoints, gantries, traffic mix, scoring, tags and result copy. The Route Garage is generated from that object, so adding another route means adding one entry.
- Best fares are stored per route in `localStorage` (`redvan-best-<route>`), with the original `redvan-best-v1` key still read for the Mong Kok route.
- Wallet, parts, owned buses/maps and equipped choices are stored separately in `redvan-profile-v1`.
- The game uses a pseudo-3D road renderer: precomputed curved road centres, perspective-projected road segments, procedural sprites and a fixed chase camera.
- Rendering keeps reusable gradients (sky, haze, ground, water, boost glow), a pre-rendered cloud layer and a reused sprite list instead of rebuilding them every frame. HUD writes are diffed so unchanged labels/styles are not touched 25 times per second.
- The minibus audio is layered: diesel combustion rattle, gearbox whine, intake/turbo hiss, tyre noise, a nasal piezo speed buzzer and formant-synthesized passenger voices. No external audio files or copyrighted samples are used.
- Gantry signs are generated per route on demand, so new place names do not require hand-drawn assets.
- New scenery sets include industrial warehouses and container stacks for the Kwun Tong routes, plus mansions, palms, yachts, luxury billboards and chevron boards for the southern routes. Red, yellow and silver supercars change lanes and exact a premium in both directions.
- Traffic includes city cyclists; the police interceptor and roadside speed cameras are separate procedural sprites. The police siren is a synthesized two-tone wail, not a sampled recording.
- No real minibus drivers were harmed. Several were not consulted.

## License

MIT © 2026 [moonyuet](https://github.com/moonyuet). See [LICENSE](LICENSE).

## Releases

Releases are published automatically by [`.github/workflows/release.yml`](.github/workflows/release.yml) when a `v*` tag is pushed. The action validates every JavaScript file, builds a ZIP release archive and its SHA-256 checksum, uploads a workflow artifact and creates the GitHub Release.

See the [Releases page](https://github.com/moonyuet/minibus_stimulator/releases) for the latest download.

## Project layout

```
minibus_stimulator/
├── .github/
│   └── workflows/
│       └── release.yml
├── index.html
├── styles/
│   └── styles.css
├── js/
│   ├── constants.js
│   ├── lib.js
│   ├── abstract.js
│   ├── assets.js
│   ├── routes.js
│   ├── audio.js
│   ├── state.js
│   ├── progression.js
│   ├── world.js
│   ├── gameplay.js
│   ├── hud.js
│   └── main.js
├── serve.ps1
├── serve.sh
├── LICENSE
└── README.md
```

The game is split into small classic scripts. There is no bundler: `index.html` loads them from `js/` in dependency order, and they share one global lexical scope.

| File | Responsibility |
| --- | --- |
| `index.html` | Screens, HUD and game shell |
| `styles/styles.css` | Neon Hong Kong art direction and responsive layout |
| `js/constants.js` | Tuning constants: road scale, speed limits, camera and draw distance |
| `js/lib.js` | Pure helpers: clamping, interpolation, seeded noise, formatting and canvas paths |
| `js/abstract.js` | Browser/canvas shell: DOM refs, viewport sizing, canvas surface and canvas factory |
| `js/assets.js` | Procedural sprites, scenery art and title/backdrop generation |
| `js/routes.js` | Route definitions, road geometry, scenery placement and speed-camera placement |
| `js/audio.js` | Web Audio engine, diesel layers, siren, warnings and passenger voices |
| `js/state.js` | Traffic type metadata, mutable run state and camera state |
| `js/progression.js` | Shop catalogue, wallet/profile persistence, route garage and garage UI |
| `js/world.js` | Road sampling, projection and the pseudo-3D renderer |
| `js/gameplay.js` | Input, run flow, traffic, collisions, scoring, pedestrians, heat and police |
| `js/hud.js` | HUD DOM updates and speedometer ticks |
| `js/main.js` | Main loop, event bindings and boot sequence |
| `serve.ps1` | Windows PowerShell helper for the local HTTP server |
| `serve.sh` | macOS/Linux shell helper for the local HTTP server |
| `.github/workflows/release.yml` | Tag-driven release build and GitHub Release |
| `LICENSE` | MIT license |

Load order matters because later files extend the same global lexical scope: `js/constants → js/lib → js/abstract → js/assets → js/routes → js/audio → js/state → js/progression → js/world → js/gameplay → js/hud → js/main`.
