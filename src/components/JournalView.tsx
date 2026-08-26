import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Send, Book, Clock } from 'lucide-react';
import { UkrainianOrnament } from './UkrainianOrnament';

export function JournalView() {
  const [entries, setEntries] = useState<any[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/journal`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEntries(entriesData);
    }, (error) => {
      console.error("Error fetching journal entries:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim() || !auth.currentUser) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/journal`), {
        uid: auth.currentUser.uid,
        content: newEntry.trim(),
        createdAt: serverTimestamp()
      });
      setNewEntry('');
    } catch (error) {
      console.error("Error adding entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      key="journal"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="w-full max-w-2xl h-[75vh] glass-card rounded-3xl overflow-hidden flex flex-col border border-slate-200/90 shadow-xl"
    >
      <div className="p-6 border-b border-slate-200/80 bg-white/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-50 border border-red-200/70 text-red-600">
              <Book className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-semibold text-slate-900">Літопис Думок</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Особистий інтелектуальний простір для концептуальних напрацювань та спостережень
              </p>
            </div>
          </div>
          <UkrainianOrnament variant="rosette" className="w-6 h-6 hidden sm:block opacity-70" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-slate-50/40">
        {entries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
            <Book className="w-10 h-10 text-slate-400" />
            <p className="font-serif italic text-slate-600">Сторінки літопису чекають на твою першу думку...</p>
          </div>
        ) : (
          entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-red-300 transition-colors"
            >
              <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-sm">
                {entry.content}
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                <Clock className="w-3 h-3 text-red-500" />
                <span>
                  {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleString('uk-UA') : 'Щойно'}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200/80">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input 
            type="text"
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder="Внеси новий запис до літопису..."
            className="w-full bg-slate-50 border border-slate-300 rounded-full py-3.5 pl-6 pr-14 focus:outline-none focus:border-red-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 text-sm"
          />
          <button 
            type="submit"
            disabled={!newEntry.trim() || isSubmitting}
            className="absolute right-2 p-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 transition-all shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
