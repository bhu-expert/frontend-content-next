"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { IdeaModal } from "@/components/IdeaModal";
import { BrandIdentitySection } from "@/components/BrandIdentitySection";
import { BlogSection } from "@/components/BlogSection";
import { AssetHub } from "@/components/AssetHub";
import { CampaignSection } from "@/components/CampaignSection";
import { QueueSection } from "@/components/QueueSection";
import { IntegrationsSection } from "@/components/IntegrationsSection";
import { CalendarSection } from "@/components/CalendarSection";
import { ReelScriptGrid, ReelScriptModal } from "@/components/ReelScriptSection";
import { Sparkles, BrainCircuit, Waves, Palette, CheckCircle2, Plus, Layers, Trash2, Clock, Loader2, Megaphone, Image as ImageLucide, RefreshCw, AlertCircle, Film, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useUserBrands,
  useCreateBrand,
  useUpdateBrand,
} from "@/lib/hooks/useQueries";
import {
  queuePosts,
  fetchPostQueue,
  fetchAdIdeate,
  fetchReelScriptIdeate,
  deleteQueuedPost,
  type QueuedPost,
  type QueuedIdeaItem,
  type PostIdea,
  type ReelScriptIdea,
} from "@/services/api";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Brand, CreateBrandInput } from "@/services";

