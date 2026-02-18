"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, ArrowRight, ShieldCheck, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ 
          email, 
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
        });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };



  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full animate-pulse [animation-delay:2s]" />

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        <div className="mb-10 scale-150">
           <Logo size="xl" />
        </div>

        <div className="glass-card p-8 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/5 w-full">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            {isLogin ? "Welcome back" : "Create your account"}
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mb-1.5 block">
                Corporate Identity (Email)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="director@agency.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/10"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mb-1.5 block">
                Secure Access Code
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/10"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Request Access"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-4 text-[10px] font-mono text-white/20 bg-[#0A0A0B] tracking-widest">OR CONTINUE WITH</span>
          </div>


        </div>

        <p className="mt-8 text-center text-sm text-white/30">
          {isLogin ? "New to the agency?" : "Already have access?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-white font-semibold hover:underline decoration-blue-500/50 underline-offset-4"
          >
            {isLogin ? "Sign up here" : "Sign in here"}
          </button>
        </p>
      </div>

      <footer className="absolute bottom-8 text-[10px] font-mono text-white/10 tracking-[0.5em] uppercase">
        PostGini OS v1.0 // Secure Encryption Active
      </footer>
    </div>
  );
}
