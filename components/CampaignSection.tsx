"use client";

import React, { useState } from "react";
import { Sparkles, Play, Save, Loader2, CheckCircle2, Circle, AlertCircle, FileText, Image as ImageIcon, X, ExternalLink, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchIdeate, fetchBlogIdeate, fetchVisualAsset, fetchBlogGenerate, saveImage, saveBlog, type PostIdea, type BlogTopic } from "@/services/api";

interface CampaignSectionProps {
  userId: string;
  brandId: string;
  onNavigateToAssetHub?: (initialTab: "gallery" | "editorial") => void;
}

type CampaignItemStatus = "pending" | "generating" | "completed" | "failed";

interface CampaignItem {
    id: string;
    type: "blog" | "image";
    title: string; // Message for image, Title for blog
    status: CampaignItemStatus;
    resultUrl?: string; // For image, can be full URL
    resultSlug?: string; // For blog
    error?: string;
}

export const CampaignSection = ({ userId, brandId, onNavigateToAssetHub }: CampaignSectionProps) => {
  const [campaignStep, setCampaignStep] = useState<"idle" | "ideating" | "review" | "executing" | "completed">("idle");
  const [items, setItems] = useState<CampaignItem[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [blogCount, setBlogCount] = useState(7);
  const [imageCount, setImageCount] = useState(7);
  const [campaignContext, setCampaignContext] = useState("");
  
  // State for Modal
  const [selectedItem, setSelectedItem] = useState<CampaignItem | null>(null);

  const addLog = (message: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  const handleStartCampaign = async () => {
    setCampaignStep("ideating");
    setLogs([]);
    addLog("Initializing Neural Campaign Engine...");
    
    try {
        let allItems: CampaignItem[] = [];

        // 1. Fetch Blog Ideas
        if (blogCount > 0) {
            addLog(`Agent: Editorial Strategist - Generating ${blogCount} Blog Topics...`);
            // Pass campaignContext to blog ideation
            const blogResp = await fetchBlogIdeate(userId, brandId, campaignContext, blogCount);
            const blogItems: CampaignItem[] = blogResp.topics.map((t, i) => ({
                id: `blog-${i}`,
                type: "blog",
                title: t.title,
                status: "pending"
            }));
            addLog(`Successfully generated ${blogItems.length} blog topics.`);
            allItems = [...allItems, ...blogItems];
        }

        // 2. Fetch Image Ideas
        if (imageCount > 0) {
            addLog(`Agent: Creative Director - Generating ${imageCount} Visual Concepts...`);
            // Pass campaignContext to image ideation
            const imgResp = await fetchIdeate(userId, brandId, imageCount, campaignContext);
            const imgItems: CampaignItem[] = imgResp.ideas.map((t, i) => ({
                 id: `image-${i}`,
                 type: "image",
                 title: t.message,
                 status: "pending"
            }));
            addLog(`Successfully generated ${imgItems.length} visual concepts.`);
            allItems = [...allItems, ...imgItems];
        }

        setItems(allItems);
        setCampaignStep("review");
        addLog("Ideation Phase Complete. Awaiting approval to execute.");

    } catch (e: any) {
        addLog(`CRITICAL ERROR: Ideation failed - ${e.message}`);
        setCampaignStep("idle");
    }
  };

  const handleExecute = async () => {
    setCampaignStep("executing");
    addLog("Starting Execution Sequence...");
    
    let completedCount = 0;
    const totalItems = items.length;

    // Process items sequentially to show progress (and avoid rate limits if any)
    const newItems = [...items];

    for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];
        
        // Update status to generating
        newItems[i] = { ...item, status: "generating" };
        setItems([...newItems]);
        
        try {
            if (item.type === "blog") {
                addLog(`Generating Blog: "${item.title}"...`);
                const blogContent = await fetchBlogGenerate(userId, brandId, item.title);
                
                addLog(`Saving Blog to Asset Hub...`);
                await saveBlog({
                    user_id: userId,
                    brand_id: brandId,
                    title: blogContent.title,
                    full_markdown: blogContent.full_markdown,
                    metadata: blogContent.metadata
                });
                
                newItems[i] = { ...item, status: "completed", resultSlug: blogContent.metadata.slug };
                addLog(`Blog "${item.title}" completed & saved.`);

            } else {
                addLog(`Rendering Image: "${item.title}"...`);
                const enrichedMessage = campaignContext
                    ? `[Campaign Goal: ${campaignContext}] Scene: ${item.title}`
                    : item.title;
                const imgResp = await fetchVisualAsset(userId, brandId, enrichedMessage);
                
                if (imgResp.results && imgResp.results.length > 0) {
                     const imgResult = imgResp.results[0];
                     addLog(`Saving Image to Asset Hub...`);
                     await saveImage({
                        user_id: userId,
                        brand_id: brandId,
                        image_url: imgResult.image_url,
                        prompt: imgResult.prompt,
                        variation_name: imgResult.variation_name
                     });
                     newItems[i] = { ...item, status: "completed", resultUrl: imgResult.image_url };
                     addLog(`Image "${item.title}" rendered & saved.`);
                } else {
                     throw new Error("No image result returned");
                }
            }
        } catch (e: any) {
             console.error(e);
             newItems[i] = { ...item, status: "failed", error: e.message };
             addLog(`ERROR processing "${item.title}": ${e.message}`);
        }

        setItems([...newItems]);
        completedCount++;
        setProgress((completedCount / totalItems) * 100);
    }

    setCampaignStep("completed");
    addLog("CAMPAIGN EXECUTION COMPLETE.");
    addLog("All assets have been synced to the Asset Hub.");
  };

  return (
    <div className="flex gap-8 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-100px)] relative">
      {/* Detail Modal - Fixed Positioning */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 relative">
                
                {/* Modal Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-start bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                         <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 shadow-lg",
                            selectedItem.type === "blog" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                        )}>
                            {selectedItem.type === "blog" ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold leading-tight text-white/90">
                                {selectedItem.type === "blog" ? "Blog Concept" : "Visual Concept"}
                            </h3>
                            <div className="mt-2 flex items-center gap-2">
                                <span className={cn(
                                    "text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border",
                                    selectedItem.status === "completed" ? "border-green-500/30 text-green-400 bg-green-500/5" :
                                    selectedItem.status === "failed" ? "border-red-500/30 text-red-400 bg-red-500/5" :
                                    "border-blue-500/30 text-blue-400 bg-blue-500/5"
                                )}>
                                    {selectedItem.status}
                                </span>
                                <span className="text-[10px] font-mono text-white/30 uppercase">ID: {selectedItem.id}</span>
                            </div>
                        </div>
                    </div>
                    {/* Fixed Close Button Visibility */}
                    <button 
                        onClick={() => setSelectedItem(null)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                        aria-label="Close Preview"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Modal Body */}
                <div className="p-8 overflow-y-auto space-y-8">
                    {/* Prompt/Title Section */}
                    <div>
                        <h4 className="text-xs font-mono text-white/40 uppercase mb-3 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" />
                            {selectedItem.type === "blog" ? "Topic & Angle" : "Image Prompt / Description"}
                        </h4>
                        <div className="text-lg font-medium leading-relaxed bg-white/5 p-6 rounded-xl border border-white/5 text-white/90 shadow-inner">
                            {selectedItem.title}
                        </div>
                    </div>

                    {/* Result Section */}
                    {selectedItem.status === "completed" && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <h4 className="text-xs font-mono text-white/40 uppercase mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3" />
                                Generated Asset
                            </h4>
                            
                            {selectedItem.type === "image" && selectedItem.resultUrl ? (
                                <div className="rounded-xl overflow-hidden border border-white/10 relative group shadow-2xl">
                                    <img src={selectedItem.resultUrl} alt={selectedItem.title} className="w-full h-auto" />
                                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm gap-3">
                                        <a href={selectedItem.resultUrl} target="_blank" rel="noopener noreferrer" className="glass-button bg-white text-black hover:bg-white/90 font-bold px-4 py-2 flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                            <ExternalLink className="w-4 h-4" /> Full Res
                                        </a>
                                        <button 
                                            onClick={() => onNavigateToAssetHub?.("gallery")}
                                            className="glass-button bg-black/50 text-white hover:bg-black/70 font-bold px-4 py-2 flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75"
                                        >
                                            <ImageIcon className="w-4 h-4" /> View in Hub
                                        </button>
                                     </div>
                                </div>
                            ) : selectedItem.type === "blog" && selectedItem.resultSlug ? (
                                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 flex items-center justify-between group hover:border-green-500/40 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-green-500 mb-1">Content Generated</p>
                                            <p className="text-xs text-green-500/60 font-mono">Saved to Asset Hub: /{selectedItem.resultSlug}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onNavigateToAssetHub?.("editorial")}
                                        className="px-4 py-2 rounded-lg bg-green-500/10 text-green-500 text-xs font-bold uppercase hover:bg-green-500/20 transition-colors"
                                    >
                                        View in Asset Hub
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}
                    
                    {/* Error Section */}
                    {selectedItem.error && (
                         <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 flex items-center gap-4">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                            <div>
                                <p className="font-bold text-red-500 mb-1">Generation Failed</p>
                                <p className="text-sm text-red-400/80">{selectedItem.error}</p>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Modal Footer */}
                <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end">
                    <button 
                        onClick={() => setSelectedItem(null)}
                        className="glass-button px-8 py-3 text-sm font-bold opacity-80 current-color hover:opacity-100"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Left Column: Controls & Status */}
      <div className="w-[35%] flex flex-col gap-6">
        <div className="glass-card p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-accent-primary" />
                Campaign Control
            </h2>
            <p className="text-sm text-foreground/40 mb-6">
                Orchestrate bulk content generation for a complete campaign cycle.
            </p>

            {campaignStep === "idle" && (
                <>
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-xs font-mono text-foreground/50 uppercase block mb-2">Campaign Context / Goal</label>
                        <textarea 
                            value={campaignContext}
                            onChange={(e) => setCampaignContext(e.target.value)}
                            placeholder="E.g. Summer Sale, focus on outdoor lifestyle, include text '50% OFF'"
                            className="w-full bg-card border border-card-border rounded-lg px-4 py-3 text-sm text-foreground focus:border-accent-primary focus:outline-none min-h-[80px] resize-none"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-mono text-foreground/50 uppercase block mb-2">Blog Posts</label>
                        <input 
                            type="number" 
                            min="0"
                            max="20"
                            value={blogCount}
                            onChange={(e) => setBlogCount(parseInt(e.target.value) || 0)}
                            className="w-full bg-card border border-card-border rounded-lg px-4 py-2 text-sm text-foreground focus:border-accent-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-mono text-foreground/50 uppercase block mb-2">Visual Assets</label>
                        <input 
                            type="number" 
                            min="0"
                            max="20"
                            value={imageCount}
                            onChange={(e) => setImageCount(parseInt(e.target.value) || 0)}
                            className="w-full bg-card border border-card-border rounded-lg px-4 py-2 text-sm text-foreground focus:border-accent-primary focus:outline-none"
                        />
                    </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={handleStartCampaign}
                        disabled={blogCount === 0 && imageCount === 0}
                        className="glass-button flex-1 bg-accent-primary text-white font-bold py-4 hover:shadow-[0_0_20px_var(--accent-primary)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles className="w-4 h-4" /> INITIALIZE CAMPAIGN
                    </button>
                </div>
                </>
            )}

            {campaignStep === "ideating" && (
                <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-accent-primary animate-spin mx-auto mb-4" />
                    <p className="text-xs font-mono text-accent-primary uppercase tracking-widest">Generating Strategic Concepts...</p>
                </div>
            )}

            {campaignStep === "review" && (
                <div className="space-y-4">
                     <p className="text-sm text-center text-foreground/60">
                        {items.length} strategic concepts generated.
                    </p>
                    <button 
                        onClick={handleExecute}
                        className="glass-button w-full bg-accent-secondary text-white font-bold py-4 hover:shadow-[0_0_20px_var(--accent-secondary)] flex items-center justify-center gap-2"
                    >
                        <Play className="w-4 h-4" /> EXECUTE CAMPAIGN
                    </button>
                </div>
            )}

            {campaignStep === "executing" && (
                <div className="space-y-4">
                    <div className="w-full bg-card-border h-2 rounded-full overflow-hidden">
                        <div 
                            className="bg-accent-primary h-full transition-all duration-300" 
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-center font-mono text-foreground/50">PROCESSING ASSETS ({Math.round(progress)}%)</p>
                </div>
            )}

             {campaignStep === "completed" && (
                <div className="text-center py-4">
                     <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                     <p className="font-bold text-lg">Mission Complete</p>
                     <p className="text-sm text-foreground/50 mb-4">All assets secured in Asset Hub.</p>
                     <button 
                        onClick={() => { setCampaignStep("idle"); setItems([]); setLogs([]); setProgress(0); }}
                        className="glass-button w-full text-xs"
                    >
                         START NEW CAMPAIGN
                    </button>
                </div>
            )}
        </div>

      </div>

      {/* Right Column: Content Preview - Grid Layout */}
      <div className="flex-1 glass-card p-6 flex flex-col h-full overflow-hidden">
         <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-widest mb-6 border-b border-card-border pb-4 flex justify-between items-center">
            <span>Campaign Manifest</span>
            <span className="text-xs bg-card/50 px-2 py-1 rounded">{items.length} Items</span>
         </h3>
         
         {items.length === 0 && campaignStep === "idle" && (
             <div className="flex-1 flex items-center justify-center text-foreground/20 flex-col gap-4">
                 <div className="w-16 h-16 rounded-full bg-card border-2 border-dashed border-card-border flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                 </div>
                 <p>No active campaign data.</p>
             </div>
         )}
         
         {/* Grid Container */}
         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4 overflow-y-auto pr-2 pb-2 content-start">
            {items.map((item, i) => (
                <div 
                    key={i} 
                    className={cn(
                        "glass-card p-5 flex flex-col justify-between transition-all duration-300 group relative overflow-hidden min-h-[180px]",
                        item.status === "generating" ? "border-accent-primary/50 bg-accent-primary/5" : "bg-card/50 hover:bg-white/5",
                        item.status === "completed" ? "border-green-500/20 bg-green-500/5 hover:border-green-500/40" : ""
                    )}
                >
                    {/* Status Indicator Dot */}
                    <div className={cn(
                        "absolute top-3 right-3 w-2 h-2 rounded-full",
                         item.status === "pending" ? "bg-white/20" :
                         item.status === "generating" ? "bg-accent-primary animate-pulse" :
                         item.status === "completed" ? "bg-green-500" :
                         "bg-red-500"
                    )} />

                    <div className="flex flex-col gap-3">
                         <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg",
                                item.status === "completed" ? "bg-green-500/20 text-green-500" : "bg-white/5 text-foreground/60"
                            )}>
                                {item.type === "blog" ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                            </div>
                            <span className="text-[10px] font-mono text-foreground/40 uppercase tracking-wider">{item.type}</span>
                        </div>
                        
                        <p className="text-sm font-medium leading-relaxed line-clamp-3 text-foreground/90">
                            {item.title}
                        </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                         <span className={cn(
                             "text-[10px] font-mono uppercase",
                             item.status === "pending" ? "text-foreground/30" :
                             item.status === "generating" ? "text-accent-primary animate-pulse" :
                             item.status === "completed" ? "text-green-500" :
                             "text-red-500"
                         )}>
                             {item.status}
                         </span>
                         
                         <button 
                            onClick={() => setSelectedItem(item)}
                            className="bg-white/5 hover:bg-white/10 text-xs px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 font-medium text-foreground/70 hover:text-foreground"
                         >
                            <Maximize2 className="w-3 h-3" />
                            Full Preview
                         </button>
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};
