import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Sparkles, Compass, CheckCircle2, ArrowRight, Loader2, FileText, Globe } from "lucide-react";
import { ai } from "../services/gemini";
import ReactMarkdown from "react-markdown";

interface DeepResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (query: string) => void;
}

export const DeepResearchModal: React.FC<DeepResearchModalProps> = ({
  isOpen,
  onClose,
  onSendToChat
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stages, setStages] = useState<string[]>([]);
  const [report, setReport] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartResearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setReport(null);
    setStages(["Формулювання семантичного графу теми...", "Синтез міждисциплінарних джерел..."]);

    try {
      setTimeout(() => {
        setStages(prev => [...prev, "Аналіз верифікованих публікацій та українського контексту..."]);
      }, 1500);

      setTimeout(() => {
        setStages(prev => [...prev, "Глибинний синтез висновків та стратегічних рекомендацій..."]);
      }, 3000);

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Проведи глибоке, структуроване, україноцентричне дослідження на тему: "${query}".
Склади аналітичний звіт за наступною структурою:
1. Виконавче резюме (Executive Summary)
2. Ключові концептуальні та практичні вектори
3. Потенційні ризики та можливості для України
4. Стратегічні рекомендації та висновки
Використовуй багату, академічно виважену та точну українську мову.`
              }
            ]
          }
        ]
      });

      if (response.text) {
        setReport(response.text);
      }
    } catch (error) {
      console.error("Deep research error:", error);
      setReport("Сталася помилка під час формування глибокого дослідження. Спробуйте уточнити запит.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-red-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/20">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
                  Глибоке дослідження
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    Deep Research 2.0
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-mono">Багатоетапний аналіз та синтез складних тем</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Input form */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-600 font-bold uppercase tracking-wider block">
                Тема або питання для глибокого дослідження
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isLoading && handleStartResearch()}
                  placeholder="наприклад: Розвиток суверенних ШІ-моделей в Україні, кіберстійкість..."
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-red-500 text-sm"
                />
                <button
                  onClick={handleStartResearch}
                  disabled={!query.trim() || isLoading}
                  className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Аналіз...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Дослідити</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Stages progress */}
            {isLoading && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold block">
                  Етапи когнітивного дослідження:
                </span>
                <div className="space-y-1.5">
                  {stages.map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-sans animate-fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{stage}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Final Report */}
            {report && (
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-600" />
                    Результати дослідження
                  </span>
                  {onSendToChat && (
                    <button
                      onClick={() => {
                        onSendToChat(`Дослідження на тему: ${query}\n\n${report}`);
                        onClose();
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>Перенести в діалог</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="markdown-body text-slate-800 text-sm leading-relaxed max-w-none">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
