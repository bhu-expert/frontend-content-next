"use client";

import { useState, useEffect, useCallback } from "react";
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
  useUserBrands,
  useCreateBrand,
  useUpdateBrand,
  useIdeation,
  useRefreshIdeation,
  useGenerateVisualAsset,
  useSubmitFeedback,
  useSaveImage,
} from "@/lib/hooks/useQueries";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Brand, CreateBrandInput } from "@/services";

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);
  
  // Persisted state for generated assets (survives refresh)
  const [generatedImage, setGeneratedImage] = usePersistedState<string | undefined>(
    "generated-image",
    undefined,
    { ttl: 1000 * 60 * 30 } // 30 minutes TTL
  );
  const [currentPrompt, setCurrentPrompt] = usePersistedState<string | null>(
    "current-prompt",
    null,
    { ttl: 1000 * 60 * 30 }
  );

  // Persist active tab and asset hub view
  const [activeTab, setActiveTab] = usePersistedState<"strategy" | "brand" | "blog" | "hub" | "campaign" | "integrations" | "calendar">(
    "dashboard-active-tab",
    "strategy",
  );
  const [assetHubInitialView, setAssetHubInitialView] = usePersistedState<"gallery" | "editorial">(
    "asset-hub-view",
    "gallery",
  );
  const [directInput, setDirectInput] = useState("");
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  // Stable key for blog persistence - only changes when user actually changes
  const blogStorageKey = user && activeBrand ? `blog-draft-${user.id}-${activeBrand.id}` : null;

  // Get user on mount
  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      setUser(user);
    };
    initUser();
  }, []);

  // Fetch brands using React Query
  const {
    data: brands,
    isLoading: isLoadingBrands,
    error: brandsError,
  } = useUserBrands(user?.id ?? "");

  // Set active brand when brands load
  useEffect(() => {
    if (brands && brands.length > 0 && !activeBrand) {
      setActiveBrand(brands[0]);
    } else if (brands && brands.length === 0 && user) {
      // New user - redirect to brand setup
      setActiveTab("brand");
    }
  }, [brands, activeBrand, user]);

  // Fetch ideas using React Query
  const {
    data: ideationData,
    isLoading: isIdeating,
    error: ideationError,
    refetch: refetchIdeas,
  } = useIdeation(user?.id ?? "", activeBrand?.id ?? "");

  // Mutations
  const refreshIdeation = useRefreshIdeation();
  const generateVisualAsset = useGenerateVisualAsset();
  const submitFeedback = useSubmitFeedback();
  const createBrand = useCreateBrand();
  const updateBrandMutation = useUpdateBrand(activeBrand?.id ?? "");
  const saveImageMutation = useSaveImage();

  // Auto-refresh ideas when brand changes
  useEffect(() => {
    if (user && activeBrand) {
      refetchIdeas();
    }
  }, [activeBrand?.id]);

  // Set error from React Query errors
  useEffect(() => {
    if (brandsError) {
      setError(`Failed to load brands: ${brandsError.message}`);
    } else if (ideationError) {
      setError(`Ideation failed: ${ideationError.message}`);
    }
  }, [brandsError, ideationError]);

  const handleIdeate = useCallback(async () => {
    if (!user || !activeBrand) return;
    try {
      await refreshIdeation(user.id, activeBrand.id);
      setError(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(`Ideation failed: ${message}`);
    }
  }, [user, activeBrand, refreshIdeation]);

  const handleSelectIdea = (index: number) => {
    setSelectedIdeaIndex(index);
    setIsIdeaModalOpen(true);
  };

  const handleGenerateAsset = useCallback(async (index: number) => {
    if (!user || !activeBrand || !ideationData) return;

    setIsIdeaModalOpen(false);
    const idea = ideationData.ideas[index];
    
    generateVisualAsset.mutate(
      {
        user_id: user.id,
        brand_id: activeBrand.id,
        message: idea.message,
      },
      {
        onSuccess: (response) => {
          if (response.results && response.results.length > 0) {
            setGeneratedImage(response.results[0].image_url);
            setCurrentPrompt(response.results[0].prompt);
          }
        },
        onError: (e) => {
          console.error(e);
          setError(`Generation failed: ${e.message}`);
        },
      },
    );
  }, [user, activeBrand, ideationData, generateVisualAsset, setGeneratedImage, setCurrentPrompt]);

  const handleCreateBrand = async (data: CreateBrandInput) => {
    if (!user) return;
    try {
      if (activeBrand) {
        const updatedBrand = await updateBrandMutation.mutateAsync(data);
        setActiveBrand({ ...activeBrand, ...updatedBrand });
        setActiveTab("strategy");
      } else {
        const newBrand = await createBrand.mutateAsync(data);
        setActiveBrand(newBrand);
        setActiveTab("strategy");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(`Failed to save brand: ${message}`);
    }
  };

  const handleDirectInject = useCallback(async () => {
    if (!directInput || !user || !activeBrand) return;

    generateVisualAsset.mutate(
      {
        user_id: user.id,
        brand_id: activeBrand.id,
        message: directInput,
      },
      {
        onSuccess: (response) => {
          if (response.results && response.results.length > 0) {
            setGeneratedImage(response.results[0].image_url);
            setCurrentPrompt(response.results[0].prompt);
            setDirectInput("");
          }
        },
        onError: (e) => {
          console.error(e);
          setError(`Injection failed: ${e.message}`);
        },
      },
    );
  }, [directInput, user, activeBrand, generateVisualAsset, setGeneratedImage, setCurrentPrompt]);

  const handleSaveAsset = useCallback(async () => {
    if (!user || !activeBrand || !generatedImage) return;

    try {
      await saveImageMutation.mutateAsync({
        user_id: user.id,
        brand_id: activeBrand.id,
        image_url: generatedImage,
        prompt: currentPrompt || "Generated from strategy",
        variation_name: "Strategic Asset",
      });
      alert("Asset saved to hub!");
    } catch (e: unknown) {
      console.error("Save to Hub failed:", e);
      const message = e instanceof Error ? e.message : "Unknown error";
      alert(`Failed to save asset: ${message}`);
    }
  }, [user, activeBrand, generatedImage, currentPrompt, saveImageMutation]);

  const isLoading = isLoadingBrands || !user;

  return (
    <div className="flex bg-background text-foreground min-h-screen font-sans selection:bg-accent-primary/30">
      <Sidebar activeId={activeTab} onSelect={setActiveTab} />

      <main className="flex-1 flex flex-col p-8 overflow-y-auto relative">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/5 blur-[120px] -z-10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-secondary/5 blur-[120px] -z-10 rounded-full" />

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full animate-in fade-in duration-700">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-accent-primary/20 border-t-accent-primary animate-spin" />
              <BrainCircuit className="w-6 h-6 text-accent-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="mt-6 text-xs font-mono text-foreground/40 tracking-[0.3em] uppercase animate-pulse">Initializing Neural Interface...</p>
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
                  Orchestrating brand narrative and visual assets through multi-agent collaboration.
                </p>
              </div>
            </header>
            )}

            {/* Error Callout */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-xl mb-6 flex items-center justify-between">
                <p><strong>Status Alert:</strong> {error}</p>
                <button onClick={() => setError(null)} className="underline font-bold">DISMISS</button>
              </div>
            )}

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
                      onKeyDown={(e) => e.key === 'Enter' && handleDirectInject()}
                      placeholder="TYPE YOUR POST IDEA HERE..."
                      className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-accent-primary/60 focus:shadow-[0_0_15px_var(--accent-primary)] transition-all placeholder:text-foreground/30 text-foreground"
                    />
                    <button
                      onClick={handleDirectInject}
                      disabled={!directInput || generateVisualAsset.isPending}
                      className="absolute right-3 top-2.5 p-1 text-foreground/40 hover:text-accent-primary transition-colors disabled:opacity-0"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleIdeate()}
                    disabled={isIdeating}
                    className="glass-button flex items-center gap-2 text-sm font-bold bg-accent-primary/10 border-accent-primary/20 text-accent-primary hover:bg-accent-primary/20 shrink-0 disabled:opacity-50"
                  >
                    <Waves className={isIdeating ? "animate-spin" : ""} /> {isIdeating ? "REFRESHING" : "REFRESH IDEAS"}
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
                    <span className="text-xs font-mono text-foreground/30 tracking-widest uppercase">Target: 5 Variations</span>
                  </div>

                  <IdeationGrid
                    ideas={ideationData?.ideas ?? []}
                    selectedId={selectedIdeaIndex}
                    onSelectIdea={handleSelectIdea}
                    isLoading={isIdeating}
                  />
                </div>

                {/* Right Column: Visual Engine */}
                <VisualEnginePreview
                  imageUrl={generatedImage}
                  isLoading={generateVisualAsset.isPending}
                  status={generateVisualAsset.isPending ? "Generating..." : ""}
                  onRefresh={() => selectedIdeaIndex !== null && handleGenerateAsset(selectedIdeaIndex)}
                  onSave={handleSaveAsset}
                  onFeedback={async (liked: boolean) => {
                    if (user && currentPrompt && activeBrand) {
                      submitFeedback.mutate({
                        user_id: user.id,
                        brand_id: activeBrand.id,
                        prompt_used: currentPrompt,
                        liked,
                      });
                    }
                  }}
                />
              </div>
              </div>
            )}

            <IdeaModal
              isOpen={isIdeaModalOpen}
              idea={selectedIdeaIndex !== null ? ideationData?.ideas[selectedIdeaIndex] ?? null : null}
              onClose={() => setIsIdeaModalOpen(false)}
              onGenerate={() => selectedIdeaIndex !== null && handleGenerateAsset(selectedIdeaIndex)}
              isGenerating={generateVisualAsset.isPending}
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
