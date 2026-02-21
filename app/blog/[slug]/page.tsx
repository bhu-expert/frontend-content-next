"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { fetchBlogBySlug, SavedBlog } from "@/services/api";
import {
  ArrowLeft,
  Clock,
  Hash,
  Loader2,
  BookOpen,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeedbackWidget } from "@/components/FeedbackWidget";

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [blog, setBlog] = useState<SavedBlog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchBlogBySlug(slug);
        if (!data) {
          setError("This article could not be found.");
        } else {
          setBlog(data);
        }
      } catch (e: any) {
        setError(e.message ?? "Failed to load article.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug]);

  const readingTime = blog
    ? Math.ceil(blog.full_markdown.split(/\s+/).length / 200)
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Nav Bar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-card-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">

          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent-secondary" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-foreground/40">
              Editorial
            </span>
          </div>

          {blog && (
            <span className="text-[11px] font-mono text-foreground/30 uppercase tracking-widest hidden sm:block">
              {readingTime} min read
            </span>
          )}
        </div>
      </nav>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-accent-secondary/20 blur-3xl animate-pulse rounded-full" />
            <Loader2 className="w-12 h-12 text-accent-secondary animate-spin relative z-10" />
          </div>
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/30 animate-pulse">
            Loading Article...
          </p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">Article Not Found</h2>
            <p className="text-foreground/40 text-sm max-w-sm leading-relaxed">{error}</p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 bg-accent-secondary/10 border border-accent-secondary/30 rounded-xl text-accent-secondary text-sm font-bold hover:bg-accent-secondary/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      )}

      {/* Blog Content */}
      {!isLoading && blog && (
        <article className="max-w-4xl mx-auto px-6 pb-24">

          {/* Hero Section */}
          <header className="pt-16 pb-16 border-b border-card-border space-y-10">
            {/* Status Badge */}
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "text-[10px] px-3 py-1.5 rounded-full uppercase tracking-widest font-bold border",
                  blog.status === "published"
                    ? "bg-accent-secondary/10 text-accent-secondary border-accent-secondary/30"
                    : blog.status === "scheduled"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-foreground/5 text-foreground/30 border-foreground/10"
                )}
              >
                {blog.status}
              </span>
              <div className="flex items-center gap-1.5 text-foreground/30 text-[11px] font-mono">
                <Clock className="w-3 h-3" />
                <span>{readingTime} min read</span>
              </div>
              <div className="flex items-center gap-1.5 text-foreground/30 text-[11px] font-mono">
                <Clock className="w-3 h-3" />
                <span>
                   {blog.status === 'published' && blog.published_at
                      ? new Date(blog.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                      : new Date(blog.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                   }
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-[1.02] text-foreground">
              {blog.title}
            </h1>

            {/* Meta description */}
            {blog.metadata?.meta_description && (
              <p className="text-xl text-foreground/50 leading-relaxed font-medium max-w-2xl">
                {blog.metadata.meta_description}
              </p>
            )}

            {/* Keyword pills */}
            {blog.metadata?.keywords && blog.metadata.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {blog.metadata.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-card border border-card-border text-[10px] font-mono font-bold text-accent-primary/60 uppercase tracking-widest hover:border-accent-primary/30 hover:text-accent-primary transition-all"
                  >
                    <Hash className="w-2.5 h-2.5" />
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Cover Image */}
          {(blog.cover_image || blog.metadata?.cover_image) && (
            <div className="my-12 rounded-3xl overflow-hidden aspect-video relative border border-card-border shadow-2xl shadow-black/20">
              <img
                src={blog.cover_image || blog.metadata?.cover_image}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>
          )}

          {/* Blog Body */}
          <div className="blog-post-body mt-12">
            <ReactMarkdown>
              {blog.full_markdown.replace(/^\s*#\s+.+?(\n|$)/, "")}
            </ReactMarkdown>
          </div>

          <div className="mt-16 border-t border-card-border pt-10">
            <FeedbackWidget
              userId={blog.user_id}
              brandId={blog.brand_id}
              prompt={blog.title} // Using title as proxy for prompt context
              className="max-w-2xl mx-auto"
            />
          </div>

          {/* Footer Metadata Card */}
          <footer className="mt-20 pt-10 border-t border-card-border">
            <div className="bg-card border border-card-border rounded-2xl p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-foreground/30 font-mono">
                  Slug
                </p>
                <p className="text-sm font-mono text-accent-primary font-bold">
                  /{blog.metadata?.slug}
                </p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-foreground/30 font-mono">
                  SEO Title
                </p>
                <p className="text-sm text-foreground/70 font-medium leading-snug">
                  {blog.metadata?.meta_title}
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-foreground/30 hover:text-accent-secondary transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Dashboard
              </Link>
            </div>
          </footer>
        </article>
      )}

      <style jsx global>{`
        .blog-post-body h1 {
          font-size: 3rem;
          font-weight: 900;
          margin-bottom: 2rem;
          margin-top: 4rem;
          color: var(--foreground);
          letter-spacing: -0.05em;
          line-height: 1.05;
        }
        .blog-post-body h2 {
          font-size: 2rem;
          font-weight: 800;
          margin-top: 4.5rem;
          margin-bottom: 1.5rem;
          color: var(--accent-secondary);
          letter-spacing: -0.03em;
          position: relative;
          padding-bottom: 1rem;
        }
        .blog-post-body h2::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 48px;
          height: 3px;
          background: var(--accent-secondary);
          border-radius: 2px;
        }
        .blog-post-body h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 3rem;
          margin-bottom: 1rem;
          color: var(--accent-primary);
          letter-spacing: -0.02em;
        }
        .blog-post-body h4 {
          font-size: 1.15rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          color: var(--foreground);
          opacity: 0.8;
        }
        .blog-post-body p {
          font-size: 1.15rem;
          line-height: 1.9;
          margin-bottom: 2rem;
          color: var(--foreground);
          opacity: 0.75;
        }
        .blog-post-body ul,
        .blog-post-body ol {
          margin-bottom: 2rem;
          padding-left: 0;
          list-style: none;
        }
        .blog-post-body li {
          position: relative;
          padding-left: 2rem;
          margin-bottom: 0.85rem;
          font-size: 1.1rem;
          line-height: 1.7;
          color: var(--foreground);
          opacity: 0.75;
        }
        .blog-post-body ul li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: var(--accent-secondary);
          font-weight: 700;
        }
        .blog-post-body ol {
          counter-reset: ol-counter;
        }
        .blog-post-body ol li {
          counter-increment: ol-counter;
        }
        .blog-post-body ol li::before {
          content: counter(ol-counter) '.';
          position: absolute;
          left: 0;
          color: var(--accent-primary);
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          font-size: 0.9rem;
        }
        .blog-post-body strong {
          color: var(--foreground);
          font-weight: 900;
          opacity: 1;
        }
        .blog-post-body em {
          color: var(--foreground);
          opacity: 0.6;
          font-style: italic;
        }
        .blog-post-body a {
          color: var(--accent-primary);
          text-decoration: underline;
          text-underline-offset: 4px;
          transition: color 0.2s;
        }
        .blog-post-body a:hover {
          color: var(--accent-secondary);
        }
        .blog-post-body blockquote {
          border-left: 4px solid var(--accent-secondary);
          padding: 2rem 2.5rem;
          font-style: italic;
          margin: 3rem 0;
          background: linear-gradient(to right, rgba(139, 92, 246, 0.06), transparent);
          border-radius: 0 1.5rem 1.5rem 0;
          font-size: 1.25rem;
          line-height: 1.7;
          color: var(--foreground);
          opacity: 0.9;
        }
        .blog-post-body code {
          background: var(--card);
          border: 1px solid var(--card-border);
          padding: 0.2em 0.5em;
          border-radius: 6px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.85em;
          color: var(--accent-primary);
        }
        .blog-post-body pre {
          background: var(--card);
          border: 1px solid var(--card-border);
          border-radius: 1rem;
          padding: 1.5rem 2rem;
          overflow-x: auto;
          margin: 2rem 0;
        }
        .blog-post-body pre code {
          background: none;
          border: none;
          padding: 0;
          color: var(--foreground);
          opacity: 0.9;
        }
        .blog-post-body hr {
          border: none;
          border-top: 1px solid var(--card-border);
          margin: 3rem 0;
        }
        .blog-post-body img {
          width: 100%;
          border-radius: 1rem;
          margin: 2rem 0;
          border: 1px solid var(--card-border);
        }
        .blog-post-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
          font-size: 0.95rem;
        }
        .blog-post-body th {
          background: var(--card);
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--foreground);
          opacity: 0.5;
          border-bottom: 2px solid var(--card-border);
        }
        .blog-post-body td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--card-border);
          color: var(--foreground);
          opacity: 0.75;
        }
        .blog-post-body tr:last-child td {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}
