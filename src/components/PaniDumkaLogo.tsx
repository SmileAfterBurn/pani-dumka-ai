import React from "react";
import { Sparkles } from "lucide-react";

interface PaniDumkaLogoProps {
  className?: string;
  onClick?: () => void;
}

export const PaniDumkaLogo: React.FC<PaniDumkaLogoProps> = ({ className = "", onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-2.5 select-none cursor-pointer group ${className}`}
      id="pani-dumka-header-logo"
    >
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-red-500/40 shadow-sm group-hover:border-red-500 transition-colors flex-shrink-0 relative">
        <video 
          src="/pani-dumka-lips.mp4" 
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-red-950/20 to-transparent pointer-events-none"></div>
      </div>
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 tracking-tight transition-colors leading-none">
            Пані Думка
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
          <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
            Оркестратор
          </span>
        </div>
      </div>
    </div>
  );
};
