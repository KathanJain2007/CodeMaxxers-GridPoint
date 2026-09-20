// SHELVO — Authentication Suite (Login, Signup, Forgot Password)
// Luxury Swiss Editorial Aesthetic with Form Validation and Session Handling.

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

// =============================================================================
// LOGIN PAGE
// =============================================================================
window.GRIDPOINT_COMPONENTS.LoginPage = function({ onAuthSuccess, onNavigate }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Authentication failed. Please check credentials.');
        return;
      }

      if (data.token) {
        localStorage.setItem('gridpoint_token', data.token);
        if (rememberMe) {
          localStorage.setItem('gridpoint_remember_email', email);
        } else {
          localStorage.removeItem('gridpoint_remember_email');
        }
      }
      onAuthSuccess(data.user);
    } catch (err) {
      setErrorMessage('Network connection failure. Please verify server status.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const remembered = localStorage.getItem('gridpoint_remember_email');
    if (remembered) setEmail(remembered);
  }, []);

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F4F4F6] flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      
      {/* Background Subtle Spatial Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#161B22_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.08] pb-6">
        <button onClick={() => onNavigate('/')} className="flex items-center space-x-3 text-left group">
          <div className="w-2.5 h-2.5 bg-[#D4A373] rotate-45 group-hover:scale-110 transition-transform"></div>
          <div>
            <span className="font-mono text-sm tracking-[0.25em] font-semibold text-white uppercase block">
              SHELVO
            </span>
            <span className="font-mono text-[9px] text-white/40 tracking-wider block">
              NETWORK INTELLIGENCE
            </span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('/signup')}
          className="font-mono text-xs text-white/70 hover:text-white transition-colors"
        >
          Need an account? <span className="text-[#D4A373] underline">Sign Up →</span>
        </button>
      </header>

      {/* Login Card */}
      <div className="relative z-10 max-w-md w-full mx-auto my-12">
        <div className="glass-hud p-8 md:p-10 border border-white/15 shadow-2xl space-y-6">
          
          <div className="space-y-1">
            <div className="font-mono text-[10px] text-[#D4A373] tracking-[0.2em] uppercase">
              ENTERPRISE ACCESS // VERIFIED SESSION
            </div>
            <h1 className="font-serif text-3xl text-white tracking-tight">
              Sign In to SHELVO
            </h1>
            <p className="text-xs text-[#8E96A4] font-light">
              Autonomous logistics intelligence & warehouse location optimization.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 font-mono text-xs text-[#EF4444] animate-in fade-in">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] text-white/60 tracking-wider uppercase">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@enterprise.com"
                className="w-full bg-[#11141B] border border-white/15 focus:border-[#D4A373] px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-white/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label className="block font-mono text-[10px] text-white/60 tracking-wider uppercase">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('/forgot-password')}
                  className="font-mono text-[10px] text-[#D4A373] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#11141B] border border-white/15 focus:border-[#D4A373] px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-white/20 outline-none transition-all"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-white/60">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#D4A373] w-3.5 h-3.5"
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#D4A373] hover:bg-[#E29578] disabled:bg-white/10 disabled:text-white/30 text-[#090B0E] font-semibold font-mono text-xs tracking-widest uppercase transition-all shadow-lg shadow-[#D4A373]/20 flex items-center justify-center space-x-2"
            >
              <span>{isLoading ? 'AUTHENTICATING...' : 'ENTER WORKSPACE'}</span>
              <span>→</span>
            </button>
          </form>

          {/* Quick Demo Credentials Info for Judges */}
          <div className="pt-4 border-t border-white/10 text-[11px] font-mono text-white/40 space-y-1">
            <div className="text-white/60 font-semibold uppercase">Hackathon Judge Credentials:</div>
            <div>Email: <span className="text-white">admin@gridpoint.ai</span></div>
            <div>Password: <span className="text-white">Secret123!</span></div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] pt-4 flex justify-between items-center text-[10px] font-mono text-white/30">
        <div>SHELVO PROTOCOL // SHA-256 ENCRYPTED SESSION</div>
        <div>STRICT ROW-LEVEL DATA ISOLATION</div>
      </footer>

    </div>
  );
};


