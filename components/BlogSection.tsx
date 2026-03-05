"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Sparkles,
    BookOpen,
    PenTool,
    ChevronRight,
    Loader2,
    Copy,
    Check,
    Plus,
    X,
    FolderOpen,
    Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    type BlogTopic,
    type BlogResponse,
    type BlogCategory,
} from "@/services";
import {
    useBlogIdeation,
    useGenerateBlog,
    useCategories,
    useCreateCategory,
    useDeleteCategory,
    useSaveBlog,
} from "@/lib/hooks/useQueries";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import ReactMarkdown from "react-markdown";
import { FeedbackWidget } from "./FeedbackWidget";
import { useRouter } from "next/navigation";

interface BlogSectionProps {
    userId: string;
    brandId: string;
}

export const BlogSection = ({ userId, brandId }: BlogSectionProps) => {
    const [directInput, setDirectInput] = useState("");
    const [imageSource, setImageSource] = useState<"ai" | "stock">("ai");

    // Category state
    const [selectedCategory, setSelectedCategory] = useState<BlogCategory | null>(null);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const [newCatSlug, setNewCatSlug] = useState("");
    const [newCatDesc, setNewCatDesc] = useState("");

    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Persisted blog draft - survives page refresh
    // Use a stable key that doesn't change during component lifecycle
    const [blogContent, setBlogContent] = usePersistedState<BlogResponse | null>(
        `blog-draft-${userId}-${brandId}`,
        null,
        { ttl: 1000 * 60 * 60 * 2 } // 2 hours TTL
    );
    const [isSaved, setIsSaved] = useState(false);

    const router = useRouter();

    // React Query hooks
    const { data: ideationData, isLoading: isIdeating, error: ideationError } = useBlogIdeation(
        userId,
        brandId,
        selectedCategory?.name,
    );

    const { data: categories, isLoading: isLoadingCategories } = useCategories(brandId);

    const generateBlog = useGenerateBlog();
    const createCategory = useCreateCategory(brandId);
    const deleteCategory = useDeleteCategory(brandId);
    const saveBlogMutation = useSaveBlog();

    // Sync errors from React Query
    useEffect(() => {
        if (ideationError) {
            setError(ideationError.message);
        }
    }, [ideationError]);

    const handleCreateCategory = async () => {
        if (!newCatName || !newCatSlug) return;
        try {
            const cat = await createCategory.mutateAsync({
                name: newCatName,
                slug: newCatSlug,
                description: newCatDesc,
            });
            setSelectedCategory(cat);
            setNewCatName("");
            setNewCatSlug("");
            setNewCatDesc("");
            setShowCategoryForm(false);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Unknown error";
            setError(`Failed to create category: ${message}`);
        }
    };

    const handleDeleteCategory = async (catId: string) => {
        try {
            await deleteCategory.mutateAsync(catId);
            if (selectedCategory?.id === catId) setSelectedCategory(null);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Unknown error";
            setError(`Failed to delete category: ${message}`);
        }
    };

    const handleSave = useCallback(async () => {
        if (!blogContent) return;
        try {
            await saveBlogMutation.mutateAsync({
                user_id: userId,
                brand_id: brandId,
                title: blogContent.title,
                full_markdown: blogContent.full_markdown,
                metadata: blogContent.metadata,
                status: "draft",
                cover_image: blogContent.metadata.cover_image,
            });
            setIsSaved(true);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Unknown error";
            setError(`Failed to save: ${message}`);
        }
    }, [blogContent, userId, brandId, saveBlogMutation]);

    const handleViewArticle = useCallback(async () => {
        if (!blogContent) return;

        if (!isSaved) {
            try {
                await saveBlogMutation.mutateAsync({
                    user_id: userId,
                    brand_id: brandId,
                    title: blogContent.title,
                    full_markdown: blogContent.full_markdown,
                    metadata: blogContent.metadata,
                    status: "draft",
                    cover_image: blogContent.metadata.cover_image,
                });
                setIsSaved(true);
                router.push(`/blog/${blogContent.metadata.slug}`);
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Unknown error";
                setError(`Failed to save before viewing: ${message}`);
            }
        } else {
            router.push(`/blog/${blogContent.metadata.slug}`);
        }
    }, [blogContent, isSaved, userId, brandId, saveBlogMutation, router]);

    const handleGenerate = useCallback(async (topicTitle: string, topicAngle?: string) => {
        if (!topicTitle) return;
        setError(null);
        
        try {
            const resp = await generateBlog.mutateAsync({
                user_id: userId,
                brand_id: brandId,
                topic: topicTitle,
                category_slug: selectedCategory?.slug,
                image_source: imageSource,
            });
            setBlogContent(resp);
            setIsSaved(false);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Unknown error";
            setError(message);
        }
    }, [userId, brandId, selectedCategory, imageSource, generateBlog, setBlogContent]);

    const handleCopy = () => {
        if (blogContent) {
            navigator.clipboard.writeText(blogContent.full_markdown);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const topics = ideationData?.topics ?? [];
    const isGenerating = generateBlog.isPending;

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

                        {/* Direct Prompt Area */}
                        <div className="relative group p-[1px] rounded-2xl bg-gradient-to-br from-accent-secondary/20 via-accent-primary/10 to-transparent">
                            <div className="bg-background/80 backdrop-blur-3xl rounded-[15px] p-5 border border-card-border group-focus-within:border-accent-secondary/40 transition-all duration-500 shadow-2xl">
                                <label className="text-[10px] font-bold text-accent-secondary uppercase tracking-[0.2em] mb-3 block">Topic Directive</label>
                                <textarea
                                    placeholder="What should we write about today?"
                                    value={directInput}
                                    onChange={(e) => setDirectInput(e.target.value)}
                                    className="w-full bg-transparent border-none text-base focus:ring-0 placeholder:text-foreground/20 min-h-[80px] resize-none leading-relaxed text-foreground"
                                />

                                {/* Category Selector & Image Source Row */}
                                <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-card-border/50">
                                    {/* Category Selector */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <FolderOpen className="w-3 h-3 text-foreground/30 shrink-0" />
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className={cn(
                                                "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                                                !selectedCategory
                                                    ? "bg-accent-secondary/20 text-accent-secondary"
                                                    : "text-foreground/30 hover:text-foreground/50 bg-background/40"
                                            )}
                                        >
                                            All
                                        </button>
                                        {categories?.map((cat) => (
                                            <div key={cat.id} className="flex items-center gap-0.5 group/cat">
                                                <button
                                                    onClick={() => setSelectedCategory(cat)}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                                                        selectedCategory?.id === cat.id
                                                            ? "bg-accent-primary/20 text-accent-primary"
                                                            : "text-foreground/30 hover:text-foreground/50 bg-background/40"
                                                    )}
                                                >
                                                    {cat.name}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                    className="opacity-0 group-hover/cat:opacity-100 text-foreground/20 hover:text-red-400 transition-all p-0.5"
                                                >
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setShowCategoryForm(!showCategoryForm)}
                                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-foreground/30 hover:text-accent-secondary bg-background/40 hover:bg-accent-secondary/10 transition-all"
                                        >
                                            <Plus className="w-3 h-3" /> New
                                        </button>
                                    </div>

                                    {/* Create Category Form */}
                                    {showCategoryForm && (
                                        <div className="flex gap-2 items-end animate-in slide-in-from-top-2 duration-200">
                                            <div className="flex-1">
                                                <label className="text-[9px] font-mono text-foreground/30 uppercase tracking-wider mb-1 block">Name</label>
                                                <input
                                                    type="text"
                                                    value={newCatName}
                                                    onChange={(e) => {
                                                        setNewCatName(e.target.value);
                                                        setNewCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                                                    }}
                                                    placeholder="Pet Care"
                                                    className="w-full bg-background/60 border border-card-border rounded-lg px-3 py-1.5 text-[11px] font-mono focus:outline-none focus:border-accent-secondary/40 placeholder:text-foreground/20 text-foreground"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[9px] font-mono text-foreground/30 uppercase tracking-wider mb-1 block">Slug</label>
                                                <input
                                                    type="text"
                                                    value={newCatSlug}
                                                    onChange={(e) => setNewCatSlug(e.target.value)}
                                                    placeholder="pet-care"
                                                    className="w-full bg-background/60 border border-card-border rounded-lg px-3 py-1.5 text-[11px] font-mono focus:outline-none focus:border-accent-secondary/40 placeholder:text-foreground/20 text-foreground"
                                                />
                                            </div>
                                            <button
                                                onClick={handleCreateCategory}
                                                disabled={!newCatName || !newCatSlug || createCategory.isPending}
                                                className="bg-accent-secondary/20 text-accent-secondary hover:bg-accent-secondary/30 disabled:opacity-30 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider shrink-0"
                                            >
                                                {createCategory.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                                            </button>
                                            <button
                                                onClick={() => setShowCategoryForm(false)}
                                                className="text-foreground/20 hover:text-foreground/50 p-1.5 transition-all shrink-0"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Image Source Toggle */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-mono text-foreground/20 uppercase tracking-wider">
                                            {selectedCategory ? `Category: ${selectedCategory.name}` : "No category filter"}
                                        </span>
                                        <div className="flex items-center bg-background/60 border border-card-border rounded-lg p-0.5 shrink-0">
                                            <button
                                                onClick={() => setImageSource("ai")}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                                                    imageSource === "ai"
                                                        ? "bg-accent-secondary/20 text-accent-secondary shadow-sm"
                                                        : "text-foreground/30 hover:text-foreground/50"
                                                )}
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                AI
                                            </button>
                                            <button
                                                onClick={() => setImageSource("stock")}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                                                    imageSource === "stock"
                                                        ? "bg-accent-primary/20 text-accent-primary shadow-sm"
                                                        : "text-foreground/30 hover:text-foreground/50"
                                                )}
                                            >
                                                <ImageIcon className="w-3 h-3" />
                                                Stock
                                            </button>
                                        </div>
                                    </div>
                                </div>

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
                            <span className="text-[9px] font-bold text-accent-primary/60 uppercase tracking-widest">
                                {selectedCategory ? `Filter: ${selectedCategory.name}` : "All Topics"}
                            </span>
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
                                            isGenerating
                                                ? "opacity-50 cursor-not-allowed"
                                                : "",
                                            "bg-card border-card-border hover:border-foreground/10 hover:bg-foreground/5"
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
                                    disabled={saveBlogMutation.isPending || isSaved}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                                        isSaved
                                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                            : "bg-accent-primary text-white hover:bg-accent-primary/90"
                                    )}
                                >
                                    {saveBlogMutation.isPending ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : isSaved ? (
                                        <Check className="w-3 h-3" />
                                    ) : (
                                        <Check className="w-3 h-3 opacity-0" />
                                    )}
                                    {isSaved ? "Saved" : "Save Draft"}
                                </button>
                                <button
                                    onClick={handleViewArticle}
                                    disabled={!isSaved}
                                    className="px-4 py-2 bg-accent-secondary text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-accent-secondary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    View Article
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="p-2 glass-button text-foreground/40 hover:text-foreground transition-all"
                                    title="Copy markdown"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                        {isGenerating ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-accent-secondary/20 border-t-accent-secondary animate-spin" />
                                    <PenTool className="w-6 h-6 text-accent-secondary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <p className="text-xs font-mono text-foreground/40 uppercase tracking-widest animate-pulse">Synthesizing editorial content...</p>
                            </div>
                        ) : blogContent ? (
                            <div className="max-w-3xl mx-auto">
                                <article className="prose prose-invert prose-lg max-w-none">
                                    <h1 className="text-3xl font-bold mb-2 text-foreground">{blogContent.title}</h1>
                                    <div className="text-foreground/40 text-sm mb-8 font-mono">
                                        /{blogContent.metadata.slug}
                                    </div>
                                    <ReactMarkdown>{blogContent.full_markdown}</ReactMarkdown>
                                </article>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-10">
                                <BookOpen className="w-16 h-16 mb-4" />
                                <p className="text-sm uppercase tracking-widest">No content generated</p>
                                <p className="text-xs text-foreground/40 mt-2">Select a topic or enter a directive to begin</p>
                            </div>
                        )}
                    </div>

                    {blogContent && (
                        <div className="p-4 border-t border-card-border bg-card/30">
                            <FeedbackWidget
                                userId={userId}
                                brandId={brandId}
                                prompt={blogContent.title}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
