"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Layers, RefreshCw, Trash2, Clock, CheckCircle2, Loader2, ImageIcon, Megaphone, AlertCircle, ExternalLink, Filter, Image as ImageLucide } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchPostQueue, deleteQueuedPost, type QueuedPost } from "@/services/api";

interface QueueSectionProps {
  userId: string;
  brandId: string;
}

type StatusFilter = "all" | "queued" | "processing" | "completed" | "failed";

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  queued: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: <Clock className="w-4 h-4" /> },
  processing: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  completed: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: <CheckCircle2 className="w-4 h-4" /> },
  failed: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: <AlertCircle className="w-4 h-4" /> },
};

export const QueueSection = ({ userId, brandId }: QueueSectionProps) => {
  const [posts, setPosts] = useState<QueuedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = filter === "all" ? undefined : filter;
      const resp = await fetchPostQueue(brandId, statusParam);
      setPosts(resp.posts);
    } catch (e) {
      console.error("Failed to load queue:", e);
    } finally {
      setLoading(false);
    }
  }, [brandId, filter]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleDelete = async (postId: string) => {
    setDeletingId(postId);
    try {
      await deleteQueuedPost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e) {
      console.error("Failed to delete:", e);
    } finally {
      setDeletingId(null);
    }
  };

  const stats = {
    queued: posts.filter((p) => p.status === "queued").length,
    processing: posts.filter((p) => p.status === "processing").length,
    completed: posts.filter((p) => p.status === "completed").length,
    failed: posts.filter((p) => p.status === "failed").length,
    total: posts.length,
  };

  const filteredPosts = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  return (
    <div className="flex flex-col gap-6 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-5 h-5 text-accent-primary" />
            <span className="text-xs font-mono font-medium tracking-[0.2em] text-accent-primary uppercase">
              Batch Processing
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Post <span className="glow-text">Queue</span>
          </h1>
          <p className="text-foreground/40 max-w-md text-sm leading-relaxed">
            Manage your queued post ideas awaiting batch image generation.
          </p>
        </div>
        <button
          onClick={loadQueue}
          disabled={loading}
          className="glass-button flex items-center gap-2 text-sm font-bold bg-accent-primary/10 border-accent-primary/20 text-accent-primary hover:bg-accent-primary/20 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {(["queued", "processing", "completed", "failed"] as const).map((status) => {
          const config = STATUS_CONFIG[status];
          return (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? "all" : status)}
              className={cn(
                "glass-card p-4 flex flex-col items-center gap-2 transition-all cursor-pointer group",
                filter === status && `ring-2 ring-offset-2 ring-offset-background ${config.border.replace("border-", "ring-")}`
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.bg, config.color)}>
                {config.icon}
              </div>
              <span className="text-2xl font-bold">{stats[status]}</span>
              <span className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest">{status}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-foreground/40" />
          <span className="text-xs font-mono text-foreground/40 uppercase tracking-widest">
            {filter === "all" ? `All items (${stats.total})` : `${filter} (${filteredPosts.length})`}
          </span>
        </div>
        {filter !== "all" && (
          <button onClick={() => setFilter("all")} className="text-[10px] font-bold text-accent-primary uppercase hover:underline">
            Clear Filter
          </button>
        )}
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-foreground/20 gap-4">
            <div className="w-20 h-20 rounded-full bg-card border-2 border-dashed border-card-border flex items-center justify-center">
              <Layers className="w-8 h-8" />
            </div>
            <p className="text-sm">{filter === "all" ? "No posts in queue yet." : `No ${filter} posts.`}</p>
            <p className="text-xs text-foreground/15">Add ideas from the Campaign or Strategy tabs.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPosts.map((post) => {
              const config = STATUS_CONFIG[post.status] || STATUS_CONFIG.queued;
              return (
                <div key={post.id} className={cn("glass-card p-5 flex flex-col justify-between min-h-[200px] group transition-all duration-300 hover:border-white/15", config.border)}>
                  {/* Header */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {post.idea_type === "commercial_ad"
                          ? <Megaphone className="w-4 h-4 text-orange-400" />
                          : <ImageLucide className="w-4 h-4 text-purple-400" />
                        }
                        <span className="text-[10px] font-mono text-foreground/40 uppercase tracking-wider">
                          {post.idea_type.replace("_", " ")}
                        </span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border flex items-center gap-1.5",
                        config.color, config.bg, config.border
                      )}>
                        {config.icon}
                        {post.status}
                      </span>
                    </div>

                    {/* Message */}
                    <p className="text-sm font-medium leading-relaxed text-foreground/90 line-clamp-4">
                      {post.message}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-foreground/30 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(post.created_at).toLocaleDateString()} {new Date(post.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>

                    <div className="flex items-center gap-2">
                      {post.status === "completed" && post.image_url && (
                        <a
                          href={post.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-green-400 uppercase hover:text-green-300 flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> View
                        </a>
                      )}
                      {post.status === "queued" && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={deletingId === post.id}
                          className="text-[10px] font-bold text-red-400/60 uppercase hover:text-red-400 flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          {deletingId === post.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Trash2 className="w-3 h-3" />
                          }
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
