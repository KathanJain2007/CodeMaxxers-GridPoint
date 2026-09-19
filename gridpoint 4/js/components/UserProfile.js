// GRIDPOINT — User Profile & Settings Component
// Allows viewing and updating user full name, organization, account creation date, and logout.

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

window.GRIDPOINT_COMPONENTS.UserProfile = function({
  user,
  onUserUpdate,
  onNavigate,
  onLogout
}) {
  const [fullName, setFullName] = React.useState(user ? user.fullName : '');
  const [organization, setOrganization] = React.useState(user ? user.organization : '');
  const [statusMessage, setStatusMessage] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setOrganization(user.organization);
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('gridpoint_token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, organization })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onUserUpdate(data.user);
        setStatusMessage('Profile updated successfully.');
      } else {
        setStatusMessage(data.error || 'Failed to update profile.');
      }
    } catch (err) {
      setStatusMessage('Network communication error.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F4F4F6] flex flex-col justify-between">
      
      {/* Navigation Header */}
      <header className="px-8 py-5 border-b border-white/[0.08] bg-[#090B0E]/90 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-6">
          <button onClick={() => onNavigate('/dashboard')} className="flex items-center space-x-3 text-left">
            <div className="w-2.5 h-2.5 bg-[#D4A373] rotate-45"></div>
            <div>
              <span className="font-mono text-sm tracking-[0.25em] font-semibold text-white uppercase block">
                GRIDPOINT
              </span>
              <span className="font-mono text-[9px] text-white/40 tracking-wider block">
                NETWORK INTELLIGENCE
              </span>
            </div>
          </button>

          <nav className="hidden md:flex items-center space-x-6 font-mono text-xs text-white/60">
            <button onClick={() => onNavigate('/dashboard')} className="hover:text-white transition-colors">
              DASHBOARD
            </button>
            <button onClick={() => onNavigate('/analytics')} className="hover:text-white transition-colors">
              ANALYTICS
            </button>
            <button onClick={() => onNavigate('/profile')} className="text-[#D4A373] font-semibold">
              SETTINGS
            </button>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="px-4 py-2 border border-white/20 text-xs font-mono text-white/80 hover:text-white transition-all bg-white/[0.02]"
          >
            ← BACK TO DASHBOARD
          </button>
        </div>
      </header>

      {/* Profile Form */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-8 md:p-12 space-y-8 my-auto">
        
        <div className="space-y-2 border-b border-white/[0.08] pb-6">
          <div className="font-mono text-[10px] text-[#D4A373] tracking-widest uppercase">
            ACCOUNT PREFERENCES // SECURE PROFILE
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-white tracking-tight">
            User Profile & Credentials
          </h1>
          <p className="text-xs text-[#8E96A4] font-light">
            Manage your verified identity, enterprise organization affiliation, and persistent active sessions.
          </p>
        </div>

        {statusMessage && (
          <div className="p-3 bg-[#10B981]/15 border border-[#10B981]/30 font-mono text-xs text-[#10B981]">
            ✓ {statusMessage}
          </div>
        )}

        <div className="glass-panel p-8 border border-white/10 space-y-6">
          
          <form onSubmit={handleUpdate} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] text-white/60 tracking-wider uppercase">
                Work Email (Immutable ID)
              </label>
              <input
                type="text"
                disabled
                value={user ? user.email : 'analyst@enterprise.com'}
                className="w-full bg-[#11141B]/50 border border-white/10 px-3.5 py-2.5 text-sm text-white/50 font-mono outline-none cursor-not-allowed"
              />
              <div className="text-[10px] font-mono text-white/30">
                Email address cannot be modified once provisioned for cryptographic row-level isolation.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] text-white/60 tracking-wider uppercase">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#11141B] border border-white/15 focus:border-[#D4A373] px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-white/20 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] text-white/60 tracking-wider uppercase">
                Organization / Company Name
              </label>
              <input
                type="text"
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full bg-[#11141B] border border-white/15 focus:border-[#D4A373] px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-white/20 outline-none"
              />
            </div>

            <div className="flex justify-between items-center pt-2 font-mono text-xs text-white/40">
              <div>ACCOUNT CREATED:</div>
              <div className="text-white">{user ? user.createdAt ? user.createdAt.slice(0, 10) : '2026-09-19' : '2026-09-19'}</div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-3 bg-[#D4A373] hover:bg-[#E29578] disabled:bg-white/10 text-[#090B0E] font-semibold font-mono text-xs tracking-widest uppercase transition-all shadow-md shadow-[#D4A373]/20"
              >
                {isUpdating ? 'SAVING...' : 'SAVE CHANGES'}
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="px-6 py-3 border border-[#EF4444]/30 hover:border-[#EF4444] text-[#EF4444] font-mono text-xs tracking-widest uppercase transition-all bg-[#EF4444]/[0.02] hover:bg-[#EF4444]/10"
              >
                LOGOUT SESSION ⏻
              </button>
            </div>

          </form>

        </div>

      </main>

      {/* Footer */}
      <footer className="px-8 py-4 border-t border-white/[0.06] flex justify-between items-center text-[10px] font-mono text-white/40">
        <div>GRIDPOINT PROTOCOL // SHA-256 ENCRYPTED SESSION</div>
        <div>STRICT USER ROW-LEVEL ISOLATION</div>
      </footer>

    </div>
  );
};
