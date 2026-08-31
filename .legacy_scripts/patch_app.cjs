const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add imports
code = code.replace(
  'import { SettingsModal } from "./components/SettingsModal";',
  'import { SettingsModal } from "./components/SettingsModal";\nimport { ChatHistoryModal } from "./components/ChatHistoryModal";\nimport { useChatHistory } from "./hooks/useChatHistory";\nimport { Clock } from "lucide-react";'
);

// 2. Add state inside App component
code = code.replace(
  'const [isSettingsOpen, setIsSettingsOpen] = useState(false);',
  'const [isSettingsOpen, setIsSettingsOpen] = useState(false);\n  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);\n  const { sessions, saveSession, deleteSession } = useChatHistory();\n  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);'
);

// 3. Update the handleSend or effect to save sessions automatically when messages change
code = code.replace(
  'useEffect(() => {',
  'useEffect(() => {\n    if (messages.length > 0) {\n      if (!activeSessionId) {\n        const newId = "session-" + Date.now();\n        setActiveSessionId(newId);\n        saveSession(newId, messages);\n      } else {\n        saveSession(activeSessionId, messages);\n      }\n    }\n  }, [messages, activeSessionId]);\n\n  useEffect(() => {'
);

// 4. Update clear chat to reset activeSessionId
code = code.replace(
  'setMessages([]);',
  'setMessages([]);\n    setActiveSessionId(null);'
);

// 5. Add History button in Chat View header
const chatHeaderReplacement = `<div className="flex items-center gap-2">\n                <button \n                  onClick={() => setIsChatHistoryOpen(true)}\n                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1"\n                  title="Історія бесід"\n                >\n                  <Clock className="w-5 h-5" />\n                  <span className="text-xs font-semibold hidden md:inline">Історія</span>\n                </button>\n                <button \n                  onClick={() => { setMessages([]); setActiveSessionId(null); }}`;

code = code.replace(
  /\<div className="flex items-center gap-2"\>\s*\<button \s*onClick=\{\(\) \=\> setMessages\(\[\]\)\}/m,
  chatHeaderReplacement
);

// 6. Add ChatHistoryModal component at the end near other modals
code = code.replace(
  '        <SettingsModal',
  `        <ChatHistoryModal\n          isOpen={isChatHistoryOpen}\n          onClose={() => setIsChatHistoryOpen(false)}\n          sessions={sessions}\n          activeSessionId={activeSessionId}\n          onSelectSession={(session) => {\n            setActiveSessionId(session.id);\n            setMessages(session.messages);\n          }}\n          onDeleteSession={(id) => {\n            deleteSession(id);\n            if (activeSessionId === id) {\n              setActiveSessionId(null);\n              setMessages([]);\n            }\n          }}\n        />\n        <SettingsModal`
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx patched successfully');
