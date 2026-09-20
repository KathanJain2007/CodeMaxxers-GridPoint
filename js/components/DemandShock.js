// SHELVO — Demand Shock Stress Testing & Decision Support Simulator
// Simulates demand spikes (+10%, +25%, +50%, custom) and validates network resilience.

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

window.GRIDPOINT_COMPONENTS.DemandShock = function({
  optimizationResult,
  onClose
}) {
  const [multiplier, setMultiplier] = React.useState(1.25); // default +25% festive shock

  if (!optimizationResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08090C]/90 p-6">
        <div className="glass-panel p-8 max-w-md text-center">
          <p className="text-white/70 mb-4">Please run optimization first before testing demand shocks.</p>
          <button onClick={onClose} className="px-4 py-2 bg-[#D4A373] text-[#090B0E] font-mono text-xs">CLOSE</button>
        </div>
      </div>
    );
  }

  const shockResult = window.GRIDPOINT_ALGO.applyDemandShock(optimizationResult, multiplier);

  return (
    <div className="fixed inset-0 z-50 bg-[#08090C]/95 backdrop-blur-xl flex flex-col overflow-y-auto">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-[#0B0D11]/80 sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <div className="w-2.5 h-2.5 bg-[#EF4444] rotate-45"></div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-white font-semibold">
            DYNAMIC DEMAND SHOCK SIMULATOR
          </span>
          <span className="text-white/20 font-mono text-xs">/</span>
          <span className="font-mono text-xs text-[#8E96A4]">
            STRESS TESTING & DECISION SUPPORT SYSTEM
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-white/50 hover:text-white font-mono text-xs border border-white/10 hover:border-white/30"
        >
          ESC ✕
        </button>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-8 space-y-8">
        
        {/* Header Explanation */}
        <div className="max-w-3xl space-y-2">
          <div className="font-mono text-xs text-[#EF4444] tracking-widest uppercase">
            RESILIENCE & CAPACITY THRESHOLD VALIDATION
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-white tracking-tight">
            DEMAND SHOCK SIMULATION: {shockResult.percentageChange >= 0 ? `+${shockResult.percentageChange}%` : `${shockResult.percentageChange}%`}
          </h2>
          <p className="text-sm text-[#8E96A4] font-light leading-relaxed">
            E-commerce logistics is volatile. Simulate flash sales, festive rushes, or macro demand shifts to verify whether warehouse capacities break and determine when network expansion is mandatory.
          </p>
        </div>

        {/* Shock Preset Controls */}
        <div className="glass-panel p-6 border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-white/60 tracking-wider uppercase">
              SELECT DEMAND SHOCK SCENARIO
            </span>
            <span className="font-mono text-xs text-[#D4A373]">
              ACTIVE MULTIPLIER: {multiplier.toFixed(2)}x
            </span>
          </div>

          {/* Quick buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "NORMAL DEMAND", mult: 1.0, sub: "Baseline volume (100%)" },
              { label: "+10% SURGE", mult: 1.10, sub: "Payday / weekend peak" },
              { label: "+25% FESTIVE", mult: 1.25, sub: "Diwali / Big Billion Rush" },
              { label: "+50% FLASH SALE", mult: 1.50, sub: "Extreme flash volume" }
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setMultiplier(preset.mult)}
                className={`p-4 border text-left transition-all ${
                  multiplier === preset.mult
                    ? 'border-[#D4A373] bg-[#D4A373]/15 text-white'
                    : 'border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                <div className="font-mono text-xs font-semibold">{preset.label}</div>
                <div className="text-[11px] text-white/40 mt-1">{preset.sub}</div>
              </button>
            ))}
          </div>

          {/* Custom Slider */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <div className="flex justify-between font-mono text-xs text-white/50">
              <span>CUSTOM MULTIPLIER (0.50x to 2.50x)</span>
              <span className="text-white font-semibold">{(multiplier * 100).toFixed(0)}% OF BASELINE DEMAND</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={multiplier}
              onChange={(e) => setMultiplier(parseFloat(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>
        </div>

        {/* Warehouse Capacity Response Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {shockResult.warehouses.map((wh, idx) => {
            const isBreached = wh.isOverCapacity;

            return (
              <div
                key={idx}
                className={`glass-panel p-6 border space-y-4 transition-all ${
                  isBreached
                    ? 'border-[#EF4444]/60 bg-[#EF4444]/[0.04]'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rotate-45 border border-white"
                      style={{ background: wh.color }}
                    ></span>
                    <span className="font-serif text-xl text-white font-medium">
                      {wh.name}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 font-bold tracking-wider ${
                      isBreached
                        ? 'bg-[#EF4444] text-[#090B0E]'
                        : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                    }`}
                  >
                    {isBreached ? 'CAPACITY EXCEEDED' : 'OPERATIONAL'}
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/50">BASE DEMAND:</span>
                    <span className="text-white">{wh.originalDemand.toLocaleString()} /day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">SHOCKED DEMAND:</span>
                    <span className={`font-semibold ${isBreached ? 'text-[#EF4444]' : 'text-white'}`}>
                      {wh.shockedDemand.toLocaleString()} /day
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">FACILITY CAPACITY:</span>
                    <span className="text-white/80">{wh.capacityOrders.toLocaleString()} /day</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-white/5">
                    <span className="text-white/50">UTILIZATION:</span>
                    <div className="text-right">
                      <span className="text-white/40 text-[10px]">
                        {wh.capacityUtilizationPercent}% →{' '}
                      </span>
                      <span
                        className={`text-lg font-serif font-bold ${
                          isBreached ? 'text-[#EF4444]' : 'text-[#10B981]'
                        }`}
                      >
                        {wh.utilization}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Utilization Visual Bar */}
                <div className="w-full h-2 bg-white/10 overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, wh.utilization)}%`,
                      backgroundColor: isBreached ? '#EF4444' : wh.utilization > 85 ? '#F59E0B' : '#10B981'
                    }}
                  ></div>
                </div>

                {isBreached && (
                  <div className="p-2.5 bg-[#EF4444]/10 border border-[#EF4444]/30 font-mono text-[11px] text-[#EF4444] space-y-1">
                    <div className="font-bold">⚠️ OVERFLOW: +{wh.overflowOrders.toLocaleString()} orders</div>
                    <div className="text-white/70">Exceeds throughput capacity. Labor and dock queuing imminent.</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Decision-Support Recommendation Banner */}
        <div className={`p-6 border flex flex-col md:flex-row items-center justify-between text-xs font-mono ${
          shockResult.anyExceeded
            ? 'bg-[#EF4444]/10 border-[#EF4444]/40 text-[#EF4444]'
            : 'bg-[#10B981]/10 border-[#10B981]/40 text-[#10B981]'
        }`}>
          <div className="space-y-1 mb-4 md:mb-0">
            <div className="font-bold tracking-wider uppercase text-sm">
              DECISION SUPPORT INTELLIGENCE // AI RECOMMENDATION
            </div>
            <div className="text-white/80 max-w-3xl leading-relaxed">
              {shockResult.anyExceeded ? (
                <>
                  Severe capacity breach detected under {multiplier.toFixed(2)}x demand shock. <strong className="text-white">Action Plan:</strong> Relocate high-volume peripheral neighborhoods (e.g. Whitefield or Bellandur) to an adjacent lower-utilized facility, or trigger a temporary 4th pop-up micro-depot to absorb the +{shockResult.warehouses.reduce((acc, w) => acc + w.overflowOrders, 0).toLocaleString()} overflow orders.
                </>
              ) : (
                <>
                  Network architecture possesses sufficient headroom to absorb this demand surge. All hubs operate below 100% capacity threshold with optimal truck turnaround times.
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#D4A373] text-[#090B0E] font-medium tracking-wider uppercase hover:bg-[#E29578] transition-all whitespace-nowrap"
          >
            RETURN TO WORKSPACE
          </button>
        </div>

      </div>

    </div>
  );
};
