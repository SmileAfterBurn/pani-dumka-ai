const fs = require('fs');
let code = fs.readFileSync('src/components/WorkspaceModal.tsx', 'utf8');

// Imports
code = code.replace(
  'import { listGoogleDocs, getGoogleDocContent, GoogleDocMeta } from "../services/rag_engine/googleDocsImporter";',
  'import { listGoogleDocs, getGoogleDocContent, GoogleDocMeta } from "../services/rag_engine/googleDocsImporter";\nimport { listGoogleSheets, getGoogleSheetData, GoogleSheetMeta, SheetData } from "../services/googleSheets";'
);

// State
code = code.replace(
  'const [view, setView] = useState<\'menu\' | \'docs\'>(\'menu\');',
  'const [view, setView] = useState<\'menu\' | \'docs\' | \'sheets\' | \'sheet_view\'>(\'menu\');\n  const [sheets, setSheets] = useState<GoogleSheetMeta[]>([]);\n  const [sheetData, setSheetData] = useState<SheetData | null>(null);'
);

// Tools
const toolsRegex = /\{\n      name: "Google Sheets"[\s\S]*?\},/;
const newTools = `{
      name: "Google Sheets",
      icon: <Table className="w-5 h-5 text-emerald-600" />,
      desc: "Синтез таблиць, бази даних осередків допомоги, аналітика.",
      action: "Згенеруй схему таблиці в Google Sheets для обліку гуманітарних осередків",
      type: "action"
    },
    {
      name: "Перегляд Google Sheets",
      icon: <Table className="w-5 h-5 text-emerald-600" />,
      desc: "Завантажте таблицю з Google Sheets для перегляду в застосунку.",
      action: "import_sheets",
      type: "import_sheets"
    },`;
code = code.replace(toolsRegex, newTools);

// handleToolClick
const toolClickRegex = /if \(item\.type === 'import'\) \{/;
const newToolClick = `if (item.type === 'import') {`;
const addImportSheets = `
    } else if (item.type === 'import_sheets') {
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
`;
code = code.replace('} else {', addImportSheets + '    } else {');

// handleSelectSheet
const handleSelectSheetStr = `
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
`;
code = code.replace('return (', handleSelectSheetStr + '\n  return (');

// Header title
code = code.replace(
  '{view === \'menu\' ? \'Google Workspace\' : \'Імпорт з Google Docs\'}',
  '{view === \'menu\' ? \'Google Workspace\' : view === \'docs\' ? \'Імпорт з Google Docs\' : view === \'sheets\' ? \'Вибір таблиці Google Sheets\' : \'Перегляд таблиці\'}'
);

// Header desc
code = code.replace(
  '{view === \'menu\' ? \'Інтеграція робочих інструментів та документообігу\' : \'Оберіть документ для RAG-аналізу\'}',
  '{view === \'menu\' ? \'Інтеграція робочих інструментів та документообігу\' : view === \'docs\' ? \'Оберіть документ для RAG-аналізу\' : view === \'sheets\' ? \'Оберіть таблицю для перегляду\' : \'Дані з таблиці\'}'
);

// Body
const bodyDocsRegex = /\{\/\* Body \*\/\}([\s\S]*?)<div className="p-4 bg-slate-50\/80/;

const renderSheetsView = `
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
            
            {view === 'sheet_view' && sheetData && (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      {sheetData.values && sheetData.values[0]?.map((header, idx) => (
                        <th key={idx} className="p-3 font-semibold text-slate-700 whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {sheetData.values && sheetData.values.slice(1).map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-slate-50">
                        {sheetData.values[0]?.map((_, colIdx) => (
                          <td key={colIdx} className="p-3 text-slate-600 whitespace-nowrap">
                            {row[colIdx] || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
`;

code = code.replace('          <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center">', renderSheetsView + '          <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center">');

// Back button
code = code.replace(
  '{view === \'docs\' ? (',
  '{view === \'docs\' || view === \'sheets\' || view === \'sheet_view\' ? ('
);

code = code.replace(
  '<button\n                 onClick={() => { setView(\'menu\'); setError(null); }}\n                 className="px-4 py-2 rounded-full text-slate-600 hover:bg-slate-200 font-medium text-xs transition-colors cursor-pointer"\n               >\n                 Назад\n               </button>',
  `<button
                 onClick={() => {
                   if (view === 'sheet_view') setView('sheets');
                   else setView('menu');
                   setError(null);
                 }}
                 className="px-4 py-2 rounded-full text-slate-600 hover:bg-slate-200 font-medium text-xs transition-colors cursor-pointer"
               >
                 Назад
               </button>`
);

fs.writeFileSync('src/components/WorkspaceModal.tsx', code);
console.log('WorkspaceModal.tsx patched successfully');
