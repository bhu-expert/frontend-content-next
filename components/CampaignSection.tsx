"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Play, Loader2, CheckCircle2, AlertCircle, FileText, Image as ImageIcon, X, Megaphone, Layers, Plus, Trash2, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchIdeate, fetchAdIdeate, fetchBlogIdeate, fetchBlogGenerate, saveBlog, queuePosts, fetchPostQueue, deleteQueuedPost, type PostIdea, type BlogTopic, type QueuedIdeaItem, type QueuedPost } from "@/services/api";
import { addDays } from "date-fns";
import { usePersistedState } from "@/lib/hooks/usePersistedState";

interface CampaignSectionProps {
  userId: string;
  brandId: string;
  onNavigateToAssetHub?: (initialTab: "gallery" | "editorial") => void;
}

type IdeationTab = "scene" | "commercial_ad";

interface CampaignState {
    step: "idle" | "ideating" | "review" | "queueing" | "completed";
    sceneIdeas: PostIdea[];
    adIdeas: PostIdea[];
    selectedIdeas: Map<string, QueuedIdeaItem>; // key: "scene-0" or "ad-2"
    blogTopics: BlogTopic[];
    selectedBlogTopics: Set<number>;
    campaignContext: string;
    ideaCount: number;
    blogCount: number;
    activeTab: IdeationTab;
    scheduledDate: string;
    campaignInterval: "none" | "daily" | "weekly";
    schedulingMode: "frequency" | "days";
    postsPerWeek: number;
    selectedWeekdays: number[];
}

const STATUS_COLORS: Record<string, string> = {
    queued: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    processing: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    completed: "text-green-400 bg-green-500/10 border-green-500/30",
    failed: "text-red-400 bg-red-500/10 border-red-500/30",
};

