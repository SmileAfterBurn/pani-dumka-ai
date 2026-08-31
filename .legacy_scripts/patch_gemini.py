import re

with open('src/services/gemini.ts', 'r') as f:
    content = f.read()

new_ai = """
import { GoogleGenAI } from "@google/genai";

export const aiClient = new GoogleGenAI({
  vertexai: true,
  project: 'pani-dumka-01',
  location: 'us-central1'
});

export const ai = {
  models: {
    generateContent: async (params: any) => {
      const payload = {
        model: 'gemini-3.5-flash',
        ...params
      };
      // We still use proxy for CORS/Auth reasons in the browser
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return await response.json();
    }
  }
};
"""

content = re.sub(
    r'export const ai = \{[\s\S]*?\n\};',
    new_ai.strip(),
    content
)

with open('src/services/gemini.ts', 'w') as f:
    f.write(content)
