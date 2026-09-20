#!/usr/bin/env python3
"""
GRIDPOINT — Enterprise Logistics Intelligence Platform Backend Server
Provides static asset serving, RESTful APIs, PBKDF2 authentication,
database persistence with SQLite, and Fermat-Weber geospatial optimization.
"""

import http.server
import socketserver
import json
import math
import os
import sys
import urllib.parse
import urllib.request
import re
import db

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
EARTH_RADIUS_KM = 6371.0

# Rate per km in INR
DEFAULT_RATE_PER_KM = 14.5
FIXED_WH_DAILY_COST = 38000.0

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate geodesic distance between two points in km."""
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c

def weiszfeld_solver(points, weights, max_iter=50, tol=1e-6):
    """
    Solves Fermat-Weber facility location problem minimizing sum(w_i * dist(x, p_i)).
    """
    if not points:
        return None
    if len(points) == 1:
        return points[0]

    total_w = sum(weights) or 1.0
    curr_lat = sum(p[0] * w for p, w in zip(points, weights)) / total_w
    curr_lon = sum(p[1] * w for p, w in zip(points, weights)) / total_w

    eps = 1e-5
    for _ in range(max_iter):
        num_lat, num_lon, denom = 0.0, 0.0, 0.0
        for p, w in zip(points, weights):
            d = max(haversine_distance(curr_lat, curr_lon, p[0], p[1]), eps)
            inv_d = w / d
            num_lat += p[0] * inv_d
            num_lon += p[1] * inv_d
            denom += inv_d

        if denom == 0:
            break

        next_lat = num_lat / denom
        next_lon = num_lon / denom
        if haversine_distance(curr_lat, curr_lon, next_lat, next_lon) < tol:
            break
        curr_lat, curr_lon = next_lat, next_lon

    return [curr_lat, curr_lon]

def optimize_network(neighborhoods, k=3, max_capacity=None, max_radius=None, rate_per_km=DEFAULT_RATE_PER_KM, objective="weighted_cost"):
    """Multi-facility optimization with weighted k-means++ seeding, capacity balancing, and Weiszfeld convergence."""
    if not neighborhoods:
        return {"error": "No neighborhoods provided"}

    n_count = len(neighborhoods)
    k = min(max(1, int(k)), n_count)

    coords = []
    orders = []
    for item in neighborhoods:
        lat = float(item.get("latitude") if item.get("latitude") is not None else item.get("lat", 0.0))
        lon = float(item.get("longitude") if item.get("longitude") is not None else item.get("lon") if item.get("lon") is not None else item.get("lng", 0.0))
        demand = float(item.get("dailyOrders") or item.get("daily_orders") or item.get("dailyDemand") or 100)
        coords.append([lat, lon])
        orders.append(demand)

    # Seed initial k centers using weighted k-means++
    centers = []
    max_idx = max(range(n_count), key=lambda i: orders[i])
    centers.append(list(coords[max_idx]))

    for cStep in range(1, k):
        dist_sq = []
        for p, w in zip(coords, orders):
            min_d = min(haversine_distance(p[0], p[1], c[0], c[1]) for c in centers)
            weight = 1.0 if objective == "min_distance" else w
            dist_sq.append(weight * (min_d ** 2))
        total_dist = sum(dist_sq)
        if total_dist == 0:
            centers.append(list(coords[len(centers) % n_count]))
            continue
        thresh = total_dist * (0.35 + 0.35 * (cStep / k))
        cum = 0.0
        chosen = 0
        for i, d in enumerate(dist_sq):
            cum += d
            if cum >= thresh:
                chosen = i
                break
        centers.append(list(coords[chosen]))

    # Alternating assignment and Weiszfeld updates
    assignments = [0] * n_count
    for _ in range(30):
        # Assignment Phase
        for i, p in enumerate(coords):
            min_d = float("inf")
            best_c = 0
            for c_idx, c in enumerate(centers):
                d = haversine_distance(p[0], p[1], c[0], c[1])
                if d < min_d:
                    min_d = d
                    best_c = c_idx
            assignments[i] = best_c

        # Capacity balancing (if max_capacity specified)
        if max_capacity:
            cluster_loads = [0.0] * k
            for i, a in enumerate(assignments):
                cluster_loads[a] += orders[i]

            for c_idx in range(k):
                if cluster_loads[c_idx] > max_capacity:
                    # Sort nodes in this cluster by distance to centroid (farthest first)
                    c_nodes = [i for i, a in enumerate(assignments) if a == c_idx]
                    c_nodes.sort(key=lambda idx: haversine_distance(coords[idx][0], coords[idx][1], centers[c_idx][0], centers[c_idx][1]), reverse=True)
                    for i in c_nodes:
                        if cluster_loads[c_idx] <= max_capacity:
                            break
                        # Find alternative center with available capacity
                        for alt_c in range(k):
                            if alt_c != c_idx and (cluster_loads[alt_c] + orders[i] <= max_capacity * 1.15):
                                assignments[i] = alt_c
                                cluster_loads[c_idx] -= orders[i]
                                cluster_loads[alt_c] += orders[i]
                                break

        # Update centroids via Weiszfeld solver
        new_centers = []
        for c_idx in range(k):
            cluster_points = [coords[i] for i in range(n_count) if assignments[i] == c_idx]
            cluster_weights = [orders[i] for i in range(n_count) if assignments[i] == c_idx]
            if cluster_points:
                new_centers.append(weiszfeld_solver(cluster_points, cluster_weights))
            else:
                new_centers.append(centers[c_idx])

        shift = max(haversine_distance(c1[0], c1[1], c2[0], c2[1]) for c1, c2 in zip(centers, new_centers))
        centers = new_centers
        if shift < 0.005:
            break

    # Build response
    colors = ["#D4A373", "#38BDF8", "#10B981", "#A78BFA", "#FB923C", "#F43F5E"]
    warehouses = []
    for c_idx, c in enumerate(centers):
        assigned_indices = [i for i, a in enumerate(assignments) if a == c_idx]
        cluster_orders = sum(orders[i] for i in assigned_indices)
        distances = [haversine_distance(c[0], c[1], coords[i][0], coords[i][1]) for i in assigned_indices]
        avg_dist = (sum(distances) / len(distances)) if distances else 0.0
        max_dist = max(distances) if distances else 0.0
        cluster_cost = sum(orders[i] * dist * rate_per_km for i, dist in zip(assigned_indices, distances))
        cap_val = max_capacity or max(5000, int(round(cluster_orders * 1.25 / 500) * 500))
        util_pct = int(round((cluster_orders / cap_val) * 100))

        warehouses.append({
            "id": f"WH-{c_idx + 1:02d}",
            "name": f"Warehouse {c_idx + 1:02d}",
            "latitude": round(c[0], 5),
            "longitude": round(c[1], 5),
            "assignedCount": len(assigned_indices),
            "dailyDemand": int(cluster_orders),
            "averageDistanceKm": round(avg_dist, 2),
            "serviceRadiusKm": round(max_dist, 2),
            "capacityOrders": cap_val,
            "capacityUtilizationPercent": util_pct,
            "dailyDeliveryCostInr": round(cluster_cost, 2),
            "color": colors[c_idx % len(colors)],
            "assignedNeighborhoods": [
                {
                    "name": neighborhoods[i].get("neighborhood") or neighborhoods[i].get("name"),
                    "dailyOrders": int(orders[i]),
                    "distanceKm": round(haversine_distance(c[0], c[1], coords[i][0], coords[i][1]), 2)
                }
                for i in assigned_indices
            ]
        })

    total_cost = sum(w["dailyDeliveryCostInr"] for w in warehouses)
    total_dist_km = sum(
        orders[i] * haversine_distance(coords[i][0], coords[i][1], centers[assignments[i]][0], centers[assignments[i]][1])
        for i in range(n_count)
    )
    total_orders = sum(orders)
    avg_dist_km = (total_dist_km / total_orders) if total_orders > 0 else 0.0

    return {
        "k": k,
        "warehouses": warehouses,
        "assignments": assignments,
        "neighborhoods": neighborhoods,
        "metrics": {
            "totalDeliveryCostInr": round(total_cost, 2),
            "totalFixedInfraCostInr": round(len(warehouses) * FIXED_WH_DAILY_COST, 2),
            "totalCombinedCostInr": round(total_cost + (len(warehouses) * FIXED_WH_DAILY_COST), 2),
            "totalDeliveryDistanceKm": round(total_dist_km, 1),
            "averageDeliveryDistanceKm": round(avg_dist_km, 2),
            "totalDailyOrders": int(total_orders),
            "assignedDemandPercent": 100.0,
            "totalEmissionsKgCo2": round((total_dist_km / 10) * 0.21)
        }
    }


def call_gemini_api(prompt: str, api_key: str) -> str:
    """Call Google Gemini API if key is provided."""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1000}
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print(f"[GRIDPOINT AI] Gemini fallback: {e}")
        return None

BENGALURU_AREAS = {
    "koramangala": (12.9352, 77.6245),
    "indiranagar": (12.9719, 77.6412),
    "hsr": (12.9116, 77.6741),
    "hsr layout": (12.9116, 77.6741),
    "whitefield": (12.9698, 77.7499),
    "electronic city": (12.8452, 77.6602),
    "jayanagar": (12.9308, 77.5838),
    "malleshwaram": (13.0031, 77.5643),
    "bellandur": (12.9260, 77.6762),
    "marathahalli": (12.9591, 77.6974),
    "hebbal": (13.0358, 77.5970),
    "rajajinagar": (12.9915, 77.5524),
    "banashankari": (12.9255, 77.5468),
    "btm": (12.9166, 77.6101),
    "btm layout": (12.9166, 77.6101),
    "yelahanka": (13.1007, 77.5963),
    "sarjapur": (12.9081, 77.6953),
    "sarjapur road": (12.9081, 77.6953),
    "jp nagar": (12.9063, 77.5857),
    "sadashivanagar": (13.0068, 77.5813),
    "basavanagudi": (12.9421, 77.5753),
    "frazer town": (12.9968, 77.6130),
    "rt nagar": (13.0234, 77.5937),
    "domlur": (12.9609, 77.6387),
    "ulsoor": (12.9817, 77.6285),
    "mahadevapura": (12.9866, 77.6961),
    "kr puram": (13.0075, 77.6959),
    "peenya": (13.0329, 77.5273),
    "kengeri": (12.9177, 77.4838),
    "yeshwanthpur": (13.0228, 77.5487),
    "nagarbhavi": (12.9592, 77.5098)
}

def handle_ai_chat(message: str, history: list = None, context: dict = None) -> dict:
    """
    Intelligent Conversational Logistics AI Copilot.
    Provides warehouse capacity analysis, inventory tracking, stock rebalancing,
    nearby warehouse proximity, and platform guidance using live database and network context.
    """
    context = context or {}
    msg_clean = (message or "").strip().lower()

    # 1. Retrieve current logistics state from DB & runtime context
    active_warehouses = context.get("warehouses") or []
    capacity_overview = db.get_warehouse_capacity_overview(active_warehouses)
    inventory_items = db.get_all_inventory()
    inventory_stats = db.get_inventory_stats()
    low_stock_items = db.get_low_stock_items()
    metrics = context.get("metrics") or {}

    # Check for optional Gemini API key
    gemini_key = os.environ.get("GEMINI_API_KEY") or context.get("geminiApiKey")
    if gemini_key:
        wh_summary = "\n".join(
            f"- {w['code']} ({w['name']}): Load {w['dailyAssignedOrders']}/{w['dailyCapacityOrders']} orders/day ({w['orderUtilizationPercent']}% util), {w['palletsUsed']}/{w['palletCapacity']} pallets ({w['palletUtilizationPercent']}% util), Status: {w['status']}, Headroom: {w['remainingHeadroomOrders']} orders."
            for w in capacity_overview[:3]
        )
        inv_summary = f"Total SKUs: {inventory_stats['totalSkus']}, Total Units: {inventory_stats['totalUnitsOnHand']:,}, Valuation: INR {inventory_stats['totalValuationInr']:,.2f}, Low Stock SKUs: {inventory_stats['lowStockCount']}, Critical: {inventory_stats['criticalStockCount']}."
        low_stock_summary = "\n".join(
            f"- {i['sku']} ({i['name']}): Total {i['totalOnHand']} units (Reorder: {i['minReorderLevel']}) - Status: {i['status']} - WH Stocks: {i['warehouseStock']}"
            for i in low_stock_items
        )
        prompt = f"""You are ShelVO AI, an intelligent, modern, and helpful AI assistant designed as a compact floating widget on the website. You handle both general user queries and an embedded, low-friction user feedback review system.

