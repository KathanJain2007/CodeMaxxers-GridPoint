// GRIDPOINT — Scenario Lab Component
// Interactive economic trade-off visualizer: Delivery Cost vs Infrastructure Cost vs Optimal Hub Count.

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

window.GRIDPOINT_COMPONENTS.ScenarioLab = function({
  neighborhoods,
  onApplyScenario,
  onClose
}) {
  const [scenariosData, setScenariosData] = React.useState(null);
  const [selectedScenarioIdx, setSelectedScenarioIdx] = React.useState(2); // default 3 warehouses (idx 2)

  // Run scenario simulation across k = 1 to 5
  React.useEffect(() => {
    if (!neighborhoods || neighborhoods.length === 0) return;
    const result = window.GRIDPOINT_ALGO.generateScenarios(neighborhoods, 5);
    setScenariosData(result);
    // Find index of sweet spot
    const sweetIdx = result.scenarios.findIndex(s => s.isSweetSpot);
    if (sweetIdx !== -1) setSelectedScenarioIdx(sweetIdx);
  }, [neighborhoods]);

  const formatInrLakhs = (amount) => {
    if (!amount) return "₹0.00L";
    return `₹${(amount / 100000).toFixed(2)}L`;
  };

  if (!scenariosData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08090C]/90">
        <div className="font-mono text-xs text-[#D4A373]">CALCULATING ECONOMIC TRADE-OFF SCENARIOS...</div>
      </div>
    );
  }

  const { scenarios, sweetSpotK } = scenariosData;
  const activeScenario = scenarios[selectedScenarioIdx] || scenarios[0];

  return (
    <div className="fixed inset-0 z-50 bg-[#08090C]/95 backdrop-blur-xl flex flex-col overflow-y-auto">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-[#0B0D11]/80 sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <div className="w-2.5 h-2.5 bg-[#D4A373] rotate-45"></div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-white font-semibold">
            GRIDPOINT SCENARIO LAB
          </span>
          <span className="text-white/20 font-mono text-xs">/</span>
          <span className="font-mono text-xs text-[#8E96A4]">
            CAPEX VS OPEX ECONOMIC OPTIMIZATION CURVE
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-white/50 hover:text-white font-mono text-xs border border-white/10 hover:border-white/30"
        >
          ESC ✕
        </button>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8">
        
        {/* Header Rationale */}
        <div className="max-w-3xl space-y-2">
          <div className="font-mono text-xs text-[#D4A373] tracking-widest uppercase">
            SUPPLY CHAIN NETWORK SCALING TRADE-OFF
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-white tracking-tight">
            MORE WAREHOUSES → LOWER DELIVERY COST → HIGHER INFRASTRUCTURE COST
          </h2>
          <p className="text-sm text-[#8E96A4] font-light leading-relaxed">
            As you open more facilities, last-mile transit distance drops exponentially. However, each additional facility introduces fixed lease, labor, and warehouse infrastructure overhead. GRIDPOINT identifies the exact mathematical apex where total supply chain cost is minimized.
          </p>
        </div>

        {/* Visual Trade-Off Curve SVG Chart */}
        <div className="glass-panel p-6 md:p-8 border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="font-mono text-[10px] text-white/40 tracking-widest uppercase">
                ECONOMIC COST CURVES // INR PER DAY
              </span>
              <div className="text-white font-serif text-xl mt-0.5">
                Total Supply Chain Cost vs Facility Count
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-6 font-mono text-xs text-white/60 mt-3 sm:mt-0">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-0.5 bg-[#38BDF8]"></span>
                <span>Delivery Transit (Variable)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-0.5 bg-[#F59E0B]"></span>
                <span>Facility Overhead (Fixed)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-1 bg-[#10B981]"></span>
                <span className="text-white font-semibold">Total Combined Cost</span>
              </div>
            </div>
          </div>

          {/* Render SVG Analytical Curve */}
          <div className="relative w-full h-72 flex items-center justify-center">
            {(() => {
              const width = 860;
              const height = 240;
              const padX = 70;
              const padY = 30;

              const maxCost = Math.max(...scenarios.map(s => Math.max(s.totalCostInr, s.deliveryCostInr, s.infrastructureCostInr))) * 1.15;
              const minCost = 0;

              const getX = (idx) => padX + (idx / (scenarios.length - 1)) * (width - padX * 2);
              const getY = (val) => height - padY - ((val - minCost) / (maxCost - minCost)) * (height - padY * 2);

              // Points for SVG paths
              const delPoints = scenarios.map((s, idx) => `${getX(idx)},${getY(s.deliveryCostInr)}`).join(" ");
              const infraPoints = scenarios.map((s, idx) => `${getX(idx)},${getY(s.infrastructureCostInr)}`).join(" ");
              const totalPoints = scenarios.map((s, idx) => `${getX(idx)},${getY(s.totalCostInr)}`).join(" ");

              return (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
                    const y = height - padY - ratio * (height - padY * 2);
                    const costVal = minCost + ratio * (maxCost - minCost);
                    return (
                      <g key={i}>
                        <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3, 3" />
                        <text x={padX - 10} y={y + 3} fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="'Geist Mono', monospace" textAnchor="end">
                          {formatInrLakhs(costVal)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Curve Paths */}
                  <polyline points={delPoints} fill="none" stroke="#38BDF8" strokeWidth="2" strokeDasharray="4, 4" opacity="0.8" />
                  <polyline points={infraPoints} fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4, 4" opacity="0.8" />
                  <polyline points={totalPoints} fill="none" stroke="#10B981" strokeWidth="3.5" />

                  {/* Data Points on Curves */}
                  {scenarios.map((s, idx) => {
                    const cx = getX(idx);
                    const cyTotal = getY(s.totalCostInr);
                    const cyDel = getY(s.deliveryCostInr);
                    const cyInfra = getY(s.infrastructureCostInr);
                    const isSweet = s.isSweetSpot;
                    const isSelected = selectedScenarioIdx === idx;

                    return (
                      <g key={idx} className="cursor-pointer" onClick={() => setSelectedScenarioIdx(idx)}>
                        {/* X Axis Label */}
                        <text x={cx} y={height - 8} fill={isSelected ? "#D4A373" : "rgba(255,255,255,0.5)"} fontSize="10" fontFamily="'Geist Mono', monospace" textAnchor="middle" fontWeight={isSelected ? "bold" : "normal"}>
                          {s.k} {s.k === 1 ? 'Hub' : 'Hubs'}
                        </text>

                        {/* Delivery Point */}
                        <circle cx={cx} cy={cyDel} r="3" fill="#38BDF8" />
                        {/* Infra Point */}
                        <circle cx={cx} cy={cyInfra} r="3" fill="#F59E0B" />

                        {/* Total Cost Point */}
                        <circle
                          cx={cx}
                          cy={cyTotal}
                          r={isSweet ? "7" : isSelected ? "6" : "4.5"}
                          fill={isSweet ? "#10B981" : "#FFF"}
                          stroke="#08090C"
                          strokeWidth="2"
                        />

                        {/* Sweet Spot Badge */}
                        {isSweet && (
                          <g>
                            <rect x={cx - 52} y={cyTotal - 32} width="104" height="20" fill="#10B981" rx="2" />
                            <text x={cx} y={cyTotal - 18} fill="#090B0E" fontSize="9" fontFamily="'Geist Mono', monospace" textAnchor="middle" fontWeight="bold">
                              ★ OPTIMAL SWEET SPOT
                            </text>
                            <line x1={cx} y1={cyTotal - 12} x2={cx} y2={cyTotal - 8} stroke="#10B981" strokeWidth="1.5" />
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
          </div>
        </div>

        {/* Scenario Comparison Matrix Table */}
        <div className="glass-panel border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
            <span className="font-mono text-xs text-white/70 uppercase tracking-widest">
              SCENARIO COMPARISON MATRIX
            </span>
            <span className="font-mono text-xs text-[#D4A373]">
              SELECT A ROW TO APPLY TO LIVE WORKSPACE
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left swiss-table">
              <thead>
                <tr>
                  <th>SCENARIO</th>
                  <th>FACILITIES</th>
                  <th>DELIVERY COST (OPEX)</th>
                  <th>FACILITY LEASE (CAPEX)</th>
                  <th>TOTAL DAILY COST</th>
                  <th>AVG DISTANCE</th>
                  <th>COST / ORDER</th>
                  <th>RECOMMENDATION</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((sc, idx) => {
                  const isSelected = selectedScenarioIdx === idx;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedScenarioIdx(idx)}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'bg-white/[0.06] border-l-2 border-[#D4A373]' : ''
                      }`}
                    >
                      <td className="font-mono font-medium text-white">
                        {sc.name}
                      </td>
                      <td className="font-mono text-white/80">
                        {sc.k} Warehouse{sc.k > 1 ? 's' : ''}
                      </td>
                      <td className="font-mono text-[#38BDF8]">
                        {formatInrLakhs(sc.deliveryCostInr)}
                      </td>
                      <td className="font-mono text-[#F59E0B]">
                        {formatInrLakhs(sc.infrastructureCostInr)}
                      </td>
                      <td className="font-serif text-base text-white font-semibold">
                        {formatInrLakhs(sc.totalCostInr)}
                      </td>
                      <td className="font-mono text-white/80">
                        {sc.averageDistanceKm} km
                      </td>
                      <td className="font-mono text-white/80">
                        ₹{sc.costPerOrderInr}
                      </td>
                      <td>
                        {sc.isSweetSpot ? (
                          <span className="inline-block px-2.5 py-1 bg-[#10B981]/20 border border-[#10B981]/50 text-[#10B981] font-mono text-[10px] font-bold tracking-wider">
                            OPTIMAL APEX
                          </span>
                        ) : sc.k < sweetSpotK ? (
                          <span className="text-white/40 font-mono text-[11px]">
                            High transit latency
                          </span>
                        ) : (
                          <span className="text-white/40 font-mono text-[11px]">
                            Diminishing return
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyScenario(sc.solution);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-white/[0.05] hover:bg-[#D4A373] hover:text-[#090B0E] text-white font-mono text-xs transition-all border border-white/10"
                        >
                          APPLY TO MAP
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Scenario Details & Callout */}
        <div className="p-6 bg-white/[0.02] border border-white/10 flex flex-col md:flex-row items-center justify-between text-xs font-mono text-white/70">
          <div className="space-y-1 mb-4 md:mb-0">
            <div className="text-white font-semibold">
              SCENARIO VERDICT: {activeScenario.name}
            </div>
            <div className="text-white/50">
              Total network economic expenditure: {formatInrLakhs(activeScenario.totalCostInr)} / day ({activeScenario.averageDistanceKm} km avg transit radius).
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                onApplyScenario(activeScenario.solution);
                onClose();
              }}
              className="px-6 py-3 bg-[#D4A373] hover:bg-[#E29578] text-[#090B0E] font-medium tracking-wider uppercase transition-all shadow-lg"
            >
              LOAD THIS SCENARIO INTO WORKSPACE
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
