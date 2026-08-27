const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regexChat = /const response = await ai\.models\.generateContent\(\{\s*model,\s*contents: \[\.\.\.\(history \|\| \[\]\), \{ role: "user", parts: \[\{ text: message \}\] \}\],\s*config: \{\s*systemInstruction: effectiveInstruction,\s*thinkingConfig: \{ thinkingLevel: ThinkingLevel\.HIGH \}\s*\},\s*\}\);/m;

const fixChat = `const response = await ai.models.generateContent({
        model,
        contents: [...(history || []), { role: "user", parts: [{ text: message }] }],
        config: {
          systemInstruction: effectiveInstruction,
          temperature: 0.7,
          ...config
        },
      });`;

code = code.replace(regexChat, fixChat);

fs.writeFileSync('server.ts', code);
console.log('fixed chat');