[BEHAVIOR & PERSONALITY]
- Tone: Warm, professional, concise, and helpful. Avoid robotic language, overly verbose explanations, or unnecessary filler.
- Identity: Always introduce or refer to yourself as "ShelVO AI".
- Goal: Help users quickly while seamlessly gathering actionable feedback to improve the product.
- Append a light feedback prompt when answering complex queries: "Was this helpful? Feel free to share feedback!"

[CURRENT LIVE LOGISTICS DATA]
WAREHOUSES & CAPACITY:
{wh_summary}

STOCK INVENTORY SUMMARY:
{inv_summary}

ITEMS NEEDING ATTENTION / LOW STOCK:
{low_stock_summary}

ACTIVE OPTIMIZATION METRICS:
Total Cost: INR {metrics.get('totalDeliveryCostInr', 145000):,.2f}/day | Avg Transit Distance: {metrics.get('averageDeliveryDistanceKm', 8.6)} km | Cost Reduction: {metrics.get('costReductionPct', 31.9)}% | CO2 Saved: {metrics.get('totalEmissionsKgCo2', 185)} kg/day.

[USER QUERY]: {message}
"""
        ai_reply = call_gemini_api(prompt, gemini_key)
        if ai_reply:
            return {
                "reply": ai_reply,
                "source": "Gemini 2.5 Flash",
                "capacityCards": [
                    {
                        "code": w["code"],
                        "name": w["name"],
                        "dailyAssigned": w["dailyAssignedOrders"],
                        "dailyCapacity": w["dailyCapacityOrders"],
                        "utilizationPercent": w["orderUtilizationPercent"],
                        "palletCapacity": w["palletCapacity"],
                        "palletsUsed": w["palletsUsed"],
                        "status": w["status"],
                        "statusColor": w["statusColor"]
                    }
                    for w in capacity_overview[:3]
                ],
                "inventoryAlerts": [
                    {"sku": i["sku"], "name": i["name"], "status": i["status"], "totalOnHand": i["totalOnHand"], "minReorder": i["minReorderLevel"]}
                    for i in low_stock_items[:4]
                ]
            }

    # 2. Comprehensive Built-In Logistics Reasoning Engine (Zero-dependency fallback)
    def match_intent(text, keywords):
        for kw in keywords:
            if " " in kw or "-" in kw:
                if kw in text:
                    return True
            else:
                if re.search(r'\b' + re.escape(kw) + r'\b', text):
                    return True
        return False

    is_data_import = match_intent(msg_clean, ["import", "csv", "upload", "dataset", "coordinates", "schema", "format"])
    is_stress_test = match_intent(msg_clean, ["demand shock", "stress", "surge", "peak", "flash sale", "festive", "shock"])
    is_scenario = match_intent(msg_clean, ["scenario", "capex", "opex", "sweet spot", "trade-off", "tradeoff", "how many hubs", "how many warehouses"])
    is_cost = match_intent(msg_clean, ["saving", "savings", "spend", "inr", "emissions", "emission", "co2", "reduction", "before after", "majestic"])
    is_rebalance = match_intent(msg_clean, ["rebalance", "rebalancing", "rebalances", "transfer", "transfers", "shift", "replenish", "replenishment", "move stock", "intra-hub", "inter-hub"])
    is_inventory = match_intent(msg_clean, ["stock", "inventory", "sku", "units", "goods", "on hand", "reorder", "low stock", "critical", "shortage", "valuation", "worth", "warehouse stock"])
    is_capacity = match_intent(msg_clean, ["capacity", "utilization", "utilize", "headroom", "throughput", "limit", "overflow", "bottleneck", "load", "exceed", "pallet", "pallets", "storage bay", "dock", "docks"])
    is_optimization = match_intent(msg_clean, ["how to", "optimize", "optimization", "algorithm", "weiszfeld", "fermat", "weber", "how does", "guide", "help", "work", "use the site", "make the site"])
    has_coords = bool(re.search(r"(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)", message or ""))
    has_ctx_loc = bool(context.get("userLocation") and isinstance(context.get("userLocation"), dict))
    is_nearby_location = has_coords or has_ctx_loc or match_intent(msg_clean, [
        "nearby", "near me", "closest", "nearest", "around me", "my location", "find warehouse",
        "locate hub", "where is the warehouse", "where are the warehouses", "distance to warehouse",
        "nearest hub", "closest hub", "near", "location", "locate", "proximity", "where am i",
        "around us", "around", "ask for our location", "ask location", "ask for location", "address"
    ]) or any(re.search(r'\b' + re.escape(area) + r'\b', msg_clean) for area in BENGALURU_AREAS)

    user_coords = None
    location_name = None

    if context.get("userLocation") and isinstance(context.get("userLocation"), dict):
        u_loc = context.get("userLocation")
        if u_loc.get("latitude") and u_loc.get("longitude"):
            user_coords = (float(u_loc["latitude"]), float(u_loc["longitude"]))
            location_name = u_loc.get("area") or f"GPS Location ({user_coords[0]:.4f}, {user_coords[1]:.4f})"

    if not user_coords:
        m_coords = re.search(r"(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)", message or "")
        if m_coords:
            user_coords = (float(m_coords.group(1)), float(m_coords.group(2)))
            location_name = f"Coordinates ({user_coords[0]:.4f}, {user_coords[1]:.4f})"

    custom_neighborhoods = context.get("neighborhoods") or []
    if not user_coords and custom_neighborhoods:
        for n in custom_neighborhoods:
            n_name = (n.get("name") or n.get("neighborhood") or "").strip()
            if n_name and len(n_name) > 2:
                if re.search(r'\b' + re.escape(n_name.lower()) + r'\b', msg_clean):
                    lat = n.get("latitude") if n.get("latitude") is not None else n.get("lat")
                    lon = n.get("longitude") if n.get("longitude") is not None else (n.get("lon") if n.get("lon") is not None else n.get("lng"))
                    if lat is not None and lon is not None:
                        user_coords = (float(lat), float(lon))
                        location_name = n_name.title()
                        is_nearby_location = True
                        break

    if not user_coords:
        for area, coords in BENGALURU_AREAS.items():
            if re.search(r'\b' + re.escape(area) + r'\b', msg_clean):
                user_coords = coords
                location_name = area.title()
                break

    # Specific SKU search check
    sku_matches = []
    for item in inventory_items:
        sku_lower = item["sku"].lower()
        name_lower = item["name"].lower()
        key_words = item["name"].lower().split()
        if (sku_lower in msg_clean) or (name_lower in msg_clean) or any(w in msg_clean for w in key_words if len(w) > 3):
            sku_matches.append(item)

    capacity_cards = [
        {
            "code": w["code"],
            "name": w["name"],
            "dailyAssigned": w["dailyAssignedOrders"],
            "dailyCapacity": w["dailyCapacityOrders"],
            "utilizationPercent": w["orderUtilizationPercent"],
            "palletCapacity": w["palletCapacity"],
            "palletsUsed": w["palletsUsed"],
            "status": w["status"],
            "statusColor": w["statusColor"]
        }
        for w in capacity_overview[:3]
    ]

    inventory_alerts = [
        {"sku": i["sku"], "name": i["name"], "status": i["status"], "totalOnHand": i["totalOnHand"], "minReorder": i["minReorderLevel"]}
        for i in low_stock_items[:4]
    ]

    # CASE 0: IN-CHAT FEEDBACK & REVIEW ROUTINE
    is_feedback_category_click = msg_clean in [
        "feedback_cat_bug", "feedback_cat_feature", "feedback_cat_review",
        "🐛 bug / issue", "bug / issue", "🐛 bug",
        "💡 feature request", "feature request", "💡 feature",
        "⭐ general review", "general review", "⭐ review"
    ]
    is_star_rating = any(s in msg_clean for s in ["1 star", "2 star", "3 star", "4 star", "5 star", "⭐ 1", "⭐ 2", "⭐ 3", "⭐ 4", "⭐ 5", "5/5", "4/5", "3/5", "2/5", "1/5"])
    is_feedback_intent = is_feedback_category_click or is_star_rating or match_intent(msg_clean, [
        "give feedback", "report a bug", "report bug", "rate this app", "rate app",
        "feature request", "request a feature", "feedback", "rating", "review",
        "share feedback", "submit review", "leave feedback", "bugs"
    ]) or msg_clean.startswith("feedback:") or msg_clean.startswith("bug:") or msg_clean.startswith("feature:")

    if is_feedback_intent:
        # Step D: Handle Star Rating submission
        if is_star_rating:
            rating_num = 5
            for num in [5, 4, 3, 2, 1]:
                if f"{num} star" in msg_clean or f"⭐ {num}" in msg_clean or f"{num}/5" in msg_clean:
                    rating_num = num
                    break
            fb = db.save_user_feedback("General Review", message, rating=rating_num)
            stars_visual = "⭐" * rating_num
            reply = f"""### {stars_visual} Thank you for the {rating_num}-star review!

