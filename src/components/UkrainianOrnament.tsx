import React from 'react';

interface OrnamentProps {
  className?: string;
  variant?: 'border' | 'rosette' | 'divider' | 'thread';
}

export const UkrainianOrnament: React.FC<OrnamentProps> = ({ 
  className = '', 
  variant = 'divider' 
}) => {
  if (variant === 'rosette') {
    return (
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={`w-8 h-8 text-rose-700 ${className}`}
      >
        {/* Traditional 8-pointed Ukrainian Star / Rosette (Ружа / Повна Рожа) with cyber-circuit nodes */}
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Central Diamond */}
          <polygon points="50,30 70,50 50,70 30,50" fill="#DC2626" fillOpacity="0.12" stroke="#DC2626" strokeWidth="2" />
          <polygon points="50,38 62,50 50,62 38,50" fill="#DC2626" fillOpacity="0.8" stroke="#DC2626" />
          
          {/* 4 Cardinal Petal Rays */}
          <path d="M50 15 L58 30 L50 38 L42 30 Z" fill="#DC2626" stroke="#991B1B" />
          <path d="M50 85 L58 70 L50 62 L42 70 Z" fill="#DC2626" stroke="#991B1B" />
          <path d="M15 50 L30 42 L38 50 L30 58 Z" fill="#DC2626" stroke="#991B1B" />
          <path d="M85 50 L70 42 L62 50 L70 58 Z" fill="#DC2626" stroke="#991B1B" />
          
          {/* 4 Diagonal Petal Rays (Black/Dark Slate traditional contrast) */}
          <path d="M25 25 L38 34 L34 38 L25 38 Z" fill="#0F172A" stroke="#0F172A" />
          <path d="M75 25 L62 34 L66 38 L75 38 Z" fill="#0F172A" stroke="#0F172A" />
          <path d="M25 75 L38 66 L34 62 L25 62 Z" fill="#0F172A" stroke="#0F172A" />
          <path d="M75 75 L62 66 L66 62 L75 62 Z" fill="#0F172A" stroke="#0F172A" />
          
          {/* Digital Golden Nodes at ray tips */}
          <circle cx="50" cy="12" r="2.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
          <circle cx="50" cy="88" r="2.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
          <circle cx="12" cy="50" r="2.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
          <circle cx="88" cy="50" r="2.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
          
          {/* Center core seed */}
          <circle cx="50" cy="50" r="3" fill="#FEF08A" stroke="#DC2626" strokeWidth="1.5" />
        </g>
      </svg>
    );
  }

  if (variant === 'thread') {
    return (
      <div className={`relative h-2 w-full overflow-hidden flex items-center ${className}`}>
        {/* Animated glowing Ukrainian red thread */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-600 to-transparent opacity-80 h-[2px] my-auto" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-500/40 via-transparent to-transparent blur-[2px]" />
      </div>
    );
  }

  // Variant: divider / border (continuous authentic Podillia/Polissya cross-stitch pattern)
  return (
    <div className={`w-full overflow-hidden flex items-center justify-center my-2 select-none pointer-events-none opacity-90 ${className}`}>
      <svg 
        viewBox="0 0 600 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-2xl h-6 text-red-600"
        preserveAspectRatio="xMidYMid meet"
      >
        <pattern id="vyshyvanka-pattern" x="0" y="0" width="60" height="24" patternUnits="userSpaceOnUse">
          {/* Base centerline */}
          <line x1="0" y1="12" x2="60" y2="12" stroke="#DC2626" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6" />
          
          {/* Red Diamonds and Crosses */}
          {/* Central Rhombus */}
          <polygon points="30,4 38,12 30,20 22,12" fill="none" stroke="#DC2626" strokeWidth="1.5" />
          <polygon points="30,7 35,12 30,17 25,12" fill="#DC2626" />
          
          {/* Corner Crosses (Хрестики) */}
          {/* Top/Bottom red stitches */}
          <path d="M12,4 L16,8 M16,4 L12,8" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M44,4 L48,8 M48,4 L44,8" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M12,16 L16,20 M16,16 L12,20" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M44,16 L48,20 M48,16 L44,20" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="square" />
          
          {/* Black/Charcoal contrast accents */}
          <path d="M0,10 L4,14 M4,10 L0,14" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M56,10 L60,14 M60,10 L56,14" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="square" />
          <polygon points="30,10 32,12 30,14 28,12" fill="#0F172A" />

          {/* Golden seed nodes (The fusion of past & digital future) */}
          <circle cx="14" cy="12" r="1.5" fill="#D97706" />
          <circle cx="46" cy="12" r="1.5" fill="#D97706" />
        </pattern>
        
        {/* Soft edge gradient fades */}
        <defs>
          <linearGradient id="fade-edges" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFF" stopOpacity="0" />
            <stop offset="15%" stopColor="#FFF" stopOpacity="1" />
            <stop offset="85%" stopColor="#FFF" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
          </linearGradient>
          <mask id="fade-mask">
            <rect width="600" height="24" fill="url(#fade-edges)" />
          </mask>
        </defs>

        <rect width="600" height="24" fill="url(#vyshyvanka-pattern)" mask="url(#fade-mask)" />
      </svg>
    </div>
  );
};
