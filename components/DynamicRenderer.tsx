"use client";

import React, { useState } from "react";
import { 
  AlertCircle, ChevronDown, ChevronRight, FileText, Globe, 
  MessageSquare, Palette, Target, Zap, LayoutGrid 
} from "lucide-react";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------
// Types & Helpers
// ----------------------------------------------------------------------
interface DynamicRendererProps {
  data: any;
}

const formatKey = (key: string) => {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

const getDefaultIcon = (key: string) => {
  const k = key.toLowerCase();
  if (k.includes("name")) return Globe;
  if (k.includes("industry")) return Zap;
  if (k.includes("audience")) return Target;
  if (k.includes("visual")) return Palette;
  if (k.includes("tone")) return MessageSquare;
  if (k.includes("manifest")) return FileText;
  if (k.includes("risk") || k.includes("compliance") || k.includes("warning")) return AlertCircle;
  return LayoutGrid;
};

const isWarningSection = (key: string) => {
  const k = key.toLowerCase();
  return k.includes("risk") || k.includes("compliance") || k.includes("warning");
};

// ----------------------------------------------------------------------
// Sub-Components
// ----------------------------------------------------------------------

const BadgeList = ({ items }: { items: string[] }) => (
  <div className="flex flex-wrap gap-2 mt-2">
    {items.filter(i => i != null).map((item, idx) => (
      <span 
        key={idx} 
        className="px-3 py-1.5 bg-accent-secondary/10 border border-accent-secondary/30 text-accent-secondary rounded-md text-xs font-medium backdrop-blur-sm shadow-sm"
      >
        {String(item)}
      </span>
    ))}
  </div>
);

const ObjectArrayTable = ({ items }: { items: any[] }) => {
  if (items.length === 0) return null;
  
  const allKeys = items.reduce((keys, item) => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(k => keys.add(k));
    }
    return keys;
  }, new Set<string>());
  
  const columns = Array.from<string>(allKeys);
  
  const isSimple = items.every(item => 
    typeof item === 'object' && item !== null && 
    Object.values(item).every(v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null || v === undefined)
  );

  if (!isSimple || columns.length > 5) {
    return (
      <div className="grid grid-cols-1 gap-4 mt-3">
        {items.map((item, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-card-border/40 bg-card/20 hover:bg-card/40 transition-colors shadow-sm">
            <div className="text-[10px] font-mono uppercase text-foreground/50 mb-3 tracking-widest border-b border-card-border/30 pb-2">Item {idx + 1}</div>
            <NestedObjectCard data={item} level={1} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto mt-3 rounded-xl border border-card-border/40 bg-card/10 shadow-inner">
      <table className="w-full text-left text-sm max-w-full">
        <thead className="bg-card/40 text-foreground/70 uppercase text-[10px] tracking-wider border-b border-card-border/40">
          <tr>
            {columns.map((col: string) => (
              <th key={col} className="px-4 py-3 font-medium whitespace-nowrap">{formatKey(col)}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border/20">
          {items.map((item: Record<string, any>, idx: number) => (
            <tr key={idx} className="hover:bg-card/20 transition-colors">
              {columns.map((col: string) => {
                const val = item[col];
                return (
                  <td key={col} className="px-4 py-3 text-foreground/80 font-medium whitespace-pre-wrap min-w-[120px]">
                    {val !== undefined && val !== null ? String(val) : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CollapsibleSection = ({ 
  title, 
  children, 
  defaultOpen = false, 
  isWarning = false 
}: { 
  title: string, 
  children: React.ReactNode, 
  defaultOpen?: boolean, 
  isWarning?: boolean 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Icon = isWarning ? AlertCircle : (isOpen ? ChevronDown : ChevronRight);
  
  return (
    <div className={cn(
      "rounded-xl overflow-hidden border transition-colors duration-300 shadow-sm mt-3", 
      isWarning 
        ? "border-red-500/30 bg-red-400/5 group" 
        : isOpen 
          ? "bg-background/60 border-card-border/60" 
          : "bg-card/30 border-card-border/30 hover:bg-card/50"
    )}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("w-4 h-4 transition-transform", isWarning ? "text-red-400" : "text-foreground/50")} />
          <span className={cn("text-sm font-semibold tracking-wide uppercase", isWarning ? "text-red-400" : "text-foreground/80")}>
            {title}
          </span>
        </div>
      </button>
      {isOpen && (
        <div className={cn("p-5 pt-3 border-t", isWarning ? "border-red-500/20" : "border-card-border/20")}>
          {children}
        </div>
      )}
    </div>
  );
};

const NestedObjectCard = ({ data, level = 0 }: { data: any, level?: number }) => {
  if (!data || typeof data !== 'object') return null;
  return (
    <div className={cn("flex flex-col gap-4", level === 0 ? "mt-2" : "mt-0")}>
      {Object.entries(data).map(([key, value]) => (
        <NodeRenderer key={key} nodeKey={key} value={value} level={level + 1} />
      ))}
    </div>
  );
};

const NodeRenderer = ({ nodeKey, value, level = 0 }: { nodeKey: string, value: any, level?: number }) => {
  const isWarning = isWarningSection(nodeKey);
  const title = formatKey(nodeKey);
  const Icon = getDefaultIcon(nodeKey);

  const wrapInCard = (content: React.ReactNode) => {
    // Top-level sections get their own visually distinct card
    if (level === 0) {
      return (
        <div className={cn(
          "bg-background/40 rounded-xl p-5 border border-card-border/50 hover:bg-background/60 transition-colors group mb-4 shadow-sm", 
          isWarning ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10" : ""
        )}>
          <div className={cn("text-[10px] font-mono uppercase tracking-wider mb-3 flex items-center gap-2", isWarning ? "text-red-400" : "text-accent-secondary/80")}>
            {Icon && <Icon className={cn("w-3 h-3 transition-colors", isWarning ? "text-red-400 group-hover:text-red-300" : "group-hover:text-accent-secondary")} />}
            {title}
          </div>
          {content}
        </div>
      );
    }

    // Nested properties within cards or simple blocks
    return (
      <div className="flex flex-col group pt-1">
        <span className={cn("text-[10px] font-mono uppercase tracking-widest mb-1.5 opacity-80", isWarning ? "text-red-400" : "text-foreground/50")}>
          {title}
        </span>
        {content}
      </div>
    );
  };

  const renderContent = () => {
    if (value === null || value === undefined) {
      return <span className="text-foreground/30 italic text-sm">N/A</span>;
    }

    // Primitive values
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return (
        <div className={cn("text-sm font-medium leading-relaxed whitespace-pre-wrap", isWarning ? "text-red-200" : "text-foreground/90")}>
          {String(value)}
        </div>
      );
    }

    // Arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-foreground/30 italic text-sm">Empty</span>;
      
      // Array of primitive strings/numbers
      if (typeof value[0] === 'string' || typeof value[0] === 'number') {
        return <BadgeList items={value.map(String)} />;
      }
      
      // Array of objects
      if (typeof value[0] === 'object') {
        return <ObjectArrayTable items={value} />;
      }
      
      return <div className="text-sm text-foreground/60 italic">Mixed array</div>;
    }

    // Objects
    if (typeof value === "object") {
      const keysCount = Object.keys(value).length;
      
      // Only collapse if it's large or nested deep
      if (keysCount > 4 || level > 1) {
        // Handled below to prevent double wrapping titles
        return <NestedObjectCard data={value} level={level + 1} />;
      }
      
      return (
        <div className={cn(
          "pl-4 border-l-2 py-1 mt-2 mb-1", 
          isWarning ? "border-red-500/30" : "border-card-border/30"
        )}>
          <NestedObjectCard data={value} level={level} />
        </div>
      );
    }

    return null;
  };

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const keysCount = Object.keys(value).length;
    if (keysCount > 4 || level > 1) {
       return (
         <CollapsibleSection title={title} isWarning={isWarning} defaultOpen={level === 0}>
           <NestedObjectCard data={value} level={level + 1} />
         </CollapsibleSection>
       );
    }
  }

  return wrapInCard(renderContent());
};

// ----------------------------------------------------------------------
// Main Exported Component
// ----------------------------------------------------------------------

export const DynamicRenderer = ({ data }: DynamicRendererProps) => {
  if (!data || typeof data !== "object") return null;

  // Key sorting priority list to maintain existing top-level layout familiarity
  const priorityKeys = ["name", "industry", "target_audience", "visual_style", "tone_of_voice", "manifest"];

  const getPriority = (k: string) => {
    const idx = priorityKeys.indexOf(k.toLowerCase());
    if (idx !== -1) return idx;
    
    // Push warnings to bottom or just let them float according to their objects
    if (isWarningSection(k)) return 999; 
    
    return 100;
  };

  // Sort keys so prioritized ones come first, then simple strings, then objects
  const sortedEntries = Object.entries(data).sort(([k1, v1], [k2, v2]) => {
    const p1 = getPriority(k1);
    const p2 = getPriority(k2);
    
    if (p1 !== p2) return p1 - p2;

    const isObj1 = typeof v1 === 'object' && v1 !== null;
    const isObj2 = typeof v2 === 'object' && v2 !== null;
    
    // If they aren't the same type, primitive goes first
    if (isObj1 !== isObj2) return isObj1 ? 1 : -1;
    
    // Fallback to alphabetical if all else is equal
    return k1.localeCompare(k2);
  });

  return (
    <>
      {sortedEntries.map(([key, value]) => (
        <NodeRenderer key={key} nodeKey={key} value={value} level={0} />
      ))}
    </>
  );
};
