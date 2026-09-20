// GRIDPOINT — Main Application Orchestrator & Client-Side Router
// Enforces protected routes, persistent database sessions, project loading, and full optimization flows.

(function() {
  const { useState, useEffect, useMemo } = React;

  function App() {
    // Current route path: '/', '/login', '/signup', '/forgot-password', '/dashboard', '/optimize/:id', '/analytics', '/profile'
    const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
    const [user, setUser] = useState(null);
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    // Active project and optimization state
    const [activeProject, setActiveProject] = useState(null);
    const [neighborhoods, setNeighborhoods] = useState(window.GRIDPOINT_DATA.BENGALURU_DEMO_DATA);
    const [optimizationResult, setOptimizationResult] = useState(null);
    const [baselineMetrics, setBaselineMetrics] = useState(null);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [isOptimizing, setIsOptimizing] = useState(false);

    // Modals in Workspace
    const [showImport, setShowImport] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [showScenarios, setShowScenarios] = useState(false);
    const [showDemandShock, setShowDemandShock] = useState(false);
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
    const [showTransparency, setShowTransparency] = useState(false);
    const [transparencyWarehouse, setTransparencyWarehouse] = useState(null);
    const [showReport, setShowReport] = useState(false);

    // Navigation helper
    const navigate = (path) => {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo(0, 0);
    };

    // Listen to browser forward/backward buttons
    useEffect(() => {
      const handlePopState = () => {
        setCurrentPath(window.location.pathname || '/');
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Check user authentication session on mount
    useEffect(() => {
      const verifyAuth = async () => {
        const token = localStorage.getItem('gridpoint_token');
        if (!token) {
          setIsAuthChecking(false);
          return;
        }

        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            localStorage.removeItem('gridpoint_token');
            setUser(null);
          }
        } catch (err) {
          console.error('Session verification error:', err);
        } finally {
          setIsAuthChecking(false);
        }
      };
      verifyAuth();
    }, []);

    // Route Protection: Redirect unauthenticated users from protected routes to /login
    useEffect(() => {
      if (isAuthChecking) return;

      const protectedPrefixes = ['/dashboard', '/optimize', '/network', '/scenarios', '/analytics', '/profile', '/settings'];
      const isProtected = protectedPrefixes.some(p => currentPath === p || currentPath.startsWith(p + '/'));

      if (!user && isProtected) {
        navigate('/login');
      }

      // If user is logged in and visits /login or /signup, redirect to /dashboard
      if (user && (currentPath === '/login' || currentPath === '/signup')) {
        navigate('/dashboard');
      }
    }, [currentPath, user, isAuthChecking]);

    // Handle project loading when route is /optimize/:projectId
    useEffect(() => {
      if (currentPath.startsWith('/optimize/')) {
        const projectId = currentPath.replace('/optimize/', '').split('/')[0];
        if (projectId && user) {
          const fetchProject = async () => {
            try {
              const token = localStorage.getItem('gridpoint_token');
              const res = await fetch(`/api/projects/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                const data = await res.json();
                setActiveProject(data.project);
                if (data.project.neighborhoods && data.project.neighborhoods.length > 0) {
                  setNeighborhoods(data.project.neighborhoods);
                }
                if (data.project.latestRun) {
                  setOptimizationResult({
                    k: data.project.latestRun.warehouseCount,
                    warehouses: data.project.latestRun.warehouses,
                    assignments: data.project.latestRun.assignments,
                    metrics: data.project.latestRun.metrics
                  });
                } else if (data.project.neighborhoods && data.project.neighborhoods.length > 0) {
                  const defaultRes = window.GRIDPOINT_ALGO.optimizeLocations(data.project.neighborhoods, { warehouseCount: 3 });
                  setOptimizationResult(defaultRes);
                } else {
                  setOptimizationResult(null);
                }
              }
            } catch (err) {
              console.error('Failed to load project details:', err);
            }
          };
          fetchProject();
        }
      }
    }, [currentPath, user]);

    // Compute baseline metrics whenever neighborhoods change
    useEffect(() => {
      if (neighborhoods && neighborhoods.length > 0) {
        const base = window.GRIDPOINT_ALGO.evaluateBaseline(
          neighborhoods,
          window.GRIDPOINT_DATA.LEGACY_BASELINE.warehouse
        );
        setBaselineMetrics(base);
      }
    }, [neighborhoods]);

    // Handle Authentication Success
    const handleAuthSuccess = (authUser) => {
      setUser(authUser);
      navigate('/dashboard');
    };

    // Handle Logout
    const handleLogout = async () => {
      try {
        const token = localStorage.getItem('gridpoint_token');
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        // ignore
      } finally {
        localStorage.removeItem('gridpoint_token');
        setUser(null);
        navigate('/login');
      }
    };

    // Run Optimization Workflow (sends to backend /api/projects/:id/optimize to persist)
    const handleRunOptimization = async (options = {}) => {
      setSelectedWarehouse(null);

      const projectId = activeProject ? activeProject.id : null;
      const token = localStorage.getItem('gridpoint_token');

      // Instant mode: when user increments/decrements warehouse count or adjusts options
      if (options.instant) {
        try {
          const result = window.GRIDPOINT_ALGO.optimizeLocations(neighborhoods, options);
          setOptimizationResult(result);
        } catch (err) {
          console.error('Instant optimization calculation failed:', err);
        }

        // Silently persist to backend in background if project exists
        if (projectId && token) {
          fetch(`/api/projects/${projectId}/optimize`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              warehouseCount: options.k || 3,
              capacity: options.maxCapacity,
              serviceRadius: options.maxRadius,
              objective: options.objective,
              neighborhoods: neighborhoods
            })
          }).catch(e => console.error('Silent persist error:', e));
        }
        return;
      }

      // Explicit "RUN OPTIMIZATION" button flow: with 5-stage animation modal
      setIsOptimizing(true);

      // If in a project, send to persistent backend API
      if (projectId && token) {
        try {
          const res = await fetch(`/api/projects/${projectId}/optimize`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              warehouseCount: options.k || 3,
              capacity: options.maxCapacity,
              serviceRadius: options.maxRadius,
              objective: options.objective,
              neighborhoods: neighborhoods
            })
          });
          const data = await res.json();
          if (res.ok) {
            // Smooth delay matching the 5-step animation
            setTimeout(() => {
              setOptimizationResult({
                k: options.k || 3,
                warehouses: data.warehouses,
                assignments: data.assignments,
                metrics: data.metrics
              });
              setIsOptimizing(false);
            }, 2350);
            return;
          }
        } catch (err) {
          console.error('Backend optimization error:', err);
        }
      }

      // Fallback: Client-side Weiszfeld calculation
      setTimeout(() => {
        try {
          const result = window.GRIDPOINT_ALGO.optimizeLocations(neighborhoods, options);
          setOptimizationResult(result);
        } catch (err) {
          console.error('Client optimization failed:', err);
        } finally {
          setIsOptimizing(false);
        }
      }, 2350);
    };

    // Open transparency modal for a warehouse
    const handleOpenTransparency = (wh) => {
      setTransparencyWarehouse(wh || (optimizationResult && optimizationResult.warehouses[0]));
      setShowTransparency(true);
    };

    // Apply scenario directly to map
    const handleApplyScenario = (solution) => {
      setOptimizationResult(solution);
      setSelectedWarehouse(null);
    };

    // Save newly imported data to database for this project
    const handleSaveImportedData = async (newData) => {
      setNeighborhoods(newData);
      setOptimizationResult(null);

      const projectId = activeProject ? activeProject.id : null;
      const token = localStorage.getItem('gridpoint_token');
      if (projectId && token) {
        try {
          await fetch(`/api/projects/${projectId}/datasets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: 'Updated Demand Data',
              neighborhoods: newData
            })
          });
        } catch (err) {
          console.error('Failed to save dataset to database:', err);
        }
      }
    };

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setShowImport(false);
          setShowComparison(false);
          setShowScenarios(false);
          setShowDemandShock(false);
          setShowAnalyticsModal(false);
          setShowTransparency(false);
          setShowReport(false);
          setSelectedWarehouse(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Loading Splash during session verification
    if (isAuthChecking) {
      return (
        <div className="min-h-screen bg-[#08090C] text-[#F4F4F6] flex items-center justify-center font-mono text-xs text-[#D4A373]">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 bg-[#D4A373] rotate-45 animate-spin"></div>
            <span>INITIALIZING GRIDPOINT SECURITY PROTOCOL...</span>
          </div>
        </div>
      );
    }

    // =========================================================================
    // ROUTE ROUTER
    // =========================================================================

    // 1. Landing Page (/)
    if (currentPath === '/') {
      return (
        <window.GRIDPOINT_COMPONENTS.LandingPage
          onStartOptimization={() => navigate(user ? '/dashboard' : '/login')}
          onLoadDemo={() => {
            if (user) {
              navigate('/dashboard');
            } else {
              navigate('/login');
            }
          }}
        />
      );
    }

    // 2. Authentication Pages
    if (currentPath === '/login') {
      return (
        <window.GRIDPOINT_COMPONENTS.LoginPage
          onAuthSuccess={handleAuthSuccess}
          onNavigate={navigate}
        />
      );
    }

    if (currentPath === '/signup') {
      return (
        <window.GRIDPOINT_COMPONENTS.SignupPage
          onAuthSuccess={handleAuthSuccess}
          onNavigate={navigate}
        />
      );
    }

    if (currentPath === '/forgot-password') {
      return (
        <window.GRIDPOINT_COMPONENTS.ForgotPasswordPage
          onNavigate={navigate}
        />
      );
    }

    // 3. User Profile & Settings (/profile or /settings)
    if (currentPath === '/profile' || currentPath === '/settings') {
      return (
        <window.GRIDPOINT_COMPONENTS.UserProfile
          user={user}
          onUserUpdate={setUser}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      );
    }

    // 4. Analytics Page (/analytics)
    if (currentPath === '/analytics') {
      return (
        <window.GRIDPOINT_COMPONENTS.AnalyticsView
          neighborhoods={neighborhoods}
          optimizationResult={optimizationResult}
          baselineMetrics={baselineMetrics}
          onClose={() => navigate('/dashboard')}
          onNavigateDashboard={() => navigate('/dashboard')}
        />
      );
    }

    // 5. Dashboard (/dashboard)
    if (currentPath === '/dashboard') {
      return (
        <window.GRIDPOINT_COMPONENTS.Dashboard
          user={user}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      );
    }

    // 6. Optimization Workspace (/optimize/:projectId or /optimize)
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#08090C]">
        
        {/* Main Workspace */}
        <window.GRIDPOINT_COMPONENTS.Workspace
          neighborhoods={neighborhoods}
          optimizationResult={optimizationResult}
          baselineMetrics={baselineMetrics}
          selectedWarehouse={selectedWarehouse}
          onSelectWarehouse={setSelectedWarehouse}
          onRunOptimization={handleRunOptimization}
          isOptimizing={isOptimizing}
          onOpenImport={() => setShowImport(true)}
          onOpenComparison={() => setShowComparison(true)}
          onOpenScenarios={() => setShowScenarios(true)}
          onOpenDemandShock={() => setShowDemandShock(true)}
          onOpenAnalytics={() => setShowAnalyticsModal(true)}
          onOpenTransparency={handleOpenTransparency}
          onOpenReport={() => setShowReport(true)}
          onReturnToHome={() => navigate('/dashboard')}
          projectName={activeProject ? activeProject.name : null}
          onNavigateDashboard={() => navigate('/dashboard')}
        />

        {/* 5-Stage Optimization Running Animation & WOW Result Modal */}
        <window.GRIDPOINT_COMPONENTS.OptimizationAnimation
          isOptimizing={isOptimizing}
          optimizationResult={optimizationResult}
          baselineMetrics={baselineMetrics}
          onDismiss={() => {}}
          onOpenComparison={() => setShowComparison(true)}
        />

        {/* Top-Level High-Priority Modal Layer (Strictly elevated above Map & HUD, z-index: 2000) */}
        <div className="modals-layer relative" style={{ zIndex: 2000 }}>
          {/* MODAL 1: Before vs After Split Comparison */}
          {showComparison && (
            <window.GRIDPOINT_COMPONENTS.BeforeAfterComparison
              neighborhoods={neighborhoods}
              optimizationResult={optimizationResult}
              baselineMetrics={baselineMetrics}
              onClose={() => setShowComparison(false)}
            />
          )}

          {/* MODAL 2: Scenario Lab (1 to 5 Warehouses Trade-off) */}
          {showScenarios && (
            <window.GRIDPOINT_COMPONENTS.ScenarioLab
              neighborhoods={neighborhoods}
              onApplyScenario={handleApplyScenario}
              onClose={() => setShowScenarios(false)}
            />
          )}

          {/* MODAL 3: Demand Shock Simulator */}
          {showDemandShock && (
            <window.GRIDPOINT_COMPONENTS.DemandShock
              optimizationResult={optimizationResult}
              onClose={() => setShowDemandShock(false)}
            />
          )}

          {/* MODAL 4: Analytics Dossier */}
          {showAnalyticsModal && (
            <window.GRIDPOINT_COMPONENTS.AnalyticsView
              neighborhoods={neighborhoods}
              optimizationResult={optimizationResult}
              baselineMetrics={baselineMetrics}
              onClose={() => setShowAnalyticsModal(false)}
            />
          )}

          {/* MODAL 5: Algorithm Transparency ("Why this location?") */}
          {showTransparency && (
            <window.GRIDPOINT_COMPONENTS.AlgorithmTransparency
              warehouse={transparencyWarehouse || (optimizationResult && optimizationResult.warehouses[0])}
              neighborhoods={neighborhoods}
              onClose={() => setShowTransparency(false)}
            />
          )}

          {/* MODAL 6: Data Import (CSV Upload / Manual Entry) */}
          {showImport && (
            <window.GRIDPOINT_COMPONENTS.DataImportModal
              currentData={neighborhoods}
              onSaveData={handleSaveImportedData}
              onLoadDemo={() => {
                handleSaveImportedData(window.GRIDPOINT_DATA.BENGALURU_DEMO_DATA);
              }}
              onClose={() => setShowImport(false)}
            />
          )}

          {/* MODAL 7: Executive Report (Printable PDF Dossier) */}
          {showReport && (
            <window.GRIDPOINT_COMPONENTS.ExecutiveReportModal
              neighborhoods={neighborhoods}
              optimizationResult={optimizationResult}
              baselineMetrics={baselineMetrics}
              onClose={() => setShowReport(false)}
            />
          )}
        </div>

      </div>
    );
  }

  // Mount React Root
  const container = document.getElementById('root');
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(App));
  }
})();
