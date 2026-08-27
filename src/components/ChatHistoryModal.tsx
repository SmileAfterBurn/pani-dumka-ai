import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MessageSquare, Trash2, Clock } from "lucide-react";
import { ChatSession } from "../hooks/useChatHistory";

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (id: string) => void;
  activeSessionId: string | null;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onDeleteSession,
  activeSessionId
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-serif font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Історія бесід
            </h3>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1 bg-white">
            {sessions.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Історія порожня</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map(session => (
                  <div 
                    key={session.id}
                    className={`group flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                      activeSessionId === session.id 
                        ? 'border-indigo-200 bg-indigo-50' 
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                    onClick={() => {
                      onSelectSession(session);
                      onClose();
                    }}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className={`text-sm font-semibold truncate ${activeSessionId === session.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {session.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {session.messages.length} повідомлень • {new Date(session.updatedAt).toLocaleDateString('uk', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Видалити бесіду"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
