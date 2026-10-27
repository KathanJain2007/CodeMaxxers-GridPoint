# Shelvo — Warehouse Location Optimizer

**Where should a delivery company put its warehouses?** Shelvo takes neighbourhood-level order demand, finds the best number and location of fulfilment centres, and shows the cost saving against a single central hub on an interactive map.

Built by **Team CodeMaxxers** for a hackathon. (The project started as *GridPoint*, which is why some file names still use that name.)

On the built-in Bengaluru dataset (28 micro-markets, 11,230 orders/day), a 3-warehouse network cuts daily delivery cost by **31.9%** compared with one central depot.

---

## Features

- **Optimal warehouse siting** — solves the multi-facility Fermat–Weber problem using real great-circle (Haversine) distances.
- **Before vs after view** — side-by-side comparison of the single-hub baseline and the optimized network, with a slider between them.
- **Scenario Lab** — compares 1 to 5 warehouses and plots transport cost against fixed lease cost to find the sweet spot.
- **Demand shock testing** — simulates peak days, festive rush and flash sales (50%–250% of normal demand) and flags warehouses that run over capacity.
- **"Why this location?"** — explains each warehouse by showing which neighbourhoods pull it where it is.
- **Bring your own data** — drag-and-drop CSV import with validation, or edit coordinates by hand.
- **Inventory view** — per-warehouse stock levels by SKU.
- **AI assistant** — a logistics chatbot that answers questions about the current result (uses Google Gemini if an API key is set, otherwise built-in rule-based answers).
- **Executive report** — one-click printable summary of the result.
- **Accounts and projects** — sign up, save projects and keep a history of optimization runs.

## How the optimizer works

1. **Seeding:** weighted k-means++ picks starting warehouse locations, with each neighbourhood weighted by its daily orders. This avoids poor local minima.
2. **Assignment:** every neighbourhood is assigned to its nearest warehouse by Haversine distance (Earth radius 6,371 km).
3. **Relocation:** each warehouse is moved to the point that minimizes order-weighted distance to its neighbourhoods, using the Weiszfeld iterative algorithm.
4. Steps 2 and 3 repeat until the locations stop moving.

The objective is

```
minimize  Σ  DailyOrders(i) × Haversine(neighbourhood i, assigned warehouse) × cost per km
```

Two more modes are available: a **capacitated p-median** model (each warehouse has a capacity limit) and a **Pareto multi-objective** model that also penalizes routes that miss a delivery-time target (SLA). The solver is in [`js/algorithm.js`](js/algorithm.js).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Leaflet (CartoDB dark tiles), Tailwind CSS |
| Backend | Python standard library only (`http.server`) — no pip installs needed |
| Database | SQLite (created automatically on first run) |
| AI | Google Gemini API (optional) |
| Hosting | Netlify (static mode) or any machine with Python |

## Run it locally

You need **Python 3.9 or newer**. There is nothing to install.

```bash
git clone https://github.com/KathanJain2007/CodeMaxxers-GridPoint.git
cd CodeMaxxers-GridPoint
python server.py
```

Then open **http://localhost:3000**. On Windows you can also double-click `start.bat`.

The SQLite database (`gridpoint.db`) is created automatically the first time the server starts.

**Optional — AI chatbot:** set a Gemini API key before starting the server. Without it, the chatbot still works using built-in answers.

```bash
# macOS / Linux
export GEMINI_API_KEY=your_key_here
# Windows (PowerShell)
$env:GEMINI_API_KEY="your_key_here"
```

## Deploying without a backend

The app also runs as a plain static site (the repo includes `netlify.toml`). When it is not on `localhost` and no backend answers, [`js/mock_api.js`](js/mock_api.js) handles the API calls in the browser and stores data in `localStorage`, so login, projects and optimization all still work.

## Try it with your own data

Use **Import Demand** in the app and upload a CSV in this format (see [`sample_demand_bengaluru.csv`](sample_demand_bengaluru.csv)):

```csv
Neighborhood,Latitude,Longitude,Daily Orders
Koramangala,12.9352,77.6245,580
Indiranagar,12.9719,77.6412,520
```

## Project structure

```
├── server.py                     # HTTP server and REST API (/api/optimize, /api/projects, /api/chat, ...)
├── db.py                         # SQLite schema and queries
├── index.html                    # App shell
├── start.bat                     # Windows launcher
├── netlify.toml, _redirects      # Static hosting config
├── sample_demand_bengaluru.csv   # Sample dataset
├── css/styles.css
└── js/
    ├── algorithm.js              # Haversine, k-means++, Weiszfeld, p-median solvers
    ├── data.js                   # Bengaluru dataset and CSV parser
    ├── mock_api.js               # In-browser API for static hosting
    ├── app.js
    ├── bundle.js                 # Component bundle (source)
    ├── bundle.compiled.js        # Component bundle (compiled, loaded by index.html)
    └── components/               # Landing page, map, dashboard, scenario lab, demand shock,
                                  # before/after, inspector, analytics, chatbot, reports, auth
```

## Team

Team **CodeMaxxers** — [Kathan Jain](https://github.com/KathanJain2007), Aryan Khichar