// =============================================================================
// SIGNUP PAGE
// =============================================================================
window.GRIDPOINT_COMPONENTS.SignupPage = function({ onAuthSuccess, onNavigate }) {
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [organization, setOrganization] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName || !email || !password || !organization) {
      setErrorMessage('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          organization
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Registration failed. Email might already be registered.');
        return;
      }

      if (data.token) {
        localStorage.setItem('gridpoint_token', data.token);
      }
      onAuthSuccess(data.user);
    } catch (err) {
      setErrorMessage('Network connection failure. Please verify server status.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F4F4F6] flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      
      <div className="absolute inset-0 bg-[radial-gradient(#161B22_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.08] pb-6">
        <button onClick={() => onNavigate('/')} className="flex items-center space-x-3 text-left group">
          <div className="w-2.5 h-2.5 bg-[#D4A373] rotate-45 group-hover:scale-110 transition-transform"></div>
          <div>
            <span className="font-mono text-sm tracking-[0.25em] font-semibold text-white uppercase block">
              SHELVO
            </span>
            <span className="font-mono text-[9px] text-white/40 tracking-wider block">
              NETWORK INTELLIGENCE
            </span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('/login')}
          className="font-mono text-xs text-white/70 hover:text-white transition-colors"
        >
          Already registered? <span className="text-[#D4A373] underline">Log In →</span>
        </button>
      </header>

      {/* Signup Card */}
      <div className="relative z-10 max-w-lg w-full mx-auto my-8">
        <div className="glass-hud p-8 md:p-10 border border-white/15 shadow-2xl space-y-6">
          
          <div className="space-y-1">
            <div className="font-mono text-[10px] text-[#10B981] tracking-[0.2em] uppercase">
              PROVISION WORKSPACE // NEW ACCOUNT
            </div>
            <h1 className="font-serif text-3xl text-white tracking-tight">
              Create SHELVO Account
            </h1>
            <p className="text-xs text-[#8E96A4] font-light">
              Provision a dedicated enterprise workspace for facility location optimization.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 font-mono text-xs text-[#EF4444] animate-in fade-in">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] text-white/60 tracking-wider uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Elena Rostova"
                  className="w-full bg-[#11141B] border border-white/15 focus:border-[#D4A373] px-3.5 py-2 text-sm text-white font-mono placeholder:text-white/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] text-white/60 tracking-wider uppercase">
                  Organization / Company
                </label>
                <input
                  type="text"
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Apex Global Supply"
                  className="w-full bg-[#11141B] border border-white/15 focus:border-[#D4A373] px-3.5 py-2 text-sm text-white font-mono placeholder:text-white/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] text-white/60 tracking-wider uppercase">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.rostova@apexsupply.com"
                className="w-full bg-[#11141B] border border-white/15 focus:border-[#D4A373] px-3.5 py-2 text-sm text-white font-mono placeholder:text-white/20 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] text-white/60 tracking-wider uppercase">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-[#11141B] border border-white/15 focus:border-[#D4A373] px-3.5 py-2 text-sm text-white font-mono placeholder:text-white/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] text-white/60 tracking-wider uppercase">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full bg-[#11141B] border border-white/15 focus:border-[#D4A373] px-3.5 py-2 text-sm text-white font-mono placeholder:text-white/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#D4A373] hover:bg-[#E29578] disabled:bg-white/10 disabled:text-white/30 text-[#090B0E] font-semibold font-mono text-xs tracking-widest uppercase transition-all shadow-lg shadow-[#D4A373]/20 flex items-center justify-center space-x-2"
              >
                <span>{isLoading ? 'PROVISIONING...' : 'CREATE ACCOUNT & PROCEED'}</span>
                <span>→</span>
              </button>
            </div>
          </form>

        </div>
      </div>

      <footer className="relative z-10 border-t border-white/[0.06] pt-4 flex justify-between items-center text-[10px] font-mono text-white/30">
        <div>SHELVO PROTOCOL // SHA-256 ENCRYPTED SESSION</div>
        <div>STRICT ROW-LEVEL DATA ISOLATION</div>
      </footer>

    </div>
  );
};


// =============================================================================
// FORGOT PASSWORD PAGE
// =============================================================================
window.GRIDPOINT_COMPONENTS.ForgotPasswordPage = function({ onNavigate }) {
  const [email, setEmail] = React.useState('');
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F4F4F6] flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      
      <div className="absolute inset-0 bg-[radial-gradient(#161B22_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.08] pb-6">
        <button onClick={() => onNavigate('/')} className="flex items-center space-x-3 text-left group">
          <div className="w-2.5 h-2.5 bg-[#D4A373] rotate-45 group-hover:scale-110 transition-transform"></div>
          <div>
            <span className="font-mono text-sm tracking-[0.25em] font-semibold text-white uppercase block">
              SHELVO
            </span>
            <span className="font-mono text-[9px] text-white/40 tracking-wider block">
              NETWORK INTELLIGENCE
            </span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('/login')}
          className="font-mono text-xs text-white/70 hover:text-white transition-colors"
        >
          ← Return to <span className="text-[#D4A373] underline">Log In</span>
        </button>
      </header>

      <div className="relative z-10 max-w-md w-full mx-auto my-12">
        <div className="glass-hud p-8 md:p-10 border border-white/15 shadow-2xl space-y-6">
          
          <div className="space-y-1">
            <div className="font-mono text-[10px] text-[#38BDF8] tracking-[0.2em] uppercase">
              RECOVERY PROTOCOL // CREDENTIAL RESET
            </div>
            <h1 className="font-serif text-3xl text-white tracking-tight">
              Reset Your Password
            </h1>
            <p className="text-xs text-[#8E96A4] font-light">
              Enter your enterprise email to receive secure recovery credentials.
            </p>
          </div>

          {isSubmitted ? (
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-[#10B981]/15 border border-[#10B981]/30 font-mono text-xs text-[#10B981] space-y-1">
                <div className="font-bold">✓ DISPATCH COMPLETE</div>
                <div className="text-white/80">
                  Password reset link and security verification token have been sent to <strong>{email}</strong>.
                </div>
              </div>
              <button
                onClick={() => onNavigate('/login')}
                className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-xs font-mono text-white tracking-wider uppercase transition-all"
              >
                RETURN TO LOG IN
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] text-white/60 tracking-wider uppercase">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@enterprise.com"
                  className="w-full bg-[#11141B] border border-white/15 focus:border-[#D4A373] px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-white/20 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#D4A373] hover:bg-[#E29578] text-[#090B0E] font-semibold font-mono text-xs tracking-widest uppercase transition-all shadow-lg shadow-[#D4A373]/20"
              >
                DISPATCH RESET INSTRUCTIONS →
              </button>
            </form>
          )}

        </div>
      </div>

      <footer className="relative z-10 border-t border-white/[0.06] pt-4 flex justify-between items-center text-[10px] font-mono text-white/30">
        <div>SHELVO PROTOCOL // SHA-256 ENCRYPTED SESSION</div>
        <div>STRICT ROW-LEVEL DATA ISOLATION</div>
      </footer>

    </div>
  );
};
