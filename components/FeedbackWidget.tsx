"use client";

import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, Send, Loader2, CheckCircle2 } from "lucide-react";
import { submitFeedback } from "@/services";
import { cn } from "@/lib/utils";

interface FeedbackWidgetProps {
  userId: string;
  brandId: string;
  prompt: string;
  className?: string;
}

export const FeedbackWidget = ({ userId, brandId, prompt, className }: FeedbackWidgetProps) => {
  const [liked, setLiked] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInteraction = (isLike: boolean) => {
    setLiked(isLike);
    setIsExpanded(true);
  };

  const handleSubmit = async () => {
    if (liked === null) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({
        user_id: userId,
        brand_id: brandId,
        prompt_used: prompt,
        liked,
        comment,
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsExpanded(false);
        setIsSuccess(false);
        setLiked(null);
        setComment("");
      }, 3000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      // Optional: show error state
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={cn("flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 animate-in fade-in zoom-in duration-300", className)}>
        <CheckCircle2 className="w-5 h-5" />
        <span className="text-sm font-bold uppercase tracking-wide">Feedback Received. Thank you!</span>
      </div>
    );
  }

  return (
    <div className={cn("glass-card p-6 space-y-4 transition-all duration-500 border border-card-border/50", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-foreground">Was this content helpful?</h4>
          <p className="text-xs text-foreground/40 mt-1">Help us improve the Learning Engine</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleInteraction(true)}
            className={cn(
              "p-3 rounded-xl transition-all border",
              liked === true
                ? "bg-green-500/20 text-green-500 border-green-500/50"
                : "bg-card hover:bg-green-500/10 hover:text-green-500 border-card-border text-foreground/60"
            )}
          >
            <ThumbsUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleInteraction(false)}
            className={cn(
              "p-3 rounded-xl transition-all border",
              liked === false
                ? "bg-red-500/20 text-red-500 border-red-500/50"
                : "bg-card hover:bg-red-500/10 hover:text-red-500 border-card-border text-foreground/60"
            )}
          >
            <ThumbsDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="pt-4 border-t border-card-border animate-in slide-in-from-top-2 fade-in duration-300 space-y-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience... (optional)"
            className="w-full bg-background/50 border border-card-border rounded-xl p-3 text-sm focus:ring-0 focus:border-accent-secondary/50 transition-all resize-none h-24 placeholder:text-foreground/20"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-accent-secondary hover:bg-accent-secondary/90 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              Send Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
