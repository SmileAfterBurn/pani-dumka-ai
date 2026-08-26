import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Globe, FileText, HardDrive, Mail, Calendar, Table, Check, ExternalLink } from "lucide-react";

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (text: string) => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  if (!isOpen) return null;

  const tools = [
    {
      name: "Google Docs",
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      desc: "Створення та аналіз аналітичних записок, звітів та статей.",
      action: "Склади структурований документ для Google Docs щодо поточного прогресу проекту"
    },
    {
      name: "Google Drive",
      icon: <HardDrive className="w-5 h-5 text-amber-600" />,
      desc: "Організація файлової структури, сховище знань та архівів.",
      action: "Запропонуй структуру папок на Google Drive для проектів SmileAfterBurn"
    },
    {
      name: "Google Sheets",
      icon: <Table className="w-5 h-5 text-emerald-600" />,
      desc: "Синтез таблиць, бази даних осередків допомоги, аналітика.",
      action: "Згенеруй схему таблиці в Google Sheets для обліку гуманітарних осередків"
    },
    {
      name: "Gmail",
      icon: <Mail className="w-5 h-5 text-red-600" />,
      desc: "Підготовка дипломатичних, партнерських та офіційних листів.",
      action: "Напиши шляхетний партнерський лист для міжнародних донорів Соціальної Мапи Турботи"
    },
    {
      name: "Google Calendar",
      icon: <Calendar className="w-5 h-5 text-blue-500" />,
      desc: "Планування стратегічних спринтів, зустрічей та подій.",
      action: "Склади розклад стратегічного тижня для команди"
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">Google Workspace</h3>
                <p className="text-xs text-slate-500 font-mono">Інтеграція робочих інструментів та документообігу</p>
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
          <div className="p-6 space-y-4 overflow-y-auto">
            <p className="text-xs text-slate-600 leading-relaxed">
              Пані Думка оптимізована для швидкої генерації матеріалів, синхронізації та структурування інформації для сервісів Google Workspace:
            </p>

            <div className="space-y-2.5">
              {tools.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (onSelectAction) {
                      onSelectAction(item.action);
                      onClose();
                    }
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 group-hover:bg-white transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-blue-600 transition-all" />
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 font-medium text-xs transition-colors cursor-pointer"
            >
              Закрити
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
