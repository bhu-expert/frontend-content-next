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
import { IntegrationsSection } from "@/components/IntegrationsSection";
import { CalendarSection } from "@/components/CalendarSection";
import { Sparkles, BrainCircuit, Waves, Palette } from "lucide-react";
import {
  fetchIdeate,
  fetchVisualAsset,
  fetchUserBrands,
  createBrand,
  updateBrand,
  saveImage,
  submitFeedback,
  type PostIdea,
  type Brand,
} from "@/services/api";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [ideas, setIdeas] = useState<PostIdea[]>([]);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(
    null,
  );

  const [generatedImage, setGeneratedImage] = useState<string | undefined>();
  const [isIdeating, setIsIdeating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [genStatus, setGenStatus] = useState<string>("");
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    | "strategy"
    | "brand"
    | "blog"
    | "hub"
    | "campaign"
    | "integrations"
    | "calendar"
  >("strategy");

  // Restore on refresh
  useEffect(() => {
    const savedTab = sessionStorage.getItem("activeTab") as any;
    if (savedTab) setActiveTab(savedTab);
  }, []);

  // Save when changed
  useEffect(() => {
    sessionStorage.setItem("activeTab", activeTab);
  }, [activeTab]);
  const [assetHubInitialView, setAssetHubInitialView] = useState<
    "gallery" | "editorial"
  >("gallery");
  const [directInput, setDirectInput] = useState("");
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const initDashboard = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      setUser(user);
      try {
        const brands = await fetchUserBrands(user.id);
        if (brands.length > 0) {
          setActiveBrand(brands[0]);
        } else {
          // New user path - not an error, just redirect to brand setup
          setActiveTab("brand");
        }
      } catch (e: any) {
        // Only set error if it's a real API failure, not just "0 brands"
        if (e.message !== "Failed to fetch brands") {
          setError(`System diagnostics alert: ${e.message}`);
        }
      }
    };
    initDashboard().finally(() => {
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

    if (!finalUserId || !finalBrandId) return;

    setIsIdeating(true);
    setError(null);
    try {
      const resp = await fetchIdeate(finalUserId, finalBrandId);
      setIdeas(resp.ideas);
    } catch (e: any) {
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
      setTimeout(
        () => setGenStatus("Aggregating multi-modal context..."),
        1000,
      );
      setTimeout(
        () => setGenStatus("Synthesizing creative direction..."),
        2500,
      );
      setTimeout(() => setGenStatus("Rendering high-fidelity asset..."), 4500);

      const resp = await fetchVisualAsset(
        user.id,
        activeBrand.id,
        idea.message,
      );
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
      if (activeBrand) {
        const updatedBrand = await updateBrand(activeBrand.id, data);
        setActiveBrand({ ...activeBrand, ...updatedBrand });
        setActiveTab("strategy");
      } else {
        const newBrand = await createBrand(user.id, data);
        setActiveBrand(newBrand);
        setActiveTab("strategy");
      }
    } catch (e: any) {
      setError(`Failed to save brand: ${e.message}`);
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

  const handleSaveAsset = async () => {
    if (!user || !activeBrand || !generatedImage) return;

    try {
      await saveImage({
        user_id: user.id,
        brand_id: activeBrand.id,
        image_url: generatedImage,
        prompt: currentPrompt || "Generated from strategy",
        variation_name: "Strategic Asset",
      });
      alert("Asset saved to hub!");
    } catch (e: any) {
      console.error("Save to Hub failed:", e);
      alert("Failed to save asset. Please try again.");
    }
  };

  return (
    <div className="flex bg-background text-foreground min-h-screen font-sans selection:bg-accent-primary/30">
      <Sidebar activeId={activeTab} onSelect={setActiveTab} />

      <main className="flex-1 flex flex-col p-4 overflow-y-auto relative">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/5 blur-[120px] -z-10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-secondary/5 blur-[120px] -z-10 rounded-full" />

        {isLoadingDashboard ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full animate-in fade-in duration-700">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-accent-primary/20 border-t-accent-primary animate-spin" />
              <BrainCircuit className="w-6 h-6 text-accent-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="mt-6 text-xs font-mono text-foreground/40 tracking-[0.3em] uppercase animate-pulse">
              Initializing Neural Interface...
            </p>
          </div>
        ) : (
          <>
            {/* Header — only on strategy tab */}
            {activeTab === "strategy" && (
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
                    Orchestrating brand narrative and visual assets through
                    multi-agent collaboration.
                  </p>
                </div>
              </header>
            )}

            {/* Error Callout */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-xl mb-6 flex items-center justify-between">
                <p>
                  <strong>Status Alert:</strong> {error}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="underline font-bold"
                >
                  RETRY
                </button>
              </div>
            )}

            {activeTab === "brand" ? (
              <BrandIdentitySection
                brand={activeBrand}
                onSubmit={handleCreateBrand}
              />
            ) : !activeBrand ? (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-card-border rounded-3xl">
                <div className="text-center p-12 max-w-sm">
                  <div className="w-16 h-16 bg-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Palette className="w-8 h-8 text-accent-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    Initialize Identity Node
                  </h3>
                  <p className="text-sm text-foreground/40 mb-8 leading-relaxed">
                    No active entity detected. Establish your identity to begin
                    generating strategic assets.
                  </p>
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
              <AssetHub
                userId={user.id}
                brandId={activeBrand.id}
                initialView={assetHubInitialView}
              />
            ) : activeTab === "integrations" ? (
              <IntegrationsSection brandId={activeBrand.id} />
            ) : activeTab === "calendar" ? (
              <CalendarSection userId={user.id} brandId={activeBrand.id} />
            ) : (
              <div className="flex flex-col gap-6 flex-1">
                {/* Input Bar */}
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="relative group/input flex-1">
                    <input
                      type="text"
                      value={directInput}
                      onChange={(e) => setDirectInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleDirectInject()
                      }
                      placeholder="TYPE YOUR POST IDEA HERE..."
                      className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-accent-primary/60 focus:shadow-[0_0_15px_var(--accent-primary)] transition-all placeholder:text-foreground/30 text-foreground"
                    />
                    <button
                      onClick={handleDirectInject}
                      disabled={!directInput}
                      className="absolute right-3 top-2.5 p-1 text-foreground/40 hover:text-accent-primary transition-colors disabled:opacity-0"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleIdeate()}
                    className="glass-button flex items-center gap-2 text-sm font-bold bg-accent-primary/10 border-accent-primary/20 text-accent-primary hover:bg-accent-primary/20 shrink-0"
                  >
                    <Waves className="w-4 h-4" /> REFRESH IDEAS
                  </button>
                </div>

                <div className="flex gap-8 flex-1">
                  {/* Left Column: Ideation */}
                  <div className="w-[45%] flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        Post Ideation
                        <Sparkles className="w-4 h-4 text-accent-secondary" />
                      </h2>
                      <span className="text-xs font-mono text-foreground/30 tracking-widest uppercase">
                        Target: 5 Variations
                      </span>
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
                    onRefresh={() =>
                      selectedIdeaIndex !== null &&
                      handleGenerateAsset(selectedIdeaIndex)
                    }
                    onSave={handleSaveAsset}
                    onFeedback={async (liked: boolean) => {
                      if (user && activeBrand && currentPrompt) {
                        try {
                          await submitFeedback(
                            user.id,
                            activeBrand.id,
                            currentPrompt,
                            liked,
                          );
                        } catch (e) {
                          console.error("Feedback submission failed:", e);
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            <IdeaModal
              isOpen={isIdeaModalOpen}
              idea={
                selectedIdeaIndex !== null ? ideas[selectedIdeaIndex] : null
              }
              onClose={() => setIsIdeaModalOpen(false)}
              onGenerate={() =>
                selectedIdeaIndex !== null &&
                handleGenerateAsset(selectedIdeaIndex)
              }
              isGenerating={isGenerating}
            />

            {/* Footer Info */}
            <footer className=" pt-6 border-t border-card-border flex justify-between items-center text-[10px] font-mono text-foreground/20 tracking-[0.3em] uppercase animate-in fade-in slide-in-from-bottom-4 duration-1000">
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
