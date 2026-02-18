import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export const Logo = ({ className, size = "md", showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-5xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        {/* Lamp/Magic Gradient Icon */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_15px_rgba(124,58,237,0.5)]"
        >
          <defs>
            <linearGradient id="magicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          <path
            d="M20,65 Q30,85 50,85 T80,65 L85,55 Q90,45 80,40 L70,35 Q60,20 50,15 Q40,20 30,35 L20,40 Q10,45 15,55 Z"
            fill="url(#magicGradient)"
            className="animate-pulse"
          />
          <path
            d="M50,15 C50,15 45,5 50,0 C55,5 50,15 50,15"
            stroke="url(#magicGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-bounce" 
          />
          <circle cx="20" cy="50" r="3" fill="#60A5FA" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle cx="80" cy="40" r="2" fill="#A78BFA" className="animate-ping" style={{ animationDuration: '2.5s' }} />
        </svg>
      </div>
      
      {showText && (
        <span className={cn("font-bold tracking-tight text-foreground", textSizeClasses[size])}>
          Post<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Gini</span>
        </span>
      )}
    </div>
  );
};