const STATUS_COLORS: Record<string, string> = {
  queued: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  processing: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  completed: "text-green-400 bg-green-500/10 border-green-500/30",
  failed: "text-red-400 bg-red-500/10 border-red-500/30",
};

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);

  // Persist active tab
  const [activeTab, setActiveTab] = usePersistedState<"strategy" | "brand" | "blog" | "hub" | "campaign" | "queue" | "integrations" | "calendar">(
    "dashboard-active-tab",
    "strategy",
  );
  const [assetHubInitialView, setAssetHubInitialView] = usePersistedState<"gallery" | "editorial">(
    "asset-hub-view",
    "gallery",
  );
  const [directInput, setDirectInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Queue state
  const [queuedPosts, setQueuedPosts] = useState<QueuedPost[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [addingToQueue, setAddingToQueue] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [queueToast, setQueueToast] = useState<string | null>(null);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);

  // Reel script state
  const [reelScripts, setReelScripts] = useState<ReelScriptIdea[]>([]);
  const [isReelIdeating, setIsReelIdeating] = useState(false);
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(null);
  const [isReelModalOpen, setIsReelModalOpen] = useState(false);

  // Content type switcher: 'ad' | 'reel'
  const [contentType, setContentType] = usePersistedState<"ad" | "reel">(
    "content-type-switcher",
    "ad",
  );

  const supabase = createClient();
  const router = useRouter();

  // Get user on mount
  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }
      setUser(user);
    };
    initUser();
  }, []);

  // Fetch brands
  const { data: brands, isLoading: isLoadingBrands, error: brandsError } = useUserBrands(user?.id ?? "");

  useEffect(() => {
    if (brands && brands.length > 0 && !activeBrand) setActiveBrand(brands[0]);
    else if (brands && brands.length === 0 && user) setActiveTab("brand");
  }, [brands, activeBrand, user]);

  // Fetch commercial ad ideas
  const [adIdeas, setAdIdeas] = useState<PostIdea[]>([]);
  const [isIdeating, setIsIdeating] = useState(false);
  const createBrand = useCreateBrand();
  const updateBrandMutation = useUpdateBrand(activeBrand?.id ?? "");

  const loadAdIdeas = useCallback(async () => {
    if (!user || !activeBrand) return;
    setIsIdeating(true);
    try {
      const resp = await fetchAdIdeate(user.id, activeBrand.id, 5);
      setAdIdeas(resp.ideas);
    } catch (e: any) {
      setError(`Ad ideation failed: ${e.message}`);
    } finally {
      setIsIdeating(false);
    }
  }, [user, activeBrand]);

  const loadReelScripts = useCallback(async () => {
    if (!user || !activeBrand) return;
    setIsReelIdeating(true);
    try {
      const resp = await fetchReelScriptIdeate(user.id, activeBrand.id, 3);
      setReelScripts(resp.scripts);
    } catch (e: any) {
      setError(`Reel script ideation failed: ${e.message}`);
    } finally {
      setIsReelIdeating(false);
    }
  }, [user, activeBrand]);

  // Auto-load ideas when brand changes
  useEffect(() => {
    if (user && activeBrand) {
      if (contentType === "ad") loadAdIdeas();
      else if (contentType === "reel") loadReelScripts();
    }
  }, [activeBrand?.id, user?.id, contentType]);
  useEffect(() => {
    if (brandsError) setError(`Failed to load brands: ${brandsError.message}`);
  }, [brandsError]);

  // Queue management
  const loadQueue = useCallback(async () => {
    if (!activeBrand) return;
    setLoadingQueue(true);
    try {
      const resp = await fetchPostQueue(activeBrand.id);
      setQueuedPosts(resp.posts);
    } catch (e: any) {
      console.error("Failed to load queue:", e);
    } finally {
      setLoadingQueue(false);
    }
  }, [activeBrand?.id]);

  // Load queue when strategy tab is active
  useEffect(() => {
    if (activeTab === "strategy" && activeBrand) loadQueue();
  }, [activeTab, activeBrand?.id]);

  const showToast = (msg: string) => {
    setQueueToast(msg);
    setTimeout(() => setQueueToast(null), 2500);
  };

  const addToQueue = async (ideas: QueuedIdeaItem[]) => {
    if (!user || !activeBrand) return;
    setAddingToQueue(true);
    try {
      await queuePosts(user.id, activeBrand.id, ideas);
      showToast(`${ideas.length} idea${ideas.length > 1 ? "s" : ""} added to queue!`);
      loadQueue();
    } catch (e: any) {
      setError(`Queue failed: ${e.message}`);
    } finally {
      setAddingToQueue(false);
    }
  };

  const handleDeleteFromQueue = async (postId: string) => {
    setDeletingId(postId);
    try {
      await deleteQueuedPost(postId);
      setQueuedPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast("Removed from queue");
    } catch (e: any) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  // Handlers
  const handleIdeate = useCallback(async () => {
    if (contentType === "ad") await loadAdIdeas();
    else if (contentType === "reel") await loadReelScripts();
  }, [loadAdIdeas, loadReelScripts, contentType]);

  const handleSelectIdea = (index: number) => {
    setSelectedIdeaIndex(index);
    setIsIdeaModalOpen(true);
  };

  const handleSelectReel = (index: number) => {
    setSelectedReelIndex(index);
    setIsReelModalOpen(true);
  };

  const handleAddFromModal = () => {
    if (selectedIdeaIndex === null) return;
    const idea = adIdeas[selectedIdeaIndex];
    if (!idea) return;
    addToQueue([{ message: idea.message, idea_type: "commercial_ad" }]);
    setIsIdeaModalOpen(false);
    setSelectedIdeaIndex(null);
  };

  const handleAddReelFromModal = () => {
    if (selectedReelIndex === null) return;
    const script = reelScripts[selectedReelIndex];
    if (!script) return;
    // Create a summary message for the queue
    const summary = `[REEL] ${script.title} - ${script.hook} | CTA: ${script.cta} | Duration: ${script.duration_seconds}s`;
    addToQueue([{ message: summary, idea_type: "reel_script" }]);
    setIsReelModalOpen(false);
    setSelectedReelIndex(null);
  };

  const handleDirectInject = useCallback(async () => {
    if (!directInput) return;
    const ideaType = contentType === "ad" ? "commercial_ad" : "reel_script";
    await addToQueue([{ message: directInput, idea_type: ideaType }]);
    setDirectInput("");
  }, [directInput, user, activeBrand, contentType]);

  const handleCreateBrand = async (data: CreateBrandInput) => {
    if (!user) return;
    try {
      if (activeBrand) {
        const updated = await updateBrandMutation.mutateAsync(data);
        setActiveBrand({ ...activeBrand, ...updated });
      } else {
        const newBrand = await createBrand.mutateAsync(data);
        setActiveBrand(newBrand);
      }
      setActiveTab("strategy");
    } catch (e: unknown) { setError(`Failed to save brand: ${e instanceof Error ? e.message : "Unknown"}`); }
  };

  const isLoading = isLoadingBrands || !user;
  const queuedCount = queuedPosts.filter((p) => p.status === "queued").length;

  return (
    <div className="flex bg-background text-foreground min-h-screen font-sans selection:bg-accent-primary/30">
      <Sidebar activeId={activeTab} onSelect={setActiveTab} />

      <main className="flex-1 flex flex-col p-8 overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/5 blur-[120px] -z-10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-secondary/5 blur-[120px] -z-10 rounded-full" />

        {/* Toast */}
        {queueToast && (
          <div className="fixed top-6 right-6 z-50 bg-green-500/20 border border-green-500/30 text-green-400 text-sm px-6 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300 shadow-lg backdrop-blur-sm">
            <CheckCircle2 className="w-4 h-4" /> {queueToast}
          </div>
        )}

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
                  <div className="w-16 h-16 bg-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6"><Palette className="w-8 h-8 text-accent-primary" /></div>
                  <h3 className="text-xl font-bold mb-3">Initialize Identity Node</h3>
                  <p className="text-sm text-foreground/40 mb-8">Establish your identity to begin.</p>
                  <button onClick={() => setActiveTab("brand")} className="glass-button w-full bg-accent-primary text-white font-bold py-3">ESTABLISH IDENTITY</button>
                </div>
              </div>
            ) : activeTab === "blog" ? (
              <BlogSection userId={user.id} brandId={activeBrand.id} />
            ) : activeTab === "campaign" ? (
              <CampaignSection userId={user.id} brandId={activeBrand.id} onNavigateToAssetHub={(view) => { setAssetHubInitialView(view); setActiveTab("hub"); }} />
            ) : activeTab === "hub" ? (
              <AssetHub userId={user.id} brandId={activeBrand.id} initialView={assetHubInitialView} />
            ) : activeTab === "queue" ? (
              <QueueSection userId={user.id} brandId={activeBrand.id} />
            ) : activeTab === "integrations" ? (
              <IntegrationsSection brandId={activeBrand.id} />
            ) : activeTab === "calendar" ? (
              <CalendarSection userId={user.id} brandId={activeBrand.id} />
            ) : (
              /* ========== STRATEGY TAB — IDEATION + QUEUE ========== */
              <div className="flex flex-col gap-6 flex-1 animate-in fade-in duration-500">
                {/* Header */}
                <header className="flex justify-between items-end animate-in slide-in-from-top-4 duration-700">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BrainCircuit className="w-5 h-5 text-accent-primary" />
                      <span className="text-xs font-mono font-medium tracking-[0.2em] text-accent-primary uppercase">Strategic Intelligence Node</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Creative <span className="glow-text">Director</span></h1>
                    <p className="text-foreground/40 max-w-md text-sm leading-relaxed">Generate commercial ad concepts and queue them for batch image generation.</p>
                  </div>
                  
                  {/* Content Type Switcher */}
                  <div className="flex items-center gap-1 bg-card/50 border border-card-border rounded-xl p-1">
                    <button
                      onClick={() => setContentType("ad")}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        contentType === "ad"
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "text-foreground/40 hover:text-foreground/70"
                      )}
                    >
                      <Megaphone className="w-4 h-4" />
                      Ad
                    </button>
                    <button
                      onClick={() => setContentType("reel")}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        contentType === "reel"
                          ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                          : "text-foreground/40 hover:text-foreground/70"
                      )}
                    >
                      <Film className="w-4 h-4" />
                      Reel
                    </button>
                  </div>
                </header>

                {/* Direct Input */}
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="relative flex-1">
                    <input
                      type="text" value={directInput}
                      onChange={(e) => setDirectInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleDirectInject()}
                      placeholder={contentType === "ad" ? "Type a custom ad idea and press Enter to queue it..." : "Type a custom reel script idea and press Enter to queue it..."}
                      className="w-full bg-card border border-card-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-accent-primary/60 focus:shadow-[0_0_15px_var(--accent-glow)] transition-all placeholder:text-foreground/30 text-foreground pr-12"
                    />
                    <button onClick={handleDirectInject} disabled={!directInput || addingToQueue}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-all disabled:opacity-0">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => handleIdeate()} disabled={contentType === "ad" ? isIdeating : isReelIdeating}
                    className="glass-button flex items-center gap-2 text-sm font-bold bg-accent-primary/10 border-accent-primary/20 text-accent-primary hover:bg-accent-primary/20 shrink-0 disabled:opacity-50 py-3.5">
                    {contentType === "ad" ? (
                      <>
                        <Waves className={cn("w-4 h-4", isIdeating && "animate-spin")} /> {isIdeating ? "GENERATING" : "GENERATE ADS"}
                      </>
                    ) : (
                      <>
                        <Clapperboard className={cn("w-4 h-4", isReelIdeating && "animate-spin")} /> {isReelIdeating ? "GENERATING" : "GENERATE REELS"}
                      </>
                    )}
                  </button>
                </div>

                {/* Two-column layout: Ideation (left) + Queue (right) */}
                <div className="flex gap-6 flex-1 min-h-0">
                  {/* LEFT: Ideation */}
                  <div className="w-[55%] flex flex-col gap-4 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        {contentType === "ad" ? (
                          <>
                            <Megaphone className="w-4 h-4 text-orange-400" /> Commercial Ad Ideas
                          </>
                        ) : (
                          <>
                            <Film className="w-4 h-4 text-pink-400" /> Reel Scripts
                          </>
                        )}
                      </h2>
                      <span className="text-[10px] font-mono text-foreground/30 tracking-widest uppercase">Click to view & queue</span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1">
                      {contentType === "ad" ? (
                        /* AD IDEATION */
                        isIdeating ? (
                          <div className="grid grid-cols-2 gap-3">
                            {[1,2,3,4,5].map(i => (
                              <div key={i} className="h-36 rounded-xl animate-pulse bg-accent-primary/5 border border-accent-primary/10" />
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {(adIdeas ?? []).map((idea, index) => (
                              <button key={index} onClick={() => handleSelectIdea(index)}
                                className="text-left glass-card p-4 hover:border-accent-primary/30 hover:bg-accent-primary/5 transition-all duration-300 group relative">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-mono text-foreground/40 uppercase tracking-wider">Ad #{index + 1}</span>
                                  <Megaphone className="w-3 h-3 text-orange-400/40 group-hover:text-orange-400 transition-colors" />
                                </div>
                                <p className="text-sm font-medium leading-relaxed line-clamp-4 text-foreground/85">{idea.message}</p>
                                <span className="text-[9px] text-accent-primary/0 group-hover:text-accent-primary/70 transition-colors mt-2 block font-mono uppercase">Click to view full idea →</span>
                              </button>
                            ))}
                          </div>
                        )
                      ) : (
                        /* REEL SCRIPTS */
                        isReelIdeating ? (
                          <div className="grid grid-cols-2 gap-3">
                            {[1,2,3,4,5].map(i => (
                              <div key={i} className="h-48 rounded-xl animate-pulse bg-accent-primary/5 border border-accent-primary/10" />
                            ))}
                          </div>
                        ) : (
                          <ReelScriptGrid
                            scripts={reelScripts}
                            selectedId={selectedReelIndex}
                            onSelectScript={handleSelectReel}
                          />
                        )
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Queue */}
                  <div className="w-[45%] flex flex-col glass-card p-5 overflow-hidden">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-card-border">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-accent-primary" />
                        <h2 className="text-lg font-bold">Batch Queue</h2>
                        {queuedCount > 0 && (
                          <span className="text-[10px] bg-accent-primary text-white font-bold px-2 py-0.5 rounded-full">{queuedCount}</span>
                        )}
                      </div>
                      <button onClick={loadQueue} disabled={loadingQueue}
                        className="p-1.5 rounded-lg hover:bg-foreground/5 transition-colors disabled:opacity-50">
                        <RefreshCw className={cn("w-3.5 h-3.5 text-foreground/40", loadingQueue && "animate-spin")} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {loadingQueue ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
                        </div>
                      ) : queuedPosts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-foreground/20 gap-3">
                          <div className="w-14 h-14 rounded-full bg-card border-2 border-dashed border-card-border flex items-center justify-center">
                            <Layers className="w-5 h-5" />
                          </div>
                          <p className="text-xs">Queue is empty</p>
                          <p className="text-[10px] text-foreground/15">Click ideas on the left to add them</p>
                        </div>
                      ) : (
                        queuedPosts.map((post) => (
                          <div key={post.id} className={cn(
                            "p-3.5 rounded-xl border transition-all duration-300 group",
                            STATUS_COLORS[post.status]?.includes("border") ? STATUS_COLORS[post.status].split(" ").find(c => c.startsWith("border-")) : "border-card-border",
                            "bg-card/30 hover:bg-card/60"
                          )}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  {post.idea_type === "commercial_ad"
                                    ? <Megaphone className="w-3 h-3 text-orange-400 shrink-0" />
                                    : post.idea_type === "reel_script"
                                    ? <Film className="w-3 h-3 text-pink-400 shrink-0" />
                                    : <ImageLucide className="w-3 h-3 text-purple-400 shrink-0" />
                                  }
                                  <span className={cn(
                                    "text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full border",
                                    STATUS_COLORS[post.status] || ""
                                  )}>
                                    {post.status}
                                  </span>
                                  <span className="text-[9px] font-mono text-foreground/25 ml-auto flex items-center gap-1 shrink-0">
                                    <Clock className="w-2.5 h-2.5" />
                                    {new Date(post.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-xs leading-relaxed text-foreground/70 line-clamp-2">{post.message}</p>
                              </div>

                              {post.status === "queued" && (
                                <button onClick={() => handleDeleteFromQueue(post.id)} disabled={deletingId === post.id}
                                  className="p-1.5 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0 disabled:opacity-50">
                                  {deletingId === post.id
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Trash2 className="w-3.5 h-3.5" />
                                  }
                                </button>
                              )}
                              {post.status === "completed" && post.image_url && (
                                <a href={post.image_url} target="_blank" rel="noopener noreferrer"
                                  className="text-[9px] font-bold text-green-400 uppercase hover:text-green-300 shrink-0 px-2 py-1">
                                  View
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Queue summary footer */}
                    {queuedPosts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-card-border flex items-center justify-between text-[10px] font-mono text-foreground/30">
                        <span>{queuedPosts.length} total · {queuedCount} awaiting</span>
                        <span>{queuedPosts.filter(p => p.status === "completed").length} completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <IdeaModal
              isOpen={isIdeaModalOpen}
              onClose={() => {
                setIsIdeaModalOpen(false);
                setSelectedIdeaIndex(null);
              }}
              idea={selectedIdeaIndex !== null ? adIdeas[selectedIdeaIndex] : null}
              onAddToQueue={handleAddFromModal}
              index={selectedIdeaIndex ?? 0}
              isAdding={addingToQueue}
              ideaType="commercial_ad"
            />

            <ReelScriptModal
              script={selectedReelIndex !== null ? reelScripts[selectedReelIndex] : null}
              isOpen={isReelModalOpen}
              onClose={() => {
                setIsReelModalOpen(false);
                setSelectedReelIndex(null);
              }}
              onAddToQueue={handleAddReelFromModal}
              index={selectedReelIndex ?? 0}
            />

            {/* Footer */}
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
