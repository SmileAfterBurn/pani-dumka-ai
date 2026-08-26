import React from "react";
import { Thread, Composer } from "@liveblocks/react-ui";
import { useThreads } from "../liveblocks.config";

export function CommentsPanel() {
  const { threads, isLoading } = useThreads();

  if (isLoading) {
    return <div className="text-slate-500 text-sm animate-pulse">Завантаження коментарів...</div>;
  }

  return (
    <div className="flex flex-col gap-4 mt-4 w-full bg-slate-900 rounded-2xl p-4 shadow-lg h-64">
      <div className="flex justify-between items-center mb-1 pb-2 border-b border-slate-700/50">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Коментарі та обговорення</span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {threads.map((thread) => (
          <Thread key={thread.id} thread={thread} className="bg-slate-800 rounded-xl" />
        ))}
      </div>
      
      <div className="mt-2 bg-slate-800 rounded-xl">
        <Composer className="text-slate-100" />
      </div>
    </div>
  );
}
