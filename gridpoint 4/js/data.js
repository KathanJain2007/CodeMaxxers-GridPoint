// GRIDPOINT — Data Engine & Geocoded Reference Corpora
window.GRIDPOINT_DATA = (function() {
  
  // High-fidelity Bengaluru metropolitan dataset (28 micro-markets across tech corridors & residential hubs)
  const BENGALURU_DEMO_DATA = [
    { neighborhood: "Koramangala", latitude: 12.9352, longitude: 77.6245, dailyOrders: 580, zone: "South East" },
    { neighborhood: "Indiranagar", latitude: 12.9719, longitude: 77.6412, dailyOrders: 520, zone: "Central East" },
    { neighborhood: "HSR Layout", latitude: 12.9116, longitude: 77.6741, dailyOrders: 490, zone: "South East" },
    { neighborhood: "Whitefield", latitude: 12.9698, longitude: 77.7499, dailyOrders: 640, zone: "East Corridor" },
    { neighborhood: "Electronic City", latitude: 12.8452, longitude: 77.6602, dailyOrders: 510, zone: "Far South" },
    { neighborhood: "Jayanagar", latitude: 12.9308, longitude: 77.5838, dailyOrders: 440, zone: "South" },
    { neighborhood: "Malleshwaram", latitude: 13.0031, longitude: 77.5643, dailyOrders: 380, zone: "North West" },
    { neighborhood: "Bellandur", latitude: 12.9260, longitude: 77.6762, dailyOrders: 560, zone: "South East" },
    { neighborhood: "Marathahalli", latitude: 12.9591, longitude: 77.6974, dailyOrders: 480, zone: "East" },
    { neighborhood: "Hebbal", latitude: 13.0358, longitude: 77.5970, dailyOrders: 390, zone: "North" },
    { neighborhood: "Rajajinagar", latitude: 12.9915, longitude: 77.5524, dailyOrders: 340, zone: "West" },
    { neighborhood: "Banashankari", latitude: 12.9255, longitude: 77.5468, dailyOrders: 360, zone: "South West" },
    { neighborhood: "BTM Layout", latitude: 12.9166, longitude: 77.6101, dailyOrders: 430, zone: "South" },
    { neighborhood: "Yelahanka", latitude: 13.1007, longitude: 77.5963, dailyOrders: 310, zone: "Far North" },
    { neighborhood: "Sarjapur Road", latitude: 12.9081, longitude: 77.6953, dailyOrders: 470, zone: "South East" },
    { neighborhood: "JP Nagar", latitude: 12.9063, longitude: 77.5857, dailyOrders: 410, zone: "South" },
    { neighborhood: "Sadashivanagar", latitude: 13.0068, longitude: 77.5813, dailyOrders: 290, zone: "Central North" },
    { neighborhood: "Basavanagudi", latitude: 12.9421, longitude: 77.5753, dailyOrders: 350, zone: "South Central" },
    { neighborhood: "Frazer Town", latitude: 12.9968, longitude: 77.6130, dailyOrders: 320, zone: "Central North" },
    { neighborhood: "RT Nagar", latitude: 13.0234, longitude: 77.5937, dailyOrders: 280, zone: "North" },
    { neighborhood: "Domlur", latitude: 12.9609, longitude: 77.6387, dailyOrders: 370, zone: "Central East" },
    { neighborhood: "Ulsoor", latitude: 12.9817, longitude: 77.6285, dailyOrders: 340, zone: "Central" },
    { neighborhood: "Mahadevapura", latitude: 12.9866, longitude: 77.6961, dailyOrders: 460, zone: "East" },
    { neighborhood: "KR Puram", latitude: 13.0075, longitude: 77.6959, dailyOrders: 410, zone: "North East" },
    { neighborhood: "Peenya", latitude: 13.0329, longitude: 77.5273, dailyOrders: 260, zone: "North West Industrial" },
    { neighborhood: "Kengeri", latitude: 12.9177, longitude: 77.4838, dailyOrders: 240, zone: "West Suburb" },
    { neighborhood: "Yeshwanthpur", latitude: 13.0228, longitude: 77.5487, dailyOrders: 330, zone: "North West" },
    { neighborhood: "Nagarbhavi", latitude: 12.9592, longitude: 77.5098, dailyOrders: 270, zone: "West" }
  ];

  // Baseline Current Network: 1 legacy facility at Bangalore Majestic Railway Hub
  const LEGACY_BASELINE = {
    warehouse: {
      id: "LEGACY-01",
      name: "Legacy Central Depot (Majestic)",
      latitude: 12.9774,
      longitude: 77.5708,
      status: "Legacy Centralized Hub"
    },
    fixedDailyCostInr: 45000,
    costPerKmInr: 15.0
  };

  // Color palette for warehouse clusters (distinct, elegant, high contrast on dark maps)
  const CLUSTER_PALETTE = [
    { primary: "#D4A373", light: "#E29578", glow: "rgba(212, 163, 115, 0.4)", tag: "COPPER" },
    { primary: "#38BDF8", light: "#7DD3FC", glow: "rgba(56, 189, 248, 0.4)", tag: "CYAN" },
    { primary: "#10B981", light: "#34D399", glow: "rgba(16, 185, 129, 0.4)", tag: "EMERALD" },
    { primary: "#A78BFA", light: "#C4B5FD", glow: "rgba(167, 139, 250, 0.4)", tag: "VIOLET" },
    { primary: "#FB923C", light: "#FDBA74", glow: "rgba(251, 146, 60, 0.4)", tag: "AMBER" },
    { primary: "#F43F5E", light: "#FB7185", glow: "rgba(244, 63, 94, 0.4)", tag: "ROSE" }
  ];

  /**
   * CSV Parsing and schema validation
   */
  function parseDemandCSV(csvContent) {
    if (!csvContent || typeof csvContent !== 'string') {
      return { success: false, error: "Empty or invalid CSV file content." };
    }

    const lines = csvContent.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { success: false, error: "CSV must include a header and at least one data row." };
    }

    // Header normalization
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s_]/g, ''));
    
    const nameIdx = headers.findIndex(h => h.includes("neighbor") || h.includes("name") || h.includes("area") || h.includes("loc"));
    const latIdx = headers.findIndex(h => h.includes("lat"));
    const lonIdx = headers.findIndex(h => h.includes("lon") || h.includes("lng"));
    const ordersIdx = headers.findIndex(h => h.includes("order") || h.includes("demand") || h.includes("volume") || h.includes("daily"));

    if (nameIdx === -1 || latIdx === -1 || lonIdx === -1 || ordersIdx === -1) {
      return {
        success: false,
        error: "Missing required headers. Ensure CSV has: Neighborhood, Latitude, Longitude, Daily Orders"
      };
    }

    const parsedData = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 4) {
        errors.push(`Row ${i + 1}: Incomplete column count.`);
        continue;
      }

      const name = cols[nameIdx];
      const lat = parseFloat(cols[latIdx]);
      const lon = parseFloat(cols[lonIdx]);
      const orders = parseInt(cols[ordersIdx], 10);

      if (!name) {
        errors.push(`Row ${i + 1}: Neighborhood name is empty.`);
        continue;
      }
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push(`Row ${i + 1}: Invalid latitude '${cols[latIdx]}'. Must be between -90 and 90.`);
        continue;
      }
      if (isNaN(lon) || lon < -180 || lon > 180) {
        errors.push(`Row ${i + 1}: Invalid longitude '${cols[lonIdx]}'. Must be between -180 and 180.`);
        continue;
      }
      if (isNaN(orders) || orders < 1) {
        errors.push(`Row ${i + 1}: Daily orders must be a positive integer.`);
        continue;
      }

      parsedData.push({
        neighborhood: name,
        latitude: lat,
        longitude: lon,
        dailyOrders: orders
      });
    }

    if (parsedData.length === 0) {
      return { success: false, error: "No valid neighborhood rows found in CSV." };
    }

    return {
      success: true,
      data: parsedData,
      warnings: errors.length > 0 ? errors.slice(0, 5) : []
    };
  }

  function exportCSV(data) {
    const headers = "Neighborhood,Latitude,Longitude,Daily Orders\n";
    const rows = data.map(d => `"${d.neighborhood}",${d.latitude},${d.longitude},${d.dailyOrders}`).join("\n");
    return headers + rows;
  }

  return {
    BENGALURU_DEMO_DATA,
    LEGACY_BASELINE,
    CLUSTER_PALETTE,
    parseDemandCSV,
    exportCSV
  };
})();
