import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, UserCheck, Volume2, Shield, Sparkles, RefreshCw, Cpu } from "lucide-react";
import { UkrainianOrnament } from "./UkrainianOrnament";
import { AGENT_REGISTRY } from "../services/gemini";

import { SupportedLanguage, DICTIONARY } from "../utils/i18n";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCreator: boolean;
  onToggleCreator: (val: boolean) => void;
  voiceSpeed: number;
  onVoiceSpeedChange: (speed: number) => void;
  voiceId: string;
  onVoiceIdChange: (id: string) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isCreator,
  onToggleCreator,
  voiceSpeed,
  onVoiceSpeedChange,
  voiceId,
  onVoiceIdChange,
  language,
  onLanguageChange,
}) => {
  if (!isOpen) return null;
  const t = DICTIONARY[language];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200/60">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  {language === "uk" ? "Налаштування Пані Думка" : "Pani Dumka Settings"}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {language === "uk" ? "Конфігурація когнітивного простору" : "Cognitive Space Configuration"}
                </p>
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
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Language Selection */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold block">
                {t.languageSelect}
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onLanguageChange("uk")}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    language === "uk"
                      ? "bg-red-50/80 border-red-400 ring-2 ring-red-400/40 shadow-xs"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🇺🇦</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-900">Українська</span>
                      <span className="text-[10px] font-mono text-red-700 font-semibold">{t.ukrainian}</span>
                    </div>
                  </div>
                  {language === "uk" && (
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onLanguageChange("en-US")}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    language === "en-US"
                      ? "bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400/40 shadow-xs"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌐</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-900">English</span>
                      <span className="text-[10px] font-mono text-indigo-700 font-semibold">{t.englishUS}</span>
                    </div>
                  </div>
                  {language === "en-US" && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {/* Cognitive Mode */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold block">
                {language === "uk" ? "Режим Когнітивного Діалогу" : "Cognitive Dialogue Mode"}
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onToggleCreator(true)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    isCreator
                      ? "bg-red-50/80 border-red-300 ring-2 ring-red-400/40"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-red-600" />
                      {t.creatorMode}
                    </span>
                    {isCreator && (
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    {t.creatorSubtitle}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleCreator(false)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    !isCreator
                      ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/40"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-blue-600" />
                      {t.generalGuideMode}
                    </span>
                    {!isCreator && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    {t.generalGuideSubtitle}
                  </p>
                </button>
              </div>
            </div>

            {/* Voice Tuning */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-slate-600" />
                  {t.voiceSpeedTitle}
                </span>
                <span className="text-xs font-mono font-bold text-red-600">{voiceSpeed}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={voiceSpeed}
                onChange={(e) => onVoiceSpeedChange(parseFloat(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>0.8x ({language === "uk" ? "Виважений" : "Measured"})</span>
                <span>1.0x ({language === "uk" ? "Природний" : "Natural"})</span>
                <span>1.3x ({language === "uk" ? "Динамічний" : "Dynamic"})</span>
              </div>
            </div>

            
            {/* Voice Selection */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-slate-400" />
                {t.voiceIdTitle}
              </span>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <select
                  value={voiceId}
                  onChange={(e) => onVoiceIdChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400 transition-all cursor-pointer"
                >
                  <option value="XsDwVNgam5laFw4WF7S6">Pani Dumka (Дарина) - Primary</option>
                  <option value="21m00Tcm4TlvDq8ikWAM">Rachel</option>
                  <option value="29vD33N1CtxCmqQRPOZB">Drew</option>
                  <option value="2EiwWnXFnvU5JabPnv8n">Clyde</option>
                  <option value="5Q0t7uMcjvnagumLfvZi">Paul</option>
                  <option value="AZnzlk1XvdvUeBnXmlld">Domi</option>
                  <option value="CYw3kZ02Hs0563khs1Fj">Dave</option>
                  <option value="EXAVITQu4vr4xnSDxMaL">Bella</option>
                  <option value="ThT5KcBeYPX3keUQqHPh">Dorothy</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-2">
                  {language === "uk" ? "Змінивши голос, вам може знадобитись перезапустити голосову сесію." : "Changing voice may require restarting your live audio session."}
                </p>
              </div>
            </div>

            {/* Model details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-600 font-medium">{t.orchestratorCore}</span>
                <span className="text-xs font-mono font-bold text-red-600">Gemini Enterprise Agent Platform (3.5 Pro)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-600 font-medium">{language === "uk" ? "Екосистема агентів" : "Agent Ecosystem"}</span>
                <span className="text-xs font-mono font-bold text-slate-800">{AGENT_REGISTRY.length} {t.activeAgentsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-600 font-medium">{language === "uk" ? "База осередків Турботи" : "Care Map Database"}</span>
                <span className="text-xs font-mono font-bold text-emerald-600">6200+ {language === "uk" ? "перевірених" : "verified"}</span>
              </div>
            </div>

            <UkrainianOrnament variant="divider" className="my-1" />
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 font-medium text-xs transition-colors cursor-pointer"
            >
              {t.saveAndClose}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
