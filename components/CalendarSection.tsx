"use client";

import React, { useState, useEffect } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Loader2, Calendar as CalendarIcon, FileText, Clock, CheckCircle2 } from "lucide-react";
import { fetchSavedBlogs, SavedBlog } from "@/services/api";
import { cn } from "@/lib/utils";

interface CalendarSectionProps {
  userId: string;
  brandId: string;
}

export const CalendarSection = ({ userId, brandId }: CalendarSectionProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [blogs, setBlogs] = useState<SavedBlog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBlogs();
  }, [userId, brandId]);

  const loadBlogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSavedBlogs(userId, brandId);
      setBlogs(data);
    } catch (e) {
      console.error("Failed to load blogs for calendar", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter blogs for the selected date
  const selectedDateBlogs = blogs.filter((blog) => {
    if (!selectedDate) return false;
    const blogDate = blog.scheduled_at 
        ? parseISO(blog.scheduled_at) 
        : parseISO(blog.created_at);
    return isSameDay(blogDate, selectedDate);
  });

  // Get days that have scheduled content for modifiers
  const scheduledDays = blogs
    .filter(b => b.status === 'scheduled' && b.scheduled_at)
    .map(b => parseISO(b.scheduled_at!));
    
  const publishedDays = blogs
    .filter((b => b.status === 'published' || !b.status))
    .map(b => parseISO(b.created_at));

  return (
    <div className="flex gap-8 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-100px)]">
        {/* Left Column: Calendar */}
        <div className="glass-card p-6 flex flex-col items-center justify-start w-[400px]">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 w-full">
                <CalendarIcon className="w-5 h-5 text-accent-primary" />
                Content Schedule
            </h2>
            
            <div className="calendar-wrapper bg-card/50 rounded-xl p-4 border border-card-border">
                <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    modifiers={{
                        scheduled: scheduledDays,
                        published: publishedDays
                    }}
                    modifiersStyles={{
                        scheduled: { border: '2px solid var(--accent-primary)', color: 'var(--accent-primary)', fontWeight: 'bold' },
                        published: {  backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80' }
                    }}
                    styles={{
                        caption: { color: 'white' },
                        head_cell: { color: 'rgba(255,255,255,0.5)' },
                        day: { color: 'white' }
                    }}
                />
            </div>

            <div className="mt-8 w-full space-y-3">
                <div className="flex items-center gap-3 text-xs text-foreground/50">
                    <div className="w-3 h-3 rounded-full border-2 border-accent-primary"></div>
                    <span>Scheduled Post</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-foreground/50">
                    <div className="w-3 h-3 rounded-full bg-green-500/10"></div>
                    <span>Published Post</span>
                </div>
            </div>
        </div>

        {/* Right Column: Daily Agenda */}
        <div className="flex-1 glass-card p-6 flex flex-col overflow-hidden">
            <h3 className="text-lg font-bold mb-6 flex items-center justify-between border-b border-card-border pb-4">
                <span>
                    Agenda for {selectedDate ? format(selectedDate, "MMMM do, yyyy") : "Selected Date"}
                </span>
                <span className="text-xs bg-card/50 px-2 py-1 rounded font-mono text-foreground/50">
                    {selectedDateBlogs.length} Items
                </span>
            </h3>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
                </div>
            ) : selectedDateBlogs.length > 0 ? (
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedDateBlogs.map((blog) => (
                        <div key={blog.id} className="glass-card p-5 border border-card-border hover:border-accent-primary/30 transition-all flex items-start gap-4 group">
                            <div className={cn(
                                "rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative border border-card-border",
                                (blog.cover_image || blog.metadata?.cover_image) ? "w-16 h-12" : "w-10 h-10",
                                !(blog.cover_image || blog.metadata?.cover_image) && (blog.status === 'scheduled' ? "bg-accent-primary/10 text-accent-primary" : "bg-green-500/10 text-green-500")
                            )}>
                                {(blog.cover_image || blog.metadata?.cover_image) ? (
                                    <img 
                                        src={blog.cover_image || blog.metadata?.cover_image} 
                                        alt={blog.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    blog.status === 'scheduled' ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />
                                )}
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-foreground group-hover:text-accent-primary transition-colors line-clamp-1">
                                        {blog.title}
                                    </h4>
                                    <span className={cn(
                                        "text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border",
                                        blog.status === 'scheduled' 
                                            ? "border-accent-primary/30 text-accent-primary bg-accent-primary/5" 
                                            : "border-green-500/30 text-green-500 bg-green-500/5"
                                    )}>
                                        {blog.status || 'published'}
                                    </span>
                                </div>
                                <p className="text-xs text-foreground/40 font-mono mb-2">/{blog.metadata.slug}</p>
                                
                                {blog.status === 'scheduled' && blog.scheduled_at && (
                                    <div className="text-xs text-accent-primary/80 flex items-center gap-1.5 bg-accent-primary/5 w-fit px-2 py-1 rounded">
                                        <Clock className="w-3 h-3" />
                                        Scheduled for {format(parseISO(blog.scheduled_at), "h:mm a")} IST
                                    </div>
                                )}
                            </div>
                            
                             <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/5 rounded-lg text-foreground/40 hover:text-foreground">
                                <FileText className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-foreground/20">
                    <div className="w-16 h-16 rounded-full bg-card border-2 border-dashed border-card-border flex items-center justify-center mb-4">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <p>No content scheduled for this day.</p>
                </div>
            )}
        </div>
        
        <style jsx global>{`
          .rdp { --rdp-cell-size: 40px; --rdp-accent-color: var(--accent-primary); margin: 0; }
          .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: rgba(255,255,255,0.05); }
          .rdp-day_selected { background-color: var(--accent-primary); color: white; }
          .rdp-day_today { font-weight: bold; color: var(--accent-secondary); }
        `}</style>
    </div>
  );
};
