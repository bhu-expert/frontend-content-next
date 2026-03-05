"use client";

import React from "react";
import { X, Sparkles, Plus, FileText, Layout, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostIdea } from "@/services/api";

interface IdeaModalProps {
  idea: PostIdea | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToQueue: () => void;
  isAdding: boolean;
  ideaType?: "scene" | "commercial_ad";
  index?: number;
}

export const IdeaModal = ({ idea, isOpen, onClose, onAddToQueue, isAdding, ideaType = "scene", index }: IdeaModalProps) => {
  if (!isOpen || !idea) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative glass-card w-full max-w-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/10">
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  ideaType === "commercial_ad" ? "bg-orange-500/20" : "bg-blue-500/20"
                )}>
                    {ideaType === "commercial_ad"
                      ? <Megaphone className="w-5 h-5 text-orange-400" />
                      : <FileText className="w-5 h-5 text-blue-400" />
                    }
                </div>
                <div>
                    <h2 className="font-bold text-xl tracking-tight text-foreground">
                      {ideaType === "commercial_ad" ? "Ad Concept Detail" : "Post Concept Detail"}
                    </h2>
                    <p className="text-[10px] text-foreground/40 uppercase tracking-[0.2em]">
                      {ideaType === "commercial_ad" ? `Commercial Ad #${(index || 0) + 1}` : `Scene Visualization #${(index || 0) + 1}`}
                    </p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-foreground/40 hover:text-foreground">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-8 space-y-8">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-foreground/30 uppercase tracking-widest">
                    <Layout className="w-3 h-3 text-purple-400" />
                    Conceptual Brief
                </div>
                <p className="text-lg font-medium leading-relaxed text-foreground/90 italic">
                    "{idea.message}"
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-mono text-foreground/20 uppercase mb-1">Type</p>
                    <p className="text-sm font-medium text-foreground">
                      {ideaType === "commercial_ad" ? "Commercial Ad" : "Scene Concept"}
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-mono text-foreground/20 uppercase mb-1">Processing</p>
                    <p className="text-sm font-medium text-foreground">Batch Queue (24h)</p>
                </div>
            </div>

            <div className="flex justify-end pt-4 gap-4">
                <button
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl text-sm font-bold text-foreground/40 hover:text-foreground hover:bg-white/5 transition-all"
                >
                    RETURN TO GRID
                </button>
                <button
                    onClick={onAddToQueue}
                    disabled={isAdding}
                    className="glass-button bg-accent-secondary text-white font-bold py-3 px-8 flex items-center gap-3 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] group transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isAdding ? (
                        <>
                            <Sparkles className="w-4 h-4 animate-spin" />
                            QUEUEING...
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            ADD TO QUEUE
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
