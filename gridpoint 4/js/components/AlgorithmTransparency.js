// GRIDPOINT — Algorithm Transparency & Mathematical Explainability
// "WHY THIS LOCATION?" — Plain-English and rigorous mathematical proofs for judges and executives.

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

window.GRIDPOINT_COMPONENTS.AlgorithmTransparency = function({
  warehouse,
  neighborhoods,
  onClose
}) {
  if (!warehouse || !neighborhoods) return null;

  const explanation = window.GRIDPOINT_ALGO.explainWarehouseLocation(warehouse, neighborhoods);

  return (
    <div className="fixed inset-0 z-50 bg-[#08090C]/95 backdrop-blur-xl flex flex-col overflow-y-auto text-[#F4F4F6]">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-[#0B0D11]/80 sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <div className="w-2.5 h-2.5 bg-[#D4A373] rotate-45"></div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-white font-semibold">
            ALGORITHM TRANSPARENCY
          </span>
          <span className="text-white/20 font-mono text-xs">/</span>
          <span className="font-mono text-xs text-[#8E96A4]">
            WHY THIS LOCATION? ({warehouse.name})
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-white/50 hover:text-white font-mono text-xs border border-white/10 hover:border-white/30"
        >
          ESC ✕
        </button>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12 space-y-10">
        
        {/* Header Rationale */}
        <div className="space-y-3">
          <div className="font-mono text-xs text-[#D4A373] tracking-widest uppercase">
            MATHEMATICAL EXPLAINABILITY & CENTROID DERIVATION
          </div>
          <h2 className="font-serif text-3xl md:text-5xl text-white tracking-tight">
            Why was {warehouse.name} placed at {warehouse.latitude}° N, {warehouse.longitude}° E?
          </h2>
          <div className="glass-panel p-6 border-l-4 border-l-[#D4A373] bg-white/[0.02] text-sm md:text-base text-white/90 font-light leading-relaxed">
            "{explanation.narrative}"
          </div>
        </div>

        {/* 4 Core Mathematical Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          
          <div className="glass-panel p-5 border border-white/10 space-y-1">
            <div className="font-mono text-[10px] text-white/50 tracking-wider uppercase">
              DEMAND WEIGHT
            </div>
            <div className="text-3xl font-serif text-white">
              {explanation.demandWeightPercent}%
            </div>
            <div className="font-mono text-xs text-[#D4A373]">
              Share of total network orders
            </div>
          </div>

          <div className="glass-panel p-5 border border-white/10 space-y-1">
            <div className="font-mono text-[10px] text-white/50 tracking-wider uppercase">
              DISTANCE CONTRIBUTION
            </div>
            <div className="text-3xl font-serif text-white">
              {warehouse.averageDistanceKm} <span className="text-sm font-mono text-white/40">km</span>
            </div>
            <div className="font-mono text-xs text-[#38BDF8]">
              Avg customer doorstep reach
            </div>
          </div>

          <div className="glass-panel p-5 border border-white/10 space-y-1">
            <div className="font-mono text-[10px] text-white/50 tracking-wider uppercase">
              ASSIGNED DEMAND
            </div>
            <div className="text-3xl font-serif text-white">
              {warehouse.dailyDemand.toLocaleString()}
            </div>
            <div className="font-mono text-xs text-[#10B981]">
              Daily fulfillment capacity
            </div>
          </div>

          <div className="glass-panel p-5 border border-white/10 space-y-1">
            <div className="font-mono text-[10px] text-white/50 tracking-wider uppercase">
              OPTIMIZATION SCORE
            </div>
            <div className="text-3xl font-serif text-white">
              {explanation.optimizationScore} <span className="text-sm font-mono text-white/40">/ 100</span>
            </div>
            <div className="font-mono text-xs text-[#10B981]">
              Convergence quality index
            </div>
          </div>

        </div>

        {/* Top Demand Anchors (Gravitational Momentum) */}
        <div className="glass-panel p-6 md:p-8 border border-white/10 space-y-4">
          <div className="font-mono text-xs text-[#38BDF8] tracking-widest uppercase">
            GRAVITATIONAL MOMENTUM & NEIGHBORHOOD ANCHORS
          </div>
          <p className="text-xs text-[#8E96A4] font-light">
            In unweighted facility location, the center sits at the pure geometric midpoint. Under GRIDPOINT's order-weighted Fermat-Weber formulation, high-density order zones exert physical momentum on the warehouse position:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {explanation.topPulls.map((anchor, idx) => (
              <div key={idx} className="p-4 bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-white text-sm">{anchor.name}</span>
                  <span className="font-mono text-xs text-[#D4A373]">{anchor.momentumShare}% pull</span>
                </div>
                <div className="font-mono text-xs text-white/50">
                  Daily Orders: <strong className="text-white">{anchor.dailyOrders.toLocaleString()}</strong>
                </div>
                <div className="font-mono text-xs text-white/50">
                  Transit Distance: <strong className="text-white">{anchor.distanceKm} km</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mathematical Formulation for Judges */}
        <div className="glass-panel p-6 md:p-8 border border-white/10 space-y-6">
          <div className="font-mono text-xs text-[#10B981] tracking-widest uppercase">
            MATHEMATICAL PROOFS FOR TECHNICAL JUDGES
          </div>

          <div className="space-y-6 text-xs text-white/80 font-mono">
            {/* Step 1: Geodesic Haversine */}
            <div className="space-y-2">
              <div className="text-white font-semibold text-sm">
                1. Geodesic Haversine Great-Circle Curvature
              </div>
              <p className="text-[#8E96A4] leading-relaxed font-sans">
                Cartesian flat-plane assumptions √(Δx² + Δy²) introduce severe distortion over metropolitan regions (Bengaluru spans over 45 km north-to-south). GRIDPOINT calculates true Earth curvature with spherical radius R = 6,371 km:
              </p>
              <div className="p-3 bg-[#0B0D11] border border-white/10 text-[#38BDF8] overflow-x-auto text-[11px]">
                d(P_i, W_j) = 2R · arcsin(√(sin²(Δφ/2) + cos φ_i · cos φ_j · sin²(Δλ/2)))
              </div>
            </div>

            {/* Step 2: Continuous Fermat-Weber Problem */}
            <div className="space-y-2">
              <div className="text-white font-semibold text-sm">
                2. Continuous Fermat-Weber (Weiszfeld Iteration)
              </div>
              <p className="text-[#8E96A4] leading-relaxed font-sans">
                The objective function minimizes aggregate daily logistics expenditure:
              </p>
              <div className="p-3 bg-[#0B0D11] border border-white/10 text-[#10B981] overflow-x-auto text-[11px]">
                min Σ (DailyOrders_i × d(P_i, W_k) × TransitRate)
              </div>
              <p className="text-[#8E96A4] leading-relaxed font-sans">
                Since geodesic distance is non-linear and non-differentiable at P_i = W, standard quadratic means fail. Weiszfeld's algorithm iteratively computes the exact global minimum:
              </p>
              <div className="p-3 bg-[#0B0D11] border border-white/10 text-[#D4A373] overflow-x-auto text-[11px]">
                W^(t+1) = [ Σ (w_i · P_i / d(P_i, W^(t))) ] / [ Σ (w_i / d(P_i, W^(t))) ]
              </div>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="text-center pt-4">
          <button
            onClick={onClose}
            className="px-8 py-3.5 bg-[#D4A373] hover:bg-[#E29578] text-[#090B0E] font-medium font-mono text-xs tracking-widest uppercase transition-all shadow-lg"
          >
            RETURN TO MAP WORKSPACE
          </button>
        </div>

      </div>

    </div>
  );
};
