/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, 
  Map as MapIcon, 
  Brain, 
  User, 
  MessageSquare, 
  X,
  Send,
  ChevronRight,
  PhoneOff,
  AlertCircle,
  LogOut,
  Sparkles,
  ShieldAlert,
  Search,
  Network,
  TrendingUp,
  Database,
  Code as CodeIcon,
  Atom,
  Dices,
  Compass,
  Activity,
  BookOpen,
  CheckSquare,
  Layers,
  Bot,
  SquarePen,
  Image as ImageIcon,
  Video as VideoIcon,
  Globe,
  Settings,
  HelpCircle,
  Plus,
  Radio,
  Menu,
  FileText,
  Volume2
} from "lucide-react";
import { cn } from "./lib/utils";
import { 
  chat, 
  CREATOR_INSTRUCTION, 
  STANDARD_INSTRUCTION, 
  AGENT_REGISTRY, 
  AgentDescriptor,
  detectAgentFromMessage 
} from "./services/gemini";
import ReactMarkdown from "react-markdown";
import { useLiveConversation } from "./hooks/useLiveConversation";
import { auth, googleProvider } from "./services/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { LiveAvatar, AvatarEmotion } from "./components/LiveAvatar";
import { useGeminiSpeechRecognition } from "./hooks/useGeminiSpeechRecognition";
import { JournalView } from "./components/JournalView";
import { CognitiveScannerModal } from "./components/CognitiveScannerModal";
import { UkrainianOrnament } from "./components/UkrainianOrnament";
import { PaniDumkaLogo } from "./components/PaniDumkaLogo";
import { SettingsModal } from "./components/SettingsModal";
import { HelpModal } from "./components/HelpModal";
import { DeepResearchModal } from "./components/DeepResearchModal";
import { ImageStudioModal } from "./components/ImageStudioModal";
import { VideoStudioModal } from "./components/VideoStudioModal";
import { WorkspaceModal } from "./components/WorkspaceModal";
import { CollaborativeCanvas } from "./components/CollaborativeCanvas";
import avatarImg from "./assets/images/pani_dumka_avatar_1779399213744.png";

// Icon mapping helper for agent badges
const getAgentIcon = (iconName: string, className: string = "w-4 h-4") => {
  switch (iconName) {
    case "CheckSquare": return <CheckSquare className={className} />;
    case "ShieldAlert": return <ShieldAlert className={className} />;
    case "Search": return <Search className={className} />;
    case "Network": return <Network className={className} />;
    case "TrendingUp": return <TrendingUp className={className} />;
    case "Database": return <Database className={className} />;
    case "Code": return <CodeIcon className={className} />;
    case "Atom": return <Atom className={className} />;
    case "Dices": return <Dices className={className} />;
    case "Compass": return <Compass className={className} />;
    case "Activity": return <Activity className={className} />;
    case "BookOpen": return <BookOpen className={className} />;
    case "MessageSquare":
    default:
      return <MessageSquare className={className} />;
  }
};

const DEFAULT_MEMORIES = [
  { id: "mem-1", title: "Як мені дістатись...", query: "Як мені дістатись до найближчого шелтеру чи гуманітарного центру у моєму місті?" },
  { id: "mem-2", title: "Привіт створи бу...", query: "Привіт, створи буклети та план соціальної підтримки для внутрішньо переміщених осіб" },
  { id: "mem-3", title: "Соціальна Мапа Турботи", query: "Розкажи про актуальний стан та осередки Соціальної Мапи Турботи (6200+ осередків)" },
  { id: "mem-4", title: "Кібераудит Луцика", query: "@security Проведи аналіз цифрової безпеки та стійкості сервісів" }
];

