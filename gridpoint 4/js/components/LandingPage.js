// GRIDPOINT — Landing / Home Screen Component
// Swiss Minimalist Editorial + Interactive Spatial Grid Visualization

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

window.GRIDPOINT_COMPONENTS.LandingPage = function({ onStartOptimization, onLoadDemo }) {
  const canvasRef = React.useRef(null);

  // Subtle interactive spatial grid simulation on HTML5 Canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Simulated network nodes
    const NUM_NODES = 42;
    const NUM_HUBS = 3;
    const hubs = [
      { x: width * 0.32, y: height * 0.42, color: '#D4A373', pulse: 0 },
      { x: width * 0.68, y: height * 0.38, color: '#38BDF8', pulse: 1.2 },
      { x: width * 0.52, y: height * 0.74, color: '#10B981', pulse: 2.4 }
    ];

    const nodes = [];
    for (let i = 0; i < NUM_NODES; i++) {
      const assignedHub = Math.floor(Math.random() * NUM_HUBS);
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 160;
      nodes.push({
        x: hubs[assignedHub].x + Math.cos(angle) * dist + (Math.random() - 0.5) * 40,
        y: hubs[assignedHub].y + Math.sin(angle) * dist + (Math.random() - 0.5) * 40,
        baseX: hubs[assignedHub].x + Math.cos(angle) * dist,
        baseY: hubs[assignedHub].y + Math.sin(angle) * dist,
        hub: assignedHub,
        radius: 2.2 + Math.random() * 3.5,
        speed: 0.008 + Math.random() * 0.012,
        offset: Math.random() * 10
      });
    }

    let t = 0;
    const render = () => {
      t += 0.018;
      ctx.clearRect(0, 0, width, height);

      // Subtle architectural grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 48;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw subtle connecting rays from hubs to assigned nodes
      nodes.forEach(node => {
        const hub = hubs[node.hub];
        ctx.beginPath();
        ctx.moveTo(hub.x, hub.y);
        ctx.lineTo(node.x, node.y);
        ctx.strokeStyle = node.hub === 0 ? 'rgba(212, 163, 115, 0.12)' :
                          node.hub === 1 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(16, 185, 129, 0.12)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // Draw nodes (neighborhoods) with gentle drift
      nodes.forEach(node => {
        const drift = Math.sin(t + node.offset) * 6;
        node.x = node.baseX + drift;
        node.y = node.baseY + Math.cos(t + node.offset) * 4;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.hub === 0 ? 'rgba(212, 163, 115, 0.65)' :
                        node.hub === 1 ? 'rgba(56, 189, 248, 0.65)' : 'rgba(16, 185, 129, 0.65)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      });

      // Draw warehouse hubs with concentric pulsing radar rings
      hubs.forEach((hub, idx) => {
        // Radar ring 1
        const r1 = ((t * 22 + idx * 30) % 110) + 12;
        const alpha1 = Math.max(0, 0.45 * (1 - r1 / 110));
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, r1, 0, Math.PI * 2);
        ctx.strokeStyle = idx === 0 ? `rgba(212, 163, 115, ${alpha1})` :
                          idx === 1 ? `rgba(56, 189, 248, ${alpha1})` : `rgba(16, 185, 129, ${alpha1})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Warehouse center glyph (diamond)
        ctx.save();
        ctx.translate(hub.x, hub.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = hub.color;
        ctx.fillRect(-7, -7, 14, 14);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-7, -7, 14, 14);
        ctx.restore();

        // Label
        ctx.font = '10px "Geist Mono", monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(`WH-0${idx + 1}`, hub.x + 14, hub.y + 4);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#08090C] text-[#F4F4F6] flex flex-col justify-between overflow-hidden">
      
      {/* Top Swiss Editorial Navigation */}
      <header className="relative z-20 flex items-center justify-between px-8 py-6 border-b border-white/[0.08] backdrop-blur-md bg-[#08090C]/60">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 bg-[#D4A373] rotate-45"></div>
          <span className="font-mono text-sm tracking-[0.25em] font-semibold text-white uppercase">
            GRIDPOINT
          </span>
          <span className="text-white/20 font-mono text-xs">/</span>
          <span className="font-mono text-xs text-white/40 tracking-wider">
            LOGISTICS INTELLIGENCE v2.4
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-8 font-mono text-xs text-white/60">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
            <span>SYSTEM OPERATIONAL</span>
          </div>
          <span>LAT: 12.9716° N</span>
          <span>LON: 77.5946° E</span>
        </div>

        <div>
          <button
            onClick={onLoadDemo}
            className="px-4 py-2 border border-white/15 hover:border-[#D4A373] text-xs font-mono tracking-wider text-white/80 hover:text-white transition-all bg-white/[0.02] hover:bg-white/[0.06]"
          >
            QUICK DEMO (BENGALURU)
          </button>
        </div>
      </header>

      {/* Background Interactive Spatial Grid Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-60 z-0"
      />

      {/* Radial vignette gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-transparent to-[#08090C]/80 pointer-events-none z-10" />

      {/* Main Hero Content */}
      <main className="relative z-20 max-w-6xl mx-auto px-8 pt-12 pb-16 flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md w-fit mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4A373]"></span>
          <span className="font-mono text-xs tracking-widest text-white/70 uppercase">
            Autonomous Facility Siting & Geodesic Optimization
          </span>
        </div>

        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-tight text-white leading-[1.05] max-w-5xl mb-8">
          WHERE SHOULD YOUR <br />
          <span className="italic font-normal text-[#E29578]">WAREHOUSE</span> GO?
        </h1>

        <p className="text-lg md:text-xl text-[#8E96A4] font-light max-w-2xl leading-relaxed mb-12">
          Turn demand density, geodesic transport physics, and capital infrastructure economics into one intelligent, mathematically optimal decision.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <button
            onClick={onStartOptimization}
            className="group relative px-8 py-4 bg-[#D4A373] hover:bg-[#E29578] text-[#090B0E] font-medium tracking-wide text-sm transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg shadow-[#D4A373]/15"
          >
            <span>Start Optimization</span>
            <span className="font-mono transition-transform group-hover:translate-x-1">→</span>
          </button>

          <button
            onClick={onLoadDemo}
            className="px-8 py-4 border border-white/20 hover:border-white/50 text-white/90 hover:text-white font-mono text-xs tracking-widest transition-all bg-white/[0.02] hover:bg-white/[0.05] flex items-center justify-center space-x-2"
          >
            <span>Explore Demo</span>
            <span className="text-white/40">⚡ 28 Hubs</span>
          </button>
        </div>

        {/* Live System Metric Ticker Bar */}
        <div className="mt-20 pt-10 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="font-mono text-xs text-[#D4A373] tracking-widest uppercase">
              01 — DEMAND
            </div>
            <div className="text-sm text-white font-medium">Order-Weighted Intelligence</div>
            <div className="text-xs text-[#8E96A4] leading-relaxed">
              Every neighborhood exerts gravitational pull proportional to daily delivery volume Σ(Orders × Distance).
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-mono text-xs text-[#38BDF8] tracking-widest uppercase">
              02 — GEOGRAPHY
            </div>
            <div className="text-sm text-white font-medium">Spatial Geodesic Optimization</div>
            <div className="text-xs text-[#8E96A4] leading-relaxed">
              Great-circle Haversine curvature calculations rather than Euclidean approximations.
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-mono text-xs text-[#10B981] tracking-widest uppercase">
              03 — ECONOMICS
            </div>
            <div className="text-sm text-white font-medium">Cost-Aware Trade-Offs</div>
            <div className="text-xs text-[#8E96A4] leading-relaxed">
              Balances transit distance savings against warehouse fixed lease & facility expenditure.
            </div>
          </div>
        </div>
      </main>

      {/* Footer minimal info */}
      <footer className="relative z-20 px-8 py-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-white/40">
        <div>GRIDPOINT PLATFORM // BUILT FOR ENTERPRISE SUPPLY CHAIN LOGISTICS</div>
        <div className="mt-2 sm:mt-0 flex space-x-6">
          <span>FERMAT-WEBER ALGORITHM</span>
          <span>HAVERSINE METRICS</span>
          <span>WEISZFELD METHOD</span>
        </div>
      </footer>
    </div>
  );
};
