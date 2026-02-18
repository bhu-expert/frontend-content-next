"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, BrainCircuit, Palette, Bot } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-purple-500/30">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full animate-pulse [animation-delay:2s]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[800px] h-[800px] bg-indigo-600/5 blur-[150px] rounded-full" />
      </div>

      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Logo size="lg" />
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/auth')} className="text-sm font-medium text-white/60 hover:text-white transition-colors">Sign In</button>
          <button onClick={() => router.push('/auth')} className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-white/90 transition-all hover:scale-105 active:scale-95">
            Get Started
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-20">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-32">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-blue-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            POSTGINI OS V1.0 IS LIVE
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[0.9] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Your Intelligent <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500">Content Genie</span>
          </h1>

          <p className="text-xl text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            PostGini orchestrates your entire brand narrative. From strategic ideation to high-fidelity visual assets, all generated in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
            <button
              onClick={() => router.push('/auth')}
              className="h-14 px-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-all flex items-center gap-3 hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] group"
            >
              Start Creating <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="h-14 px-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-lg transition-all backdrop-blur-sm">
              View Demo
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          {[
            {
              icon: BrainCircuit,
              title: "Strategic Ideation",
              desc: "Analyze your brand manifesto to generate endless, on-brand content angles."
            },
            {
              icon: Palette,
              title: "Visual Synthesis",
              desc: "Turn concepts into high-fidelity images using our fine-tuned generative engine."
            },
            {
              icon: Bot,
              title: "Editorial Agent",
              desc: "Draft full-length blog posts and articles that match your unique tone of voice."
            }
          ].map((feature, i) => (
            <div key={i} className="glass-card p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white/90">{feature.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/5 py-12 text-center text-white/20 text-sm">
        <p>&copy; 2026 PostGini Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
