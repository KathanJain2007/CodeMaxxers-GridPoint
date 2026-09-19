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
            "totalDeliveryDistanceKm": round(total_dist_km, 1),
            "averageDeliveryDistanceKm": round(avg_dist_km, 2),
            "totalDailyOrders": int(total_orders),
            "assignedDemandPercent": 100.0,
            "totalEmissionsKgCo2": round((total_dist_km / 10) * 0.21)
        }
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

                # Calculate baseline metrics (Majestic Depot 12.9774, 77.5708)
                base_lat, base_lon = 12.9774, 77.5708
                tot_base_dist = sum(
                    (float(n.get("dailyOrders") or n.get("daily_orders") or n.get("dailyDemand") or 100)) * haversine_distance(
                        float(n.get("latitude") if n.get("latitude") is not None else n.get("lat", 0.0)),
                        float(n.get("longitude") if n.get("longitude") is not None else n.get("lon") if n.get("lon") is not None else n.get("lng", 0.0)),
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
