"use client";

import React, { useState } from "react";
import { 
    Sparkles, 
    BookOpen, 
    PenTool, 
    Hash, 
    FileText, 
    ChevronRight, 
    Loader2, 
    Copy, 
    Check, 
    Library, 
    RefreshCw, 
    BrainCircuit 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BlogTopic, BlogResponse, fetchBlogIdeate, fetchBlogGenerate, saveBlog } from "@/services/api";
import ReactMarkdown from "react-markdown";

interface BlogSectionProps {
    userId: string;
    brandId: string;
}

export const BlogSection = ({ userId, brandId }: BlogSectionProps) => {
    const [topics, setTopics] = useState<BlogTopic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<BlogTopic | null>(null);
    const [blogContent, setBlogContent] = useState<BlogResponse | null>(null);
    const [directInput, setDirectInput] = useState("");
    const [isIdeating, setIsIdeating] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!blogContent) return;
        setIsSaving(true);
        try {
            await saveBlog({
                user_id: userId,
                brand_id: brandId,
                title: blogContent.title,
                full_markdown: blogContent.full_markdown,
                metadata: blogContent.metadata,
                status: "draft",
                cover_image: blogContent.metadata.cover_image
            });
            alert("Blog saved to hub!");
        } catch (e: any) {
            setError("Failed to save: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleIdeate = async () => {
        setIsIdeating(true);
        setError(null);
        try {
            const resp = await fetchBlogIdeate(userId, brandId);
            setTopics(resp.topics);
            setSelectedTopic(null);
            setBlogContent(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsIdeating(false);
        }
    };

    const handleGenerate = async (topicTitle: string, topicAngle?: string) => {
        if (!topicTitle) return;
        setIsGenerating(true);
        setError(null);
        if (topicAngle) {
            setSelectedTopic({ title: topicTitle, angle: topicAngle, target_keywords: [] });
        } else {
            setSelectedTopic({ title: topicTitle, angle: "Direct user directive", target_keywords: [] });
        }
        try {
            const resp = await fetchBlogGenerate(userId, brandId, topicTitle);
            setBlogContent(resp);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (blogContent) {
            navigator.clipboard.writeText(blogContent.full_markdown);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex-1 flex gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full overflow-hidden">
            {/* Left Column: Ideation & Selection */}
            <div className="w-[450px] flex flex-col gap-6 h-full">
                <div className="glass-card p-6 flex flex-col gap-6 h-full overflow-hidden">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                                Editorial Agent
                                <BookOpen className="w-4 h-4 text-accent-secondary" />
                            </h2>
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest font-bold text-nowrap">Node Online</span>
                            </div>
                        </div>

                        {/* Direct Prompt Area - FIX: More visible and instant */}
                        <div className="relative group p-[1px] rounded-2xl bg-gradient-to-br from-accent-secondary/20 via-accent-primary/10 to-transparent">
                            <div className="bg-background/80 backdrop-blur-3xl rounded-[15px] p-5 border border-card-border group-focus-within:border-accent-secondary/40 transition-all duration-500 shadow-2xl">
                                <label className="text-[10px] font-bold text-accent-secondary uppercase tracking-[0.2em] mb-3 block">Topic Directive</label>
                                <textarea 
                                    placeholder="What should we write about today?"
                                    value={directInput}
                                    onChange={(e) => setDirectInput(e.target.value)}
                                    className="w-full bg-transparent border-none text-base focus:ring-0 placeholder:text-foreground/20 min-h-[100px] resize-none leading-relaxed text-foreground"
                                />
                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-card-border">
                                    <span className="text-[10px] text-foreground/20 font-mono tracking-tight uppercase">Manual override active</span>
                                    <button 
                                        onClick={() => handleGenerate(directInput)}
                                        disabled={!directInput || isGenerating}
                                        className="bg-accent-secondary hover:bg-accent-secondary/90 disabled:opacity-30 disabled:grayscale text-white text-[10px] font-black px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] uppercase tracking-wider translate-y-0 active:translate-y-1"
                                    >
                                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <PenTool className="w-3 h-3" />}
                                        Generate
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col gap-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-mono font-bold text-foreground/20 uppercase tracking-[0.2em]">Strategic Suggestions</h3>
                            <button 
                                onClick={handleIdeate}
                                disabled={isIdeating}
                                className="text-[9px] font-bold text-accent-primary hover:text-accent-primary/80 transition-colors flex items-center gap-1.5 uppercase tracking-widest"
                            >
                                <RefreshCw className={cn("w-3 h-3", isIdeating && "animate-spin")} />
                                Refresh
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            {isIdeating ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="h-28 bg-card rounded-2xl animate-pulse border border-card-border" />
                                ))
                            ) : topics.length > 0 ? (
                                topics.map((topic, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleGenerate(topic.title, topic.angle)}
                                        disabled={isGenerating}
                                        className={cn(
                                            "w-full text-left p-5 rounded-2xl border transition-all group relative overflow-hidden",
                                            selectedTopic?.title === topic.title
                                                ? "bg-accent-secondary/10 border-accent-secondary/40 shadow-[0_0_30px_rgba(168,85,247,0.1)]"
                                                : "bg-card border-card-border hover:border-foreground/10 hover:bg-foreground/5"
                                        )}
                                    >
                                        <div className="relative z-10">
                                            <h3 className="font-bold text-sm leading-tight mb-2 group-hover:text-accent-secondary transition-colors text-foreground">
                                                {topic.title}
                                            </h3>
                                            <p className="text-[11px] text-foreground/40 leading-relaxed line-clamp-2 italic font-mono">
                                                {topic.angle}
                                            </p>
                                        </div>
                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/5 group-hover:text-accent-secondary group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-card-border rounded-2xl">
                                    <Sparkles className="w-10 h-10 mb-4 text-foreground" />
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-center px-12 leading-loose text-foreground">Awaiting synthesis</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-mono uppercase tracking-widest">
                        Node Error: {error}
                    </div>
                )}
            </div>

            {/* Right Column: Generation & Preview */}
            <div className="flex-1 min-w-0 h-full overflow-hidden">
                <div className="glass-card h-full flex flex-col overflow-hidden relative">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.03] shadow-lg sticky top-0 z-30">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-accent-secondary/20 rounded-xl shadow-inner">
                                <PenTool className="w-5 h-5 text-accent-secondary" />
                            </div>
                            <div>
                                <h2 className="font-bold text-xl tracking-tight text-foreground/90">Drafting Engine</h2>
                                <p className="text-[10px] text-foreground/30 uppercase tracking-[0.25em] font-mono font-bold">L7 Synthesis Cluster</p>
                            </div>
                        </div>
                        {blogContent && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-accent-secondary/10 hover:bg-accent-secondary/20 border border-accent-secondary/30 rounded-xl text-[11px] font-black text-accent-secondary flex items-center gap-2.5 transition-all shadow-[0_0_20px_rgba(168,85,247,0.1)] active:scale-95 disabled:opacity-50"
                                >
                                    <Library className="w-3.5 h-3.5" />
                                    {isSaving ? "SAVING..." : "SAVE TO HUB"}
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="p-2.5 bg-card hover:bg-foreground/10 border border-card-border rounded-xl text-foreground/60 hover:text-foreground transition-all active:scale-95"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-background/40">
                        {isGenerating ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-pulse" />
                                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative z-10" />
                                    <Sparkles className="w-5 h-5 text-purple-400 absolute -top-1 -right-1 animate-bounce z-10" />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="font-black text-3xl tracking-tighter bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary bg-clip-text text-transparent animate-gradient-x p-2">Synthesizing Narrative...</h3>
                                    <p className="text-sm text-foreground/40 max-w-sm mx-auto leading-relaxed font-medium">
                                        Distilling brand parameters into multi-layered semantic drafts with optimized keyword distribution.
                                    </p>
                                </div>
                                <div className="w-64 h-1.5 bg-card border border-card-border rounded-full overflow-hidden shadow-2xl relative">
                                    <div className="h-full bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary w-3/4 animate-[shimmer_2s_infinite] absolute inset-y-0 left-0" />
                                </div>
                            </div>
                        ) : blogContent ? (
                            <div className="space-y-20 max-w-4xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                                <div className="space-y-10 text-center border-b border-card-border pb-20 relative">
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[9px] font-black text-accent-secondary/40 uppercase tracking-[0.5em] font-mono">Draft v1.0 // Cluster-09</div>
                                    <h1 className="text-6xl font-black tracking-tighter text-foreground leading-[1.05] drop-shadow-2xl">
                                        {blogContent.title}
                                    </h1>
                                    <div className="flex gap-10 justify-center items-center font-mono">
                                        <div className="flex items-center gap-2.5">
                                            <Hash className="w-3.5 h-3.5 text-accent-secondary opacity-60" />
                                            <span className="text-[11px] font-bold text-foreground/30 uppercase tracking-[0.2em]">{blogContent.metadata.slug}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <FileText className="w-3.5 h-3.5 text-accent-primary opacity-60" />
                                            <span className="text-[11px] font-bold text-foreground/30 uppercase tracking-[0.2em]">{blogContent.full_markdown.length} Lexical Units</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="blog-markdown-container">
                                    <ReactMarkdown>
                                        {blogContent.full_markdown.replace(/^\s*#\s+.+?(\n|$)/, '')}
                                    </ReactMarkdown>
                                </div>

                                <div className="bg-gradient-to-br from-card via-card/50 to-transparent rounded-[2.5rem] p-12 border border-card-border space-y-10 shadow-inner relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent-secondary/5 blur-[100px] pointer-events-none group-hover:bg-accent-secondary/10 transition-all duration-1000" />
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="p-2 bg-accent-secondary/20 rounded-lg">
                                            <BrainCircuit className="w-5 h-5 text-accent-secondary" />
                                        </div>
                                        <h3 className="text-[11px] font-mono font-black text-foreground/50 uppercase tracking-[0.4em]">SEO Strategy Manifest</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-16 relative z-10">
                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black text-accent-secondary uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary shadow-[0_0_10px_var(--accent-secondary)]" />
                                                Indexable Title
                                            </p>
                                            <p className="text-xl font-bold text-foreground/95 leading-tight tracking-tight">{blogContent.metadata.meta_title}</p>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black text-accent-primary uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shadow-[0_0_10px_var(--accent-primary)]" />
                                                Description Manifest
                                            </p>
                                            <p className="text-sm text-foreground/50 leading-relaxed font-medium italic">{blogContent.metadata.meta_description}</p>
                                        </div>
                                    </div>
                                    <div className="pt-10 border-t border-card-border relative z-10">
                                        <p className="text-[9px] font-black text-foreground/20 uppercase tracking-widest mb-6">Semantic Keyword Cloud</p>
                                        <div className="flex flex-wrap gap-3">
                                            {blogContent.metadata.keywords.map((kw, i) => (
                                                <span key={i} className="px-4 py-2 rounded-xl bg-card text-[10px] font-mono font-bold text-accent-primary/70 border border-card-border uppercase tracking-widest hover:border-accent-primary/30 hover:bg-accent-primary/5 hover:text-accent-primary transition-all cursor-default shadow-sm">
                                                    #{kw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="h-full flex flex-col items-center justify-center text-red-500/80 p-12 text-center">
                                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 animate-pulse">
                                    <BrainCircuit className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-widest mb-2">Generation Interrupted</h3>
                                <p className="font-mono text-sm max-w-md bg-red-500/5 p-4 rounded-xl border border-red-500/20">
                                    {error}
                                </p>
                                <button 
                                    onClick={() => setError(null)}
                                    className="mt-8 px-6 py-2 bg-card border border-card-border hover:border-red-500/30 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                                >
                                    Dismiss Signal
                                </button>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
                                <PenTool className="w-40 h-40 mb-10 translate-y-4 text-foreground" />
                                <p className="font-black text-4xl uppercase tracking-tighter text-foreground">Standby</p>
                                <p className="text-[10px] font-mono mt-5 uppercase tracking-[0.8em] font-bold text-foreground">Waiting for Narrative Seed</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .blog-markdown-container h1 { font-size: 3.5rem; font-weight: 900; margin-bottom: 2.5rem; color: var(--foreground); letter-spacing: -0.06em; line-height: 1; }
                .blog-markdown-container h2 { font-size: 2.25rem; font-weight: 800; margin-top: 5rem; margin-bottom: 2rem; color: var(--accent-secondary); letter-spacing: -0.03em; position: relative; display: inline-block; }
                .blog-markdown-container h2::after { content: ''; position: absolute; bottom: -8px; left: 0; width: 40px; height: 4px; background: var(--accent-secondary); border-radius: 2px; }
                .blog-markdown-container h3 { font-size: 1.75rem; font-weight: 700; margin-top: 4rem; margin-bottom: 1.5rem; color: var(--accent-primary); letter-spacing: -0.02em; }
                .blog-markdown-container p { font-size: 1.25rem; line-height: 1.9; margin-bottom: 2.25rem; text-align: left; color: var(--foreground); font-medium; opacity: 0.75; }
                .blog-markdown-container ul { list-style-type: none; margin-left: 0; margin-bottom: 3rem; }
                .blog-markdown-container li { position: relative; padding-left: 2rem; margin-bottom: 1rem; font-size: 1.15rem; color: var(--foreground); opacity: 0.8; }
                .blog-markdown-container li::before { content: '→'; position: absolute; left: 0; color: var(--accent-secondary); font-weight: bold; }
                .blog-markdown-container strong { color: var(--foreground); font-weight: 900; }
                .blog-markdown-container blockquote { 
                    border-left: 6px solid var(--accent-secondary); 
                    padding: 3rem; 
                    font-style: italic; 
                    margin: 4rem 0; 
                    background: linear-gradient(to right, rgba(168, 85, 247, 0.08), transparent); 
                    border-radius: 0 3rem 3rem 0; 
                    font-size: 1.5rem; 
                    line-height: 1.6; 
                    color: var(--foreground);
                    opacity: 0.9;
                    box-shadow: -20px 0 50px -20px rgba(168, 85, 247, 0.2);
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 3s ease infinite;
                }
            `}</style>
        </div>
    );
};
