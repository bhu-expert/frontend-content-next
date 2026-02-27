"use client";

import React from "react";
import { X, Sparkles, Wand2, FileText, Layout } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostIdea } from "@/services/api";

interface IdeaModalProps {
  idea: PostIdea | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const IdeaModal = ({
  idea,
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: IdeaModalProps) => {
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
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-xl tracking-tight">
                Post Concept Detail
              </h2>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.2em]">
                Strategic Visualization Node
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-white/30 uppercase tracking-widest">
              <Layout className="w-3 h-3 text-purple-400" />
              Conceptual Brief
            </div>
            <p className="text-lg font-medium leading-relaxed text-blue-50/90 italic">
              "{idea.message}"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <p className="text-[10px] font-mono text-white/20 uppercase mb-1">
                Tone
              </p>
              <p className="text-sm font-medium">Automatic Context Sync</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <p className="text-[10px] font-mono text-white/20 uppercase mb-1">
                Complexity
              </p>
              <p className="text-sm font-medium">High Fidelity</p>
            </div>
          </div>

          <div className="flex justify-end pt-4 gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              RETURN TO GRID
            </button>
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="glass-button bg-blue-500 text-white font-bold py-3 px-8 flex items-center gap-3 hover:shadow-[0_0_30px_#3b82f644] group transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  RENDERING...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  GENERATE HIGH-FIDELITY ASSET
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
