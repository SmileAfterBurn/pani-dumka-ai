import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Globe,
  FileText,
  HardDrive,
  Mail,
  Calendar,
  Table,
  ExternalLink,
  Loader2,
  FileDown,
  Folder,
  File,
  Search,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  Sparkles,
  Presentation
} from "lucide-react";
import { cachedAccessToken } from "../services/firebase";
import { listGoogleSheets, getGoogleSheetData, GoogleSheetMeta, SheetData } from "../services/googleSheets";
import {
  listDriveFiles,
  listPersonalDocuments,
  getDriveFileTextContent,
  formatFileSize,
  GoogleDriveFile
} from "../services/googleDrive";

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (text: string) => void;
}

interface FolderBreadcrumb {
  id: string;
  name: string;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  const [view, setView] = useState<'menu' | 'documents' | 'sheets' | 'sheet_view' | 'drive'>('menu');
  const [sheets, setSheets] = useState<GoogleSheetMeta[]>([]);
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [personalDocs, setPersonalDocs] = useState<GoogleDriveFile[]>([]);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [driveBreadcrumbs, setDriveBreadcrumbs] = useState<FolderBreadcrumb[]>([
    { id: 'root', name: 'Мій Диск' }
  ]);
  const [docSearch, setDocSearch] = useState('');
  const [driveSearch, setDriveSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [readingDocId, setReadingDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const tools = [
    {
      name: "Документи (Google Drive)",
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      desc: "Швидкий доступ до персональних документів, статей та звітів для аналізу.",
      action: "personal_documents",
      type: "documents",
      badge: "Персональні"
    },
    {
      name: "Google Drive (Файловий провідник)",
      icon: <HardDrive className="w-5 h-5 text-amber-600" />,
      desc: "Перегляд усіх файлів, папок та сховища Google Drive у реальному часі.",
      action: "drive_browser",
      type: "drive"
    },
    {
      name: "Перегляд Google Sheets",
      icon: <Table className="w-5 h-5 text-emerald-600" />,
      desc: "Завантажте таблицю з Google Sheets для перегляду в застосунку.",
      action: "import_sheets",
      type: "sheets"
    },
    {
      name: "Генерація Google Docs",
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      desc: "Створення та аналіз аналітичних записок, звітів та статей.",
      action: "Склади структурований документ для Google Docs щодо поточного прогресу проекту",
      type: "action"
    },
    {
      name: "Синтез Google Sheets",
      icon: <Table className="w-5 h-5 text-teal-600" />,
      desc: "Синтез таблиць, бази даних осередків допомоги, аналітика.",
      action: "Згенеруй схему таблиці в Google Sheets для обліку гуманітарних осередків",
      type: "action"
    },
    {
      name: "Gmail Дипломатія",
      icon: <Mail className="w-5 h-5 text-red-600" />,
      desc: "Підготовка дипломатичних, партнерських та офіційних листів.",
      action: "Напиши шляхетний партнерський лист для міжнародних донорів Соціальної Мапи Турботи",
      type: "action"
    },
    {
      name: "Google Calendar",
      icon: <Calendar className="w-5 h-5 text-sky-500" />,
      desc: "Планування стратегічних спринтів, зустрічей та подій.",
      action: "Склади розклад стратегічного тижня для команди",
      type: "action"
    }
  ];

  const loadDocuments = async (searchVal?: string) => {
    if (!cachedAccessToken) {
      setError("Потрібна авторизація Google Workspace. Будь ласка, увійдіть через Google.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const docs = await listPersonalDocuments(cachedAccessToken, searchVal);
      setPersonalDocs(docs);
    } catch (err: any) {
      setError(err.message || "Помилка завантаження персональних документів з Google Drive.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDriveFolder = async (folderId: string, searchVal?: string) => {
    if (!cachedAccessToken) {
      setError("Потрібна авторизація Google Workspace. Будь ласка, увійдіть через Google.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const files = await listDriveFiles(cachedAccessToken, folderId, searchVal);
      setDriveFiles(files);
    } catch (err: any) {
      setError(err.message || "Помилка завантаження файлів з Google Drive.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolClick = async (item: any) => {
    if (item.type === 'documents') {
      if (!cachedAccessToken) {
        setError("Потрібна авторизація Google Workspace. Будь ласка, увійдіть через Google.");
        return;
      }
      setView('documents');
      setDocSearch('');
      await loadDocuments();
    } else if (item.type === 'sheets') {
      if (!cachedAccessToken) {
        setError("Потрібна авторизація Google Workspace. Будь ласка, увійдіть через Google.");
        return;
      }
      setView('sheets');
      setIsLoading(true);
      setError(null);
      try {
        const fetchedSheets = await listGoogleSheets(cachedAccessToken);
        setSheets(fetchedSheets);
      } catch (err: any) {
        setError(err.message || "Помилка завантаження таблиць.");
      } finally {
        setIsLoading(false);
      }
    } else if (item.type === 'drive') {
      if (!cachedAccessToken) {
        setError("Потрібна авторизація Google Workspace. Будь ласка, увійдіть через Google.");
        return;
      }
      setView('drive');
      setDriveBreadcrumbs([{ id: 'root', name: 'Мій Диск' }]);
      setDriveSearch('');
      await loadDriveFolder('root');
    } else {
      if (onSelectAction) {
        onSelectAction(item.action);
        onClose();
      }
    }
  };

  const handleOpenFolder = async (folder: GoogleDriveFile) => {
    const nextBreadcrumbs = [...driveBreadcrumbs, { id: folder.id, name: folder.name }];
    setDriveBreadcrumbs(nextBreadcrumbs);
    setDriveSearch('');
    await loadDriveFolder(folder.id);
  };

  const handleNavigateBreadcrumb = async (idx: number) => {
    const target = driveBreadcrumbs[idx];
    const nextBreadcrumbs = driveBreadcrumbs.slice(0, idx + 1);
    setDriveBreadcrumbs(nextBreadcrumbs);
    setDriveSearch('');
    await loadDriveFolder(target.id);
  };

  const handleDriveSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentFolderId = driveBreadcrumbs[driveBreadcrumbs.length - 1]?.id || 'root';
    await loadDriveFolder(currentFolderId, driveSearch);
  };

  const handleDocSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadDocuments(docSearch);
  };

  const handleAnalyzeDocument = async (doc: GoogleDriveFile) => {
    if (!cachedAccessToken) return;
    setReadingDocId(doc.id);
    setError(null);
    try {
      const content = await getDriveFileTextContent(cachedAccessToken, doc.id, doc.mimeType);
      if (onSelectAction) {
        onSelectAction(
          `Ось зміст мого документу "${doc.name}":\n\n${content.slice(0, 12000)}\n\n` +
          `Будь ласка, проаналізуй цей документ, виділи ключові тези та запропонуй наступні кроки.`
        );
        onClose();
        setTimeout(() => setView('menu'), 500);
      }
    } catch (err: any) {
      setError(err.message || "Помилка читання змісту документа.");
    } finally {
      setReadingDocId(null);
    }
  };

  const handleSelectSheet = async (sheetId: string) => {
    if (!cachedAccessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getGoogleSheetData(cachedAccessToken, sheetId);
      setSheetData(data);
      setView('sheet_view');
    } catch (err: any) {
      setError(err.message || "Помилка завантаження даних таблиці.");
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20" />;
    }
    if (mimeType.includes('document')) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
    if (mimeType.includes('spreadsheet')) {
      return <Table className="w-5 h-5 text-emerald-500" />;
    }
    if (mimeType.includes('presentation')) {
      return <Presentation className="w-5 h-5 text-orange-500" />;
    }
    return <File className="w-5 h-5 text-slate-400" />;
  };

  const getHeaderTitle = () => {
    switch (view) {
      case 'documents':
        return 'Персональні Документи (Google Drive)';
      case 'sheets':
        return 'Вибір таблиці Google Sheets';
      case 'sheet_view':
        return 'Перегляд таблиці';
      case 'drive':
        return 'Google Drive Explorer';
      default:
        return 'Google Workspace';
    }
  };

  const getHeaderDesc = () => {
    switch (view) {
      case 'documents':
        return 'Доступ до ваших персональних документів для швидкого аналізу та роботи';
      case 'sheets':
        return 'Оберіть таблицю для перегляду даних';
      case 'sheet_view':
        return 'Дані з таблиці';
      case 'drive':
        return 'Перегляд файлів та папок вашого Google Диска';
      default:
        return 'Інтеграція робочих інструментів та документообігу';
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
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900">
                  {getHeaderTitle()}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 font-mono">
                  {getHeaderDesc()}
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

          {/* Quick Navigation Filter Bar */}
          <div className="px-6 py-2.5 bg-slate-50/60 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
            <button
              onClick={() => { setView('menu'); setError(null); }}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                view === 'menu' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              ✨ Огляд
            </button>
            <button
              id="btn-workspace-documents"
              onClick={() => {
                if (!cachedAccessToken) {
                  setError("Потрібна авторизація Google Workspace. Будь ласка, увійдіть через Google.");
                  return;
                }
                setView('documents');
                setError(null);
                loadDocuments();
              }}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                view === 'documents' ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20' : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Документи
            </button>
            <button
              onClick={() => {
                if (!cachedAccessToken) {
                  setError("Потрібна авторизація Google Workspace. Будь ласка, увійдіть через Google.");
                  return;
                }
                setView('drive');
                setError(null);
                setDriveBreadcrumbs([{ id: 'root', name: 'Мій Диск' }]);
                loadDriveFolder('root');
              }}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                view === 'drive' ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20' : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              Google Drive
            </button>
            <button
              onClick={() => {
                if (!cachedAccessToken) {
                  setError("Потрібна авторизація Google Workspace. Будь ласка, увійдіть через Google.");
                  return;
                }
                setView('sheets');
                setError(null);
                setIsLoading(true);
                listGoogleSheets(cachedAccessToken)
                  .then(setSheets)
                  .catch((e) => setError(e.message))
                  .finally(() => setIsLoading(false));
              }}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                view === 'sheets' || view === 'sheet_view' ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20' : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Таблиці
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 overflow-y-auto min-h-[340px]">
            {error && (
              <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200/60 flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600 text-xs ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Menu View */}
            {view === 'menu' && (
              <>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Пані Думка має безшовний доступ до ваших робочих матеріалів та сховища Google Workspace:
                </p>
                <div className="space-y-2.5">
                  {tools.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleToolClick(item)}
                      className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 group-hover:bg-white transition-colors">
                          {item.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                              {item.name}
                            </h4>
                            {item.badge && (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-blue-600 transition-all" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Documents View (Personal Files from Drive) */}
            {view === 'documents' && (
              <div className="space-y-3">
                <form onSubmit={handleDocSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      placeholder="Пошук у персональних документах..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors cursor-pointer"
                  >
                    Знайти
                  </button>
                </form>

                {isLoading && personalDocs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                    <p className="text-xs">Завантаження персональних документів...</p>
                  </div>
                ) : personalDocs.length > 0 ? (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {personalDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0">
                            {getFileIcon(doc.mimeType)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                              {doc.name}
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              {formatFileSize(doc.size) ? `${formatFileSize(doc.size)} • ` : ''}
                              Оновлено: {new Date(doc.modifiedTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          <button
                            onClick={() => handleAnalyzeDocument(doc)}
                            disabled={readingDocId === doc.id}
                            title="Обговорити з Пані Думкою"
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {readingDocId === doc.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            <span className="hidden sm:inline">Аналіз</span>
                          </button>

                          {doc.webViewLink && (
                            <a
                              href={doc.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Відкрити в Google Drive"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    {docSearch ? 'Документів не знайдено за запитом.' : 'Персональних документів не знайдено.'}
                  </div>
                )}
              </div>
            )}

            {/* Google Drive Full Explorer View */}
            {view === 'drive' && (
              <div className="space-y-3">
                {/* Search & Breadcrumbs */}
                <div className="flex flex-col gap-2">
                  <form onSubmit={handleDriveSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={driveSearch}
                        onChange={(e) => setDriveSearch(e.target.value)}
                        placeholder="Пошук файлів на Диску..."
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3.5 py-2 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors cursor-pointer"
                    >
                      Знайти
                    </button>
                  </form>

                  {/* Breadcrumb path */}
                  <div className="flex items-center gap-1 text-xs text-slate-600 overflow-x-auto py-1">
                    {driveBreadcrumbs.map((bc, idx) => (
                      <React.Fragment key={bc.id}>
                        {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                        <button
                          type="button"
                          onClick={() => handleNavigateBreadcrumb(idx)}
                          className={`hover:text-amber-700 font-medium whitespace-nowrap transition-colors ${
                            idx === driveBreadcrumbs.length - 1 ? 'text-amber-800 font-semibold' : 'text-slate-500'
                          }`}
                        >
                          {bc.name}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {isLoading && driveFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
                    <p className="text-xs">Завантаження Google Drive...</p>
                  </div>
                ) : driveFiles.length > 0 ? (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {driveFiles.map((file) => {
                      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                      return (
                        <div
                          key={file.id}
                          onClick={() => {
                            if (isFolder) {
                              handleOpenFolder(file);
                            } else if (file.webViewLink) {
                              window.open(file.webViewLink, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className="p-3 rounded-2xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 transition-all flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {getFileIcon(file.mimeType)}
                            <div className="min-w-0">
                              <h4 className="text-xs font-medium text-slate-900 group-hover:text-amber-800 transition-colors truncate">
                                {file.name}
                              </h4>
                              <p className="text-[10px] text-slate-500">
                                {isFolder ? 'Папка' : formatFileSize(file.size)} • Оновлено: {new Date(file.modifiedTime).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isFolder ? (
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-all" />
                            ) : (
                              file.webViewLink && (
                                <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-amber-600 transition-all" />
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    {driveSearch ? 'Файлів не знайдено за запитом.' : 'У цій папці немає файлів.'}
                  </div>
                )}
              </div>
            )}

            {/* Google Sheets List View */}
            {view === 'sheets' && (
              <div className="space-y-2">
                {isLoading && sheets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                    <p className="text-xs">Завантаження таблиць...</p>
                  </div>
                ) : (
                  sheets.length > 0 ? (
                    sheets.map((sheet) => (
                      <div
                        key={sheet.id}
                        onClick={() => handleSelectSheet(sheet.id)}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <Table className="w-5 h-5 text-emerald-500" />
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                              {sheet.name}
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              Оновлено: {new Date(sheet.modifiedTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        ) : (
                          <FileDown className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-emerald-600 transition-all" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      Не знайдено таблиць.
                    </div>
                  )
                )}
              </div>
            )}

            {/* Google Sheets Data Table View */}
            {view === 'sheet_view' && sheetData && (
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[380px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 sticky top-0">
                    <tr>
                      {sheetData.values && sheetData.values[0]?.map((header, idx) => (
                        <th key={idx} className="p-2.5 font-semibold text-slate-700 whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {sheetData.values && sheetData.values.slice(1).map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-slate-50">
                        {sheetData.values[0]?.map((_, colIdx) => (
                          <td key={colIdx} className="p-2.5 text-slate-600 whitespace-nowrap">
                            {row[colIdx] || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center">
            {view !== 'menu' ? (
              <button
                onClick={() => {
                  if (view === 'sheet_view') setView('sheets');
                  else setView('menu');
                  setError(null);
                }}
                className="px-4 py-2 rounded-full text-slate-600 hover:bg-slate-200 font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
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
