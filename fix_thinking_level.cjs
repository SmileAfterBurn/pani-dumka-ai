const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";',
  'import { GoogleGenAI, LiveServerMessage, Modality, Type, ThinkingLevel } from "@google/genai";'
);

code = code.replace(/thinkingConfig: \{ thinkingLevel: "HIGH" \}/g, 'thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }');

fs.writeFileSync('server.ts', code);