export default function App() {
  const [view, setView] = useState<"home" | "chat" | "live" | "journal">("home");
  const [messages, setMessages] = useState<{ role: "user" | "model"; content: string; agentTag?: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  
  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Selected Sub-Agent from Orchestrator Registry
  const [selectedAgent, setSelectedAgent] = useState<AgentDescriptor | null>(null);
  const [showAgentDrawer, setShowAgentDrawer] = useState(false);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDeepResearchOpen, setIsDeepResearchOpen] = useState(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [isVideoStudioOpen, setIsVideoStudioOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [showOmniTools, setShowOmniTools] = useState(false);

  // Settings
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [creatorForce, setCreatorForce] = useState<boolean | null>(null);
  const [avatarEmotion, setAvatarEmotion] = useState<AvatarEmotion>("neutral");

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (view === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, view]);

  const isCreator = creatorForce !== null 
    ? creatorForce 
    : (user?.email === "illia.smileafterburn@gmail.com" || user?.email === "vladimirivich.illya@gmail.com" || user?.displayName?.includes("Ілля"));

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (view === "journal") setView("home");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const {
    isListening: isSTTListening,
    toggleListening: toggleSTT,
    isSupported: isSTTSupported
  } = useGeminiSpeechRecognition((text) => {
    setInput(text);
  });

  const detectEmotionFromText = (text: string): AvatarEmotion => {
    const lowercase = text.toLowerCase();
    
    // Empathetic
    const empathyKeywords = ["розумію", "співчуваю", "підтримк", "турбот", "обійм", "поруч", "все буде добре", "не хвилюй", "спокій", "тепло", "любов", "серце", "доля"];
    if (empathyKeywords.some(keyword => lowercase.includes(keyword))) {
      return "empathetic";
    }

    // Happy / Warmth
    const happyKeywords = ["чудов", "ура", "супер", "клас", "радий", "радію", "успіх", "віта", "посміх", "щаст", "прекрасн", "гарно", "натхненн", "світло"];
    if (happyKeywords.some(keyword => lowercase.includes(keyword))) {
      return "happy";
    }

    // Excited / Breakthrough
    const excitedKeywords = ["чудово!", "неймовірно", "вау", "дивовижно", "захоплен", "прорив", "перемога", "витвір", "геніальн", "активовано"];
    if (excitedKeywords.some(keyword => lowercase.includes(keyword))) {
      return "excited";
    }

    // Thoughtful / Philosophical
    const thoughtfulKeywords = ["аналіз", "план", "статт", "кодекс", "закон", "структур", "розглян", "оцін", "юридич", "історі", "пам'ят", "спогад", "мапа", "думк", "мислен", "сковород", "суверенітет", "стратегі", "оркестратор"];
    if (thoughtfulKeywords.some(keyword => lowercase.includes(keyword))) {
      return "thoughtful";
    }

    return "neutral";
  };

  const { 
    isConnected, 
    isConnecting, 
    error: liveError, 
    transcript,
    activeAgent: liveActiveAgent,
    canvasContent,
    sendToolResponse,
    startConversation, 
    stopConversation 
  } = useLiveConversation();

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        const emotions: AvatarEmotion[] = ['happy', 'thoughtful', 'empathetic'];
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        setAvatarEmotion(randomEmotion);
      }, 6000);
      return () => clearInterval(interval);
    } else {
      setAvatarEmotion('neutral');
    }
  }, [isConnected]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : input;
    if (!text.trim()) return;
    
    setInput("");
    setShowOmniTools(false);
    setView("chat");

    const detectedAgent = detectAgentFromMessage(text);
    const activeAgent = detectedAgent || selectedAgent;

    setMessages(prev => [...prev, { 
      role: "user", 
      content: text,
      agentTag: activeAgent?.tag 
    }]);
    setIsLoading(true);
    
    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      
      const customInstruction = isCreator ? CREATOR_INSTRUCTION : STANDARD_INSTRUCTION;
      const response = await chat(text, history, customInstruction, activeAgent);
      if (response) {
        setMessages(prev => [...prev, { 
          role: "model", 
          content: response,
          agentTag: activeAgent?.tag 
        }]);
        setAvatarEmotion(detectEmotionFromText(response));
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewChat = () => {
    setMessages([]);
    setSelectedAgent(null);
    setInput("");
    setView("home");
    setIsMobileSidebarOpen(false);
  };

  const toggleLive = (useScreenShare = false) => {
    if (isConnected) {
      stopConversation();
      setView("home");
    } else {
      setView("live");
      const customInstruction = isCreator ? CREATOR_INSTRUCTION : STANDARD_INSTRUCTION;
      startConversation(customInstruction, useScreenShare);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFE] flex text-slate-900 font-sans antialiased overflow-x-hidden selection:bg-red-500/20 selection:text-red-900">
      
      {/* Top Ukrainian Gradient Accent Filament Line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-600 via-amber-500 to-sky-500 z-50 opacity-90" />

      {/* =========================================================================
          LEFT SIDEBAR (Matched to Application Design in uploaded mockup)
         ========================================================================= */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-50/90 md:bg-[#FAFBFD] border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 backdrop-blur-xl md:backdrop-blur-none select-none",
        isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        {/* Top Header Logo */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <PaniDumkaLogo 
            onClick={() => {
              setView("home");
              setIsMobileSidebarOpen(false);
            }} 
          />
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-hide">
          {/* Action Menu */}
          <div className="space-y-1">
            <button
              onClick={handleStartNewChat}
              className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-slate-200/60 transition-colors flex items-center gap-3 group cursor-pointer"
            >
              <SquarePen className="w-4 h-4 text-slate-500 group-hover:text-red-600 transition-colors" />
              <span>Новий чат</span>
            </button>

            <button
              onClick={() => {
                setIsImageStudioOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-slate-200/60 transition-colors flex items-center gap-3 group cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-slate-500 group-hover:text-sky-600 transition-colors" />
              <span>Зображення</span>
            </button>

            <button
              onClick={() => {
                setIsVideoStudioOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-slate-200/60 transition-colors flex items-center gap-3 group cursor-pointer"
            >
              <VideoIcon className="w-4 h-4 text-slate-500 group-hover:text-purple-600 transition-colors" />
              <span>Відео</span>
            </button>

            {/* Deep Research (Highlighted pill as in reference design) */}
            <button
              onClick={() => {
                setIsDeepResearchOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-900 bg-slate-200/70 hover:bg-slate-200 transition-colors flex items-center gap-3 group cursor-pointer shadow-2xs"
            >
              <Compass className="w-4 h-4 text-red-600 group-hover:rotate-45 transition-transform" />
              <div className="flex items-center justify-between flex-1">
                <span>Глибоке дослідження</span>
                <Sparkles className="w-3 h-3 text-red-500" />
              </div>
            </button>

            <button
              onClick={() => {
                setIsWorkspaceOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-slate-200/60 transition-colors flex items-center gap-3 group cursor-pointer"
            >
              <Globe className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
              <span>Google Workspace</span>
            </button>
          </div>

          {/* Memories / History (Спогади) */}
          <div className="space-y-2 pt-2 border-t border-slate-200/60">
            <span className="px-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
              Спогади:
            </span>
            <div className="space-y-0.5">
              {DEFAULT_MEMORIES.map((mem) => (
                <button
                  key={mem.id}
                  onClick={() => {
                    handleSendMessage(mem.query);
                    setIsMobileSidebarOpen(false);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl text-left text-xs text-slate-700 hover:bg-slate-200/50 hover:text-red-700 transition-all truncate block cursor-pointer"
                  title={mem.query}
                >
                  {mem.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Sidebar: Settings, Help & Tailored Answers Note */}
        <div className="p-3 border-t border-slate-200/70 space-y-2 bg-slate-50/50">
          <div className="space-y-0.5">
            <button
              onClick={() => {
                setIsSettingsOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-slate-200/60 transition-colors flex items-center gap-2.5 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Налаштування</span>
            </button>

            <button
              onClick={() => {
                setIsHelpOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-slate-200/60 transition-colors flex items-center gap-2.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>Довідка</span>
            </button>
          </div>

          {/* Adaptive Answers Guidance Box (Matched with design) */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-900 block leading-tight">
                Отримуйте відповіді, адаптовані для вас
              </span>
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                Увійдіть, щоб отримувати відповіді на основі збережених чатів, а також створювати зображення й передавати файли.
              </p>
            </div>

            {user ? (
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-[11px] font-medium text-slate-700 truncate max-w-[120px]">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  title="Вийти"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <User className="w-3 h-3" />
                <span>Увійти через Google</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* =========================================================================
          MAIN APPLICATION WORKSPACE
         ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-gradient-to-b from-[#FAFBFD] via-[#F8FAFC] to-[#F1F5F9]">
        
        {/* Top Header / App Bar */}
        <header className="h-14 border-b border-slate-200/70 px-4 sm:px-6 flex items-center justify-between bg-white/70 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Active View / Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2">
              <span 
                onClick={() => setView("home")}
                className="font-serif font-bold text-sm text-slate-800 cursor-pointer hover:text-red-600 transition-colors"
              >
                Пані Думка
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                {view === "home" ? "Головний простір" : view === "chat" ? "Інтелектуальний діалог" : view === "live" ? "Живий голос" : "Літопис"}
              </span>
            </div>
          </div>

          {/* Right Header Badges & Agent Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 13 Agents Orchestrator Selector Toggle */}
            <button
              type="button"
              onClick={() => setShowAgentDrawer(!showAgentDrawer)}
              className={cn(
                "px-3 py-1.5 rounded-full border text-[11px] font-mono tracking-wider font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer",
                selectedAgent 
                  ? "bg-amber-50 border-amber-300 text-amber-900" 
                  : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700"
              )}
            >
              <Layers className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">{selectedAgent ? selectedAgent.name : "13 Агентів (Auto)"}</span>
              <span className="sm:hidden">{selectedAgent ? selectedAgent.tag : "Агенти"}</span>
            </button>

            {/* Cognitive Sync with Creator / Biometrics Button */}
            <button 
              type="button"
              onClick={() => setIsScanModalOpen(true)}
              className={cn(
                "relative px-3 py-1.5 rounded-full border text-[11px] font-mono tracking-wider font-semibold transition-all duration-300 flex items-center gap-2 shadow-2xs group cursor-pointer",
                isCreator 
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold hover:bg-emerald-100/80" 
                  : "bg-red-50/70 border-red-200 text-red-700 hover:bg-red-100/70"
              )}
              title={isCreator ? "Когнітивну синхронізацію з творцем підтверджено" : "Запустити верифікацію зв'язку"}
            >
              <span className="relative flex h-2 w-2">
                <span className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  isCreator ? "bg-emerald-500" : "bg-red-500"
                )} />
                <span className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  isCreator ? "bg-emerald-600" : "bg-red-600"
                )} />
              </span>
              <span className="hidden sm:inline">{isCreator ? "ТВОРЕЦЬ: СИНХРОН" : "СИНХРОНІЗАЦІЯ"}</span>
            </button>
          </div>
        </header>

        {/* Agents Registry Drawer / Selector Bar */}
        <AnimatePresence>
          {showAgentDrawer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full bg-white/95 border-b border-slate-200/90 py-3.5 px-6 z-30 overflow-hidden shadow-sm"
            >
              <div className="max-w-7xl mx-auto space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Bot className="w-4 h-4 text-red-600" />
                    Оркестрація 13 Спеціалізованих Агентів
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedAgent && (
                      <button
                        onClick={() => setSelectedAgent(null)}
                        className="text-xs text-red-600 hover:underline font-mono"
                      >
                        Скинути до авто-вибору
                      </button>
                    )}
                    <button
                      onClick={() => setShowAgentDrawer(false)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {AGENT_REGISTRY.map((agent) => {
                    const isSelected = selectedAgent?.id === agent.id;
                    return (
                      <button
                        key={agent.id}
                        onClick={() => {
                          setSelectedAgent(isSelected ? null : agent);
                          setShowAgentDrawer(false);
                        }}
                        className={cn(
                          "p-2 rounded-xl border text-left flex flex-col gap-1 transition-all group cursor-pointer",
                          isSelected 
                            ? "bg-red-50 border-red-400 shadow-2xs ring-1 ring-red-400" 
                            : "bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "p-1 rounded-lg",
                            isSelected ? "bg-red-600 text-white" : "bg-slate-200/70 text-slate-600 group-hover:text-red-600"
                          )}>
                            {getAgentIcon(agent.icon, "w-3 h-3")}
                          </span>
                          <span className="text-[9px] font-mono font-bold text-slate-400">
                            {agent.tag}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                          {agent.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Center Stage Content */}
        <main className="flex-1 overflow-y-auto relative flex flex-col items-center justify-between px-4 sm:px-8 py-6">
          <AnimatePresence mode="wait">
            
            {/* =================================================================
                HOME VIEW (Exactly formatted to the layout in the uploaded image)
               ================================================================= */}
            {view === "home" && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl my-auto space-y-6 sm:space-y-8"
              >
                {/* Upper Central Living Avatar with Warm Halo Ring */}
                <div className="relative group z-10">
                  <LiveAvatar 
                    state="idle"
                    emotion={avatarEmotion}
                    size="xl"
                    agentName={selectedAgent ? selectedAgent.name : "Пані Думка"}
                  />
                </div>

                {/* Ukrainian Traditional Cross-Stitch Embroidery Ribbon */}
                <UkrainianOrnament variant="divider" className="max-w-md my-0 opacity-80" />

                {/* Ethno-Digital Intellectual Persona Guidance Headings */}
                <div className="text-center space-y-2 max-w-xl mx-auto px-4">
                  <h1 className="text-slate-950 font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                    Шляхетний Розум та Жива Традиція
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                    Ласкаво просимо до простору стратегічної думки, емпатії та соціальної дії. Оберіть зручний формат спілкування:
                  </p>
                </div>

                {/* Lower Status Greeting & Wide Floating Omnibar Input */}
                <div className="w-full max-w-2xl space-y-3 px-2 pt-2">
                  <div className="text-center font-sans font-medium text-slate-800 text-base sm:text-lg">
                    Завжди до ваших послуг.
                  </div>

                  {/* Wide Floating Omnibar Pill */}
                  <div className="relative w-full glass-card glass-card-breathing rounded-full border border-slate-300/80 bg-white shadow-lg p-1.5 flex items-center transition-all focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20">
                    
                    {/* Plus / Quick Tools Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowOmniTools(!showOmniTools)}
                        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                        title="Додаткові інструменти та агенти"
                      >
                        <Plus className={cn("w-4 h-4 transition-transform duration-200", showOmniTools && "rotate-45")} />
                      </button>

                      {/* Quick Action Popover Menu */}
                      <AnimatePresence>
                        {showOmniTools && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute bottom-12 left-0 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 space-y-1"
                          >
                            <button
                              onClick={() => {
                                setIsDeepResearchOpen(true);
                                setShowOmniTools(false);
                              }}
                              className="w-full p-2 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-red-50 hover:text-red-700 flex items-center gap-2.5"
                            >
                              <Compass className="w-4 h-4 text-red-600" />
                              <span>Глибоке дослідження</span>
                            </button>
                            <button
                              onClick={() => {
                                setIsImageStudioOpen(true);
                                setShowOmniTools(false);
                              }}
                              className="w-full p-2 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5"
                            >
                              <ImageIcon className="w-4 h-4 text-sky-600" />
                              <span>Генератор образів</span>
                            </button>
                            <button
                              onClick={() => {
                                setIsVideoStudioOpen(true);
                                setShowOmniTools(false);
                              }}
                              className="w-full p-2 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2.5"
                            >
                              <VideoIcon className="w-4 h-4 text-purple-600" />
                              <span>Студія відео</span>
                            </button>
                            <button
                              onClick={() => {
                                setIsWorkspaceOpen(true);
                                setShowOmniTools(false);
                              }}
                              className="w-full p-2 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5"
                            >
                              <Globe className="w-4 h-4 text-blue-600" />
                              <span>Google Workspace</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Central Omnibar Text Input */}
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder={
                        isSTTListening
                          ? "Слухаю ваше слово..."
                          : selectedAgent
                            ? `Запит до ${selectedAgent.name}...`
                            : "Запитайте Пані Думку про будь-що..."
                      }
                      className="flex-1 bg-transparent px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />

                    {/* Right Omnibar Actions: Mic (STT) + Live Audio Waveform Button */}
                    <div className="flex items-center gap-1.5 pr-1">
                      {isSTTSupported && (
                        <button
                          type="button"
                          onClick={toggleSTT}
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer",
                            isSTTListening 
                              ? "bg-red-600 text-white animate-pulse" 
                              : "text-slate-600 hover:bg-slate-100"
                          )}
                          title="Диктувати голосом"
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      )}

                      {/* Screen Share Button */}
                      <button
                        type="button"
                        onClick={() => toggleLive(true)}
                        className="h-9 px-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer group"
                        title="Живий діалог з показом екрану (для VisionAgent)"
                      >
                        <VideoIcon className="w-4 h-4 text-white" />
                        <span className="text-xs font-semibold hidden sm:inline">Екран</span>
                      </button>

                      {/* Live Call Voice Waveform Button (Matched with reference) */}
                      <button
                        type="button"
                        onClick={() => toggleLive(false)}
                        className="h-9 px-3.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer group"
                        title="Розпочати живий голосовий діалог"
                      >
                        <div className="flex items-center gap-0.5 h-3">
                          <span className="w-0.5 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-0.5 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-0.5 h-2.5 bg-white rounded-full animate-bounce" />
                        </div>
                        <span className="text-xs font-semibold hidden sm:inline">Живий голос</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Harmonic Organic Breathing Glass Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-4">
                  <QuickActionCard 
                    delayIndex={0}
                    icon={<MapIcon className="w-4 h-4 text-red-600" />} 
                    title="Мапа Турботи" 
                    subtitle="6200+ осередків допомоги"
                    onClick={() => {
                      handleSendMessage("Розкажи детально про поточний стан і ключові осередки Соціальної Мапи Турботи");
                    }}
                  />
                  <QuickActionCard 
                    delayIndex={1}
                    icon={<ShieldAlert className="w-4 h-4 text-blue-600" />} 
                    title="Аудит Луцика" 
                    subtitle="Security & OSINT захист"
                    onClick={() => {
                      const sec = AGENT_REGISTRY.find(a => a.id === "security");
                      if (sec) setSelectedAgent(sec);
                      handleSendMessage("@security Проведи аудит цифрової безпеки та захисту даних");
                    }}
                  />
                  <QuickActionCard 
                    delayIndex={2}
                    icon={<Brain className="w-4 h-4 text-amber-600" />} 
                    title="Літопис думок" 
                    subtitle="Стратегічні хроніки"
                    onClick={() => {
                      if (user) {
                        setView("journal");
                      } else {
                        handleLogin().then(() => {
                          if (auth.currentUser) setView("journal");
                        });
                      }
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* =================================================================
                CHAT VIEW (Active dialogue stream with full formatting & history)
               ================================================================= */}
            {view === "chat" && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full max-w-3xl h-full flex flex-col my-auto glass-card rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl bg-white/95"
              >
                {/* Chat Top Banner */}
                <div className="p-4 border-b border-slate-200/80 flex justify-between items-center bg-white/95">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-red-500/30">
                      <img 
                        src={avatarImg} 
                        className="w-full h-full object-cover" 
                        alt="Пані Думка" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-slate-900">Пані Думка</span>
                        {selectedAgent && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                            {selectedAgent.name}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block font-mono uppercase tracking-wider">
                        {avatarEmotion === 'happy' ? 'Привітна' : avatarEmotion === 'thoughtful' ? 'Глибоке мислення' : avatarEmotion === 'empathetic' ? 'Емпатичний резонанс' : avatarEmotion === 'excited' ? 'Когнітивне злиття' : 'Врівноважена'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleStartNewChat}
                      className="px-3 py-1.5 text-xs font-medium rounded-full border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <SquarePen className="w-3.5 h-3.5 text-slate-600" />
                      <span>Новий чат</span>
                    </button>
                    <button 
                      onClick={() => setView("home")}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-slate-50/40">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
                      <UkrainianOrnament variant="rosette" className="w-10 h-10" />
                      <p className="font-serif italic text-slate-600 max-w-sm">
                        {isCreator 
                          ? "Я готова до щирої та глибокої розмови, Ілля. Можемо задіяти будь-якого з 13 агентів (@code, @security, @osint, @stan тощо). Про що поміркуємо?" 
                          : "Вітаю вас. Я уважно вислухаю ваше запитання та допоможу знайти вірний орієнтир."}
                      </p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: msg.role === "user" ? 16 : -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex flex-col max-w-[88%]",
                        msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed shadow-2xs",
                        msg.role === "user" 
                          ? "bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-tr-none" 
                          : "bg-white border border-slate-200/90 text-slate-800 rounded-tl-none"
                      )}>
                        <div className={cn("markdown-body max-w-none", msg.role === "user" ? "text-white" : "text-slate-800")}>
                          <ReactMarkdown>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 px-1">
                        {msg.agentTag && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-200/70 text-slate-600 rounded">
                            {msg.agentTag}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                          {msg.role === "user" ? (isCreator ? "Ілля" : "Ви") : "Пані Думка"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-slate-500 italic text-sm">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span>{selectedAgent ? `${selectedAgent.name} синтезує дані...` : "Пані Думка формує виважену відповідь..."}</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input Bar */}
                <div className="p-4 bg-white border-t border-slate-200/80">
                  <div className="relative flex items-center">
                    <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder={
                        isSTTListening 
                          ? "Слухаю ваше слово..." 
                          : selectedAgent 
                            ? `Запит до ${selectedAgent.name}...` 
                            : "Напишіть вашу думку (@code, @security, @osint, @stan)..."
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-full py-3.5 pl-6 pr-24 focus:outline-none focus:border-red-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 text-sm"
                    />
                    <div className="absolute right-2 flex items-center gap-2">
                      {isSTTSupported && (
                        <button 
                          onClick={toggleSTT}
                          className={cn(
                            "p-2 rounded-full transition-all duration-300 cursor-pointer",
                            isSTTListening 
                              ? "bg-red-600 text-white animate-pulse shadow-md scale-105" 
                              : "bg-slate-200/70 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                          )}
                          title="Диктувати голосом"
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleSendMessage()}
                        disabled={!input.trim() || isLoading}
                        className="p-2.5 bg-red-600 rounded-full hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 transition-all text-white shadow-xs cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* =================================================================
                LIVE VOICE VIEW (Direct acoustic streaming with Pani Dumka)
               ================================================================= */}
            {view === "live" && (
              <motion.div 
                key="live"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-8 w-full max-w-lg my-auto relative"
              >
                {isConnected && (
                  <div className="absolute -top-6 right-0 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-2 z-20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Кінетичний зір
                  </div>
                )}
                <LiveAvatar 
                  state={isConnected ? 'speaking' : isConnecting ? 'listening' : 'idle'} 
                  emotion={avatarEmotion} 
                  size="xl"
                  agentName={selectedAgent ? selectedAgent.name : "Пані Думка"}
                />

                <div className="text-center space-y-6 w-full">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-serif font-medium text-slate-900">
                      {isConnecting ? "Синхронізація сенсорів..." : "Жива присутність"}
                    </h2>
                    <p className="text-slate-500 italic text-sm">
                      {isConnected ? "Я вас бачу і чую. Говоріть природно." : "Чекаємо на встановлення потоку..."}
                    </p>
                  </div>

                  {isConnected && transcript && (
                    <div className="w-full bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4 shadow-sm h-32 overflow-y-auto flex flex-col justify-end text-left">
                      <p className="text-sm text-slate-700 italic font-serif">
                        {transcript}
                      </p>
                    </div>
                  )}

                  {liveActiveAgent && (
                    <div className="w-full bg-slate-50/80 border border-slate-200/60 rounded-2xl p-4 flex flex-col gap-3 text-left animate-in fade-in slide-in-from-bottom-2 shadow-sm">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Оркестрація</div>
                      
                      <div className="flex items-center gap-2">
                        {/* Root Node */}
                        <div className="flex flex-col items-center gap-1">
                           <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center border border-red-200">
                              <Bot className="w-4 h-4 text-red-600" />
                           </div>
                           <span className="text-[9px] font-bold text-slate-500">Оркестратор</span>
                        </div>
                        
                        {/* Edge */}
                        <div className="flex-1 h-px bg-slate-200 relative flex items-center justify-center">
                           <div className="absolute flex gap-1">
                             <span className="w-1 h-1 rounded-full bg-red-400 animate-ping [animation-delay:-0.3s]" />
                             <span className="w-1 h-1 rounded-full bg-red-400 animate-ping [animation-delay:-0.15s]" />
                             <span className="w-1 h-1 rounded-full bg-red-400 animate-ping" />
                           </div>
                        </div>

                        {/* Agent Node */}
                        <div className="flex flex-col items-center gap-1">
                           <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200 ring-2 ring-amber-400 ring-offset-2 animate-pulse">
                              <Network className="w-4 h-4 text-amber-600" />
                           </div>
                           <span className="text-[9px] font-bold text-amber-700">{liveActiveAgent.name}</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-2 border border-slate-100 text-xs text-slate-600 italic">
                         <span className="font-semibold text-slate-700 not-italic mr-1">Завдання:</span>
                         {liveActiveAgent.task}
                      </div>
                    </div>
                  )}

                  {isConnected && (
                    <CollaborativeCanvas externalContent={canvasContent} />
                  )}

                  {liveError && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-full text-sm">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span>{liveError}</span>
                      </div>
                      <button 
                        onClick={() => startConversation(isCreator ? CREATOR_INSTRUCTION : STANDARD_INSTRUCTION)}
                        className="text-xs uppercase tracking-widest text-red-600 font-bold hover:text-red-700 transition-colors"
                      >
                        Спробувати знову
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => toggleLive()}
                    className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/25 hover:bg-red-700 transition-all active:scale-95 mx-auto cursor-pointer"
                    title="Завершити розмову"
                  >
                    <PhoneOff className="w-6 h-6 text-white" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* =================================================================
                JOURNAL / CHRONICLES VIEW
               ================================================================= */}
            {view === "journal" && (
              <div className="w-full max-w-3xl relative my-auto">
                <button 
                  onClick={() => setView("home")}
                  className="absolute -top-12 right-0 p-2 hover:bg-white text-slate-600 rounded-full transition-colors z-10 border border-slate-200 bg-white/80 shadow-xs cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <JournalView />
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* =========================================================================
          MODALS & TOOLS SYSTEM
         ========================================================================= */}
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isCreator={isCreator}
        onToggleCreator={(val) => {
          setCreatorForce(val);
          if (val) setAvatarEmotion("excited");
        }}
        voiceSpeed={voiceSpeed}
        onVoiceSpeedChange={setVoiceSpeed}
      />

      {/* Help & Agents Guide Modal */}
      <HelpModal 
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onSelectAgent={(tag) => {
          const matched = AGENT_REGISTRY.find(a => a.tag === tag);
          if (matched) setSelectedAgent(matched);
          setView("chat");
          setInput(`${tag} `);
        }}
      />

      {/* Deep Research Engine Modal */}
      <DeepResearchModal 
        isOpen={isDeepResearchOpen}
        onClose={() => setIsDeepResearchOpen(false)}
        onSendToChat={(text) => handleSendMessage(text)}
      />

      {/* Image Creation Studio Modal */}
      <ImageStudioModal 
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
      />

      {/* Video Studio Modal */}
      <VideoStudioModal 
        isOpen={isVideoStudioOpen}
        onClose={() => setIsVideoStudioOpen(false)}
      />

      {/* Google Workspace Modal */}
      <WorkspaceModal 
        isOpen={isWorkspaceOpen}
        onClose={() => setIsWorkspaceOpen(false)}
        onSelectAction={(actionText) => handleSendMessage(actionText)}
      />

      {/* Cognitive Biometric Scanner Modal */}
      <CognitiveScannerModal 
        isOpen={isScanModalOpen} 
        onClose={() => setIsScanModalOpen(false)} 
        onSuccess={(verified) => {
          if (verified) {
            setCreatorForce(true);
            setAvatarEmotion("excited");
          }
        }}
      />
    </div>
  );
}

function QuickActionCard({ 
  icon, 
  title, 
  subtitle,
  onClick,
  delayIndex = 0
}: { 
  icon: React.ReactNode; 
  title: string; 
  subtitle?: string;
  onClick: () => void; 
  delayIndex?: number;
}) {
  return (
    <button 
      onClick={onClick}
      style={{ animationDelay: `${delayIndex * 0.6}s` }}
      className="glass-card glass-card-breathing relative overflow-hidden p-3.5 rounded-2xl flex flex-col items-start gap-2 transition-all group text-left border border-slate-200/85 bg-white/90 hover:border-red-400/70 hover:shadow-md cursor-pointer"
    >
      <div 
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br from-red-500/10 via-amber-500/5 to-transparent blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-700" 
      />

      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 group-hover:bg-red-50 group-hover:border-red-200 group-hover:scale-105 transition-all duration-300">
        {icon}
      </div>
      <div className="flex items-center justify-between w-full mt-0.5 z-10">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-900 group-hover:text-red-600 transition-colors">
            {title}
          </span>
          {subtitle && (
            <span className="text-[10px] text-slate-500 mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-red-600 transition-all" />
      </div>
    </button>
  );
}
