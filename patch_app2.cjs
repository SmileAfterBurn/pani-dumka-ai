const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const historyButton = `                    <button 
                      onClick={() => setIsChatHistoryOpen(true)}
                      className="px-3 py-1.5 text-xs font-medium rounded-full border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Історія</span>
                    </button>\n`;

code = code.replace(
  '<button \n                      onClick={handleStartNewChat}',
  historyButton + '                    <button \n                      onClick={handleStartNewChat}'
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx patched successfully');
