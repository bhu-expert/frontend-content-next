"use client";

import React from "react";
import { Film, Clock, Music, Hash, Video, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReelScriptIdea } from "@/services/api";

interface ReelScriptCardProps {
  script: ReelScriptIdea;
  index: number;
  isSelected?: boolean;
  onSelect: () => void;
}

export const ReelScriptCard = ({ script, index, isSelected, onSelect }: ReelScriptCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "text-left p-5 transition-all duration-500 group relative",
        "glass-card hover:bg-card/80",
        isSelected ? "ring-2 ring-accent-primary/50 bg-card/80" : "opacity-70 hover:opacity-100"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-mono text-foreground/40 tracking-widest uppercase">
          Script #{index + 1}
        </span>
        {isSelected && <Sparkles className="w-4 h-4 text-accent-primary animate-pulse" />}
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <Film className="w-3 h-3 text-pink-400" />
        <h3 className="font-bold text-sm mb-0 leading-relaxed group-hover:glow-text transition-all duration-300 line-clamp-1">
          {script.title}
        </h3>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-[10px] text-foreground/50">
          <Clock className="w-2.5 h-2.5" />
          <span>{script.duration_seconds}s duration</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-foreground/50">
          <Video className="w-2.5 h-2.5" />
          <span className="line-clamp-1">{script.camera_angle} · {script.pacing}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1 flex-wrap mb-3">
        {script.hashtags.slice(0, 3).map((tag, i) => (
          <span key={i} className="text-[9px] bg-pink-500/10 text-pink-400 px-1.5 py-0.5 rounded-full font-mono">
            {tag}
          </span>
        ))}
        {script.hashtags.length > 3 && (
          <span className="text-[9px] text-foreground/30">+{script.hashtags.length - 3}</span>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-xs font-medium text-accent-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
        VIEW FULL SCRIPT <ArrowRight className="w-3 h-3" />
      </div>
    </button>
  );
};

interface ReelScriptGridProps {
  scripts: ReelScriptIdea[];
  selectedId: number | null;
  onSelectScript: (index: number) => void;
  isLoading?: boolean;
}

export const ReelScriptGrid = ({ scripts, selectedId, onSelectScript, isLoading }: ReelScriptGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass-card h-48 animate-pulse bg-accent-primary/5 border border-accent-primary/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {scripts.map((script, index) => (
        <ReelScriptCard
          key={index}
          script={script}
          index={index}
          isSelected={selectedId === index}
          onSelect={() => onSelectScript(index)}
        />
      ))}
    </div>
  );
};

interface ReelScriptModalProps {
  script: ReelScriptIdea | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToQueue: () => void;
  index: number;
}

export const ReelScriptModal = ({ script, isOpen, onClose, onAddToQueue, index }: ReelScriptModalProps) => {
  if (!isOpen || !script) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-card-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Film className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{script.title}</h2>
                <p className="text-xs text-foreground/40 font-mono">Reel Script #{index + 1}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-foreground/40 hover:text-foreground transition-colors">
              ✕
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-card/50 rounded-xl p-3 border border-card-border">
              <Clock className="w-4 h-4 text-accent-primary mb-2" />
              <p className="text-[10px] text-foreground/40 uppercase tracking-wider">Duration</p>
              <p className="text-sm font-bold">{script.duration_seconds}s</p>
            </div>
            <div className="bg-card/50 rounded-xl p-3 border border-card-border">
              <Video className="w-4 h-4 text-accent-primary mb-2" />
              <p className="text-[10px] text-foreground/40 uppercase tracking-wider">Camera</p>
              <p className="text-sm font-bold">{script.camera_angle}</p>
            </div>
            <div className="bg-card/50 rounded-xl p-3 border border-card-border">
              <Music className="w-4 h-4 text-accent-primary mb-2" />
              <p className="text-[10px] text-foreground/40 uppercase tracking-wider">Pacing</p>
              <p className="text-sm font-bold">{script.pacing}</p>
            </div>
          </div>

          {/* Hook */}
          <div className="mb-6">
            <h3 className="text-xs font-mono text-accent-primary uppercase tracking-widest mb-2">Hook (0-3s)</h3>
            <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4">
              <p className="text-sm font-medium">{script.hook}</p>
            </div>
          </div>

          {/* Scene Description */}
          <div className="mb-6">
            <h3 className="text-xs font-mono text-accent-primary uppercase tracking-widest mb-2">Scene Description</h3>
            <div className="bg-card/50 border border-card-border rounded-xl p-4">
              <p className="text-sm text-foreground/80">{script.scene_description}</p>
            </div>
          </div>

          {/* Voiceover/Dialogue */}
          <div className="mb-6">
            <h3 className="text-xs font-mono text-accent-primary uppercase tracking-widest mb-2">Voiceover / Dialogue</h3>
            <div className="bg-card/50 border border-card-border rounded-xl p-4">
              <p className="text-sm text-foreground/80">{script.voiceover_dialogue}</p>
            </div>
          </div>

          {/* Text Overlay & Transitions */}
          {(script.text_overlay || script.transitions) && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {script.text_overlay && (
                <div>
                  <h3 className="text-xs font-mono text-accent-primary uppercase tracking-widest mb-2">Text Overlay</h3>
                  <div className="bg-card/50 border border-card-border rounded-xl p-3">
                    <p className="text-sm text-foreground/80">{script.text_overlay}</p>
                  </div>
                </div>
              )}
              {script.transitions && (
                <div>
                  <h3 className="text-xs font-mono text-accent-primary uppercase tracking-widest mb-2">Transitions</h3>
                  <div className="bg-card/50 border border-card-border rounded-xl p-3">
                    <p className="text-sm text-foreground/80">{script.transitions}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="mb-6">
            <h3 className="text-xs font-mono text-accent-primary uppercase tracking-widest mb-2">Call to Action</h3>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <p className="text-sm font-medium text-green-400">{script.cta}</p>
            </div>
          </div>

          {/* Audio Suggestion */}
          <div className="mb-6">
            <h3 className="text-xs font-mono text-accent-primary uppercase tracking-widest mb-2">Audio Suggestion</h3>
            <div className="flex items-center gap-2 bg-card/50 border border-card-border rounded-xl p-4">
              <Music className="w-4 h-4 text-purple-400" />
              <p className="text-sm text-foreground/80">{script.audio_suggestion}</p>
            </div>
          </div>

          {/* Hashtags */}
          <div className="mb-6">
            <h3 className="text-xs font-mono text-accent-primary uppercase tracking-widest mb-2">Hashtags</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {script.hashtags.map((tag, i) => (
                <div key={i} className="flex items-center gap-1 bg-card/50 border border-card-border rounded-full px-3 py-1">
                  <Hash className="w-3 h-3 text-foreground/40" />
                  <span className="text-xs">{tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-card-border">
            <button
              onClick={onAddToQueue}
              className="flex-1 bg-accent-primary text-white font-bold py-3 rounded-xl hover:bg-accent-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Add to Queue
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-card-border hover:bg-card/50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
