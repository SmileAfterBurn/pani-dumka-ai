import React from "react";

interface PaniDumkaLogoProps {
  className?: string;
  onClick?: () => void;
}

export const PaniDumkaLogo: React.FC<PaniDumkaLogoProps> = ({ className = "", onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 select-none cursor-pointer group ${className}`}
    >
      {/* Stylized Ukrainian Maiden Sketch with Watercolor and Ribbon Accents */}
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg 
          viewBox="0 0 120 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform transition-transform duration-300 group-hover:scale-105"
        >
          {/* Background artistic watercolor / digital splash in blue & cyan */}
          <path 
            d="M20,60 Q10,25 45,20 Q80,15 95,45 Q110,75 80,95 Q50,115 25,90 Z" 
            fill="url(#paint-splash)" 
            opacity="0.25"
            className="animate-pulse"
          />

          {/* Cyan digital energy lines flowing behind hair */}
          <path d="M15,40 C35,28 65,35 95,30" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          <path d="M10,55 C30,45 60,52 105,48" stroke="#38BDF8" strokeWidth="1.2" opacity="0.5" />
          <path d="M18,70 C38,62 70,68 110,65" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />

          {/* Red & Gold Ukrainian Wreath Elements */}
          {/* Poppy / Rose flowers in wreath on crown */}
          <circle cx="58" cy="36" r="7" fill="#DC2626" />
          <circle cx="58" cy="36" r="4" fill="#991B1B" />
          <circle cx="46" cy="32" r="6" fill="#EA580C" />
          <circle cx="70" cy="42" r="5.5" fill="#E11D48" />
          
          {/* Golden Wheat Spikes (Колосся) in wreath */}
          <path d="M38,28 L42,34 M44,24 L46,32 M52,22 L52,30" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
          <path d="M64,22 L62,30 M72,25 L68,33 M80,30 L74,38" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          
          {/* Traditional Geometric Vyshyvanka Motifs in Headband */}
          <path d="M40,40 L76,46" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
          <path d="M42,40 L45,43 L48,40 L51,43 L54,40 L57,43 L60,40 L63,43 L66,40 L69,43 L72,40" stroke="#FFFFFF" strokeWidth="1.2" />

          {/* Fine Art Maiden Profile Line Art */}
          <path 
            d="M72,48 C75,54 77,60 76,64 C75,66 72,67 70,68 C68,69 66,73 68,75 C70,77 74,77 75,79 C76,81 74,84 71,85 C67,86 64,88 62,92 C58,100 55,108 52,112" 
            stroke="#0F172A" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Delicate Eye and Brow */}
          <path d="M68,58 Q72,55 75,58" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
          <path d="M72,60 A1.5,1.5 0 1,1 71.9,60" stroke="#0284C7" strokeWidth="2.5" />
          {/* Elegant lips */}
          <path d="M73,73 Q76,73 74,75" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />

          {/* Flowing Braids & Vyshyvanka Ribbon Strands */}
          <path d="M52,48 C45,55 42,70 45,85 C47,95 44,105 38,114" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M46,55 C40,65 38,78 40,92 C41,100 37,108 32,115" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
          <path d="M38,60 C32,70 30,82 33,96 C34,103 30,110 24,116" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" opacity="0.85" />

          <defs>
            <radialGradient id="paint-splash" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="60%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#DC2626" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Typography: "Пані Думка" + "Ai" */}
      <div className="flex items-baseline gap-1.5">
        <span className="font-serif text-lg font-bold tracking-tight text-slate-900 group-hover:text-red-600 transition-colors">
          Пані Думка
        </span>
        <span className="font-sans font-bold text-lg text-sky-500 tracking-tight">
          Аі
        </span>
      </div>
    </div>
  );
};
