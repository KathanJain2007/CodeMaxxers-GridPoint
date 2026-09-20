// SHELVO — Warehouse Insights Detail Inspector
// Opens an elegant detail panel when a warehouse centroid is selected.

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

window.GRIDPOINT_COMPONENTS.WarehouseInspector = function({
  warehouse,
  onClose,
  onExplainLocation,
  onOpenChatbot
}) {
  if (!warehouse) return null;

  const formatInrLakhs = (amount) => {
    if (!amount) return "₹0.00L";
    return `₹${(amount / 100000).toFixed(2)}L`;
  };

  const utilizationColor = warehouse.capacityUtilizationPercent > 100
    ? '#EF4444'
    : warehouse.capacityUtilizationPercent > 85
    ? '#F59E0B'
    : '#10B981';

  return (
    <div 
      className="fixed top-24 right-8 w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-200"
      style={{ zIndex: 1050 }}
    >
      <div className="glass-hud p-6 border border-white/15 shadow-2xl space-y-6">
        
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rotate-45 border border-white"
              style={{ background: warehouse.color || '#D4A373' }}
            ></div>
            <div>
              <div className="font-mono text-[10px] text-white/50 tracking-[0.2em] uppercase">
                CENTROID INSPECTION // {warehouse.id}
              </div>
              <h3 className="font-serif text-2xl text-white">
                {warehouse.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/40 hover:text-white font-mono text-xs p-1"
          >
            ✕
          </button>
        </div>

        {/* Location Coordinates & Status */}
        <div className="flex items-center justify-between font-mono text-xs bg-white/[0.02] p-3 border border-white/5">
          <div className="space-y-0.5">
            <div className="text-[10px] text-white/40 uppercase">GEODETIC COORDINATES</div>
            <div className="text-white font-semibold">
              {warehouse.latitude.toFixed(4)}° N, {warehouse.longitude.toFixed(4)}° E
            </div>
          </div>
          <div className="text-right space-y-0.5">
            <div className="text-[10px] text-white/40 uppercase">CLUSTER STATUS</div>
            <div className="text-[#10B981] font-semibold flex items-center justify-end space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              <span>CONVERGED</span>
            </div>
          </div>
        </div>

        {/* Primary Metric Grid */}
        <div className="grid grid-cols-2 gap-4">
          
          <div className="p-3 bg-white/[0.02] border border-white/5">
            <div className="font-mono text-[10px] text-white/50 tracking-wider uppercase">
              ASSIGNED NEIGHBORHOODS
            </div>
            <div className="text-2xl font-serif text-white mt-1">
              {warehouse.assignedCount} <span className="text-xs font-mono text-white/40 font-normal">zones</span>
            </div>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5">
            <div className="font-mono text-[10px] text-white/50 tracking-wider uppercase">
              DAILY DEMAND
            </div>
            <div className="text-2xl font-serif text-white mt-1">
              {warehouse.dailyDemand.toLocaleString()} <span className="text-xs font-mono text-white/40 font-normal">orders</span>
            </div>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5">
            <div className="font-mono text-[10px] text-white/50 tracking-wider uppercase">
              AVERAGE DISTANCE
            </div>
            <div className="text-2xl font-serif text-white mt-1">
              {warehouse.averageDistanceKm} <span className="text-xs font-mono text-white/40 font-normal">km</span>
            </div>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5">
            <div className="font-mono text-[10px] text-white/50 tracking-wider uppercase">
              SERVICE RADIUS
            </div>
            <div className="text-2xl font-serif text-white mt-1">
              {warehouse.serviceRadiusKm} <span className="text-xs font-mono text-white/40 font-normal">km</span>
            </div>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5 col-span-2">
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono text-[10px] text-white/50 tracking-wider uppercase">
                CAPACITY UTILIZATION
              </span>
              <span className="font-mono text-xs font-semibold" style={{ color: utilizationColor }}>
                {warehouse.capacityUtilizationPercent}% ({warehouse.dailyDemand.toLocaleString()} / {warehouse.capacityOrders.toLocaleString()})
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-white/10 overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, warehouse.capacityUtilizationPercent)}%`,
                  backgroundColor: utilizationColor
                }}
              ></div>
            </div>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5 col-span-2 flex justify-between items-baseline">
            <span className="font-mono text-[10px] text-white/50 tracking-wider uppercase">
              ESTIMATED DAILY TRANSIT COST
            </span>
            <span className="text-xl font-serif text-[#D4A373]">
              {formatInrLakhs(warehouse.dailyDeliveryCostInr)} <span className="text-xs font-mono text-white/40">/ day</span>
            </span>
          </div>

        </div>

        {/* Assigned Neighborhoods Table / Distribution */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-white/50 tracking-widest uppercase">
              ASSIGNED MICRO-MARKETS (TOP DEMAND)
            </span>
            <span className="font-mono text-[10px] text-white/30">
              DISTANCE TO HUB
            </span>
          </div>

          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
            {warehouse.assignedNeighborhoods.map((n, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] text-white/40">0{idx + 1}</span>
                  <span className="text-white font-medium">{n.name}</span>
                </div>
                <div className="flex items-center space-x-3 font-mono text-[11px]">
                  <span className="text-[#8E96A4]">{n.dailyOrders} ord</span>
                  <span className="text-white/80 font-semibold">{n.distanceKm} km</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explain Location CTA */}
        <button
          onClick={() => onExplainLocation(warehouse)}
          className="w-full py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 text-xs font-mono text-white/90 hover:text-white tracking-wider uppercase transition-all flex items-center justify-center space-x-2"
        >
          <span>WHY THIS LOCATION? (MATHEMATICAL PROOF)</span>
          <span>→</span>
        </button>

        {onOpenChatbot && (
          <button
            onClick={() => onOpenChatbot(warehouse)}
            className="w-full py-2.5 bg-[#D4A373]/15 hover:bg-[#D4A373]/25 border border-[#D4A373]/50 text-xs font-mono text-[#D4A373] hover:text-white tracking-wider uppercase transition-all flex items-center justify-center space-x-2"
          >
            <span>◈ ASK ShelVO AI ABOUT THIS HUB</span>
            <span>→</span>
          </button>
        )}

      </div>
    </div>
  );
};
