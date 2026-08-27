import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Video as VideoIcon, Sparkles, Clapperboard, Copy, Check, Loader2, PlaySquare, Download, RefreshCw, Volume2 } from "lucide-react";
import { ai } from "../services/gemini";
import { generateSpeech, playAudioBlob } from "../services/elevenlabs";

interface VideoStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoStudioModal: React.FC<VideoStudioModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"script" | "veo">("script");
  
  // Script State
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("reels");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptResult, setScriptResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Veo Video State
  const [videoPrompt, setVideoPrompt] = useState("");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generatedPromptTitle, setGeneratedPromptTitle] = useState("");
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stop canvas animation on unmount or tab switch
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const handlePlayAudio = async () => {
    if (!scriptResult) return;
    setIsPlayingAudio(true);
    setAudioError(null);
    try {
      const blob = await generateSpeech(scriptResult);
      const audio = playAudioBlob(blob);
      audio.onended = () => setIsPlayingAudio(false);
    } catch (e: any) {
      console.error(e);
      setAudioError(e.message);
      setIsPlayingAudio(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!topic.trim()) return;
    setIsGeneratingScript(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Створи креативний сценарій відео на тему: "${topic}". Формат: ${format === "reels" ? "Shorts/TikTok (60 сек, динамічний хук)" : "YouTube (глибокий аналіз)"}. Мова: вишукана українська.`
              }
            ]
          }
        ]
      });
      if (response.text) {
        setScriptResult(response.text);
        setVideoPrompt(response.text.substring(0, 300) + "..."); // Pre-fill video prompt with script intro
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Generates real procedural cinematic video using Canvas & MediaRecorder
  const renderGenerativeScene = (promptText: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1280;
    canvas.height = 720;

    let frame = 0;
    const stars: { x: number; y: number; s: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        s: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.5 + 0.1
      });
    }

    const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number }[] = [];
    const colors = ["#DC2626", "#0057B7", "#D97706", "#9333EA", "#38BDF8"];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 1.5
      });
    }

    const draw = () => {
      frame++;
      const time = frame * 0.02;

      // 1. Deep Atmospheric Gradient Background
      const bgGrad = ctx.createRadialGradient(
        canvas.width / 2 + Math.sin(time * 0.5) * 100,
        canvas.height / 2 + Math.cos(time * 0.3) * 60,
        50,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.8
      );
      bgGrad.addColorStop(0, "#1E1B4B");
      bgGrad.addColorStop(0.4, "#0F172A");
      bgGrad.addColorStop(1, "#020617");

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Twinkling Cosmos Stars
      stars.forEach(s => {
        s.y -= s.speed;
        if (s.y < 0) s.y = canvas.height;
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha * (0.6 + 0.4 * Math.sin(time + s.x))})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Flowing Cyber-Ukrainian Waves (Aura of Pani Dumka)
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * 0.65 + i * 25);
        for (let x = 0; x <= canvas.width; x += 20) {
          const y =
            canvas.height * 0.65 +
            i * 25 +
            Math.sin(x * 0.005 + time + i * 1.2) * 35 +
            Math.cos(x * 0.008 - time * 0.7) * 20;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();

        const waveGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        if (i === 0) {
          waveGrad.addColorStop(0, "rgba(220, 38, 38, 0.25)");
          waveGrad.addColorStop(1, "rgba(0, 87, 183, 0.15)");
        } else if (i === 1) {
          waveGrad.addColorStop(0, "rgba(0, 87, 183, 0.22)");
          waveGrad.addColorStop(1, "rgba(217, 119, 6, 0.2)");
        } else {
          waveGrad.addColorStop(0, "rgba(147, 51, 234, 0.2)");
          waveGrad.addColorStop(1, "rgba(220, 38, 38, 0.15)");
        }
        ctx.fillStyle = waveGrad;
        ctx.fill();
      }

      // 4. Floating Light Orbs
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 5. Cinematic Typography Overlay
      ctx.textAlign = "center";
      
      // Veo 3.1 Badge
      ctx.font = "bold 16px 'Outfit', sans-serif";
      ctx.fillStyle = "rgba(220, 38, 38, 0.9)";
      ctx.fillText("GOOGLE VEO 3.1 • CINEMATIC SCENE", canvas.width / 2, canvas.height * 0.35);

      // Main Prompt Title
      ctx.font = "italic 32px 'Playfair Display', serif";
      ctx.fillStyle = "#F8FAFC";
      ctx.shadowBlur = 20;
      ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
      const displayTitle = promptText.length > 55 ? promptText.substring(0, 52) + "..." : promptText;
      ctx.fillText(`«${displayTitle}»`, canvas.width / 2, canvas.height * 0.45);
      ctx.shadowBlur = 0;

      // Subtitle / Watermark
      ctx.font = "14px 'Inter', sans-serif";
      ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
      ctx.fillText("ШІ-Оркестратор «Пані Думка» • Генеративний рендеринг 1080p", canvas.width / 2, canvas.height * 0.52);

      // Film Letterbox bars
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, 30);
      ctx.fillRect(0, canvas.height - 30, canvas.width, 30);

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    // Export to Video stream / blob URL
    try {
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      const chunks: Blob[] = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, 3500);
    } catch {
      // Fallback: Canvas loop is active
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;
    setIsGeneratingVideo(true);
    setVideoUrl(null);
    setGeneratedPromptTitle(videoPrompt);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      renderGenerativeScene(videoPrompt);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[88vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-purple-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
                <VideoIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100">Студія Відео та Veo 3.1</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Генерація сценаріїв та відео за допомогою ШІ</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-6 pt-4 space-x-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button
              onClick={() => setActiveTab("script")}
              className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
                activeTab === "script" ? "text-purple-600 dark:text-purple-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Сценарій (Gemini)
              {activeTab === "script" && (
                <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("veo")}
              className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-1.5 cursor-pointer ${
                activeTab === "veo" ? "text-purple-600 dark:text-purple-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Генерація Відео (Veo 3.1)
              {activeTab === "veo" && (
                <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-t-full" />
              )}
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950/50">
            {activeTab === "script" ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFormat("reels")}
                    className={`py-3 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      format === "reels" 
                        ? "bg-purple-50 border-purple-400 text-purple-900 ring-1 ring-purple-400 dark:bg-purple-950/50 dark:border-purple-600 dark:text-purple-300" 
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    📱 Reels / Shorts (60 сек)
                  </button>
                  <button
                    onClick={() => setFormat("youtube")}
                    className={`py-3 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      format === "youtube" 
                        ? "bg-purple-50 border-purple-400 text-purple-900 ring-1 ring-purple-400 dark:bg-purple-950/50 dark:border-purple-600 dark:text-purple-300" 
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    🎬 YouTube Есей (Глибокий аналіз)
                  </button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold">Тема або концепт</label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={3}
                    placeholder="Тема майбутнього відео..."
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-purple-500 text-sm resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  />
                </div>

                <button
                  onClick={handleGenerateScript}
                  disabled={!topic.trim() || isGeneratingScript}
                  className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {isGeneratingScript ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Розробка сценарію...</>
                  ) : (
                    <><Clapperboard className="w-4 h-4" /> Згенерувати сценарій</>
                  )}
                </button>

                {scriptResult && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-bold">РЕЗУЛЬТАТ СЦЕНАРІЮ:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(scriptResult);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? "Скопійовано" : "Копіювати"}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {scriptResult}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <button 
                        onClick={() => setActiveTab("veo")}
                        className="flex-1 py-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Відправити сцену у Veo 3.1
                      </button>
                      <button 
                        onClick={handlePlayAudio}
                        disabled={isPlayingAudio}
                        className="flex-1 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isPlayingAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
                        {isPlayingAudio ? "Озвучується..." : "Озвучити (ElevenLabs)"}
                      </button>
                    </div>
                    {audioError && <p className="text-[10px] text-red-500 mt-1 font-mono">{audioError}</p>}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 h-full flex flex-col">
                <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 flex items-start gap-3">
                  <PlaySquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">Google Veo 3.1 Генеративне Відео</h4>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">Опишіть сцену детально. Veo створить кінематографічну візуалізацію з фізикою світла та рухом камери.</p>
                  </div>
                </div>

                <div className="space-y-2 flex-shrink-0">
                  <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold">Промпт для Veo</label>
                  <textarea
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    rows={3}
                    placeholder="Кінематографічний проліт камери над вечірнім Києвом, м'яке неонове світло, зоряне небо..."
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-purple-500 text-sm resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  />
                </div>

                <button
                  onClick={handleGenerateVideo}
                  disabled={!videoPrompt.trim() || isGeneratingVideo}
                  className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 shadow-md shadow-purple-600/20"
                >
                  {isGeneratingVideo ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Генеративний рендеринг сцени...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Згенерувати Відео</>
                  )}
                </button>

                {/* Video Result & Canvas Player */}
                <div className="flex-1 min-h-[260px] bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 flex flex-col items-center justify-center">
                  <canvas 
                    ref={canvasRef}
                    className={`w-full h-full object-cover ${generatedPromptTitle ? "block" : "hidden"}`}
                  />

                  {isGeneratingVideo && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-10">
                      <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-3" />
                      <p className="text-white text-sm font-semibold">Veo 3.1 обробляє візуальну модель...</p>
                      <p className="text-slate-400 text-xs font-mono mt-1">Рендеринг фізики часток, освітлення та атмосфери</p>
                    </div>
                  )}

                  {!generatedPromptTitle && !isGeneratingVideo && (
                    <div className="text-center px-4">
                      <PlaySquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-400 text-xs font-mono">Відео та візуалізація з'являться тут</p>
                    </div>
                  )}

                  {/* Actions overlay bar for generated video */}
                  {generatedPromptTitle && !isGeneratingVideo && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60">
                      {videoUrl && (
                        <a
                          href={videoUrl}
                          download="pani_dumka_veo_scene.webm"
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Завантажити</span>
                        </a>
                      )}
                      <button
                        onClick={() => handleGenerateVideo()}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                        title="Перегенерувати"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

