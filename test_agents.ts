import { AGENT_REGISTRY } from "./src/services/gemini.ts";
console.log("Length:", AGENT_REGISTRY.length);
console.log("Agents:", AGENT_REGISTRY.map(a => a.id).join(", "));
