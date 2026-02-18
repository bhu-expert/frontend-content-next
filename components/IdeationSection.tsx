"use client";

import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostIdea } from "@/services/api";

interface IdeationCardProps {
  idea: PostIdea;
  index: number;
  isSelected?: boolean;
  onSelect: () => void;
}

export const IdeationCard = ({ idea, index, isSelected, onSelect }: IdeationCardProps) => {
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
          Post Idea #{index + 1}
        </span>
        {isSelected && <Sparkles className="w-4 h-4 text-accent-primary animate-pulse" />}
      </div>
      <h3 className="font-bold text-sm mb-3 leading-relaxed group-hover:glow-text transition-all duration-300 line-clamp-4">
        {idea.message.split('.')[0]}.
      </h3>
      <p className="text-[10px] text-foreground/30 font-mono line-clamp-2 uppercase tracking-tight">
        {idea.message.slice(0, 100)}...
      </p>
      
      <div className="flex items-center gap-2 text-xs font-medium text-accent-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
        VIEW DETAILS <ArrowRight className="w-3 h-3" />
      </div>
    </button>
  );
};

interface IdeationGridProps {
  ideas: PostIdea[];
  selectedId: number | null;
  onSelectIdea: (index: number) => void;
  isLoading?: boolean;
}

export const IdeationGrid = ({ ideas, selectedId, onSelectIdea, isLoading }: IdeationGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass-card h-40 animate-pulse bg-accent-primary/5 border border-accent-primary/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {ideas.map((idea, index) => (
        <IdeationCard
          key={index}
          idea={idea}
          index={index}
          isSelected={selectedId === index}
          onSelect={() => onSelectIdea(index)}
        />
      ))}
    </div>
  );
};
