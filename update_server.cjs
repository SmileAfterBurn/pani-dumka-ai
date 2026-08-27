const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const routeCode = `
app.post("/api/chat", async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { message, history, customInstruction, selectedAgent, detectAgentFromMessageString } = req.body;
    
    const model = "gemini-3.1-pro-preview";
    let effectiveInstruction = customInstruction || "";

    const activeAgent = selectedAgent || (detectAgentFromMessageString ? JSON.parse(detectAgentFromMessageString) : null);
    if (activeAgent) {
      effectiveInstruction += \`\\n\\n[АКТИВНИЙ ПІД-АГЕНТ: \${activeAgent.name}]\\n\${activeAgent.promptSnippet}\`;
    }
    
    const response = await ai.models.generateContent({
      model,
      contents: [...(history || []), { role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction: effectiveInstruction,
        thinkingConfig: { thinkingLevel: 2 } // ThinkingLevel.HIGH maps to 2 in enums often, or we just import it
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
  code = code.replace('app.listen(PORT', routeCode + '\n  app.listen(PORT');
  fs.writeFileSync('server.ts', code);
}
