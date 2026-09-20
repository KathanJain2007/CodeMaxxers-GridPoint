// SHELVO — Interactive Leaflet Map Component
// Dark geospatial engine, automatic & dynamic bounds fitting, proportional demand nodes, warehouse beacons, animated connecting arcs, and service radii.

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
    radiiLayer: null
  });

  // Calculate dynamic geographic bounds from all coordinates (Sections 1, 2, 3, 11)
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

    // Calculate initial center and bounds if neighborhoods are available
    const initialGeo = calculateBounds(neighborhoods, null);
    const initialCenter = initialGeo ? initialGeo.center : [12.9716, 77.5946];
    const initialZoom = initialGeo ? (initialGeo.isSingleOrTight ? 13 : 11) : 11;

    // Initialize Map with zoom control positioned safely at bottom-left
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      fadeAnimation: true,
      zoomAnimation: true
    });

    // OpenStreetMap tiles (100% free, no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      className: 'dark-osm-tiles'
    }).addTo(map);

    // Keep zoom controls accessible at bottom-left (so they NEVER overlap top-right optimization panel)
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Minimal dark attribution at bottom-left
    L.control.attribution({ position: 'bottomleft', prefix: 'SHELVO Geospatial' }).addTo(map);

    // Layer groups for clean updates
    layersRef.current.radiiLayer = L.layerGroup().addTo(map);
    layersRef.current.linesLayer = L.layerGroup().addTo(map);
    layersRef.current.nodesLayer = L.layerGroup().addTo(map);
    layersRef.current.warehousesLayer = L.layerGroup().addTo(map);

    leafletMapRef.current = map;

    // Handle container resize via ResizeObserver so size is never 0
    let resizeObserver = null;
    if (window.ResizeObserver && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    // Window resize listener
    const onWindowResize = () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', onWindowResize);

    // Immediate initial size invalidation & bounds fit
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

  // Update map contents & automatically fit viewport whenever data changes
  React.useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const { nodesLayer, linesLayer, warehousesLayer, radiiLayer } = layersRef.current;
    nodesLayer.clearLayers();
    linesLayer.clearLayers();
    warehousesLayer.clearLayers();
    radiiLayer.clearLayers();

    if (!neighborhoods || neighborhoods.length === 0) {
      return;
    }

    // 1. Render Service Radii (if optimized)
    if (optimizationResult && optimizationResult.warehouses) {
      optimizationResult.warehouses.forEach(wh => {
        const radiusMeters = (wh.serviceRadiusKm || 8) * 1000;
        const isSelected = selectedWarehouse && selectedWarehouse.id === wh.id;

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
      });
    }

    // 2. Resolve assignment for each neighborhood (from assignments array or assignedNeighborhoods or nearest centroid)
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
        // Fallback: nearest warehouse by geodesic distance
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

    // Render Connecting Lines from Neighborhoods to Warehouses (if optimized)
    if (optimizationResult && optimizationResult.warehouses && assignmentsArray) {
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

    // 3. Render Neighborhood Points (sized proportionally to Daily Orders)
    const maxOrders = Math.max(...neighborhoods.map(d => d.dailyOrders || 100));
    const minOrders = Math.min(...neighborhoods.map(d => d.dailyOrders || 100));

    neighborhoods.forEach((n, i) => {
      // Proportional radius calculation (4.5px to 13px)
      const orders = n.dailyOrders || 200;
      const normalized = (orders - minOrders) / (maxOrders - minOrders || 1);
      const radius = 4.5 + normalized * 8.5;

      // Color coding: cluster color if optimized, neutral warm silver if raw
      let nodeColor = '#94A3B8';
      let assignedWh = null;

      if (optimizationResult && optimizationResult.warehouses && assignmentsArray) {
        const whIndex = assignmentsArray[i];
        assignedWh = optimizationResult.warehouses[whIndex];
        if (assignedWh) {
          nodeColor = assignedWh.color;
        }
      }

      const distToWh = assignedWh
        ? window.GRIDPOINT_ALGO.haversine(n.latitude, n.longitude, assignedWh.latitude, assignedWh.longitude).toFixed(1)
        : null;

      const circleMarker = L.circleMarker([n.latitude, n.longitude], {
        radius: radius,
        fillColor: nodeColor,
        fillOpacity: 0.75,
        color: '#FFFFFF',
        weight: 1.2,
        opacity: 0.9
      });

      // Rich Bloomberg-style tooltip
      const tooltipContent = `
        <div style="background:#0F1218; border:1px solid rgba(255,255,255,0.12); padding:10px 14px; color:#F4F4F6; font-family:'Inter', sans-serif; box-shadow:0 12px 28px rgba(0,0,0,0.7); min-width:180px;">
          <div style="font-family:'Geist Mono', monospace; font-size:10px; color:#8E96A4; letter-spacing:0.08em; text-transform:uppercase;">
            NEIGHBORHOOD NODE
          </div>
          <div style="font-size:14px; font-weight:600; color:#FFF; margin-top:2px; margin-bottom:8px;">
            ${n.neighborhood}
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
            <span style="color:#8E96A4;">Daily Orders:</span>
            <span style="font-family:'Geist Mono', monospace; font-weight:600; color:${nodeColor};">${orders.toLocaleString()} /day</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
            <span style="color:#8E96A4;">Coordinates:</span>
            <span style="font-family:'Geist Mono', monospace; color:#CBD5E1;">${n.latitude.toFixed(3)}°, ${n.longitude.toFixed(3)}°</span>
          </div>
          ${assignedWh ? `
            <div style="border-top:1px solid rgba(255,255,255,0.08); margin-top:6px; padding-top:6px; display:flex; justify-content:space-between; font-size:11px;">
              <span style="color:#8E96A4;">Assigned Hub:</span>
              <span style="font-weight:600; color:${assignedWh.color};">${assignedWh.name}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:11px;">
              <span style="color:#8E96A4;">Transit Distance:</span>
              <span style="font-family:'Geist Mono', monospace; color:#FFF;">${distToWh} km</span>
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

    // 4. Render Warehouse Markers (distinct geometric icons with pulsing radar beacons)
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

    // 5. Automatic Dynamic Viewport Fitting (Sections 1, 2, 3, 11)
    // Fits map bounds to BOTH neighborhood coordinates and warehouse coordinates
    const geo = calculateBounds(
      neighborhoods,
      optimizationResult ? optimizationResult.warehouses : null
    );

    if (geo && map) {
      map.invalidateSize();
      setTimeout(() => {
        if (!leafletMapRef.current) return;
        leafletMapRef.current.invalidateSize();
        if (geo.isTightOrSingle) {
          leafletMapRef.current.setView(geo.center, 13, { animate: true });
        } else {
          leafletMapRef.current.fitBounds(geo.bounds, {
            padding: [80, 80],
            maxZoom: 13,
            animate: true,
            duration: 0.6
          });
        }
      }, 50);
    }
  }, [neighborhoods, optimizationResult, selectedWarehouse, calculateBounds]);

  const hasData = neighborhoods && neighborhoods.length > 0;

  return (
    <div className="relative w-full h-full bg-[#08090C] overflow-hidden">
      {/* The Actual Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" style={{ width: '100%', height: '100%' }} />

      {/* Empty State Overlay */}
      {!hasData && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#08090C]/80 backdrop-blur-sm pointer-events-auto">
          <div className="glass-panel p-10 max-w-md text-center border border-white/10 shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-6 border border-[#D4A373]/40 bg-[#D4A373]/10 flex items-center justify-center rotate-45">
              <span className="font-mono text-lg text-[#D4A373] -rotate-45">✦</span>
            </div>

            <div className="font-mono text-xs text-[#D4A373] tracking-[0.2em] uppercase mb-2">
              System Ready
            </div>

            <h3 className="font-serif text-3xl text-white mb-3 tracking-tight">
              YOUR NETWORK STARTS HERE.
            </h3>

            <p className="text-sm text-[#8E96A4] leading-relaxed mb-8 font-light">
              Upload geospatial demand data to discover mathematically optimal warehouse locations, cluster assignments, and delivery cost curves.
            </p>

            <button
              onClick={onOpenImport}
              className="w-full py-3.5 bg-[#D4A373] hover:bg-[#E29578] text-[#090B0E] font-medium text-xs font-mono tracking-widest uppercase transition-all shadow-lg shadow-[#D4A373]/20"
            >
              Import Dataset
            </button>
          </div>
        </div>
      )}

      {/* Minimal Map Legend (Bottom Left, offset above zoom controls) */}
      {hasData && (
        <div 
          className="absolute bottom-16 left-4 z-10 glass-panel p-3 border border-white/10 text-xs text-[#8E96A4] hidden sm:block pointer-events-none"
          style={{ zIndex: 500 }}
        >
          <div className="font-mono text-[9px] uppercase tracking-widest text-white/50 mb-1.5">
            MAP LEGEND
          </div>
          <div className="space-y-1 font-mono text-[10px]">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8] inline-block"></span>
              <span>Neighborhood Node (Size = Daily Volume)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rotate-45 border border-[#D4A373] bg-[#D4A373] inline-block"></span>
              <span>Warehouse Centroid</span>
            </div>
            {optimizationResult && (
              <>
                <div className="flex items-center space-x-2">
                  <span className="w-3 border-b border-dashed border-[#D4A373] inline-block"></span>
                  <span>Geodesic Transit Route</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full border border-dotted border-[#D4A373] inline-block"></span>
                  <span>Max Service Radius</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
