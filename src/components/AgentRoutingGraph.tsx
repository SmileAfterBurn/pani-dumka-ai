import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AGENT_REGISTRY } from '../services/gemini';
import { A2AEvent } from '../services/a2aProtocol';
import * as LucideIcons from 'lucide-react';

interface AgentRoutingGraphProps {
  events: A2AEvent[];
}

export const AgentRoutingGraph: React.FC<AgentRoutingGraphProps> = ({ events }) => {
  const radius = 180;
  const centerX = 200;
  const centerY = 200;
  const numNodes = AGENT_REGISTRY.length;

  // Обчислюємо позиції агентів по колу
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number, y: number, angle: number }> = {};
    AGENT_REGISTRY.forEach((agent, index) => {
      const angle = (index / numNodes) * 2 * Math.PI - Math.PI / 2; // Зміщення, щоб починалося зверху
      positions[agent.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        angle
      };
    });
    return positions;
  }, [numNodes]);

  // Виділяємо активні з'єднання з останніх подій (наприклад, останні 20)
  const activeLinks = useMemo(() => {
    const recentEvents = events.slice(-20);
    const links: { source: string; target: string; count: number }[] = [];
    
    recentEvents.forEach(ev => {
      const src = ev.meta.sourceAgent;
      const tgt = ev.meta.targetAgent;
      
      // Ігноруємо бродкасти та системні повідомлення без конкретного цільового агента, 
      // якщо вони не відповідають жодному агенту (але "orchestrator" можемо вважати центром)
      if (src && tgt && tgt !== "broadcast" && tgt !== "orchestrator") {
        const existing = links.find(l => l.source === src && l.target === tgt);
        if (existing) {
          existing.count += 1;
        } else {
          links.push({ source: src, target: tgt as string, count: 1 });
        }
      }
    });
    return links;
  }, [events]);

  const activeNodes = useMemo(() => {
    const active = new Set<string>();
    activeLinks.forEach(l => {
      active.add(l.source);
      active.add(l.target);
    });
    return active;
  }, [activeLinks]);

  const getIcon = (iconName: string) => {
    // @ts-ignore
    const IconComponent = LucideIcons[iconName] || LucideIcons.Bot;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto select-none">
      {/* SVG-шар для зв'язків */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
        <defs>
          <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Фонова павутина (усі можливі зв'язки ледь видимі, за бажанням можна прибрати) */}
        
        {/* Активні зв'язки */}
        <AnimatePresence>
          {activeLinks.map((link, i) => {
            const srcPos = nodePositions[link.source];
            const tgtPos = nodePositions[link.target];
            if (!srcPos || !tgtPos) return null;

            // Малюємо криву Безьє через центр, щоб лінії не були просто прямими
            const cx = 200;
            const cy = 200;
            const path = `M ${srcPos.x} ${srcPos.y} Q ${cx} ${cy} ${tgtPos.x} ${tgtPos.y}`;

            return (
              <motion.path
                key={`${link.source}-${link.target}-${i}`}
                d={path}
                fill="none"
                stroke="url(#linkGradient)"
                strokeWidth={Math.min(1 + link.count * 0.5, 4)}
                filter="url(#glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            );
          })}
        </AnimatePresence>

        {/* Частинки, що летять по активних зв'язках */}
        {activeLinks.map((link, i) => {
          const srcPos = nodePositions[link.source];
          const tgtPos = nodePositions[link.target];
          if (!srcPos || !tgtPos) return null;
          
          return (
            <motion.circle
              key={`particle-${link.source}-${link.target}`}
              r={3}
              fill="#fff"
              filter="url(#glow)"
              animate={{
                cx: [srcPos.x, tgtPos.x],
                cy: [srcPos.y, tgtPos.y],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.2
              }}
            />
          );
        })}
      </svg>

      {/* HTML-шар для вузлів (Агентів) */}
      {AGENT_REGISTRY.map((agent) => {
        const pos = nodePositions[agent.id];
        const isActive = activeNodes.has(agent.id);

        return (
          <motion.div
            key={agent.id}
            className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center border shadow-sm transition-all z-10 ${
              isActive 
                ? 'bg-blue-600 border-blue-400 text-white shadow-blue-500/50 scale-110' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:scale-110'
            }`}
            style={{ left: pos.x, top: pos.y }}
            title={agent.name}
            initial={{ scale: 0 }}
            animate={{ scale: isActive ? 1.15 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {getIcon(agent.icon)}
            
            {/* Підпис (показуємо лише якщо активний або наведення) */}
            <div className={`absolute top-10 whitespace-nowrap text-[9px] font-bold px-1.5 py-0.5 rounded pointer-events-none transition-opacity ${
              isActive 
                ? 'opacity-100 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' 
                : 'opacity-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {agent.tag}
            </div>
          </motion.div>
        );
      })}

      {/* Центральний вузол (Оркестратор - Пані Думка) */}
      <div className="absolute top-1/2 left-1/2 -ml-6 -mt-6 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg shadow-purple-500/30 z-20">
        <LucideIcons.BrainCircuit className="w-6 h-6 text-white" />
        <div className="absolute top-14 whitespace-nowrap text-[10px] font-bold px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300">
          Оркестратор
        </div>
      </div>
    </div>
  );
};
