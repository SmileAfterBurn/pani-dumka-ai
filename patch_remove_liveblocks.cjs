const fs = require('fs');

// 1. Refactor CollaborativeCanvas.tsx
const canvasContent = `
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export function CollaborativeCanvas({ externalContent }: { externalContent: string | null }) {
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
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Полотно</span>
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
`;
fs.writeFileSync('src/components/CollaborativeCanvas.tsx', canvasContent.trim());
console.log('Refactored CollaborativeCanvas');

// 2. Delete CommentsPanel & liveblocks.config
try { fs.unlinkSync('src/components/CommentsPanel.tsx'); } catch(e) {}
try { fs.unlinkSync('src/liveblocks.config.ts'); } catch(e) {}
console.log('Deleted Liveblocks files');

// 3. Remove dependencies from package.json
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
delete pkg.dependencies['@liveblocks/client'];
delete pkg.dependencies['@liveblocks/react'];
delete pkg.dependencies['@liveblocks/react-ui'];
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Removed from package.json');

// 4. Remove CSS imports & badge styles
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/@import "@liveblocks\/react-ui\/styles\.css";\n?/g, '');
css = css.replace(/div#liveblocks-badge,[\s\S]*?\[id\^="liveblocks-badge"\]\s*\{[\s\S]*?\}/g, '');
fs.writeFileSync('src/index.css', css);
console.log('Removed from index.css');

