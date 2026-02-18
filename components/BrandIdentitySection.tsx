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
    <div className="flex-1 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="glass-card overflow-hidden">
        <div className="p-8 border-b border-card-border bg-card/50">
          <h2 className="text-2xl font-bold mb-2 text-foreground">Brand Identity Matrix</h2>
          <p className="text-foreground/40 text-sm">Define the core parameters that drive the AI's creative engine.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            {fields.map((field) => (
              <div key={field.name} className="space-y-3">
                <label className="text-xs font-mono text-foreground/30 uppercase tracking-[0.2em] flex items-center gap-2">
                  <field.icon className="w-3 h-3 text-accent-primary" />
                  {field.label}
                </label>
                <input
                  type="text"
                  value={(formData as any)[field.name]}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full bg-card border border-card-border rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-accent-primary/50 transition-all font-medium placeholder:text-foreground/20 text-foreground"
                  required
                />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-mono text-foreground/30 uppercase tracking-[0.2em] flex items-center gap-2">
              <MessageSquare className="w-3 h-3 text-accent-secondary" />
              Core Manifesto / Purpose
            </label>
            <textarea
              value={formData.manifest}
              onChange={(e) => setFormData({ ...formData, manifest: e.target.value })}
              placeholder="What do you represent? Why do you exist? (e.g., We are not a clothing brand. We are a continuation of an idea...)"
              className="w-full bg-card border border-card-border rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-accent-primary/50 transition-all font-medium min-h-[200px] leading-relaxed placeholder:text-foreground/20 text-foreground"
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
