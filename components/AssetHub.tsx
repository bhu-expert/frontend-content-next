"use client";

import  { useState, useEffect } from "react";
import { 
    Image as ImageIcon, 
    FileText, 
    Search, 
    Trash2, 
    ExternalLink, 
    Clock, 
    LayoutGrid,
    LayoutList,
    Loader2,
    Maximize2,
    Minimize2,
    X,
    Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { SavedImage, SavedBlog, fetchSavedImages, fetchSavedBlogs, deleteSavedImage, deleteSavedBlog, updateBlog } from "@/services/api";
import ReactMarkdown from "react-markdown";

interface AssetHubProps {
    userId: string;
    brandId: string;
    initialView?: "gallery" | "editorial";
}

export const AssetHub = ({ userId, brandId, initialView = "gallery" }: AssetHubProps) => {
    const [view, setView] = useState<"gallery" | "editorial">(initialView);
    const [images, setImages] = useState<SavedImage[]>([]);
    const [blogs, setBlogs] = useState<SavedBlog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBlog, setSelectedBlog] = useState<SavedBlog | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    
    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editStatus, setEditStatus] = useState<"draft" | "scheduled" | "published">("draft");
    const [editScheduledAt, setEditScheduledAt] = useState("");

    useEffect(() => {
        if (selectedBlog) {
            setEditTitle(selectedBlog.title);
            setEditContent(selectedBlog.full_markdown);
            setEditStatus(selectedBlog.status);
            setEditScheduledAt(selectedBlog.scheduled_at ? selectedBlog.scheduled_at.slice(0, 16) : "");
        }
    }, [selectedBlog]);
    useEffect(() => {
        loadAssets();
    }, [userId, brandId]);

    const handleDeleteImage = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this image?")) return;
        
        // Optimistic update
        setImages(prev => prev.filter(img => img.id !== id));
        
        try {
            await deleteSavedImage(id);
        } catch (error) {
            console.error("Failed to delete image:", error);
            // Revert on failure (reload assets)
            loadAssets();
            alert("Failed to delete image");
        }
    };

    const handleDeleteBlog = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this blog?")) return;

        // Optimistic update
        setBlogs(prev => prev.filter(blog => blog.id !== id));

        try {
            await deleteSavedBlog(id);
        } catch (error) {
            console.error("Failed to delete blog:", error);
            // Revert on failure
            loadAssets();
            alert("Failed to delete blog");
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: "draft" | "scheduled" | "published") => {
        try {
            const updatedBlog = await updateBlog(id, { status: newStatus });
            
            // Update local state
            setBlogs(prev => prev.map(b => b.id === id ? updatedBlog : b));
            if (selectedBlog?.id === id) {
                setSelectedBlog(updatedBlog);
            }
            
            alert(`Blog status updated to ${newStatus}!`);
        } catch (error) {
            console.error("Failed to update blog status:", error);
            alert("Failed to update blog status");
        }
    };

    const handleUpdateBlog = async () => {
        if (!selectedBlog) return;
        
        try {
            const updatedBlog = await updateBlog(selectedBlog.id, {
                title: editTitle,
                full_markdown: editContent,
                status: editStatus,
                scheduled_at: editStatus === "scheduled" ? new Date(editScheduledAt).toISOString() : undefined
            });
            
            // Update local state
            setBlogs(prev => prev.map(b => b.id === selectedBlog.id ? updatedBlog : b));
            setSelectedBlog(updatedBlog);
            setIsEditing(false);
            
            alert("Blog updated successfully!");
        } catch (error) {
            console.error("Failed to update blog:", error);
            alert("Failed to update blog content");
        }
    };

    const loadAssets = async () => {
        setIsLoading(true);
        try {
            const [imgs, blgs] = await Promise.all([
                fetchSavedImages(userId, brandId),
                fetchSavedBlogs(userId, brandId)
            ]);
            setImages(imgs);
            setBlogs(blgs);
            
            // Auto-switch to editorial if gallery is empty but editorial is not
            if (imgs.length === 0 && blgs.length > 0) {
                setView("editorial");
            }
        } catch (e) {
            console.error("Failed to load assets", e);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredImages = images.filter(img => 
        img.variation_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.prompt?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredBlogs = blogs.filter(blog => 
        blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.full_markdown?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    console.log("AssetHub - All Blogs:", blogs);
    console.log("AssetHub - Filtered Blogs:", filteredBlogs);

    return (
        <div className="flex-1 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
            {/* Header Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {/* Debug Info - Hover to reveal */}
                    <div className="text-[10px] font-mono text-foreground/20 opacity-0 hover:opacity-100 transition-opacity absolute top-2 right-2 z-50 cursor-help" title="User ID">
                        ID: {userId}
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                        <button 
                            onClick={() => setView("gallery")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                view === "gallery" ? "bg-accent-primary text-white shadow-lg" : "text-foreground/40 hover:text-foreground/60"
                            )}
                        >
                            <ImageIcon className="w-4 h-4" />
                            Visual Gallery
                            <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{images.length}</span>
                        </button>
                        <button 
                            onClick={() => setView("editorial")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ",
                                view === "editorial" ? "bg-accent-secondary text-white shadow-lg" : "text-foreground/40 hover:text-foreground/60"
                            )}
                        >
                            <FileText className="w-4 h-4" />
                            Editorial Hub
                            <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{blogs.length}</span>
                        </button>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-accent-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Filter assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-card border border-card-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent-primary/50 w-64 transition-all text-foreground placeholder:text-foreground/30"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="glass-button p-2 text-foreground/40 hover:text-foreground transition-all">
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button className="glass-button p-2 text-foreground/40 hover:text-foreground transition-all">
                        <LayoutList className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
                        <p className="text-xs font-mono uppercase tracking-widest text-foreground/20">Loading Repository...</p>
                    </div>
                </div>
            ) : view === "gallery" ? (
                /* Gallery View */
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredImages.length > 0 ? filteredImages.map((img) => (
                        <div key={img.id} className="group glass-card overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 cursor-pointer" onClick={() => window.open(img.image_url, '_blank')}>
                            <div className="relative aspect-square overflow-hidden bg-white/5">
                                <img 
                                    src={img.image_url} 
                                    alt={img.variation_name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <div className="flex gap-2">
                                        <a href={img.image_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex-1 bg-background/80 backdrop-blur-md border border-card-border rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-background transition-all flex items-center justify-center gap-2 text-foreground">
                                            <ExternalLink className="w-3 h-3" />
                                            Open
                                        </a>
                                        <button 
                                            onClick={(e) => handleDeleteImage(img.id, e)}
                                            className="bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-lg p-2 hover:bg-red-500/40 transition-all"
                                            title="Delete Image"
                                        >
                                            <Trash2 className="w-3 h-3 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 space-y-2 bg-white/[0.02]">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono font-bold text-accent-primary uppercase tracking-widest">{img.variation_name}</span>
                                    <Clock className="w-3 h-3 text-foreground/20" />
                                </div>
                                <p className="text-[11px] text-foreground/40 line-clamp-2 leading-relaxed italic">"{img.prompt}"</p>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-24 text-center opacity-10">
                            <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-sm uppercase tracking-widest">No visual assets detected</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Editorial Hub View */
                /* Editorial Hub View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredBlogs.length > 0 ? filteredBlogs.map((blog) => (
                        <button
                            key={blog.id}
                            onClick={() => setSelectedBlog(blog)}
                            className="group glass-card p-6 flex flex-col items-start gap-4 text-left transition-all hover:bg-white/5 border border-card-border hover:border-accent-secondary/50 hover:shadow-lg hover:shadow-accent-secondary/5 relative overflow-hidden"
                        >
                             <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ExternalLink className="w-4 h-4 text-foreground/40" />
                            </div>
                            
                            {(blog.cover_image || blog.metadata?.cover_image) ? (
                                <div className="w-full h-32 mb-4 rounded-lg overflow-hidden relative">
                                    <img 
                                        src={blog.cover_image || blog.metadata?.cover_image} 
                                        alt={blog.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-accent-secondary/10 group-hover:bg-transparent transition-colors" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-accent-secondary/10 flex items-center justify-center mb-2">
                                    <FileText className="w-5 h-5 text-accent-secondary" />
                                </div>
                            )}

                            <div>
                                <h3 className="font-bold text-lg leading-snug mb-2 text-foreground group-hover:text-accent-secondary transition-colors line-clamp-2">
                                    {blog.title || "Untitled Draft"}
                                </h3>
                                <p className="text-xs text-foreground/40 font-mono mb-4">
                                    /{blog.metadata?.slug || 'untitled'}
                                </p>
                            </div>

                            <div className="mt-auto w-full pt-4 border-t border-dashed border-card-border flex items-center justify-between">
                                <span className={cn(
                                    "text-[10px] px-2 py-1 rounded-md uppercase tracking-wider font-bold",
                                    blog.status === 'published' ? "bg-accent-secondary/10 text-accent-secondary" :
                                    blog.status === 'scheduled' ? "bg-amber-500/10 text-amber-500" :
                                    "bg-foreground/10 text-foreground/40"
                                )}>
                                    {blog.status || 'Draft'}
                                </span>
                                <span className="text-[10px] text-foreground/30 font-mono">
                                    {blog.status === 'published' && blog.published_at 
                                        ? new Date(blog.published_at).toLocaleDateString() 
                                        : blog.status === 'scheduled' && blog.scheduled_at 
                                        ? new Date(blog.scheduled_at).toLocaleDateString() 
                                        : new Date(blog.created_at).toLocaleDateString()}
                                </span>
                                <button
                                    onClick={(e) => handleDeleteBlog(blog.id, e)}
                                    className="p-1.5 hover:bg-red-500/10 rounded-md group/delete transition-colors"
                                    title="Delete Blog"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-foreground/20 group-hover/delete:text-red-400 transition-colors" />
                                </button>
                            </div>
                        </button>
                    )) : (
                        <div className="col-span-full py-24 text-center opacity-10">
                            <FileText className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-sm uppercase tracking-widest">Repository empty</p>
                        </div>
                    )}
                </div>
            )}

            {/* Blog Reading Modal */}
            {/* Blog Reading Modal */}
            {selectedBlog && (
                <div className={cn(
                    "fixed inset-0 z-[100] bg-background/80 backdrop-blur-md animate-in fade-in duration-300 flex items-center justify-center",
                    isFullScreen ? "p-0" : "p-4"
                )}>
                    <div 
                        className={cn(
                            "bg-background border border-card-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 relative transition-all ease-in-out",
                            isFullScreen ? "w-screen h-screen rounded-none" : "w-full max-w-4xl h-[85vh] rounded-2xl"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-card-border bg-card/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-accent-secondary/10 flex items-center justify-center border border-accent-secondary/20">
                                    <FileText className="w-5 h-5 text-accent-secondary" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-foreground/60">Editorial Preview</h2>
                                    <p className="text-xs font-mono text-foreground/30">ID: {selectedBlog.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isEditing ? (
                                    <>
                                        <button 
                                            onClick={handleUpdateBlog}
                                            className="bg-accent-primary text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-accent-primary/90 transition-all"
                                        >
                                            Save Changes
                                        </button>
                                        <button 
                                            onClick={() => { setIsEditing(false); }}
                                            className="glass-button px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-white/5 transition-all text-foreground/60"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => setIsEditing(true)}
                                            className="glass-button p-2 text-foreground/40 hover:text-foreground transition-all"
                                            title="Edit Blog"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        {selectedBlog.status !== 'published' && (
                                            <button 
                                                onClick={() => handleStatusUpdate(selectedBlog.id, 'published')}
                                                className="bg-accent-secondary text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-accent-secondary/90 transition-all flex items-center gap-2"
                                            >
                                                <FileText className="w-4 h-4" />
                                                Publish Now
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => setIsFullScreen(!isFullScreen)}
                                            className="glass-button p-2 text-foreground/40 hover:text-foreground transition-all"
                                            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                                        >
                                            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                        </button>
                                        <a 
                                            href={`/blog/${selectedBlog.metadata.slug}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="glass-button p-2 text-foreground/40 hover:text-foreground transition-all flex items-center justify-center"
                                            title="Open formatted blog"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </>
                                )}
                                <button 
                                    onClick={() => { setSelectedBlog(null); setIsFullScreen(false); setIsEditing(false); }}
                                    className="p-2 hover:bg-foreground/5 rounded-full transition-colors text-foreground/40 hover:text-foreground"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-background/50">
                            <div className={cn("mx-auto transition-all", isFullScreen ? "max-w-5xl" : "max-w-3xl")}>
                                {isEditing ? (
                                    <div className="space-y-8 animate-in fade-in duration-300">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-mono uppercase tracking-widest text-foreground/30 ml-1">Editorial Title</label>
                                            <input 
                                                type="text" 
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-6 py-4 text-xl font-bold focus:outline-none focus:border-accent-primary/50 transition-all"
                                                placeholder="Enter blog title..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-mono uppercase tracking-widest text-foreground/30 ml-1">Publication Status</label>
                                                <select 
                                                    value={editStatus}
                                                    onChange={(e) => setEditStatus(e.target.value as any)}
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary/50 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="draft" className="bg-background">Draft</option>
                                                    <option value="published" className="bg-background">Published</option>
                                                    <option value="scheduled" className="bg-background">Scheduled</option>
                                                </select>
                                            </div>

                                            {editStatus === "scheduled" && (
                                                <div className="space-y-2 animate-in slide-in-from-left-4">
                                                    <label className="text-[10px] font-mono uppercase tracking-widest text-foreground/30 ml-1">Release Schedule</label>
                                                    <input 
                                                        type="datetime-local" 
                                                        value={editScheduledAt}
                                                        onChange={(e) => setEditScheduledAt(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary/50 transition-all"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-mono uppercase tracking-widest text-foreground/30 ml-1">Narrative Content (Markdown)</label>
                                            <textarea 
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-6 py-6 text-base font-mono leading-relaxed focus:outline-none focus:border-accent-primary/50 transition-all min-h-[500px] custom-scrollbar"
                                                placeholder="Start writing your story..."
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {selectedBlog.cover_image || selectedBlog.metadata?.cover_image ? (
                                            <div className="mb-8 rounded-xl overflow-hidden w-full h-[300px] relative">
                                                <img 
                                                    src={selectedBlog.cover_image || selectedBlog.metadata?.cover_image} 
                                                    alt={selectedBlog.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-50" />
                                            </div>
                                        ) : null}

                                        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-foreground tracking-tight leading-tight">
                                            {selectedBlog.title}
                                        </h1>
                                        
                                        <div className="flex items-center gap-4 mb-10 text-xs font-mono text-foreground/40 border-b border-card-border pb-6">
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {selectedBlog.status === 'published' && selectedBlog.published_at 
                                                    ? new Date(selectedBlog.published_at).toLocaleDateString() 
                                                    : selectedBlog.status === 'scheduled' && selectedBlog.scheduled_at 
                                                    ? new Date(selectedBlog.scheduled_at).toLocaleDateString() 
                                                    : new Date(selectedBlog.created_at).toLocaleDateString()}
                                            </span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                selectedBlog.status === 'published' ? "bg-accent-secondary/10 text-accent-secondary" :
                                                selectedBlog.status === 'scheduled' ? "bg-amber-500/10 text-amber-500" :
                                                "bg-foreground/10 text-foreground/40"
                                            )}>
                                                {selectedBlog.status}
                                            </span>
                                            {selectedBlog.status === 'scheduled' && selectedBlog.scheduled_at && (
                                                <span className="text-amber-500/60 flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" />
                                                    {format(parseISO(selectedBlog.scheduled_at), "PPP p")} IST
                                                </span>
                                            )}
                                            <span>•</span>
                                            <span className="uppercase text-accent-secondary">{selectedBlog.metadata?.keywords?.length || 0} Keywords</span>
                                            <span>•</span>
                                            <span>{selectedBlog.full_markdown.length} Characters</span>
                                        </div>

                                        <div className="prose prose-invert prose-lg max-w-none text-foreground/80 leading-relaxed react-markdown-container">
                                            <ReactMarkdown
                                                components={{
                                                    img: (props) => (
                                                        <img 
                                                            {...props} 
                                                            className="w-full h-auto rounded-lg my-8 border border-white/5 shadow-2xl"
                                                        />
                                                    ),
                                                    a: (props) => (
                                                        <a {...props} className="text-accent-primary hover:underline hover:text-accent-secondary transition-colors" target="_blank" rel="noopener noreferrer" />
                                                    )
                                                }}
                                            >
                                                {selectedBlog.full_markdown.replace(/^\s*#\s+.+?(\n|$)/, '')} 
                                            </ReactMarkdown>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer / Meta */}
                        <div className="p-6 border-t border-card-border bg-card/50 grid grid-cols-2 gap-8 text-[10px] font-mono uppercase tracking-wider text-foreground/40">
                             <div>
                                <span className="block mb-2 font-bold text-foreground/60">Meta Title</span>
                                {selectedBlog.metadata.meta_title}
                             </div>
                             <div>
                                <span className="block mb-2 font-bold text-foreground/60">Slug</span>
                                /{selectedBlog.metadata.slug}
                             </div>
                        </div>
                    </div>
                </div>
            )}
            
            
            <style jsx global>{`
                .react-markdown-container h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 2rem; color: var(--foreground); letter-spacing: -0.05em; line-height: 1.1; }
                .react-markdown-container h2 { font-size: 1.75rem; font-weight: 800; margin-top: 3.5rem; margin-bottom: 1.5rem; color: var(--accent-secondary); letter-spacing: -0.02em; position: relative; }
                .react-markdown-container h2::after { content: ''; position: absolute; bottom: -8px; left: 0; width: 30px; height: 3px; background: var(--accent-secondary); border-radius: 2px; }
                .react-markdown-container h3 { font-size: 1.5rem; font-weight: 700; margin-top: 2.5rem; margin-bottom: 1rem; color: var(--accent-primary); }
                .react-markdown-container p { font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem; text-align: left; color: var(--foreground); opacity: 0.7; }
                .react-markdown-container ul { list-style-type: none; margin-left: 0; margin-bottom: 2rem; }
                .react-markdown-container li { position: relative; padding-left: 1.5rem; margin-bottom: 0.75rem; color: var(--foreground); opacity: 0.7; }
                .react-markdown-container li::before { content: '→'; position: absolute; left: 0; color: var(--accent-secondary); font-weight: bold; }
                .react-markdown-container strong { color: var(--foreground); font-weight: 800; }
                .react-markdown-container blockquote { border-left: 4px solid var(--accent-secondary); padding: 2rem; font-style: italic; margin: 3rem 0; background: var(--card); border-radius: 0 1.5rem 1.5rem 0; color: var(--foreground); opacity: 0.9; }
                .react-markdown-container img { margin-top: 2rem; margin-bottom: 2rem; }
            `}</style>
        </div>
    );
};
