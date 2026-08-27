// Живий аватар Пані Думки з 3D-паралаксом, природною мімікою та сяйвом

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import avatarImg from '../assets/images/pani_dumka_avatar.png';
import { Sparkles, Mic, Volume2 } from 'lucide-react';

export type AvatarEmotion = 'neutral' | 'happy' | 'thoughtful' | 'empathetic' | 'excited';

interface LiveAvatarProps {
  state: 'idle' | 'listening' | 'speaking';
  emotion?: AvatarEmotion;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  agentName?: string;
}

// Частинки світла, що здіймаються від вінка Пані Думки
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

  // Відстеження руху миші та глибини паралаксу
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [speechAmplitude, setSpeechAmplitude] = useState(0);

  // Плавні інтерпольовані кути нахилу голови
  const currentTilt = useRef({ x: 0, y: 0 });
  const targetTilt = useRef({ x: 0, y: 0 });
  const idleLookRef = useRef({ x: 0, y: 0 });
  const isHoveredRef = useRef(false);
  const animFrameId = useRef<number | null>(null);

  // Природний біоритм кліпання очей
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    let shutTimeout: NodeJS.Timeout;

    const scheduleBlink = () => {
      const interval = 3000 + Math.random() * 4000;
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        // Реалістична тривалість кліпання (140-180 мс)
        shutTimeout = setTimeout(() => {
          setIsBlinking(false);
          // Періодичне подвійне кліпання
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

  // Симуляція артикуляції та пульсації голосу
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

  // Сакадичні мікрорухи погляду в режимі очікування
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const scheduleIdleLook = () => {
      const interval = 2000 + Math.random() * 4000;
      timeout = setTimeout(() => {
        if (state === 'idle' && !isHoveredRef.current) {
          if (Math.random() > 0.4) {
            idleLookRef.current = {
              x: (Math.random() - 0.5) * 0.5,
              y: (Math.random() - 0.5) * 0.5
            };
          } else {
            idleLookRef.current = { x: 0, y: 0 };
          }
        }
        scheduleIdleLook();
      }, interval);
    };

    scheduleIdleLook();
    return () => clearTimeout(timeout);
  }, [state]);

  // Відстеження курсора для ефекту інтерактивного погляду та нахилу
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const diffX = e.clientX - centerX;
      const diffY = e.clientY - centerY;
      
      // Чутливість: радіус у пікселях для максимального нахилу
      const sensitivity = window.innerWidth / 2.5; 
      const x = Math.max(-1, Math.min(1, diffX / sensitivity));
      const y = Math.max(-1, Math.min(1, diffY / sensitivity));
      
      targetTilt.current = { x, y };
      isHoveredRef.current = true;
      
      // Повернення в спокійний стан при виході за межі вікна
      if (
        e.clientX <= 10 || e.clientY <= 10 || 
        e.clientX >= window.innerWidth - 10 || e.clientY >= window.innerHeight - 10
      ) {
        isHoveredRef.current = false;
        targetTilt.current = { x: 0, y: 0 };
      }
    };

    const handleGlobalMouseLeave = () => {
      isHoveredRef.current = false;
      targetTilt.current = { x: 0, y: 0 };
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseleave', handleGlobalMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseleave', handleGlobalMouseLeave);
    };
  }, []);

  // Безперервний цикл анімації часток вінка, дихання та мікросакад
  useEffect(() => {
    const canvas = canvasParticlesRef.current;
    const ctx = canvas?.getContext('2d');
    let particles: CrownParticle[] = [];

    // Ініціалізація 28 часток теплого сяйва вінка
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

      // Природне мікродихання та легке погойдування
      const idleSwayX = Math.sin(t * 0.6) * 0.15;
      const idleSwayY = Math.cos(t * 0.9) * 0.12;

      // Визначення активної цілі погляду
      const targetX = isHoveredRef.current ? targetTilt.current.x : idleLookRef.current.x;
      const targetY = isHoveredRef.current ? targetTilt.current.y : idleLookRef.current.y;

      // Плавна інтерполяція положення
      const lerp = 0.08;
      currentTilt.current.x += (targetX + idleSwayX - currentTilt.current.x) * lerp;
      currentTilt.current.y += (targetY + idleSwayY - currentTilt.current.y) * lerp;

      // Рендеринг часток сяйва на канвасі
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

          // Оновлення частки біля основи вінка
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

  // Конфігурація візуальних ефектів відповідно до емоційного стану
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

  // Розрахунок 3D-перетворень для паралаксу
  const tiltX = -currentTilt.current.y * 9; // нахил угору / вниз
  const tiltY = currentTilt.current.x * 12; // поворот ліворуч / праворуч
  const eyeShiftX = currentTilt.current.x * 4;
  const eyeShiftY = currentTilt.current.y * 3;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex flex-col items-center justify-center select-none cursor-pointer group",
        sizeClasses,
        className
      )}
      style={{ perspective: 1200 }}
    >
      {/* Динамічний статусний бейдж стану Пані Думки */}
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

      {/* Зовнішні орбіти-гіроскопи (традиційна нитка автентичної палітри) */}
      <div className="absolute -inset-4 rounded-full border border-red-500/15 animate-[spin_24s_linear_infinite] pointer-events-none" />
      <div className="absolute -inset-8 rounded-full border border-amber-500/15 animate-[spin_32s_linear_infinite_reverse] pointer-events-none" />
      
      {/* Атмосферна аура емоційного стану */}
      <motion.div
        className="absolute -inset-8 rounded-full blur-2xl pointer-events-none"
        animate={{
          backgroundColor: emotionConfig.glowColor,
          opacity: state === 'speaking' ? [0.6, 0.85, 0.6] : [0.35, 0.6, 0.35],
          scale: state === 'speaking' ? [1.0, 1.1 + speechAmplitude * 0.15, 1.0] : [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: state === 'speaking' ? 1.2 : 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          backgroundColor: { duration: 1.5, ease: "easeInOut" }
        }}
      />

      {/* Хвильові кола звуку під час мовлення */}
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

      {/* Пульсація готовності слухати */}
      {state === 'listening' && (
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="absolute -inset-2 rounded-full border-2 border-emerald-500/50 pointer-events-none"
        />
      )}

      {/* Головна рама живого портрета */}
      <div 
        className={cn(
          "relative w-full h-full rounded-full overflow-hidden border-2 border-red-500/30 shadow-[0_12px_40px_rgba(220,38,38,0.15)] bg-slate-950 z-20 transition-transform duration-100 ease-out"
        )}
        style={{
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${isHovered ? 1.03 : 1})`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Шар 1: Фонова атмосферна глибина */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-150 ease-out"
          style={{
            backgroundImage: `url(${avatarImg})`,
            filter: 'blur(10px) brightness(0.6)',
            transform: `scale(1.2) translate(${-eyeShiftX * 0.8}px, ${-eyeShiftY * 0.8}px)`,
          }}
        />

        {/* Шар 2: Головний портрет Пані Думки з природним диханням */}
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

          {/* Шар 3: Сяючий вінок із пшеницею та квітами */}
          <div 
            className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none mix-blend-screen overflow-hidden"
            style={{
              transform: `translate(${eyeShiftX * 0.8}px, ${eyeShiftY * 0.6}px)`,
            }}
          >
            <motion.div 
              animate={{ 
                opacity: state === 'speaking' ? [0.6, 0.95, 0.6] : [0.45, 0.75, 0.45],
                scale: state === 'speaking' ? [1, 1.06, 1] : [1, 1.03, 1]
              }}
              transition={{ repeat: Infinity, duration: state === 'speaking' ? 1.2 : 3.5, ease: "easeInOut" }}
              className="absolute top-1 left-1/2 -translate-x-1/2 w-48 h-24 bg-radial from-amber-300/60 via-amber-500/20 to-transparent blur-md rounded-full"
            />
            
            <div className="absolute top-3 left-[28%] w-6 h-6 rounded-full bg-amber-300/70 blur-xs animate-pulse" />
            <div className="absolute top-1 left-[48%] w-8 h-8 rounded-full bg-yellow-200/80 blur-xs animate-[pulse_2s_infinite]" />
            <div className="absolute top-3 right-[28%] w-6 h-6 rounded-full bg-amber-300/70 blur-xs animate-pulse" />
          </div>

          {/* Шар 4: Канвас з мікроіскрами сяйва */}
          <canvas
            ref={canvasParticlesRef}
            width={280}
            height={280}
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
          />

          {/* Шар 5: Світлі живі очі з трекінгом відблисків */}
          <div 
            className="absolute top-[37%] left-1/2 -translate-x-1/2 w-[44%] h-[12%] pointer-events-none flex justify-between px-2 z-30"
            style={{
              transform: `translate(calc(-50% + ${eyeShiftX}px), ${eyeShiftY}px)`,
            }}
          >
            {/* Ліве око */}
            <div className="relative w-8 h-5 flex items-center justify-center overflow-hidden rounded-full">
              <AnimatePresence>
                {!isBlinking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.05 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.div
                      animate={{
                        opacity: [0.6, 0.9, 0.6],
                        scale: [1, 1.15, 1],
                      }}
                      transition={{ duration: 3.0, repeat: Infinity, ease: "easeInOut", delay: 0 }}
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

              {/* Повіка для кліпання */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: isBlinking ? '100%' : '0%' }}
                transition={{ duration: 0.1, ease: "easeInOut" }}
                className="absolute top-0 left-0 w-full bg-[#d6a98b]/90 backdrop-blur-sm z-10"
                style={{ originY: 0, borderBottom: isBlinking ? '1px solid #b48569' : 'none' }}
              />
            </div>
            {/* Праве око */}
            <div className="relative w-8 h-5 flex items-center justify-center overflow-hidden rounded-full">
              <AnimatePresence>
                {!isBlinking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.05 }}
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

              {/* Повіка для кліпання */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: isBlinking ? '100%' : '0%' }}
                transition={{ duration: 0.1, ease: "easeInOut" }}
                className="absolute top-0 left-0 w-full bg-[#d6a98b]/90 backdrop-blur-sm z-10"
                style={{ originY: 0, borderBottom: isBlinking ? '1px solid #b48569' : 'none' }}
              />
            </div>
          </div>
          {/* Шар 6: Вишиваний комір (м'яке фольклорне підсвічування) */}
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

          {/* Візуалізатор голосу під час мовлення */}
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

        {/* М'яка віньєтка та блік */}
        <div className="absolute inset-0 rounded-full ring-1 ring-white/20 pointer-events-none shadow-inner" />
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Інтерактивна іскра при наведенні курсора */}
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

// Декоратор «Червона Нитка» (український стилістичний мотив)
export const RedThreadDecorator: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={cn("h-0.5 w-full bg-gradient-to-r from-transparent via-[#D32F2F] to-transparent opacity-40", className)} />
);

// 1. Поточна 2D-версія живого аватара (надійний фолбек з мімікою та паралаксом)
export const Fallback2DAvatar = ({ 
  isConnected, 
  isConnecting, 
  emotion = 'neutral',
  size = 'xl',
  agentName
}: { 
  isConnected: boolean; 
  isConnecting: boolean; 
  emotion?: AvatarEmotion;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  agentName?: string;
}) => (
  <LiveAvatar 
    state={isConnected ? 'speaking' : isConnecting ? 'listening' : 'idle'}
    emotion={emotion}
    size={size}
    agentName={agentName}
  />
);

// 2. Скелет для майбутнього GLB Аватара
// Коли додасте react-three-fiber, цей компонент буде відмальовувати 3D-модель
export const GlbAvatarModel = ({ isConnected }: { isConnected: boolean }) => {
  /*
  const { scene, nodes } = useGLTF('/models/pani_dumka.glb');

  // Тут буде логіка ліпсінку від ElevenLabs.
  // Наприклад, аналіз Web Audio API AnalyzerNode для зміни Morph Targets:
  useFrame(() => {
    if (isConnected && nodes.Head) {
      // nodes.Head.morphTargetInfluences[nodes.Head.morphTargetDictionary['mouthOpen']] = currentAudioVolume;
    }
  });

  return <primitive object={scene} scale={1.5} position={[0, -1, 0]} />;
  */
  return null;
};

// 3. Контейнер Аватара (Перемикач 2D / 3D)
export const DumkaAvatarContainer = ({ 
  isConnected, 
  isConnecting,
  emotion = 'neutral',
  size = 'xl',
  agentName
}: { 
  isConnected: boolean; 
  isConnecting: boolean;
  emotion?: AvatarEmotion;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  agentName?: string;
}) => {
  // Змініть на true, коли встановите бібліотеки (three, @react-three/fiber, @react-three/drei) та додасте GLB файл
  const USE_3D_AVATAR = false;

  if (!USE_3D_AVATAR) {
    return (
      <Fallback2DAvatar 
        isConnected={isConnected} 
        isConnecting={isConnecting} 
        emotion={emotion}
        size={size}
        agentName={agentName}
      />
    );
  }

  return (
    <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
      {/*
      Коли USE_3D_AVATAR буде true, тут працюватиме Canvas:
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <React.Suspense fallback={<Fallback2DAvatar isConnected={isConnected} isConnecting={isConnecting} />}>
          <GlbAvatarModel isConnected={isConnected} />
        </React.Suspense>
      </Canvas>
      */}
    </div>
  );
};

