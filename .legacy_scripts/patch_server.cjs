const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /const model = "gemini-3\.6-flash";/;
const replacement = `const { userEmail } = req.body;
      const isIllia = userEmail === "illia.smileafterburn@gmail.com";
      let model = "gemini-3.6-flash";
      let config = {};
      
      if (isIllia) {
        model = "gemini-3.7-flash";
        config = { thinkingConfig: { thinkingBudget: 1024 } };
      }`;

code = code.replace(regex, replacement);

const generateContentRegex = /const response = await ai\.models\.generateContent\(\{[\s\S]*?\}\);/;

code = code.replace(generateContentRegex, `const response = await ai.models.generateContent({
        model,
        contents: [...(history || []), { role: "user", parts: [{ text: message }] }],
        config: {
          systemInstruction: effectiveInstruction,
          temperature: 0.7,
          ...config
        }
      });`);

fs.writeFileSync('server.ts', code);
console.log('patched server');
