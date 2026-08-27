const fs = require('fs');
let code = fs.readFileSync('src/services/gemini.ts', 'utf8');

// We want to remove the import of GoogleGenAI and the initialization of ai
code = code.replace('import { GoogleGenAI, Modality, ThinkingLevel } from "@google/genai";', 'import { Modality } from "@google/genai";');
code = code.replace(/export const ai = new GoogleGenAI\(\{ apiKey: process\.env\.GEMINI_API_KEY \}\);\n*/g, '');

// Now we replace the chat function
const newChatFunc = `
export async function chat(
  message: string, 
  history: { role: "user" | "model"; parts: { text: string }[] }[] = [], 
  customInstruction?: string,
  selectedAgent?: AgentDescriptor | null
) {
  const activeAgent = selectedAgent || detectAgentFromMessage(message);
  
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      customInstruction,
      selectedAgent: activeAgent
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch response");
  }

  const data = await response.json();
  return data.text;
}
`;

code = code.replace(/export async function chat\([\s\S]*?return response\.text;\n}/, newChatFunc.trim());

fs.writeFileSync('src/services/gemini.ts', code);
