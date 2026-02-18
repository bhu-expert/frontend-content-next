"use client";

import React, { useState } from "react";
import { Palette, Target, Zap, Globe, MessageSquare, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Brand } from "@/services/api";

interface BrandIdentitySectionProps {
  brand: Brand | null;
  onSubmit: (data: Omit<Brand, "id">) => void;
}

export const BrandIdentitySection = ({ brand, onSubmit }: BrandIdentitySectionProps) => {
  const [formData, setFormData] = useState({
    name: brand?.name || "",
    industry: brand?.industry || "",
    target_audience: brand?.target_audience || "",
    visual_style: brand?.visual_style || "",
    tone_of_voice: brand?.tone_of_voice || "",
    manifest: brand?.manifest || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const fields = [
    { name: "name", label: "Brand Name", icon: Globe, placeholder: "e.g., REBEL CLOTHING" },
    { name: "industry", label: "Industry", icon: Zap, placeholder: "e.g., Streetwear" },
    { name: "target_audience", label: "Target Audience", icon: Target, placeholder: "e.g., Gen-Z Revolutionaries" },
    { name: "visual_style", label: "Visual Aesthetic", icon: Palette, placeholder: "e.g., Gritty, High-Contrast, Minimalist" },
    { name: "tone_of_voice", label: "Tone of Voice", icon: MessageSquare, placeholder: "e.g., Bold, Unapologetic, Direct" },
  ];

  return (
    <div className="flex-1 max-w-4xl py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="glass-card overflow-hidden border-card-border/40 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] bg-card">
        <div className="p-8 border-b border-card-border/50 bg-gradient-to-br from-card to-card/30">
          <h2 className="text-2xl font-bold mb-2 text-foreground flex items-center gap-3">
            <span className="w-2 h-8 bg-accent-primary rounded-full" />
            Brand Identity Matrix
          </h2>
          <p className="text-foreground/60 text-sm font-medium ml-5">Define the core parameters that drive the AI's creative engine.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            {fields.map((field) => (
              <div key={field.name} className="space-y-3 group/field">
                <label className="text-[10px] font-mono text-foreground/70 uppercase tracking-[0.2em] flex items-center gap-2 group-focus-within/field:text-accent-primary transition-colors">
                  <field.icon className="w-3 h-3 transition-transform group-focus-within/field:scale-110" />
                  {field.label}
                </label>
                <input
                  type="text"
                  value={(formData as any)[field.name]}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full bg-background border-2 border-card-border/60 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10 transition-all font-medium placeholder:text-foreground/30 text-foreground shadow-sm"
                  required
                />
              </div>
            ))}
          </div>

          <div className="space-y-3 group/field">
            <label className="text-[10px] font-mono text-foreground/70 uppercase tracking-[0.2em] flex items-center gap-2 group-focus-within/field:text-accent-secondary transition-colors">
              <MessageSquare className="w-3 h-3 transition-transform group-focus-within/field:scale-110" />
              Core Manifesto / Purpose
            </label>
            <textarea
              value={formData.manifest}
              onChange={(e) => setFormData({ ...formData, manifest: e.target.value })}
              placeholder="What do you represent? Why do you exist? (e.g., We are not a clothing brand. We are a continuation of an idea...)"
              className="w-full bg-background border-2 border-card-border/60 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-accent-secondary focus:ring-4 focus:ring-accent-secondary/10 transition-all font-medium min-h-[200px] leading-relaxed placeholder:text-foreground/30 text-foreground shadow-sm"
              required
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="glass-button bg-accent-primary text-white font-bold py-4 px-10 flex items-center gap-3 hover:shadow-[0_0_30px_var(--accent-primary)] group transition-all"
            >
              <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
              SYNCHRONIZE IDENTITY
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
