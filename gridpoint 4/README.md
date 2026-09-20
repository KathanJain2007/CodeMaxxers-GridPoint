# GRIDPOINT — Intelligent Warehouse Location Optimization

> **"Turn demand density, geodesic transport physics, and capital infrastructure economics into one intelligent, mathematically optimal decision."**

GRIDPOINT is an enterprise-grade logistics intelligence web platform built for high-stakes supply chain decision making. Designed with a luxury Swiss editorial aesthetic, Bloomberg-caliber analytical rigor, and an interactive dark geospatial interface, GRIDPOINT solves the multi-facility Weber problem to determine the optimal number and geodetic locations of fulfillment centers.

---

## Key Capabilities

1. **Continuous Fermat-Weber Siting (Weiszfeld Algorithm)**
   - Replaces planar Euclidean approximations with true **Great-Circle Haversine Geodesics** (\(R = 6,371\text{ km}\)).
   - Solves \(\min_{W_k} \sum_{i} \text{DailyOrders}_i \times \text{Haversine}(P_i, W_k) \times \text{Rate}\) via iterative gradient descent.
   - Initialized with **order-weighted k-means++ seeding** to prevent local minima traps.

2. **Luxury Control-Room User Experience**
   - **Immersive Map (80% Viewport)**: CartoDB Dark Matter tiles, proportional demand markers, warehouse radar beacons, and dynamic transit arcs.
   - **Floating Frosted Glass HUD**: Minimalist Swiss control HUD floating directly over the map canvas.
   - **5-Stage Optimization Animation**: Step-by-step progress display (`ANALYZING DEMAND` → `CLUSTERING LOCATIONS` → `PLACING WAREHOUSES` → `ASSIGNING NEIGHBORHOODS` → `CALCULATING COST`).
   - **"WOW" Moment Result Banner**: Executive metrics displaying daily cost reduction (e.g. \(31.9\%\)), transit distance reduction, and 100% demand assignment.

3. **Dedicated Before vs After Comparison Suite**
   - **Split Screen**: Side-by-side comparison of baseline single-hub routing (Majestic Central Depot) vs decentralized multi-hub centroids.
   - **Interactive Transition Slider**: `BEFORE ←───────[•]───────→ AFTER` smoothly interpolates spend and distance.

4. **Scenario Lab (CapEx vs OpEx Trade-off)**
   - Computes network configurations for \(k = 1, 2, 3, 4, 5\) warehouses.
   - Interactive analytical SVG chart plotting variable transit cost vs fixed lease overhead to identify the exact **Economic Sweet Spot**.

5. **Demand Shock Stress Testing & Decision Support**
   - Simulates demand surges: Normal (\(100\%\)), Peak Day (\(+10\%\)), Festive Rush (\(+25\%\)), Flash Sale (\(+50\%\)), or custom slider (\(50\%\) to \(250\%\)).
   - Triggers `CAPACITY EXCEEDED` alerts and provides AI rebalancing recommendations.

6. **Algorithm Transparency ("Why this location?")**
   - Executive explainability and technical proofs for technical judges.
   - Breaks down demand pull percentages from anchor neighborhoods (Koramangala, Whitefield, Bellandur).

7. **Flexible Data Ingestion**
   - Drag-and-drop CSV importer with schema validator.
   - Interactive manual coordinate editor.
   - Embedded high-fidelity Bengaluru metropolitan dataset (28 micro-markets, ~11,200 orders/day).

8. **Executive Dossier**
   - One-click printable PDF summary formatted for C-level supply chain executives.

---

## Directory Structure

```
gridpoint/
├── server.py                        # Python HTTP & REST API server
├── index.html                       # Application shell & typography
├── start.bat                        # Double-click launch script
├── sample_demand_bengaluru.csv       # Sample CSV dataset for drag-and-drop testing
├── css/
│   └── styles.css                   # Swiss dark slate palette, radar pulse, glassmorphism
└── js/
    ├── data.js                      # Bengaluru dataset & CSV parser
    ├── algorithm.js                 # Haversine, Fermat-Weber solver, scenario models
    ├── bundle.js                    # Unified component bundle
    └── components/                  # Component source files
        ├── LandingPage.js
        ├── MapComponent.js
        ├── OptimizationAnimation.js
        ├── BeforeAfterComparison.js
        ├── WarehouseInspector.js
        ├── ScenarioLab.js
        ├── DemandShock.js
        ├── AnalyticsView.js
        ├── AlgorithmTransparency.js
        ├── DataImportModal.js
        ├── ExecutiveReportModal.js
        └── Workspace.js
```

---

## Quickstart

### Method 1: Using start.bat
Double-click `start.bat` in the `gridpoint` folder.

### Method 2: Command Line
```bash
cd "c:\Users\Ansh Gupta\Documents\gridpoint"
python server.py
```
Open **[http://localhost:3000](http://localhost:3000)** in any modern web browser.
