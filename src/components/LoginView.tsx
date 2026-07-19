import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Building2,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { User } from '../types';

interface LoginViewProps {
  appName: string;
  logoLight: string;
  logoDark: string;
  footerText: string;
  availableUsers: User[];
  onLoginSuccess: (user: User) => void;
}

export default function LoginView({
  appName,
  logoLight,
  logoDark,
  footerText,
  availableUsers,
  onLoginSuccess,
}: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'credentials' | 'demo'>('credentials');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Please enter your corporate email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your secure access password.');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('Passwords must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);

    // Simulate network authentication delay
    setTimeout(() => {
      const matchedUser = availableUsers.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (matchedUser) {
        if (matchedUser.status === 'inactive') {
          setErrorMsg('This employee account is currently deactivated in ERP settings.');
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        onLoginSuccess(matchedUser);
      } else {
        // Fallback: Check if they want to sign in as a dynamic new user
        // But for ERP strict security, let's suggest selecting a real corporate role
        setErrorMsg('Corporate email address not recognized in the Wafaq ERP directory.');
        setIsLoading(false);
      }
    }, 1200);
  };

  const handleDemoLogin = (user: User) => {
    setIsLoading(true);
    setErrorMsg('');
    setEmail(user.email);
    setPassword('••••••••');
    
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(user);
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-950 text-slate-100 relative overflow-hidden select-none font-sans">
      
      {/* Abstract Grid Background & Ambient Lighting */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"></div>
      
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none"></div>

      {/* Top Header / Branding Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-3">
          {logoDark ? (
            <img 
              src={logoDark} 
              alt={appName} 
              className="h-9 max-h-9 object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-lg flex items-center justify-center font-black text-xl shadow-md">
              {appName ? appName[0].toUpperCase() : 'W'}
            </div>
          )}
          <div className="hidden sm:block">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold">Secure Core Gateway</span>
            <div className="text-slate-400 text-[10px] -mt-1 font-medium">Enterprise Suite v2.1</div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span className="font-mono">SSL Secure Connection</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex items-center justify-center p-4 relative z-10 my-4">
        <div className="w-full max-w-[500px]">
          
          {/* Main Login Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl p-6 sm:p-8 relative"
          >
            {/* Top decorative gradient border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-emerald-500 to-indigo-500 rounded-t-2xl"></div>

            {/* Application Branding Info */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-white mb-1 font-sans">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-emerald-400 to-indigo-300">{appName}</span>
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
                Authorized Engineering & Contracting Resource Planning Portal
              </p>
            </div>

            {/* Toggle Tabs (Manual Credentials vs. Quick Demo) */}
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
              <button
                onClick={() => { setActiveTab('credentials'); setErrorMsg(''); }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'credentials'
                    ? 'bg-slate-900 text-white shadow-xs border border-slate-800/80'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In Credentials
              </button>
              <button
                onClick={() => { setActiveTab('demo'); setErrorMsg(''); }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'demo'
                    ? 'bg-slate-900 text-white shadow-xs border border-slate-800/80'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quick Role Demo</span>
              </button>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs mb-5 font-medium flex items-start space-x-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 animate-ping"></div>
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {/* Tab 1: Manual Credentials Form */}
            {activeTab === 'credentials' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider font-mono">
                    Corporate Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. tariq@wafaq.com"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                      Access Password
                    </label>
                    <a href="#" onClick={(e) => { e.preventDefault(); setErrorMsg("Password reset must be requested from the Corporate Admin Department."); }} className="text-[10px] text-indigo-400 hover:underline">
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-400 font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer accent-indigo-600"
                    />
                    <span>Remember this station</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Active IP Verified
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white text-xs font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center space-x-2 transition-all mt-4 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="font-mono">Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In Securely</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Tab 2: Quick Demo Accounts List */}
            {activeTab === 'demo' && (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                  Select any of the <strong>pre-seeded enterprise accounts</strong> to sign in instantly with specific role permissions:
                </p>

                <div className="grid grid-cols-1 gap-2">
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleDemoLogin(user)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-900 hover:border-slate-700 transition group/item text-left cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white group-hover/item:text-indigo-400 transition truncate">
                            {user.name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 truncate">
                            <span className="font-medium px-1.5 py-0.2 bg-slate-800 rounded text-slate-300 font-mono scale-90 origin-left">
                              {user.role}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              ({user.email})
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center group-hover/item:bg-indigo-600 group-hover/item:border-indigo-500 transition-all shrink-0">
                        <UserCheck className="w-3 h-3 text-slate-400 group-hover/item:text-white transition" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Extra Disclaimer for security */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-center space-x-2 text-[10px] text-slate-500 font-mono">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span>AES-256 System Encryption Enabled</span>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Corporate footer */}
      <footer className="w-full text-center py-6 px-6 relative z-10 text-[11px] text-slate-500 border-t border-slate-900 bg-slate-950/90 font-mono flex flex-col space-y-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
          <span>{footerText}</span>
          <div className="flex space-x-4">
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-slate-300 transition-colors">Information Security Policy</a>
            <span>•</span>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-slate-300 transition-colors">ERP Terms of Service</a>
          </div>
        </div>
        
        {/* Developer Info */}
        <div className="max-w-7xl mx-auto pt-3 border-t border-slate-800/50 w-full">
          <div className="text-[10px] text-slate-400 font-mono space-y-1">
            <p className="font-bold text-slate-300">Developed and Designed by: Mohammad iftekhairul alam</p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span>FB: fb.com/fyslbd</span>
              <span>Whatsapp: @fyslbd</span>
              <span>Mobile: +966557916317</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
