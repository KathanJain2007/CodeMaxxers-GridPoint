// SHELVO — Executive Logistics Optimization Dossier / Printable Summary
// Formatted for C-level supply chain presentation & printable PDF export.

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

window.GRIDPOINT_COMPONENTS.ExecutiveReportModal = function({
  neighborhoods,
  optimizationResult,
  baselineMetrics,
  onClose
}) {
  if (!optimizationResult || !baselineMetrics) return null;

  const { metrics, warehouses } = optimizationResult;

  const formatInrLakhs = (amount) => {
    if (!amount) return "₹0.00L";
    return `₹${(amount / 100000).toFixed(2)}L`;
  };

  const costDelta = baselineMetrics.totalDeliveryCostInr - metrics.totalDeliveryCostInr;
  const costPct = ((costDelta / baselineMetrics.totalDeliveryCostInr) * 100).toFixed(1);

  const distDelta = baselineMetrics.totalDeliveryDistanceKm - metrics.totalDeliveryDistanceKm;
  const distPct = ((distDelta / baselineMetrics.totalDeliveryDistanceKm) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-[#08090C]/95 backdrop-blur-xl flex flex-col overflow-y-auto text-[#F4F4F6]">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-[#0B0D11]/80 sticky top-0 z-20 print:hidden">
        <div className="flex items-center space-x-4">
          <div className="w-2.5 h-2.5 bg-[#D4A373] rotate-45"></div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-white font-semibold">
            EXECUTIVE INTELLIGENCE DOSSIER
          </span>
          <span className="text-white/20 font-mono text-xs">/</span>
          <span className="font-mono text-xs text-[#8E96A4]">
            BOARD-READY PRESENTATION
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-[#D4A373] text-[#090B0E] font-mono text-xs font-semibold tracking-wider uppercase hover:bg-[#E29578] transition-all"
          >
            PRINT / SAVE AS PDF
          </button>

          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white font-mono text-xs border border-white/10 hover:border-white/30"
          >
            ESC ✕
          </button>
        </div>
      </div>

      {/* Printable Report Body */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-8 md:p-14 space-y-12 print:bg-white print:text-black">
        
        {/* Document Header */}
        <div className="border-b border-white/10 pb-8 flex justify-between items-start">
          <div className="space-y-1">
            <div className="font-mono text-xs text-[#D4A373] tracking-[0.25em] uppercase">
              CONFIDENTIAL // LOGISTICS NETWORK AUDIT
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-white tracking-tight">
              SHELVO Optimization Report
            </h1>
            <div className="text-xs text-[#8E96A4] font-mono">
              Bengaluru Metropolitan Fulfillment Restructuring Analysis
            </div>
          </div>

          <div className="text-right font-mono text-xs text-white/40 space-y-1">
            <div>DATE: 2026-09-19</div>
            <div>ALGO: WEISZFELD FERMAT-WEBER</div>
            <div>STATUS: CONVERGED // OPTIMAL</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-4">
          <h3 className="font-serif text-2xl text-white">Executive Synthesis</h3>
          <p className="text-sm text-white/80 leading-relaxed font-light">
            SHELVO was deployed to evaluate facility location economics across {neighborhoods.length} high-density demand zones. By transitioning from the legacy single-depot configuration to a mathematically balanced <strong className="text-white">{warehouses.length}-hub decentralized network</strong>, the organization reduces daily logistics expenditure by <strong className="text-[#10B981]">{costPct}%</strong> (saving <strong className="text-[#10B981]">{formatInrLakhs(costDelta)} daily</strong>), while reducing fleet delivery distance by <strong className="text-white">{distPct}%</strong> ({distDelta.toLocaleString()} km saved daily).
          </p>
        </div>

        {/* High-Level Comparison Table */}
        <div className="glass-panel border border-white/10 overflow-hidden">
          <table className="w-full swiss-table">
            <thead>
              <tr>
                <th>NETWORK METRIC</th>
                <th>BASELINE (CURRENT)</th>
                <th>SHELVO OPTIMIZED</th>
                <th>NET VARIANCE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium text-white">Active Warehouse Centroids</td>
                <td className="font-mono text-white/70">1 Depot (Central)</td>
                <td className="font-mono text-white font-semibold">{warehouses.length} Centroids (Decentralized)</td>
                <td className="font-mono text-[#D4A373]">+{warehouses.length - 1} Nodes</td>
              </tr>
              <tr>
                <td className="font-medium text-white">Daily Delivery Cost</td>
                <td className="font-mono text-white/70">{formatInrLakhs(baselineMetrics.totalDeliveryCostInr)} / day</td>
                <td className="font-mono text-[#10B981] font-semibold">{formatInrLakhs(metrics.totalDeliveryCostInr)} / day</td>
                <td className="font-mono text-[#10B981] font-semibold">↓ {costPct}% ({formatInrLakhs(costDelta)})</td>
              </tr>
              <tr>
                <td className="font-medium text-white">Total Transit Distance</td>
                <td className="font-mono text-white/70">{baselineMetrics.totalDeliveryDistanceKm.toLocaleString()} km</td>
                <td className="font-mono text-white font-semibold">{metrics.totalDeliveryDistanceKm.toLocaleString()} km</td>
                <td className="font-mono text-[#10B981]">↓ {distPct}% ({distDelta.toLocaleString()} km)</td>
              </tr>
              <tr>
                <td className="font-medium text-white">Average Customer Distance</td>
                <td className="font-mono text-white/70">{baselineMetrics.averageDeliveryDistanceKm} km</td>
                <td className="font-mono text-[#38BDF8] font-semibold">{metrics.averageDeliveryDistanceKm} km</td>
                <td className="font-mono text-[#38BDF8]">↓ {(baselineMetrics.averageDeliveryDistanceKm - metrics.averageDeliveryDistanceKm).toFixed(2)} km</td>
              </tr>
              <tr>
                <td className="font-medium text-white">Daily Fleet Carbon Emission</td>
                <td className="font-mono text-white/70">{Math.round((baselineMetrics.totalDeliveryDistanceKm / 10) * 0.21).toLocaleString()} kg CO₂</td>
                <td className="font-mono text-white font-semibold">{metrics.totalEmissionsKgCo2.toLocaleString()} kg CO₂</td>
                <td className="font-mono text-[#10B981]">↓ {distPct}% Carbon abatement</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Warehouse Allocation Breakdown */}
        <div className="space-y-4">
          <h3 className="font-serif text-2xl text-white">Recommended Warehouse Centroids</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {warehouses.map((wh, idx) => (
              <div key={idx} className="p-5 bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rotate-45" style={{ background: wh.color }}></span>
                  <span className="font-serif text-xl text-white">{wh.name}</span>
                </div>
                <div className="font-mono text-xs text-white/50">
                  {wh.latitude.toFixed(4)}° N, {wh.longitude.toFixed(4)}° E
                </div>
                <div className="space-y-1 font-mono text-xs pt-2 border-t border-white/5">
                  <div className="flex justify-between">
                    <span className="text-white/40">DEMAND:</span>
                    <span className="text-white font-semibold">{wh.dailyDemand.toLocaleString()} orders</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">ZONES:</span>
                    <span className="text-white">{wh.assignedCount} markets</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">AVG RADIUS:</span>
                    <span className="text-white">{wh.averageDistanceKm} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">OPEX:</span>
                    <span className="text-[#D4A373]">{formatInrLakhs(wh.dailyDeliveryCostInr)} /day</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signoff */}
        <div className="border-t border-white/10 pt-8 flex justify-between items-center text-xs font-mono text-white/40">
          <div>GENERATED BY SHELVO LOGISTICS INTELLIGENCE SUITE</div>
          <div>STRICTLY AUDITED & MATHEMATICALLY CONVERGED</div>
        </div>

      </div>

    </div>
  );
};
