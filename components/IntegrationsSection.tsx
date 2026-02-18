"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  Code2,
  Globe,
  Blocks,
  Loader2,
} from "lucide-react";
import { fetchApiKeys, generateApiKey, type ApiKey } from "@/services/api";

interface IntegrationsSectionProps {
  brandId: string;
}

type SnippetTab = "wordpress" | "html" | "react";

export const IntegrationsSection = ({ brandId }: IntegrationsSectionProps) => {
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRollWarning, setShowRollWarning] = useState(false);
  const [activeSnippet, setActiveSnippet] = useState<SnippetTab>("html");

  const loadKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const keys = await fetchApiKeys(brandId);
      setApiKey(keys.length > 0 ? keys[0] : null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleGenerate = async () => {
    if (apiKey && !showRollWarning) {
      setShowRollWarning(true);
      return;
    }
    setShowRollWarning(false);
    setIsGenerating(true);
    setError(null);
    try {
      const newKey = await generateApiKey(brandId);
      setApiKey(newKey);
      setShowKey(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const maskedKey = apiKey
    ? `${apiKey.key.slice(0, 8)}${"•".repeat(16)}${apiKey.key.slice(-4)}`
    : "";

  const displayKey = apiKey ? (showKey ? apiKey.key : maskedKey) : "";

  const htmlSnippet = `<div id="content-agent-feed" data-api-key="${apiKey?.key || "YOUR_API_KEY"}"></div>
<script src="${process.env.NEXT_PUBLIC_API_URL}/integrations/html-embed/embed.js"></script>`;

  const reactSnippet = `// hooks/useContentAgent.ts
// Copy this hook into your project

import { useState, useEffect } from "react";

const API_URL = "${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/blogs";

interface Blog {
  title: string;
  slug: string;
  full_markdown: string;
  metadata: { meta_title: string; meta_description: string; keywords: string[] };
}

export function useContentAgent(apiKey: string) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(API_URL, {
      headers: { "X-Content-Agent-Key": apiKey },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch blogs");
        return res.json();
      })
      .then((data) => setBlogs(data.data ?? data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [apiKey]);

  return { blogs, loading, error };
}

// --- Usage in a component ---
// import { useContentAgent } from "./hooks/useContentAgent";
//
// const BlogFeed = () => {
//   const { blogs, loading, error } = useContentAgent("${apiKey?.key || "YOUR_API_KEY"}");
//   if (loading) return <p>Loading...</p>;
//   if (error) return <p>Error: {error}</p>;
//   return (
//     <div>
//       {blogs.map(blog => (
//         <article key={blog.slug}>
//           <h2>{blog.title}</h2>
//         </article>
//       ))}
//     </div>
//   );
// };`;

  const wordpressInstructions = `1. Download the Content Agent WordPress plugin.
2. Go to WordPress Admin → Plugins → Add New → Upload Plugin.
3. Activate the plugin and navigate to Settings → Content Agent.
4. Paste your API Key: ${apiKey?.key || "YOUR_API_KEY"}
5. Configure display options and save.`;

  const SNIPPET_TABS: { id: SnippetTab; label: string; icon: React.ElementType }[] = [
    { id: "html", label: "HTML / JS Embed", icon: Globe },
    { id: "react", label: "React / Next.js", icon: Blocks },
    { id: "wordpress", label: "WordPress", icon: Code2 },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Code2 className="w-5 h-5 text-accent-primary" />
          <span className="text-xs font-mono font-medium tracking-[0.2em] text-accent-primary uppercase">
            Developer Tools
          </span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-1">
          <span className="glow-text">Integrations</span>
        </h2>
        <p className="text-foreground/40 text-sm max-w-lg">
          Connect your published content to any website or application using your API key.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* API Key Management Card */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Key className="w-5 h-5 text-accent-primary" />
            API Key
          </h3>
          {apiKey && (
            <span className="text-[10px] font-mono text-foreground/30 tracking-widest uppercase">
              Created {new Date(apiKey.created_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 py-6 justify-center text-foreground/40">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-mono">Loading key...</span>
          </div>
        ) : apiKey ? (
          <div className="space-y-4">
            {/* Key Display */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-background border border-card-border rounded-xl px-4 py-3 font-mono text-sm text-foreground/80 tracking-wide overflow-x-auto">
                {displayKey}
              </div>
              <button
                onClick={() => setShowKey(!showKey)}
                className="p-2.5 rounded-xl border border-card-border hover:border-accent-primary/40 hover:bg-accent-primary/5 transition-all text-foreground/50 hover:text-accent-primary"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => copyToClipboard(apiKey.key, "api-key")}
                className="p-2.5 rounded-xl border border-card-border hover:border-accent-primary/40 hover:bg-accent-primary/5 transition-all text-foreground/50 hover:text-accent-primary"
                title="Copy key"
              >
                {copied === "api-key" ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Roll Warning */}
            {showRollWarning && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl p-4 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1">Warning: This will revoke your current key</p>
                  <p className="text-yellow-400/70 text-xs leading-relaxed">
                    Any integrations using the old key will stop working immediately.
                    Click the button again to confirm.
                  </p>
                </div>
              </div>
            )}

            {/* Roll Key Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="glass-button flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-accent-primary hover:border-accent-primary/30 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {showRollWarning ? "CONFIRM ROLL KEY" : "ROLL API KEY"}
            </button>
          </div>
        ) : (
          /* No Key — Generate */
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 bg-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <Key className="w-7 h-7 text-accent-primary/60" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/60 mb-1">No API key yet</p>
              <p className="text-xs text-foreground/30">Generate a key to start integrating your content.</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="glass-button bg-accent-primary/10 border-accent-primary/20 text-accent-primary hover:bg-accent-primary/20 font-bold text-sm px-6 py-3 hover:shadow-[0_0_20px_var(--accent-glow)] disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Generating...
                </>
              ) : (
                "GENERATE API KEY"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Integration Instructions Card */}
      <div className="glass-card p-6 space-y-5">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Blocks className="w-5 h-5 text-accent-secondary" />
          Integration Snippets
        </h3>

        {/* Snippet Tabs */}
        <div className="flex gap-1 bg-background/50 border border-card-border rounded-xl p-1">
          {SNIPPET_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSnippet(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-300 ${
                activeSnippet === tab.id
                  ? "bg-accent-primary/10 text-accent-primary shadow-[0_0_15px_var(--accent-glow)]"
                  : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Snippet Content */}
        <div className="relative">
          {activeSnippet === "html" && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <p className="text-sm text-foreground/50 leading-relaxed">
                Paste this snippet into your website&apos;s <code className="text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded text-xs">&lt;body&gt;</code> tag to display your published blog feed.
              </p>
              <div className="relative group">
                <pre className="bg-background border border-card-border rounded-xl p-4 text-xs font-mono text-foreground/70 overflow-x-auto leading-relaxed">
                  <code>{htmlSnippet}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(htmlSnippet, "html")}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-card border border-card-border text-foreground/40 hover:text-accent-primary hover:border-accent-primary/30 transition-all opacity-0 group-hover:opacity-100"
                >
                  {copied === "html" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {activeSnippet === "react" && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <p className="text-sm text-foreground/50 leading-relaxed">
                Use the <code className="text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded text-xs">useContentAgent</code> hook in your React or Next.js application.
              </p>
              <div className="relative group">
                <pre className="bg-background border border-card-border rounded-xl p-4 text-xs font-mono text-foreground/70 overflow-x-auto leading-relaxed">
                  <code>{reactSnippet}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(reactSnippet, "react")}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-card border border-card-border text-foreground/40 hover:text-accent-primary hover:border-accent-primary/30 transition-all opacity-0 group-hover:opacity-100"
                >
                  {copied === "react" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {activeSnippet === "wordpress" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="text-sm text-foreground/50 leading-relaxed">
                Install the Content Agent WordPress plugin and enter your API key in the settings.
              </p>

              {/* Download Plugin Button */}
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/download/wordpress-plugin`}
                download
                className="glass-button inline-flex items-center gap-2 text-sm font-bold bg-accent-primary/10 border-accent-primary/20 text-accent-primary hover:bg-accent-primary/20 hover:shadow-[0_0_15px_var(--accent-glow)] px-5 py-3 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download WordPress Plugin
              </a>

              <div className="relative group">
                <pre className="bg-background border border-card-border rounded-xl p-4 text-xs font-mono text-foreground/70 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  <code>{wordpressInstructions}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(wordpressInstructions, "wordpress")}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-card border border-card-border text-foreground/40 hover:text-accent-primary hover:border-accent-primary/30 transition-all opacity-0 group-hover:opacity-100"
                >
                  {copied === "wordpress" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {!apiKey && (
          <p className="text-xs text-foreground/30 font-mono text-center pt-2">
            Generate an API key above to auto-fill the snippets.
          </p>
        )}
      </div>
    </div>
  );
};
