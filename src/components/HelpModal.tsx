import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, BookOpen, Layers, Sparkles, ShieldAlert, Code, Compass, Activity, Brain } from "lucide-react";
import { AGENT_REGISTRY } from "../services/gemini";
import { UkrainianOrnament } from "./UkrainianOrnament";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent: (tag: string) => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onSelectAgent }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200/60">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">Довідка «Пані Думка Аі»</h3>
                <p className="text-xs text-slate-500 font-mono">Архітектура, швидкі команди та {AGENT_REGISTRY.length} агентів</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Overview */}
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-slate-900 text-base">Що таке «Пані Думка Аі»?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                «Пані Думка» — це україноцентричний інтелектуальний мультимодальний ШІ-оркестратор нового покоління. 
                Вона поєднує шляхетну мовну культуру, тяглість української філософської традиції та оркестрацію {AGENT_REGISTRY.length} спеціалізованих агентів для розв'язання найскладніших аналітичних, інженерних, безпекових та соціальних завдань.
              </p>
            </div>

            <UkrainianOrnament variant="divider" className="my-1" />

            {/* Calling Agents */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-slate-900 text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-600" />
                  {AGENT_REGISTRY.length} Спеціалізованих Агентів (Виклик через @тег)
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Ви можете викликати будь-якого агента безпосередньо у повідомленні (наприклад, <code>@code напиши хук</code> або <code>@security перевір конфіг</code>):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AGENT_REGISTRY.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      onSelectAgent(agent.tag);
                      onClose();
                    }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/50 text-left transition-all flex flex-col gap-1 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 group-hover:text-red-600 transition-colors">
                        {agent.name}
                      </span>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        {agent.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {agent.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Developer Info */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2">
              <h5 className="font-serif font-bold text-indigo-900 text-sm flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-700" />
                Про Розробника
              </h5>
              <p className="text-xs text-indigo-900/80 leading-relaxed">
                Творець та ко-фаундер екосистеми «Пані Думка» — <strong>Ілля (SmileAfterBurn)</strong>. Архітектура застосунку, емпатійний підхід та соціальна місія (інтеграція з мапою турботи) були розроблені для забезпечення максимальної допомоги та комфорту користувачів України в сучасних реаліях.
              </p>
            </div>

            {/* Care Map & SmileAfterBurn */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <h5 className="font-serif font-bold text-amber-900 text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-amber-700" />
                Соціальна Мапа Турботи та SmileAfterBurn
              </h5>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                Екосистема містить глибоку базу з понад 6 200 верифікованих центрів допомоги, гуманітарних штабів, шелтерів та психологічної підтримки по всій Україні, розроблених у партнерстві з Іллею Черновим.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 font-medium text-xs transition-colors cursor-pointer"
            >
              Зрозуміло
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
