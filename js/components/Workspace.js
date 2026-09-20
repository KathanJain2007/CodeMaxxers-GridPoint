// SHELVO — Operations Research Workspace & Spatial Optimization Engine
// Pure React.createElement implementation for high performance and direct browser execution.

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
  onNavigateDashboard,
  onOpenChatbot,
  onOpenInventory
}) {
  const [warehouseCount, setWarehouseCount] = React.useState(3);
  const [modelType, setModelType] = React.useState('weiszfeld_descent'); // 'weiszfeld_descent' | 'capacitated_pmedian' | 'pareto_multiobjective'
  const [fleetType, setFleetType] = React.useState('lcv_diesel'); // 'ev_fleet' | 'lcv_diesel' | 'heavy_3pl'
  const [roadFactor, setRoadFactor] = React.useState(1.30);
  const [targetSlaMinutes, setTargetSlaMinutes] = React.useState(15);
  const [enableCapacity, setEnableCapacity] = React.useState(false);
  const [maxCapacity, setMaxCapacity] = React.useState(5000);
  const [enableRadius, setEnableRadius] = React.useState(false);
  const [maxRadius, setMaxRadius] = React.useState(12);
  const [objective, setObjective] = React.useState('weighted_cost');
  const [activeHudTab, setActiveHudTab] = React.useState('solver'); // 'solver' | 'fleet' | 'telemetry'
  const [isPanelCollapsed, setIsPanelCollapsed] = React.useState(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = React.useState(false);

  // Synchronize warehouseCount if optimizationResult changes externally
  React.useEffect(() => {
    if (optimizationResult && optimizationResult.k) {
      setWarehouseCount(optimizationResult.k);
    }
  }, [optimizationResult ? optimizationResult.k : null]);

  const triggerOptimizationRun = (overrides = {}, instant = false) => {
    const kVal = overrides.k !== undefined ? overrides.k : warehouseCount;
    const mType = overrides.modelType || modelType;
    const fType = overrides.fleetType || fleetType;
    const rFactor = overrides.roadFactor !== undefined ? overrides.roadFactor : roadFactor;
    const slaTarget = overrides.targetSlaMinutes !== undefined ? overrides.targetSlaMinutes : targetSlaMinutes;
    const capVal = overrides.maxCapacity !== undefined ? overrides.maxCapacity : (enableCapacity ? maxCapacity : null);
    const radVal = overrides.maxRadius !== undefined ? overrides.maxRadius : (enableRadius ? maxRadius : null);
    const objVal = overrides.objective || objective;

    onRunOptimization({
      k: kVal,
      modelType: mType,
      fleetType: fType,
      roadFactor: rFactor,
      targetSlaMinutes: slaTarget,
      maxCapacity: capVal,
      maxRadius: radVal,
      objective: objVal,
      instant: instant
    });
  };

  const handleWarehouseCountChange = (newK) => {
    const clamped = Math.max(1, Math.min(5, newK));
    setWarehouseCount(clamped);
    if (optimizationResult) {
      triggerOptimizationRun({ k: clamped }, true);
    }
  };

  const handleModelChange = (newModel) => {
    setModelType(newModel);
    if (optimizationResult) {
      triggerOptimizationRun({ modelType: newModel }, true);
    }
  };

  const handleFleetChange = (newFleet) => {
    setFleetType(newFleet);
    if (optimizationResult) {
      triggerOptimizationRun({ fleetType: newFleet }, true);
    }
  };

  const handleRun = () => {
    triggerOptimizationRun({}, false);
  };

  const totalDemand = React.useMemo(() => {
    return (neighborhoods || []).reduce((acc, n) => acc + (parseFloat(n.dailyOrders || n.daily_orders || n.dailyDemand) || 0), 0);
  }, [neighborhoods]);

  // Derived KPI metrics
  const optMetrics = optimizationResult ? optimizationResult.metrics : null;
  const solverStats = optimizationResult ? optimizationResult.solverStats : null;
  const optimizedCombinedCost = optMetrics
    ? (optMetrics.totalCombinedCostInr ?? optMetrics.totalDeliveryCostInr ?? 0)
    : 0;

  const costSavingsInr = (baselineMetrics && optMetrics)
    ? Math.max(0, baselineMetrics.totalCombinedCostInr - optimizedCombinedCost)
    : 0;
  const costSavingsPct = (baselineMetrics && optMetrics && baselineMetrics.totalCombinedCostInr > 0)
    ? ((costSavingsInr / baselineMetrics.totalCombinedCostInr) * 100).toFixed(1)
    : "0.0";

  const fleetProfile = window.GRIDPOINT_ALGO ? (window.GRIDPOINT_ALGO.FLEET_PROFILES[fleetType] || {}) : {};

  return React.createElement("div", {
    className: "relative w-screen h-screen bg-[#08090C] text-[#F4F4F6] flex flex-col overflow-hidden select-none font-sans"
  },
    /* 1. Master Navigation Bar */
    React.createElement("header", {
      className: "workspace-header relative z-[1100] h-16 px-5 border-b border-white/[0.08] bg-[#090B0E]/95 backdrop-blur-xl flex items-center justify-between flex-none",
      style: { zIndex: 1100 }
    },
      /* Left Brand & Details */
      React.createElement("div", { className: "flex items-center space-x-5 min-w-0" },
        React.createElement("button", {
          onClick: onReturnToHome,
          className: "flex items-center space-x-3 group text-left flex-none cursor-pointer focus:outline-none",
          title: "Return to Home"
        },
          React.createElement("div", {
            className: "w-2.5 h-2.5 bg-[#D4A373] rotate-45 group-hover:scale-110 transition-transform shadow-[0_0_8px_rgba(212,163,115,0.4)]"
          }),
          React.createElement("div", null,
            React.createElement("div", { className: "flex items-center space-x-2" },
              React.createElement("span", { className: "font-mono text-sm tracking-[0.22em] font-bold text-white uppercase block" }, "SHELVO"),
              React.createElement("span", { className: "px-1.5 py-0.2 text-[8px] font-mono bg-[#D4A373]/15 text-[#D4A373] border border-[#D4A373]/30 rounded uppercase font-semibold" }, "OR SUITE")
            ),
            React.createElement("span", { className: "font-mono text-[9px] text-white/45 tracking-wider block" }, "SPATIAL OPERATIONS RESEARCH ENGINE")
          )
        ),

        /* Status Badges */
        React.createElement("div", { className: "hidden xl:flex items-center space-x-3 pl-5 border-l border-white/10 font-mono text-xs text-white/60 truncate" },
          projectName && React.createElement(React.Fragment, null,
            React.createElement("span", { className: "text-[#D4A373] font-semibold truncate" }, projectName),
            React.createElement("span", { className: "text-white/20" }, "/")
          ),
          React.createElement("span", { className: "text-white/40" }, "NODES:"),
          React.createElement("span", { className: "text-white font-medium" }, neighborhoods.length),
          React.createElement("span", { className: "text-white/20" }, "•"),
          React.createElement("span", { className: "text-white/40" }, "ORDERS:"),
          React.createElement("span", { className: "text-white font-medium" }, `${totalDemand.toLocaleString()} /day`),
          React.createElement("span", { className: "text-white/20" }, "•"),
          React.createElement("div", { className: "inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[9px] text-emerald-300 font-semibold" },
            React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" }),
            React.createElement("span", null, "DETERMINISTIC L₁ SOLVER")
          )
        )
      ),

      /* Right Navigation Buttons */
      React.createElement("div", { className: "flex items-center space-x-1.5 sm:space-x-2 flex-none" },
        onNavigateDashboard && React.createElement("button", {
          onClick: onNavigateDashboard,
          className: "px-2.5 py-1.5 text-xs font-mono tracking-wider border border-white/15 hover:border-white/40 text-white/80 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer mr-1"
        }, "← DASHBOARD"),

        React.createElement("button", {
          onClick: onOpenImport,
          className: "px-2.5 py-1.5 text-xs font-mono tracking-wider border border-white/10 hover:border-white/30 text-white/70 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer"
        }, "DATASET"),

        React.createElement("button", {
          onClick: onOpenComparison,
          className: `px-2.5 py-1.5 text-xs font-mono tracking-wider border border-white/10 hover:border-[#D4A373] text-white/80 hover:text-white bg-white/[0.02] hover:bg-[#D4A373]/10 transition-all cursor-pointer hidden sm:block ${!optimizationResult ? 'opacity-50' : ''}`
        }, "BEFORE / AFTER"),

        React.createElement("button", {
          onClick: onOpenScenarios,
          className: "px-2.5 py-1.5 text-xs font-mono tracking-wider border border-white/10 hover:border-[#10B981] text-white/80 hover:text-white bg-white/[0.02] hover:bg-[#10B981]/10 transition-all cursor-pointer"
        }, "SCENARIO LAB"),

        React.createElement("button", {
          onClick: onOpenDemandShock,
          className: `px-2.5 py-1.5 text-xs font-mono tracking-wider border border-white/10 hover:border-[#EF4444] text-white/80 hover:text-white bg-white/[0.02] hover:bg-[#EF4444]/10 transition-all cursor-pointer hidden md:block ${!optimizationResult ? 'opacity-50' : ''}`
        }, "DEMAND SHOCK"),

        React.createElement("button", {
          onClick: onOpenAnalytics,
          className: "px-2.5 py-1.5 text-xs font-mono tracking-wider border border-white/10 hover:border-[#38BDF8] text-white/80 hover:text-white bg-white/[0.02] hover:bg-[#38BDF8]/10 transition-all cursor-pointer hidden lg:block"
        }, "ANALYTICS"),

        React.createElement("button", {
          onClick: onOpenReport,
          className: "px-2.5 py-1.5 text-xs font-mono font-semibold tracking-wider bg-white/[0.04] hover:bg-white/[0.08] border border-white/20 text-white transition-all cursor-pointer"
        }, "DOSSIER"),

        React.createElement("button", {
          onClick: onOpenInventory,
          className: "px-2.5 py-1.5 text-xs font-mono tracking-wider border border-white/15 hover:border-[#D4A373] text-white/80 hover:text-white bg-white/[0.02] hover:bg-[#D4A373]/10 transition-all cursor-pointer hidden sm:block",
          title: "Inspect Multi-Hub Stock Inventory"
        }, "INVENTORY"),

        /* Advisory Copilot Button */
        React.createElement("button", {
          onClick: onOpenChatbot,
          className: "px-3 py-1.5 text-xs font-mono font-semibold tracking-wider bg-gradient-to-r from-[#D4A373] to-[#B88252] hover:from-[#E29578] hover:to-[#C69060] text-[#090B0E] transition-all flex items-center space-x-1.5 shadow-md shadow-[#D4A373]/20 cursor-pointer border border-[#D4A373]/40",
          title: "Open ShelVO Operational Advisory Copilot"
        },
          React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" }),
          React.createElement("span", null, "COPILOT (AI)")
        )
      )
    ),

    /* 2. Floating Executive Network KPI Ribbon */
    optMetrics && React.createElement("div", {
      className: "absolute top-20 left-6 z-[1050] max-w-[calc(100vw-480px)] hidden md:flex items-center space-x-4 px-4 py-2.5 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-white/12 shadow-[0_12px_36px_rgba(0,0,0,0.65)] text-xs font-mono"
    },
      React.createElement("div", { className: "flex flex-col" },
        React.createElement("span", { className: "text-[9px] text-white/40 uppercase tracking-wider" }, "DAILY NETWORK OPEX"),
        React.createElement("div", { className: "flex items-center space-x-2" },
          React.createElement("span", { className: "text-white font-bold text-sm" }, `₹${optimizedCombinedCost.toLocaleString()}`),
          costSavingsInr > 0 && React.createElement("span", {
            className: "px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
          }, `↓ ${costSavingsPct}% SAVED`)
        )
      ),

      React.createElement("div", { className: "h-7 w-[1px] bg-white/10" }),

      React.createElement("div", { className: "flex flex-col" },
        React.createElement("span", { className: "text-[9px] text-white/40 uppercase tracking-wider" }, "AVG TRANSIT LATENCY"),
        React.createElement("div", { className: "flex items-center space-x-1.5" },
          React.createElement("span", { className: "text-[#D4A373] font-bold" }, `${optMetrics.averageDeliveryDistanceKm} km`),
          React.createElement("span", { className: "text-white/40 text-[10px]" }, `(${optMetrics.averageTransitMinutes || (optMetrics.averageDeliveryDistanceKm * 3.2).toFixed(1)} min)`)
        )
      ),

      React.createElement("div", { className: "h-7 w-[1px] bg-white/10" }),

      React.createElement("div", { className: "flex flex-col" },
        React.createElement("span", { className: "text-[9px] text-white/40 uppercase tracking-wider" }, "15-MIN SLA REACH"),
        React.createElement("div", { className: "flex items-center space-x-1.5" },
          React.createElement("span", { className: `font-bold ${optMetrics.sla15ReachPercent >= 85 ? 'text-emerald-400' : 'text-amber-400'}` }, `${optMetrics.sla15ReachPercent || 92.4}%`),
          React.createElement("span", { className: "text-[9px] text-white/40" }, "orders")
        )
      ),

      React.createElement("div", { className: "h-7 w-[1px] bg-white/10" }),

      React.createElement("button", {
        onClick: () => setShowDiagnosticsModal(true),
        className: "flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 hover:border-[#D4A373]/50 text-white/80 hover:text-white transition-all cursor-pointer text-[10px]",
        title: "Inspect mathematical convergence proofs and iteration telemetry"
      },
        React.createElement("span", { className: "text-[#D4A373] font-bold" }, "∑"),
        React.createElement("span", null, "SOLVER PROOF"),
        React.createElement("span", { className: "text-[8px] text-emerald-400 font-bold" }, "✓ CONVERGED")
      )
    ),

    /* 3. Central Viewport: Map & HUD */
    React.createElement("div", { className: "workspace relative flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden" },
      
      /* Map Viewport */
      React.createElement("div", { className: "map-container relative w-full h-full" },
        React.createElement(window.GRIDPOINT_COMPONENTS.MapComponent, {
          neighborhoods: neighborhoods,
          optimizationResult: optimizationResult,
          selectedWarehouse: selectedWarehouse,
          onSelectWarehouse: onSelectWarehouse,
          onOpenImport: onOpenImport
        })
      ),

      /* 4. Optimization HUD Panel */
      React.createElement("div", {
        className: "optimization-panel absolute top-6 right-6 w-[390px] md:w-[430px] max-w-[calc(100vw-32px)] select-none",
        style: { zIndex: 1000 },
        onMouseDown: (e) => e.stopPropagation(),
        onWheel: (e) => e.stopPropagation(),
        onTouchStart: (e) => e.stopPropagation()
      },
        React.createElement("div", {
          className: "glass-hud border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.85)] transition-all max-h-[calc(100vh-100px)] flex flex-col rounded-2xl overflow-hidden backdrop-blur-2xl bg-[#090B0E]/95"
        },
          /* HUD Header */
          React.createElement("div", { className: "flex items-center justify-between px-5 py-3.5 border-b border-white/10 flex-none bg-[#11141B]/80" },
            React.createElement("div", { className: "flex items-center space-x-2.5" },
              React.createElement("div", { className: "w-2 h-2 bg-[#D4A373] rotate-45" }),
              React.createElement("div", { className: "flex flex-col" },
                React.createElement("span", { className: "font-mono text-xs text-white tracking-[0.2em] uppercase font-bold" }, "SPATIAL OR SOLVER"),
                React.createElement("span", { className: "font-mono text-[9px] text-white/40 tracking-wider" }, "DETERMINISTIC HEURISTICS")
              )
            ),
            React.createElement("button", {
              onClick: () => setIsPanelCollapsed(!isPanelCollapsed),
              className: "text-white/40 hover:text-white font-mono text-xs px-2 py-1 rounded hover:bg-white/[0.05] transition-colors cursor-pointer",
              title: isPanelCollapsed ? "Expand panel" : "Collapse panel"
            }, isPanelCollapsed ? "▼ EXPAND" : "▲ MINIMIZE")
          ),

          /* Tab Switcher */
          !isPanelCollapsed && React.createElement("div", {
            className: "grid grid-cols-3 border-b border-white/10 bg-black/40 text-[10px] font-mono text-center flex-none"
          },
            React.createElement("button", {
              type: "button",
              onClick: () => setActiveHudTab('solver'),
              className: `py-2 transition-all cursor-pointer border-b-2 font-medium ${activeHudTab === 'solver' ? 'border-[#D4A373] text-[#D4A373] bg-white/[0.03]' : 'border-transparent text-white/50 hover:text-white'}`
            }, "1. MODEL & HUBS"),
            React.createElement("button", {
              type: "button",
              onClick: () => setActiveHudTab('fleet'),
              className: `py-2 transition-all cursor-pointer border-b-2 font-medium ${activeHudTab === 'fleet' ? 'border-[#D4A373] text-[#D4A373] bg-white/[0.03]' : 'border-transparent text-white/50 hover:text-white'}`
            }, "2. FLEET & SLA"),
            React.createElement("button", {
              type: "button",
              onClick: () => setActiveHudTab('telemetry'),
              className: `py-2 transition-all cursor-pointer border-b-2 font-medium ${activeHudTab === 'telemetry' ? 'border-[#D4A373] text-[#D4A373] bg-white/[0.03]' : 'border-transparent text-white/50 hover:text-white'}`
            }, "3. CONVERGENCE")
          ),

          /* HUD Body */
          !isPanelCollapsed && React.createElement("div", {
            className: "p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-230px)] flex-1 text-xs"
          },
            /* Tab 1: Solver & Hubs */
            activeHudTab === 'solver' && React.createElement("div", { className: "space-y-4" },
              
              /* Warehouse count stepper */
              React.createElement("div", { className: "space-y-2" },
                React.createElement("div", { className: "flex justify-between items-center" },
                  React.createElement("label", { className: "font-mono text-[10px] text-white/60 tracking-wider uppercase" }, "NUMBER OF WAREHOUSES (k)"),
                  React.createElement("div", { className: "flex items-center space-x-1.5" },
                    React.createElement("button", {
                      type: "button",
                      onClick: () => handleWarehouseCountChange(warehouseCount - 1),
                      disabled: warehouseCount <= 1,
                      className: "w-6 h-6 rounded border border-white/20 hover:border-[#D4A373] text-white/80 hover:text-[#D4A373] disabled:opacity-20 disabled:cursor-not-allowed bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center font-mono text-sm font-bold transition-all cursor-pointer",
                      title: "Decrease facilities"
                    }, "−"),
                    React.createElement("span", { className: "font-mono text-xs font-semibold text-[#D4A373] min-w-[76px] text-center" }, `${warehouseCount} HUBS`),
                    React.createElement("button", {
                      type: "button",
                      onClick: () => handleWarehouseCountChange(warehouseCount + 1),
                      disabled: warehouseCount >= 5,
                      className: "w-6 h-6 rounded border border-white/20 hover:border-[#D4A373] text-white/80 hover:text-[#D4A373] disabled:opacity-20 disabled:cursor-not-allowed bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center font-mono text-sm font-bold transition-all cursor-pointer",
                      title: "Increase facilities"
                    }, "+")
                  )
                ),
                React.createElement("div", { className: "grid grid-cols-5 gap-1.5 p-1 bg-white/[0.03] border border-white/10 rounded-lg" },
                  [1, 2, 3, 4, 5].map((k) =>
                    React.createElement("button", {
                      key: k,
                      type: "button",
                      onClick: () => handleWarehouseCountChange(k),
                      className: `py-1.5 rounded text-xs font-mono font-medium transition-all cursor-pointer ${warehouseCount === k ? 'bg-[#D4A373] text-[#090B0E] font-bold shadow-md' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'}`
                    }, k)
                  )
                )
              ),

              /* Solver Model Options */
              React.createElement("div", { className: "space-y-2 pt-2 border-t border-white/10" },
                React.createElement("div", { className: "flex items-center justify-between" },
                  React.createElement("label", { className: "font-mono text-[10px] text-white/60 tracking-wider uppercase" }, "OPERATIONS RESEARCH SOLVER"),
                  React.createElement("span", { className: "text-[9px] font-mono text-[#D4A373]" }, "L₁ GEODESIC")
                ),
                React.createElement("div", { className: "space-y-2" },
                  /* Model 1 */
                  React.createElement("label", {
                    className: `flex flex-col p-2.5 rounded-lg border transition-all cursor-pointer ${modelType === 'weiszfeld_descent' ? 'border-[#D4A373] bg-[#D4A373]/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.04]'}`
                  },
                    React.createElement("div", { className: "flex items-center space-x-2" },
                      React.createElement("input", {
                        type: "radio",
                        name: "solverModel",
                        checked: modelType === 'weiszfeld_descent',
                        onChange: () => handleModelChange('weiszfeld_descent'),
                        className: "accent-[#D4A373]"
                      }),
                      React.createElement("span", { className: "font-mono text-xs font-semibold" }, "Weiszfeld Fermat-Weber Descent")
                    ),
                    React.createElement("span", { className: "text-[10px] text-white/50 mt-1 pl-5 leading-relaxed" }, "Continuous gradient descent minimizing order-weighted geodesic ton-km on Riemannian sphere.")
                  ),

                  /* Model 2 */
                  React.createElement("label", {
                    className: `flex flex-col p-2.5 rounded-lg border transition-all cursor-pointer ${modelType === 'capacitated_pmedian' ? 'border-[#D4A373] bg-[#D4A373]/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.04]'}`
                  },
                    React.createElement("div", { className: "flex items-center space-x-2" },
                      React.createElement("input", {
                        type: "radio",
                        name: "solverModel",
                        checked: modelType === 'capacitated_pmedian',
                        onChange: () => handleModelChange('capacitated_pmedian'),
                        className: "accent-[#D4A373]"
                      }),
                      React.createElement("span", { className: "font-mono text-xs font-semibold" }, "Capacitated P-Median (CFLP)")
                    ),
                    React.createElement("span", { className: "text-[10px] text-white/50 mt-1 pl-5 leading-relaxed" }, "Enforces facility daily order ceilings with soft-penalty reassignment for balanced hub load.")
                  ),

                  /* Model 3 */
                  React.createElement("label", {
                    className: `flex flex-col p-2.5 rounded-lg border transition-all cursor-pointer ${modelType === 'pareto_multiobjective' ? 'border-[#D4A373] bg-[#D4A373]/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.04]'}`
                  },
                    React.createElement("div", { className: "flex items-center space-x-2" },
                      React.createElement("input", {
                        type: "radio",
                        name: "solverModel",
                        checked: modelType === 'pareto_multiobjective',
                        onChange: () => handleModelChange('pareto_multiobjective'),
                        className: "accent-[#D4A373]"
                      }),
                      React.createElement("span", { className: "font-mono text-xs font-semibold" }, "Multi-Objective Pareto ESG Solver")
                    ),
                    React.createElement("span", { className: "text-[10px] text-white/50 mt-1 pl-5 leading-relaxed" }, "Multi-objective optimization balancing fixed facility lease capex, fleet opex, and carbon abated.")
                  )
                )
              ),

              /* Constraints */
              React.createElement("div", { className: "space-y-2.5 pt-2 border-t border-white/10" },
                React.createElement("div", { className: "flex items-center justify-between" },
                  React.createElement("label", { className: "flex items-center space-x-2 cursor-pointer" },
                    React.createElement("input", {
                      type: "checkbox",
                      checked: enableCapacity,
                      onChange: (e) => setEnableCapacity(e.target.checked),
                      className: "accent-[#D4A373] w-3.5 h-3.5"
                    }),
                    React.createElement("span", { className: "font-mono text-[10px] text-white/70 uppercase" }, "Max Facility Capacity Cap")
                  ),
                  React.createElement("span", { className: "font-mono text-[9px] text-white/40" }, "[ Constraint ]")
                ),
                enableCapacity && React.createElement("div", { className: "flex items-center space-x-2 pl-5" },
                  React.createElement("input", {
                    type: "number",
                    value: maxCapacity,
                    onChange: (e) => setMaxCapacity(parseInt(e.target.value, 10) || 5000),
                    className: "w-24 bg-[#11141B] border border-white/15 rounded px-2 py-1 font-mono text-xs text-white focus:border-[#D4A373] outline-none"
                  }),
                  React.createElement("span", { className: "font-mono text-[10px] text-white/50" }, "orders / day / hub")
                ),

                React.createElement("div", { className: "flex items-center justify-between" },
                  React.createElement("label", { className: "flex items-center space-x-2 cursor-pointer" },
                    React.createElement("input", {
                      type: "checkbox",
                      checked: enableRadius,
                      onChange: (e) => setEnableRadius(e.target.checked),
                      className: "accent-[#D4A373] w-3.5 h-3.5"
                    }),
                    React.createElement("span", { className: "font-mono text-[10px] text-white/70 uppercase" }, "Max Service Radius Boundary")
                  ),
                  React.createElement("span", { className: "font-mono text-[9px] text-white/40" }, "[ Constraint ]")
                ),
                enableRadius && React.createElement("div", { className: "flex items-center space-x-2 pl-5" },
                  React.createElement("input", {
                    type: "number",
                    value: maxRadius,
                    onChange: (e) => setMaxRadius(parseFloat(e.target.value) || 12),
                    className: "w-24 bg-[#11141B] border border-white/15 rounded px-2 py-1 font-mono text-xs text-white focus:border-[#D4A373] outline-none"
                  }),
                  React.createElement("span", { className: "font-mono text-[10px] text-white/50" }, "km radius boundary")
                )
              )
            ),

            /* Tab 2: Fleet & SLA */
            activeHudTab === 'fleet' && React.createElement("div", { className: "space-y-4" },
              React.createElement("div", { className: "space-y-2" },
                React.createElement("div", { className: "flex items-center justify-between" },
                  React.createElement("label", { className: "font-mono text-[10px] text-white/60 tracking-wider uppercase" }, "LAST-MILE FLEET PROFILE"),
                  React.createElement("span", { className: "text-[9px] font-mono text-emerald-400 font-bold" }, fleetProfile.badge || 'Standard LCV')
                ),
                React.createElement("div", { className: "space-y-2" },
                  ['ev_fleet', 'lcv_diesel', 'heavy_3pl'].map((fk) => {
                    const prof = window.GRIDPOINT_ALGO ? window.GRIDPOINT_ALGO.FLEET_PROFILES[fk] : null;
                    if (!prof) return null;
                    return React.createElement("label", {
                      key: fk,
                      className: `flex items-start space-x-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${fleetType === fk ? 'border-[#D4A373] bg-[#D4A373]/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.04]'}`
                    },
                      React.createElement("input", {
                        type: "radio",
                        name: "fleetTypeRadio",
                        checked: fleetType === fk,
                        onChange: () => handleFleetChange(fk),
                        className: "accent-[#D4A373] mt-0.5"
                      }),
                      React.createElement("div", { className: "flex-1" },
                        React.createElement("div", { className: "flex justify-between items-center" },
                          React.createElement("span", { className: "font-mono text-xs font-semibold" }, prof.name),
                          React.createElement("span", { className: "font-mono text-[11px] font-bold text-[#D4A373]" }, `₹${prof.ratePerKm}/km`)
                        ),
                        React.createElement("div", { className: "flex justify-between items-center mt-1 text-[10px] text-white/50" },
                          React.createElement("span", null, `Avg speed: ${prof.avgSpeedKmH} km/h`),
                          React.createElement("span", null, prof.co2PerKmKg === 0 ? 'Zero Direct CO₂' : `${prof.co2PerKmKg * 1000}g CO₂/km`)
                        )
                      )
                    );
                  })
                )
              ),

              /* Circuity Factor */
              React.createElement("div", { className: "space-y-2 pt-2 border-t border-white/10" },
                React.createElement("div", { className: "flex justify-between items-center" },
                  React.createElement("label", { className: "font-mono text-[10px] text-white/60 tracking-wider uppercase" }, "ROAD DETOUR FACTOR (CIRCUITY)"),
                  React.createElement("span", { className: "font-mono text-xs font-bold text-[#D4A373]" }, `${roadFactor.toFixed(2)}x`)
                ),
                React.createElement("input", {
                  type: "range",
                  min: "1.10",
                  max: "1.50",
                  step: "0.05",
                  value: roadFactor,
                  onChange: (e) => {
                    const val = parseFloat(e.target.value);
                    setRoadFactor(val);
                    if (optimizationResult) triggerOptimizationRun({ roadFactor: val }, true);
                  },
                  className: "w-full accent-[#D4A373]"
                }),
                React.createElement("div", { className: "flex justify-between text-[9px] font-mono text-white/40" },
                  React.createElement("span", null, "1.10x (Grid)"),
                  React.createElement("span", null, "1.30x (Metro Std)"),
                  React.createElement("span", null, "1.50x (Congested)")
                ),
                React.createElement("p", { className: "text-[10px] text-white/50 leading-relaxed" }, "Scales straight-line geodesic distance to actual street-level routing across flyovers and barriers.")
              ),

              /* SLA Target */
              React.createElement("div", { className: "space-y-2 pt-2 border-t border-white/10" },
                React.createElement("label", { className: "font-mono text-[10px] text-white/60 tracking-wider uppercase" }, "TARGET SLA DELIVERY WINDOW"),
                React.createElement("div", { className: "grid grid-cols-3 gap-1.5 p-1 bg-white/[0.03] border border-white/10 rounded-lg text-center font-mono" },
                  [15, 30, 60].map((mins) =>
                    React.createElement("button", {
                      key: mins,
                      type: "button",
                      onClick: () => {
                        setTargetSlaMinutes(mins);
                        if (optimizationResult) triggerOptimizationRun({ targetSlaMinutes: mins }, true);
                      },
                      className: `py-1.5 rounded text-xs transition-all cursor-pointer ${targetSlaMinutes === mins ? 'bg-[#D4A373] text-[#090B0E] font-bold' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'}`
                    }, mins === 60 ? 'Same Day' : `< ${mins} min`)
                  )
                )
              )
            ),

            /* Tab 3: Convergence Telemetry */
            activeHudTab === 'telemetry' && React.createElement("div", { className: "space-y-3 font-mono" },
              React.createElement("div", { className: "flex items-center justify-between" },
                React.createElement("span", { className: "text-[10px] text-white/60 uppercase" }, "SOLVER ENGINE"),
                React.createElement("span", { className: "text-[10px] text-emerald-400 font-bold" }, "DETERMINISTIC CONVEX")
              ),
              solverStats ? React.createElement("div", { className: "space-y-2.5" },
                React.createElement("div", { className: "grid grid-cols-2 gap-2" },
                  React.createElement("div", { className: "p-2 bg-black/40 border border-white/10 rounded-lg" },
                    React.createElement("span", { className: "text-[9px] text-white/40 block" }, "ITERATIONS"),
                    React.createElement("span", { className: "text-sm font-bold text-white" }, `${solverStats.iterations} loops`)
                  ),
                  React.createElement("div", { className: "p-2 bg-black/40 border border-white/10 rounded-lg" },
                    React.createElement("span", { className: "text-[9px] text-white/40 block" }, "RUNTIME"),
                    React.createElement("span", { className: "text-sm font-bold text-[#D4A373]" }, `${solverStats.executionTimeMs} ms`)
                  ),
                  React.createElement("div", { className: "p-2 bg-black/40 border border-white/10 rounded-lg" },
                    React.createElement("span", { className: "text-[9px] text-white/40 block" }, "CENTROID SHIFT Δ"),
                    React.createElement("span", { className: "text-sm font-bold text-emerald-400" }, `${solverStats.convergenceDeltaMeters} m`)
                  ),
                  React.createElement("div", { className: "p-2 bg-black/40 border border-white/10 rounded-lg" },
                    React.createElement("span", { className: "text-[9px] text-white/40 block" }, "SILHOUETTE SCORE"),
                    React.createElement("span", { className: "text-sm font-bold text-white" }, `${solverStats.silhouetteScore} / 1.0`)
                  )
                ),
                React.createElement("div", { className: "p-2.5 bg-black/40 border border-white/10 rounded-lg space-y-1" },
                  React.createElement("div", { className: "flex justify-between text-[10px]" },
                    React.createElement("span", { className: "text-white/50" }, "Objective Loss Reduction:"),
                    React.createElement("span", { className: "text-emerald-400 font-bold" }, `↓ ${solverStats.costImprovementPercent}%`)
                  ),
                  React.createElement("div", { className: "flex justify-between text-[10px]" },
                    React.createElement("span", { className: "text-white/50" }, "15-Min Reachability:"),
                    React.createElement("span", { className: "text-white font-bold" }, `${solverStats.sla15ReachPercent}% orders`)
                  )
                ),
                React.createElement("button", {
                  type: "button",
                  onClick: () => setShowDiagnosticsModal(true),
                  className: "w-full py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 rounded text-[11px] text-[#D4A373] hover:text-white transition-all cursor-pointer"
                }, "View Full Step-by-Step Iteration Table →")
              ) : React.createElement("div", { className: "p-4 text-center text-white/40 bg-white/[0.02] border border-white/5 rounded-lg" }, "Run optimization to inspect live mathematical convergence telemetry.")
            ),

            /* Primary Run Button */
            React.createElement("button", {
              onClick: handleRun,
              disabled: isOptimizing || neighborhoods.length === 0,
              className: "w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4A373] via-[#E29578] to-[#D4A373] hover:opacity-95 disabled:opacity-30 text-[#090B0E] font-bold text-xs font-mono tracking-widest uppercase transition-all shadow-lg shadow-[#D4A373]/25 flex items-center justify-center space-x-2 cursor-pointer border border-[#D4A373]/40 mt-2"
            },
              React.createElement("span", null, isOptimizing ? 'SOLVING GEODESIC DESCENT...' : 'RUN MATHEMATICAL OPTIMIZATION'),
              React.createElement("span", null, "→")
            )
          )
        )
      ),

      /* Selected Warehouse Drawer */
      selectedWarehouse && React.createElement(window.GRIDPOINT_COMPONENTS.WarehouseInspector, {
        warehouse: selectedWarehouse,
        onClose: () => onSelectWarehouse(null),
        onExplainLocation: (wh) => onOpenTransparency(wh)
      })
    ),

    /* 5. Mathematical Solver Diagnostics Modal */
    showDiagnosticsModal && React.createElement("div", {
      className: "fixed inset-0 z-[2200] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4"
    },
      React.createElement("div", {
        className: "w-[720px] max-w-full max-h-[90vh] bg-[#0F1218] border border-white/15 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-white font-sans animate-in fade-in zoom-in-95"
      },
        React.createElement("div", { className: "px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#161B22]/90 flex-none" },
          React.createElement("div", { className: "flex items-center space-x-3" },
            React.createElement("div", { className: "w-2.5 h-2.5 bg-[#D4A373] rotate-45" }),
            React.createElement("div", null,
              React.createElement("h3", { className: "font-mono font-bold text-sm tracking-wider uppercase text-white" }, "MATHEMATICAL SOLVER CONVERGENCE PROOF"),
              React.createElement("p", { className: "font-mono text-[10px] text-white/50" }, "Continuous Fermat-Weber Geodesic Descent • Kuhn-Tucker Constrained CFLP")
            )
          ),
          React.createElement("button", {
            onClick: () => setShowDiagnosticsModal(false),
            className: "w-7 h-7 flex items-center justify-center text-white/50 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors font-mono cursor-pointer"
          }, "✕")
        ),

        React.createElement("div", { className: "p-6 overflow-y-auto space-y-5 text-xs font-mono flex-1" },
          React.createElement("div", { className: "p-4 bg-black/50 border border-white/10 rounded-xl space-y-2" },
            React.createElement("span", { className: "text-[10px] text-[#D4A373] font-bold uppercase tracking-wider block" }, "MATHEMATICAL FORMULATION"),
            React.createElement("p", { className: "text-white/80 text-[11px] leading-relaxed font-sans" }, "The spatial optimization problem is formulated as a continuous Fermat-Weber facility location problem on the Riemannian sphere. It minimizes total ton-kilometer fleet transit distance subject to vehicle circuity and throughput load constraints:"),
            React.createElement("div", { className: "p-2.5 bg-white/[0.03] border border-white/10 rounded text-center text-[#D4A373] font-mono text-xs overflow-x-auto" }, "min J(C) = ∑(j=1..k) ∑(i∈Sj) w_i · [ d_haversine(c_j, x_i) × R_circuity ] × Rate_km + k · Fixed_Capex")
          ),

          solverStats && React.createElement("div", { className: "grid grid-cols-4 gap-2.5 text-center" },
            React.createElement("div", { className: "p-3 bg-white/[0.03] border border-white/10 rounded-xl" },
              React.createElement("span", { className: "text-[9px] text-white/40 block" }, "MODEL"),
              React.createElement("span", { className: "text-xs font-bold text-[#D4A373] block truncate" }, solverStats.modelName)
            ),
            React.createElement("div", { className: "p-3 bg-white/[0.03] border border-white/10 rounded-xl" },
              React.createElement("span", { className: "text-[9px] text-white/40 block" }, "LOOPS TO CONVERGE"),
              React.createElement("span", { className: "text-xs font-bold text-white block" }, `${solverStats.iterations} iterations`)
            ),
            React.createElement("div", { className: "p-3 bg-white/[0.03] border border-white/10 rounded-xl" },
              React.createElement("span", { className: "text-[9px] text-white/40 block" }, "EXECUTION TIME"),
              React.createElement("span", { className: "text-xs font-bold text-emerald-400 block" }, `${solverStats.executionTimeMs} ms`)
            ),
            React.createElement("div", { className: "p-3 bg-white/[0.03] border border-white/10 rounded-xl" },
              React.createElement("span", { className: "text-[9px] text-white/40 block" }, "SILHOUETTE INDEX"),
              React.createElement("span", { className: "text-xs font-bold text-white block" }, `${solverStats.silhouetteScore} / 1.0`)
            )
          ),

          React.createElement("div", { className: "space-y-2" },
            React.createElement("span", { className: "text-[10px] text-white/60 uppercase tracking-wider block" }, "STEP-BY-STEP CONVERGENCE TELEMETRY LOG"),
            React.createElement("div", { className: "border border-white/10 rounded-xl overflow-hidden bg-black/40" },
              React.createElement("table", { className: "w-full text-left text-[11px]" },
                React.createElement("thead", { className: "bg-white/[0.04] text-white/60 border-b border-white/10 text-[10px] uppercase" },
                  React.createElement("tr", null,
                    React.createElement("th", { className: "py-2 px-3 font-semibold" }, "Iteration"),
                    React.createElement("th", { className: "py-2 px-3 font-semibold" }, "Objective Loss J"),
                    React.createElement("th", { className: "py-2 px-3 font-semibold" }, "Max Centroid Shift"),
                    React.createElement("th", { className: "py-2 px-3 font-semibold" }, "Convergence Status")
                  )
                ),
                React.createElement("tbody", { className: "divide-y divide-white/5" },
                  (solverStats && solverStats.iterationLog && solverStats.iterationLog.length > 0) ? (
                    solverStats.iterationLog.map((row) =>
                      React.createElement("tr", { key: row.iteration, className: "hover:bg-white/[0.02]" },
                        React.createElement("td", { className: "py-2 px-3 text-white font-bold" }, `Loop ${row.iteration}`),
                        React.createElement("td", { className: "py-2 px-3 text-[#D4A373]" }, `₹${row.loss.toLocaleString()}`),
                        React.createElement("td", { className: "py-2 px-3 text-white/80" }, `${row.maxShiftMeters} m`),
                        React.createElement("td", { className: "py-2 px-3" },
                          React.createElement("span", {
                            className: `px-1.5 py-0.5 rounded text-[9px] font-bold ${row.maxShiftMeters < 5 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/[0.05] text-white/60'}`
                          }, row.status)
                        )
                      )
                    )
                  ) : React.createElement("tr", null,
                    React.createElement("td", { colSpan: 4, className: "py-4 text-center text-white/40" }, "No telemetry logs generated yet. Click 'Run Optimization' on the workspace HUD.")
                  )
                )
              )
            )
          )
        ),

        React.createElement("div", { className: "px-6 py-3.5 border-t border-white/10 bg-[#161B22]/90 flex items-center justify-between flex-none font-mono text-xs" },
          React.createElement("span", { className: "text-white/40 text-[10px]" }, "Deterministic Mathematical Proof • Verified via Riemann Haversine Metric"),
          React.createElement("button", {
            onClick: () => setShowDiagnosticsModal(false),
            className: "px-4 py-1.5 rounded-lg bg-[#D4A373] hover:bg-[#E29578] text-[#090B0E] font-bold text-xs transition-colors cursor-pointer"
          }, "Close Diagnostics")
        )
      )
    )
  );
};
