# SGATAR 2026 Transport Planner

A static web application for planning and simulating bus transport logistics for the SGATAR 2026 conference (7–10 September 2026, Marina Bay Sands, Singapore).

**Live:** <https://sgatar26transportplanner.app.tc1.airbase.sg>

---

## Features

- **Schedule** — view and inline-edit the full 4-day transport schedule; add or remove bus runs per service
- **Simulator** — model guest demand across a selected service with configurable buffer and variability; re-randomise instantly
- **Monte Carlo** — run up to 50 000 simulations to estimate overload probability and evaluate fleet-size trade-offs
- **CSV import/export** — download the live schedule as CSV; upload a revised CSV to replace it
- **Custom planner** — build an ad-hoc fleet independent of the scheduled routes and simulate it

---

## Prerequisites

| Tool                                                              | Minimum version | Purpose                           |
| ----------------------------------------------------------------- | --------------- | --------------------------------- |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 24              | Local development                 |
| [Airbase CLI](https://docs.airbase.sg)                            | latest          | Deployment to GovTech Airbase TC1 |

No Node.js, npm or build step is required — the application is pure static HTML/CSS/ES modules.

---

## Local development

```bash
# Build and start the container (detached)
docker compose up --build -d

# Open in browser
open http://localhost:8080
# or: start http://localhost:8080 (Windows)

# View logs
docker compose logs -f

# Stop
docker compose down
```

The compose file mounts `/var/cache/nginx`, `/var/run` and `/tmp` as in-memory tmpfs volumes so the container filesystem is effectively read-only — matching the Airbase runtime security posture.

---

## Airbase deployment

The app targets the **TC1** Airbase environment (`jw-iras/sgatar26transportplanner`).

### First-time setup

1. Log in with the Airbase CLI and ensure `airbase.json` is present at the project root.
2. Build and push the container image:

```bash
airbase container build
```

3. Deploy:

```bash
airbase container deploy --yes
```

The live URL follows the pattern:

```
https://<handle>.app.tc1.airbase.sg
```

### Subsequent deployments

```bash
airbase container build
airbase container deploy --yes
```

### Staging environment

```bash
airbase container deploy --yes staging
```

---

## Project structure

```
.
├── app.js                 # Entry point — imports modules, wires events
├── index.html             # Single-page shell (three tabpanels)
├── style.css              # Application styles
│
├── js/                    # ES modules (loaded natively — no bundler)
│   ├── data.js            # DEFAULT_SCHEDULE constant + ScheduleRow typedef
│   ├── state.js           # Shared mutable state (schedule, customBuses, …)
│   ├── utils.js           # Pure helpers: esc(), cls(), lbl(), lcg(), distribute(), mkBar()
│   ├── schedule.js        # group(), renderSched(), inline edit handlers
│   ├── simulator.js       # getSvcs(), simulate(), renderOut()
│   ├── monte-carlo.js     # runMonteCarlo(), mcFleetDelta(), renderMcOut()
│   ├── csv.js             # parseCSV(), downloadCSV(), handleFile()
│   ├── custom-planner.js  # mkBus(), renderCustom(), syncCustom()
│   └── tabs.js            # ARIA tablist keyboard/click navigation
│
├── nginx.conf             # nginx server block (port 8080, security headers, gzip)
├── Dockerfile             # gdssingapore/airbase:nginx-1.28 base image
├── docker-compose.yml     # Local dev with tmpfs read-only mounts
├── airbase.json           # Airbase handle + port declaration
├── jsconfig.json          # VS Code / checkJs configuration
└── .eslintrc.json         # ESLint rules (eslint:recommended + browser env)
```

### Module dependency graph

```
app.js
 ├── js/state.js        ← js/data.js
 ├── js/schedule.js     ← js/state.js, js/utils.js
 ├── js/simulator.js    ← js/state.js, js/schedule.js, js/utils.js
 ├── js/monte-carlo.js  ← js/utils.js
 ├── js/csv.js          ← js/state.js, js/utils.js
 ├── js/custom-planner.js ← js/state.js, js/utils.js
 └── js/tabs.js
```

`schedule.js` and `simulator.js` avoid a circular import via `state.onScheduleChange` — a callback set by `app.js` that calls both `renderSched()` and `populateSel()` whenever the schedule is structurally mutated.

---

## CSV format

The export and upload format has the following columns (order matters):

| Column       | Type          | Description                                |
| ------------ | ------------- | ------------------------------------------ |
| `Day`        | string        | Conference day label, e.g. `7 Sep (Mon)`   |
| `Service`    | string        | Route name, e.g. `Hotels → MBS (Morning)`  |
| `ArrivalBy`  | string        | Target arrival time or `—` for return runs |
| `BusId`      | string/number | Bus identifier                             |
| `From`       | string        | Pickup location                            |
| `To`         | string        | Drop-off location                          |
| `Depart`     | string        | Departure time (HH:MM)                     |
| `Arrive`     | string        | Arrival time (HH:MM or TBC)                |
| `PlannedPax` | integer       | Planned passenger count                    |
| `Capacity`   | integer       | Bus seat capacity                          |
| `Note`       | string        | Optional operational note                  |
| `LO`         | integer       | Number of Liaison Officers on board        |

Download the live schedule to obtain a template.

---

## Updating the schedule data

The compiled-in default schedule is in `js/data.js` (`DEFAULT_SCHEDULE` array). Each object follows the `ScheduleRow` typedef documented at the top of that file. Edit the array and redeploy to change the factory defaults.

Alternatively, upload a revised CSV at runtime — changes persist in-memory for the session and can be downloaded again after editing.

---

## Security

- Base image: `gdssingapore/airbase:nginx-1.28` (regularly updated, tracks nginx stable)
- Container runs as non-root user `app` (UID 999)
- Filesystem is effectively read-only (`read_only: true` in compose; tmpfs for nginx temp paths)
- No server-side code — attack surface is limited to static file serving
- All schedule data rendered via HTML-escaped strings (XSS-safe)
- Content Security Policy set in `nginx.conf`
