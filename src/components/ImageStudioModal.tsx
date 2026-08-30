import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Image as ImageIcon, Sparkles, Wand2, Download, Copy, Check, Loader2 } from "lucide-react";
import { ai } from "../services/gemini";

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<string>("ukrainian-modern");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPromptIdea, setGeneratedPromptIdea] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePromptIdea = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedImage(null);
    setGeneratedPromptIdea(null);
    try {
      const fullPrompt = `${prompt}. Style: ${style === "ukrainian-modern" ? "Modern Ukrainian minimalism, clean lines, plenty of negative space, elegant" : style === "minimalism" ? "Surreal minimalism, deep negative space, soft cinematic lighting, dreamlike" : "Spatial futurism, minimalist, elegant, 3d rendered, high quality"}. No text. High resolution.`;
      
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt })
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate image");
      }
      
      const data = await response.json();
      
      if (data.imageBytes) {
        setGeneratedImage(`data:image/jpeg;base64,${data.imageBytes}`);
      }
    } catch (e) {
      console.error(e);
      setGeneratedPromptIdea("Виникла помилка під час генерації. Перевірте налаштування та ключі доступу.");
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
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-sky-50/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">Студія Зображень</h3>
                <p className="text-xs text-slate-500 font-mono">Генерація та концептуалізація візуальних образів</p>
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
            {/* Style Selector */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-500 uppercase tracking-wider font-bold block">
                Стилістичний напрямок
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "ukrainian-modern", label: "🇺🇦 Український Модернізм" },
                  { id: "minimalism", label: "✨ Сюрреалізм & Мінімалізм" },
                  { id: "spatial-futurism", label: "⚡ Spatial Futurism" }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setStyle(st.id)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      style === st.id
                        ? "bg-sky-50 border-sky-400 text-sky-900 ring-1 ring-sky-400"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-500 uppercase tracking-wider font-bold block">
                Опис візуальної ідеї
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder="Опишіть, що ви хочете зобразити: наприклад, «Просторова геометрична фігура зі скла у вакуумі»..."
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleGeneratePromptIdea}
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Генерація зображення...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Згенерувати Зображення</span>
                </>
              )}
            </button>

            {/* Result */}
            {generatedImage && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm mt-4">
                <img src={generatedImage} alt="Generated" className="w-full h-auto object-cover" />
              </div>
            )}
            {generatedPromptIdea && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-600 font-bold uppercase tracking-wider">
                    Художній синтез & Промпт:
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPromptIdea);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Скопійовано" : "Копіювати"}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                  {generatedPromptIdea}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
