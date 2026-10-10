"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

export interface SignInProps {
  title?: string;
  subtitle?: string;
  onSignIn?: (data: { email: string; password: string }) => void;
  onGoogleSignIn?: () => void;
  onSignUpClick?: () => void;
}

const SignIn1: React.FC<SignInProps> = ({
  title = "SkillOS",
  subtitle = "Join thousands of learners and developers mastering skills on SkillOS.",
  onSignIn,
  onGoogleSignIn,
  onSignUpClick,
}) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSignIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    if (onSignIn) {
      onSignIn({ email, password });
    } else {
      alert(`Sign in successful! Welcome to ${title} (Demo)`);
    }
  };

  const handleGoogleClick = () => {
    if (onGoogleSignIn) {
      onGoogleSignIn();
    } else {
      alert("Google Sign-In clicked (Demo)");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212] relative overflow-hidden w-full px-4 py-8">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Centered glass card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-r from-[#ffffff10] to-[#121212] backdrop-blur-md border border-white/10 shadow-2xl p-8 flex flex-col items-center">
        {/* Logo using Lucide React icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-6 shadow-lg border border-white/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-white mb-6 text-center tracking-tight">
          {title}
        </h2>

        {/* Form */}
        <form onSubmit={handleSignIn} className="flex flex-col w-full gap-4">
          <div className="w-full flex flex-col gap-3">
            <input
              placeholder="Email"
              type="email"
              value={email}
              className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition border border-white/5"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition border border-white/5"
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <div className="text-sm text-red-400 text-left font-medium animate-fadeIn">
                {error}
              </div>
            )}
          </div>

          <hr className="opacity-10 border-white" />

          <div>
            <button
              type="submit"
              className="w-full bg-white/10 text-white font-medium px-5 py-3 rounded-full shadow-md hover:bg-white/20 transition mb-3 text-sm border border-white/10 active:scale-[0.99]"
            >
              Sign in
            </button>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleClick}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-[#232526] to-[#2d2e30] rounded-full px-5 py-3 font-medium text-white shadow hover:brightness-110 transition mb-2 text-sm border border-white/5 active:scale-[0.99]"
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

            <div className="w-full text-center mt-2">
              <span className="text-xs text-gray-400">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={onSignUpClick}
                  className="underline text-white/80 hover:text-white transition focus:outline-none"
                >
                  Sign up, it&apos;s free!
                </button>
              </span>
            </div>
          </div>
        </form>
      </div>

      {/* User count and avatars with verified Unsplash images */}
      <div className="relative z-10 mt-10 flex flex-col items-center text-center max-w-sm px-4">
        <p className="text-gray-400 text-sm mb-3">
          {subtitle}
        </p>
        <div className="flex -space-x-2">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
            alt="User avatar 1"
            className="w-8 h-8 rounded-full border-2 border-[#181824] object-cover ring-1 ring-white/10"
          />
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"
            alt="User avatar 2"
            className="w-8 h-8 rounded-full border-2 border-[#181824] object-cover ring-1 ring-white/10"
          />
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces"
            alt="User avatar 3"
            className="w-8 h-8 rounded-full border-2 border-[#181824] object-cover ring-1 ring-white/10"
          />
          <img
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces"
            alt="User avatar 4"
            className="w-8 h-8 rounded-full border-2 border-[#181824] object-cover ring-1 ring-white/10"
          />
        </div>
      </div>
    </div>
  );
};

export { SignIn1 };
export default SignIn1;
