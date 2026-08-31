const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const routeCode = `
  app.post("/api/generate", async (req, res) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const params = req.body;
      
      const response = await ai.models.generateContent(params);
      
      res.json({ text: response.text });
    } catch (error) {
      console.error("Generate error:", error);
      res.status(500).json({ error: error.message });
    }
  });
`;

if (!code.includes('/api/generate')) {
  code = code.replace('  app.post("/api/chat"', routeCode + '\n  app.post("/api/chat"');
  fs.writeFileSync('server.ts', code);
}
