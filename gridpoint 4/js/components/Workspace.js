// GRIDPOINT — Main Application Workspace
// 75-80% Immersive Leaflet Map with Floating Frosted Glass HUD Controls.

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

window.GRIDPOINT_COMPONENTS.Workspace = function({
  neighborhoods,
  optimizationResult,
  baselineMetrics,
  selectedWarehouse,
  onSelectWarehouse,
  onRunOptimization,
  isOptimizing,
  onOpenImport,
  onOpenComparison,
  onOpenScenarios,
  onOpenDemandShock,
  onOpenAnalytics,
  onOpenTransparency,
  onOpenReport,
  onReturnToHome,
  projectName,
  onNavigateDashboard
}) {
  // Optimization form controls
  const [warehouseCount, setWarehouseCount] = React.useState(3);
  const [enableCapacity, setEnableCapacity] = React.useState(false);
  const [maxCapacity, setMaxCapacity] = React.useState(5000);
  const [enableRadius, setEnableRadius] = React.useState(false);
  const [maxRadius, setMaxRadius] = React.useState(12);
  const [objective, setObjective] = React.useState('weighted_cost'); // 'min_distance' | 'weighted_cost' | 'cost_infra'
  const [isPanelCollapsed, setIsPanelCollapsed] = React.useState(false);

  // Synchronize warehouseCount if optimizationResult changes externally (e.g. from Scenario Lab)
  React.useEffect(() => {
    if (optimizationResult && optimizationResult.k) {
      setWarehouseCount(optimizationResult.k);
    }
  }, [optimizationResult ? optimizationResult.k : null]);

  const handleWarehouseCountChange = (newK) => {
    const clamped = Math.max(1, Math.min(5, newK));
    setWarehouseCount(clamped);
    if (optimizationResult) {
      onRunOptimization({
        k: clamped,
        maxCapacity: enableCapacity ? maxCapacity : null,
        maxRadius: enableRadius ? maxRadius : null,
        objective: objective,
        instant: true
      });
    }
  };

  const handleRun = () => {
    onRunOptimization({
      k: warehouseCount,
      maxCapacity: enableCapacity ? maxCapacity : null,
      maxRadius: enableRadius ? maxRadius : null,
      objective: objective,
      instant: false
    });
  };

  const totalDemand = React.useMemo(() => {
    return neighborhoods.reduce((acc, n) => acc + (parseFloat(n.dailyOrders) || 0), 0);
  }, [neighborhoods]);

  return (
    <div className="relative w-screen h-screen bg-[#08090C] text-[#F4F4F6] flex flex-col overflow-hidden">
      
      {/* Top Floating Master Navigation Bar — strictly elevated above Leaflet map (z-index: 1100) */}
      <header className="workspace-header relative z-[1100] h-16 px-6 border-b border-white/[0.08] bg-[#090B0E]/95 backdrop-blur-xl flex items-center justify-between" style={{ zIndex: 1100 }}>
        
        {/* Logo & Network Status */}
        <div className="flex items-center space-x-6">
          <button
            onClick={onReturnToHome}
            className="flex items-center space-x-3 group text-left"
            title="Return to Home"
          >
            <div className="w-2.5 h-2.5 bg-[#D4A373] rotate-45 group-hover:scale-110 transition-transform"></div>
            <div>
              <span className="font-mono text-sm tracking-[0.25em] font-semibold text-white uppercase block">
                GRIDPOINT
              </span>
              <span className="font-mono text-[9px] text-white/40 tracking-wider block">
                INTELLIGENT LOCATION OPTIMIZER
              </span>
            </div>
          </button>

          {/* Project Name & Dataset Status Pill */}
          <div className="hidden lg:flex items-center space-x-3 pl-6 border-l border-white/10 font-mono text-xs">
            {projectName && (
              <>
                <span className="text-[#D4A373] font-semibold">{projectName}</span>
                <span className="text-white/20">/</span>
              </>
            )}
            <span className="text-white/40">DEMAND:</span>
            <span className="text-white font-medium">{neighborhoods.length} Nodes</span>
            <span className="text-white/20">/</span>
            <span className="text-white/70">{totalDemand.toLocaleString()} Orders</span>
          </div>
        </div>

        {/* Feature Navigation Switchers */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {onNavigateDashboard && (
            <button
              onClick={onNavigateDashboard}
              className="px-3 py-1.5 text-xs font-mono tracking-wider border border-white/20 hover:border-white/40 text-white font-semibold bg-white/[0.04] hover:bg-white/[0.08] transition-all mr-2"
            >
              ← DASHBOARD
            </button>
          )}
          
          <button
            onClick={onOpenImport}
            className="px-3 py-1.5 text-xs font-mono tracking-wider border border-white/10 hover:border-white/30 text-white/70 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] transition-all"
          >
            IMPORT DEMAND
          </button>

          <button
            onClick={onOpenComparison}
            className={`px-3 py-1.5 text-xs font-mono tracking-wider border border-white/10 hover:border-[#D4A373] text-white/80 hover:text-white bg-white/[0.02] hover:bg-[#D4A373]/10 transition-all hidden sm:block ${
              !optimizationResult ? 'opacity-70' : ''
            }`}
          >
            BEFORE / AFTER
          </button>

          <button
            onClick={onOpenScenarios}
            className="px-3 py-1.5 text-xs font-mono tracking-wider border border-white/10 hover:border-[#10B981] text-white/80 hover:text-white bg-white/[0.02] hover:bg-[#10B981]/10 transition-all"
          >
            SCENARIO LAB
          </button>

          <button
            onClick={onOpenDemandShock}
            className={`px-3 py-1.5 text-xs font-mono tracking-wider border border-white/10 hover:border-[#EF4444] text-white/80 hover:text-white bg-white/[0.02] hover:bg-[#EF4444]/10 transition-all hidden md:block ${
              !optimizationResult ? 'opacity-70' : ''
            }`}
          >
            DEMAND SHOCK
          </button>

          <button
            onClick={onOpenAnalytics}
            className="px-3 py-1.5 text-xs font-mono tracking-wider border border-white/10 hover:border-[#38BDF8] text-white/80 hover:text-white bg-white/[0.02] hover:bg-[#38BDF8]/10 transition-all hidden lg:block"
          >
            ANALYTICS
          </button>

          <button
            onClick={onOpenReport}
            className="px-3.5 py-1.5 text-xs font-mono font-semibold tracking-wider bg-[#D4A373] hover:bg-[#E29578] text-[#090B0E] transition-all"
          >
            DOSSIER
          </button>

        </div>

      </header>

      {/* Central Viewport: Main Workspace (Height = calc(100vh - 4rem)) */}
      <div className="workspace relative flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden">
        
        {/* Map Container (Fills 100% width and height) */}
        <div className="map-container relative w-full h-full">
          <window.GRIDPOINT_COMPONENTS.MapComponent
            neighborhoods={neighborhoods}
            optimizationResult={optimizationResult}
            selectedWarehouse={selectedWarehouse}
            onSelectWarehouse={onSelectWarehouse}
            onOpenImport={onOpenImport}
          />
        </div>

        {/* Floating Optimization HUD Panel (Above Map, Fixed z-index: 1000, 380-420px width) */}
        <div 
          className="optimization-panel absolute top-6 right-6 w-[380px] md:w-[420px] max-w-[420px] select-none"
          style={{ zIndex: 1000 }}
          onMouseDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="glass-hud border border-white/15 shadow-2xl transition-all max-h-[calc(100vh-120px)] flex flex-col">
            
            {/* HUD Header (Fixed top) */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-none">
              <div className="flex items-center space-x-2.5">
                <div className="w-2 h-2 bg-[#D4A373] rotate-45"></div>
                <span className="font-mono text-xs text-white tracking-[0.2em] uppercase font-semibold">
                  OPTIMIZATION
                </span>
              </div>

              <button
                onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                className="text-white/40 hover:text-white font-mono text-xs p-1"
                title={isPanelCollapsed ? "Expand panel" : "Collapse panel"}
              >
                {isPanelCollapsed ? "▼ EXPAND" : "▲ MINIMIZE"}
              </button>
            </div>

            {/* HUD Body (Scrolls internally if taller than viewport) */}
            {!isPanelCollapsed && (
              <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-180px)] flex-1">
                
                {/* 1. Warehouse Count Selector [ 1 — 2 — 3 — 4 — 5 ] with Increment / Decrement Stepper */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-mono text-[10px] text-white/60 tracking-wider uppercase">
                      NUMBER OF WAREHOUSES
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleWarehouseCountChange(warehouseCount - 1)}
                        disabled={warehouseCount <= 1}
                        className="w-6 h-6 border border-white/20 hover:border-[#D4A373] text-white/80 hover:text-[#D4A373] disabled:opacity-20 disabled:cursor-not-allowed bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center font-mono text-sm font-bold transition-all"
                        title="Decrease facilities"
                      >
                        −
                      </button>
                      <span className="font-mono text-xs font-semibold text-[#D4A373] min-w-[76px] text-center">
                        {warehouseCount} FACILITIES
                      </span>
                      <button
                        type="button"
                        onClick={() => handleWarehouseCountChange(warehouseCount + 1)}
                        disabled={warehouseCount >= 5}
                        className="w-6 h-6 border border-white/20 hover:border-[#D4A373] text-white/80 hover:text-[#D4A373] disabled:opacity-20 disabled:cursor-not-allowed bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center font-mono text-sm font-bold transition-all"
                        title="Increase facilities"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 p-1 bg-white/[0.03] border border-white/10">
                    {[1, 2, 3, 4, 5].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => handleWarehouseCountChange(k)}
                        className={`py-2 text-xs font-mono font-medium transition-all ${
                          warehouseCount === k
                            ? 'bg-[#D4A373] text-[#090B0E] font-bold shadow-md'
                            : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Optional Constraints (Capacity & Radius) */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  
                  {/* Warehouse Capacity */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableCapacity}
                          onChange={(e) => setEnableCapacity(e.target.checked)}
                          className="accent-[#D4A373] w-3.5 h-3.5"
                        />
                        <span className="font-mono text-[10px] text-white/70 uppercase">
                          Warehouse Capacity
                        </span>
                      </label>
                      <span className="font-mono text-[10px] text-white/40">[ Optional ]</span>
                    </div>

                    {enableCapacity && (
                      <div className="flex items-center space-x-2 pl-5">
                        <input
                          type="number"
                          value={maxCapacity}
                          onChange={(e) => setMaxCapacity(parseInt(e.target.value, 10) || 5000)}
                          className="w-24 bg-[#11141B] border border-white/15 px-2 py-1 font-mono text-xs text-white focus:border-[#D4A373] outline-none"
                        />
                        <span className="font-mono text-[10px] text-white/50">orders / day / hub</span>
                      </div>
                    )}
                  </div>

                  {/* Maximum Service Radius */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableRadius}
                          onChange={(e) => setEnableRadius(e.target.checked)}
                          className="accent-[#D4A373] w-3.5 h-3.5"
                        />
                        <span className="font-mono text-[10px] text-white/70 uppercase">
                          Maximum Service Radius
                        </span>
                      </label>
                      <span className="font-mono text-[10px] text-white/40">[ Optional ]</span>
                    </div>

                    {enableRadius && (
                      <div className="flex items-center space-x-2 pl-5">
                        <input
                          type="number"
                          value={maxRadius}
                          onChange={(e) => setMaxRadius(parseFloat(e.target.value) || 12)}
                          className="w-24 bg-[#11141B] border border-white/15 px-2 py-1 font-mono text-xs text-white focus:border-[#D4A373] outline-none"
                        />
                        <span className="font-mono text-[10px] text-white/50">km radius boundary</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* 3. Optimization Objective */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="font-mono text-[10px] text-white/60 tracking-wider uppercase">
                    OPTIMIZATION OBJECTIVE
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 hover:bg-white/[0.03] transition-all">
                      <input
                        type="radio"
                        name="optObjective"
                        checked={objective === 'min_distance'}
                        onChange={() => setObjective('min_distance')}
                        className="accent-[#D4A373]"
                      />
                      <span className={objective === 'min_distance' ? 'text-white font-medium' : 'text-white/60'}>
                        Minimum delivery distance
                      </span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 hover:bg-white/[0.03] transition-all">
                      <input
                        type="radio"
                        name="optObjective"
                        checked={objective === 'weighted_cost'}
                        onChange={() => setObjective('weighted_cost')}
                        className="accent-[#D4A373]"
                      />
                      <span className={objective === 'weighted_cost' ? 'text-white font-medium' : 'text-white/60'}>
                        Minimum weighted delivery cost
                      </span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 hover:bg-white/[0.03] transition-all">
                      <input
                        type="radio"
                        name="optObjective"
                        checked={objective === 'cost_infra'}
                        onChange={() => setObjective('cost_infra')}
                        className="accent-[#D4A373]"
                      />
                      <span className={objective === 'cost_infra' ? 'text-white font-medium' : 'text-white/60'}>
                        Cost + infrastructure trade-off
                      </span>
                    </label>
                  </div>
                </div>

                {/* 4. Primary RUN OPTIMIZATION Button */}
                <button
                  onClick={handleRun}
                  disabled={isOptimizing || neighborhoods.length === 0}
                  className="w-full py-4 bg-[#D4A373] hover:bg-[#E29578] disabled:bg-white/10 disabled:text-white/30 text-[#090B0E] font-semibold text-xs font-mono tracking-widest uppercase transition-all shadow-lg shadow-[#D4A373]/20 flex items-center justify-center space-x-2"
                >
                  <span>{isOptimizing ? 'CONVERGING...' : 'RUN OPTIMIZATION'}</span>
                  <span>→</span>
                </button>

              </div>
            )}

          </div>
        </div>

        {/* Selected Warehouse Inspector Drawer (if warehouse clicked) */}
        {selectedWarehouse && (
          <window.GRIDPOINT_COMPONENTS.WarehouseInspector
            warehouse={selectedWarehouse}
            onClose={() => onSelectWarehouse(null)}
            onExplainLocation={(wh) => onOpenTransparency(wh)}
          />
        )}

      </div>

    </div>
  );
};
