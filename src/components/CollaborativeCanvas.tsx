import React, { useEffect, useState } from "react";
import { RoomProvider, useStorage, useMutation, useOthers, useUpdateMyPresence, hasLiveblocksKey } from "../liveblocks.config";
import { ClientSideSuspense } from "@liveblocks/react";
import ReactMarkdown from "react-markdown";

import { CommentsPanel } from "./CommentsPanel";

function LocalCanvasContent({ externalContent }: { externalContent: string | null }) {
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState("");

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
    <div className="w-full h-64 bg-slate-900 text-slate-100 rounded-2xl p-4 shadow-lg text-left relative overflow-hidden flex flex-col cursor-text animate-in fade-in zoom-in-95">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700/50">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Полотно (Локальний режим)</span>
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
             <p className="text-slate-500 italic">Полотно порожнє. Подвійний клік для редагування або попросіть агента додати дані.</p>
          )}
        </div>
      )}
    </div>
  );
}

function CanvasContent({ externalContent }: { externalContent: string | null }) {
  const content = useStorage((root) => root.content);
  const updateContent = useMutation(({ storage }, newContent: string) => {
    storage.set("content", newContent);
  }, []);

  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();

  // Sync external agent content to Liveblocks storage
  useEffect(() => {
    if (externalContent) {
      updateContent(externalContent);
    }
  }, [externalContent, updateContent]);

  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState("");

  useEffect(() => {
    if (!isEditing) {
      setLocalContent(content || "");
    }
  }, [content, isEditing]);

  const handlePointerMove = (e: React.PointerEvent) => {
    updateMyPresence({
      cursor: { x: Math.round(e.clientX), y: Math.round(e.clientY) },
    });
  };

  const handlePointerLeave = () => {
    updateMyPresence({ cursor: null });
  };

  return (
    <div 
      className="w-full h-64 bg-slate-900 text-slate-100 rounded-2xl p-4 shadow-lg text-left relative overflow-hidden flex flex-col cursor-crosshair animate-in fade-in zoom-in-95"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700/50">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Спільне полотно</span>
        <div className="flex -space-x-2">
           {others.map(({ connectionId }) => (
             <div key={connectionId} className="w-6 h-6 rounded-full bg-red-500 border-2 border-slate-900 shadow-sm z-10" title="Інший учасник" />
           ))}
        </div>
      </div>
      
      {/* Remote cursors overlay */}
      {others.map(({ connectionId, presence }) => {
        if (!presence?.cursor) return null;
        return (
          <div 
            key={connectionId} 
            className="absolute pointer-events-none transition-transform duration-75 text-red-500 z-50"
            style={{ transform: `translate(${presence.cursor.x - 32}px, ${presence.cursor.y - 32}px)` }}
          >
             <svg width="24" height="36" viewBox="0 0 24 36" fill="none" stroke="white" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
               <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" fill="currentColor"/>
             </svg>
          </div>
        )
      })}

      {isEditing ? (
        <textarea
          className="flex-1 w-full bg-transparent resize-none focus:outline-none text-sm text-slate-300 font-mono"
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={() => {
            setIsEditing(false);
            updateContent(localContent);
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
             <p className="text-slate-500 italic">Полотно порожнє. Подвійний клік для редагування або попросіть агента додати дані.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function CollaborativeCanvas({ externalContent }: { externalContent: string | null }) {
  if (!hasLiveblocksKey) {
    return <LocalCanvasContent externalContent={externalContent} />;
  }

  return (
    <RoomProvider id="pani-dumka-live-room" initialPresence={{ cursor: null }} initialStorage={{ content: "" }}>
      <ClientSideSuspense fallback={<div className="w-full h-64 bg-slate-900/50 rounded-2xl animate-pulse flex items-center justify-center text-slate-500 text-sm">Завантаження спільного простору...</div>}>
        {() => (
          <div className="flex flex-col w-full">
            <CanvasContent externalContent={externalContent} />
            <CommentsPanel />
          </div>
        )}
      </ClientSideSuspense>
    </RoomProvider>
  );
}
