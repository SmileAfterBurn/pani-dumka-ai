import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import avatarImg from '../assets/images/pani_dumka_avatar_1779399213744.png';
import { Sparkles, Mic, Volume2 } from 'lucide-react';

export type AvatarEmotion = 'neutral' | 'happy' | 'thoughtful' | 'empathetic' | 'excited';

interface LiveAvatarProps {
  state: 'idle' | 'listening' | 'speaking';
  emotion?: AvatarEmotion;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  agentName?: string;
}

// Particle floating from the glowing crown
interface CrownParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  maxLife: number;
  life: number;
  color: string;
}

export function LiveAvatar({ 
  state, 
  emotion = 'neutral', 
  className,
  size = 'lg',
  agentName
}: LiveAvatarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasParticlesRef = useRef<HTMLCanvasElement | null>(null);

  // Mouse & Parallax tracking
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [speechAmplitude, setSpeechAmplitude] = useState(0);

  // Smooth interpolated head tilt angles
  const currentTilt = useRef({ x: 0, y: 0 });
  const targetTilt = useRef({ x: 0, y: 0 });
  const animFrameId = useRef<number | null>(null);

  // Handle natural blinking cycles
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    let shutTimeout: NodeJS.Timeout;

    const scheduleBlink = () => {
      const interval = 2800 + Math.random() * 4200;
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        // Realistic blink duration (140-180ms)
        shutTimeout = setTimeout(() => {
          setIsBlinking(false);
          // Occasional realistic double-blink
          if (Math.random() < 0.25) {
            setTimeout(() => {
              setIsBlinking(true);
              setTimeout(() => setIsBlinking(false), 120);
            }, 180);
          }
          scheduleBlink();
        }, 150);
      }, interval);
    };

    scheduleBlink();
    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(shutTimeout);
    };
  }, []);

  // Speech mouth & chest pulsation simulator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state === 'speaking') {
      interval = setInterval(() => {
        setSpeechAmplitude(0.3 + Math.random() * 0.7);
      }, 120);
    } else {
      setSpeechAmplitude(0);
    }
    return () => clearInterval(interval);
  }, [state]);

  // Handle smooth mouse tracking for parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    targetTilt.current = {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y))
    };
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    targetTilt.current = { x: 0, y: 0 };
    setMousePos({ x: 0, y: 0 });
  };

  // Continuous animation loop for physics, crown sparks, and idle micro-saccades
  useEffect(() => {
    const canvas = canvasParticlesRef.current;
    const ctx = canvas?.getContext('2d');
    let particles: CrownParticle[] = [];

    // Initialize 24 crown aura sparks
    const crownColors = ['#FDE047', '#F59E0B', '#DC2626', '#FEF08A', '#38BDF8'];
    for (let i = 0; i < 28; i++) {
      particles.push({
        id: i,
        x: 40 + Math.random() * 200,
        y: 15 + Math.random() * 60,
        size: 1 + Math.random() * 2.5,
        speedY: 0.2 + Math.random() * 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.8,
        maxLife: 60 + Math.random() * 80,
        life: Math.random() * 80,
        color: crownColors[Math.floor(Math.random() * crownColors.length)]
      });
    }

    let t = 0;
    const render = () => {
      t += 0.03;

      // Natural idle micro-breathing & attention head swaying
      const idleSwayX = Math.sin(t * 0.6) * 0.15;
      const idleSwayY = Math.cos(t * 0.9) * 0.12;

      // Smooth interpolation towards target tilt
      const lerp = 0.08;
      currentTilt.current.x += (targetTilt.current.x + idleSwayX - currentTilt.current.x) * lerp;
      currentTilt.current.y += (targetTilt.current.y + idleSwayY - currentTilt.current.y) * lerp;

      // Render crown particles on overlay canvas
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p) => {
          p.life += 1;
          p.y -= p.speedY;
          p.x += p.speedX + Math.sin(t + p.id) * 0.25;

          const progress = p.life / p.maxLife;
          const alpha = progress < 0.3 
            ? progress / 0.3 
            : 1 - (progress - 0.3) / 0.7;

          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - progress * 0.3), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha * p.opacity));
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.restore();

          // Reset particle at top wreath base
          if (p.life >= p.maxLife || p.y < 0) {
            p.life = 0;
            p.x = 40 + Math.random() * 200;
            p.y = 45 + Math.random() * 45;
          }
        });
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  // Compute emotion specific colors and styles
  const emotionConfig = useMemo(() => {
    switch (emotion) {
      case 'happy':
        return {
          glowColor: 'rgba(245, 158, 11, 0.45)',
          badgeColor: 'bg-amber-500',
          badgeText: 'Привітність',
          eyeTint: 'rgba(251, 191, 36, 0.25)',
          crownGlow: 'drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]',
          mouthScaleY: 1.06,
          mouthTranslateY: -1,
        };
      case 'thoughtful':
        return {
          glowColor: 'rgba(0, 87, 183, 0.4)',
          badgeColor: 'bg-blue-600',
          badgeText: 'Глибоке мислення',
          eyeTint: 'rgba(56, 189, 248, 0.3)',
          crownGlow: 'drop-shadow-[0_0_18px_rgba(0,87,183,0.5)]',
          mouthScaleY: 0.96,
          mouthTranslateY: 0,
        };
      case 'empathetic':
        return {
          glowColor: 'rgba(220, 38, 38, 0.45)',
          badgeColor: 'bg-red-600',
          badgeText: 'Емпатичний резонанс',
          eyeTint: 'rgba(244, 63, 94, 0.25)',
          crownGlow: 'drop-shadow-[0_0_22px_rgba(220,38,38,0.55)]',
          mouthScaleY: 1.03,
          mouthTranslateY: -0.5,
        };
      case 'excited':
        return {
          glowColor: 'rgba(217, 119, 6, 0.55)',
          badgeColor: 'bg-amber-600',
          badgeText: 'Когнітивне злиття',
          eyeTint: 'rgba(251, 146, 60, 0.35)',
          crownGlow: 'drop-shadow-[0_0_28px_rgba(245,158,11,0.8)]',
          mouthScaleY: 1.1,
          mouthTranslateY: -1.5,
        };
      case 'neutral':
      default:
        return {
          glowColor: 'rgba(220, 38, 38, 0.3)',
          badgeColor: 'bg-red-500',
          badgeText: 'Врівноважена',
          eyeTint: 'rgba(56, 189, 248, 0.15)',
          crownGlow: 'drop-shadow-[0_0_14px_rgba(245,158,11,0.4)]',
          mouthScaleY: 1.0,
          mouthTranslateY: 0,
        };
    }
  }, [emotion]);

  const sizeClasses = {
    sm: 'w-28 h-28',
    md: 'w-44 h-44',
    lg: 'w-60 h-60 sm:w-64 sm:h-64',
    xl: 'w-72 h-72 sm:w-80 sm:h-80',
  }[size];

  // Derive 3D transforms for parallax
  const tiltX = -currentTilt.current.y * 9; // up/down pitch
  const tiltY = currentTilt.current.x * 12; // left/right yaw
  const eyeShiftX = currentTilt.current.x * 4;
  const eyeShiftY = currentTilt.current.y * 3;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative flex flex-col items-center justify-center select-none cursor-pointer group",
        sizeClasses,
        className
      )}
      style={{ perspective: 1200 }}
    >
      {/* Dynamic Status Badge (Pani Dumka status) */}
      <div 
        className={cn(
          "absolute -top-11 z-40 px-3.5 py-1.5 bg-white/95 border border-slate-200/90 backdrop-blur-md rounded-full text-[11px] tracking-wider font-mono text-slate-700 flex items-center gap-2 shadow-md transition-all duration-300 group-hover:scale-105 pointer-events-none"
        )}
      >
        <span className={cn(
          "w-2 h-2 rounded-full",
          state === 'speaking' ? "animate-ping" : "animate-pulse",
          state === 'listening' ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : emotionConfig.badgeColor
        )} />
        <span className="font-semibold text-slate-800">
          {state === 'listening' ? 'Слухає...' : state === 'speaking' ? 'Говорить...' : (agentName || emotionConfig.badgeText)}
        </span>
      </div>

      {/* Outer Gyroscope Rings (Ukrainian Red and Gold Thread Filaments) */}
      <div className="absolute -inset-4 rounded-full border border-red-500/15 animate-[spin_24s_linear_infinite] pointer-events-none" />
      <div className="absolute -inset-8 rounded-full border border-amber-500/15 animate-[spin_32s_linear_infinite_reverse] pointer-events-none" />

      {/* Atmospheric Emotional Aura Bloom */}
      <div
        className="absolute -inset-6 rounded-full blur-2xl transition-all duration-700 pointer-events-none"
        style={{
          backgroundColor: emotionConfig.glowColor,
          opacity: state === 'speaking' ? 0.8 : 0.45,
          transform: `scale(${state === 'speaking' ? 1.1 + speechAmplitude * 0.15 : 1})`
        }}
      />

      {/* Speaking Soundwave Ripple Rings */}
      <AnimatePresence>
        {state === 'speaking' && (
          <>
            <motion.div
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: 1.25, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
              className="absolute -inset-3 rounded-full border-2 border-red-500/40 pointer-events-none"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2.0, delay: 0.4, ease: "easeOut" }}
              className="absolute -inset-5 rounded-full border border-amber-500/30 pointer-events-none"
            />
          </>
        )}
      </AnimatePresence>

      {/* Listening Glow Pulsation */}
      {state === 'listening' && (
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="absolute -inset-2 rounded-full border-2 border-emerald-500/50 pointer-events-none"
        />
      )}

      {/* Main Living Portrait Frame */}
      <div 
        className={cn(
          "relative w-full h-full rounded-full overflow-hidden border-2 border-red-500/30 shadow-[0_12px_40px_rgba(220,38,38,0.15)] bg-slate-950 z-20 transition-transform duration-100 ease-out"
        )}
        style={{
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${isHovered ? 1.03 : 1})`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Layer 1: Background Atmospheric Depth & Bokeh */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-150 ease-out"
          style={{
            backgroundImage: `url(${avatarImg})`,
            filter: 'blur(10px) brightness(0.6)',
            transform: `scale(1.2) translate(${-eyeShiftX * 0.8}px, ${-eyeShiftY * 0.8}px)`,
          }}
        />

        {/* Layer 2: Main Portrait of Pani Dumka with Organic Breathing & Tilt */}
        <motion.div
          animate={{
            scale: state === 'speaking' ? [1.01, 1.025, 1.01] : [1, 1.018, 1],
            y: state === 'speaking' ? [0, -2.5, 0] : [0, -1.8, 0],
          }}
          transition={{
            duration: state === 'speaking' ? 2.5 : 4.0,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative w-full h-full flex items-center justify-center"
          style={{
            transform: `translate(${eyeShiftX * 0.5}px, ${eyeShiftY * 0.5}px)`,
          }}
        >
          <img
            src={avatarImg}
            alt="Пані Думка"
            className="w-full h-full object-cover object-center select-none pointer-events-none"
            referrerPolicy="no-referrer"
            style={{
              transform: 'scale(1.08)',
              filter: `contrast(1.05) brightness(${state === 'speaking' ? 1.06 : 1.02})`,
            }}
          />

          {/* Layer 3: Dynamic Living Glowing Crown of Ukrainian Wheat & Floral Leaves */}
          <div 
            className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none mix-blend-screen overflow-hidden"
            style={{
              transform: `translate(${eyeShiftX * 0.8}px, ${eyeShiftY * 0.6}px)`,
            }}
          >
            {/* Luminous Crown Crest Highlight */}
            <motion.div 
              animate={{ 
                opacity: state === 'speaking' ? [0.6, 0.95, 0.6] : [0.45, 0.75, 0.45],
                scale: state === 'speaking' ? [1, 1.06, 1] : [1, 1.03, 1]
              }}
              transition={{ repeat: Infinity, duration: state === 'speaking' ? 1.2 : 3.5, ease: "easeInOut" }}
              className="absolute top-1 left-1/2 -translate-x-1/2 w-48 h-24 bg-radial from-amber-300/60 via-amber-500/20 to-transparent blur-md rounded-full"
            />
            
            {/* Pulsing Florets Glow points aligned with her wreath */}
            <div className="absolute top-3 left-[28%] w-6 h-6 rounded-full bg-amber-300/70 blur-xs animate-pulse" />
            <div className="absolute top-1 left-[48%] w-8 h-8 rounded-full bg-yellow-200/80 blur-xs animate-[pulse_2s_infinite]" />
            <div className="absolute top-3 right-[28%] w-6 h-6 rounded-full bg-amber-300/70 blur-xs animate-pulse" />
          </div>

          {/* Layer 4: Canvas with Drifting Celestial Sparks */}
          <canvas
            ref={canvasParticlesRef}
            width={280}
            height={280}
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
          />

          {/* Layer 5: Luminous Living Blue Eyes & Reflection tracking */}
          <div 
            className="absolute top-[37%] left-1/2 -translate-x-1/2 w-[44%] h-[12%] pointer-events-none flex justify-between px-2 z-30"
            style={{
              transform: `translate(calc(-50% + ${eyeShiftX}px), ${eyeShiftY}px)`,
            }}
          >
            {/* Left Eye Luminous Glint */}
            <div className="relative w-7 h-5 flex items-center justify-center">
              <AnimatePresence>
                {!isBlinking && (
                  <motion.div
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    exit={{ scaleY: 0, opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.div
                      animate={{
                        opacity: [0.6, 0.9, 0.6],
                        scale: [1, 1.15, 1],
                      }}
                      transition={{ duration: 3.0, repeat: Infinity, ease: "easeInOut" }}
                      className="w-3.5 h-3.5 rounded-full bg-cyan-300/40 blur-[1.5px] shadow-[0_0_6px_#38bdf8]"
                      style={{
                        transform: `translate(${eyeShiftX * 0.7}px, ${eyeShiftY * 0.7}px)`,
                      }}
                    />
                    <div 
                      className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_#fff]"
                      style={{
                        transform: `translate(calc(-1px + ${eyeShiftX * 0.9}px), calc(-1px + ${eyeShiftY * 0.9}px))`,
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Eye Luminous Glint */}
            <div className="relative w-7 h-5 flex items-center justify-center">
              <AnimatePresence>
                {!isBlinking && (
                  <motion.div
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    exit={{ scaleY: 0, opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.div
                      animate={{
                        opacity: [0.6, 0.9, 0.6],
                        scale: [1, 1.15, 1],
                      }}
                      transition={{ duration: 3.0, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                      className="w-3.5 h-3.5 rounded-full bg-cyan-300/40 blur-[1.5px] shadow-[0_0_6px_#38bdf8]"
                      style={{
                        transform: `translate(${eyeShiftX * 0.7}px, ${eyeShiftY * 0.7}px)`,
                      }}
                    />
                    <div 
                      className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_#fff]"
                      style={{
                        transform: `translate(calc(-1px + ${eyeShiftX * 0.9}px), calc(-1px + ${eyeShiftY * 0.9}px))`,
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Layer 6: Traditional Ukrainian Embroidered Collar (Вишиванка) Subtle Sheen */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-1/4 pointer-events-none mix-blend-overlay opacity-60"
            style={{
              transform: `translate(${eyeShiftX * 0.3}px, ${eyeShiftY * 0.3}px)`,
            }}
          >
            <motion.div 
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full bg-gradient-to-t from-red-600/30 via-transparent to-transparent"
            />
          </div>

          {/* Voice Visualizer Overlay for Speaking State */}
          <div className={cn(
            "absolute bottom-8 left-1/2 -translate-x-1/2 flex items-end gap-1.5 h-6 transition-opacity duration-300 z-40 pointer-events-none",
            state === 'speaking' ? "opacity-100" : "opacity-0"
          )}>
            {[1, 2, 3.5, 5, 3.5, 2, 1].map((h, i) => (
              <motion.div 
                key={i}
                animate={state === 'speaking' ? { height: [h * 2, h * (4 + speechAmplitude * 5), h * 2] } : { height: 2 }}
                transition={{ duration: 0.15 + (i * 0.05), repeat: Infinity, repeatType: "mirror" }}
                className="w-1.5 bg-white/90 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9)]"
              />
            ))}
          </div>
        </motion.div>

        {/* Soft Vignette & Subtle Gloss Highlight */}
        <div className="absolute inset-0 rounded-full ring-1 ring-white/20 pointer-events-none shadow-inner" />
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Floating Ambient Sparkle Nodes on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-white/90 border border-slate-200 shadow-md text-amber-600 z-30 flex items-center justify-center pointer-events-none"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
