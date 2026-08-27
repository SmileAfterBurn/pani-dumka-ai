const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const routeCode = `
  app.post("/api/chat", async (req, res) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const { message, history, customInstruction, selectedAgent } = req.body;
      
      const model = "gemini-3.1-pro-preview";
      let effectiveInstruction = customInstruction || "";

      if (selectedAgent) {
        effectiveInstruction += \`\\n\\n[АКТИВНИЙ ПІД-АГЕНТ: \${selectedAgent.name}]\\n\${selectedAgent.promptSnippet}\`;
      }
      
      const response = await ai.models.generateContent({
        model,
        contents: [...(history || []), { role: "user", parts: [{ text: message }] }],
        config: {
          systemInstruction: effectiveInstruction,
          thinkingConfig: { thinkingLevel: "HIGH" }
        },
      });
      
      res.json({ text: response.text });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message });
    }
  });
`;

if (!code.includes('/api/chat')) {
  code = code.replace('  // Vite middleware for development', routeCode + '\n  // Vite middleware for development');
  fs.writeFileSync('server.ts', code);
}
