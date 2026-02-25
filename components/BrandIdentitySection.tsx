"use client";

import React, { useState, useEffect } from "react";
import {
  Palette,
  Target,
  Zap,
  Globe,
  MessageSquare,
  Save,
  Search,
  Check,
  AlertCircle,
  RefreshCw,
  FileText,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  triggerBrandScan,
  fetchBrandScanStatus,
  fetchBrandScanPreview,
  applyBrandScan,
  type Brand,
} from "@/services/api";
import { DynamicRenderer } from "./DynamicRenderer";

interface BrandIdentitySectionProps {
  brand: Brand | null;
  onSubmit: (data: Omit<Brand, "id">) => void;
}

export const BrandIdentitySection = ({
  brand,
  onSubmit,
}: BrandIdentitySectionProps) => {
  const [formData, setFormData] = useState({
    name: brand?.name || "",
    industry: brand?.industry || "",
    target_audience: brand?.target_audience || "",
    visual_style: brand?.visual_style || "",
    tone_of_voice: brand?.tone_of_voice || "",
    website_url: brand?.website_url || "",
    manifest: brand?.manifest || "",
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [isScanPanelOpen, setIsScanPanelOpen] = useState(false);
  const [hasCachedScan, setHasCachedScan] = useState(false);

  useEffect(() => {
    // Check if there's already a completed scan we can preview, but do NOT auto-open the panel.
    const checkExistingScan = async () => {
      if (brand?.id) {
        try {
          const status = await fetchBrandScanStatus(brand.id);
          if (status.data?.scrape_status === "success") {
            const preview = await fetchBrandScanPreview(brand.id);
            if (preview) {
              setPreviewData(preview);
            }
          }
        } catch (e) {
          console.log("No existing scan found.");
        }
      }
    };
    checkExistingScan();
  }, [brand?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Full scan flow: triggers the scraper + extraction pipeline
  const runFullScan = async (brandId: string, url: string) => {
    setIsScanning(true);
    setScanStatus("Initializing scan... (this can take 1-2 minutes)");
    setPreviewData(null);
    setHasCachedScan(false);
    try {
      await triggerBrandScan(brandId, url);

      const pollInterval = setInterval(async () => {
        try {
          const res = await fetchBrandScanStatus(brandId);
          const status = res.data?.scrape_status;

          if (status === "success" || status === "failed") {
            clearInterval(pollInterval);
            setIsScanning(false);
            setScanStatus(
              status === "success" ? "Scan Complete!" : "Scan Failed.",
            );
            if (status === "success") {
              const preview = await fetchBrandScanPreview(brandId);
              setPreviewData(preview);
              setHasCachedScan(true);
            }
          } else {
            setScanStatus(`Status: ${status}...`);
          }
        } catch (e) {
          // ignore occasional fetch errors during polling
        }
      }, 5000);
    } catch (e: any) {
      console.error(e);
      setScanStatus(`Error: ${e.message}`);
      setIsScanning(false);
    }
  };

  // Smart scan: check cache first, only trigger full scan if no data exists
  const handleScan = async () => {
    if (!brand?.id) {
      alert("Please establish the identity (Save) first before scanning.");
      return;
    }
    if (!formData.website_url) {
      alert("Please enter a Website URL to scan.");
      return;
    }

    setIsScanPanelOpen(true);

    // Check if we already have a successful scan
    try {
      const statusRes = await fetchBrandScanStatus(brand.id);
      if (statusRes.data?.scrape_status === "success") {
        // Cached data exists — just fetch and display it
        setScanStatus("Loaded from previous scan");
        const preview = await fetchBrandScanPreview(brand.id);
        if (preview) {
          setPreviewData(preview);
          setHasCachedScan(true);
          return; // skip full scan
        }
      }
    } catch (e) {
      console.log("No cached scan found, proceeding with full scan.");
    }

    // No cached data — run a full scan
    await runFullScan(brand.id, formData.website_url);
  };

  // Rescan: always triggers a fresh full scan
  const handleRescan = async () => {
    if (!brand?.id || !formData.website_url) return;
    setIsScanPanelOpen(true);
    await runFullScan(brand.id, formData.website_url);
  };

  const handleApplyScan = async () => {
    if (!brand?.id || !previewData) return;
    try {
      // Passing empty array means it will fill missing fields based on backend logic
      // Or we ask backend to overwrite. Let's send up datable fields.
      await applyBrandScan(
        brand.id,
        [
          "name",
          "industry",
          "target_audience",
          "visual_style",
          "tone_of_voice",
          "manifest",
        ],
        formData.website_url,
      );
      alert(
        "Applied to Brand Identity! Please refresh the page or click Strategy Tab to see updates.",
      );
    } catch (e: any) {
      alert(`Apply failed: ${e.message}`);
    }
  };

  const fields = [
    {
      name: "name",
      label: "Brand Name",
      icon: Globe,
      placeholder: "e.g., REBEL CLOTHING",
    },
    {
      name: "industry",
      label: "Industry",
      icon: Zap,
      placeholder: "e.g., Streetwear",
    },
    {
      name: "target_audience",
      label: "Target Audience",
      icon: Target,
      placeholder: "e.g., Gen-Z Revolutionaries",
    },
    {
      name: "visual_style",
      label: "Visual Aesthetic",
      icon: Palette,
      placeholder: "e.g., Gritty, High-Contrast, Minimalist",
    },
    {
      name: "tone_of_voice",
      label: "Tone of Voice",
      icon: MessageSquare,
      placeholder: "e.g., Bold, Unapologetic, Direct",
    },
  ];

  return (
    <div
      className={cn(
        "flex w-full animate-in fade-in slide-in-from-bottom-4 h-[calc(100vh-4.5rem)] duration-700 overflow-hidden gap-8",
      )}
    >
      {/* LEFT COLUMN: IDENTITY FORM */}
      <div
        className={cn(
          "flex flex-col transition-all duration-500 h-full min-h-0",
          isScanPanelOpen ? "w-[50%]" : "w-[50%]",
        )}
      >
        <div className="glass-card overflow-hidden border-card-border/40 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] bg-card flex flex-col flex-1 min-h-0">
          <div className="p-8 border-b border-card-border/50 bg-gradient-to-br from-card to-card/30 shrink-0">
            <h2 className="text-2xl font-bold mb-2 text-foreground flex items-center gap-3">
              <span className="w-2 h-8 bg-accent-primary rounded-full" />
              Brand Identity Matrix
            </h2>
            <p className="text-foreground/60 text-sm font-medium ml-5">
              Define the core parameters that drive the AI's creative engine.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-8 space-y-8 flex-1 overflow-y-auto"
          >
            {/* Website URL + Scan Button Row */}
            <div className="space-y-3 group/field">
              <label className="text-[10px] font-mono text-foreground/70 uppercase tracking-[0.2em] flex items-center gap-2 group-focus-within/field:text-accent-primary transition-colors">
                <Globe className="w-3 h-3" />
                Website URL
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={formData.website_url}
                  onChange={(e) =>
                    setFormData({ ...formData, website_url: e.target.value })
                  }
                  placeholder="e.g., https://rebelclothing.com"
                  className="w-full  bg-background border-2 border-card-border/60 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10 transition-all font-medium placeholder:text-foreground/30 text-foreground shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={isScanning || !brand}
                  className="glass-button bg-accent-secondary/10 border-accent-secondary/30 text-accent-secondary font-bold px-6 flex items-center gap-2 hover:bg-accent-secondary/20 transition-all disabled:opacity-50"
                >
                  {isScanning ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {isScanning ? "SCANNING" : "Scan Site"}
                </button>
              </div>
              {!brand && (
                <p className="text-xs text-foreground/40 italic">
                  You must save the brand before scanning.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {fields.map((field) => (
                <div key={field.name} className="space-y-3 group/field">
                  <label className="text-[10px] font-mono text-foreground/70 uppercase tracking-[0.2em] flex items-center gap-2 group-focus-within/field:text-accent-primary transition-colors">
                    <field.icon className="w-3 h-3 transition-transform group-focus-within/field:scale-110" />
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={(formData as any)[field.name]}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.name]: e.target.value })
                    }
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
                onChange={(e) =>
                  setFormData({ ...formData, manifest: e.target.value })
                }
                placeholder="What do you represent? Why do you exist? (e.g., We are not a clothing brand. We are a continuation of an idea...)"
                className="w-full bg-background border-2 border-card-border/60 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-accent-secondary focus:ring-4 focus:ring-accent-secondary/10 transition-all font-medium min-h-[80px] leading-relaxed placeholder:text-foreground/30 text-foreground shadow-sm"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
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

      {/* RIGHT COLUMN: SCAN PREVIEW */}
      {isScanPanelOpen && (
        <div className="w-[50%] flex flex-col min-h-0 h-full animate-in slide-in-from-right-8 duration-500">
          <div className="glass-card flex-1 min-h-0 overflow-hidden border-card-border/40 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] bg-card flex flex-col">
            <div className="p-8 border-b border-card-border/50 bg-gradient-to-br from-card to-card/30 shrink-0 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1 text-foreground flex items-center gap-2">
                  Intelligence Extractor
                </h2>
                <p className="text-foreground/60 text-xs font-medium">
                  Deep-scan analysis results.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Rescan Button */}
                {hasCachedScan && !isScanning && (
                  <button
                    type="button"
                    onClick={handleRescan}
                    className="px-4 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-xs font-bold text-accent-primary flex items-center gap-2 hover:bg-accent-primary/20 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    RESCAN SITE
                  </button>
                )}

                {/* Status Badge */}
                {(isScanning || scanStatus) && (
                  <div className="px-3 py-1.5 rounded-full bg-accent-secondary/10 border border-accent-secondary/20 text-xs font-mono text-accent-secondary flex items-center gap-2">
                    {isScanning && (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    )}
                    {scanStatus}
                  </div>
                )}
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsScanPanelOpen(false)}
                  className="p-2 rounded-full hover:bg-muted/20 transition-colors"
                >
                  <X className="w-4 h-4 text-foreground/60 hover:text-foreground" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-background/50 relative">
              {!previewData && !isScanning && !scanStatus && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-foreground/30">
                  <Search className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-mono tracking-widest uppercase">
                    No Intelligence Data
                  </p>
                </div>
              )}

              {isScanning && !previewData && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-accent-secondary">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-accent-secondary/20 rounded-full animate-pulse" />
                    <div className="absolute inset-0 border-4 border-t-accent-secondary rounded-full animate-spin" />
                  </div>
                  <p className="text-xs font-mono tracking-widest uppercase animate-pulse">
                    Running Neural Extraction...
                  </p>
                </div>
              )}

              {previewData && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                  <DynamicRenderer data={previewData} />
                </div>
              )}
            </div>

            {/* Apply Footer */}
            {previewData && (
              <div className="p-6 border-t border-card-border/50 shrink-0 flex justify-end bg-gradient-to-t from-card to-card/50">
                <button
                  type="button"
                  onClick={handleApplyScan}
                  className="glass-button bg-accent-primary text-white font-bold py-3 px-8 flex items-center gap-2 hover:shadow-[0_0_20px_var(--accent-primary)] transition-all"
                >
                  <Check className="w-4 h-4" />
                  APPLY TO IDENTITY
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
