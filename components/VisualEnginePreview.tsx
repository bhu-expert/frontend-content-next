"use client";

import React from "react";
import { Image as ImageIcon, Loader2, Sparkles, RefreshCw, ThumbsUp, ThumbsDown, Library } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisualEnginePreviewProps {
  imageUrl?: string;
  isLoading?: boolean;
  status?: string;
  onRefresh?: () => void;
  onFeedback?: (liked: boolean) => void;
  onSave?: () => void;
}

export const VisualEnginePreview = ({ imageUrl, isLoading, status, onRefresh, onFeedback, onSave }: VisualEnginePreviewProps) => {
  return (
    <div className="glass-card flex-1 max-h-[850px] max-w-2xl flex flex-col overflow-hidden relative group self-start shadow-2xl">
      <div className="p-4 border-b border-card-border flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            AI Visual Engine
            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse shadow-[0_0_8px_var(--accent-primary)]" />
          </h2>
          <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-0.5">Orchestrating visual strategy</p>
        </div>
        {imageUrl && !isLoading && (
          <button onClick={onRefresh} className="glass-button p-1.5 group/btn">
            <RefreshCw className="w-3.5 h-3.5 text-foreground/60 group-hover/btn:rotate-180 transition-all duration-500" />
          </button>
        )}
      </div>

      <div className="relative flex-1 bg-black/40 flex items-center justify-center overflow-hidden min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-center p-8 max-w-xs">
            <div className="relative">
                <Loader2 className="w-10 h-10 text-accent-primary animate-spin" />
                <Sparkles className="w-3 h-3 text-accent-secondary absolute top-0 right-0 animate-bounce" />
            </div>
            <p className="font-medium text-base leading-tight tracking-tight">
                {status || "Synthesizing creative manifest..."}
            </p>
            <div className="w-full h-1 bg-foreground/5 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary w-2/3 animate-pulse" />
            </div>
          </div>
        ) : imageUrl ? (
           <div className="w-full h-full relative group/img overflow-hidden flex flex-col items-center justify-center p-4">
              <div className="flex-1 w-full relative flex items-center justify-center min-h-0">
                <img 
                  src={imageUrl} 
                  alt="AI Generated Content" 
                  className="max-w-full max-h-[400px] object-contain rounded-lg shadow-2xl transition-transform duration-1000 group-hover/img:scale-105"
                />
              </div>

              <div className="w-full mt-6">
                 <div className="flex justify-between items-center bg-card/50 backdrop-blur-xl p-4 rounded-xl border border-card-border">
                    <p className="text-sm font-medium">Was this visual brand-aligned?</p>
                    <div className="flex gap-2">
                        <button 
                            onClick={onSave}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/10 hover:bg-foreground/20 text-foreground/80 text-xs font-bold transition-all"
                        >
                            <Library className="w-4 h-4" />
                            SAVE TO HUB
                        </button>
                        <button 
                            onClick={(e) => {
                              onFeedback?.(true);
                              (e.currentTarget as any).disabled = true;
                              (e.currentTarget.parentElement as any).innerHTML = '<span class="text-accent-primary text-xs font-bold animate-pulse">THANK YOU!</span>';
                            }}
                            className="p-2 rounded-lg bg-accent-primary/20 hover:bg-accent-primary/30 text-accent-primary transition-colors"
                        >
                            <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={(e) => {
                              onFeedback?.(false);
                              (e.currentTarget as any).disabled = true;
                              (e.currentTarget.parentElement as any).innerHTML = '<span class="text-red-400 text-xs font-bold animate-pulse">NOTED</span>';
                            }}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-colors"
                        >
                            <ThumbsDown className="w-4 h-4" />
                        </button>
                    </div>
                 </div>
              </div>
           </div>
        ) : (
          <div className="flex flex-col items-center gap-4 opacity-20">
            <ImageIcon className="w-20 h-20" />
            <p className="font-bold text-xl uppercase tracking-tighter">Awaiting Generation</p>
          </div>
        )}
      </div>

    </div>
  );
};