export const CampaignSection = ({ userId, brandId, onNavigateToAssetHub }: CampaignSectionProps) => {
  const [campaignState, setCampaignState] = usePersistedState<CampaignState>(
    `campaign-v2-${userId}-${brandId}`,
    {
      step: "idle",
      sceneIdeas: [],
      adIdeas: [],
      selectedIdeas: new Map(),
      blogTopics: [],
      selectedBlogTopics: new Set(),
      campaignContext: "",
      ideaCount: 5,
      blogCount: 0,
      activeTab: "scene",
      scheduledDate: "",
      campaignInterval: "none",
      schedulingMode: "frequency",
      postsPerWeek: 3,
      selectedWeekdays: [],
    },
    { ttl: 1000 * 60 * 60 * 2 }
  );

  const [logs, setLogs] = useState<string[]>([]);
  const [queuedPosts, setQueuedPosts] = useState<QueuedPost[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);

  const {
    step: campaignStep,
    sceneIdeas,
    adIdeas,
    selectedIdeas,
    blogTopics,
    selectedBlogTopics,
    campaignContext,
    ideaCount,
    blogCount,
    activeTab,
    scheduledDate,
    campaignInterval,
    schedulingMode,
    postsPerWeek,
    selectedWeekdays,
  } = campaignState;

  const updateState = (updates: Partial<CampaignState>) => {
    setCampaignState((prev) => ({ ...prev, ...updates }));
  };

  const addLog = (message: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  // Toggle idea selection
  const toggleIdea = (key: string, idea: PostIdea, type: IdeationTab) => {
    const newMap = new Map(selectedIdeas);
    if (newMap.has(key)) {
      newMap.delete(key);
    } else {
      newMap.set(key, { message: idea.message, idea_type: type === "commercial_ad" ? "commercial_ad" : "scene" });
    }
    updateState({ selectedIdeas: newMap });
  };

  const toggleBlogTopic = (index: number) => {
    const newSet = new Set(selectedBlogTopics);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    updateState({ selectedBlogTopics: newSet });
  };

  const handleReset = () => {
    setCampaignState((prev) => ({
      ...prev,
      step: "idle",
      sceneIdeas: [],
      adIdeas: [],
      selectedIdeas: new Map(),
      blogTopics: [],
      selectedBlogTopics: new Set(),
    }));
    setLogs([]);
  };

  // Load queue
  const loadQueue = async () => {
    setLoadingQueue(true);
    try {
      const resp = await fetchPostQueue(brandId);
      setQueuedPosts(resp.posts);
    } catch (e: any) {
      addLog(`Error loading queue: ${e.message}`);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    if (showQueue) loadQueue();
  }, [showQueue]);

  // Start ideation — generates ideas for both tabs + optional blog topics
  const handleStartCampaign = async () => {
    updateState({ step: "ideating" });
    setLogs([]);
    addLog("Initializing Campaign Ideation Engine...");

    try {
      let newSceneIdeas: PostIdea[] = [];
      let newAdIdeas: PostIdea[] = [];
      let newBlogTopics: BlogTopic[] = [];

      // Scene ideas
      addLog(`Generating ${ideaCount} Scene Concepts...`);
      const sceneResp = await fetchIdeate(userId, brandId, ideaCount, campaignContext);
      newSceneIdeas = sceneResp.ideas;
      addLog(`${newSceneIdeas.length} scene concepts generated.`);

      // Commercial ad ideas
      addLog(`Generating ${ideaCount} Commercial Ad Concepts...`);
      const adResp = await fetchAdIdeate(userId, brandId, ideaCount, campaignContext);
      newAdIdeas = adResp.ideas;
      addLog(`${newAdIdeas.length} ad concepts generated.`);

      // Blog topics (optional)
      if (blogCount > 0) {
        addLog(`Generating ${blogCount} Blog Topics...`);
        const blogResp = await fetchBlogIdeate(userId, brandId, campaignContext, blogCount);
        newBlogTopics = blogResp.topics;
        addLog(`${newBlogTopics.length} blog topics generated.`);
      }

      updateState({
        sceneIdeas: newSceneIdeas,
        adIdeas: newAdIdeas,
        blogTopics: newBlogTopics,
        selectedIdeas: new Map(),
        selectedBlogTopics: new Set(),
        step: "review",
      });
      addLog("Ideation Complete. Select ideas to queue.");
    } catch (e: any) {
      addLog(`CRITICAL ERROR: ${e.message}`);
      updateState({ step: "idle" });
    }
  };

  // Queue selected ideas + generate blogs immediately
  const handleQueueAndGenerate = async () => {
    const selectedCount = selectedIdeas.size + selectedBlogTopics.size;
    if (selectedCount === 0) {
      addLog("No ideas selected. Please select at least one idea.");
      return;
    }

    updateState({ step: "queueing" });
    addLog(`Queueing ${selectedIdeas.size} visual ideas...`);

    try {
      // 1. Queue image ideas
      if (selectedIdeas.size > 0) {
        const ideas = Array.from(selectedIdeas.values());
        await queuePosts(userId, brandId, ideas);
        addLog(`${ideas.length} visual ideas added to batch queue.`);
      }

      // 2. Generate selected blogs immediately (blogs are text, no batch needed)
      if (selectedBlogTopics.size > 0) {
        const selectedTopics = Array.from(selectedBlogTopics).map(i => blogTopics[i]);
        let blogIndex = 0;

        for (const topic of selectedTopics) {
          addLog(`Generating Blog: "${topic.title}"...`);

          try {
            const blogContent = await fetchBlogGenerate(userId, brandId, topic.title);

            let finalScheduledDate: Date | undefined;
            if (scheduledDate) {
              const baseDate = new Date(scheduledDate);
              if (campaignInterval === "daily") {
                finalScheduledDate = addDays(baseDate, blogIndex);
              } else if (campaignInterval === "weekly") {
                if (schedulingMode === "frequency") {
                  const gap = 7 / postsPerWeek;
                  finalScheduledDate = addDays(baseDate, Math.floor(blogIndex * gap));
                } else if (schedulingMode === "days" && selectedWeekdays.length > 0) {
                  const sortedDays = [...selectedWeekdays].sort((a, b) => a - b);
                  let currentDate = new Date(baseDate);
                  let foundCount = 0;
                  let safety = 0;
                  while (foundCount <= blogIndex && safety < 1000) {
                    safety++;
                    let currentDayNormalized = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
                    if (sortedDays.includes(currentDayNormalized)) {
                      if (foundCount === blogIndex) {
                        finalScheduledDate = new Date(currentDate);
                        break;
                      }
                      foundCount++;
                    }
                    currentDate = addDays(currentDate, 1);
                  }
                } else {
                  finalScheduledDate = addDays(baseDate, blogIndex * 7);
                }
              } else {
                finalScheduledDate = baseDate;
              }
            }

            await saveBlog({
              user_id: userId,
              brand_id: brandId,
              title: blogContent.title,
              full_markdown: blogContent.full_markdown,
              metadata: blogContent.metadata,
              status: finalScheduledDate ? "scheduled" : "published",
              scheduled_at: finalScheduledDate ? finalScheduledDate.toISOString() : undefined,
            });

            addLog(`Blog "${topic.title}" generated & saved.`);
            blogIndex++;
          } catch (blogErr: any) {
            addLog(`ERROR generating blog "${topic.title}": ${blogErr.message}`);
          }
        }
      }

      updateState({ step: "completed" });
      addLog("All items processed. Visual ideas queued for batch generation.");
    } catch (e: any) {
      addLog(`ERROR: ${e.message}`);
      updateState({ step: "review" });
    }
  };

  const currentIdeas = activeTab === "scene" ? sceneIdeas : adIdeas;
  const totalSelected = selectedIdeas.size + selectedBlogTopics.size;

  return (
    <div className="flex gap-8 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-100px)] relative">
      {/* Left Column: Controls */}
      <div className="w-[35%] flex flex-col gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-primary" />
              Campaign Control
            </h2>
            <button 
              onClick={() => setShowQueue(!showQueue)}
              className={cn(
                "text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5",
                showQueue ? "border-accent-primary text-accent-primary bg-accent-primary/10" : "border-card-border text-foreground/50 hover:border-accent-primary/50"
              )}
            >
              <Layers className="w-3 h-3" />
              Queue {queuedPosts.length > 0 && `(${queuedPosts.length})`}
            </button>
          </div>
          <p className="text-sm text-foreground/40 mb-6">
            Select ideas from ideation and queue them for batch image generation.
          </p>

          {campaignStep === "idle" && (
            <>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-mono text-foreground/50 uppercase block mb-2">Campaign Context / Goal</label>
                <textarea
                  value={campaignContext}
                  onChange={(e) => updateState({ campaignContext: e.target.value })}
                  placeholder="E.g. Summer Sale, focus on outdoor lifestyle..."
                  className="w-full bg-card border border-card-border rounded-lg px-4 py-3 text-sm text-foreground focus:border-accent-primary focus:outline-none min-h-[80px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-foreground/50 uppercase block mb-2">Ideas Per Type</label>
                  <input
                    type="number" min="1" max="10"
                    value={ideaCount}
                    onChange={(e) => updateState({ ideaCount: parseInt(e.target.value) || 5 })}
                    className="w-full bg-card border border-card-border rounded-lg px-4 py-2 text-sm text-foreground focus:border-accent-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-foreground/50 uppercase block mb-2">Blog Topics</label>
                  <input
                    type="number" min="0" max="10"
                    value={blogCount}
                    onChange={(e) => updateState({ blogCount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-card border border-card-border rounded-lg px-4 py-2 text-sm text-foreground focus:border-accent-primary focus:outline-none"
                  />
                </div>
              </div>

              {blogCount > 0 && (
                <div className="pt-4 border-t border-card-border">
                  <label className="text-xs font-mono text-foreground/50 uppercase block mb-2">
                    Schedule Blog Publication
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => updateState({ scheduledDate: e.target.value })}
                    className="w-full bg-card border border-card-border rounded-lg px-4 py-2 text-sm text-foreground focus:border-accent-primary focus:outline-none"
                  />
                  <p className="text-[10px] text-foreground/40 mt-1.5">Leave blank to publish immediately.</p>

                  {scheduledDate && (
                    <div className="mt-4 space-y-3">
                      <label className="text-xs font-mono text-foreground/50 uppercase block mb-2">Interval</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["none", "daily", "weekly"] as const).map((interval) => (
                          <button key={interval} onClick={() => updateState({ campaignInterval: interval })}
                            className={cn(
                              "px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border",
                              campaignInterval === interval
                                ? "bg-accent-primary text-white border-accent-primary"
                                : "bg-card border-card-border text-foreground/50 hover:border-accent-primary/50"
                            )}
                          >
                            {interval === "none" ? "Instant" : interval}
                          </button>
                        ))}
                      </div>

                      {campaignInterval === "weekly" && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                          <div className="p-1 bg-card/50 rounded-xl border border-card-border flex">
                            <button onClick={() => updateState({ schedulingMode: "frequency" })}
                              className={cn("flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all",
                                schedulingMode === "frequency" ? "bg-background text-foreground shadow-sm" : "text-foreground/30 hover:text-foreground/50"
                              )}
                            >Frequency</button>
                            <button onClick={() => updateState({ schedulingMode: "days" })}
                              className={cn("flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all",
                                schedulingMode === "days" ? "bg-background text-foreground shadow-sm" : "text-foreground/30 hover:text-foreground/50"
                              )}
                            >Match Days</button>
                          </div>
                          {schedulingMode === "frequency" ? (
                            <select value={postsPerWeek} onChange={(e) => updateState({ postsPerWeek: parseInt(e.target.value) })}
                              className="w-full bg-card border border-card-border rounded-lg px-4 py-2 text-sm focus:border-accent-primary focus:outline-none">
                              {[1,2,3,4,5,7].map(n => <option key={n} value={n}>{n} Post{n > 1 ? "s" : ""} / Week</option>)}
                            </select>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {[{id:1,label:"M"},{id:2,label:"T"},{id:3,label:"W"},{id:4,label:"T"},{id:5,label:"F"},{id:6,label:"S"},{id:7,label:"S"}].map(day => (
                                <button key={day.id} onClick={() => updateState({
                                  selectedWeekdays: selectedWeekdays.includes(day.id)
                                    ? selectedWeekdays.filter(d => d !== day.id)
                                    : [...selectedWeekdays, day.id]
                                })}
                                  className={cn("w-8 h-8 rounded-full text-[10px] font-bold transition-all border flex items-center justify-center",
                                    selectedWeekdays.includes(day.id)
                                      ? "bg-accent-secondary text-white border-accent-secondary"
                                      : "bg-card border-card-border text-foreground/40 hover:border-foreground/30"
                                  )}
                                >{day.label}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button 
              onClick={handleStartCampaign}
              className="glass-button w-full bg-accent-primary text-white font-bold py-4 hover:shadow-[0_0_20px_var(--accent-primary)] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> GENERATE IDEAS
            </button>
            </>
          )}

          {campaignStep === "ideating" && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-accent-primary animate-spin mx-auto mb-4" />
              <p className="text-xs font-mono text-accent-primary uppercase tracking-widest">Generating Ideas...</p>
            </div>
          )}

          {campaignStep === "review" && (
            <div className="space-y-4">
              <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-accent-primary">{totalSelected}</p>
                <p className="text-[10px] text-foreground/50 uppercase tracking-widest">Ideas Selected</p>
              </div>
              <button onClick={handleQueueAndGenerate} disabled={totalSelected === 0}
                className="glass-button w-full bg-accent-secondary text-white font-bold py-4 hover:shadow-[0_0_20px_var(--accent-secondary)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> ADD TO QUEUE ({totalSelected})
              </button>
              <button onClick={handleReset}
                className="glass-button w-full text-xs py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <X className="w-3 h-3 inline mr-2" /> RESET
              </button>
            </div>
          )}

          {campaignStep === "queueing" && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-accent-secondary animate-spin mx-auto mb-4" />
              <p className="text-xs font-mono text-accent-secondary uppercase tracking-widest">Processing selections...</p>
            </div>
          )}

          {campaignStep === "completed" && (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="font-bold text-lg">Queued Successfully</p>
              <p className="text-sm text-foreground/50 mb-4">Visual ideas queued for batch generation.</p>
              <div className="flex gap-2">
                <button onClick={handleReset}
                  className="glass-button flex-1 text-xs py-3">
                  NEW CAMPAIGN
                </button>
                <button onClick={() => { setShowQueue(true); loadQueue(); }}
                  className="glass-button flex-1 text-xs py-3 border-accent-primary/30 text-accent-primary">
                  VIEW QUEUE
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Activity Log */}
        {logs.length > 0 && (
          <div className="glass-card p-4 max-h-[200px] overflow-y-auto">
            <h3 className="text-[10px] font-mono text-foreground/40 uppercase mb-2 tracking-widest">Activity Log</h3>
            {logs.map((log, i) => (
              <p key={i} className="text-[10px] font-mono text-foreground/50 leading-relaxed">{log}</p>
            ))}
          </div>
        )}
      </div>

      {/* Right Column */}
      <div className="flex-1 glass-card p-6 flex flex-col h-full overflow-hidden">
        {showQueue ? (
          /* QUEUE VIEW */
          <>
            <div className="flex justify-between items-center mb-6 border-b border-card-border pb-4">
              <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4" /> Post Queue
              </h3>
              <div className="flex gap-2">
                <button onClick={loadQueue} className="glass-button p-1.5">
                  <RefreshCw className={cn("w-3.5 h-3.5 text-foreground/60", loadingQueue && "animate-spin")} />
                </button>
                <button onClick={() => setShowQueue(false)}
                  className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border border-card-border text-foreground/50 hover:text-foreground">
                  Back to Ideas
                </button>
              </div>
            </div>

            {loadingQueue ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
              </div>
            ) : queuedPosts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-foreground/20 flex-col gap-4">
                <Layers className="w-16 h-16" />
                <p>No posts in queue.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto pr-2 pb-2 content-start">
                {queuedPosts.map((post) => (
                  <div key={post.id} className="glass-card p-5 flex flex-col justify-between min-h-[160px] group">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {post.idea_type === "commercial_ad" 
                            ? <Megaphone className="w-4 h-4 text-orange-400" />
                            : <ImageIcon className="w-4 h-4 text-purple-400" />
                          }
                          <span className="text-[10px] font-mono text-foreground/40 uppercase">{post.idea_type.replace("_", " ")}</span>
                        </div>
                        <span className={cn("text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border", STATUS_COLORS[post.status] || "")}>
                          {post.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed line-clamp-3 text-foreground/90">{post.message}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-foreground/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      {post.status === "completed" && post.image_url && (
                        <a href={post.image_url} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] font-bold text-green-400 uppercase hover:text-green-300">
                          View Image
                        </a>
                      )}
                      {post.status === "queued" && (
                        <button onClick={async () => { await deleteQueuedPost(post.id); loadQueue(); }}
                          className="text-[10px] font-bold text-red-400 uppercase hover:text-red-300 flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* IDEAS VIEW */
          <>
            {/* Tab Bar */}
            {campaignStep === "review" && (
              <div className="flex gap-1 mb-6 border-b border-card-border pb-4">
                {(["scene", "commercial_ad"] as IdeationTab[]).map((tab) => {
                  const ideas = tab === "scene" ? sceneIdeas : adIdeas;
                  const selectedForTab = Array.from(selectedIdeas.keys()).filter(k => k.startsWith(tab === "scene" ? "scene-" : "ad-")).length;
                  return (
                    <button key={tab} onClick={() => updateState({ activeTab: tab })}
                      className={cn(
                        "flex-1 py-3 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2",
                        activeTab === tab
                          ? "bg-white/10 text-foreground shadow-sm border border-white/10"
                          : "text-foreground/30 hover:text-foreground/50"
                      )}
                    >
                      {tab === "scene" ? <ImageIcon className="w-3.5 h-3.5" /> : <Megaphone className="w-3.5 h-3.5" />}
                      {tab === "scene" ? "Scene Concepts" : "Commercial Ads"}
                      {selectedForTab > 0 && (
                        <span className="bg-accent-primary text-white text-[9px] px-1.5 py-0.5 rounded-full">{selectedForTab}</span>
                      )}
                    </button>
                  );
                })}
                {blogTopics.length > 0 && (
                  <button onClick={() => updateState({ activeTab: "scene" as IdeationTab })}
                    className="py-3 px-4 text-xs font-bold uppercase rounded-lg text-foreground/30 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    Blogs ({selectedBlogTopics.size}/{blogTopics.length})
                  </button>
                )}
              </div>
            )}

            {/* Content Grid */}
            <div className="flex-1 overflow-y-auto pr-2 pb-2">
              {campaignStep === "idle" && (
                <div className="flex-1 flex items-center justify-center text-foreground/20 flex-col gap-4 h-full">
                  <div className="w-16 h-16 rounded-full bg-card border-2 border-dashed border-card-border flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p>Generate ideas to get started.</p>
                </div>
              )}

              {campaignStep === "ideating" && (
                <div className="grid grid-cols-2 gap-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="glass-card h-40 animate-pulse bg-accent-primary/5 border border-accent-primary/10 rounded-xl" />
                  ))}
                </div>
              )}

              {campaignStep === "review" && (
                <div className="space-y-6">
                  {/* Visual Ideas Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {currentIdeas.map((idea, index) => {
                      const key = activeTab === "scene" ? `scene-${index}` : `ad-${index}`;
                      const isSelected = selectedIdeas.has(key);
                      return (
                        <button key={key} onClick={() => toggleIdea(key, idea, activeTab)}
                          className={cn(
                            "text-left p-5 transition-all duration-300 group relative rounded-xl border",
                            isSelected
                              ? "ring-2 ring-accent-primary/50 bg-accent-primary/10 border-accent-primary/30"
                              : "bg-card/50 border-card-border opacity-70 hover:opacity-100 hover:bg-white/5"
                          )}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-5 h-5 rounded-md border flex items-center justify-center transition-all text-[10px]",
                                isSelected ? "bg-accent-primary border-accent-primary text-white" : "border-foreground/20"
                              )}>
                                {isSelected && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                              <span className="text-[10px] font-mono text-foreground/40 uppercase">
                                {activeTab === "scene" ? "Scene" : "Ad"} #{index + 1}
                              </span>
                            </div>
                            {activeTab === "commercial_ad" && <Megaphone className="w-3.5 h-3.5 text-orange-400/50" />}
                          </div>
                          <p className="text-sm font-medium leading-relaxed line-clamp-4 text-foreground/90">
                            {idea.message}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Blog Topics Section */}
                  {blogTopics.length > 0 && (
                    <div>
                      <h4 className="text-xs font-mono text-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" /> Blog Topics
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {blogTopics.map((topic, index) => {
                          const isSelected = selectedBlogTopics.has(index);
                          return (
                            <button key={index} onClick={() => toggleBlogTopic(index)}
                              className={cn(
                                "text-left p-5 transition-all duration-300 rounded-xl border",
                                isSelected
                                  ? "ring-2 ring-blue-500/50 bg-blue-500/10 border-blue-500/30"
                                  : "bg-card/50 border-card-border opacity-70 hover:opacity-100 hover:bg-white/5"
                              )}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className={cn(
                                  "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                  isSelected ? "bg-blue-500 border-blue-500 text-white" : "border-foreground/20"
                                )}>
                                  {isSelected && <CheckCircle2 className="w-3 h-3" />}
                                </div>
                                <span className="text-[10px] font-mono text-foreground/40 uppercase">Blog #{index + 1}</span>
                              </div>
                              <h3 className="text-sm font-bold mb-1 line-clamp-2">{topic.title}</h3>
                              <p className="text-[10px] text-foreground/40 line-clamp-2">{topic.angle}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
