import React, { useState } from "react";
import avatarImg from "../assets/images/pani-dumka-ai-logo-widget.png";
import { Sparkles } from "lucide-react";

interface PaniDumkaLogoProps {
  className?: string;
  onClick?: () => void;
}

export const PaniDumkaLogo: React.FC<PaniDumkaLogoProps> = ({ className = "", onClick }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-2.5 select-none cursor-pointer group ${className}`}
      id="pani-dumka-header-logo"
    >
      <div className="relative">
        <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-red-500/30 shadow-xs group-hover:border-red-500 transition-colors bg-slate-900 flex items-center justify-center">
          {!imgError ? (
            <img 
              src={avatarImg} 
              alt="Пані Думка" 
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <Sparkles className="w-5 h-5 text-amber-400" />
          )}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-serif font-bold text-base text-slate-900 tracking-tight group-hover:text-red-700 transition-colors leading-none">
            Пані Думка
          </span>
          <span className="text-[10px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200/60 leading-none">
            ШІ
          </span>
        </div>
        <span className="text-[10.5px] text-slate-500 font-medium tracking-normal mt-0.5">
          Оркестратор
        </span>
      </div>
    </div>
  );
};
