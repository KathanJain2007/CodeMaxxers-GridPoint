// SHELVO — Autonomous Static / Netlify Fallback Adapter
// Ensures 100% full-stack functionality (Auth, Dashboard, Projects, Fermat-Weber Optimization)
// works out of the box when deployed statically on Netlify without requiring a persistent backend server.

(function() {
  // Snapshot of responses from the Python backend (server.py), used when the app is deployed
  // as a static site with no backend. Regenerate by running server.py and saving its responses.
  const STATIC_SNAPSHOT = {"inventory": {"items": [{"sku": "APP-301", "name": "Reinforced Workwear Cargo Pants", "category": "Apparel & Uniforms", "unitCostInr": 1450.0, "minReorderLevel": 200, "optimalStockLevel": 750, "unitWeightKg": 0.8, "storageType": "Garment Shelving", "totalOnHand": 2220, "totalReserved": 100, "totalAvailable": 2120, "totalValuationInr": 3219000.0, "status": "OVERSTOCKED", "warehouseStock": {"WH-01": {"onHand": 720, "reserved": 30, "available": 690, "bay": "BAY-F1-03"}, "WH-02": {"onHand": 810, "reserved": 45, "available": 765, "bay": "BAY-F2-01"}, "WH-03": {"onHand": 690, "reserved": 25, "available": 665, "bay": "BAY-F1-11"}}}, {"sku": "APP-302", "name": "High-Visibility Reflective Safety Vests", "category": "Apparel & Uniforms", "unitCostInr": 350.0, "minReorderLevel": 200, "optimalStockLevel": 500, "unitWeightKg": 0.2, "storageType": "Bin Shelving", "totalOnHand": 1080, "totalReserved": 70, "totalAvailable": 1010, "totalValuationInr": 378000.0, "status": "LOW STOCK", "warehouseStock": {"WH-01": {"onHand": 110, "reserved": 20, "available": 90, "bay": "BAY-F3-01"}, "WH-02": {"onHand": 450, "reserved": 15, "available": 435, "bay": "BAY-F3-06"}, "WH-03": {"onHand": 520, "reserved": 35, "available": 485, "bay": "BAY-F2-08"}}}, {"sku": "ELC-001", "name": "Smart Lithium Battery Pack 48V", "category": "Electronics", "unitCostInr": 14500.0, "minReorderLevel": 100, "optimalStockLevel": 400, "unitWeightKg": 8.5, "storageType": "Hazardous / Dry Ambient", "totalOnHand": 815, "totalReserved": 70, "totalAvailable": 745, "totalValuationInr": 11817500.0, "status": "LOW STOCK", "warehouseStock": {"WH-01": {"onHand": 420, "reserved": 35, "available": 385, "bay": "BAY-A1-04"}, "WH-02": {"onHand": 85, "reserved": 20, "available": 65, "bay": "BAY-B2-11"}, "WH-03": {"onHand": 310, "reserved": 15, "available": 295, "bay": "BAY-A4-02"}}}, {"sku": "ELC-002", "name": "Ultra-Fast 65W GaN Chargers", "category": "Electronics", "unitCostInr": 1200.0, "minReorderLevel": 300, "optimalStockLevel": 1200, "unitWeightKg": 0.25, "storageType": "Standard Ambient", "totalOnHand": 3630, "totalReserved": 275, "totalAvailable": 3355, "totalValuationInr": 4356000.0, "status": "OVERSTOCKED", "warehouseStock": {"WH-01": {"onHand": 1250, "reserved": 110, "available": 1140, "bay": "BAY-A2-08"}, "WH-02": {"onHand": 980, "reserved": 75, "available": 905, "bay": "BAY-A1-09"}, "WH-03": {"onHand": 1400, "reserved": 90, "available": 1310, "bay": "BAY-B1-03"}}}, {"sku": "FMC-101", "name": "Cold-Pressed Sunflower Oil 5L", "category": "FMCG & Grocery", "unitCostInr": 680.0, "minReorderLevel": 250, "optimalStockLevel": 900, "unitWeightKg": 4.6, "storageType": "Pallet Rack Ambient", "totalOnHand": 1910, "totalReserved": 125, "totalAvailable": 1785, "totalValuationInr": 1298800.0, "status": "LOW STOCK", "warehouseStock": {"WH-01": {"onHand": 850, "reserved": 45, "available": 805, "bay": "BAY-C1-01"}, "WH-02": {"onHand": 120, "reserved": 30, "available": 90, "bay": "BAY-C2-05"}, "WH-03": {"onHand": 940, "reserved": 50, "available": 890, "bay": "BAY-C1-14"}}}, {"sku": "FMC-102", "name": "Organic Aged Basmati Rice 10kg", "category": "FMCG & Grocery", "unitCostInr": 950.0, "minReorderLevel": 500, "optimalStockLevel": 2000, "unitWeightKg": 10.0, "storageType": "Bulk Pallet Floor", "totalOnHand": 6350, "totalReserved": 420, "totalAvailable": 5930, "totalValuationInr": 6032500.0, "status": "OVERSTOCKED", "warehouseStock": {"WH-01": {"onHand": 2100, "reserved": 140, "available": 1960, "bay": "BAY-D1-01"}, "WH-02": {"onHand": 1850, "reserved": 120, "available": 1730, "bay": "BAY-D1-04"}, "WH-03": {"onHand": 2400, "reserved": 160, "available": 2240, "bay": "BAY-D2-02"}}}, {"sku": "FMC-103", "name": "Artisan Dark Roast Coffee Beans 1kg", "category": "FMCG & Grocery", "unitCostInr": 850.0, "minReorderLevel": 150, "optimalStockLevel": 600, "unitWeightKg": 1.0, "storageType": "Aroma-Sealed Storage", "totalOnHand": 1175, "totalReserved": 80, "totalAvailable": 1095, "totalValuationInr": 998750.0, "status": "CRITICAL", "warehouseStock": {"WH-01": {"onHand": 45, "reserved": 15, "available": 30, "bay": "BAY-C3-02"}, "WH-02": {"onHand": 620, "reserved": 40, "available": 580, "bay": "BAY-C3-08"}, "WH-03": {"onHand": 510, "reserved": 25, "available": 485, "bay": "BAY-C2-12"}}}, {"sku": "PHR-201", "name": "Temperature-Monitored Insulin Vials 100IU", "category": "Healthcare & Cold-Chain", "unitCostInr": 2400.0, "minReorderLevel": 120, "optimalStockLevel": 350, "unitWeightKg": 0.15, "storageType": "Cold Room (2°C - 8°C)", "totalOnHand": 690, "totalReserved": 55, "totalAvailable": 635, "totalValuationInr": 1656000.0, "status": "LOW STOCK", "warehouseStock": {"WH-01": {"onHand": 340, "reserved": 25, "available": 315, "bay": "COLD-ZONE-1"}, "WH-02": {"onHand": 290, "reserved": 18, "available": 272, "bay": "COLD-ZONE-2"}, "WH-03": {"onHand": 60, "reserved": 12, "available": 48, "bay": "COLD-ZONE-1"}}}, {"sku": "PHR-202", "name": "Rapid Antigen Diagnostic Kits (25pk)", "category": "Healthcare & Cold-Chain", "unitCostInr": 1100.0, "minReorderLevel": 400, "optimalStockLevel": 1500, "unitWeightKg": 0.4, "storageType": "Climate-Controlled Ambient", "totalOnHand": 4850, "totalReserved": 235, "totalAvailable": 4615, "totalValuationInr": 5335000.0, "status": "OVERSTOCKED", "warehouseStock": {"WH-01": {"onHand": 1800, "reserved": 90, "available": 1710, "bay": "BAY-E1-04"}, "WH-02": {"onHand": 1450, "reserved": 65, "available": 1385, "bay": "BAY-E1-09"}, "WH-03": {"onHand": 1600, "reserved": 80, "available": 1520, "bay": "BAY-E2-01"}}}, {"sku": "HOM-601", "name": "Smart HEPA H13 Air Purifier Cartridges", "category": "Home & Appliances", "unitCostInr": 1850.0, "minReorderLevel": 150, "optimalStockLevel": 400, "unitWeightKg": 0.9, "storageType": "Standard Ambient", "totalOnHand": 685, "totalReserved": 60, "totalAvailable": 625, "totalValuationInr": 1267250.0, "status": "LOW STOCK", "warehouseStock": {"WH-01": {"onHand": 280, "reserved": 25, "available": 255, "bay": "BAY-J1-02"}, "WH-02": {"onHand": 310, "reserved": 20, "available": 290, "bay": "BAY-J2-04"}, "WH-03": {"onHand": 95, "reserved": 15, "available": 80, "bay": "BAY-J1-08"}}}, {"sku": "IND-401", "name": "Industrial Conveyor Steel Bearings", "category": "Industrial Spares", "unitCostInr": 3200.0, "minReorderLevel": 100, "optimalStockLevel": 500, "unitWeightKg": 2.2, "storageType": "Heavy Parts Storage", "totalOnHand": 990, "totalReserved": 70, "totalAvailable": 920, "totalValuationInr": 3168000.0, "status": "LOW STOCK", "warehouseStock": {"WH-01": {"onHand": 530, "reserved": 40, "available": 490, "bay": "BAY-G1-02"}, "WH-02": {"onHand": 420, "reserved": 20, "available": 400, "bay": "BAY-G2-04"}, "WH-03": {"onHand": 40, "reserved": 10, "available": 30, "bay": "BAY-G1-07"}}}, {"sku": "IND-402", "name": "Heavy-Duty Hydraulic Hose Assemblies", "category": "Industrial Spares", "unitCostInr": 2800.0, "minReorderLevel": 80, "optimalStockLevel": 300, "unitWeightKg": 3.4, "storageType": "Heavy Parts Storage", "totalOnHand": 875, "totalReserved": 47, "totalAvailable": 828, "totalValuationInr": 2450000.0, "status": "OVERSTOCKED", "warehouseStock": {"WH-01": {"onHand": 290, "reserved": 15, "available": 275, "bay": "BAY-G3-01"}, "WH-02": {"onHand": 310, "reserved": 20, "available": 290, "bay": "BAY-G3-05"}, "WH-03": {"onHand": 275, "reserved": 12, "available": 263, "bay": "BAY-G2-11"}}}, {"sku": "PKG-501", "name": "Biodegradable Air-Cushion Packaging Rolls", "category": "Packaging & Supplies", "unitCostInr": 420.0, "minReorderLevel": 800, "optimalStockLevel": 3000, "unitWeightKg": 5.0, "storageType": "Bulk Packaging Racks", "totalOnHand": 9400, "totalReserved": 530, "totalAvailable": 8870, "totalValuationInr": 3948000.0, "status": "OVERSTOCKED", "warehouseStock": {"WH-01": {"onHand": 3400, "reserved": 200, "available": 3200, "bay": "BAY-H1-01"}, "WH-02": {"onHand": 2900, "reserved": 150, "available": 2750, "bay": "BAY-H1-05"}, "WH-03": {"onHand": 3100, "reserved": 180, "available": 2920, "bay": "BAY-H2-03"}}}], "stats": {"totalSkus": 13, "totalUnitsOnHand": 34670, "totalValuationInr": 45924800.0, "lowStockCount": 6, "criticalStockCount": 1, "healthyStockCount": 6, "categories": {"Apparel & Uniforms": {"count": 2, "units": 3300, "valuationInr": 3597000.0}, "Electronics": {"count": 2, "units": 4445, "valuationInr": 16173500.0}, "FMCG & Grocery": {"count": 3, "units": 9435, "valuationInr": 8330050.0}, "Healthcare & Cold-Chain": {"count": 2, "units": 5540, "valuationInr": 6991000.0}, "Home & Appliances": {"count": 1, "units": 685, "valuationInr": 1267250.0}, "Industrial Spares": {"count": 2, "units": 1865, "valuationInr": 5618000.0}, "Packaging & Supplies": {"count": 1, "units": 9400, "valuationInr": 3948000.0}}}, "lowStockAlerts": [{"sku": "APP-302", "name": "High-Visibility Reflective Safety Vests", "category": "Apparel & Uniforms", "unitCostInr": 350.0, "minReorderLevel": 200, "optimalStockLevel": 500, "unitWeightKg": 0.2, "storageType": "Bin Shelving", "totalOnHand": 1080, "totalReserved": 70, "totalAvailable": 1010, "totalValuationInr": 378000.0, "status": "LOW STOCK", "warehouseStock": {"WH-01": {"onHand": 110, "reserved": 20, "available": 90, "bay": "BAY-F3-01"}, "WH-02": {"onHand": 450, "reserved": 15, "available": 435, "bay": "BAY-F3-06"}, "WH-03": {"onHand": 520, "reserved": 35, "available": 485, "bay": "BAY-F2-08"}}}, {"sku": "ELC-001", "name": "Smart Lithium Battery Pack 48V", "category": "Electronics", "unitCostInr": 14500.0, "minReorderLevel": 100, "optimalStockLevel": 400, "unitWeightKg": 8.5, "storageType": "Hazardous / Dry Ambient", "totalOnHand": 815, "totalReserved": 70, "totalAvailable": 745, "totalValuationInr": 11817500.0, "status": "LOW STOCK", "warehouseStock": {"WH-01": {"onHand": 420, "reserved": 35, "available": 385, "bay": "BAY-A1-04"}, "WH-02": {"onHand": 85, "reserved": 20, "available": 65, "bay": "BAY-B2-11"}, "WH-03": {"onHand": 310, "reserved": 15, "available": 295, "bay": "BAY-A4-02"}}}, {"sku": "FMC-101", "name": "Cold-Pressed Sunflower Oil 5L", "category": "FMCG & Grocery", "unitCostInr": 680.0, "minReorderLevel": 250, "optimalStockLevel": 900, "unitWeightKg": 4.6, "storageType": "Pallet Rack Ambient", "totalOnHand": 1910, "totalReserved": 125, "totalAvailable": 1785, "totalValuationInr": 1298800.0, "status": "LOW STOCK", "warehouseStock": {"WH-01": {"onHand": 850, "reserved": 45, "available": 805, "bay": "BAY-C1-01"}, "WH-02": {"onHand": 120, "reserved": 30, "available": 90, "bay": "BAY-C2-05"}, "WH-03": {"onHand": 940, "reserved": 50, "available": 890, "bay": "BAY-C1-14"}}}, {"sku": "FMC-103", "name": "Artisan Dark Roast Coffee Beans 1kg", "category": "FMCG & Grocery", "unitCostInr": 850.0, "minReorderLevel": 150, "optimalStockLevel": 600, "unitWeightKg": 1.0, "storageType": "Aroma-Sealed Storage", "totalOnHand": 1175, "totalReserved": 80, "totalAvailable": 1095, "totalValuationInr": 998750.0, "status": "CRITICAL", "warehouseStock": {"WH-01": {"onHand": 45, "reserved": 15, "available": 30, "bay": "BAY-C3-02"}, "WH-02": {"onHand": 620, "reserved": 40, "available": 580, "bay": "BAY-C3-08"}, "WH-03": {"onHand": 510, "reserved": 25, "available": 485, "bay": "BAY-C2-12"}}}, {"sku": "PHR-201", "name": "Temperature-Monitored Insulin Vials 100IU", "category": "Healthcare & Cold-Chain", "unitCostInr": 2400.0, "minReorderLevel": 120, "optimalStockLevel": 350, "unitWeightKg": 0.15, "storageType": "Cold Room (2°C - 8°C)", "totalOnHand": 690, "totalReserved": 55, "totalAvailable": 635, "totalValuationInr": 1656000.0, "status": "LOW STOCK", "warehouseStock": {"WH-01": {"onHand": 340, "reserved": 25, "available": 315, "bay": "COLD-ZONE-1"}, "WH-02": {"onHand": 290, "reserved": 18, "available": 272, "bay": "COLD-ZONE-2"}, "WH-03": {"onHand": 60, "reserved": 12, "available": 48, "bay": "COLD-ZONE-1"}}}, {"sku": "HOM-601", "name": "Smart HEPA H13 Air Purifier Cartridges", "category": "Home & Appliances", "unitCostInr": 1850.0, "minReorderLevel": 150, "optimalStockLevel": 400, "unitWeightKg": 0.9, "storageType": "Standard Ambient", "totalOnHand": 685, "totalReserved": 60, "totalAvailable": 625, "totalValuationInr": 1267250.0, "status": "LOW STOCK", "warehouseStock": {"WH-01": {"onHand": 280, "reserved": 25, "available": 255, "bay": "BAY-J1-02"}, "WH-02": {"onHand": 310, "reserved": 20, "available": 290, "bay": "BAY-J2-04"}, "WH-03": {"onHand": 95, "reserved": 15, "available": 80, "bay": "BAY-J1-08"}}}, {"sku": "IND-401", "name": "Industrial Conveyor Steel Bearings", "category": "Industrial Spares", "unitCostInr": 3200.0, "minReorderLevel": 100, "optimalStockLevel": 500, "unitWeightKg": 2.2, "storageType": "Heavy Parts Storage", "totalOnHand": 990, "totalReserved": 70, "totalAvailable": 920, "totalValuationInr": 3168000.0, "status": "LOW STOCK", "warehouseStock": {"WH-01": {"onHand": 530, "reserved": 40, "available": 490, "bay": "BAY-G1-02"}, "WH-02": {"onHand": 420, "reserved": 20, "available": 400, "bay": "BAY-G2-04"}, "WH-03": {"onHand": 40, "reserved": 10, "available": 30, "bay": "BAY-G1-07"}}}]}, "chat": {"rebalance": {"reply": "### Intelligent Stock Rebalancing & Intra-Hub Dispatch Plan\n\nBased on real-time inventory levels across our **3 metropolitan hubs**, here is the mathematically optimal intra-hub transfer plan to eliminate stockouts without waiting for supplier lead times:\n\n1. **Artisan Coffee Beans (`FMC-103`) — CRITICAL RESOLUTION:**\n   - **Current Deficit:** `WH-01` (Peenya) has only **45 units** remaining (Critical stockout hazard).\n   - **Surplus Source:** `WH-02` (Whitefield) has **620 units** (103% of optimal buffer).\n   - **Action:** Dispatch **300 units** from `WH-02` → `WH-01` via Outer Ring Road corridor (~32 km).\n\n2. **Lithium Battery Packs 48V (`ELC-001`) — HIGH PRIORITY:**\n   - **Current Deficit:** `WH-02` (Whitefield) is at **85 units** (below 100-unit safety threshold).\n   - **Surplus Source:** `WH-01` (Peenya) has **420 units** on hand.\n   - **Action:** Dispatch **150 units** from `WH-01` → `WH-02` to support East tech corridor commercial demand.\n\n3. **Cold-Chain Insulin Vials (`PHR-201`) — TEMPERATURE CONTROLLED:**\n   - **Current Deficit:** `WH-03` (Electronic City) has only **60 units** (Safety minimum: 120).\n   - **Surplus Source:** `WH-01` has **340 units** in certified cold room (2°C-8°C).\n   - **Action:** Transfer **120 units** using dedicated reefer EV Van #04.\n\n> [!TIP]\n> Executing these 3 internal transfers prevents ₹1.85L in lost sales and maintains 99.4% SLA adherence across all micro-markets.\n", "source": "ShelVO AI", "capacityCards": [{"code": "WH-01", "name": "North Fulfillment Hub (Peenya / Yeshwanthpur)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 3200, "palletsUsed": 552, "status": "STANDBY", "statusColor": "#8E96A4"}, {"code": "WH-02", "name": "East Tech Corridor Hub (Whitefield / Mahadevapura)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 2700, "palletsUsed": 482, "status": "STANDBY", "statusColor": "#8E96A4"}, {"code": "WH-03", "name": "South Electronic City Hub (Bommanahalli / EC)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 3000, "palletsUsed": 543, "status": "STANDBY", "statusColor": "#8E96A4"}], "inventoryAlerts": [{"sku": "APP-302", "name": "High-Visibility Reflective Safety Vests", "status": "LOW STOCK", "totalOnHand": 1080, "minReorder": 200}, {"sku": "ELC-001", "name": "Smart Lithium Battery Pack 48V", "status": "LOW STOCK", "totalOnHand": 815, "minReorder": 100}, {"sku": "FMC-101", "name": "Cold-Pressed Sunflower Oil 5L", "status": "LOW STOCK", "totalOnHand": 1910, "minReorder": 250}, {"sku": "FMC-103", "name": "Artisan Dark Roast Coffee Beans 1kg", "status": "CRITICAL", "totalOnHand": 1175, "minReorder": 150}], "suggestedActions": [{"label": "📦 Open Inventory Dossier", "action": "OPEN_INVENTORY_TABLE"}, {"label": "🏢 View Hub Capacities", "action": "CHAT_CAPACITY"}, {"label": "⚡ Simulate Demand Surge", "action": "OPEN_DEMAND_SHOCK"}]}, "import": {"reply": "### How to Ingest Custom Delivery Demand Data\n\nGRIDPOINT provides a flexible drag-and-drop CSV parser with real-time schema validation:\n\n1. **Click `IMPORT DEMAND`** in the top navigation bar.\n2. Prepare your CSV file with the following headers:\n   ```csv\n   neighborhood,latitude,longitude,dailyOrders\n   Koramangala,12.9352,77.6245,1450\n   Whitefield,12.9698,77.7499,1200\n   Indiranagar,12.9784,77.6408,950\n   ```\n3. **Format Specifications:**\n   - `neighborhood`: Name of the delivery zone or micro-market (string).\n   - `latitude`: WGS84 decimal latitude (e.g. `12.9352`).\n   - `longitude`: WGS84 decimal longitude (e.g. `77.6245`).\n   - `dailyOrders`: Daily package delivery volume (integer).\n4. Once dropped, the system validates all coordinates and recalculates the continuous Fermat-Weber centroids instantly!\n", "source": "ShelVO AI", "capacityCards": [], "inventoryAlerts": [], "suggestedActions": [{"label": "📂 Open Import Demand Modal", "action": "OPEN_IMPORT"}, {"label": "🗺️ Reset to Demo Dataset", "action": "LOAD_DEMO"}]}, "stress": {"reply": "### Demand Shock Stress Testing & Peak Sizing\n\nThe **Demand Shock Lab** allows you to simulate high-stakes volume spikes to guarantee network resilience:\n\n- **Normal Baseline (100%):** Regular daily run-rate (~11,200 orders across Bengaluru).\n- **Peak Day (+10%):** Standard Monday or month-end delivery spike.\n- **Festive Rush (+25%):** Diwali / Big Billion Days volume surge (~14,000 orders/day).\n- **Flash Sale (+50%):** Hyper-demand surge (~16,800 orders/day) testing facility breaking points.\n- **Custom Stress Slider:** Test any load from **50% to 250%**.\n\nWhen a warehouse crosses its capacity ceiling, the system raises a **`CAPACITY EXCEEDED`** alert and provides automated load-shedding and rebalancing recommendations.\n", "source": "ShelVO AI", "capacityCards": [{"code": "WH-01", "name": "North Fulfillment Hub (Peenya / Yeshwanthpur)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 3200, "palletsUsed": 552, "status": "STANDBY", "statusColor": "#8E96A4"}, {"code": "WH-02", "name": "East Tech Corridor Hub (Whitefield / Mahadevapura)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 2700, "palletsUsed": 482, "status": "STANDBY", "statusColor": "#8E96A4"}, {"code": "WH-03", "name": "South Electronic City Hub (Bommanahalli / EC)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 3000, "palletsUsed": 543, "status": "STANDBY", "statusColor": "#8E96A4"}], "inventoryAlerts": [], "suggestedActions": [{"label": "⚡ Open Demand Shock Lab", "action": "OPEN_DEMAND_SHOCK"}, {"label": "🏢 View Hub Capacities", "action": "CHAT_CAPACITY"}]}, "scenario": {"reply": "### Scenario Lab: CapEx vs OpEx Trade-off Sweet Spot\n\nScenario Lab computes multi-facility siting for **k = 1, 2, 3, 4, and 5 fulfillment hubs** simultaneously:\n\n- **Variable Transit Cost (OpEx):** Decreases monotonically as you add more hubs closer to demand clusters (from ₹2.13L/day at k=1 down to ₹1.05L/day at k=5).\n- **Fixed Infrastructure Lease (CapEx):** Increases linearly with each new facility (₹38,000/hub/day).\n- **Economic Sweet Spot:** At **k = 3 Hubs**, total system spend (Transit + Lease) reaches its global minimum at **₹2.59 Lakhs/day**.\n\nAdding a 4th hub saves only ₹14,000 in transit cost while adding ₹38,000 in fixed lease overhead, proving mathematically that 3 hubs is optimal for the current Bengaluru demand profile.\n", "source": "ShelVO AI", "capacityCards": [{"code": "WH-01", "name": "North Fulfillment Hub (Peenya / Yeshwanthpur)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 3200, "palletsUsed": 552, "status": "STANDBY", "statusColor": "#8E96A4"}, {"code": "WH-02", "name": "East Tech Corridor Hub (Whitefield / Mahadevapura)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 2700, "palletsUsed": 482, "status": "STANDBY", "statusColor": "#8E96A4"}, {"code": "WH-03", "name": "South Electronic City Hub (Bommanahalli / EC)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 3000, "palletsUsed": 543, "status": "STANDBY", "statusColor": "#8E96A4"}], "inventoryAlerts": [], "suggestedActions": [{"label": "🔬 Open Scenario Lab", "action": "OPEN_SCENARIOS"}, {"label": "🔄 Compare Before vs After", "action": "OPEN_BEFORE_AFTER"}]}, "cost": {"reply": "### Supply Chain Economics & Cost Reduction Dossier\n\nBy replacing legacy single-hub routing (Majestic Central Depot) with our **3 decentralized centroids**, the network delivers measurable P&L gains:\n\n- **Daily Last-Mile Transit Cost:** **₹145,000.00 / day** (down from ₹213,000.00/day).\n- **Daily Operating Savings:** **₹68,000.00 / day** (**31.9% spend reduction**).\n- **Annualized Savings:** **₹2.48 Crores / year**.\n- **Fleet Distance Reduction:** **35.6% less vehicle transit kilometers**.\n- **Environmental Impact:** **185 kg CO2 emissions eliminated daily** (green fleet compliance).\n", "source": "ShelVO AI", "capacityCards": [{"code": "WH-01", "name": "North Fulfillment Hub (Peenya / Yeshwanthpur)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 3200, "palletsUsed": 552, "status": "STANDBY", "statusColor": "#8E96A4"}, {"code": "WH-02", "name": "East Tech Corridor Hub (Whitefield / Mahadevapura)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 2700, "palletsUsed": 482, "status": "STANDBY", "statusColor": "#8E96A4"}, {"code": "WH-03", "name": "South Electronic City Hub (Bommanahalli / EC)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 3000, "palletsUsed": 543, "status": "STANDBY", "statusColor": "#8E96A4"}], "inventoryAlerts": [], "suggestedActions": [{"label": "🔄 Open Before vs After Comparison", "action": "OPEN_BEFORE_AFTER"}, {"label": "📊 View Executive Report Dossier", "action": "OPEN_REPORT"}]}, "capacity": {"reply": "### Warehouse Network Capacity & Throughput Intelligence\n\nOur active fulfillment network consists of **3 primary hubs** serving **28 Bengaluru micro-markets**:\n\n- **Total Network Processing Capacity:** **15,000 orders/day**\n- **Current Assigned Daily Demand:** **0 orders/day**\n- **Composite Network Utilization:** **0%**\n- **Reserve Headroom:** **+15,000 orders/day**\n\n#### Hub Capacity Breakdown:\n\n- **WH-01 — North Fulfillment Hub (Peenya / Yeshwanthpur)**:\n  - **Throughput Load:** **0** / 5,000 orders/day (`[░░░░░░░░░░] 0%`)\n  - **Pallet Storage:** **552** / 3,200 pallet bays (17% occupied)\n  - **Operational Status:** **STANDBY** | Available Headroom: **+5,000 orders/day**\n  - **Fleet & Infrastructure:** 18 EV delivery vans, 8 in / 12 out docks.\n\n- **WH-02 — East Tech Corridor Hub (Whitefield / Mahadevapura)**:\n  - **Throughput Load:** **0** / 5,000 orders/day (`[░░░░░░░░░░] 0%`)\n  - **Pallet Storage:** **482** / 2,700 pallet bays (18% occupied)\n  - **Operational Status:** **STANDBY** | Available Headroom: **+5,000 orders/day**\n  - **Fleet & Infrastructure:** 14 EV delivery vans, 6 in / 8 out docks.\n\n- **WH-03 — South Electronic City Hub (Bommanahalli / EC)**:\n  - **Throughput Load:** **0** / 5,000 orders/day (`[░░░░░░░░░░] 0%`)\n  - **Pallet Storage:** **543** / 3,000 pallet bays (18% occupied)\n  - **Operational Status:** **STANDBY** | Available Headroom: **+5,000 orders/day**\n  - **Fleet & Infrastructure:** 16 EV delivery vans, 8 in / 10 out docks.\n\n\n", "source": "ShelVO AI", "capacityCards": [{"code": "WH-01", "name": "North Fulfillment Hub (Peenya / Yeshwanthpur)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 3200, "palletsUsed": 552, "status": "STANDBY", "statusColor": "#8E96A4"}, {"code": "WH-02", "name": "East Tech Corridor Hub (Whitefield / Mahadevapura)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 2700, "palletsUsed": 482, "status": "STANDBY", "statusColor": "#8E96A4"}, {"code": "WH-03", "name": "South Electronic City Hub (Bommanahalli / EC)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 3000, "palletsUsed": 543, "status": "STANDBY", "statusColor": "#8E96A4"}], "inventoryAlerts": [{"sku": "APP-302", "name": "High-Visibility Reflective Safety Vests", "status": "LOW STOCK", "totalOnHand": 1080, "minReorder": 200}, {"sku": "ELC-001", "name": "Smart Lithium Battery Pack 48V", "status": "LOW STOCK", "totalOnHand": 815, "minReorder": 100}, {"sku": "FMC-101", "name": "Cold-Pressed Sunflower Oil 5L", "status": "LOW STOCK", "totalOnHand": 1910, "minReorder": 250}, {"sku": "FMC-103", "name": "Artisan Dark Roast Coffee Beans 1kg", "status": "CRITICAL", "totalOnHand": 1175, "minReorder": 150}], "suggestedActions": [{"label": "⚡ Run Demand Shock Test", "action": "OPEN_DEMAND_SHOCK"}, {"label": "🔬 Evaluate 4 Hubs in Scenario Lab", "action": "OPEN_SCENARIOS"}, {"label": "📦 View Stock Inventory", "action": "OPEN_INVENTORY_TABLE"}]}, "inventory": {"reply": "### Enterprise Stock Inventory Intelligence Overview\n\nGRIDPOINT tracks **13 core SKUs** distributed across fulfillment hubs:\n\n- **Total Stock on Hand:** **34,670 units**\n- **Aggregate Inventory Valuation:** **₹4.59 Crores** (₹45,924,800.00)\n- **Inventory Health Status:**\n  - ✅ **Healthy / Optimal:** 6 SKUs\n  - ⚠️ **Low Stock (Reorder Needed):** 6 SKUs (`APP-302`, `ELC-001`, `FMC-101`, `PHR-201`, `HOM-601`, `IND-401`)\n  - 🚨 **Critical Stockout Risk:** 1 SKU (`FMC-103` (Artisan Dark Roast Coffee Beans 1kg))\n\n#### Category Breakdown:\n- **Apparel & Uniforms:** 2 SKUs | 3,300 units | ₹35.97 Lakhs\n- **Electronics:** 2 SKUs | 4,445 units | ₹161.74 Lakhs\n- **FMCG & Grocery:** 3 SKUs | 9,435 units | ₹83.30 Lakhs\n- **Healthcare & Cold-Chain:** 2 SKUs | 5,540 units | ₹69.91 Lakhs\n- **Home & Appliances:** 1 SKUs | 685 units | ₹12.67 Lakhs\n- **Industrial Spares:** 2 SKUs | 1,865 units | ₹56.18 Lakhs\n- **Packaging & Supplies:** 1 SKUs | 9,400 units | ₹39.48 Lakhs\n\n> [!TIP]\n> Click **\"Open Full Inventory Table\"** below to filter by category, check storage bays, and view exact inventory counts for each warehouse hub.\n", "source": "ShelVO AI", "capacityCards": [{"code": "WH-01", "name": "North Fulfillment Hub (Peenya / Yeshwanthpur)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 3200, "palletsUsed": 552, "status": "STANDBY", "statusColor": "#8E96A4"}, {"code": "WH-02", "name": "East Tech Corridor Hub (Whitefield / Mahadevapura)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 2700, "palletsUsed": 482, "status": "STANDBY", "statusColor": "#8E96A4"}, {"code": "WH-03", "name": "South Electronic City Hub (Bommanahalli / EC)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 3000, "palletsUsed": 543, "status": "STANDBY", "statusColor": "#8E96A4"}], "inventoryAlerts": [{"sku": "APP-302", "name": "High-Visibility Reflective Safety Vests", "status": "LOW STOCK", "totalOnHand": 1080, "minReorder": 200}, {"sku": "ELC-001", "name": "Smart Lithium Battery Pack 48V", "status": "LOW STOCK", "totalOnHand": 815, "minReorder": 100}, {"sku": "FMC-101", "name": "Cold-Pressed Sunflower Oil 5L", "status": "LOW STOCK", "totalOnHand": 1910, "minReorder": 250}, {"sku": "FMC-103", "name": "Artisan Dark Roast Coffee Beans 1kg", "status": "CRITICAL", "totalOnHand": 1175, "minReorder": 150}], "suggestedActions": [{"label": "📦 Open Full Stock Inventory Table", "action": "OPEN_INVENTORY_TABLE"}, {"label": "🔄 Recommend Rebalancing", "action": "CHAT_REBALANCE"}, {"label": "🏢 Check Hub Capacities", "action": "CHAT_CAPACITY"}]}, "greeting": {"reply": "### 👋 Hi! I'm ShelVO AI, your logistics & fulfillment operations lead.\n\nI keep a continuous real-time watch on our fulfillment network across Bengaluru:\n- 📍 **Nearest Warehouse:** Tell me your delivery neighborhood or tap `📍 Near Me` to identify your closest fulfillment center & EV transit time.\n- 🏢 **Capacity & Utilization:** Check real-time throughput limits, order headroom, and physical pallet bays.\n- 📦 **Stock Inventory & Alerts:** Track SKU stock levels, monitor safety reorders, and view valuations.\n- 🔄 **Intra-Hub Rebalancing:** Recommend smart stock replenishment between warehouses to eliminate stockouts.\n\n**How can I assist your operations today?**", "source": "ShelVO AI", "capacityCards": [{"code": "WH-01", "name": "North Fulfillment Hub (Peenya / Yeshwanthpur)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 3200, "palletsUsed": 552, "status": "STANDBY", "statusColor": "#8E96A4"}, {"code": "WH-02", "name": "East Tech Corridor Hub (Whitefield / Mahadevapura)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 2700, "palletsUsed": 482, "status": "STANDBY", "statusColor": "#8E96A4"}, {"code": "WH-03", "name": "South Electronic City Hub (Bommanahalli / EC)", "dailyAssigned": 0, "dailyCapacity": 5000, "utilizationPercent": 0, "palletCapacity": 3000, "palletsUsed": 543, "status": "STANDBY", "statusColor": "#8E96A4"}], "inventoryAlerts": [{"sku": "APP-302", "name": "High-Visibility Reflective Safety Vests", "status": "LOW STOCK", "totalOnHand": 1080, "minReorder": 200}, {"sku": "ELC-001", "name": "Smart Lithium Battery Pack 48V", "status": "LOW STOCK", "totalOnHand": 815, "minReorder": 100}, {"sku": "FMC-101", "name": "Cold-Pressed Sunflower Oil 5L", "status": "LOW STOCK", "totalOnHand": 1910, "minReorder": 250}, {"sku": "FMC-103", "name": "Artisan Dark Roast Coffee Beans 1kg", "status": "CRITICAL", "totalOnHand": 1175, "minReorder": 150}], "suggestedActions": [{"label": "🏢 Warehouse Capacity & Utilization", "action": "CHAT_CAPACITY"}, {"label": "📦 Stock Inventory & Low Stock Alerts", "action": "OPEN_INVENTORY_TABLE"}, {"label": "🔄 Recommend Stock Rebalancing", "action": "CHAT_REBALANCE"}, {"label": "⚡ Demand Shock Stress Test", "action": "OPEN_DEMAND_SHOCK"}, {"label": "💰 Cost Savings & Emissions", "action": "CHAT_COST"}]}}};

  // If running locally with the Python backend, NEVER intercept fetch!
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return;
  }

  const originalFetch = window.fetch;

  function initStorage() {
    if (!localStorage.getItem('gridpoint_projects')) {
      const demoProject = {
        id: 'prj_demo_bengaluru',
        name: 'Bengaluru Metropolitan Network',
        description: 'Initial decentralized facility siting model across 28 micro-markets.',
        datasetName: 'Bengaluru Metropolitan Demo',
        neighborhoods: window.GRIDPOINT_DATA ? window.GRIDPOINT_DATA.BENGALURU_DEMO_DATA : [],
        neighborhoodCount: 28,
        latestWarehouses: 3,
        latestDeliveryCost: 573210.50,
        costReductionPct: 31.9,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('gridpoint_projects', JSON.stringify([demoProject]));
    }
  }

  window.fetch = async function(resource, init = {}) {
    const url = typeof resource === 'string' ? resource : resource.url;
    
    // Only intercept /api/ routes
    if (!url.startsWith('/api/')) {
      return originalFetch.apply(this, arguments);
    }

    // Attempt real backend call first
    try {
      const response = await originalFetch.apply(this, arguments);
      const contentType = response.headers.get('content-type') || '';
      // Only trust real JSON API responses. On Netlify, the SPA rewrite (/* -> /index.html 200)
      // answers /api/* GET requests with the HTML app shell, which must fall through to the mock.
      if (response.status !== 404 && contentType.includes('application/json')) {
        return response;
      }
    } catch (err) {
      // Backend offline or unreachable (e.g. running statically on Netlify)
    }

    // Engage client-side mock adapter
    initStorage();
    const method = (init.method || 'GET').toUpperCase();
    let body = {};
    if (init.body) {
      try {
        body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      } catch (e) {
        body = {};
      }
    }

    function jsonResponse(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status: status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Health check
    if (url === '/api/health') {
      return jsonResponse({ status: 'healthy', mode: 'client-autonomous', version: '3.0.0' });
    }

    // 2. Authentication: /api/auth/me
    if (url === '/api/auth/me') {
      const token = localStorage.getItem('gridpoint_token');
      const user = localStorage.getItem('gridpoint_current_user');
      if (token && user) {
        return jsonResponse({ user: JSON.parse(user) });
      }
      return jsonResponse({ error: 'Unauthenticated' }, 401);
    }

    // 3. Authentication: /api/auth/login
    if (url === '/api/auth/login' && method === 'POST') {
      const { email, password } = body;
      const user = {
        id: 'usr_admin',
        email: email || 'admin@gridpoint.ai',
        fullName: 'Elena Rostova',
        organization: 'Apex Global Supply'
      };
      const token = 'token_mock_' + Date.now();
      localStorage.setItem('gridpoint_token', token);
      localStorage.setItem('gridpoint_current_user', JSON.stringify(user));
      return jsonResponse({ token, user });
    }

    // 4. Authentication: /api/auth/signup
    if (url === '/api/auth/signup' && method === 'POST') {
      const user = {
        id: 'usr_' + Date.now(),
        email: body.email,
        fullName: body.fullName || 'Enterprise Analyst',
        organization: body.organization || 'Logistics Operations'
      };
      const token = 'token_mock_' + Date.now();
      localStorage.setItem('gridpoint_token', token);
      localStorage.setItem('gridpoint_current_user', JSON.stringify(user));
      return jsonResponse({ token, user });
    }

    // 5. Authentication: /api/auth/logout
    if (url === '/api/auth/logout') {
      localStorage.removeItem('gridpoint_token');
      localStorage.removeItem('gridpoint_current_user');
      return jsonResponse({ success: true });
    }

    // 6. Dashboard: /api/dashboard
    if (url === '/api/dashboard') {
      const projects = JSON.parse(localStorage.getItem('gridpoint_projects') || '[]');
      const runsCount = projects.filter(p => p.latestWarehouses).length;
      return jsonResponse({
        activeProjects: projects.length,
        optimizationRuns: Math.max(runsCount, 1),
        averageCostReductionPct: 32.4,
        totalDemandAnalyzed: 11200,
        recentProjects: projects
      });
    }

    // 7. Projects: /api/projects (POST)
    if (url === '/api/projects' && method === 'POST') {
      const projects = JSON.parse(localStorage.getItem('gridpoint_projects') || '[]');
      const newProj = {
        id: 'prj_' + Date.now().toString(36),
        name: body.name || 'New Optimization Workspace',
        description: body.description || 'Facility location optimization model.',
        datasetName: body.datasetName || 'Custom Dataset',
        neighborhoods: body.neighborhoods || (window.GRIDPOINT_DATA ? window.GRIDPOINT_DATA.BENGALURU_DEMO_DATA : []),
        neighborhoodCount: (body.neighborhoods || []).length || 28,
        latestWarehouses: null,
        latestDeliveryCost: null,
        costReductionPct: null,
        updatedAt: new Date().toISOString()
      };
      projects.unshift(newProj);
      localStorage.setItem('gridpoint_projects', JSON.stringify(projects));
      return jsonResponse({ project: newProj }, 201);
    }

    // 8. Projects: /api/projects/:id (GET)
    const matchGetProj = url.match(/^\/api\/projects\/([a-zA-Z0-9_-]+)$/);
    if (matchGetProj && method === 'GET') {
      const projId = matchGetProj[1];
      const projects = JSON.parse(localStorage.getItem('gridpoint_projects') || '[]');
      let proj = projects.find(p => p.id === projId);
      if (!proj) {
        proj = {
          id: projId,
          name: 'Bengaluru Metropolitan Network',
          description: 'Initial decentralized facility siting model.',
          neighborhoods: window.GRIDPOINT_DATA ? window.GRIDPOINT_DATA.BENGALURU_DEMO_DATA : []
        };
      }
      return jsonResponse({ project: proj });
    }

    // 9. Projects: /api/projects/:id (DELETE)
    if (matchGetProj && method === 'DELETE') {
      const projId = matchGetProj[1];
      let projects = JSON.parse(localStorage.getItem('gridpoint_projects') || '[]');
      projects = projects.filter(p => p.id !== projId);
      localStorage.setItem('gridpoint_projects', JSON.stringify(projects));
      return jsonResponse({ success: true });
    }

    // 10. Projects: /api/projects/:id/duplicate (POST)
    const matchDup = url.match(/^\/api\/projects\/([a-zA-Z0-9_-]+)\/duplicate$/);
    if (matchDup && method === 'POST') {
      const projId = matchDup[1];
      const projects = JSON.parse(localStorage.getItem('gridpoint_projects') || '[]');
      const original = projects.find(p => p.id === projId);
      if (original) {
        const cloned = JSON.parse(JSON.stringify(original));
        cloned.id = 'prj_' + Date.now().toString(36);
        cloned.name = cloned.name + ' (Copy)';
        cloned.updatedAt = new Date().toISOString();
        projects.unshift(cloned);
        localStorage.setItem('gridpoint_projects', JSON.stringify(projects));
        return jsonResponse({ project: cloned });
      }
    }

    // 11. Optimization: /api/projects/:id/optimize (POST)
    const matchOpt = url.match(/^\/api\/projects\/([a-zA-Z0-9_-]+)\/optimize$/);
    if (matchOpt && method === 'POST') {
      const projId = matchOpt[1];
      const k = body.warehouseCount || 3;
      const nodes = body.neighborhoods || (window.GRIDPOINT_DATA ? window.GRIDPOINT_DATA.BENGALURU_DEMO_DATA : []);
      
      const result = window.GRIDPOINT_ALGO.optimizeLocations(nodes, {
        k: k,
        maxCapacity: body.capacity,
        maxRadius: body.serviceRadius
      });

      const projects = JSON.parse(localStorage.getItem('gridpoint_projects') || '[]');
      const pIdx = projects.findIndex(p => p.id === projId);
      if (pIdx !== -1) {
        projects[pIdx].latestWarehouses = k;
        projects[pIdx].latestDeliveryCost = result.metrics.optimizedTotalCost;
        projects[pIdx].costReductionPct = result.metrics.costReductionPercent;
        projects[pIdx].updatedAt = new Date().toISOString();
        localStorage.setItem('gridpoint_projects', JSON.stringify(projects));
      }

      return jsonResponse(result);
    }

    // 12. Analytics: /api/analytics
    if (url === '/api/analytics') {
      return jsonResponse({
        totalOptimizations: 12,
        avgCostReduction: 32.8,
        totalDemandServed: 48600,
        co2AbatedKg: 1420.5
      });
    }

    // 13. Inventory: /api/inventory (snapshot of the Python backend's seeded inventory)
    if (url === '/api/inventory') {
      return jsonResponse(STATIC_SNAPSHOT.inventory);
    }

    // 14. AI chat: /api/chat (rule-based answers captured from the Python backend, matched by intent)
    if (url === '/api/chat' && method === 'POST') {
      const text = String(body.message || '').toLowerCase();
      const has = (words) => words.some(w => (w.includes(' ') || w.includes('-')) ? text.includes(w) : new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(text));
      const intents = [
        ['rebalance', ['rebalance', 'rebalancing', 'rebalances', 'transfer', 'transfers', 'shift', 'replenish', 'replenishment', 'move stock', 'intra-hub', 'inter-hub']],
        ['import', ['import', 'csv', 'upload', 'dataset', 'coordinates', 'schema', 'format']],
        ['stress', ['demand shock', 'stress', 'surge', 'peak', 'flash sale', 'festive', 'shock']],
        ['scenario', ['scenario', 'capex', 'opex', 'sweet spot', 'trade-off', 'tradeoff', 'how many hubs', 'how many warehouses']],
        ['cost', ['saving', 'savings', 'spend', 'inr', 'emissions', 'emission', 'co2', 'reduction', 'before after', 'majestic']],
        ['capacity', ['capacity', 'utilization', 'utilize', 'headroom', 'throughput', 'limit', 'overflow', 'bottleneck', 'load', 'exceed', 'pallet', 'pallets', 'storage bay', 'dock', 'docks']],
        ['inventory', ['stock', 'inventory', 'sku', 'units', 'goods', 'on hand', 'reorder', 'low stock', 'critical', 'shortage', 'valuation', 'worth', 'warehouse stock']]
      ];
      const hit = intents.find(([, words]) => has(words));
      return jsonResponse(STATIC_SNAPSHOT.chat[hit ? hit[0] : 'greeting']);
    }

    // 15. Feedback, profile and dataset updates: accept and acknowledge in static mode
    if (url === '/api/feedback' && method === 'POST') {
      return jsonResponse({ id: 'fb_' + Date.now().toString(36), status: 'received' }, 201);
    }
    if (url === '/api/auth/profile' && method === 'PUT') {
      const user = JSON.parse(localStorage.getItem('gridpoint_current_user') || '{}');
      if (body.fullName) user.fullName = body.fullName;
      if (body.organization) user.organization = body.organization;
      localStorage.setItem('gridpoint_current_user', JSON.stringify(user));
      return jsonResponse({ user: user });
    }
    const matchDatasets = url.match(/^\/api\/projects\/([a-zA-Z0-9_-]+)\/datasets$/);
    if (matchDatasets && method === 'POST') {
      const projects = JSON.parse(localStorage.getItem('gridpoint_projects') || '[]');
      const proj = projects.find(p => p.id === matchDatasets[1]);
      if (proj && Array.isArray(body.neighborhoods)) {
        proj.neighborhoods = body.neighborhoods;
        proj.neighborhoodCount = body.neighborhoods.length;
        proj.datasetName = body.name || proj.datasetName;
        proj.updatedAt = new Date().toISOString();
        localStorage.setItem('gridpoint_projects', JSON.stringify(projects));
      }
      return jsonResponse({ dataset: { name: body.name || 'Dataset', neighborhoodCount: (body.neighborhoods || []).length } }, 201);
    }

    return jsonResponse({ error: 'Endpoint not found in static mode' }, 404);
  };
})();
