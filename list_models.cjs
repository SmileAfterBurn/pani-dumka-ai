const { GoogleGenAI } = require("@google/genai");
async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.list();
  for await (const m of response) {
    if (m.name.includes('gemini')) console.log(m.name);
  }
}
run().catch(console.error);
