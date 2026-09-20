// SHELVO — Executive Dashboard Component
// Real database telemetry, KPI statistics, project management (Open, Duplicate, Delete), and + New Optimization modal.

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

window.GRIDPOINT_COMPONENTS.Dashboard = function({
  user,
  onNavigate,
  onLogout
}) {
  const [dashboardData, setDashboardData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showNewModal, setShowNewModal] = React.useState(false);

  // New project modal state
  const [newProjectName, setNewProjectName] = React.useState('');
  const [newProjectDesc, setNewProjectDesc] = React.useState('');
  const [datasetChoice, setDatasetChoice] = React.useState('demo'); // 'demo' | 'csv'
  const [uploadedNeighborhoods, setUploadedNeighborhoods] = React.useState([]);
  const [modalError, setModalError] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);

  // Load dashboard telemetry from backend
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('gridpoint_token');
      const res = await fetch('/api/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle Project Creation
  const handleCreateProject = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!newProjectName.trim()) {
      setModalError('Project name is required.');
      return;
    }

    setIsCreating(true);
    try {
      const token = localStorage.getItem('gridpoint_token');
      const neighborhoodsToAttach = datasetChoice === 'demo'
        ? window.GRIDPOINT_DATA.BENGALURU_DEMO_DATA
        : uploadedNeighborhoods;

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDesc.trim(),
          datasetName: datasetChoice === 'demo' ? 'Bengaluru Metropolitan Demo' : 'Custom Uploaded Demand',
          neighborhoods: neighborhoodsToAttach
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || 'Failed to create project.');
        return;
      }

      // Add to local state immediately so if user stays or returns, it's instantly present
      if (data.project) {
        const fullProj = {
          ...data.project,
          neighborhoodCount: data.project.neighborhoodCount || (neighborhoodsToAttach || []).length || 28,
          updatedAt: data.project.updatedAt || new Date().toISOString()
        };
        setDashboardData(prev => {
          if (!prev) return prev;
          const updatedProjects = [fullProj, ...(prev.recentProjects || [])];
          return {
            ...prev,
            activeProjects: (prev.activeProjects || 0) + 1,
            recentProjects: updatedProjects
          };
        });
      }

      setShowNewModal(false);
      // Navigate to optimization workspace for this new project!
      onNavigate(`/optimize/${data.project.id}`);
    } catch (err) {
      setModalError('Network error while creating project.');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Project Duplicate
  const handleDuplicate = async (projectId) => {
    try {
      const token = localStorage.getItem('gridpoint_token');
      const res = await fetch(`/api/projects/${projectId}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to duplicate project:', err);
    }
  };

  // Handle Project Delete
  const handleDelete = async (projectId, projectName) => {
    if (!confirm(`Are you sure you want to delete project "${projectName}"? This will remove all datasets and optimization runs.`)) {
      return;
    }
    try {
      const token = localStorage.getItem('gridpoint_token');
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  // Handle CSV file upload in modal
  const handleModalCSV = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = window.GRIDPOINT_DATA.parseDemandCSV(e.target.result);
      if (parsed.success) {
        setUploadedNeighborhoods(parsed.data);
      } else {
        setModalError(parsed.error);
      }
    };
    reader.readAsText(file);
  };

  const formatInrLakhs = (amount) => {
    if (!amount) return "—";
    return `₹${(amount / 100000).toFixed(2)}L`;
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F4F4F6] flex flex-col justify-between">
      
      {/* Top Swiss Editorial Navigation */}
      <header className="px-8 py-5 border-b border-white/[0.08] bg-[#090B0E]/90 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-6">
          <button onClick={() => onNavigate('/dashboard')} className="flex items-center space-x-3 text-left">
            <div className="w-2.5 h-2.5 bg-[#D4A373] rotate-45"></div>
            <div>
              <span className="font-mono text-sm tracking-[0.25em] font-semibold text-white uppercase block">
                SHELVO
              </span>
              <span className="font-mono text-[9px] text-white/40 tracking-wider block">
                NETWORK INTELLIGENCE
              </span>
            </div>
          </button>

          <nav className="hidden md:flex items-center space-x-6 font-mono text-xs text-white/60">
            <button onClick={() => onNavigate('/dashboard')} className="text-[#D4A373] font-semibold">
              DASHBOARD
            </button>
            <button onClick={() => onNavigate('/analytics')} className="hover:text-white transition-colors">
              ANALYTICS
            </button>
            <button onClick={() => onNavigate('/profile')} className="hover:text-white transition-colors">
              SETTINGS
            </button>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-right font-mono text-xs">
            <div className="text-white font-medium">{user ? user.fullName : 'Enterprise Analyst'}</div>
            <div className="text-white/40 text-[10px]">{user ? user.organization : 'Logistics Global'}</div>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-[#D4A373] hover:bg-[#E29578] text-[#090B0E] font-medium font-mono text-xs tracking-wider uppercase transition-all shadow-md shadow-[#D4A373]/20 flex items-center space-x-1.5"
          >
            <span>+ NEW OPTIMIZATION</span>
          </button>

          <button
            onClick={onLogout}
            className="p-2 border border-white/10 hover:border-white/30 text-white/50 hover:text-white font-mono text-xs transition-all"
            title="Sign Out"
          >
            LOGOUT ⏻
          </button>
        </div>
      </header>

      {/* Main Dashboard Viewport */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-8 md:p-12 space-y-12">
        
        {/* Welcome Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/[0.08] pb-8 gap-4">
          <div className="space-y-2">
            <div className="font-mono text-[10px] text-[#D4A373] tracking-[0.25em] uppercase">
              EXECUTIVE COMMAND CENTER // SYSTEM OPERATIONAL
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-white tracking-tight">
              Welcome back, {user ? user.fullName.split(' ')[0] : 'Analyst'}
            </h1>
            <p className="text-sm text-[#8E96A4] font-light max-w-2xl">
              Active facility siting models, geocoded metropolitan demand sets, and continuous Fermat-Weber cost optimization telemetry.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNewModal(true)}
              className="px-6 py-3 border border-white/20 hover:border-white/50 text-white font-mono text-xs tracking-widest uppercase transition-all bg-white/[0.02] hover:bg-white/[0.06]"
            >
              CREATE PROJECT
            </button>
          </div>
        </div>

        {/* 4 Large KPI Metric Cards (Swiss Clean Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="glass-panel p-6 border border-white/10 space-y-2">
            <div className="font-mono text-[10px] text-white/50 tracking-widest uppercase">
              ACTIVE PROJECTS
            </div>
            <div className="text-4xl font-serif text-white tracking-tight">
              {isLoading ? '...' : (dashboardData ? dashboardData.activeProjects : 0)}
            </div>
            <div className="font-mono text-xs text-[#38BDF8]">
              Decentralized models
            </div>
          </div>

          <div className="glass-panel p-6 border border-white/10 space-y-2">
            <div className="font-mono text-[10px] text-white/50 tracking-widest uppercase">
              OPTIMIZATION RUNS
            </div>
            <div className="text-4xl font-serif text-white tracking-tight">
              {isLoading ? '...' : (dashboardData ? dashboardData.optimizationRuns : 0)}
            </div>
            <div className="font-mono text-xs text-[#10B981]">
              Converged iterations
            </div>
          </div>

          <div className="glass-panel p-6 border border-white/10 space-y-2">
            <div className="font-mono text-[10px] text-white/50 tracking-widest uppercase">
              AVERAGE COST REDUCTION
            </div>
            <div className="text-4xl font-serif text-white tracking-tight">
              {isLoading ? '...' : `${dashboardData ? dashboardData.averageCostReductionPct : 31.9}%`}
            </div>
            <div className="font-mono text-xs text-[#10B981] flex items-center space-x-1">
              <span>↓ {dashboardData ? dashboardData.averageCostReductionPct : 31.9}%</span>
              <span className="text-white/40">vs legacy hub</span>
            </div>
          </div>

          <div className="glass-panel p-6 border border-white/10 space-y-2">
            <div className="font-mono text-[10px] text-white/50 tracking-widest uppercase">
              TOTAL DEMAND ANALYZED
            </div>
            <div className="text-4xl font-serif text-white tracking-tight">
              {isLoading ? '...' : (dashboardData ? dashboardData.totalDemandAnalyzed.toLocaleString() : '0')}
            </div>
            <div className="font-mono text-xs text-[#D4A373]">
              Daily customer orders
            </div>
          </div>

        </div>

        {/* Recent Optimizations Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <div className="font-mono text-xs text-[#D4A373] tracking-widest uppercase">
                PORTFOLIO
              </div>
              <h3 className="font-serif text-2xl text-white mt-0.5">
                Recent Optimizations
              </h3>
            </div>

            <span className="font-mono text-xs text-white/40">
              {dashboardData && dashboardData.recentProjects ? `${dashboardData.recentProjects.length} Projects Saved` : '0 Projects'}
            </span>
          </div>

          {/* Project List */}
          {isLoading ? (
            <div className="p-12 text-center font-mono text-xs text-white/40">
              LOADING RECENT OPTIMIZATIONS...
            </div>
          ) : !dashboardData || dashboardData.recentProjects.length === 0 ? (
            <div className="glass-panel p-12 text-center border border-white/10 space-y-4">
              <div className="w-10 h-10 mx-auto border border-[#D4A373]/40 bg-[#D4A373]/10 rotate-45 flex items-center justify-center">
                <span className="font-mono text-sm text-[#D4A373] -rotate-45">✦</span>
              </div>
              <div className="font-serif text-2xl text-white">No Optimization Projects Yet</div>
              <p className="text-xs text-[#8E96A4] max-w-md mx-auto">
                Create your first project to ingest neighborhood coordinates, run continuous Fermat-Weber clustering, and discover the optimal warehouse layout.
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-6 py-3 bg-[#D4A373] text-[#090B0E] font-mono text-xs font-semibold uppercase tracking-wider hover:bg-[#E29578] transition-all shadow-lg shadow-[#D4A373]/20"
              >
                + CREATE FIRST PROJECT
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.recentProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="glass-panel p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="w-2 h-2 rounded-full bg-[#D4A373]"></span>
                      <h4 className="font-serif text-xl text-white font-medium">
                        {proj.name}
                      </h4>
                      {proj.latestWarehouses ? (
                        <span className="px-2 py-0.5 bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-mono text-[10px] font-semibold">
                          {proj.latestWarehouses} HUBS OPTIMAL
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-white/10 text-white/60 font-mono text-[10px]">
                          READY TO OPTIMIZE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8E96A4] font-light max-w-2xl line-clamp-1">
                      {proj.description || 'Enterprise logistics footprint analysis across metropolitan micro-markets.'}
                    </p>
                  </div>

                  {/* Project Metric Highlights */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 font-mono text-xs border-y lg:border-y-0 lg:border-x border-white/10 py-3 lg:py-0 lg:px-6">
                    <div>
                      <div className="text-[10px] text-white/40 uppercase">NEIGHBORHOODS</div>
                      <div className="text-white font-semibold">{proj.neighborhoodCount} nodes</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase">DAILY TRANSIT</div>
                      <div className="text-white font-semibold">{formatInrLakhs(proj.latestDeliveryCost)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase">COST REDUCTION</div>
                      <div className="text-[#10B981] font-semibold">
                        {proj.costReductionPct ? `↓ ${proj.costReductionPct}%` : 'Pending'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase">UPDATED</div>
                      <div className="text-white/60">{proj.updatedAt ? proj.updatedAt.slice(0, 10) : 'Today'}</div>
                    </div>
                  </div>

                  {/* Action Buttons: OPEN, DUPLICATE, DELETE */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onNavigate(`/optimize/${proj.id}`)}
                      className="px-4 py-2 bg-[#D4A373] hover:bg-[#E29578] text-[#090B0E] font-mono text-xs font-semibold tracking-wider uppercase transition-all"
                    >
                      OPEN
                    </button>
                    <button
                      onClick={() => handleDuplicate(proj.id)}
                      className="px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/80 hover:text-white font-mono text-xs tracking-wider transition-all"
                      title="Duplicate Project"
                    >
                      DUPLICATE
                    </button>
                    <button
                      onClick={() => handleDelete(proj.id, proj.name)}
                      className="px-3 py-2 bg-white/[0.04] hover:bg-[#EF4444]/20 border border-white/10 hover:border-[#EF4444]/40 text-white/50 hover:text-[#EF4444] font-mono text-xs tracking-wider transition-all"
                      title="Delete Project"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="px-8 py-4 border-t border-white/[0.06] flex justify-between items-center text-[10px] font-mono text-white/40">
        <div>SHELVO PLATFORM // PERSISTENT LOGISTICS INTELLIGENCE DATABASE</div>
        <div>STRICT USER ROW-LEVEL ISOLATION</div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL: + NEW OPTIMIZATION PROJECT */}
      {/* ========================================================================= */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08090C]/85 backdrop-blur-md p-4">
          <div className="glass-hud p-8 max-w-lg w-full border border-white/15 shadow-2xl space-y-6">
            
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="font-mono text-[10px] text-[#D4A373] tracking-widest uppercase">
                  INITIALIZE WORKSPACE
                </div>
                <h3 className="font-serif text-2xl text-white">
                  + New Optimization Project
                </h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-white/40 hover:text-white font-mono text-xs p-1"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 font-mono text-xs text-[#EF4444]">
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] text-white/60 tracking-wider uppercase">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. South Bangalore Fulfillment Network"
                  className="w-full bg-[#11141B] border border-white/15 focus:border-[#D4A373] px-3.5 py-2 text-sm text-white font-mono placeholder:text-white/20 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] text-white/60 tracking-wider uppercase">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="e.g. Evaluating 2-to-4 facility footprints for 15-minute quick-commerce SLAs."
                  className="w-full bg-[#11141B] border border-white/15 focus:border-[#D4A373] px-3.5 py-2 text-xs text-white font-mono placeholder:text-white/20 outline-none resize-none"
                />
              </div>

              {/* Dataset Selection */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="block font-mono text-[10px] text-white/60 tracking-wider uppercase">
                  Initial Demand Dataset
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDatasetChoice('demo')}
                    className={`p-3 border text-left font-mono text-xs transition-all ${
                      datasetChoice === 'demo'
                        ? 'border-[#D4A373] bg-[#D4A373]/10 text-white'
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">BENGALURU DEMO</div>
                    <div className="text-[10px] text-white/40 mt-0.5">28 Micro-Markets (~11.2k orders)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDatasetChoice('csv')}
                    className={`p-3 border text-left font-mono text-xs transition-all ${
                      datasetChoice === 'csv'
                        ? 'border-[#D4A373] bg-[#D4A373]/10 text-white'
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">UPLOAD CSV</div>
                    <div className="text-[10px] text-white/40 mt-0.5">Custom coordinates & demand</div>
                  </button>
                </div>

                {datasetChoice === 'csv' && (
                  <div className="pt-2">
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(e) => handleModalCSV(e.target.files[0])}
                      className="text-xs font-mono text-white/60 file:mr-3 file:py-1.5 file:px-3 file:border file:border-white/20 file:bg-white/[0.05] file:text-white file:font-mono file:text-xs"
                    />
                    {uploadedNeighborhoods.length > 0 && (
                      <div className="mt-2 text-xs font-mono text-[#10B981]">
                        ✓ {uploadedNeighborhoods.length} neighborhoods parsed from CSV
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2.5 border border-white/15 text-white/60 hover:text-white font-mono text-xs tracking-wider uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2.5 bg-[#D4A373] hover:bg-[#E29578] disabled:bg-white/10 text-[#090B0E] font-semibold font-mono text-xs tracking-widest uppercase transition-all shadow-md shadow-[#D4A373]/20"
                >
                  {isCreating ? 'CREATING...' : 'CREATE PROJECT →'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
