const { GoogleGenAI } = require("@google/genai");
async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3.7-pro",
    contents: ["hello"],
    config: { thinkingConfig: { thinkingBudget: 1024 } }
  });
  console.log(response.text);
}
run().catch(console.error);
