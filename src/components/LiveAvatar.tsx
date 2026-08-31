import React, { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Volume2, Sparkles, Mic } from "lucide-react";

interface LiveAvatarProps {
  isSpeaking?: boolean;
  isListening?: boolean;
  emotion?: "happy" | "thoughtful" | "empathetic" | "excited" | "neutral";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
  showBadge?: boolean;
}

export const LiveAvatar: React.FC<LiveAvatarProps> = ({
  isSpeaking = false,
  isListening = false,
  emotion = "thoughtful",
  size = "lg",
  className = "",
  onClick,
  showBadge = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-20 h-20",
    lg: "w-36 h-36 sm:w-44 sm:h-44",
    xl: "w-52 h-52 sm:w-64 sm:h-64",
  }[size];

  const emotionBadge = {
    happy: "Привітна Господиня",
    thoughtful: "Глибока Думка",
    empathetic: "Сердечний Резонанс",
    excited: "Натхненна Мрія",
    neutral: "Виважена",
  }[emotion];

  return (
    <div className={`relative flex flex-col items-center justify-center group ${className}`}>
      {/* Outer Halo / Luminous Aura Breathing effect */}
      <div 
        className={`absolute -inset-2 rounded-full blur-lg opacity-70 transition-all duration-700 pointer-events-none ${
          isSpeaking
            ? "bg-gradient-to-r from-red-600 via-amber-500 to-rose-600 opacity-95 animate-pulse scale-105"
            : isListening
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 opacity-85 animate-ping scale-102"
            : "bg-gradient-to-r from-red-500/40 via-rose-500/30 to-amber-500/40 opacity-70"
        }`} 
      />

      {/* Main Avatar Circular Frame */}
      <motion.div
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={`relative ${sizeClasses} rounded-full overflow-hidden border-2 border-red-500/50 shadow-2xl bg-slate-900 cursor-pointer select-none ring-4 ring-white/90 dark:ring-slate-900/90`}
      >
        {/* Live Lip-Sync Video (pani-dumka-lips.mp4) */}
        <video
          ref={videoRef}
          src="/pani-dumka-lips.mp4"
          loop
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dynamic State Overlay Indicator */}
        <div className="absolute bottom-2 right-2 flex items-center justify-center">
          {isSpeaking && (
            <span className="flex h-4 w-4 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-white items-center justify-center p-0.5">
                <Volume2 className="w-2.5 h-2.5" />
              </span>
            </span>
          )}
          {isListening && (
            <span className="flex h-4 w-4 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600 text-white items-center justify-center p-0.5">
                <Mic className="w-2.5 h-2.5" />
              </span>
            </span>
          )}
        </div>
      </motion.div>

      {/* Floating Status & Emotion Badge */}
      {showBadge && (
        <motion.div 
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 border border-red-200/80 dark:border-red-900/50 shadow-xs backdrop-blur-md"
        >
          <Sparkles className="w-3 h-3 text-red-600 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 tracking-wide">
            {isSpeaking ? "Пані Думка мовить..." : isListening ? "Пані Думка слухає..." : emotionBadge}
          </span>
        </motion.div>
      )}
    </div>
  );
};
