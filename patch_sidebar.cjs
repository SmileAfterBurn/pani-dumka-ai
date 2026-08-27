const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const historySidebarButton = `            <button
              onClick={() => {
                setIsChatHistoryOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-slate-200/60 transition-colors flex items-center gap-3 group cursor-pointer"
            >
              <Clock className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
              <span>Історія бесід</span>
            </button>\n`;

code = code.replace(
  '              <span>Новий чат</span>\n            </button>',
  '              <span>Новий чат</span>\n            </button>\n' + historySidebarButton
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx sidebar patched successfully');
