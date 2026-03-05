"use client";

import React, { useEffect, useState } from "react";
import { LayoutDashboard, Megaphone, Palette, Bot, LineChart, Settings, LogOut, User, BookOpen, Library, Sun, Moon, Code2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { Logo } from "@/components/Logo";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Content Strategy", id: "strategy" },
  { icon: BookOpen, label: "Editorial Agent", id: "blog" },
  { icon: Palette, label: "Brand Identity", id: "brand" },
  { icon: Megaphone, label: "Campaign", id: "campaign" },
  { icon: Library, label: "Asset Hub", id: "hub" },
  { icon: Calendar, label: "Schedule", id: "calendar" },
  { icon: Code2, label: "Integrations", id: "integrations" },
];

interface SidebarProps {
  activeId: string;
  onSelect: (id: "strategy" | "brand" | "blog" | "hub" | "campaign" | "integrations" | "calendar") => void;
}

export const Sidebar = ({ activeId, onSelect }: SidebarProps) => {
  const [user, setUser] = useState<any>(null);
  const { theme, toggleTheme } = useTheme();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <div className="w-64 border-r border-card-border bg-background/95 backdrop-blur-xl h-screen sticky top-0 self-start flex flex-col p-6 transition-colors duration-300">
      <div className="flex items-center justify-center mb-10 px-2 py-2">
        <Logo size="lg" />
      </div>

      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id as "strategy" | "brand" | "blog" | "hub" | "campaign" | "integrations" | "calendar")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
              activeId === item.id 
                ? "bg-accent-primary/10 text-accent-primary shadow-[0_0_20px_var(--accent-glow)]" 
                : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5", activeId === item.id ? "text-accent-primary" : "text-foreground/60 group-hover:text-accent-primary")} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-card-border space-y-4">
         {/* Theme Toggle */}
         <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/60 hover:bg-foreground/5 hover:text-foreground transition-all duration-300"
         >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
         </button>

         <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center overflow-hidden">
                {user?.email ? (
                    <img src={`https://ui-avatars.com/api/?name=${user.email}&background=3b82f6&color=fff`} alt="User" />
                ) : (
                    <User className="w-5 h-5 text-accent-primary/50" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-foreground">{user?.email?.split('@')[0] || "User"}</p>
                <p className="text-[10px] text-foreground/40 tracking-wider">PREMIUM ACCESS</p>
            </div>
         </div>
         
         <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-foreground/40 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
         >
            <LogOut className="w-4 h-4" /> SIGN OUT
         </button>
      </div>
    </div>
  );
};
