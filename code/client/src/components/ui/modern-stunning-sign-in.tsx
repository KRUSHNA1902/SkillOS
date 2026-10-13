"use client";

import * as React from "react";
import { 
  Sparkles, 
  Loader2, 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Phone, 
  Eye, 
  EyeOff,
  Zap
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export interface SignInProps {
  title?: string;
  subtitle?: string;
}

const SignIn1: React.FC<SignInProps> = ({
  title = "SkillOS",
  subtitle = "Join thousands of learners and developers mastering skills on SkillOS.",
}) => {
  const { setUser, loginAsDev } = useAuth();
  
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [termsAccepted, setTermsAccepted] = React.useState(false);

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignUp) {
      if (!fullName || !email || !password || !confirmPassword) {
        setError("Please fill in all required fields.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!termsAccepted) {
        setError("You must agree to the Terms of Service and Privacy Policy.");
        return;
      }
    } else {
      if (!email || !password) {
        setError("Please enter both email and password.");
        return;
      }
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    setIsLoading(true);

    const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
    const payload = isSignUp 
      ? { email, password, fullName, phone } 
      : { email, password };
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include' // Important for HttpOnly cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Supabase might require email confirmation for sign-up depending on settings.
      if (!data.user && isSignUp) {
         alert("Registration successful! Please check your email to verify.");
         setIsSignUp(false);
      } else {
         setUser(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleClick = () => {
    alert("Google Sign-In not implemented in this demo.");
  };

  const handleDevBypass = () => {
    loginAsDev({
      id: "dev-user-001",
      email: "developer@skillos.local"
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212] relative overflow-hidden w-full px-4 py-8">
      {/* Dev Mode Floating Quick Bypass */}
      {import.meta.env.DEV && (
        <div className="fixed top-4 right-4 z-50">
          <button
            type="button"
            onClick={handleDevBypass}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181824]/90 hover:bg-[#202030] border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-xs font-mono backdrop-blur-md transition-all shadow-lg active:scale-95 group cursor-pointer"
            title="Click to bypass authentication in local development mode"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Zap className="w-3 h-3 text-amber-400" />
              Dev Bypass
            </span>
          </button>
        </div>
      )}

      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Centered glass card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-r from-[#ffffff10] to-[#121212] backdrop-blur-md border border-white/10 shadow-2xl p-8 flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-6 shadow-lg border border-white/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-white mb-6 text-center tracking-tight">
          {isSignUp ? `Create a ${title} account` : `Sign in to ${title}`}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4">
          <div className="w-full flex flex-col gap-4">
            
            {isSignUp && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  placeholder="Full Name"
                  type="text"
                  value={fullName}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition border border-white/10"
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                placeholder="Email Address"
                type="email"
                value={email}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition border border-white/10"
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                className="w-full pl-12 pr-12 py-3 rounded-xl bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition border border-white/10"
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {isSignUp && (
              <>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    placeholder="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition border border-white/10"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    placeholder="Phone Number (Optional)"
                    type="tel"
                    value={phone}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition border border-white/10"
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <label className="flex items-start gap-2 mt-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 bg-transparent border-gray-500 rounded text-purple-600 focus:ring-purple-600 focus:ring-offset-gray-900" 
                  />
                  <span className="text-sm text-gray-400">
                    I agree to the <a href="#" className="text-white hover:underline">Terms of Service</a> and <a href="#" className="text-white hover:underline">Privacy Policy</a>
                  </span>
                </label>
              </>
            )}

            {error && (
              <div className="text-sm text-red-400 text-left font-medium animate-fadeIn">
                {error}
              </div>
            )}
          </div>

          <hr className="opacity-10 border-white my-2" />

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 bg-white text-black font-semibold px-5 py-3 rounded-full shadow-md hover:bg-gray-200 transition mb-3 text-sm active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-black" />}
              {isSignUp ? 'Create Account' : 'Sign in'}
            </button>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-[#232526] to-[#2d2e30] rounded-full px-5 py-3 font-medium text-white shadow hover:brightness-110 transition mb-2 text-sm border border-white/5 active:scale-[0.99] disabled:opacity-50"
            >
              {/* Google G SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Dev Mode Bypass Button */}
            {import.meta.env.DEV && (
              <div className="w-full mt-2 pt-2 border-t border-dashed border-white/10 flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleDevBypass}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-amber-500/10 hover:from-amber-500/20 hover:via-amber-400/25 hover:to-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400/60 rounded-full px-4 py-2.5 font-medium text-xs transition duration-200 active:scale-[0.99] shadow-sm cursor-pointer group"
                  title="Quick bypass authentication for local development only"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>⚡ Dev Bypass (Skip Login)</span>
                </button>
                <span className="text-[10px] text-amber-400/60 mt-1 font-mono">
                  Dev environment only
                </span>
              </div>
            )}

            <div className="w-full text-center mt-2">
              <span className="text-xs text-gray-400">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                  }}
                  className="underline text-white/80 hover:text-white transition focus:outline-none"
                >
                  {isSignUp ? "Sign in!" : "Sign up, it's free!"}
                </button>
              </span>
            </div>
          </div>
        </form>
      </div>

      {/* Footer / Users */}
      <div className="relative z-10 mt-10 flex flex-col items-center text-center max-w-sm px-4">
        <p className="text-gray-400 text-sm mb-3">
          {subtitle}
        </p>
        <div className="flex -space-x-2">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
            alt="User 1"
            className="w-8 h-8 rounded-full border-2 border-[#181824] object-cover ring-1 ring-white/10"
          />
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"
            alt="User 2"
            className="w-8 h-8 rounded-full border-2 border-[#181824] object-cover ring-1 ring-white/10"
          />
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces"
            alt="User 3"
            className="w-8 h-8 rounded-full border-2 border-[#181824] object-cover ring-1 ring-white/10"
          />
          <img
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces"
            alt="User 4"
            className="w-8 h-8 rounded-full border-2 border-[#181824] object-cover ring-1 ring-white/10"
          />
        </div>
      </div>
    </div>
  );
};

export { SignIn1 };
export default SignIn1;
