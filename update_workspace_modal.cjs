const fs = require('fs');

const content = `import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Globe, FileText, HardDrive, Mail, Calendar, Table, ExternalLink, Loader2, FileDown } from "lucide-react";
import { cachedAccessToken } from "../services/firebase";
import { listGoogleDocs, getGoogleDocContent, GoogleDocMeta } from "../services/rag_engine/googleDocsImporter";

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
  const [view, setView] = useState<'menu' | 'docs'>('menu');
  const [docs, setDocs] = useState<GoogleDocMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const tools = [
    {
      name: "Google Docs",
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      desc: "Створення та аналіз аналітичних записок, звітів та статей.",
      action: "Склади структурований документ для Google Docs щодо поточного прогресу проекту",
      type: "action"
    },
    {
      name: "Імпорт з Google Docs (RAG)",
      icon: <FileDown className="w-5 h-5 text-indigo-600" />,
      desc: "Завантажте документ з Google Docs для аналізу та обговорення.",
      action: "import_docs",
      type: "import"
    },
    {
      name: "Google Drive",
      icon: <HardDrive className="w-5 h-5 text-amber-600" />,
      desc: "Організація файлової структури, сховище знань та архівів.",
      action: "Запропонуй структуру папок на Google Drive для проектів SmileAfterBurn",
      type: "action"
    },
    {
      name: "Google Sheets",
      icon: <Table className="w-5 h-5 text-emerald-600" />,
      desc: "Синтез таблиць, бази даних осередків допомоги, аналітика.",
      action: "Згенеруй схему таблиці в Google Sheets для обліку гуманітарних осередків",
      type: "action"
    },
    {
      name: "Gmail",
      icon: <Mail className="w-5 h-5 text-red-600" />,
      desc: "Підготовка дипломатичних, партнерських та офіційних листів.",
      action: "Напиши шляхетний партнерський лист для міжнародних донорів Соціальної Мапи Турботи",
      type: "action"
    },
    {
      name: "Google Calendar",
      icon: <Calendar className="w-5 h-5 text-blue-500" />,
      desc: "Планування стратегічних спринтів, зустрічей та подій.",
      action: "Склади розклад стратегічного тижня для команди",
      type: "action"
    }
  ];

  const handleToolClick = async (item: any) => {
    if (item.type === 'import') {
      if (!cachedAccessToken) {
        setError("Потрібна авторизація Google Workspace. Будь ласка, увійдіть через Google.");
        return;
      }
      setView('docs');
      setIsLoading(true);
      setError(null);
      try {
        const fetchedDocs = await listGoogleDocs(cachedAccessToken);
        setDocs(fetchedDocs);
      } catch (err: any) {
        setError(err.message || "Помилка завантаження документів.");
      } finally {
        setIsLoading(false);
      }
    } else {
      if (onSelectAction) {
        onSelectAction(item.action);
        onClose();
      }
    }
  };

  const handleSelectDoc = async (docId: string, docName: string) => {
    if (!cachedAccessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const content = await getGoogleDocContent(cachedAccessToken, docId);
      if (onSelectAction) {
        onSelectAction(\`Ось зміст мого документу "\${docName}":\\n\\n\${content}\\n\\nПроаналізуй його та дай короткий підсумок, після чого ми зможемо його обговорити.\`);
        onClose();
        // Reset state for next time
        setTimeout(() => setView('menu'), 500);
      }
    } catch (err: any) {
      setError(err.message || "Помилка завантаження змісту документа.");
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
          className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  {view === 'menu' ? 'Google Workspace' : 'Імпорт з Google Docs'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {view === 'menu' ? 'Інтеграція робочих інструментів та документообігу' : 'Оберіть документ для RAG-аналізу'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                setTimeout(() => setView('menu'), 500);
              }}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 overflow-y-auto min-h-[300px]">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                {error}
              </div>
            )}

            {view === 'menu' && (
              <>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Пані Думка оптимізована для швидкої генерації матеріалів, синхронізації та структурування інформації для сервісів Google Workspace:
                </p>
                <div className="space-y-2.5">
                  {tools.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleToolClick(item)}
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
              </>
            )}

            {view === 'docs' && (
              <div className="space-y-2">
                {isLoading && docs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                    <p className="text-xs">Завантаження документів...</p>
                  </div>
                ) : (
                  docs.length > 0 ? (
                    docs.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleSelectDoc(doc.id, doc.name)}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-indigo-500" />
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1">
                              {doc.name}
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              Оновлено: {new Date(doc.modifiedTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {isLoading ? (
                           <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        ) : (
                           <FileDown className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-indigo-600 transition-all" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      Не знайдено документів.
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center">
            {view === 'docs' ? (
               <button
                 onClick={() => { setView('menu'); setError(null); }}
                 className="px-4 py-2 rounded-full text-slate-600 hover:bg-slate-200 font-medium text-xs transition-colors cursor-pointer"
               >
                 Назад
               </button>
            ) : (
               <div />
            )}
            <button
              onClick={() => {
                onClose();
                setTimeout(() => setView('menu'), 500);
              }}
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
`;

fs.writeFileSync('src/components/WorkspaceModal.tsx', content);