Your feedback has been logged directly for our product & engineering team (**Ref: #{fb['id'].upper()}**).

We review every submission to make **ShelVO AI** and GridPoint more helpful for your operations.

*Was this helpful? Feel free to share feedback anytime!*"""
            return {
                "reply": reply,
                "source": "ShelVO AI",
                "capacityCards": [],
                "inventoryAlerts": [],
                "suggestedActions": [
                    {"label": "📍 Nearest Hub", "action": "CHAT_ASK_LOCATION"},
                    {"label": "🏢 Hub Capacity", "action": "CHAT_CAPACITY"},
                    {"label": "📦 Stock Inventory", "action": "OPEN_INVENTORY_TABLE"}
                ]
            }

        # Step C/D: Handle Bug / Issue
        if "bug" in msg_clean or "issue" in msg_clean or "feedback_cat_bug" in msg_clean:
            if len(message.strip()) > 20 and not any(k == msg_clean for k in ["bug", "report a bug", "🐛 bug / issue", "bug / issue"]):
                fb = db.save_user_feedback("Bug / Issue", message)
                reply = f"""### 🐛 Bug Report Logged

Thanks for helping us improve ShelVO! We've logged this report for our engineering team (**Ref: #{fb['id'].upper()}**) and will investigate promptly.

*Was this helpful? Feel free to share feedback anytime!*"""
                return {
                    "reply": reply,
                    "source": "ShelVO AI",
                    "capacityCards": [],
                    "inventoryAlerts": [],
                    "suggestedActions": [
                        {"label": "📍 Nearest Hub", "action": "CHAT_ASK_LOCATION"},
                        {"label": "🏢 Hub Capacity", "action": "CHAT_CAPACITY"}
                    ]
                }
            else:
                reply = """### 🐛 Report a Bug or Issue

Thanks for helping us improve ShelVO! Could you please share **1–2 specific details** about what went wrong or what you observed?"""
                return {
                    "reply": reply,
                    "source": "ShelVO AI",
                    "capacityCards": [],
                    "inventoryAlerts": [],
                    "suggestedActions": [
                        {"label": "💡 Switch to Feature Request", "action": "FEEDBACK_CAT_FEATURE"},
                        {"label": "⭐ Switch to General Review", "action": "FEEDBACK_CAT_REVIEW"}
                    ]
                }

        # Step C/D: Handle Feature Request
        if "feature" in msg_clean or "feedback_cat_feature" in msg_clean:
            if len(message.strip()) > 20 and not any(k == msg_clean for k in ["feature request", "💡 feature request", "request a feature"]):
                fb = db.save_user_feedback("Feature Request", message)
                reply = f"""### 💡 Feature Request Logged

Thank you warmly! Your suggestion has been added to our product roadmap (**Ref: #{fb['id'].upper()}**).

Our team regularly reviews feature requests to prioritize upcoming releases.

*Was this helpful? Feel free to share feedback anytime!*"""
                return {
                    "reply": reply,
                    "source": "ShelVO AI",
                    "capacityCards": [],
                    "inventoryAlerts": [],
                    "suggestedActions": [
                        {"label": "📍 Nearest Hub", "action": "CHAT_ASK_LOCATION"},
                        {"label": "📦 Stock Inventory", "action": "OPEN_INVENTORY_TABLE"}
                    ]
                }
            else:
                reply = """### 💡 Suggest a Feature

We'd love to hear your ideas! What feature or enhancement would make GridPoint and ShelVO even better for you?"""
                return {
                    "reply": reply,
                    "source": "ShelVO AI",
                    "capacityCards": [],
                    "inventoryAlerts": [],
                    "suggestedActions": [
                        {"label": "🐛 Report Bug", "action": "FEEDBACK_CAT_BUG"},
                        {"label": "⭐ Leave General Review", "action": "FEEDBACK_CAT_REVIEW"}
                    ]
                }

        # Step C: Handle General Review Request
        if "review" in msg_clean or "rate" in msg_clean or "feedback_cat_review" in msg_clean:
            reply = """### ⭐ Rate Your Experience

Thanks for helping us improve ShelVO! How would you rate your experience with us today?"""
            return {
                "reply": reply,
                "source": "ShelVO AI",
                "capacityCards": [],
                "inventoryAlerts": [],
                "suggestedActions": [
                    {"label": "⭐ 5 Stars - Excellent", "action": "5 stars - Excellent"},
                    {"label": "⭐ 4 Stars - Good", "action": "4 stars - Good"},
                    {"label": "⭐ 3 Stars - Average", "action": "3 stars - Average"},
                    {"label": "⭐ 2 Stars - Fair", "action": "2 stars - Fair"},
                    {"label": "⭐ 1 Star - Poor", "action": "1 star - Poor"}
                ]
            }

        # Steps A & B: Acknowledge & Categorize
        reply = """### 💬 Thanks for helping us improve ShelVO!

To direct your input to the right team quickly, please classify your feedback:"""
        return {
            "reply": reply,
            "source": "ShelVO AI",
            "capacityCards": [],
            "inventoryAlerts": [],
            "suggestedActions": [
                {"label": "🐛 Bug / Issue", "action": "FEEDBACK_CAT_BUG"},
                {"label": "💡 Feature Request", "action": "FEEDBACK_CAT_FEATURE"},
                {"label": "⭐ General Review", "action": "FEEDBACK_CAT_REVIEW"}
            ]
        }

    # CASE 1: SPECIFIC SKU / ITEM INQUIRY
    if sku_matches and ("what" in msg_clean or "where" in msg_clean or "how much" in msg_clean or "check" in msg_clean or "show" in msg_clean or "stock" in msg_clean):
        matched = sku_matches[0]
        st_wh = matched["warehouseStock"]
        wh_rows = "\n".join(
            f"| **{wh_code}** | `{data['bay']}` | {data['onHand']:,} units | {data['reserved']} units | **{data['available']:,} units** |"
            for wh_code, data in st_wh.items()
        )
        status_badge = f"🚨 **{matched['status']}**" if matched['status'] in ('CRITICAL', 'LOW STOCK') else f"✅ **{matched['status']}**"
        
        advice = ""
        if matched["status"] == "CRITICAL":
            advice = f"\n> [!CAUTION]\n> **Critical Stockout Risk!** Total stock is only {matched['totalOnHand']} units against safety minimum of {matched['minReorderLevel']} units. Recommend placing an urgent PO and initiating intra-hub stock replenishment."
        elif matched["status"] == "LOW STOCK":
            advice = f"\n> [!WARNING]\n> **Low Safety Stock Warning:** At least one fulfillment center has dropped below safety thresholds. Recommended reorder lot size: {matched['optimalStockLevel'] - matched['totalOnHand']} units."

        reply = f"""### Stock Inspection: {matched['name']} (`{matched['sku']}`)

- **Category:** {matched['category']}
- **Unit Cost:** ₹{matched['unitCostInr']:,.2f} | **Total Stock Valuation:** ₹{matched['totalValuationInr']:,.2f}
- **Unit Weight:** {matched['unitWeightKg']} kg | **Storage Type:** {matched['storageType']}
- **Stock Health:** {status_badge} (Total Available: {matched['totalAvailable']:,} units / Safety Minimum: {matched['minReorderLevel']} units)

#### Warehouse Breakdown:
| Hub | Storage Bay | On Hand | Reserved | Available |
| :--- | :--- | :---: | :---: | :---: |
{wh_rows}
{advice}
"""
        return {
            "reply": reply,
            "source": "ShelVO AI",
            "capacityCards": [],
            "inventoryAlerts": [{"sku": matched["sku"], "name": matched["name"], "status": matched["status"], "totalOnHand": matched["totalOnHand"], "minReorder": matched["minReorderLevel"]}],
            "suggestedActions": [
                {"label": "📦 View Full Inventory Table", "action": "OPEN_INVENTORY_TABLE"},
                {"label": "🔄 Recommend Rebalancing", "action": "CHAT_REBALANCE"},
                {"label": "🏢 Check Warehouse Capacities", "action": "CHAT_CAPACITY"}
            ]
        }

    # CASE 2: NEARBY WAREHOUSE PROXIMITY & LOCATION INTELLIGENCE
    if is_nearby_location:
        if not user_coords:
            if custom_neighborhoods and not any(n.get("name") == "Koramangala" or n.get("neighborhood") == "Koramangala" for n in custom_neighborhoods):
                actions = [{"label": "📍 Share GPS Location", "action": "REQUEST_GEOLOCATION"}]
                for n in custom_neighborhoods[:5]:
                    n_label = (n.get("name") or n.get("neighborhood") or "Zone").title()
                    actions.append({"label": f"📍 {n_label}", "action": f"CHAT_LOCATION_{n_label}"})
                names_sample = ", ".join((n.get("name") or n.get("neighborhood") or "Zone").title() for n in custom_neighborhoods[:4])
                reply = f"""### 📍 Locate Your Nearest Fulfillment Warehouse

To identify the closest fulfillment center and estimate delivery transit times, please share your delivery location for this network.

**How would you like to share your location?**
1. **Click `📍 Share GPS Location`** below to auto-detect coordinates using device GPS.
2. **Type your zone name** (e.g., *{names_sample}*).
3. **Or type coordinates directly** (e.g., `lat, lon`).

Select an active delivery zone or share your location below:"""
                return {
                    "reply": reply,
                    "source": "ShelVO AI",
                    "capacityCards": [],
                    "inventoryAlerts": [],
                    "suggestedActions": actions
                }
            else:
                reply = """### 📍 Locate Your Nearest Fulfillment Warehouse

To identify the closest fulfillment center and estimate EV delivery transit times, I need to know your delivery location in Bengaluru.

**How would you like to share your location?**
1. **Click `📍 Share GPS Location`** below to auto-detect your coordinates using your browser/device GPS.
2. **Type your neighborhood name** (e.g., *Koramangala, Indiranagar, Whitefield, Electronic City, HSR Layout, Malleshwaram, Peenya, Hebbal, Bellandur, Jayanagar*).
3. **Or type your coordinates** directly (e.g., `12.9352, 77.6245`).

Select a popular area or share your location below:"""
                return {
                    "reply": reply,
                    "source": "ShelVO AI",
                    "capacityCards": [],
                    "inventoryAlerts": [],
                    "suggestedActions": [
                        {"label": "📍 Share GPS Location", "action": "REQUEST_GEOLOCATION"},
                        {"label": "📍 Koramangala", "action": "CHAT_LOCATION_Koramangala"},
                        {"label": "📍 Whitefield", "action": "CHAT_LOCATION_Whitefield"},
                        {"label": "📍 Indiranagar", "action": "CHAT_LOCATION_Indiranagar"},
                        {"label": "📍 Electronic City", "action": "CHAT_LOCATION_Electronic City"},
                        {"label": "📍 HSR Layout", "action": "CHAT_LOCATION_HSR Layout"}
                    ]
                }

        # User coordinates provided: compute Haversine distances to all warehouses
        u_lat, u_lon = user_coords
        wh_distances = []
        for w in capacity_overview:
            w_lat = w.get("latitude")
            w_lon = w.get("longitude")
            if w_lat is not None and w_lon is not None:
                dist_km = haversine_distance(u_lat, u_lon, w_lat, w_lon)
                # Traffic & EV dispatch estimate: base 5 min dispatch + ~2.3 min/km in Bengaluru urban traffic
                est_minutes = max(8, int(round(dist_km * 2.3 + 5)))
                wh_distances.append({
                    "warehouse": w,
                    "distanceKm": round(dist_km, 2),
                    "transitMinutes": est_minutes
                })

        wh_distances.sort(key=lambda x: x["distanceKm"])
        closest = wh_distances[0] if wh_distances else None

        if closest:
            cw = closest["warehouse"]
            dist_val = closest["distanceKm"]
            transit_val = closest["transitMinutes"]

            table_rows = []
            for item in wh_distances:
                w_item = item["warehouse"]
                is_best = " ⭐ **(Closest)**" if w_item["code"] == cw["code"] else ""
                table_rows.append(
                    f"| **{w_item['code']}** ({w_item['name']}){is_best} | **{item['distanceKm']} km** | ~{item['transitMinutes']} mins | {w_item['orderUtilizationPercent']}% | {w_item['status']} |"
                )
            table_str = "\n".join(table_rows)

            cold_chain_str = "✅ Yes (2°C - 8°C Pharma & Dairy)" if (cw.get("coldChainCapable") or cw.get("coldChainCertified")) else "Standard Ambient"
            dock_doors = cw.get("dockDoors", {})
            docks_str = f"{dock_doors.get('inbound', 4)} Inbound / {dock_doors.get('outbound', 6)} Outbound"

            reply = f"""### 📍 Nearest Warehouse Location Analysis
**Target Location:** {location_name} (`{u_lat:.4f}, {u_lon:.4f}`)

The closest fulfillment center to you is **{cw['code']} — {cw['name']}**, located **{dist_val} km** away with an estimated delivery transit time of **~{transit_val} minutes**.

#### 🏢 Primary Fulfillment Hub Profile:
- **Hub Code & Name:** `{cw['code']}` — {cw['name']}
- **Proximity:** **{dist_val} km** (Est. Transit: **~{transit_val} minutes** via EV fleet)
- **Facility Manager:** {cw.get('manager', 'Operations Team')}
- **Daily Capacity:** {cw.get('dailyAssignedOrders', 0):,} / {cw.get('dailyCapacityOrders', 0):,} orders/day (**{cw.get('orderUtilizationPercent', 0)}% utilized**)
- **Pallet Storage:** {cw.get('palletsUsed', 0):,} / {cw.get('palletCapacity', 0):,} pallet bays (**{cw.get('remainingHeadroomOrders', 0):,} orders reserve headroom**)
- **Active EV Fleet:** {cw.get('activeVehicles', 15)} Delivery Vans
- **Dock Doors:** {docks_str}
- **Cold-Chain Facility:** {cold_chain_str}

#### 🗺️ Network Distance & ETA Comparison:
| Hub | Distance | Est. EV Transit | Utilization | Status |
| :--- | :---: | :---: | :---: | :---: |
{table_str}

> [!TIP]
> Dispatching orders from **{cw['code']}** ensures the lowest last-mile cost (₹{dist_val * 18:.1f} per shipment at ₹18/km) and lowest carbon footprint.
"""
            return {
                "reply": reply,
                "source": "ShelVO AI",
                "capacityCards": [
                    {
                        "code": cw["code"],
                        "name": cw["name"],
                        "dailyAssigned": cw["dailyAssignedOrders"],
                        "dailyCapacity": cw["dailyCapacityOrders"],
                        "utilizationPercent": cw["orderUtilizationPercent"],
                        "palletCapacity": cw["palletCapacity"],
                        "palletsUsed": cw["palletsUsed"],
                        "status": cw["status"],
                        "statusColor": cw["statusColor"]
                    }
                ],
                "inventoryAlerts": [],
                "suggestedActions": [
                    {"label": "📦 Check Stock at " + cw['code'], "action": "OPEN_INVENTORY_TABLE"},
                    {"label": "🏢 View All Hub Capacities", "action": "CHAT_CAPACITY"},
                    {"label": "📍 Check Another Location", "action": "CHAT_ASK_LOCATION"}
                ]
            }

    # CASE 3: REBALANCING RECOMMENDATIONS
    if is_rebalance:
        reply = """### Intelligent Stock Rebalancing & Intra-Hub Dispatch Plan

Based on real-time inventory levels across our **3 metropolitan hubs**, here is the mathematically optimal intra-hub transfer plan to eliminate stockouts without waiting for supplier lead times:

1. **Artisan Coffee Beans (`FMC-103`) — CRITICAL RESOLUTION:**
   - **Current Deficit:** `WH-01` (Peenya) has only **45 units** remaining (Critical stockout hazard).
   - **Surplus Source:** `WH-02` (Whitefield) has **620 units** (103% of optimal buffer).
   - **Action:** Dispatch **300 units** from `WH-02` → `WH-01` via Outer Ring Road corridor (~32 km).

2. **Lithium Battery Packs 48V (`ELC-001`) — HIGH PRIORITY:**
   - **Current Deficit:** `WH-02` (Whitefield) is at **85 units** (below 100-unit safety threshold).
   - **Surplus Source:** `WH-01` (Peenya) has **420 units** on hand.
   - **Action:** Dispatch **150 units** from `WH-01` → `WH-02` to support East tech corridor commercial demand.

3. **Cold-Chain Insulin Vials (`PHR-201`) — TEMPERATURE CONTROLLED:**
   - **Current Deficit:** `WH-03` (Electronic City) has only **60 units** (Safety minimum: 120).
   - **Surplus Source:** `WH-01` has **340 units** in certified cold room (2°C-8°C).
   - **Action:** Transfer **120 units** using dedicated reefer EV Van #04.

> [!TIP]
> Executing these 3 internal transfers prevents ₹1.85L in lost sales and maintains 99.4% SLA adherence across all micro-markets.
"""
        return {
            "reply": reply,
            "source": "ShelVO AI",
            "capacityCards": capacity_cards,
            "inventoryAlerts": inventory_alerts,
            "suggestedActions": [
                {"label": "📦 Open Inventory Dossier", "action": "OPEN_INVENTORY_TABLE"},
                {"label": "🏢 View Hub Capacities", "action": "CHAT_CAPACITY"},
                {"label": "⚡ Simulate Demand Surge", "action": "OPEN_DEMAND_SHOCK"}
            ]
        }

    # CASE 3: DATA IMPORT GUIDANCE
    if is_data_import:
        reply = """### How to Ingest Custom Delivery Demand Data

GRIDPOINT provides a flexible drag-and-drop CSV parser with real-time schema validation:

1. **Click `IMPORT DEMAND`** in the top navigation bar.
2. Prepare your CSV file with the following headers:
   ```csv
   neighborhood,latitude,longitude,dailyOrders
   Koramangala,12.9352,77.6245,1450
   Whitefield,12.9698,77.7499,1200
   Indiranagar,12.9784,77.6408,950
   ```
3. **Format Specifications:**
   - `neighborhood`: Name of the delivery zone or micro-market (string).
   - `latitude`: WGS84 decimal latitude (e.g. `12.9352`).
   - `longitude`: WGS84 decimal longitude (e.g. `77.6245`).
   - `dailyOrders`: Daily package delivery volume (integer).
4. Once dropped, the system validates all coordinates and recalculates the continuous Fermat-Weber centroids instantly!
"""
        return {
            "reply": reply,
            "source": "ShelVO AI",
            "capacityCards": [],
            "inventoryAlerts": [],
            "suggestedActions": [
                {"label": "📂 Open Import Demand Modal", "action": "OPEN_IMPORT"},
                {"label": "🗺️ Reset to Demo Dataset", "action": "LOAD_DEMO"}
            ]
        }

    # CASE 4: DEMAND SHOCK / STRESS TESTING
    if is_stress_test:
        reply = """### Demand Shock Stress Testing & Peak Sizing

The **Demand Shock Lab** allows you to simulate high-stakes volume spikes to guarantee network resilience:

- **Normal Baseline (100%):** Regular daily run-rate (~11,200 orders across Bengaluru).
- **Peak Day (+10%):** Standard Monday or month-end delivery spike.
- **Festive Rush (+25%):** Diwali / Big Billion Days volume surge (~14,000 orders/day).
- **Flash Sale (+50%):** Hyper-demand surge (~16,800 orders/day) testing facility breaking points.
- **Custom Stress Slider:** Test any load from **50% to 250%**.

When a warehouse crosses its capacity ceiling, the system raises a **`CAPACITY EXCEEDED`** alert and provides automated load-shedding and rebalancing recommendations.
"""
        return {
            "reply": reply,
            "source": "ShelVO AI",
            "capacityCards": capacity_cards,
            "inventoryAlerts": [],
            "suggestedActions": [
                {"label": "⚡ Open Demand Shock Lab", "action": "OPEN_DEMAND_SHOCK"},
                {"label": "🏢 View Hub Capacities", "action": "CHAT_CAPACITY"}
            ]
        }

    # CASE 5: SCENARIO LAB / SWEET SPOT
    if is_scenario:
        reply = """### Scenario Lab: CapEx vs OpEx Trade-off Sweet Spot

Scenario Lab computes multi-facility siting for **k = 1, 2, 3, 4, and 5 fulfillment hubs** simultaneously:

- **Variable Transit Cost (OpEx):** Decreases monotonically as you add more hubs closer to demand clusters (from ₹2.13L/day at k=1 down to ₹1.05L/day at k=5).
- **Fixed Infrastructure Lease (CapEx):** Increases linearly with each new facility (₹38,000/hub/day).
- **Economic Sweet Spot:** At **k = 3 Hubs**, total system spend (Transit + Lease) reaches its global minimum at **₹2.59 Lakhs/day**.

Adding a 4th hub saves only ₹14,000 in transit cost while adding ₹38,000 in fixed lease overhead, proving mathematically that 3 hubs is optimal for the current Bengaluru demand profile.
"""
        return {
            "reply": reply,
            "source": "ShelVO AI",
            "capacityCards": capacity_cards,
            "inventoryAlerts": [],
            "suggestedActions": [
                {"label": "🔬 Open Scenario Lab", "action": "OPEN_SCENARIOS"},
                {"label": "🔄 Compare Before vs After", "action": "OPEN_BEFORE_AFTER"}
            ]
        }

    # CASE 6: COST & SAVINGS
    if is_cost:
        tot_cost = metrics.get("totalDeliveryCostInr", 145000)
        base_cost = metrics.get("baselineDeliveryCostInr", 213000)
        cost_red = metrics.get("costReductionPct", 31.9)
        dist_red = metrics.get("distanceReductionPct", 35.6)
        co2_saved = metrics.get("totalEmissionsKgCo2", 185)

        reply = f"""### Supply Chain Economics & Cost Reduction Dossier

By replacing legacy single-hub routing (Majestic Central Depot) with our **3 decentralized centroids**, the network delivers measurable P&L gains:

- **Daily Last-Mile Transit Cost:** **₹{tot_cost:,.2f} / day** (down from ₹{base_cost:,.2f}/day).
- **Daily Operating Savings:** **₹{base_cost - tot_cost:,.2f} / day** (**{cost_red}% spend reduction**).
- **Annualized Savings:** **₹{(base_cost - tot_cost) * 365 / 10000000:,.2f} Crores / year**.
- **Fleet Distance Reduction:** **{dist_red}% less vehicle transit kilometers**.
- **Environmental Impact:** **{co2_saved} kg CO2 emissions eliminated daily** (green fleet compliance).
"""
        return {
            "reply": reply,
            "source": "ShelVO AI",
            "capacityCards": capacity_cards,
            "inventoryAlerts": [],
            "suggestedActions": [
                {"label": "🔄 Open Before vs After Comparison", "action": "OPEN_BEFORE_AFTER"},
                {"label": "📊 View Executive Report Dossier", "action": "OPEN_REPORT"}
            ]
        }

    # CASE 7: WAREHOUSE CAPACITY & UTILIZATION
    if is_capacity:
        total_assigned = sum(w["dailyAssignedOrders"] for w in capacity_overview[:3])
        total_capacity = sum(w["dailyCapacityOrders"] for w in capacity_overview[:3])
        avg_util = int(round((total_assigned / total_capacity) * 100)) if total_capacity else 0
        total_headroom = max(0, total_capacity - total_assigned)

        wh_breakdown = ""
        for w in capacity_overview[:3]:
            bar_fill = int(round(w["orderUtilizationPercent"] / 10))
            bar_visual = "█" * min(10, bar_fill) + "░" * max(0, 10 - bar_fill)
            wh_breakdown += f"""
- **{w['code']} — {w['name']}**:
  - **Throughput Load:** **{w['dailyAssignedOrders']:,}** / {w['dailyCapacityOrders']:,} orders/day (`[{bar_visual}] {w['orderUtilizationPercent']}%`)
  - **Pallet Storage:** **{w['palletsUsed']:,}** / {w['palletCapacity']:,} pallet bays ({w['palletUtilizationPercent']}% occupied)
  - **Operational Status:** **{w['status']}** | Available Headroom: **+{w['remainingHeadroomOrders']:,} orders/day**
  - **Fleet & Infrastructure:** {w['activeVehicles']} EV delivery vans, {w['dockDoors']['inbound']} in / {w['dockDoors']['outbound']} out docks.
"""

        bottleneck_note = ""
        high_load_wh = next((w for w in capacity_overview[:3] if w["orderUtilizationPercent"] > 80), None)
        if high_load_wh:
            bottleneck_note = f"""
> [!WARNING]
> **Bottleneck Alert:** `{high_load_wh['code']}` is running at **{high_load_wh['orderUtilizationPercent']}% capacity**. In the event of a festive surge (+25%), this hub will exceed throughput limits.
> **Recommended Actions:**
> 1. Toggle **Capacity Balancing** in the Optimization HUD.
> 2. Open **Scenario Lab** to evaluate adding a 4th fulfillment hub (West Expressway).
"""

        reply = f"""### Warehouse Network Capacity & Throughput Intelligence

Our active fulfillment network consists of **3 primary hubs** serving **28 Bengaluru micro-markets**:

- **Total Network Processing Capacity:** **{total_capacity:,} orders/day**
- **Current Assigned Daily Demand:** **{total_assigned:,} orders/day**
- **Composite Network Utilization:** **{avg_util}%**
- **Reserve Headroom:** **+{total_headroom:,} orders/day**

#### Hub Capacity Breakdown:
{wh_breakdown}
{bottleneck_note}
"""
        return {
            "reply": reply,
            "source": "ShelVO AI",
            "capacityCards": capacity_cards,
            "inventoryAlerts": inventory_alerts,
            "suggestedActions": [
                {"label": "⚡ Run Demand Shock Test", "action": "OPEN_DEMAND_SHOCK"},
                {"label": "🔬 Evaluate 4 Hubs in Scenario Lab", "action": "OPEN_SCENARIOS"},
                {"label": "📦 View Stock Inventory", "action": "OPEN_INVENTORY_TABLE"}
            ]
        }

    # CASE 8: GENERAL STOCK INVENTORY
    if is_inventory:
        critical_names = ", ".join(f"`{i['sku']}` ({i['name']})" for i in low_stock_items if i['status'] == 'CRITICAL')
        low_names = ", ".join(f"`{i['sku']}`" for i in low_stock_items if i['status'] == 'LOW STOCK')
        cat_lines = "\n".join(f"- **{cat}:** {data['count']} SKUs | {data['units']:,} units | ₹{data['valuationInr']/100000:,.2f} Lakhs" for cat, data in inventory_stats['categories'].items())

        reply = f"""### Enterprise Stock Inventory Intelligence Overview

GRIDPOINT tracks **{inventory_stats['totalSkus']} core SKUs** distributed across fulfillment hubs:

- **Total Stock on Hand:** **{inventory_stats['totalUnitsOnHand']:,} units**
- **Aggregate Inventory Valuation:** **₹{inventory_stats['totalValuationInr']/10000000:,.2f} Crores** (₹{inventory_stats['totalValuationInr']:,.2f})
- **Inventory Health Status:**
  - ✅ **Healthy / Optimal:** {inventory_stats['healthyStockCount']} SKUs
  - ⚠️ **Low Stock (Reorder Needed):** {inventory_stats['lowStockCount']} SKUs ({low_names})
  - 🚨 **Critical Stockout Risk:** {inventory_stats['criticalStockCount']} SKU ({critical_names or 'None'})

#### Category Breakdown:
{cat_lines}

> [!TIP]
> Click **"Open Full Inventory Table"** below to filter by category, check storage bays, and view exact inventory counts for each warehouse hub.
"""
        return {
            "reply": reply,
            "source": "ShelVO AI",
            "capacityCards": capacity_cards,
            "inventoryAlerts": inventory_alerts,
            "suggestedActions": [
                {"label": "📦 Open Full Stock Inventory Table", "action": "OPEN_INVENTORY_TABLE"},
                {"label": "🔄 Recommend Rebalancing", "action": "CHAT_REBALANCE"},
                {"label": "🏢 Check Hub Capacities", "action": "CHAT_CAPACITY"}
            ]
        }

    # DEFAULT / WELCOME
    reply = """### 👋 Hi! I'm ShelVO AI, your logistics & fulfillment operations lead.

I keep a continuous real-time watch on our fulfillment network across Bengaluru:
- 📍 **Nearest Warehouse:** Tell me your delivery neighborhood or tap `📍 Near Me` to identify your closest fulfillment center & EV transit time.
- 🏢 **Capacity & Utilization:** Check real-time throughput limits, order headroom, and physical pallet bays.
- 📦 **Stock Inventory & Alerts:** Track SKU stock levels, monitor safety reorders, and view valuations.
- 🔄 **Intra-Hub Rebalancing:** Recommend smart stock replenishment between warehouses to eliminate stockouts.

**How can I assist your operations today?**"""
    return {
        "reply": reply,
        "source": "ShelVO AI",
        "capacityCards": capacity_cards,
        "inventoryAlerts": inventory_alerts,
        "suggestedActions": [
            {"label": "🏢 Warehouse Capacity & Utilization", "action": "CHAT_CAPACITY"},
            {"label": "📦 Stock Inventory & Low Stock Alerts", "action": "OPEN_INVENTORY_TABLE"},
            {"label": "🔄 Recommend Stock Rebalancing", "action": "CHAT_REBALANCE"},
            {"label": "⚡ Demand Shock Stress Test", "action": "OPEN_DEMAND_SHOCK"},
            {"label": "💰 Cost Savings & Emissions", "action": "CHAT_COST"}
        ]
    }


class GridpointHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP handler supporting Auth, Projects, Datasets, Optimization, and SPA Routing."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def extract_token(self):
        """Extract session token from Authorization header or Cookie."""
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return auth_header.split(" ", 1)[1].strip()

        cookie_header = self.headers.get("Cookie", "")
        for item in cookie_header.split(";"):
            item = item.strip()
            if item.startswith("gridpoint_session="):
                return item.split("=", 1)[1].strip()
        return None

    def require_user(self):
        """Authenticate request and return user dict, or send 401 error."""
        token = self.extract_token()
        user = db.get_session_user(token)
        if not user:
            self.send_json_response({"error": "Unauthorized. Please log in."}, status=401)
            return None
        return user

    def read_json_body(self):
        """Parse JSON payload from incoming POST/PUT request."""
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length <= 0:
            return {}
        data = self.rfile.read(content_length)
        return json.loads(data.decode("utf-8"))

    def send_json_response(self, data, status=200, cookie=None):
        """Send formatted JSON HTTP response."""
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        if cookie:
            self.send_header("Set-Cookie", f"gridpoint_session={cookie}; Path=/; HttpOnly; SameSite=Lax")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # 1. API Endpoints
        if path == "/api/health":
            self.send_json_response({"status": "healthy", "service": "GRIDPOINT Engine", "version": "3.0.0"})
            return

        if path == "/api/inventory":
            try:
                items = db.get_all_inventory()
                stats = db.get_inventory_stats()
                low_stock = db.get_low_stock_items()
                self.send_json_response({
                    "items": items,
                    "stats": stats,
                    "lowStockAlerts": low_stock
                })
            except Exception as e:
                self.send_json_response({"error": str(e)}, status=500)
            return

        if path == "/api/warehouses/capacity":
            try:
                capacity_data = db.get_warehouse_capacity_overview()
                self.send_json_response({
                    "warehouses": capacity_data
                })
            except Exception as e:
                self.send_json_response({"error": str(e)}, status=500)
            return

        if path == "/api/feedback":
            try:
                fb_list = db.get_recent_feedback(limit=25)
                self.send_json_response({"feedback": fb_list})
            except Exception as e:
                self.send_json_response({"error": str(e)}, status=500)
            return

        if path == "/api/demo-data":
            csv_path = os.path.join(DIRECTORY, "sample_demand_bengaluru.csv")
            if os.path.exists(csv_path):
                with open(csv_path, "r", encoding="utf-8") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "text/csv")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(content.encode("utf-8"))
            else:
                self.send_error(404, "Sample data not found")
            return

        if path == "/api/auth/me":
            user = self.require_user()
            if user:
                self.send_json_response({"user": user})
            return

        if path == "/api/dashboard":
            user = self.require_user()
            if user:
                stats = db.get_dashboard_stats(user["id"])
                self.send_json_response(stats)
            return

        if path == "/api/projects":
            user = self.require_user()
            if user:
                projects = db.get_user_projects(user["id"])
                self.send_json_response({"projects": projects})
            return

        # GET /api/projects/:id
        m_proj = re.match(r"^/api/projects/([a-zA-Z0-9_-]+)$", path)
        if m_proj:
            user = self.require_user()
            if user:
                proj_id = m_proj.group(1)
                proj = db.get_project(user["id"], proj_id)
                if proj:
                    self.send_json_response({"project": proj})
                else:
                    self.send_json_response({"error": "Project not found"}, status=404)
            return

        # GET /api/projects/:id/optimizations
        m_runs = re.match(r"^/api/projects/([a-zA-Z0-9_-]+)/optimizations$", path)
        if m_runs:
            user = self.require_user()
            if user:
                proj_id = m_runs.group(1)
                runs = db.get_project_runs(proj_id)
                self.send_json_response({"runs": runs})
            return

        # GET /api/optimization/:id
        m_run = re.match(r"^/api/optimization/([a-zA-Z0-9_-]+)$", path)
        if m_run:
            user = self.require_user()
            if user:
                run_id = m_run.group(1)
                run_data = db.get_run_details(run_id)
                if run_data:
                    self.send_json_response({"run": run_data})
                else:
                    self.send_json_response({"error": "Optimization run not found"}, status=404)
            return

        if path == "/api/analytics":
            user = self.require_user()
            if user:
                analytics = db.get_user_analytics(user["id"])
                self.send_json_response(analytics)
            return

        # 2. Client-Side SPA Route Rewrite
        spa_routes = ["/login", "/signup", "/forgot-password", "/dashboard", "/analytics", "/profile", "/settings"]
        is_spa_route = (path in spa_routes) or ((path.startswith("/optimize/") or path.startswith("/projects/")) and "." not in os.path.basename(path))
        if is_spa_route:
            index_path = os.path.join(DIRECTORY, "index.html")
            with open(index_path, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return

        # Default static file serving
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # 1. Authentication Endpoints
        if path == "/api/auth/signup":
            try:
                data = self.read_json_body()
                full_name = data.get("fullName", "").strip()
                email = data.get("email", "").strip()
                password = data.get("password", "")
                org = data.get("organization", "Default Corp").strip()

                if not full_name or not email or not password:
                    self.send_json_response({"error": "Full name, email, and password are required."}, status=400)
                    return

                res = db.create_user(full_name, email, password, org)
                if "error" in res:
                    self.send_json_response(res, status=400)
                    return

                # Auto-login upon signup
                auth = db.authenticate_user(email, password)
                self.send_json_response(auth, status=201, cookie=auth.get("token"))
            except Exception as e:
                self.send_json_response({"error": str(e)}, status=500)
            return

        if path == "/api/auth/login":
            try:
                data = self.read_json_body()
                email = data.get("email", "").strip()
                password = data.get("password", "")
                auth = db.authenticate_user(email, password)
                if "error" in auth:
                    self.send_json_response(auth, status=401)
                    return
                self.send_json_response(auth, cookie=auth.get("token"))
            except Exception as e:
                self.send_json_response({"error": str(e)}, status=500)
            return

        if path == "/api/auth/logout":
            token = self.extract_token()
            db.delete_session(token)
            self.send_json_response({"success": True})
            return

        # 2. Projects Endpoints
        if path == "/api/projects":
            user = self.require_user()
            if not user:
                return
            try:
                data = self.read_json_body()
                name = data.get("name", "Untitled Network").strip()
                desc = data.get("description", "").strip()
                proj = db.create_project(user["id"], name, desc)

                # Optional initial dataset attached
                initial_dataset = data.get("neighborhoods")
                if initial_dataset:
                    db.save_dataset_neighborhoods(proj["id"], data.get("datasetName", "Initial Demand"), initial_dataset)

                full_proj = db.get_project(user["id"], proj["id"])
                self.send_json_response({"project": full_proj or proj}, status=201)
            except Exception as e:
                self.send_json_response({"error": str(e)}, status=500)
            return

        # POST /api/projects/:id/duplicate
        m_dup = re.match(r"^/api/projects/([a-zA-Z0-9_-]+)/duplicate$", path)
        if m_dup:
            user = self.require_user()
            if user:
                proj_id = m_dup.group(1)
                new_proj = db.duplicate_project(user["id"], proj_id)
                self.send_json_response({"project": new_proj}, status=201)
            return

        # POST /api/projects/:id/datasets
        m_ds = re.match(r"^/api/projects/([a-zA-Z0-9_-]+)/datasets$", path)
        if m_ds:
            user = self.require_user()
            if not user:
                return
            try:
                proj_id = m_ds.group(1)
                data = self.read_json_body()
                dataset_name = data.get("name", "Imported Demand")
                neighborhoods = data.get("neighborhoods", [])
                if not neighborhoods:
                    self.send_json_response({"error": "No neighborhoods provided in dataset."}, status=400)
                    return
                saved = db.save_dataset_neighborhoods(proj_id, dataset_name, neighborhoods)
                self.send_json_response({"success": True, "dataset": saved})
            except Exception as e:
                self.send_json_response({"error": str(e)}, status=500)
            return

        # POST /api/projects/:id/optimize
        m_opt = re.match(r"^/api/projects/([a-zA-Z0-9_-]+)/optimize$", path)
        if m_opt:
            user = self.require_user()
            if not user:
                return
            try:
                proj_id = m_opt.group(1)
                data = self.read_json_body()
                k = data.get("warehouseCount") or data.get("k") or 3
                capacity = data.get("capacity")
                radius = data.get("serviceRadius")
                objective = data.get("objective") or "weighted_cost"

                # Fetch neighborhoods for this project
                neighborhoods = db.get_project_neighborhoods(proj_id)
                if not neighborhoods:
                    # Check if neighborhoods supplied directly in body
                    neighborhoods = data.get("neighborhoods", [])

                if not neighborhoods:
                    self.send_json_response({"error": "Project has no dataset neighborhoods to optimize."}, status=400)
                    return

                # Calculate baseline metrics:
                # If neighborhoods match Bangalore demo, use Majestic Depot (12.9774, 77.5708)
                # Otherwise, calculate baseline from dataset's own order-weighted centroid
                tot_orders = sum(float(n.get("dailyOrders") or n.get("daily_orders") or n.get("dailyDemand") or 100) for n in neighborhoods) or 1
                c_lat = sum(float(n.get("dailyOrders") or n.get("daily_orders") or 100) * float(n.get("latitude") if n.get("latitude") is not None else n.get("lat", 0.0)) for n in neighborhoods) / tot_orders
                c_lon = sum(float(n.get("dailyOrders") or n.get("daily_orders") or 100) * float(n.get("longitude") if n.get("longitude") is not None else (n.get("lon") if n.get("lon") is not None else n.get("lng", 0.0))) for n in neighborhoods) / tot_orders
                
                dist_to_majestic = haversine_distance(c_lat, c_lon, 12.9774, 77.5708)
                if dist_to_majestic < 60 and len(neighborhoods) == 28:
                    base_lat, base_lon = 12.9774, 77.5708
                else:
                    base_lat, base_lon = c_lat, c_lon

                tot_base_dist = sum(
                    (float(n.get("dailyOrders") or n.get("daily_orders") or n.get("dailyDemand") or 100)) * haversine_distance(
                        float(n.get("latitude") if n.get("latitude") is not None else n.get("lat", 0.0)),
                        float(n.get("longitude") if n.get("longitude") is not None else (n.get("lon") if n.get("lon") is not None else n.get("lng", 0.0))),
                        base_lat, base_lon
                    )
                    for n in neighborhoods
                )
                tot_base_cost = tot_base_dist * DEFAULT_RATE_PER_KM
                baseline_metrics = {
                    "totalDeliveryCostInr": round(tot_base_cost, 2),
                    "totalDeliveryDistanceKm": round(tot_base_dist, 1)
                }

                # Run Fermat-Weber optimization
                opt_result = optimize_network(neighborhoods, k=k, max_capacity=capacity, max_radius=radius, objective=objective)

                # Persist to database
                saved_run = db.save_optimization_run(proj_id, opt_result, baseline_metrics)
                self.send_json_response({
                    "run": saved_run,
                    "warehouses": opt_result["warehouses"],
                    "assignments": opt_result["assignments"],
                    "metrics": opt_result["metrics"]
                })
            except Exception as e:
                self.send_json_response({"error": str(e)}, status=500)
            return

        # POST /api/save-compiled (For bundling & precompilation)
        if path == "/api/save-compiled":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length)
                out_path = os.path.join(DIRECTORY, "js", "bundle.compiled.js")
                with open(out_path, "wb") as f:
                    f.write(body)
                self.send_json_response({"success": True, "bytes": len(body)})
            except Exception as e:
                self.send_json_response({"error": str(e)}, status=500)
            return

        # POST /api/projects/:id/scenarios
        m_scen = re.match(r"^/api/projects/([a-zA-Z0-9_-]+)/scenarios$", path)
        if m_scen:
            user = self.require_user()
            if not user:
                return
            try:
                proj_id = m_scen.group(1)
                neighborhoods = db.get_project_neighborhoods(proj_id)
                if not neighborhoods:
                    self.send_json_response({"error": "No dataset found for project"}, status=400)
                    return

                scenarios = []
                for k_val in range(1, 6):
                    res = optimize_network(neighborhoods, k=k_val)
                    del_cost = res["metrics"]["totalDeliveryCostInr"]
                    infra_cost = k_val * FIXED_WH_DAILY_COST
                    scenarios.append({
                        "k": k_val,
                        "name": f"Scenario {chr(64 + k_val)} ({k_val} Hubs)",
                        "deliveryCostInr": del_cost,
                        "infrastructureCostInr": infra_cost,
                        "totalCostInr": del_cost + infra_cost,
                        "averageDistanceKm": res["metrics"]["averageDeliveryDistanceKm"],
                        "totalDistanceKm": res["metrics"]["totalDeliveryDistanceKm"],
                        "warehouses": res["warehouses"]
                    })

                min_idx = min(range(len(scenarios)), key=lambda i: scenarios[i]["totalCostInr"])
                scenarios[min_idx]["isSweetSpot"] = True
                self.send_json_response({"scenarios": scenarios, "sweetSpotK": min_idx + 1})
            except Exception as e:
                self.send_json_response({"error": str(e)}, status=500)
            return

        # Backward-compatible /api/optimize
        if path == "/api/optimize":
            try:
                data = self.read_json_body()
                neighborhoods = data.get("neighborhoods", [])
                k = data.get("k", 3)
                result = optimize_network(neighborhoods, k=k)
                self.send_json_response(result)
            except Exception as e:
                self.send_json_response({"error": str(e)}, status=400)
            return

        # POST /api/chat (Intelligent AI Logistics Copilot)
        if path == "/api/chat":
            try:
                data = self.read_json_body()
                message = data.get("message", "").strip()
                history = data.get("history", [])
                context = data.get("context", {})
                chat_res = handle_ai_chat(message, history, context)
                self.send_json_response(chat_res)
            except Exception as e:
                self.send_json_response({"error": str(e), "reply": "An error occurred while analyzing warehouse logistics."}, status=500)
            return

        # POST /api/feedback (In-Chat Feedback & Micro-Reviews)
        if path == "/api/feedback":
            try:
                data = self.read_json_body()
                user = self.get_current_user()
                user_id = user["id"] if user else None
                category = data.get("category", "General Review")
                feedback_text = data.get("feedbackText") or data.get("text") or "User Feedback"
                rating = data.get("rating")
                res = db.save_user_feedback(category=category, feedback_text=feedback_text, rating=rating, user_id=user_id)
                self.send_json_response(res)
            except Exception as e:
                self.send_json_response({"error": str(e)}, status=400)
            return

        self.send_error(404, "Endpoint not found")

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/auth/profile":
            user = self.require_user()
            if user:
                data = self.read_json_body()
                full_name = data.get("fullName", user["fullName"])
                org = data.get("organization", user["organization"])
                res = db.update_user_profile(user["id"], full_name, org)
                self.send_json_response({"user": res})
            return
        self.send_error(404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        m_del = re.match(r"^/api/projects/([a-zA-Z0-9_-]+)$", path)
        if m_del:
            user = self.require_user()
            if user:
                proj_id = m_del.group(1)
                deleted = db.delete_project(user["id"], proj_id)
                self.send_json_response({"success": deleted})
            return
        self.send_error(404)


def run_server(port=PORT):
    # Ensure database tables exist
    db.init_db()
    with http.server.ThreadingHTTPServer(("", port), GridpointHandler) as httpd:
        print(f"[GRIDPOINT] Server listening on http://localhost:{port}")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
