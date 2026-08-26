import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Video as VideoIcon, Film, Sparkles, Clapperboard, Copy, Check, Loader2 } from "lucide-react";
import { ai } from "../services/gemini";

interface VideoStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoStudioModal: React.FC<VideoStudioModalProps> = ({ isOpen, onClose }) => {
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("reels");
  const [isGenerating, setIsGenerating] = useState(false);
  const [scriptResult, setScriptResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateScript = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Створи креативний сценарій відео (візуальний ряд, аудіоряд, таймінги) на тему: "${topic}".
Формат: ${format === "reels" ? "Shorts / Reels / TikTok (60 сек, динамічний хук, шляхетний україноцентричний наратив)" : "YouTube / Документальний есей (глибокий аналіз, кінематографічні плани)"}.
Мова: вишукана, багата українська мова.`
              }
            ]
          }
        ]
      });

      if (response.text) {
        setScriptResult(response.text);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-purple-50/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
                <VideoIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">Студія Відео</h3>
                <p className="text-xs text-slate-500 font-mono">Генерація відео-сценаріїв, розкадрувань та ідей</p>
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
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Format Selector */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-500 uppercase tracking-wider font-bold block">
                Формат відео
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat("reels")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    format === "reels"
                      ? "bg-purple-50 border-purple-400 text-purple-900 ring-1 ring-purple-400"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  📱 Reels / Shorts / TikTok (60s)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("youtube")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    format === "youtube"
                      ? "bg-purple-50 border-purple-400 text-purple-900 ring-1 ring-purple-400"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  🎬 YouTube / Документальний
                </button>
              </div>
            </div>

            {/* Topic Input */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-500 uppercase tracking-wider font-bold block">
                Тема відео чи концепт
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                placeholder="наприклад: «Як виникла Соціальна Мапа Турботи та чому когнітивні ШІ-системи важливі для майбутнього України»..."
                className="w-full p-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-purple-500 text-sm resize-none"
              />
            </div>

            <button
              onClick={handleGenerateScript}
              disabled={!topic.trim() || isGenerating}
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Розробка кінематографічного сценарію...</span>
                </>
              ) : (
                <>
                  <Clapperboard className="w-4 h-4" />
                  <span>Згенерувати сценарій та розкадровку</span>
                </>
              )}
            </button>

            {/* Script Result */}
            {scriptResult && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-600 font-bold uppercase tracking-wider">
                    Сценарій & Візуальний план:
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(scriptResult);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Скопійовано" : "Копіювати"}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                  {scriptResult}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
