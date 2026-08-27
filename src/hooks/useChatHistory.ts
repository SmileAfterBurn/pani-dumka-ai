import { useState, useEffect } from 'react';

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  agentTag?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Load on mount
  useEffect(() => {
    const saved = localStorage.getItem('pani_dumka_chat_history');
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveSession = (id: string, messages: ChatMessage[]) => {
    if (messages.length === 0) return;
    
    setSessions(prev => {
      const existing = prev.find(s => s.id === id);
      const title = existing?.title || messages[0]?.content?.slice(0, 40) + "..." || "Нова бесіда";
      
      const newSession: ChatSession = {
        id,
        title,
        updatedAt: Date.now(),
        messages
      };

      const updated = [newSession, ...prev.filter(s => s.id !== id)].sort((a, b) => b.updatedAt - a.updatedAt);
      localStorage.setItem('pani_dumka_chat_history', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('pani_dumka_chat_history', JSON.stringify(updated));
      return updated;
    });
  };

  return { sessions, saveSession, deleteSession };
}
