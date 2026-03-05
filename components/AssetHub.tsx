"use client";

import { useState, useEffect } from "react";
import {
    Image as ImageIcon,
    FileText,
    Search,
    Trash2,
    ExternalLink,
    Clock,
    LayoutGrid,
    Loader2,
    Maximize2,
    Minimize2,
    X,
    Pencil,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type SavedImage, type SavedBlog } from "@/services";
import {
    useSavedImages,
    useSavedBlogs,
    useDeleteImage,
    useDeleteBlog,
    useUpdateBlog,
} from "@/lib/hooks/useQueries";
import ReactMarkdown from "react-markdown";

interface AssetHubProps {
    userId: string;
    brandId: string;
    initialView?: "gallery" | "editorial";
}

export const AssetHub = ({ userId, brandId, initialView = "gallery" }: AssetHubProps) => {
    const [view, setView] = useState<"gallery" | "editorial">(initialView);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBlog, setSelectedBlog] = useState<SavedBlog | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editStatus, setEditStatus] = useState<"draft" | "scheduled" | "published">("draft");
    const [editScheduledAt, setEditScheduledAt] = useState("");

    // React Query hooks
    const { data: images, isLoading: isLoadingImages, error: imagesError } = useSavedImages(userId, brandId);
    const { data: blogs, isLoading: isLoadingBlogs, error: blogsError } = useSavedBlogs(userId, brandId);
    const deleteImage = useDeleteImage();
    const deleteBlog = useDeleteBlog();
    const updateBlogMutation = useUpdateBlog();

    // Debug logging
    useEffect(() => {
        if (imagesError) {
            console.error('AssetHub - Images error:', imagesError);
        }
        if (blogsError) {
            console.error('AssetHub - Blogs error:', blogsError);
        }
        if (images) {
            console.log('AssetHub - Loaded images:', images.length);
        }
        if (blogs) {
            console.log('AssetHub - Loaded blogs:', blogs.length);
        }
    }, [images, blogs, imagesError, blogsError]);

    useEffect(() => {
        if (selectedBlog) {
            setEditTitle(selectedBlog.title);
            setEditContent(selectedBlog.full_markdown);
            setEditStatus(selectedBlog.status);
            setEditScheduledAt(selectedBlog.scheduled_at ? selectedBlog.scheduled_at.slice(0, 16) : "");
        }
    }, [selectedBlog]);

    // Auto-switch to editorial if gallery is empty but editorial is not
    useEffect(() => {
        if (images && images.length === 0 && blogs && blogs.length > 0) {
            setView("editorial");
        }
    }, [images, blogs]);

    const handleDeleteImage = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this image?")) return;
        await deleteImage.mutateAsync(id);
    };

    const handleDeleteBlog = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this blog?")) return;
        await deleteBlog.mutateAsync(id);
    };

    const handleStatusUpdate = async (id: string, newStatus: "draft" | "scheduled" | "published") => {
        try {
            await updateBlogMutation.mutateAsync({ blogId: id, input: { status: newStatus } });
            setSelectedBlog((prev) => prev ? { ...prev, status: newStatus } : null);
            alert(`Blog status updated to ${newStatus}!`);
        } catch (error) {
            console.error("Failed to update blog status:", error);
            alert("Failed to update blog status");
        }
    };

    const handleUpdateBlog = async () => {
        if (!selectedBlog) return;

        try {
            await updateBlogMutation.mutateAsync({
                blogId: selectedBlog.id,
                input: {
                    title: editTitle,
                    full_markdown: editContent,
                    status: editStatus,
                    scheduled_at: editStatus === "scheduled" ? new Date(editScheduledAt).toISOString() : undefined,
                },
            });
            setSelectedBlog((prev) => prev ? { ...prev, title: editTitle, full_markdown: editContent, status: editStatus } : null);
            setIsEditing(false);
            alert("Blog updated successfully!");
        } catch (error) {
            console.error("Failed to update blog:", error);
            alert("Failed to update blog content");
        }
    };

    const filteredImages = (images ?? []).filter((img) =>
        img.variation_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.prompt?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const filteredBlogs = (blogs ?? []).filter((blog) =>
        blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.full_markdown?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const isLoading = isLoadingImages || isLoadingBlogs;

    return (
        <div className="flex-1 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
            {/* Header Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
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
                            <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{images?.length ?? 0}</span>
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
                            <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{blogs?.length ?? 0}</span>
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
                </div>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
                        <p className="text-xs font-mono uppercase tracking-widest text-foreground/20">Loading Repository...</p>
                    </div>
                </div>
            ) : imagesError || blogsError ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-12">
                        <p className="text-red-500 text-sm mb-4">Failed to load assets</p>
                        <p className="text-xs text-foreground/40 font-mono">
                            {imagesError?.message || blogsError?.message}
                        </p>
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
                                            disabled={deleteImage.isPending}
                                            className="bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-lg p-2 hover:bg-red-500/40 transition-all disabled:opacity-50"
                                            title="Delete Image"
                                        >
                                            {deleteImage.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3 text-red-400" />}
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
                                    disabled={deleteBlog.isPending}
                                    className="p-1.5 hover:bg-red-500/10 rounded-md group/delete transition-colors disabled:opacity-50"
                                    title="Delete Blog"
                                >
                                    {deleteBlog.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-foreground/20 group-hover/delete:text-red-400 transition-colors" />}
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
                                            disabled={updateBlogMutation.isPending}
                                            className="bg-accent-primary text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-accent-primary/90 transition-all disabled:opacity-50"
                                        >
                                            {updateBlogMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Changes"}
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

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-mono uppercase tracking-widest text-foreground/30 ml-1">Content</label>
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-6 py-4 text-sm font-mono focus:outline-none focus:border-accent-primary/50 transition-all min-h-[400px]"
                                                placeholder="Blog content in markdown..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-mono uppercase tracking-widest text-foreground/30 ml-1">Publication Status</label>
                                                <select
                                                    value={editStatus}
                                                    onChange={(e) => setEditStatus(e.target.value as "draft" | "scheduled" | "published")}
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary/50 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="draft">Draft</option>
                                                    <option value="scheduled">Scheduled</option>
                                                    <option value="published">Published</option>
                                                </select>
                                            </div>
                                            {editStatus === "scheduled" && (
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-mono uppercase tracking-widest text-foreground/30 ml-1">Schedule For</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={editScheduledAt}
                                                        onChange={(e) => setEditScheduledAt(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary/50 transition-all"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <article className="prose prose-invert prose-lg max-w-none">
                                        <h1 className="text-3xl font-bold mb-4 text-foreground">{selectedBlog.title}</h1>
                                        <div className="flex items-center gap-4 mb-6 text-sm text-foreground/40">
                                            <span className="font-mono">/{selectedBlog.metadata.slug}</span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold",
                                                selectedBlog.status === 'published' ? "bg-accent-secondary/10 text-accent-secondary" :
                                                selectedBlog.status === 'scheduled' ? "bg-amber-500/10 text-amber-500" :
                                                "bg-foreground/10 text-foreground/40"
                                            )}>
                                                {selectedBlog.status}
                                            </span>
                                        </div>
                                        <ReactMarkdown>{selectedBlog.full_markdown}</ReactMarkdown>
                                    </article>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
