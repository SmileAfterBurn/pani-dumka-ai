const fs = require('fs');
let code = fs.readFileSync('src/services/gemini.ts', 'utf8');

const dummyAi = `
export const ai = {
  models: {
    generateContent: async (params: any) => {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return await response.json();
    }
  }
};
`;

if (!code.includes('export const ai = {')) {
  // insert at top, after imports
  const lines = code.split('\n');
  let lastImport = 0;
  for (let i=0; i<lines.length; i++) {
    if (lines[i].startsWith('import ')) lastImport = i;
  }
  lines.splice(lastImport + 1, 0, dummyAi);
  fs.writeFileSync('src/services/gemini.ts', lines.join('\n'));
}
