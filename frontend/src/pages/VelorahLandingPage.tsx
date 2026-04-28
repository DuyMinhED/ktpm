import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { authApi } from '../api/auth';

const VelorahLandingPage = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.login({ email: identifier, password });

      if (!response.success) {
        setError(response.message || 'Đăng nhập không thành công');
        setIsLoading(false);
        return;
      }

      const { accessToken, role, clinicId, id } = response.data;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userId', id.toString());
      if (clinicId) localStorage.setItem('clinicId', clinicId.toString());

      if (role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else if (role === 'ROLE_DOCTOR') {
        navigate('/doctor');
      } else if (role === 'ROLE_CLINIC_MANAGER') {
        navigate('/clinic');
      } else {
        navigate('/patient');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
      setIsLoading(false);
    }
  };

  return (
    <div className="velorah-theme relative min-h-screen overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500&display=swap');

        .velorah-theme {
          --background: 201 100% 13%;
          --foreground: 0 0% 100%;
          --muted-foreground: 240 4% 66%;
          --primary: 0 0% 100%;
          --primary-foreground: 0 0% 4%;
          --secondary: 0 0% 10%;
          --muted: 0 0% 10%;
          --accent: 0 0% 10%;
          --border: 0 0% 18%;
          --input: 0 0% 18%;
          --font-display: 'Instrument Serif', serif;
          --font-body: 'Inter', sans-serif;
          
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
          font-family: var(--font-body);
        }

        .velorah-theme .font-display {
          font-family: var(--font-display);
        }

        .velorah-theme .text-foreground {
          color: hsl(var(--foreground));
        }

        .velorah-theme .text-muted-foreground {
          color: hsl(var(--muted-foreground));
        }

        .liquid-glass {
          background: rgba(255, 255, 255, 0.01);
          background-blend-mode: luminosity;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        }

        .liquid-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.4px;
          background: linear-gradient(180deg,
            rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%,
            rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
            rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .modal-glass {
          background: rgba(10, 20, 30, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        @keyframes fade-rise {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-rise { animation: fade-rise 0.8s ease-out both; }
        .animate-fade-rise-delay { animation: fade-rise 0.8s ease-out 0.2s both; }
        .animate-fade-rise-delay-2 { animation: fade-rise 0.8s ease-out 0.4s both; }

        @keyframes modal-enter {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-enter { animation: modal-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4" type="video/mp4" />
      </video>

      <div className="relative z-10 flex flex-col min-h-screen w-full">
        {/* Navigation Bar */}
        <nav className="flex flex-row justify-between items-center px-4 md:px-8 py-4 md:py-6 w-full max-w-7xl mx-auto">
          <div
            className="text-2xl md:text-3xl tracking-tight text-foreground font-display cursor-pointer m-0"
            onClick={() => navigate(ROUTES.HOME)}
          >
            Velorah<sup className="text-xs">®</sup>
          </div>

          <div className="hidden md:flex gap-8 items-center">
            <a href="#" className="text-sm text-foreground transition-colors">Home</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 relative group">
              Studio
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
              About
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
              Journal
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
              Reach Us
            </a>
          </div>

          <button
            className="liquid-glass rounded-full px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm text-foreground hover:scale-[1.03] transition-transform duration-300 cursor-pointer"
            onClick={() => setShowLoginModal(true)}
          >
            Begin Journey
          </button>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 md:px-6 pt-16 md:pt-32 pb-20 md:pb-40">
          <h1 className="animate-fade-rise text-3xl sm:text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-[-1px] md:tracking-[-2.46px] max-w-7xl font-normal font-display text-foreground m-0">
            Where <em className="not-italic text-muted-foreground">dreams</em> rise <em className="not-italic text-muted-foreground">through the silence.</em>
          </h1>
          <p className="animate-fade-rise-delay text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mt-4 md:mt-8 leading-relaxed mx-auto px-2">
            We're designing tools for deep thinkers, bold creators, and quiet rebels. Amid the chaos, we build digital spaces for sharp focus and inspired work.
          </p>
          <button
            className="liquid-glass rounded-full px-8 md:px-14 py-3.5 md:py-5 text-sm md:text-base text-foreground mt-8 md:mt-12 hover:scale-[1.03] transition-transform duration-300 cursor-pointer animate-fade-rise-delay-2"
            onClick={() => setShowLoginModal(true)}
          >
            Begin Journey
          </button>
        </main>
      </div>

      {/* Glassmorphic Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-[400px] modal-glass rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 animate-modal-enter">
            {/* Close Button */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8 mt-2">
              <h2 className="text-3xl md:text-4xl font-display text-white mb-2 tracking-tight m-0">Welcome Back</h2>
              <p className="text-sm text-white/50 m-0">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] text-center font-medium animate-modal-enter">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/60 ml-2 uppercase tracking-wider">Identifier</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/30 focus:bg-white/10 transition-all text-[15px]"
                    placeholder="Email or Phone"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/60 ml-2 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-11 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/30 focus:bg-white/10 transition-all text-[15px]"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white/80 transition-colors cursor-pointer focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-2 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer appearance-none w-4 h-4 rounded border border-white/20 bg-white/5 checked:bg-white checked:border-white transition-all cursor-pointer"
                    />
                    <svg className="w-3 h-3 text-black absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-[13px] text-white/50 group-hover:text-white/80 transition-colors pointer-events-none">Remember me</span>
                </label>
                <button type="button" onClick={(e) => { e.preventDefault(); }} className="text-[13px] text-white/50 hover:text-white transition-colors cursor-pointer focus:outline-none">Forgot password?</button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full liquid-glass rounded-2xl py-4 text-[15px] font-medium text-white mt-6 hover:scale-[1.02] transition-transform duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    Sign In
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </form>

            {/* Social Login */}
            <div className="mt-8">
              <div className="relative flex items-center mb-6">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-4 text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Or continue with</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button type="button" className="flex items-center justify-center gap-2 py-3 border border-white/10 rounded-2xl hover:bg-white/5 transition-colors text-[13px] font-medium text-white group">
                  <svg className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#fff" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
                  </svg>
                  Google
                </button>
                <button type="button" className="flex items-center justify-center gap-2 py-3 border border-white/10 rounded-2xl hover:bg-white/5 transition-colors text-[13px] font-medium text-white group">
                  <svg className="w-[18px] h-[18px] fill-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[13px] text-white/40">
                Don't have an account? <button type="button" onClick={() => setShowLoginModal(false)} className="text-white hover:text-white/80 ml-1 font-medium transition-colors cursor-pointer focus:outline-none">Request Access</button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VelorahLandingPage;
