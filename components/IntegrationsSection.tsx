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
  X
} from "lucide-react";
import { fetchApiKeys, generateApiKey, API_BASE_URL, type ApiKey } from "@/services/api";

interface IntegrationsSectionProps {
  brandId: string;
}

type SnippetTab = "wordpress" | "html" | "react";

/** Code editor-style block with filename header, line numbers, and copy button */
const CodeBlock = ({
  filename,
  code,
  language,
  onCopy,
  isCopied,
}: {
  filename: string;
  code: string;
  language: string;
  onCopy: () => void;
  isCopied: boolean;
}) => {
  const lines = code.split("\n");
  return (
    <div className="rounded-xl border border-card-border overflow-hidden">
      {/* Editor Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e1e2e] border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-[11px] font-mono text-white/40 ml-2">{filename}</span>
        </div>
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 text-[11px] font-mono text-white/30 hover:text-white/70 transition-colors px-2 py-1 rounded hover:bg-white/5"
        >
          {isCopied ? (
            <>
              <Check className="w-3 h-3 text-green-400" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> Copy
            </>
          )}
        </button>
      </div>
      {/* Editor Body */}
      <div className="bg-[#11111b] overflow-x-auto">
        <table className="w-full">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="hover:bg-white/[0.02]">
                <td className="px-4 py-0 text-right select-none text-[11px] font-mono text-white/15 w-[1%] whitespace-nowrap align-top leading-[1.7]">
                  {i + 1}
                </td>
                <td className="px-4 py-0 text-[12px] font-mono text-[#cdd6f4] whitespace-pre leading-[1.7]">
                  {line || " "}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const IntegrationsSection = ({ brandId }: IntegrationsSectionProps) => {
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRollWarning, setShowRollWarning] = useState(false);
  const [activeSnippet, setActiveSnippet] = useState<SnippetTab | null>(null);

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

  const userKey = apiKey?.key || "YOUR_API_KEY";

  const htmlSnippet = `<div id="content-agent-feed" data-api-key="${userKey}"></div>
<script src="${API_BASE_URL}/integrations/html-embed/embed.js"></script>`;

  const reactSnippet = `// hooks/useContentAgent.ts
// Copy this hook into your project

import { useState, useEffect } from "react";

const API_URL = "${API_BASE_URL}/api/v1/public";

interface Blog {
  id: string;
  title: string;
  full_markdown: string;
  metadata: any;
  created_at: string;
  slug: string; // Helper for routing
}

export function useContentAgent(apiKey: string, slug?: string) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        if (slug) {
          // Fetch single blog
          const response = await fetch(\`\${API_URL}/blogs/\${slug}\`, {
            headers: { "X-Content-Agent-Key": apiKey },
          });

          if (!response.ok)
            throw new Error(\`Failed to fetch blog: \${response.status}\`);

          const data = await response.json();
          setBlog(data);
        } else {
          // Fetch list
          const response = await fetch(\`\${API_URL}/blogs\`, {
            headers: { "X-Content-Agent-Key": apiKey },
          });

          if (!response.ok)
            throw new Error(\`Failed to fetch blogs: \${response.status}\`);

          const data = await response.json();
          setBlogs(data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [apiKey, slug]);

  return { blogs, blog, loading, error };
}

// --- Usage in a component (List) ---
// const { blogs } = useContentAgent("${userKey}");

// --- Usage in a component (Single) ---
// const { blog } = useContentAgent("${userKey}", "my-blog-slug");`;

  const wordpressInstructions = `1. Download the Content Agent WordPress plugin.
2. Go to WordPress Admin → Plugins → Add New → Upload Plugin.
3. Activate the plugin and navigate to Settings → Content Agent.
4. Paste your API Key: ${userKey}
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

      {/* Integration Snippets Section */}
      <div className="glass-card p-6 space-y-5">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Blocks className="w-5 h-5 text-accent-secondary" />
          Integration Snippets
        </h3>

        {/* Snippet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* HTML / JS Embed Card */}
          <button
            onClick={() => setActiveSnippet("html")}
            className="group text-left glass-card p-5 space-y-3 hover:border-accent-primary/30 hover:shadow-[0_0_20px_var(--accent-glow)] transition-all duration-300 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-orange-400" />
            </div>
            <h4 className="font-bold text-sm text-foreground">HTML / JS Embed</h4>
            <p className="text-xs text-foreground/40 leading-relaxed">
              Copy &amp; paste a snippet into any website&apos;s body tag.
            </p>
            <span className="text-[10px] font-mono text-accent-primary tracking-widest uppercase group-hover:tracking-[0.3em] transition-all">
              VIEW CODE →
            </span>
          </button>

          {/* React / Next.js Card */}
          <button
            onClick={() => setActiveSnippet("react")}
            className="group text-left glass-card p-5 space-y-3 hover:border-accent-primary/30 hover:shadow-[0_0_20px_var(--accent-glow)] transition-all duration-300 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Blocks className="w-5 h-5 text-cyan-400" />
            </div>
            <h4 className="font-bold text-sm text-foreground">React / Next.js</h4>
            <p className="text-xs text-foreground/40 leading-relaxed">
              A ready-to-use hook you can drop into any React project.
            </p>
            <span className="text-[10px] font-mono text-accent-primary tracking-widest uppercase group-hover:tracking-[0.3em] transition-all">
              VIEW CODE →
            </span>
          </button>

          {/* WordPress Card */}
          <button
            onClick={() => setActiveSnippet("wordpress")}
            className="group text-left glass-card p-5 space-y-3 hover:border-accent-primary/30 hover:shadow-[0_0_20px_var(--accent-glow)] transition-all duration-300 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-blue-400" />
            </div>
            <h4 className="font-bold text-sm text-foreground">WordPress</h4>
            <p className="text-xs text-foreground/40 leading-relaxed">
              Download the plugin and configure it with your API key.
            </p>
            <span className="text-[10px] font-mono text-accent-primary tracking-widest uppercase group-hover:tracking-[0.3em] transition-all">
              VIEW SETUP →
            </span>
          </button>
        </div>

        {!apiKey && (
          <p className="text-xs text-foreground/30 font-mono text-center pt-2">
            Generate an API key above to auto-fill the snippets.
          </p>
        )}
      </div>

      {/* Snippet Modal */}
      {activeSnippet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={() => setActiveSnippet(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal Content */}
          <div
            className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#181825] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                {activeSnippet === "html" && <Globe className="w-5 h-5 text-orange-400" />}
                {activeSnippet === "react" && <Blocks className="w-5 h-5 text-cyan-400" />}
                {activeSnippet === "wordpress" && <Code2 className="w-5 h-5 text-blue-400" />}
                <h3 className="font-bold text-white text-sm">
                  {activeSnippet === "html" && "HTML / JS Embed"}
                  {activeSnippet === "react" && "React / Next.js Hook"}
                  {activeSnippet === "wordpress" && "WordPress Plugin Setup"}
                </h3>
              </div>
              <button
                onClick={() => setActiveSnippet(null)}
                className="text-white/30 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-4">
              {activeSnippet === "html" && (
                <>
                  <p className="text-sm text-white/50 leading-relaxed">
                    Paste this snippet into your website&apos;s <code className="text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded text-xs">&lt;body&gt;</code> tag to display your published blog feed.
                  </p>
                  <CodeBlock
                    filename="index.html"
                    language="html"
                    code={htmlSnippet}
                    onCopy={() => copyToClipboard(htmlSnippet, "html")}
                    isCopied={copied === "html"}
                  />
                </>
              )}

              {activeSnippet === "react" && (
                <>
                  <p className="text-sm text-white/50 leading-relaxed">
                    Copy this <code className="text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded text-xs">useContentAgent</code> hook into your project and use it in any component.
                  </p>
                  <CodeBlock
                    filename="hooks/useContentAgent.ts"
                    language="typescript"
                    code={reactSnippet}
                    onCopy={() => copyToClipboard(reactSnippet, "react")}
                    isCopied={copied === "react"}
                  />
                </>
              )}

              {activeSnippet === "wordpress" && (
                <>
                  <p className="text-sm text-white/50 leading-relaxed">
                    Download the plugin, install it on your WordPress site, and configure with your API key.
                  </p>
                  <a
                    href={`${API_BASE_URL}/api/v1/public/download/wordpress-plugin`}
                    download
                    className="inline-flex items-center gap-2 text-sm font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 px-5 py-3 rounded-xl transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download WordPress Plugin
                  </a>
                  <CodeBlock
                    filename="setup-instructions.txt"
                    language="text"
                    code={wordpressInstructions}
                    onCopy={() => copyToClipboard(wordpressInstructions, "wordpress")}
                    isCopied={copied === "wordpress"}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

