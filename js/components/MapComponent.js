// SHELVO — Geospatial Map Engine & Isochrone Visualizer
// Proportional demand nodes, interactive flowlines, 15-min quick-commerce SLA isochrones, and radar warehouse beacons.

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

window.GRIDPOINT_COMPONENTS.MapComponent = function({
  neighborhoods,
  optimizationResult,
  selectedWarehouse,
  onSelectWarehouse,
  onOpenImport,
  activeView
}) {
  const mapContainerRef = React.useRef(null);
  const leafletMapRef = React.useRef(null);
  const layersRef = React.useRef({
    nodesLayer: null,
    linesLayer: null,
    warehousesLayer: null,
    radiiLayer: null,
    slaLayer: null
  });

  const [showFlowlines, setShowFlowlines] = React.useState(true);
  const [showSlaIsochrones, setShowSlaIsochrones] = React.useState(true);
  const [showRadii, setShowRadii] = React.useState(true);

  // Calculate dynamic geographic bounds from all coordinates
  const calculateBounds = React.useCallback((nodes, warehouses) => {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    let validCount = 0;

    (nodes || []).forEach(n => {
      const lat = parseFloat(n.latitude);
      const lng = parseFloat(n.longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        validCount++;
      }
    });

    (warehouses || []).forEach(wh => {
      const lat = parseFloat(wh.latitude);
      const lng = parseFloat(wh.longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        validCount++;
      }
    });

    if (validCount === 0) return null;

    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    const isSingleOrTight = (latSpan < 0.008) && (lngSpan < 0.008);
    const center = [(minLat + maxLat) / 2, (minLng + maxLng) / 2];

    return {
      minLat, maxLat, minLng, maxLng,
      center,
      isSingleOrTight,
      bounds: L.latLngBounds([minLat, minLng], [maxLat, maxLng]),
      count: validCount
    };
  }, []);

  // Initialize Leaflet Map once
  React.useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;

    const initialGeo = calculateBounds(neighborhoods, null);
    const initialCenter = initialGeo ? initialGeo.center : [12.9716, 77.5946];
    const initialZoom = initialGeo ? (initialGeo.isSingleOrTight ? 13 : 11) : 11;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      fadeAnimation: true,
      zoomAnimation: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      className: 'dark-osm-tiles'
    }).addTo(map);

    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    L.control.attribution({ position: 'bottomleft', prefix: 'SHELVO Geospatial OR' }).addTo(map);

    // Layer groups for clean updates
    layersRef.current.radiiLayer = L.layerGroup().addTo(map);
    layersRef.current.slaLayer = L.layerGroup().addTo(map);
    layersRef.current.linesLayer = L.layerGroup().addTo(map);
    layersRef.current.nodesLayer = L.layerGroup().addTo(map);
    layersRef.current.warehousesLayer = L.layerGroup().addTo(map);

    leafletMapRef.current = map;

    let resizeObserver = null;
    if (window.ResizeObserver && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    const onWindowResize = () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', onWindowResize);

    setTimeout(() => {
      if (!leafletMapRef.current) return;
      leafletMapRef.current.invalidateSize();
      if (initialGeo) {
        if (initialGeo.isSingleOrTight) {
          leafletMapRef.current.setView(initialGeo.center, 13);
        } else {
          leafletMapRef.current.fitBounds(initialGeo.bounds, {
            padding: [80, 80],
            maxZoom: 13
          });
        }
      }
    }, 100);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', onWindowResize);
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Update map contents & automatically fit viewport whenever data or toggle states change
  React.useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const { nodesLayer, linesLayer, warehousesLayer, radiiLayer, slaLayer } = layersRef.current;
    nodesLayer.clearLayers();
    linesLayer.clearLayers();
    warehousesLayer.clearLayers();
    radiiLayer.clearLayers();
    if (slaLayer) slaLayer.clearLayers();

    if (!neighborhoods || neighborhoods.length === 0) return;

    const roadFactor = (optimizationResult && optimizationResult.solverStats && optimizationResult.solverStats.roadFactor) || 1.30;

    // 1. Render Service Radii & 15-min SLA Isochrone Rings
    if (optimizationResult && optimizationResult.warehouses) {
      optimizationResult.warehouses.forEach(wh => {
        const isSelected = selectedWarehouse && selectedWarehouse.id === wh.id;

        // Service Boundary Radius Ring
        if (showRadii) {
          const radiusMeters = (wh.serviceRadiusKm || 8) * 1000;
          const circle = L.circle([wh.latitude, wh.longitude], {
            radius: radiusMeters,
            color: wh.color || '#D4A373',
            weight: isSelected ? 1.8 : 0.8,
            opacity: isSelected ? 0.6 : 0.25,
            fillColor: wh.color || '#D4A373',
            fillOpacity: isSelected ? 0.08 : 0.03,
            dashArray: '4, 8'
          });
          radiiLayer.addLayer(circle);
        }

        // 15-Minute Quick-Commerce SLA Isochrone Ring (approx 4.6km straight-line = 6.0km road @ 24km/h)
        if (showSlaIsochrones && slaLayer) {
          const slaRadiusMeters = (6.0 / roadFactor) * 1000;
          const slaCircle = L.circle([wh.latitude, wh.longitude], {
            radius: slaRadiusMeters,
            color: '#10B981',
            weight: 1.2,
            opacity: 0.5,
            fillColor: '#10B981',
            fillOpacity: 0.04,
            dashArray: '3, 6'
          });
          slaLayer.addLayer(slaCircle);
        }
      });
    }

    // 2. Resolve assignments for each neighborhood
    let assignmentsArray = (optimizationResult && Array.isArray(optimizationResult.assignments) && optimizationResult.assignments.length === neighborhoods.length)
      ? optimizationResult.assignments
      : null;

    if (!assignmentsArray && optimizationResult && optimizationResult.warehouses && optimizationResult.warehouses.length > 0) {
      assignmentsArray = neighborhoods.map(n => {
        const nName = (n.neighborhood || n.name || '').toLowerCase();
        for (let wIdx = 0; wIdx < optimizationResult.warehouses.length; wIdx++) {
          const wh = optimizationResult.warehouses[wIdx];
          if (wh.assignedNeighborhoods && wh.assignedNeighborhoods.some(item => (item.name || item.neighborhood || '').toLowerCase() === nName)) {
            return wIdx;
          }
        }
        let minDist = Infinity;
        let bestW = 0;
        optimizationResult.warehouses.forEach((wh, wIdx) => {
          const d = window.GRIDPOINT_ALGO.haversine(n.latitude, n.longitude, wh.latitude, wh.longitude);
          if (d < minDist) {
            minDist = d;
            bestW = wIdx;
          }
        });
        return bestW;
      });
    }

    // Render Connecting Flowline Arcs
    if (showFlowlines && optimizationResult && optimizationResult.warehouses && assignmentsArray) {
      neighborhoods.forEach((n, i) => {
        const whIndex = assignmentsArray[i];
        const wh = optimizationResult.warehouses[whIndex];
        if (!wh) return;

        const isWhSelected = selectedWarehouse && selectedWarehouse.id === wh.id;
        const line = L.polyline(
          [[n.latitude, n.longitude], [wh.latitude, wh.longitude]],
          {
            color: wh.color || '#D4A373',
            weight: isWhSelected ? 1.8 : 1.0,
            opacity: isWhSelected ? 0.85 : 0.35,
            dashArray: isWhSelected ? null : '4, 6',
            className: isWhSelected ? '' : 'connector-flowing'
          }
        );
        linesLayer.addLayer(line);
      });
    }

    // 3. Render Neighborhood Demand Points
    const maxOrders = Math.max(...neighborhoods.map(d => d.dailyOrders || d.daily_orders || 100));
    const minOrders = Math.min(...neighborhoods.map(d => d.dailyOrders || d.daily_orders || 100));

    neighborhoods.forEach((n, i) => {
      const orders = parseFloat(n.dailyOrders || n.daily_orders || n.dailyDemand || 100);
      const normalized = (orders - minOrders) / (maxOrders - minOrders || 1);
      const radius = 4.5 + normalized * 8.5;

      let nodeColor = '#94A3B8';
      let assignedWh = null;

      if (optimizationResult && optimizationResult.warehouses && assignmentsArray) {
        const whIndex = assignmentsArray[i];
        assignedWh = optimizationResult.warehouses[whIndex];
        if (assignedWh) {
          nodeColor = assignedWh.color;
        }
      }

      const distGeo = assignedWh
        ? window.GRIDPOINT_ALGO.haversine(n.latitude, n.longitude, assignedWh.latitude, assignedWh.longitude)
        : null;
      const distRoad = distGeo !== null ? (distGeo * roadFactor) : null;
      const transitMinutes = distRoad !== null ? ((distRoad / 24) * 60) : null;
      const isSla15 = transitMinutes !== null && transitMinutes <= 15;

      const circleMarker = L.circleMarker([n.latitude, n.longitude], {
        radius: radius,
        fillColor: nodeColor,
        fillOpacity: 0.78,
        color: '#FFFFFF',
        weight: 1.2,
        opacity: 0.9
      });

      const tooltipContent = `
        <div style="background:#0F1218; border:1px solid rgba(255,255,255,0.14); padding:10px 14px; color:#F4F4F6; font-family:'Inter', sans-serif; box-shadow:0 12px 28px rgba(0,0,0,0.8); min-width:200px; border-radius:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-family:'Geist Mono', monospace; font-size:9px; color:#8E96A4; letter-spacing:0.08em; text-transform:uppercase;">DEMAND NODE</span>
            ${isSla15 ? '<span style="font-family:\'Geist Mono\', monospace; font-size:8px; font-weight:700; background:rgba(16,185,129,0.2); color:#10B981; border:1px solid rgba(16,185,129,0.4); padding:1px 4px; border-radius:3px;">⚡ 15m SLA OK</span>' : ''}
          </div>
          <div style="font-size:13px; font-weight:700; color:#FFF; margin-bottom:6px;">
            ${n.neighborhood || n.name || "Delivery Zone"}
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:3px;">
            <span style="color:#8E96A4;">Daily Orders:</span>
            <span style="font-family:'Geist Mono', monospace; font-weight:600; color:${nodeColor};">${Math.round(orders).toLocaleString()} /day</span>
          </div>
          ${assignedWh ? `
            <div style="border-top:1px solid rgba(255,255,255,0.08); margin-top:6px; padding-top:6px; display:flex; justify-content:space-between; font-size:11px;">
              <span style="color:#8E96A4;">Assigned Hub:</span>
              <span style="font-weight:600; color:${assignedWh.color};">${assignedWh.name}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-top:2px;">
              <span style="color:#8E96A4;">Road Distance (${roadFactor.toFixed(2)}x):</span>
              <span style="font-family:'Geist Mono', monospace; color:#FFF;">${distRoad.toFixed(2)} km</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-top:2px;">
              <span style="color:#8E96A4;">Estimated Transit:</span>
              <span style="font-family:'Geist Mono', monospace; font-weight:600; color:${isSla15 ? '#10B981' : '#F59E0B'};">~${transitMinutes.toFixed(1)} mins</span>
            </div>
          ` : ''}
        </div>
      `;

      circleMarker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -radius],
        opacity: 1,
        className: 'custom-leaflet-tooltip'
      });

      nodesLayer.addLayer(circleMarker);
    });

    // 4. Render Warehouse Markers with radar pulses
    if (optimizationResult && optimizationResult.warehouses) {
      optimizationResult.warehouses.forEach(wh => {
        const isSelected = selectedWarehouse && selectedWarehouse.id === wh.id;

        const customIcon = L.divIcon({
          className: 'warehouse-div-icon',
          html: `
            <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
              <div class="radar-beacon" style="width:40px; height:40px; border:1px solid ${wh.color};"></div>
              <div class="radar-beacon radar-beacon-delay" style="width:40px; height:40px; border:1px solid ${wh.color};"></div>
              
              <div style="width:24px; height:24px; transform:rotate(45deg); background:#0F1218; border:2px solid ${wh.color}; display:flex; align-items:center; justify-content:center; box-shadow:0 0 16px ${wh.color}66; ${isSelected ? 'outline:2px solid #FFF; outline-offset:2px;' : ''}">
                <div style="width:10px; height:10px; background:${wh.color};"></div>
              </div>

              <div style="position:absolute; bottom:-18px; white-space:nowrap; background:#0B0D11; border:1px solid rgba(255,255,255,0.15); padding:1px 6px; font-family:'Geist Mono', monospace; font-size:9px; font-weight:600; color:#FFF; letter-spacing:0.04em;">
                ${wh.id}
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const marker = L.marker([wh.latitude, wh.longitude], { icon: customIcon });
        marker.on('click', () => {
          if (onSelectWarehouse) onSelectWarehouse(wh);
        });

        warehousesLayer.addLayer(marker);
      });
    }

    // Dynamic Viewport Fitting
    const geo = calculateBounds(
      neighborhoods,
      optimizationResult ? optimizationResult.warehouses : null
    );
    if (geo && leafletMapRef.current) {
      if (geo.isSingleOrTight) {
        leafletMapRef.current.setView(geo.center, 13);
      } else {
        leafletMapRef.current.fitBounds(geo.bounds, {
          padding: [80, 80],
          maxZoom: 13
        });
      }
    }
  }, [neighborhoods, optimizationResult, selectedWarehouse, showFlowlines, showSlaIsochrones, showRadii, calculateBounds]);

  return React.createElement("div", { className: "relative w-full h-full" },
    React.createElement("div", { ref: mapContainerRef, className: "w-full h-full bg-[#08090C]" }),

    /* Floating Map Layer Toggles */
    React.createElement("div", {
      className: "absolute bottom-6 left-6 z-[1000] flex items-center space-x-1.5 p-1 rounded-xl bg-[#090B0E]/90 backdrop-blur-xl border border-white/12 shadow-xl text-[10px] font-mono select-none"
    },
      React.createElement("button", {
        type: "button",
        onClick: () => setShowFlowlines(!showFlowlines),
        className: `px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
          showFlowlines
            ? 'bg-white/[0.1] text-white font-bold border border-white/20'
            : 'text-white/40 hover:text-white'
        }`,
        title: "Toggle flowline transit arcs"
      }, showFlowlines ? '✓ ARCS' : 'ARCS'),

      React.createElement("button", {
        type: "button",
        onClick: () => setShowSlaIsochrones(!showSlaIsochrones),
        className: `px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
          showSlaIsochrones
            ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
            : 'text-white/40 hover:text-white'
        }`,
        title: "Toggle 15-minute quick commerce SLA isochrone rings"
      }, showSlaIsochrones ? '✓ 15m SLA' : '15m SLA'),

      React.createElement("button", {
        type: "button",
        onClick: () => setShowRadii(!showRadii),
        className: `px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
          showRadii
            ? 'bg-white/[0.1] text-white font-bold border border-white/20'
            : 'text-white/40 hover:text-white'
        }`,
        title: "Toggle maximum facility catchment boundaries"
      }, showRadii ? '✓ CATCHMENT' : 'CATCHMENT')
    )
  );
};
