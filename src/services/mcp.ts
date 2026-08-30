import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Multi-client registry
const mcpClients: Record<string, Client> = {};
const mcpTransports: Record<string, any> = {};

export async function getMcpClient(serverId: string = "default"): Promise<Client> {
  if (mcpClients[serverId]) {
    return mcpClients[serverId];
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  let transport: any = null;

  if (serverId === "enterprise" && geminiApiKey) {
    console.log("[MCP] Ініціалізація транспорту SSE для Gemini Enterprise Agent Platform...");
    const sseUrl = new URL("https://aiplatform.googleapis.com/mcp/sse");
    transport = new SSEClientTransport(sseUrl, {
      requestInit: {
        headers: {
          "X-Goog-Api-Key": geminiApiKey
        }
      }
    });
  } else if (serverId === "knowledge" && geminiApiKey) {
    console.log("[MCP] Ініціалізація транспорту SSE для Google Developer Knowledge...");
    const sseUrl = new URL("https://developerknowledge.googleapis.com/mcp/sse");
    transport = new SSEClientTransport(sseUrl, {
      requestInit: {
        headers: {
          "X-Goog-Api-Key": geminiApiKey
        }
      }
    });
  } else {
    console.log(`[MCP] Перехід на локальний транспорт Stdio для сервера ${serverId}...`);
    transport = new StdioClientTransport({
      command: "npx",
      args: [
        "chrome-devtools-mcp",
        "--chrome-arg=--no-sandbox",
        "--chrome-arg=--disable-setuid-sandbox",
        "--chrome-arg=--headless=new"
      ]
    });
  }

  const client = new Client(
    { name: `pani-dumka-${serverId}`, version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  mcpTransports[serverId] = transport;
  mcpClients[serverId] = client;
  return client;
}

export async function listMcpTools() {
  const servers = ["default", "knowledge", "enterprise"];
  let allTools: any[] = [];
  
  for (const serverId of servers) {
    try {
      const client = await getMcpClient(serverId);
      const toolsResponse = await client.listTools();
      
      // Inject serverId into the tool name to route it back correctly
      const mappedTools = toolsResponse.tools.map(t => ({
        ...t,
        _originalName: t.name,
        name: `${serverId}__${t.name}`,
        description: `[${serverId.toUpperCase()}] ${t.description || ""}`
      }));
      
      allTools = allTools.concat(mappedTools);
    } catch (e: any) {
      console.error(`[MCP] Помилка отримання інструментів для сервера ${serverId}:`, e.message || e);
    }
  }
  
  return allTools;
}

export async function callMcpTool(name: string, args: any) {
  // Extract serverId from the composite name
  let serverId = "default";
  let originalName = name;
  
  if (name.includes("__")) {
    const parts = name.split("__");
    serverId = parts[0];
    originalName = parts.slice(1).join("__");
  }

  console.log(`[MCP] Виклик інструменту ${originalName} на сервері ${serverId}...`);
  const client = await getMcpClient(serverId);
  return await client.callTool({ name: originalName, arguments: args });
}