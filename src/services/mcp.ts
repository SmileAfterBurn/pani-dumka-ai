import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

let mcpClient: Client | null = null;
let mcpTransport: StdioClientTransport | null = null;

export async function getMcpClient(): Promise<Client> {
  if (mcpClient) return mcpClient;

  // Initialize the MCP Client
  mcpTransport = new StdioClientTransport({
    command: "npx",
    args: [
      "chrome-devtools-mcp",
      "--chrome-arg=--no-sandbox",
      "--chrome-arg=--disable-setuid-sandbox",
      "--chrome-arg=--headless=new"
    ]
  });

  mcpClient = new Client(
    { name: "pani-dumka", version: "1.0.0" },
    { capabilities: {} }
  );

  await mcpClient.connect(mcpTransport);
  return mcpClient;
}

export async function listMcpTools() {
  const client = await getMcpClient();
  const toolsResponse = await client.listTools();
  return toolsResponse.tools;
}

export async function callMcpTool(name: string, args: any) {
  const client = await getMcpClient();
  return await client.callTool({ name, arguments: args });
}
