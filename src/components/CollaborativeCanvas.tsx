import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { SupportedLanguage, DICTIONARY } from "../utils/i18n";

export function CollaborativeCanvas({ 
  externalContent,
  language = "uk"
}: { 
  externalContent: string | null;
  language?: SupportedLanguage;
}) {
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState("");
  const t = DICTIONARY[language];

  useEffect(() => {
    if (externalContent) {
      setContent(externalContent);
    }
  }, [externalContent]);

  useEffect(() => {
    if (!isEditing) {
      setLocalContent(content);
    }
  }, [content, isEditing]);

  return (
    <div className="w-full h-64 bg-slate-900 text-slate-100 rounded-2xl p-4 shadow-lg text-left relative overflow-hidden flex flex-col cursor-text animate-in fade-in zoom-in-95 border border-cyan-500/20">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">🌊 {t.streamTitle}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/30">
            {t.streamBadge}
          </span>
        </div>
      </div>
      
      {isEditing ? (
        <textarea
          className="flex-1 w-full bg-transparent resize-none focus:outline-none text-sm text-slate-300 font-mono"
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={() => {
            setIsEditing(false);
            setContent(localContent);
          }}
          autoFocus
        />
      ) : (
        <div 
          className="flex-1 overflow-y-auto markdown-body text-slate-100 max-w-none text-sm"
          onDoubleClick={() => setIsEditing(true)}
        >
          {content ? (
             <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
             <p className="text-slate-500 italic">{t.streamEmptyNotice}</p>
          )}
        </div>
      )}
    </div>
  );
}