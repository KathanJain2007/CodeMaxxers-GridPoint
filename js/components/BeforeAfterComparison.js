// SHELVO — Before vs After Dedicated Comparison Component
// Provides Split Screen and Interactive Transition Slider (BEFORE ←───[•]───→ AFTER)

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

window.GRIDPOINT_COMPONENTS.BeforeAfterComparison = function({
  neighborhoods,
  optimizationResult,
  baselineMetrics,
  onClose
}) {
  const [sliderPosition, setSliderPosition] = React.useState(50); // 0 to 100
  const [comparisonMode, setComparisonMode] = React.useState('split'); // 'split' | 'slider'

  const optMetrics = optimizationResult && optimizationResult.metrics
    ? {
        ...optimizationResult.metrics,
        totalDeliveryCostInr: Number(optimizationResult.metrics.totalDeliveryCostInr) || 0,
        totalDeliveryDistanceKm: Number(optimizationResult.metrics.totalDeliveryDistanceKm) || 0,
        averageDeliveryDistanceKm: Number(optimizationResult.metrics.averageDeliveryDistanceKm) || 0,
        totalEmissionsKgCo2: Number(optimizationResult.metrics.totalEmissionsKgCo2)
          || Math.round((Number(optimizationResult.metrics.totalDeliveryDistanceKm) || 0) * 0.021)
      }
    : null;

  // Format currency
  const formatInr = (val) => {
    if (!val) return "₹0";
    return `₹${val.toLocaleString()}`;
  };

  const formatInrLakhs = (val) => {
    if (!val) return "₹0.00L";
    return `₹${(val / 100000).toFixed(2)}L`;
  };

  if (!baselineMetrics || !optMetrics) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08090C]/90 p-6">
        <div className="glass-panel p-8 max-w-md text-center">
          <p className="text-white/70 mb-4">Please run optimization first to generate comparison data.</p>
          <button onClick={onClose} className="px-4 py-2 bg-[#D4A373] text-[#090B0E] font-mono text-xs">CLOSE</button>
        </div>
      </div>
    );
  }

  // Cost & distance reductions
  const costSavings = baselineMetrics.totalDeliveryCostInr - optMetrics.totalDeliveryCostInr;
  const costPct = ((costSavings / baselineMetrics.totalDeliveryCostInr) * 100).toFixed(1);

  const distSavings = baselineMetrics.totalDeliveryDistanceKm - optMetrics.totalDeliveryDistanceKm;
  const distPct = ((distSavings / baselineMetrics.totalDeliveryDistanceKm) * 100).toFixed(1);

  const avgDistReduction = (baselineMetrics.averageDeliveryDistanceKm - optMetrics.averageDeliveryDistanceKm).toFixed(2);
  const avgDistPct = (((baselineMetrics.averageDeliveryDistanceKm - optMetrics.averageDeliveryDistanceKm) / baselineMetrics.averageDeliveryDistanceKm) * 100).toFixed(1);

  const isDemoData = React.useMemo(() => {
    if (!neighborhoods || neighborhoods.length !== 28) return false;
    return neighborhoods.some(n => (n.neighborhood === "Koramangala" || n.name === "Koramangala"));
  }, [neighborhoods]);

  const baselineHubTitle = baselineMetrics.name || (isDemoData ? "Bangalore Majestic Hub" : "Single Central Regional Depot");
  const baselineDescription = isDemoData
    ? "Centralized routing via legacy depot at Bangalore Majestic Hub. Delivery fleets must traverse cross-city transit bottlenecks to reach high-demand tech corridors in Whitefield and Electronic City."
    : `Centralized routing via single legacy facility at ${baselineHubTitle}. Delivery fleets must traverse long cross-regional transit corridors across all ${neighborhoods ? neighborhoods.length : 0} demand zones.`;

  const clusterNames = (optimizationResult.warehouses || [])
    .map(w => w.name || w.zone || w.code)
    .slice(0, 3)
    .join(", ");
  const optDescription = isDemoData
    ? "Order-density weighted spatial centroids calculated via iterative gradient descent. Warehouses placed directly in high-velocity clusters (East Corridor, South Tech Arc, North Central)."
    : `Order-density weighted spatial centroids calculated via iterative gradient descent. Warehouses placed directly in high-velocity clusters (${clusterNames || "Regional Demand Hubs"}).`;

  return (
    <div className="fixed inset-0 z-50 bg-[#08090C]/95 backdrop-blur-xl flex flex-col overflow-y-auto">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-[#0B0D11]/80">
        <div className="flex items-center space-x-4">
          <div className="w-2.5 h-2.5 bg-[#D4A373] rotate-45"></div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-white font-semibold">
            NETWORK ARCHITECTURE COMPARISON
          </span>
          <span className="text-white/20 font-mono text-xs">/</span>
          <span className="font-mono text-xs text-[#8E96A4]">
            BASELINE VS OPTIMIZED TOPOLOGY
          </span>
        </div>

        <div className="flex items-center space-x-6">
          {/* Mode Switcher */}
          <div className="flex items-center space-x-1 p-1 bg-white/[0.04] border border-white/10 text-xs font-mono">
            <button
              onClick={() => setComparisonMode('split')}
              className={`px-3 py-1.5 transition-all ${comparisonMode === 'split' ? 'bg-[#D4A373] text-[#090B0E] font-semibold' : 'text-white/60 hover:text-white'}`}
            >
              SPLIT SCREEN
            </button>
            <button
              onClick={() => setComparisonMode('slider')}
              className={`px-3 py-1.5 transition-all ${comparisonMode === 'slider' ? 'bg-[#D4A373] text-[#090B0E] font-semibold' : 'text-white/60 hover:text-white'}`}
            >
              TRANSITION SLIDER
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white font-mono text-xs border border-white/10 hover:border-white/30"
          >
            ESC ✕
          </button>
        </div>
      </div>

      {/* Main Comparison Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8 flex flex-col justify-between">
        
        {/* Comparison Views */}
        {comparisonMode === 'split' ? (
          /* Split Screen: Left (Current) vs Right (Optimized) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-auto">
            
            {/* LEFT: Current Network */}
            <div className="glass-panel p-8 border border-white/10 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#EF4444]/60"></div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-[#EF4444] tracking-widest uppercase">
                    BASELINE ARCHITECTURE
                  </div>
                  <h3 className="font-serif text-3xl text-white mt-1">
                    Current Network
                  </h3>
                </div>
                <div className="px-3 py-1 bg-[#EF4444]/10 border border-[#EF4444]/30 font-mono text-xs text-[#EF4444]">
                  1 CENTRAL HUB
                </div>
              </div>

              <p className="text-xs text-[#8E96A4] leading-relaxed">
                {baselineDescription}
              </p>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono text-white/60 uppercase">Weighted Delivery Cost</span>
                  <span className="text-2xl font-serif text-white">{formatInrLakhs(baselineMetrics.totalDeliveryCostInr)} <span className="text-xs font-mono text-white/40">/ day</span></span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono text-white/60 uppercase">Total Delivery Distance</span>
                  <span className="text-xl font-mono text-white">{baselineMetrics.totalDeliveryDistanceKm.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono text-white/60 uppercase">Average Delivery Distance</span>
                  <span className="text-xl font-mono text-white">{baselineMetrics.averageDeliveryDistanceKm} km / order</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono text-white/60 uppercase">Active Warehouses</span>
                  <span className="text-xl font-mono text-white">1 facility</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono text-white/60 uppercase">Estimated Fleet CO₂</span>
                  <span className="text-xl font-mono text-white/70">{Math.round((baselineMetrics.totalDeliveryDistanceKm / 10) * 0.21).toLocaleString()} kg / day</span>
                </div>
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/5 font-mono text-xs text-white/40">
                STATUS: SUBOPTIMAL // LONG LATENCY & HIGH FUEL TRANSIT
              </div>
            </div>

            {/* RIGHT: Optimized Network */}
            <div className="glass-panel p-8 border border-[#10B981]/40 space-y-6 relative overflow-hidden bg-[#10B981]/[0.02]">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#10B981]"></div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-[#10B981] tracking-widest uppercase">
                    WEISZFELD FERMAT-WEBER
                  </div>
                  <h3 className="font-serif text-3xl text-white mt-1">
                    Optimized Network
                  </h3>
                </div>
                <div className="px-3 py-1 bg-[#10B981]/15 border border-[#10B981]/40 font-mono text-xs text-[#10B981] font-semibold">
                  {optimizationResult.warehouses.length} HUBS OPTIMAL
                </div>
              </div>

              <p className="text-xs text-[#8E96A4] leading-relaxed">
                {optDescription}
              </p>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono text-white/60 uppercase">Weighted Delivery Cost</span>
                  <div className="text-right">
                    <span className="text-2xl font-serif text-[#10B981]">{formatInrLakhs(optMetrics.totalDeliveryCostInr)}</span>
                    <span className="text-xs font-mono text-[#10B981] ml-2 font-semibold">↓ {costPct}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono text-white/60 uppercase">Total Delivery Distance</span>
                  <div className="text-right">
                    <span className="text-xl font-mono text-white">{optMetrics.totalDeliveryDistanceKm.toLocaleString()} km</span>
                    <span className="text-xs font-mono text-[#10B981] ml-2">↓ {distPct}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono text-white/60 uppercase">Average Delivery Distance</span>
                  <div className="text-right">
                    <span className="text-xl font-mono text-white">{optMetrics.averageDeliveryDistanceKm} km / order</span>
                    <span className="text-xs font-mono text-[#38BDF8] ml-2">↓ {avgDistPct}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono text-white/60 uppercase">Active Warehouses</span>
                  <span className="text-xl font-mono text-[#D4A373]">{optimizationResult.warehouses.length} facilities</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono text-white/60 uppercase">Estimated Fleet CO₂</span>
                  <div className="text-right">
                    <span className="text-xl font-mono text-white">{optMetrics.totalEmissionsKgCo2.toLocaleString()} kg / day</span>
                    <span className="text-xs font-mono text-[#10B981] ml-2">↓ {distPct}%</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/20 font-mono text-xs text-[#10B981]">
                STATUS: MATHEMATICALLY OPTIMAL // NET SAVINGS {formatInrLakhs(costSavings)} / DAY
              </div>
            </div>

          </div>
        ) : (
          /* Slider Mode: Interactive BEFORE ←────────→ AFTER */
          <div className="glass-panel p-8 border border-white/10 space-y-8 my-auto max-w-4xl mx-auto w-full">
            <div className="text-center space-y-2">
              <div className="font-mono text-xs text-[#D4A373] tracking-[0.2em] uppercase">
                INTERACTIVE TRANSITION SLIDER
              </div>
              <h3 className="font-serif text-3xl text-white">
                Drag to interpolate between Current & Optimized States
              </h3>
            </div>

            {/* Slider Control Bar */}
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="flex justify-between text-xs font-mono font-semibold tracking-wider">
                <span className={sliderPosition < 100 ? 'text-[#EF4444]' : 'text-white/40'}>
                  BEFORE (CURRENT 1-HUB)
                </span>
                <span className="text-[#D4A373]">
                  {`${100 - sliderPosition}% BEFORE / ${sliderPosition}% AFTER`}
                </span>
                <span className={sliderPosition > 0 ? 'text-[#10B981]' : 'text-white/40'}>
                  AFTER (OPTIMIZED {optimizationResult.warehouses.length}-HUBS)
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <span className="font-mono text-xs text-white/40">BEFORE</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(parseInt(e.target.value, 10))}
                  className="w-full cursor-pointer"
                />
                <span className="font-mono text-xs text-white/40">AFTER</span>
              </div>

              <div className="text-center font-mono text-xs text-white/50">
                BEFORE ←─────────── [ {sliderPosition}% ] ───────────→ AFTER
              </div>
            </div>

            {/* Dynamically Interpolated Metrics Card */}
            {(() => {
              const alpha = sliderPosition / 100.0;
              const curCost = baselineMetrics.totalDeliveryCostInr * (1 - alpha) + optMetrics.totalDeliveryCostInr * alpha;
              const curDist = baselineMetrics.totalDeliveryDistanceKm * (1 - alpha) + optMetrics.totalDeliveryDistanceKm * alpha;
              const curAvgDist = baselineMetrics.averageDeliveryDistanceKm * (1 - alpha) + optMetrics.averageDeliveryDistanceKm * alpha;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10 text-center">
                  <div className="p-4 bg-white/[0.02] border border-white/5">
                    <div className="font-mono text-[10px] text-white/50 tracking-widest uppercase mb-1">
                      DELIVERY EXPENDITURE
                    </div>
                    <div className="text-3xl font-serif text-white">
                      {formatInrLakhs(curCost)}
                    </div>
                    <div className="text-xs font-mono text-[#10B981] mt-1">
                      {alpha > 0 ? `Savings: ${formatInrLakhs(costSavings * alpha)} / day` : 'Baseline spend'}
                    </div>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/5">
                    <div className="font-mono text-[10px] text-white/50 tracking-widest uppercase mb-1">
                      DAILY TRANSIT DISTANCE
                    </div>
                    <div className="text-3xl font-serif text-white">
                      {Math.round(curDist).toLocaleString()} km
                    </div>
                    <div className="text-xs font-mono text-[#38BDF8] mt-1">
                      {alpha > 0 ? `Reduced by ${Math.round(distSavings * alpha).toLocaleString()} km` : 'Maximum distance'}
                    </div>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/5">
                    <div className="font-mono text-[10px] text-white/50 tracking-widest uppercase mb-1">
                      AVERAGE ORDER DISTANCE
                    </div>
                    <div className="text-3xl font-serif text-white">
                      {curAvgDist.toFixed(2)} km
                    </div>
                    <div className="text-xs font-mono text-[#D4A373] mt-1">
                      {alpha > 0 ? `${(avgDistPct * alpha).toFixed(1)}% closer to customers` : 'Central baseline'}
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* Executive Summary Bottom Banner */}
        <div className="mt-8 p-6 bg-white/[0.02] border border-white/10 flex flex-col md:flex-row items-center justify-between text-xs font-mono text-white/70">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            <span>EXECUTIVE VERDICT: Multi-hub decentralized topology delivers <strong className="text-white">{costPct}% logistics cost reduction</strong> while trimming average customer fulfillment radius by <strong className="text-white">{avgDistReduction} km</strong>.</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#D4A373] text-[#090B0E] font-medium tracking-wider uppercase hover:bg-[#E29578] transition-all"
          >
            RETURN TO MAP WORKSPACE
          </button>
        </div>

      </div>

    </div>
  );
};
