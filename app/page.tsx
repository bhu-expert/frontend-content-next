"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { IdeationGrid } from "@/components/IdeationSection";
import { VisualEnginePreview } from "@/components/VisualEnginePreview";
import { BrandIdentitySection } from "@/components/BrandIdentitySection";
import { IdeaModal } from "@/components/IdeaModal";
import { BlogSection } from "@/components/BlogSection";
import { AssetHub } from "@/components/AssetHub";
import { CampaignSection } from "@/components/CampaignSection";
import { Sparkles, BrainCircuit, Waves, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchIdeate, fetchVisualAsset, fetchUserBrands, submitFeedback, createBrand, saveImage, type PostIdea, type Brand } from "@/services/api";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Zap, Layout, Bot } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [ideas, setIdeas] = useState<PostIdea[]>([]);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | undefined>();
  const [isIdeating, setIsIdeating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [genStatus, setGenStatus] = useState<string>("");
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"strategy" | "brand" | "blog" | "hub" | "campaign">("strategy");
  const [assetHubInitialView, setAssetHubInitialView] = useState<"gallery" | "editorial">("gallery");
  const [directInput, setDirectInput] = useState("");
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    const initDashboard = async () => {
      console.log("DEBUG: Initializing Dashboard...");
      const { data: { user } } = await supabase.auth.getUser();
      console.log("DEBUG: Auth User found:", user?.id);

      if (user) {
        setUser(user);
        try {
          console.log("DEBUG: Fetching brands for user:", user.id);
          const brands = await fetchUserBrands(user.id);
          console.log("DEBUG: Brands found:", brands.length);
          if (brands.length > 0) {
            setActiveBrand(brands[0]);
          } else {
            setError("No brands found. Please create a brand in Postman first.");
          }
        } catch (e: any) {
          console.error("DEBUG: Failed to load brands:", e);
          setError(`Failed to load brands: ${e.message}`);
        }
      } else {
        console.log("DEBUG: No user session found, redirecting to /auth");
      }
    };
    initDashboard().finally(() => {
        // Small delay for smooth transition and to ensure strict mode doesn't flash
        setTimeout(() => setIsLoadingDashboard(false), 500);
    });
  }, []);

  useEffect(() => {
    if (user && activeBrand) {
      handleIdeate(user.id, activeBrand.id);
    }
  }, [user, activeBrand]);

  const handleIdeate = async (uId?: string, bId?: string) => {
    const finalUserId = uId || user?.id;
    const finalBrandId = bId || activeBrand?.id;
    
    console.log("DEBUG: handleIdeate called with:", { finalUserId, finalBrandId });

    if (!finalUserId || !finalBrandId) {
        console.warn("DEBUG: Missing User or Brand ID, skipping ideate");
        return;
    }

    setIsIdeating(true);
    setError(null);
    try {
      const resp = await fetchIdeate(finalUserId, finalBrandId);
      console.log("DEBUG: Ideation response received, ideas count:", resp.ideas.length);
      setIdeas(resp.ideas);
    } catch (e: any) {
      console.error("DEBUG: Ideation failed:", e);
      setError(`Ideation failed: ${e.message}`);
    } finally {
      setIsIdeating(false);
    }
  };

  const handleSelectIdea = (index: number) => {
    setSelectedIdeaIndex(index);
    setIsIdeaModalOpen(true);
  };

  const handleGenerateAsset = async (index: number) => {
    if (!user || !activeBrand) return;
    
    setIsIdeaModalOpen(false);
    const idea = ideas[index];
    setIsGenerating(true);
    setGenStatus("Analyzing Core Brief...");
    
    try {
      // Step-by-step status updates for "premium" feel
      setTimeout(() => setGenStatus("Aggregating multi-modal context..."), 1000);
      setTimeout(() => setGenStatus("Synthesizing creative direction..."), 2500);
      setTimeout(() => setGenStatus("Rendering high-fidelity asset..."), 4500);

      const resp = await fetchVisualAsset(user.id, activeBrand.id, idea.message);
      if (resp.results && resp.results.length > 0) {
        setGeneratedImage(resp.results[0].image_url);
        setCurrentPrompt(resp.results[0].prompt);
      }
    } catch (e) {
      console.error(e);
      setGenStatus("Generation failed. Retrying...");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateBrand = async (data: Omit<Brand, "id">) => {
    if (!user) return;
    try {
      const newBrand = await createBrand(user.id, data);
      setActiveBrand(newBrand);
      setActiveTab("strategy");
    } catch (e: any) {
      setError(`Failed to create brand: ${e.message}`);
    }
  };

  const handleDirectInject = async () => {
    if (!directInput || !user || !activeBrand) return;
    
    setIsGenerating(true);
    setGenStatus("Injecting direct directive...");
    
    try {
      const resp = await fetchVisualAsset(user.id, activeBrand.id, directInput);
      if (resp.results && resp.results.length > 0) {
        setGeneratedImage(resp.results[0].image_url);
        setCurrentPrompt(resp.results[0].prompt);
        setDirectInput("");
      }
    } catch (e) {
      console.error(e);
      setGenStatus("Injection failed.");
    } finally {
      setIsGenerating(false);
    }
  };



  if (!isLoadingDashboard && !user) {
    return <LandingPage />;
  }

  return (
    <div className="flex bg-background text-foreground min-h-screen font-sans selection:bg-accent-primary/30">
      <Sidebar activeId={activeTab} onSelect={setActiveTab} />
      
      <main className="flex-1 flex flex-col p-8 overflow-y-auto relative">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/5 blur-[120px] -z-10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-secondary/5 blur-[120px] -z-10 rounded-full" />

        {isLoadingDashboard ? (
            <div className="flex-1 flex flex-col items-center justify-center h-full animate-in fade-in duration-700">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-accent-primary/20 border-t-accent-primary animate-spin" />
                    <BrainCircuit className="w-6 h-6 text-accent-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <p className="mt-6 text-xs font-mono text-foreground/40 tracking-[0.3em] uppercase animate-pulse">Initializing Neural Interface...</p>
            </div>
        ) : (
            <>


        {/* Header */}
        <header className="flex justify-between items-end mb-10 animate-in slide-in-from-top-4 duration-700">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <BrainCircuit className="w-5 h-5 text-accent-primary" />
                <span className="text-xs font-mono font-medium tracking-[0.2em] text-accent-primary uppercase">
                    Strategic Intelligence Node
                </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
                Creative <span className="glow-text">Director</span>
            </h1>
            <p className="text-foreground/40 max-w-md text-sm leading-relaxed">
                Orchestrating brand narrative and visual assets through multi-agent collaboration.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group/input">
                <input 
                    type="text" 
                    value={directInput}
                    onChange={(e) => setDirectInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDirectInject()}
                    placeholder="TYPE YOUR POST IDEA HERE..."
                    className="bg-card border border-card-border rounded-xl px-4 py-2.5 text-xs font-mono w-[350px] focus:outline-none focus:border-accent-primary/60 focus:shadow-[0_0_15px_var(--accent-primary)] transition-all placeholder:text-foreground/30 text-foreground"
                />
                <button 
                  onClick={handleDirectInject}
                  disabled={!directInput}
                  className="absolute right-3 top-2 p-1 text-foreground/40 hover:text-accent-primary transition-colors disabled:opacity-0"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
            </div>
            <button 
                onClick={() => handleIdeate()}
                className="glass-button flex items-center gap-2 text-sm font-bold bg-accent-primary/10 border-accent-primary/20 text-accent-primary hover:bg-accent-primary/20"
            >
                <Waves className="w-4 h-4" /> REFRESH IDEAS
            </button>
          </div>
        </header>


        {/* Error Callout */}
        {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-xl mb-6 flex items-center justify-between">
                <p><strong>Status Alert:</strong> {error}</p>
                <button onClick={() => window.location.reload()} className="underline font-bold">RETRY</button>
            </div>
        )}

        {/* Sub-Navigation Tabs Removed - Controlled by Sidebar */}

        {activeTab === "brand" ? (
          <BrandIdentitySection brand={activeBrand} onSubmit={handleCreateBrand} />
        ) : !activeBrand ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-card-border rounded-3xl">
              <div className="text-center p-12 max-w-sm">
                  <div className="w-16 h-16 bg-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Palette className="w-8 h-8 text-accent-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">Initialize Identity Node</h3>
                  <p className="text-sm text-foreground/40 mb-8 leading-relaxed">No active entity detected. Establish your identity to begin generating strategic assets.</p>
                  <button 
                    onClick={() => setActiveTab("brand")}
                    className="glass-button w-full bg-accent-primary text-white font-bold py-3 hover:shadow-[0_0_20px_var(--accent-primary)]"
                  >
                    ESTABLISH IDENTITY
                  </button>
              </div>
          </div>
        ) : activeTab === "blog" ? (
          <BlogSection userId={user.id} brandId={activeBrand.id} />
        ) : activeTab === "campaign" ? (
          <CampaignSection 
            userId={user.id} 
            brandId={activeBrand.id} 
            onNavigateToAssetHub={(view) => {
              setAssetHubInitialView(view);
              setActiveTab("hub");
            }}
          />
        ) : activeTab === "hub" ? (
          <AssetHub userId={user.id} brandId={activeBrand.id} initialView={assetHubInitialView} />
        ) : (
          <div className="flex gap-8 flex-1">
            {/* Left Column: Ideation */}
            <div className="w-[45%] flex flex-col gap-6">
              <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                     Post Ideation
                     <Sparkles className="w-4 h-4 text-accent-secondary" />
                  </h2>
                  <span className="text-xs font-mono text-foreground/30 tracking-widest uppercase">Target: 5 Variations</span>
              </div>
              
              <IdeationGrid 
                ideas={ideas} 
                selectedId={selectedIdeaIndex} 
                onSelectIdea={handleSelectIdea} 
                isLoading={isIdeating}
              />
            </div>

            {/* Right Column: Visual Engine */}
            <VisualEnginePreview 
              imageUrl={generatedImage} 
              isLoading={isGenerating} 
              status={genStatus}
              onRefresh={() => selectedIdeaIndex !== null && handleGenerateAsset(selectedIdeaIndex)}
              onFeedback={async (liked: boolean) => {
                  if (user && currentPrompt) {
                      try {
                          console.log("DEBUG: Submitting feedback to Mem0:", { liked, currentPrompt });
                          await submitFeedback(user.id, currentPrompt, liked);
                      } catch (e) {
                          console.error("DEBUG: Feedback submission failed:", e);
                      }
                  }
              }}
            />
          </div>
        )}

      <IdeaModal 
        isOpen={isIdeaModalOpen} 
        idea={selectedIdeaIndex !== null ? ideas[selectedIdeaIndex] : null}
        onClose={() => setIsIdeaModalOpen(false)}
        onGenerate={() => selectedIdeaIndex !== null && handleGenerateAsset(selectedIdeaIndex)}
        isGenerating={isGenerating}
      />

        {/* Footer Info */}
        <footer className="mt-12 pt-6 border-t border-card-border flex justify-between items-center text-[10px] font-mono text-foreground/20 tracking-[0.3em] uppercase animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span>System Status: Operational</span>
            <span>RLHF Engine: Online</span>
            <span>V0.2.0-Alpha</span>
        </footer>
            </>
        )}
      </main>
    </div>
  );
}

const LandingPage = () => {
  const router = useRouter();
  console.log("DEBUG: Rendering Landing Page Component");
  
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
};
